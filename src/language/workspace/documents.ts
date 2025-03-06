import { DefaultLangiumDocuments, DocumentState } from 'langium';
import type { LangiumDocument, URI } from 'langium';
import * as ast from '../generated/ast.js';
import type { ProjectManager } from './project-manager.js';
import type { XsmpSharedServices } from '../xsmp-module.js';

export class XsmpLangiumDocuments extends DefaultLangiumDocuments {
    protected readonly projectManager: () => ProjectManager;

    constructor(services: XsmpSharedServices) {
        super(services);
        this.projectManager = () => services.workspace.ProjectManager;
    }

    override invalidateDocument(uri: URI): LangiumDocument | undefined {
        const uriString = uri.toString(),
            langiumDoc = this.documentMap.get(uriString);
        if (langiumDoc) {
            const linker = this.serviceRegistry.getServices(langiumDoc.uri).references.Linker;
            linker.unlink(langiumDoc);
            langiumDoc.state = DocumentState.Changed;
            langiumDoc.precomputedScopes = undefined;
            langiumDoc.diagnostics = undefined;

            if (ast.isProject(langiumDoc.parseResult.value)) {
                // Invalidate all documents in source folders
                this.invalidateProject(langiumDoc.parseResult.value, langiumDoc);

                // Invalidate all other projects (after all other documents)
                for (const doc of this.all) {
                    if (ast.isProject(doc.parseResult.value) && doc !== langiumDoc) {
                        this.invalidateDependency(doc);
                    }
                }
            }
            else {
                const project = this.projectManager().getProject(langiumDoc);
                if (project) {
                    this.invalidateProject(project, langiumDoc);
                }
            }
        }
        return langiumDoc;
    }

    protected invalidateProject(project: ast.Project, langiumDoc: LangiumDocument) {
        for (const doc of this.all) {
            const dep = this.projectManager().getProject(doc);
            if (dep && doc !== langiumDoc && this.projectManager().getDependencies(dep).has(project)) {
                this.invalidateDependency(doc);
            }
        }
    }
    protected invalidateDependency(langiumDoc: LangiumDocument) {
        const linker = this.serviceRegistry.getServices(langiumDoc.uri).references.Linker;
        linker.unlink(langiumDoc);
        if (langiumDoc.state > DocumentState.ComputedScopes) {
            langiumDoc.state = DocumentState.ComputedScopes;
        }
        langiumDoc.diagnostics = undefined;
    }

}