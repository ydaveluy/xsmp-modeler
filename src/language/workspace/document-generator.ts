import { DocumentState, IndexManager, LangiumDocument, LangiumDocuments, LangiumSharedCoreServices, ServiceRegistry, URI, UriUtils } from "langium";
import * as ast from '../generated/ast.js';
import { findProjectContainingUri } from "../utils/project-utils.js";
import { DiagnosticSeverity } from "vscode-languageserver";
import { SmpcatGenerator } from "../../cli/smp/generator.js";


export class XsmpDocumentGenerator {
    protected readonly langiumDocuments: LangiumDocuments;
    protected readonly serviceRegistry: ServiceRegistry;
    protected readonly indexManager: IndexManager;
    protected readonly smpcatGenerator: SmpcatGenerator;

    constructor(services: LangiumSharedCoreServices) {
        this.langiumDocuments = services.workspace.LangiumDocuments;
        this.indexManager = services.workspace.IndexManager;
        this.serviceRegistry = services.ServiceRegistry;
        this.smpcatGenerator = new SmpcatGenerator()
    }

    private isValid(document: LangiumDocument): boolean {
        if (document.state !== DocumentState.Validated || document.parseResult.parserErrors.length !== 0 || document.diagnostics?.some(d => d.severity === DiagnosticSeverity.Error))
            return false


        return true
    }


    generate(uri: URI): void {

        const document = this.langiumDocuments.getDocument(uri)

        if (document && this.isValid(document)) {
            if (ast.isCatalogue(document.parseResult.value)) {
                const project = findProjectContainingUri(this.langiumDocuments, document.uri)
                if (project) {
                    this.generateCatalogue(project, document.parseResult.value)
                }
            }
            else if (ast.isProject(document.parseResult.value)) {
                const project = document.parseResult.value;
                for (const doc of this.langiumDocuments.all) {
                    if (this.isValid(doc) && ast.isCatalogue(doc.parseResult.value) && project === findProjectContainingUri(this.langiumDocuments, doc.uri))
                        this.generateCatalogue(project, doc.parseResult.value)
                }
            }
        }
    }

    generateCatalogue(project: ast.Project, catalogue: ast.Catalogue) {


        const projectUri = UriUtils.dirname(project.$document?.uri as URI);



        for (const tool of project.tools) {
            switch (tool.ref?.name) {
                case "org.eclipse.xsmp.tool.smp":
                case "smp":
                    this.smpcatGenerator.generate(catalogue, projectUri)
                    break;
                case "org.eclipse.xsmp.tool.adoc":
                    //TODO
                    break;
            }

        }

    }

}
