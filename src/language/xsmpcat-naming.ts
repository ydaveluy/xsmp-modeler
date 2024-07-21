import type { NamedElement } from './generated/ast.js';
import { isCatalogue, isNamedElement } from './generated/ast.js';

export function toQualifiedName(pack: NamedElement, childName: string): string {
    return (isCatalogue(pack.$container) || !isNamedElement(pack.$container) ? pack.name : toQualifiedName(pack.$container, pack.name as string)) + '.' + childName;
}


export class QualifiedNameProvider {

    /**
     * @param qualifier if the qualifier is a `string`, simple string concatenation is done: `qualifier.name`.
     *      if the qualifier is a `NamedElement` fully qualified name is created: `namespace1.namespace2.name`.
     * @param name simple name
     * @returns qualified name separated by `.`
     */
    getQualifiedName(qualifier: NamedElement | string, name: string): string {
        let prefix = qualifier;
        if (isNamedElement(prefix)) {
            prefix = (isCatalogue(prefix.$container) || !isNamedElement(prefix.$container)
                ? prefix.name as string : this.getQualifiedName(prefix.$container, prefix.name as string));
        }
        return prefix ? prefix + '.' + name : name;
    }

}