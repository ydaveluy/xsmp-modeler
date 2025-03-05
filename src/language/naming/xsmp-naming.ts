import { AstUtils } from 'langium';
import * as ast from '../generated/ast.js';

export class QualifiedNameProvider {

    /**
     * Computes the fully qualified name for the given object, if any.
     */
    protected computeFullyQualifiedName(obj: ast.NamedElement): string {
        let name = obj.name;
        if (name === undefined || name.length === 0) {
            return '';
        }
        if (ast.isContainer(obj) || ast.isReferenceType(obj)) {
            name = '$' + name;
        }

        const parent = AstUtils.getContainerOfType(obj.$container, ast.isNamedElement);

        if (ast.isDocument(parent) || parent === undefined) {
            return name;
        }

        return this.getFullyQualifiedName(parent) + '.' + name;
    }

    public getFullyQualifiedName(node: ast.NamedElement): string {
        return this.computeFullyQualifiedName(node);
    }
}