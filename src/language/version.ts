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

const packagePath = path.resolve(dirname, '..', '..', 'package.json');
const packageContent = fs.readFileSync(packagePath, 'utf-8');
export const xsmpVersion = JSON.parse(packageContent).version;
