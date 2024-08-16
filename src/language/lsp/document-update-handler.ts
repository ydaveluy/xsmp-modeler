import type { TextDocument } from 'langium';
import { URI } from 'langium';
import { DefaultDocumentUpdateHandler } from 'langium/lsp';
import type { TextDocumentChangeEvent } from 'vscode-languageserver';
import type { XsmpSharedServices } from '../xsmp-module.js';
import type { XsmpDocumentGenerator } from '../workspace/document-generator.js';

export class XsmpDocumentUpdateHandler extends DefaultDocumentUpdateHandler {
    protected readonly documentGenerator: XsmpDocumentGenerator;

    constructor(services: XsmpSharedServices) {
        super(services);
        this.documentGenerator = services.DocumentGenerator;

    }

    didSaveDocument(event: TextDocumentChangeEvent<TextDocument>): void {
        const uri = URI.parse(event.document.uri);

        // Filter out URIs that do not have a service in the registry
        if (this.serviceRegistry.hasServices(uri)) {
            // Only fire the document generation when the workspace manager is ready
            // Otherwise, we might miss the initial indexing of the workspace
            this.workspaceManager.ready.then(() => {
                this.workspaceLock.write(token =>  this.documentGenerator.generate(uri, token));
            }).catch(err => {
                // This should never happen, but if it does, we want to know about it
                console.error('Workspace initialization failed. Could not perform document generation.', err);
            });

        }
    }
}