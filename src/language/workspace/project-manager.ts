import { AstUtils, DocumentState, UriUtils, WorkspaceCache } from 'langium';
import type { LangiumDocument, LangiumDocuments, LangiumSharedCoreServices, URI } from 'langium';
import * as ast from '../generated/ast.js';
import { isBuiltinLibrary } from '../builtins.js';

export class ProjectManager {
    protected readonly projectCache: WorkspaceCache<URI, ast.Project | undefined>;
    protected readonly dependenciesCache: WorkspaceCache<[URI, boolean], Set<ast.Project>>;
    protected readonly visibleUrisCache: WorkspaceCache<URI, Set<string>>;
    protected readonly documents: LangiumDocuments;

    constructor(services: LangiumSharedCoreServices) {

        this.projectCache = new WorkspaceCache<URI, ast.Project | undefined>(services);
        this.dependenciesCache = new WorkspaceCache<[URI, boolean], Set<ast.Project>>(services);
        this.visibleUrisCache = new WorkspaceCache<URI, Set<string>>(services);
        this.documents = services.workspace.LangiumDocuments;
    }

    getProject(document: LangiumDocument): ast.Project | undefined {
        return this.projectCache.get(document.uri, () => this.doGetProject(document));
    }

    protected doGetProject(document: LangiumDocument): ast.Project | undefined {
        for (const doc of this.documents.all) {

            const project = doc.parseResult.value;
            if (ast.isProject(project)) {
                const projectUri = UriUtils.dirname(doc.uri);

                if (document.uri.path.startsWith(projectUri.path)) {
                    for (const source of project.elements.filter(ast.isSource)) {
                        if (source.path && document.uri.path.startsWith(UriUtils.joinPath(projectUri, source.path).path)) {
                            return project;
                        }
                    }
                }
            }
        }
        return undefined;
    }

    getDependencies(project: ast.Project, transitive: boolean = true): Set<ast.Project> {
        return this.dependenciesCache.get([AstUtils.getDocument(project).uri, transitive], () => this.doGetDependencies(project, transitive));
    }
    /**
     * Collect all dependencies of a project recursively
     * @param project the project
     * @param dependencies the collected dependencies
     */
    protected doGetDependencies(project: ast.Project, transitive: boolean): Set<ast.Project> {
        const dependencies = new Set<ast.Project>();
        dependencies.add(project);

        if (project.$document && project.$document.state >= DocumentState.Linked) {
            for (const dependency of project.elements.filter(ast.isDependency)) {
                if (dependency.project?.ref) {
                    this.collectAllDependencies(dependency.project.ref, dependencies, transitive);
                }
            }
        }
        return dependencies;
    }

    /**
     * Collect all dependencies of a project recursively
     * @param project the project
     * @param dependencies the collected dependencies
     */
    protected collectAllDependencies(project: ast.Project, dependencies: Set<ast.Project>, transitive: boolean): void {
        // Avoid cyclic dependencies
        if (dependencies.has(project)) {
            return;
        }
        dependencies.add(project);

        if (transitive && project.$document && project.$document.state >= DocumentState.Linked) {
            for (const dependency of project.elements.filter(ast.isDependency)) {
                if (dependency.project?.ref) {
                    this.collectAllDependencies(dependency.project.ref, dependencies, transitive);
                }
            }
        }
    }
    getVisibleUris(document: LangiumDocument): Set<string> {
        return this.visibleUrisCache.get(document.uri, () => {
            const project = this.getProject(document);
            const uris: Set<string> = new Set<string>();
            if (project) {
                const standard = project.standard ?? 'ECSS_SMP_2019';
                const folders = this.getSourceFolders(this.getDependencies(project));
                for (const doc of this.documents.all) {
                    if (ast.isCatalogue(doc.parseResult.value)) {
                        if (this.isUriInFolders(doc.uri, folders) || isBuiltinLibrary(doc.uri) && (!doc.uri.path.includes('@') || doc.uri.path.includes('@' + standard)))
                            uris.add(doc.uri.toString());
                    }
                }
            }
            else if (!isBuiltinLibrary(document.uri)) {
                for (const doc of this.documents.all) {
                    uris.add(doc.uri.toString());
                }
            }
            return uris;
        });

    }
    getSourceFolders(projects: Set<ast.Project>): Set<string> {
        const uris = new Set<string>();
        for (const project of projects) {
            if (project.$document) {
                const projectUri = UriUtils.dirname(project.$document.uri);
                for (const source of project.elements.filter(ast.isSource)) {
                    if (source.path)
                        uris.add(UriUtils.joinPath(projectUri, source.path).path);
                }
            }
        }
        return uris;
    }
    isUriInFolders(uri: URI, folders: Set<string>): boolean {
        for (const folder of folders) {
            if (uri.path.startsWith(folder)) {
                return true;
            }
        }
        return false;
    }
}