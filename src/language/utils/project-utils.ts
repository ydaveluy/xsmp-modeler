
import type { LangiumDocuments, URI } from 'langium';
import type { Project } from '../generated/ast.js';
import { UriUtils } from 'langium';
import { isProject } from '../generated/ast.js';
import { isBuiltinLibrary } from '../builtins.js';



export function findProjectContainingUri(documents: LangiumDocuments, uri: URI): Project | undefined {
    for (const doc of documents.all) {

        const project = doc.parseResult.value;
        if (isProject(project)) {
            const projectUri = UriUtils.dirname(doc.uri);
            if (uri.path.startsWith(projectUri.path)) {
                for (const source of project.sourcePaths) {
                    if (uri.path.startsWith(UriUtils.joinPath(projectUri, source).path)) {
                        return project;
                    }
                }
            }
        }
    }
    return undefined;
}

export function getAllDependencies(project: Project): Set<Project> {
    const projects: Set<Project> = new Set();
    collectAllDependencies(project, projects)
    return projects
}
/**
 * Collect all dependencies of a project recursively
 * @param project the project
 * @param dependencies the collected dependencies
 */
function collectAllDependencies(project: Project, dependencies: Set<Project>): void {
    // avoid cyclic dependencies
    if (dependencies.has(project)) {
        return;
    }
    dependencies.add(project);
    for (const dependency of project.dependencies) {
        if (dependency.ref) {
            collectAllDependencies(dependency.ref, dependencies);
        }
    }
}

export function getSourceFolders(projects: Set<Project>): Set<string> {
    const uris: Set<string> = new Set();
    for (const project of projects) {
        if (project.$document) {
            const projectUri = UriUtils.dirname(project.$document.uri);
            for (const source of project.sourcePaths) {
                uris.add(UriUtils.joinPath(projectUri, source).path);
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


export function findVisibleUris(documents: LangiumDocuments, uri: URI): Set<string> {
    const uris: Set<string> = new Set();
    const project = findProjectContainingUri(documents, uri);

    if (project) {
        const folders = getSourceFolders(getAllDependencies(project));

        for (const doc of documents.all) {
            if (isBuiltinLibrary(doc.uri) || isUriInFolders(doc.uri, folders)) {
                uris.add(doc.uri.toString());
            }
        }
    } else {
        for (const doc of documents.all) {
            if (isBuiltinLibrary(doc.uri)) {
                uris.add(doc.uri.toString());
            }
        }
    }

    return uris;
}
