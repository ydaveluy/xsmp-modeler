import { DocumentState, UriUtils } from 'langium';
import type { Cancellation, DocumentBuilder, IndexManager, LangiumDocument, LangiumDocuments, ServiceRegistry, URI } from 'langium';
import * as ast from '../generated/ast.js';
import { findProjectContainingUri } from '../utils/project-utils.js';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { SmpGenerator } from '../generator/smp/generator.js';
import pLimit from 'p-limit';
import type { Task, TaskAcceptor } from '../generator/generator.js';
import { XsmpSdkGenerator } from '../generator/cpp/xsmp-sdk-generator.js';
import type { XsmpSharedServices } from '../xsmp-module.js';

const limit = pLimit(8);

export class XsmpDocumentGenerator {
    protected readonly langiumDocuments: LangiumDocuments;
    protected readonly serviceRegistry: ServiceRegistry;
    protected readonly indexManager: IndexManager;
    protected readonly smpGenerator: SmpGenerator;
    protected readonly xsmpSdkGenerator: XsmpSdkGenerator;
    protected readonly builder: DocumentBuilder;

    constructor(services: XsmpSharedServices) {
        this.langiumDocuments = services.workspace.LangiumDocuments;
        this.indexManager = services.workspace.IndexManager;
        this.serviceRegistry = services.ServiceRegistry;
        this.smpGenerator = new SmpGenerator();
        this.xsmpSdkGenerator = new XsmpSdkGenerator(services);
        this.builder = services.workspace.DocumentBuilder;
    }

    private isValid(document: LangiumDocument): boolean {
        return document.state === DocumentState.Validated && document.parseResult.parserErrors.length === 0 && !document.diagnostics?.some(d => d.severity === DiagnosticSeverity.Error);
    }

    async generate(uri: URI, _cancelToken: Cancellation.CancellationToken): Promise<void> {
        const document = this.langiumDocuments.getDocument(uri);

        if (document && this.isValid(document)) {
            console.time(`Generate ${uri.fsPath}`);

            console.time(`Collecting tasks ${uri.fsPath}`);
            const tasks: Array<Promise<void>> = [];

            const taskAcceptor: TaskAcceptor = (task: Task) => { tasks.push(limit(task)); };
            if (ast.isCatalogue(document.parseResult.value)) {
                const project = findProjectContainingUri(this.langiumDocuments, document.uri);

                if (project) {
                    this.generateCatalogue(project, document.parseResult.value, taskAcceptor);
                }
            }
            else if (ast.isProject(document.parseResult.value)) {
                const project = document.parseResult.value;
                for (const doc of this.langiumDocuments.all) {
                    if (this.isValid(doc) && ast.isCatalogue(doc.parseResult.value) && project === findProjectContainingUri(this.langiumDocuments, doc.uri)) {
                        this.generateCatalogue(project, doc.parseResult.value, taskAcceptor);
                    }
                }
            }

            console.timeEnd(`Collecting tasks ${uri.fsPath}`);
            if (tasks.length > 0) {
                console.log('Executing all generation tasks...');
                await Promise.all(tasks);
            }
            console.timeEnd(`Generate ${uri.fsPath}`);
        }
    }

    generateCatalogue(project: ast.Project, catalogue: ast.Catalogue, taskAcceptor: TaskAcceptor) {

        const projectUri = UriUtils.dirname(project.$document?.uri as URI);

        for (const profile of project.profile) {
            switch (profile.ref?.name) {
                case 'org.eclipse.xsmp.profile.xsmp-sdk':
                case 'xsmp-sdk':
                    this.xsmpSdkGenerator.generate(catalogue, projectUri, taskAcceptor);
                    break;
            }
        }

        for (const tool of project.tools) {
            switch (tool.ref?.name) {
                case 'org.eclipse.xsmp.tool.smp':
                case 'smp':
                    this.smpGenerator.generate(catalogue, projectUri, taskAcceptor);
                    break;
                case 'org.eclipse.xsmp.tool.adoc':
                case 'adoc':
                    //TODO
                    break;
            }
        }
    }
}
