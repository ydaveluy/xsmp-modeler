
import type { LangiumDocuments, URI } from 'langium';
import { DocumentState, UriUtils } from 'langium';
import * as ast from '../generated/ast.js';
import { isBuiltinLibrary } from '../builtins.js';

export function findProjectContainingUri(documents: LangiumDocuments, uri: URI): ast.Project | undefined {

    for (const doc of documents.all) {

        const project = doc.parseResult.value;
        if (ast.isProject(project)) {
            const projectUri = UriUtils.dirname(doc.uri);

            if (uri.path.startsWith(projectUri.path)) {
                for (const source of project.elements.filter(ast.isSource)) {
                    if (source.path && uri.path.startsWith(UriUtils.joinPath(projectUri, source.path).path)) {
                        return project;
                    }
                }
            }
        }
    }
    return undefined;
}

export function getAllDependencies(project: ast.Project): Set<ast.Project> {

    const projects = new Set<ast.Project>();
    collectAllDependencies(project, projects);
    return projects;
}
/**
 * Collect all dependencies of a project recursively
 * @param project the project
 * @param dependencies the collected dependencies
 */
function collectAllDependencies(project: ast.Project, dependencies: Set<ast.Project>): void {
    // Avoid cyclic dependencies
    if (dependencies.has(project)) {
        return;
    }
    dependencies.add(project);

    if (project.$document && project.$document.state >= DocumentState.Linked) {
        for (const dependency of project.elements.filter(ast.isDependency)) {
            if (dependency.project?.ref) {
                collectAllDependencies(dependency.project.ref, dependencies);
            }
        }
    }
}

export function getSourceFolders(projects: Set<ast.Project>): Set<string> {
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

export function isUriInFolders(uri: URI, folders: Set<string>): boolean {
    for (const folder of folders) {
        if (uri.path.startsWith(folder)) {
            return true;
        }
    }
    return false;
}

export function findVisibleUris(documents: LangiumDocuments, uri: URI): Set<string> | undefined {

    const project = findProjectContainingUri(documents, uri);

    if (project) {
        const uris: Set<string> = new Set<string>(),
            folders = getSourceFolders(getAllDependencies(project));
        for (const doc of documents.all) {
            if (ast.isCatalogue(doc.parseResult.value) && (isBuiltinLibrary(doc.uri) || isUriInFolders(doc.uri, folders))) {
                uris.add(doc.uri.toString());
            }
        }
        uris.delete(uri.toString());
        return uris;
    }

    return undefined;
}
