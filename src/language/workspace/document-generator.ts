import { DocumentState, UriUtils } from 'langium';
import type { IndexManager, LangiumDocument, LangiumDocuments, LangiumSharedCoreServices, ServiceRegistry, URI } from 'langium';
import * as ast from '../generated/ast.js';
import { findProjectContainingUri } from '../utils/project-utils.js';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { SmpcatGenerator } from '../generator/smp/generator.js';

export class XsmpDocumentGenerator {
    protected readonly langiumDocuments: LangiumDocuments;
    protected readonly serviceRegistry: ServiceRegistry;
    protected readonly indexManager: IndexManager;
    protected readonly smpcatGenerator: SmpcatGenerator;

    constructor(services: LangiumSharedCoreServices) {
        this.langiumDocuments = services.workspace.LangiumDocuments;
        this.indexManager = services.workspace.IndexManager;
        this.serviceRegistry = services.ServiceRegistry;
        this.smpcatGenerator = new SmpcatGenerator();
    }

    private isValid(document: LangiumDocument): boolean {
        return document.state === DocumentState.Validated && document.parseResult.parserErrors.length === 0 && !document.diagnostics?.some(d => d.severity === DiagnosticSeverity.Error);
    }

    generate(uri: URI): void {

        console.time(`Generate ${uri.fsPath}`);
        const document = this.langiumDocuments.getDocument(uri),
            tasks: Array<Promise<void>> = [];

        if (document && this.isValid(document)) {
            if (ast.isCatalogue(document.parseResult.value)) {
                const project = findProjectContainingUri(this.langiumDocuments, document.uri);
                if (project) {
                    tasks.push(... this.generateCatalogue(project, document.parseResult.value));
                }
            }
            else if (ast.isProject(document.parseResult.value)) {
                const project = document.parseResult.value;
                for (const doc of this.langiumDocuments.all) {
                    if (this.isValid(doc) && ast.isCatalogue(doc.parseResult.value) && project === findProjectContainingUri(this.langiumDocuments, doc.uri)) {
                        tasks.push(...  this.generateCatalogue(project, doc.parseResult.value));
                    }
                }
            }
        }
        if (tasks.length > 0) { Promise.all(tasks); }

        console.timeEnd(`Generate ${uri.fsPath}`);
    }

    generateCatalogue(project: ast.Project, catalogue: ast.Catalogue): Array<Promise<void>> {

        const projectUri = UriUtils.dirname(project.$document?.uri as URI),

            tasks: Array<Promise<void>> = [];

        for (const tool of project.tools) {
            switch (tool.ref?.name) {
                case 'org.eclipse.xsmp.tool.smp':
                case 'smp':
                    tasks.push(...this.smpcatGenerator.getGenerationTasks(catalogue, projectUri));
                    break;
                case 'org.eclipse.xsmp.tool.adoc':
                case 'adoc':
                    //TODO
                    break;
            }
        }
        return tasks;
    }
}
