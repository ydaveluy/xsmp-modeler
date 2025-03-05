import type { AstNode, LangiumDocument, LangiumDocuments, ReferenceDescription, URI } from 'langium';
import { AstUtils, CstUtils } from 'langium';
import { DefaultRenameProvider } from 'langium/lsp';
import type { RenameParams } from 'vscode-languageserver-protocol';
import { Location, TextEdit, type Range, type WorkspaceEdit } from 'vscode-languageserver-types';
import * as ast from '../generated/ast.js';
import type { XsmpServices } from '../xsmp-module.js';
import type { QualifiedNameProvider } from '../naming/xsmp-naming.js';

export class XsmpRenameProvider extends DefaultRenameProvider {

    protected readonly langiumDocuments: LangiumDocuments;
    protected readonly qualifiedNameProvider: QualifiedNameProvider;

    constructor(services: XsmpServices) {
        super(services);
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.qualifiedNameProvider = services.shared.references.QualifiedNameProvider;
    }

    override async rename(document: LangiumDocument, params: RenameParams): Promise<WorkspaceEdit | undefined> {
        const changes: Record<string, TextEdit[]> = {};
        const rootNode = document.parseResult.value.$cstNode;
        if (!rootNode) return undefined;
        const offset = document.textDocument.offsetAt(params.position);
        const leafNode = CstUtils.findDeclarationNodeAtOffset(rootNode, offset, this.grammarConfig.nameRegexp);
        if (!leafNode) return undefined;
        const targetNode = this.references.findDeclaration(leafNode);
        if (!targetNode) return undefined;
        const location = this.getNodeLocation(targetNode);
        if (location) {
            const change = TextEdit.replace(location.range, params.newName);
            const uri = location.uri;
            if (uri) {
                if (changes[uri]) {
                    changes[uri].push(change);
                } else {
                    changes[uri] = [change];
                }
            }
        }

        if (ast.isNamedElement(targetNode)) {
            const oldFqn = this.qualifiedNameProvider.getFullyQualifiedName(targetNode);
            const oldName = targetNode.name;
            targetNode.name = params.newName;
            const newFqn = this.qualifiedNameProvider.getFullyQualifiedName(targetNode);
            const newName = targetNode.name;
            this.processNode(targetNode, changes, oldFqn, newFqn, oldName, newName);
        }

        return { changes };
    }

    protected processNode(node: ast.NamedElement, changes: Record<string, TextEdit[]>, oldFqn: string, newFqn: string, oldName: string, newName: string) {
        this.references.findReferences(node, {}).forEach(reference => {
            const refText = this.getReferenceText(reference.sourceUri, reference.segment.range);
            if (refText?.startsWith(oldFqn + '.')) {
                const newName = newFqn + refText.slice(oldFqn.length);
                const nodeLocation = this.getRefLocation(reference);
                const nodeChange = TextEdit.replace(nodeLocation.range, newName);
                if (changes[nodeLocation.uri]) {
                    changes[nodeLocation.uri].push(nodeChange);
                } else {
                    changes[nodeLocation.uri] = [nodeChange];
                }
            }
            else if (refText === oldFqn) {
                const newName = newFqn;
                const nodeLocation = this.getRefLocation(reference);
                const nodeChange = TextEdit.replace(nodeLocation.range, newName);
                if (changes[nodeLocation.uri]) {
                    changes[nodeLocation.uri].push(nodeChange);
                } else {
                    changes[nodeLocation.uri] = [nodeChange];
                }
            }
            else if (refText === oldName) {
                const nodeLocation = this.getRefLocation(reference);
                const nodeChange = TextEdit.replace(nodeLocation.range, newName);
                if (changes[nodeLocation.uri]) {
                    changes[nodeLocation.uri].push(nodeChange);
                } else {
                    changes[nodeLocation.uri] = [nodeChange];
                }
            }
        });

        for (const nested of AstUtils.streamContents(node)) {
            if (ast.isNamedElement(nested))
                this.processNode(nested, changes, oldFqn, newFqn, oldName, newName);

        }
    }
    protected getReferenceText(uri: URI, range: Range): string | undefined {
        const langiumDoc = this.langiumDocuments.getDocument(uri);
        if (!langiumDoc) {
            return undefined;
        }
        return langiumDoc.textDocument.getText(range);
    }

    getRefLocation(ref: ReferenceDescription): Location {
        return Location.create(
            ref.sourceUri.toString(),
            ref.segment.range
        );
    }

    getNodeLocation(targetNode: AstNode): Location | undefined {
        const nameNode = this.nameProvider.getNameNode(targetNode);
        if (nameNode) {
            const doc = AstUtils.getDocument(targetNode);
            return Location.create(
                doc.uri.toString(),
                CstUtils.toDocumentSegment(nameNode).range
            );
        }
        return undefined;
    }
}