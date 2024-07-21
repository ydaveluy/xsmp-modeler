import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { XsmpAstType, Catalogue } from './generated/ast.js';
import type { XsmpcatServices } from './xsmpcat-module.js';

/**
 * Register custom validation checks.
 */
export function registerXsmpcatValidationChecks(services: XsmpcatServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.XsmpcatValidator;
    const checks: ValidationChecks<XsmpAstType> = {
        Catalogue: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class XsmpcatValidator {

    checkPersonStartsWithCapital(catalogue: Catalogue, accept: ValidationAcceptor): void {
        if (catalogue.name) {
            const firstChar = catalogue.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Catalogue name should start with a capital.', { node: catalogue, property: 'name' });
            }
        }


   
    }



}
