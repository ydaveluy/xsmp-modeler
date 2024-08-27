import { type AstNode, JSDocDocumentationProvider } from 'langium';
import * as ast from '../generated/ast.js';
import { getParameterDescription, getReturnParameterDescription } from '../utils/xsmp-utils.js';

export class XsmpDocumentationProvider extends JSDocDocumentationProvider {
    override getDocumentation(node: AstNode): string | undefined {
        switch (node.$type) {
            case ast.Parameter:
                return getParameterDescription(node as ast.Parameter);
            case ast.ReturnParameter:
                return getReturnParameterDescription(node as ast.ReturnParameter);
            default: return super.getDocumentation(node);
        }
    }
}