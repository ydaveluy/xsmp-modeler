import { Cancellation, DefaultDocumentBuilder } from 'langium';
import type { BuildOptions, LangiumDocument } from 'langium';
import * as ast from '../generated/ast.js';

export class XsmpDocumentBuilder extends DefaultDocumentBuilder {
    /**
     * Build first all project files to ensure that dependencies are properly linked before building other documents
     */
    protected override async buildDocuments(documents: LangiumDocument[], options: BuildOptions, cancelToken = Cancellation.CancellationToken.None): Promise<void> {
        const projects: LangiumDocument[] = [],
            others: LangiumDocument[] = [];

        documents.forEach(doc => {
            if (ast.isProject(doc.parseResult.value) || ast.isProfile(doc.parseResult.value) || ast.isTool(doc.parseResult.value)) {
                projects.push(doc);
            }
            else {
                others.push(doc);
            }
        });

        await super.buildDocuments(projects, options, cancelToken);
        await super.buildDocuments(others, options, cancelToken);
    }

    protected override shouldRelink(document: LangiumDocument, changedUris: Set<string>): boolean {
        // Check whether the document is affected by any of the changed URIs
        return this.indexManager.isAffected(document, changedUris);
    }

}