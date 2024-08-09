import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import type { Diagnostic } from "vscode-languageserver-types";
import { createXsmpServices } from "../../src/language/xsmp-module.js";
import { Project, isProject, } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createXsmpServices>;
let parse: ReturnType<typeof parseHelper<Project>>;
let document: LangiumDocument<Project> | undefined;

beforeAll(async () => {
    services = createXsmpServices(EmptyFileSystem);
    const doParse = parseHelper<Project>(services.xsmpproject);
    parse = (input: string) => doParse(input, { validation: true });

    await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Validating', () => {

    test('check no errors', async () => {
        document = await parse(`
            project "test"

            profile "xsmp-sdk"


            tool "smp"
            tool "adoc"

        `);


        expect(checkDocumentValid(document) ?? document.diagnostics?.map(diagnosticToString)?.join('\n')).toHaveLength(0)


    });

    test('With errors', async () => {
        document = await parse(`
            project "project-name"

            profile "org.eclipse.xsmp.profile.xsmp-sdk"
            profile "org.eclipse.xsmp.profile.xsmp-sdk"

            tool "org.eclipse.xsmp.tool.smp"
            tool "adoc"
            tool "adoc"

            source "smdl"
            source "../"

            dependency "project-name"
            dependency "project-name"
        `, { documentUri: 'test/ns/xsmp.project' });

        expect(
            checkDocumentValid(document) ?? document.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toBe(s`
            [3:20..3:55]: Deprecated Use the "xsmp-sdk" profile instead.
            [4:20..4:55]: Deprecated Use the "xsmp-sdk" profile instead.
            [4:20..4:55]: A profile is already defined.
            [10:19..10:25]: Source path 'smdl' does not exist.
            [13:23..13:37]: Cyclic dependency detected 'project-name'.
            [14:23..14:37]: Cyclic dependency detected 'project-name'.
            [14:23..14:37]: Duplicated dependency 'project-name'.
            [6:17..6:44]: Deprecated Use the "smp" tool instead.
            [8:17..8:23]: Duplicated tool 'adoc'.
        `);
    });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length && s`
        Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
    `
        || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
        || !isProject(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a '${Project}'.`
        || undefined;
}

function diagnosticToString(d: Diagnostic) {
    return `[${d.range.start.line}:${d.range.start.character}..${d.range.end.line}:${d.range.end.character}]: ${d.message}`;
}