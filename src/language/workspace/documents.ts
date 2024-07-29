import { DefaultLangiumDocuments, DocumentState, LangiumDocument, URI } from "langium";
import * as ast from '../generated/ast.js';
import { findProjectContainingUri, getAllDependencies } from "../utils/project-utils.js";


export class XsmpLangiumDocuments extends DefaultLangiumDocuments {

    override invalidateDocument(uri: URI): LangiumDocument | undefined {
        const uriString = uri.toString();
        const langiumDoc = this.documentMap.get(uriString);
        if (langiumDoc) {
            const linker = this.serviceRegistry.getServices(langiumDoc.uri).references.Linker;
            linker.unlink(langiumDoc);
            langiumDoc.state = DocumentState.Changed
            langiumDoc.precomputedScopes = undefined;
            langiumDoc.diagnostics = undefined;

            if (ast.isProject(langiumDoc.parseResult.value)) {
                // invalidate all documents in source folders
                this.invalidateProject(langiumDoc.parseResult.value, langiumDoc)

                // invalidate all other projects (after all other documents)
                for (const doc of this.all) {
                    if (ast.isProject(doc.parseResult.value) && doc !== langiumDoc) {
                        this.invalidateDependency(doc)
                    }
                }
            }
            else {
                const project = findProjectContainingUri(this, langiumDoc.uri)
                if (project) {
                    this.invalidateProject(project, langiumDoc)
                }
            }
        }
        return langiumDoc;
    }


    protected invalidateProject(project: ast.Project, langiumDoc: LangiumDocument) {
        for (const doc of this.all) {
            const dep = findProjectContainingUri(this, doc.uri);
            if (dep && doc !== langiumDoc && getAllDependencies(dep).has(project)) {
                this.invalidateDependency(doc)
            }
        }
    }
    protected invalidateDependency(langiumDoc: LangiumDocument) {
        //console.debug(`invalidate  ${langiumDoc.uri}`)
        const linker = this.serviceRegistry.getServices(langiumDoc.uri).references.Linker;
        linker.unlink(langiumDoc);
        if (langiumDoc.state > DocumentState.ComputedScopes)
            langiumDoc.state = DocumentState.ComputedScopes

        langiumDoc.diagnostics = undefined;
    }

}