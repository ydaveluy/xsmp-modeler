import {
    DefaultIndexManager,
    LangiumDocument} from "langium";
import { findProjectContainingUri, getAllDependencies } from "../utils/project-utils.js";


/**
 * Customized IndexManager to correctly handle the rebuild of a document (xsmpcat) when its project configuration changed
 */
export class XsmpIndexManager extends DefaultIndexManager {



    /**
     * Overrides the isAffected method from the parent class. This method checks if a document needs to be rebuilt based on changes in its project's dependencies.
     * @param {LangiumDocument} document - The document that is being checked for affected status.
     * @param {Set<string>} changedUris - A set of URIs that have been modified.
     * @returns {boolean} - True if the document is affected by changes in its dependencies, false otherwise.
     */
    override isAffected(document: LangiumDocument, changedUris: Set<string>): boolean {

        const project = findProjectContainingUri(this.documents, document.uri)
        if (project) {
            for (const dependency of getAllDependencies(project)) {
                if (dependency.$document && changedUris.has(dependency.$document.uri.toString())) {
                    return true
                }
            }
        }
        // otherwise default behaviour
        return super.isAffected(document, changedUris);
    }


}
