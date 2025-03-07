import { DefaultDocumentBuilder } from 'langium';
import type { BuildOptions, LangiumDocument, Cancellation } from 'langium';
import * as ast from '../generated/ast.js';

export class XsmpDocumentBuilder extends DefaultDocumentBuilder {
    /**
     * Build first all project files to ensure that dependencies are properly linked before building other documents
     */
    protected override async buildDocuments(documents: LangiumDocument[], options: BuildOptions, cancelToken: Cancellation.CancellationToken): Promise<void> {
        const projects: LangiumDocument[] = [],
            others: LangiumDocument[] = [];

        documents.forEach(doc => {
            switch (doc.parseResult.value.$type) {
                case ast.Project:
                case ast.Profile:
                case ast.Tool:
                    projects.push(doc); break;
                default:
                    others.push(doc);
                    break;
            }
        });

        await super.buildDocuments(projects, options, cancelToken);
        await super.buildDocuments(others, options, cancelToken);
    }
}