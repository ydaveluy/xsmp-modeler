import type { LangiumDocument, LangiumDocumentFactory, LangiumSharedCoreServices, WorkspaceFolder } from 'langium';
import { DefaultWorkspaceManager } from 'langium';
import { builtins } from '../builtins.js';
import { URI } from 'vscode-uri';

export class XsmpWorkspaceManager extends DefaultWorkspaceManager {

    private readonly documentFactory: LangiumDocumentFactory;

    constructor(services: LangiumSharedCoreServices) {
        super(services);
        this.documentFactory = services.workspace.LangiumDocumentFactory;
    }

    protected override async loadAdditionalDocuments(
        folders: WorkspaceFolder[],
        collector: (document: LangiumDocument) => void
    ): Promise<void> {
        await super.loadAdditionalDocuments(folders, collector);

        // Load all buildins documents (ecss.smp.smp.xsmpcat, profiles, tools, ...)
        for (const [uri, value] of builtins) {
            collector(this.documentFactory.fromString(value, URI.parse(uri)));
        }
    }
}

