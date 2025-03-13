import { DefaultLanguageServer } from 'langium/lsp';
import { RequestType } from 'vscode-languageserver';

export const GetServerFileContentRequest = new RequestType<string, string | null, void>('xsmp/getServerFileContent');

export class XsmpLanguageServer extends DefaultLanguageServer {

    protected override eagerLoadServices(): void {
        super.eagerLoadServices();
        this.services.lsp.Connection?.onRequest(GetServerFileContentRequest, async (params) => {
            return this.services.workspace.LangiumDocuments.all.find(d => d.uri.toString() === params)?.textDocument.getText();
        });
    }
}