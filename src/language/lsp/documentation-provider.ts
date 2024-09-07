import { type AstNode, JSDocDocumentationProvider } from 'langium';
import * as ast from '../generated/ast.js';
import { getDescription } from '../utils/xsmp-utils.js';

export class XsmpDocumentationProvider extends JSDocDocumentationProvider {
    override getDocumentation(node: AstNode): string | undefined {
        switch (node.$type) {
            case ast.Parameter: return getDescription(node as ast.Parameter);
            case ast.ReturnParameter: return getDescription(node as ast.ReturnParameter);
            default: return super.getDocumentation(node);
        }
    }
}