import type { AstNode } from 'langium';
import { WorkspaceCache } from 'langium';
import * as ast from '../generated/ast.js';
import type { XsmpcatServices } from '../xsmpcat-module.js';
import * as XsmpUtils from '../utils/xsmp-utils.js';

/**
 * Provide the the type of any Expression in the AST.
 * Types are cached to improve performances.
 */
export class XsmpcatTypeProvider {

    protected readonly typeCache: WorkspaceCache<AstNode, ast.Type | undefined>;
    constructor(services: XsmpcatServices) {
        this.typeCache = new WorkspaceCache<AstNode, ast.Type | undefined>(services.shared);
    }

    /** Get the type of the expression on undefined if no type can be found */
    public getType(expression: AstNode): ast.Type | undefined {
        return this.typeCache.get(expression, () => this.doGetType(expression));
    }

    private doGetType(expression: AstNode): ast.Type | undefined {
        if (ast.isField(expression.$container)) {
            return expression.$container.type.ref;
        }
        else if (ast.isConstant(expression.$container)) {
            return expression.$container.type.ref;
        }
        else if (ast.isCollectionLiteral(expression.$container)) {
            const type = this.getType(expression.$container);
            if (ast.isStructure(type)) {
                const field = XsmpUtils.getAllFields(type).toArray().at(expression.$containerIndex!);
                if (field) { return field.type.ref; }
            }
            else if (ast.isArrayType(type)) {
                return type.itemType.ref;
            }
        }
        else if (ast.isExpression(expression.$container)) {
            return this.getType(expression.$container);
        }
        else if (ast.isAttribute(expression.$container)) {
            const attributeType = expression.$container.type.ref;
            if (ast.isAttributeType(attributeType)) {
                return attributeType.type.ref;
            }
        }
        else if (ast.isAttributeType(expression.$container)) {
            return expression.$container.type.ref;
        }
        return undefined;
    }
}