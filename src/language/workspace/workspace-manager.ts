import type { LangiumDocument, LangiumDocumentFactory, LangiumSharedCoreServices, WorkspaceFolder } from 'langium';
import { DefaultWorkspaceManager } from 'langium';
import { builtInScheme } from '../builtins.js';
import { URI } from 'vscode-uri';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const libDir = getLibDir();
function getLibDir():string {
    try {
        return path.join(url.fileURLToPath(new URL('.', import.meta.url)), '../../lib');
    }
    catch {
        return path.join(__dirname,'../lib');
    }
}
export class XsmpWorkspaceManager extends DefaultWorkspaceManager {

    protected readonly documentFactory: LangiumDocumentFactory;
    protected readonly validFileExtension;

    constructor(services: LangiumSharedCoreServices) {
        super(services);
        this.documentFactory = services.workspace.LangiumDocumentFactory;
        this.validFileExtension = services.ServiceRegistry.all.flatMap(s => s.LanguageMetaData.fileExtensions);
    }

    protected override async loadAdditionalDocuments(
        folders: WorkspaceFolder[],
        collector: (document: LangiumDocument) => void
    ): Promise<void> {
        await this.loadBuiltinDocuments(libDir, collector);
    }

    protected async loadBuiltinDocuments(currentDir: string, collector: (document: LangiumDocument) => void, relativePath: string = ''): Promise<void> {
        try {
            const entries = await fs.promises.readdir(currentDir);

            await Promise.all(entries.map(async (entry) => {
                const entryPath = path.join(currentDir, entry);
                const entryRelativePath = path.join(relativePath, entry);

                try {
                    const stat = await fs.promises.stat(entryPath);

                    if (stat.isDirectory()) {
                        await this.loadBuiltinDocuments(entryPath, collector, entryRelativePath);
                    }
                    else if (stat.isFile() && this.validFileExtension.includes(path.extname(entry))) {
                        const content = await fs.promises.readFile(entryPath, 'utf-8');
                        collector(this.documentFactory.fromString(content, URI.parse(`${builtInScheme}:///${entryRelativePath}`)));
                    }
                } catch (error) {
                    console.error(`Error on ${entryPath}:`, error);
                }
            }));
        } catch (error) {
            console.error(`Could not read ${currentDir}:`, error);
        }
    }
}

