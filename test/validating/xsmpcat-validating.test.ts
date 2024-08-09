import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import type { Diagnostic } from "vscode-languageserver-types";
import { createXsmpServices } from "../../src/language/xsmp-module.js";
import { Catalogue, isCatalogue, } from "../../src/language/generated/ast.js";
import * as path from 'path';
import * as fs from 'fs';

let services: ReturnType<typeof createXsmpServices>;
let parse: ReturnType<typeof parseHelper<Catalogue>>;
let document: LangiumDocument<Catalogue> | undefined;

beforeAll(async () => {
    services = createXsmpServices(EmptyFileSystem);
    const doParse = parseHelper<Catalogue>(services.xsmpcat);
    parse = (input: string) => doParse(input, { validation: true });

    await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Validating', () => {

    test('check no errors', async () => {

        document = await parse(fs.readFileSync(path.resolve(__dirname, 'test.xsmpcat')).toString(), { documentUri: 'test.xsmpcat' });

        expect(
            checkDocumentValid(document) ?? document.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toBe(s`
            [9:10..9:15]: An Element Name shall not be an ISO/ANSI C++ keyword.
            [12:10..12:13]: An Element Name shall start with a letter.
            [30:2..30:17]: Duplicate annotation of a non-repeatable type. Only annotation types marked with \`@allowMultiple\` can be used multiple times on a single target.
            [31:2..31:19]: This annotation is disallowed for element of type PrimitiveType.
            [30:1..30:19]: A value is required.
            [3:9..3:21]: Invalid date format (e.g: 1970-01-01T00:00:00Z).
            [32:11..32:16]: Missing Type UUID.
            [37:8..37:40]: A Constant must have an initialization value.
            [42:4..44:5]: An Enumeration shall contains at least one literal.
            [50:8..50:10]: Duplicated literal name.
            [50:13..50:14]: Enumeration Literal Values shall be unique within an Enumeration.
            [58:22..58:23]: Minimum shall be less or equal than Maximum.
            [62:26..62:31]: Expecting a Floating Point  Type.
            [66:22..66:25]: Minimum shall be less or equal than Maximum.
            [70:22..70:25]: Minimum shall be less than Maximum.
            [19:11..19:18]: Invalid modifier.
            [19:34..19:49]: Default value is missing.
            [35:11..35:20]: Invalid modifier.
            [37:8..37:14]: Illegal modifier.
            [53:7..53:50]: Duplicated UUID.
            [57:7..57:50]: Duplicated UUID.
            [61:7..61:22]: The UUID is invalid.
            [66:10..66:18]: Duplicated Type name.
            [70:10..70:18]: Duplicated Type name.
            [74:46..74:56]: Duplicated interface.
            [74:58..74:69]: Cyclic dependency detected.
            [76:8..76:15]: Illegal modifier.
            [77:8..77:17]: Illegal modifier.
            [78:24..78:33]: Invalid modifier.
            [78:17..78:23]: Illegal modifier.
            [83:26..83:33]: Cyclic dependency detected.
            [83:58..83:69]: Duplicated interface.
            [83:10..83:17]: The Model shall be abstract.
        `);
    });

});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length && s`
        Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
    `
        || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
        || !isCatalogue(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a '${Catalogue}'.`
        || undefined;
}

function diagnosticToString(d: Diagnostic) {
    return `[${d.range.start.line}:${d.range.start.character}..${d.range.end.line}:${d.range.end.character}]: ${d.message}`;
}