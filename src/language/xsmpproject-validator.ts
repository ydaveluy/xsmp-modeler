import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { XsmpAstType, Project } from './generated/ast.js';
import type { XsmpprojectServices } from './xsmpproject-module.js';

/**
 * Register custom validation checks.
 */
export function registerXsmpprojectValidationChecks(services: XsmpprojectServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.XsmpprojectValidator;
    const checks: ValidationChecks<XsmpAstType> = {
        Project: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class XsmpprojectValidator {

    checkPersonStartsWithCapital(project: Project, accept: ValidationAcceptor): void {
        if (project.name) {
            const firstChar = project.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Project name should start with a capital.', { node: project, property: 'name' });
            }
        }


   
    }



}
