import { type AstNode, type Cancellation, type LangiumDocument, type MaybePromise, type WorkspaceLock } from 'langium';
import type { DocumentSymbolProvider, NodeKindProvider } from 'langium/lsp';
import type { DocumentSymbol, DocumentSymbolParams } from 'vscode-languageserver';
import * as ast from '../generated/ast.js';
import * as XsmpUtils from '../utils/xsmp-utils.js';
import type { XsmpcatServices } from '../xsmpcat-module.js';
import type { XsmpprojectServices } from '../xsmpproject-module.js';
import type { XsmpNodeInfoProvider } from './node-info-provider.js';

export class XsmpDocumentSymbolProvider implements DocumentSymbolProvider {

    protected readonly nodeKindProvider: NodeKindProvider;
    protected readonly nodeInfoProvider: XsmpNodeInfoProvider;
    protected readonly workspaceManager: WorkspaceLock;

    constructor(services: XsmpcatServices | XsmpprojectServices) {
        this.nodeKindProvider = services.shared.lsp.NodeKindProvider;
        this.nodeInfoProvider = services.shared.lsp.NodeInfoProvider;
        this.workspaceManager = services.shared.workspace.WorkspaceLock;
    }
    getSymbols(document: LangiumDocument, _params: DocumentSymbolParams, _cancelToken?: Cancellation.CancellationToken): MaybePromise<DocumentSymbol[]> {
        return this.workspaceManager.read(() => this.getSymbol(document, document.parseResult.value));
    }

    protected getSymbol(document: LangiumDocument, astNode: AstNode): DocumentSymbol[] {

        const node = astNode.$cstNode;
        const name = this.getSymbolName(astNode);
        if (node && name) {
            return [{
                kind: this.nodeKindProvider.getSymbolKind(astNode),
                name: name,
                range: node.range,
                selectionRange: node.range,
                children: this.getChildSymbols(document, astNode),
                tags: this.nodeInfoProvider.getTags(astNode),
                detail: this.nodeInfoProvider.getDetails(astNode),
            }];
        }
        return this.getChildSymbols(document, astNode) || [];

    }

    protected getChildSymbols(document: LangiumDocument, astNode: AstNode): DocumentSymbol[] {
        if ('elements' in astNode) {
            return (astNode.elements as AstNode[]).flatMap(e => this.getSymbol(document, e));
        }
        return [];
    }
    protected getSymbolName(node: AstNode): string | undefined {
        if (!ast.isNamedElement(node)) {
            return undefined;
        }
        if (node.$type === ast.Operation) {
            return `${node.name}(${(node as ast.Operation).parameter.map(XsmpUtils.getParameterSignature).join(', ')})`;
        }
        return node.name;
    }
}