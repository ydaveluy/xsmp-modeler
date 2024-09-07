import { type DocumentBuilder, DocumentState, type AstNode, type Cancellation, type LangiumDocument, type MaybePromise } from 'langium';
import type { DocumentSymbolProvider, NodeKindProvider } from 'langium/lsp';
import type { DocumentSymbol, DocumentSymbolParams } from 'vscode-languageserver';
import * as ast from '../generated/ast.js';
import * as XsmpUtils from '../utils/xsmp-utils.js';
import type { XsmpcatServices } from '../xsmpcat-module.js';
import type { XsmpprojectServices } from '../xsmpproject-module.js';
import type { XsmpNodeInfoProvider } from './node-info-provider.js';

export class XsmpDocumentSymbolProvider implements DocumentSymbolProvider {

    protected readonly nodeKindProvider: NodeKindProvider;
    protected readonly documentBuilder: DocumentBuilder;
    protected readonly nodeInfoProvider: XsmpNodeInfoProvider;

    constructor(services: XsmpcatServices | XsmpprojectServices) {
        this.nodeKindProvider = services.shared.lsp.NodeKindProvider;
        this.documentBuilder = services.shared.workspace.DocumentBuilder;
        this.nodeInfoProvider = services.shared.lsp.NodeInfoProvider;
    }
    getSymbols(document: LangiumDocument, _params: DocumentSymbolParams, cancelToken?: Cancellation.CancellationToken): MaybePromise<DocumentSymbol[]> {
        return this.documentBuilder.waitUntil(DocumentState.ComputedScopes, document.uri, cancelToken)
            .then(() => this.getSymbol(document, document.parseResult.value));
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

    protected getChildSymbols(document: LangiumDocument, astNode: AstNode): DocumentSymbol[] | undefined {
        if ('elements' in astNode) {
            return (astNode.elements as AstNode[]).flatMap(e => this.getSymbol(document, e));
        }
        return undefined;
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