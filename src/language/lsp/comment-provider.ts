import { AstNode, DefaultCommentProvider, isAstNodeWithComment, isJSDoc } from "langium";
import { findCommentNode } from "../utils/xsmp-utils.js";

export class XsmpCommentProvider extends DefaultCommentProvider {

    override  getComment(node: AstNode): string | undefined {
        if (isAstNodeWithComment(node) && node.$comment && isJSDoc(node.$comment)) {
            return node.$comment;
        }
        return findCommentNode(node.$cstNode)?.text;
    }
}
