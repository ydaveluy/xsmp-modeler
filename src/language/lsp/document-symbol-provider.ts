import type { AstNode, Cancellation, LangiumDocument, MaybePromise } from 'langium';
import type { DocumentSymbolProvider, NodeKindProvider } from 'langium/lsp';
import type { DocumentSymbol, DocumentSymbolParams } from 'vscode-languageserver';
import { SymbolTag } from 'vscode-languageserver';
import * as ast from '../generated/ast.js';
import * as XsmpUtils from '../utils/xsmp-utils.js';
import type { XsmpcatServices } from '../xsmpcat-module.js';
import type { XsmpprojectServices } from '../xsmpproject-module.js';

export class XsmpDocumentSymbolProvider implements DocumentSymbolProvider {

    protected readonly nodeKindProvider: NodeKindProvider;

    constructor(services: XsmpcatServices | XsmpprojectServices) {
        this.nodeKindProvider = services.shared.lsp.NodeKindProvider;
    }
    getSymbols(document: LangiumDocument, _params: DocumentSymbolParams, _cancelToken?: Cancellation.CancellationToken): MaybePromise<DocumentSymbol[]> {
        return this.getSymbol(document, document.parseResult.value);
    }

    protected getSymbol(document: LangiumDocument, astNode: AstNode): DocumentSymbol[] {
        const node = astNode.$cstNode;

        if (node && ast.isNamedElement(astNode)) {
            const { name } = astNode;

            return [{
                kind: this.nodeKindProvider.getSymbolKind(astNode),
                name: name ?? node.text,
                range: node.range,
                selectionRange: node.range,
                children: this.getChildSymbols(document, astNode),
                tags: this.getSymbolTags(astNode),
                detail: node.astNode.$type
            }];
        }
        return this.getChildSymbols(document, astNode) || [];

    }

    protected getSymbolTags(node: ast.NamedElement): SymbolTag[] | undefined {
        if (XsmpUtils.IsDeprecated(node)) {
            return [SymbolTag.Deprecated];
        }
        return undefined;
    }

    protected getChildSymbols(document: LangiumDocument, astNode: AstNode): DocumentSymbol[] | undefined {
        if ('elements' in astNode) {
            return (astNode.elements as AstNode[]).flatMap(e => this.getSymbol(document, e));
        }
        return undefined;
    }
}