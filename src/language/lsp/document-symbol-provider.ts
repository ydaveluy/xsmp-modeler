import { LangiumDocument, AstNode } from "langium";
import { DefaultDocumentSymbolProvider } from "langium/lsp";
import { DocumentSymbol, SymbolTag } from "vscode-languageserver";
import { isNamedElement } from "../generated/ast.js";
import { XsmpUtils } from "../utils/xsmp-utils.js";
import { XsmpcatServices } from "../xsmpcat-module.js";
import { XsmpprojectServices } from "../xsmpproject-module.js";




export class XsmpDocumentSymbolProvider extends DefaultDocumentSymbolProvider {
    protected readonly xsmpUtils: XsmpUtils;

    constructor(services: XsmpcatServices|XsmpprojectServices) {
        super(services)
        this.xsmpUtils = services.XsmpUtils
    }

    protected override getSymbol(document: LangiumDocument, astNode: AstNode): DocumentSymbol[] {
        const node = astNode.$cstNode;
        const nameNode = this.nameProvider.getNameNode(astNode);
        if (nameNode && node) {
            const name = this.nameProvider.getName(astNode);

            return [{
                kind: this.nodeKindProvider.getSymbolKind(astNode),
                name: name || nameNode.text,
                range: node.range,
                selectionRange: nameNode.range,
                children: this.getChildSymbols(document, astNode),
                tags: this.getSymbolTags(astNode),
                detail: node.astNode.$type
            }];
        } else {
            return this.getChildSymbols(document, astNode) || [];
        }
    }


    protected getSymbolTags(node: AstNode): SymbolTag[] | undefined {
        if (isNamedElement(node) && this.xsmpUtils.IsDeprecated(node)) {
            return [SymbolTag.Deprecated]
        }
        return undefined
    }

}