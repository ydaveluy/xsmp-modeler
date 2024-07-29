import { LangiumDocument, AstNode, MaybePromise, Cancellation } from "langium";
import { DocumentSymbolProvider, NodeKindProvider } from "langium/lsp";
import { DocumentSymbol, DocumentSymbolParams, SymbolTag } from "vscode-languageserver";
import { isNamedElement, NamedElement } from "../generated/ast.js";
import { XsmpUtils } from "../utils/xsmp-utils.js";
import { XsmpcatServices } from "../xsmpcat-module.js";
import { XsmpprojectServices } from "../xsmpproject-module.js";




export class XsmpDocumentSymbolProvider implements DocumentSymbolProvider {
    protected readonly xsmpUtils: XsmpUtils;
    protected readonly nodeKindProvider: NodeKindProvider;

    constructor(services: XsmpcatServices | XsmpprojectServices) {
        this.xsmpUtils = services.XsmpUtils
        this.nodeKindProvider = services.shared.lsp.NodeKindProvider;
    }
    getSymbols(document: LangiumDocument, params: DocumentSymbolParams, cancelToken?: Cancellation.CancellationToken): MaybePromise<DocumentSymbol[]> {
        return this.getSymbol(document, document.parseResult.value);
    }


    protected getSymbol(document: LangiumDocument, astNode: AstNode): DocumentSymbol[] {
        const node = astNode.$cstNode;

        if (node && isNamedElement(astNode)) {
            const name = astNode.name;

            return [{
                kind: this.nodeKindProvider.getSymbolKind(astNode),
                name: name ?? node.text,
                range: node.range,
                selectionRange: node.range,
                children: this.getChildSymbols(document, astNode),
                tags: this.getSymbolTags(astNode),
                detail: node.astNode.$type
            }];
        } else {
            return this.getChildSymbols(document, astNode) || [];
        }
    }


    protected getSymbolTags(node: NamedElement): SymbolTag[] | undefined {
        if (this.xsmpUtils.IsDeprecated(node)) {
            return [SymbolTag.Deprecated]
        }
        return undefined
    }

    protected getChildSymbols(document: LangiumDocument, astNode: AstNode): DocumentSymbol[] | undefined {

        if ('elements' in astNode)
            return (astNode.elements as AstNode[]).flatMap(e => this.getSymbol(document, e))

        return undefined;
    }
}