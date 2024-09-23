import { URI } from 'vscode-uri';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const dirname = getDirName();
function getDirName() {
    try {
        return url.fileURLToPath(new URL('.', import.meta.url));
    }
    catch {
        return __dirname;
    }
}

export const builtInScheme = 'builtin';
export function isBuiltinLibrary(uri: URI): boolean {
    return uri.scheme === builtInScheme;
}

function createBuiltinsMap(): Map<string, string> {
    const filesMap = new Map<string, string>();

    // Define the directory path
    const dir = path.join(dirname, '../lib');

    // Read all the files in the directory
    const files = fs.readdirSync(dir);
    const validFileExtension = ['.xsmpcat', '.xsmptool', '.xsmpprofile'];

    for (const file of files) {
        const filePath = path.join(dir, file);

        // Check if it's a valid file
        const stat = fs.statSync(filePath);
        if (stat.isFile() && validFileExtension.includes(path.extname(filePath))) {
            // Read the file content
            const content = fs.readFileSync(filePath, 'utf-8');
            // Add the file name and its content to the Map
            filesMap.set(URI.parse(`${builtInScheme}:///${file}`).toString(), content);
        }
    }
    return filesMap;
}

// Initialize the builtins map
export const builtins = createBuiltinsMap();