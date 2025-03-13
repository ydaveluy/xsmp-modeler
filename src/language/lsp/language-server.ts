import { DefaultLanguageServer } from 'langium/lsp';
import { RequestType } from 'vscode-languageserver';

export const GetServerFileContentRequest = new RequestType<string, string | null, void>('xsmp/getServerFileContent');
export const RegisterContributor = new RequestType<string, void, void>('xsmp/registerContributor');

export class XsmpLanguageServer extends DefaultLanguageServer {

    protected override eagerLoadServices(): void {
        super.eagerLoadServices();
        this.services.lsp.Connection?.onRequest(GetServerFileContentRequest, async (uri) => {
            return this.services.workspace.LangiumDocuments.all.find(d => d.uri.toString() === uri)?.textDocument.getText();
        });

        this.services.lsp.Connection?.onRequest(RegisterContributor, async (modulePath) => {
            const moduleInstance = await import(modulePath);
            if (moduleInstance && typeof moduleInstance.register === 'function') {
                moduleInstance.register(this.services);
            } else {
                console.error(`Unable to register contributor: ${modulePath}`);
            }
        });
    }
}