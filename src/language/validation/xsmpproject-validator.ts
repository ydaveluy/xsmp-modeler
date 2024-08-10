import { AstNode, Properties, Reference, UriUtils, type ValidationAcceptor, type ValidationChecks } from 'langium';
import type { XsmpprojectServices } from '../xsmpproject-module.js';
import * as fs from 'node:fs';
import { getAllDependencies } from '../utils/project-utils.js';
import * as ast from '../generated/ast.js';
import { XsmpUtils } from '../utils/xsmp-utils.js';

/**
 * Register custom validation checks.
 */
export function registerXsmpprojectValidationChecks(services: XsmpprojectServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.XsmpprojectValidator;
    const checks: ValidationChecks<ast.XsmpAstType> = {
        Project: validator.checkProject
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class XsmpprojectValidator {

    checkTypeReference<N extends AstNode, P extends string = Properties<N>>(accept: ValidationAcceptor, node: N, reference: Reference<ast.NamedElement>, property: Properties<N>, index?: number): boolean {
        if (!reference.ref)
            return false


        const deprecated = XsmpUtils.getDeprecated(reference.ref)
        if (deprecated)
            accept('warning', `Deprecated ${deprecated.content.toString()}`, { node: node, property: property, index: index });

        return true
    }


    checkProject(project: ast.Project, accept: ValidationAcceptor): void {


        // check only one profile (or zero)
        let profile: ast.Profile | undefined = undefined;
        project.profile.forEach((p, index) => {
            if (this.checkTypeReference(accept, project, p, 'profile', index)) {
                if (profile)
                    accept('error', "A profile is already defined.", { node: project, property: 'profile', index: index });
                else
                    profile = p.ref;

            }
        });
        // check source dir exists
        if (project.$document) {
            const projectUri = UriUtils.dirname(project.$document.uri);
            project.sourcePaths.forEach((source, index) => {
                const path = UriUtils.joinPath(projectUri, source).path;
                if (!path.startsWith(projectUri.path))
                    accept('error', "Source path '" + source + "' is not contained within the project directory.", { node: project, property: 'sourcePaths', index: index });
                else if (!fs.existsSync(path))
                    accept('error', "Source path '" + source + "' does not exist.", { node: project, property: 'sourcePaths', index: index });
            })
        }
        // check dependencies references & no cyclic dependencies
        project.dependencies.forEach((dependency, index) => {
            if (this.checkTypeReference(accept, project, dependency, 'dependencies', index) && getAllDependencies(dependency.ref as ast.Project).has(project))
                accept('error', "Cyclic dependency detected '" + dependency.ref?.name + "'.", { node: project, property: 'dependencies', index: index });

        })
        // check no duplicated dependency
        project.dependencies.forEach((dependency, index) =>
            project.dependencies.slice(index + 1).some((other, index2) => {
                if (dependency.ref && dependency.ref.name === other.ref?.name) {
                    accept('error', "Duplicated dependency '" + dependency.ref.name + "'.", { node: project, property: 'dependencies', index: index + 1 + index2 });
                    return true
                }
                return false
            })
        );

        // check tools references
        project.tools.forEach((tool, index) =>
            this.checkTypeReference(accept, project, tool, 'tools', index)
        );

        // check no duplicated tool
        project.tools.forEach((tool, index) =>
            project.tools.slice(index + 1).some((other, index2) => {
                if (tool.ref && tool.ref?.name === other.ref?.name) {
                    accept('error', "Duplicated tool '" + tool.ref?.name + "'.", { node: project, property: 'tools', index: index + 1 + index2 });
                    return true
                }
                return false
            })
        );



    }


}




