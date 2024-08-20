import type { LangiumDocument, MaybePromise } from 'langium';
import { CstUtils, GrammarAST } from 'langium';
import { MultilineCommentHoverProvider } from 'langium/lsp';
import type { Hover, HoverParams } from 'vscode-languageserver';

export class XsmpHoverProvider extends MultilineCommentHoverProvider {

    override getHoverContent(document: LangiumDocument, params: HoverParams): MaybePromise<Hover | undefined> {
        const rootNode = document.parseResult.value.$cstNode;
        if (rootNode) {
            const offset = document.textDocument.offsetAt(params.position),

                cstNode = CstUtils.findDeclarationNodeAtOffset(rootNode, offset, this.grammarConfig.nameRegexp);
            if (cstNode && cstNode.offset + cstNode.length > offset) {
                const targetNode = this.references.findDeclaration(cstNode);
                if (targetNode) {
                    return this.getAstNodeHoverContent(targetNode);
                }
                // Add support for documentation on keywords
                if (GrammarAST.isKeyword(cstNode.grammarSource)) {
                    return this.getAstNodeHoverContent(cstNode.grammarSource);
                }
            }
        }
        return undefined;
    }
}

