
import { EmptyFileSystem } from 'langium';
import { expectFormatting } from 'langium/test';
import { describe, test } from 'vitest';
import { createXsmpServices } from '../../src/language/xsmp-module.js';
import * as path from 'path';
import * as fs from 'fs';

const services = createXsmpServices(EmptyFileSystem);
const formatting = expectFormatting(services.xsmpcat);

describe('Xsmpcat Formatter', () => {

    test('Format reference file', async () => {
        await formatting({
            before: fs.readFileSync(path.resolve(__dirname, 'not-formatted.xsmpcat')).toString(),
            after: fs.readFileSync(path.resolve(__dirname, 'formatted.xsmpcat')).toString()
        });
    });


});