import { BuildOptions, Cancellation, DefaultDocumentBuilder, LangiumDocument } from "langium";
import { isProfile, isTool, isProject } from "../generated/ast.js";


export class XsmpDocumentBuilder extends DefaultDocumentBuilder {


    /**
     * Build first all project files to ensure that dependencies are properly linked before building other documents
     */
    protected override async buildDocuments(documents: LangiumDocument[], options: BuildOptions, cancelToken = Cancellation.CancellationToken.None): Promise<void> {

        //console.time('build')
        const projects: LangiumDocument[] = []
        const others: LangiumDocument[] = []

        documents.forEach(doc => {
            if (isProject(doc.parseResult.value) || isProfile(doc.parseResult.value) || isTool(doc.parseResult.value))
                projects.push(doc)
            else
                others.push(doc)
        })

        await super.buildDocuments(projects, options, cancelToken)
        await super.buildDocuments(others, options, cancelToken)


        //console.timeEnd('build')
    }

    protected override shouldRelink(document: LangiumDocument, changedUris: Set<string>): boolean {
        // Check whether the document is affected by any of the changed URIs
        return this.indexManager.isAffected(document, changedUris);
    }

}