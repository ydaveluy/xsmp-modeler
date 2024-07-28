import { CstUtils, LangiumDocument, MaybePromise, GrammarAST, AstNodeWithComment } from "langium";
import { MultilineCommentHoverProvider } from "langium/lsp";
import type { Hover, HoverParams } from 'vscode-languageserver';


export class XsmpHoverProvider extends MultilineCommentHoverProvider {

    override getHoverContent(document: LangiumDocument, params: HoverParams): MaybePromise<Hover | undefined> {
        const rootNode = document.parseResult?.value?.$cstNode;
        if (rootNode) {
            const offset = document.textDocument.offsetAt(params.position);

            const cstNode = CstUtils.findDeclarationNodeAtOffset(rootNode, offset, this.grammarConfig.nameRegexp);
            if (cstNode && cstNode.offset + cstNode.length > offset) {
                const targetNode = this.references.findDeclaration(cstNode);
                if (targetNode) {
                    return this.getAstNodeHoverContent(targetNode);
                }
                // add support for documentation on keywords
                if (GrammarAST.isKeyword(cstNode.grammarSource)) {
                    if (typeof (cstNode.grammarSource as AstNodeWithComment).$comment === 'string')
                        return this.getAstNodeHoverContent(cstNode.grammarSource)
                    else
                        // sometimes the comment is on the container
                        return this.getAstNodeHoverContent(cstNode.grammarSource.$container)
                }
            }
        }
        return undefined;
    }
}

