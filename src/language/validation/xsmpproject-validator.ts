import { type AstNode, type IndexManager, MultiMap, type Properties, type Reference, type ValidationAcceptor, type ValidationChecks, UriUtils, WorkspaceCache, type AstNodeDescription } from 'langium';
import type { XsmpprojectServices } from '../xsmpproject-module.js';
import * as fs from 'node:fs';
import * as ProjectUtils from '../utils/project-utils.js';
import * as ast from '../generated/ast.js';
import * as XsmpUtils from '../utils/xsmp-utils.js';
import { DiagnosticTag, Location, type Range } from 'vscode-languageserver';

/**
 * Register custom validation checks.
 */
export function registerXsmpprojectValidationChecks(services: XsmpprojectServices) {
    const registry = services.validation.ValidationRegistry,
        validator = services.validation.XsmpprojectValidator,
        checks: ValidationChecks<ast.XsmpAstType> = {
            Project: validator.checkProject
        };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class XsmpprojectValidator {
    protected readonly indexManager: IndexManager;
    protected readonly globalCache: WorkspaceCache<string, MultiMap<string, AstNodeDescription>>;

    constructor(services: XsmpprojectServices) {
        this.indexManager = services.shared.workspace.IndexManager;
        this.globalCache = new WorkspaceCache<string, MultiMap<string, AstNodeDescription>>(services.shared);
    }

    private computeNamesForProjects(): MultiMap<string, AstNodeDescription> {
        const map = new MultiMap<string, AstNodeDescription>();
        for (const type of this.indexManager.allElements(ast.Project)) {
            map.add(type.name, type);
        }
        return map;
    }

    checkTypeReference<N extends AstNode>(accept: ValidationAcceptor, node: N, reference: Reference<ast.NamedElement>, property: Properties<N>, index?: number): boolean {
        if (!reference.ref) {
            return false;
        }
        const deprecated = XsmpUtils.getDeprecated(reference.ref);
        if (deprecated) {
            accept('warning', deprecated.toString().length > 0 ? `Deprecated: ${deprecated.toString()}` : 'Deprecated.', { node, property, index, tags: [DiagnosticTag.Deprecated] });
        }
        return true;
    }

    checkProject(project: ast.Project, accept: ValidationAcceptor): void {
        const duplicates = this.globalCache.get('projects', () => this.computeNamesForProjects()).get(project.name);
        if (duplicates.length > 1) {
            accept('error', 'Duplicated project name', {
                node: project,
                property: 'name',
                relatedInformation: duplicates.filter(d => d.node !== project).map(d => ({ location: Location.create(d.documentUri.toString(), d.nameSegment?.range as Range), message: d.name }))
            });
        }
        // Check only one profile (or zero)
        let profile: ast.Profile | undefined;
        project.profile.forEach((p, index) => {
            if (this.checkTypeReference(accept, project, p, 'profile', index)) {
                if (profile) {
                    accept('error', 'A profile is already defined.', { node: project, property: 'profile', index });
                }
                else {
                    profile = p.ref;
                }

            }
        });
        // Check source dir exists
        if (project.$document) {
            const projectUri = UriUtils.dirname(project.$document.uri);
            project.sourcePaths.forEach((source, index) => {
                const { path } = UriUtils.joinPath(projectUri, source);
                if (!path.startsWith(projectUri.path)) {
                    accept('error', `Source path '${source}' is not contained within the project directory.`, { node: project, property: 'sourcePaths', index });
                }
                else if (!fs.existsSync(path)) {
                    accept('error', `Source path '${source}' does not exist.`, { node: project, property: 'sourcePaths', index });
                }
            });
        }
        // Check dependencies references & no cyclic dependencies
        project.dependencies.forEach((dependency, index) => {
            if (this.checkTypeReference(accept, project, dependency, 'dependencies', index) && ProjectUtils.getAllDependencies(dependency.ref!).has(project)) {
                accept('error', `Cyclic dependency detected '${dependency.ref?.name}'.`, { node: project, property: 'dependencies', index });
            }

        });
        // Check no duplicated dependency
        project.dependencies.forEach((dependency, index) =>
            project.dependencies.slice(index + 1).some((other, index2) => {
                if (dependency.ref && dependency.ref.name === other.ref?.name) {
                    accept('error', `Duplicated dependency '${dependency.ref.name}'.`, { node: project, property: 'dependencies', index: index + 1 + index2 });
                    return true;
                }
                return false;
            })
        );

        // Check tools references
        project.tools.forEach((tool, index) =>
            this.checkTypeReference(accept, project, tool, 'tools', index)
        );

        // Check no duplicated tool
        project.tools.forEach((tool, index) =>
            project.tools.slice(index + 1).some((other, index2) => {
                if (tool.ref && tool.ref.name === other.ref?.name) {
                    accept('error', `Duplicated tool '${tool.ref.name}'.`, { node: project, property: 'tools', index: index + 1 + index2 });
                    return true;
                }
                return false;
            })
        );
    }
}
