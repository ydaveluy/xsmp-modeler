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
            [83:8..83:15]: A Property of an Interface shall not be static.
            [84:8..84:16]: A Property shall not be both Static and Virtual.
            [85:8..85:17]: A Property shall not be both Static and Abstract.
            [94:42..94:50]: The string length exceeds the allowed length for its type: 4 character(s).
            [95:38..95:40]: A \`Char8\` shall contain exactly one character.
            [96:38..96:44]: A \`Char8\` shall contain exactly one character.
            [19:11..19:18]: Illegal modifier.
            [19:34..19:49]: Default value is missing.
            [35:11..35:20]: Illegal modifier.
            [37:8..37:14]: Invalid modifier.
            [53:7..53:50]: Duplicated UUID.
            [57:7..57:50]: Duplicated UUID.
            [61:7..61:22]: The UUID is invalid.
            [66:10..66:18]: Duplicated Type name.
            [70:10..70:18]: Duplicated Type name.
            [73:20..73:22]: The String length shall be a positive number.
            [79:46..79:56]: Duplicated interface.
            [79:58..79:69]: Cyclic dependency detected.
            [81:8..81:15]: Invalid modifier.
            [82:8..82:17]: Invalid modifier.
            [86:24..86:33]: Illegal modifier.
            [86:17..86:23]: Invalid modifier.
            [91:26..91:33]: Cyclic dependency detected.
            [91:58..91:69]: Duplicated interface.
            [93:33..93:36]: Duplicated identifier.
            [95:31..95:35]: Duplicated identifier.
            [96:31..96:35]: Duplicated identifier.
            [91:10..91:17]: The Model shall be abstract.
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