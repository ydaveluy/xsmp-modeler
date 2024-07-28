import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { clearDocuments, parseHelper } from "langium/test";
import { createXsmpServices } from "../../src/language/xsmp-module.js";
import { Project, isProject } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createXsmpServices>;
let parse: ReturnType<typeof parseHelper<Project>>;
let document: LangiumDocument<Project> | undefined;

beforeAll(async () => {
    services = createXsmpServices(EmptyFileSystem);
    parse = parseHelper<Project>(services.xsmpproject);
    await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

afterEach(async () => {
    document && clearDocuments(services.shared, [document]);
});

describe('Linking tests', () => {

    test('linking of greetings', async () => {
        document = await parse(`
            project "project-name"

            profile "xsmp-sdk"
            profile "esa-cdk"
            profile "unknown-profile"

            tool "org.eclipse.xsmp.tool.smp"
            tool "org.eclipse.xsmp.tool.adoc"
            tool "unknown-tool"

            source "smdl"
            source "smdl2"


            dependency "project-name"
            dependency "dep2"
        `);

        expect(
            // here we first check for validity of the parsed document object by means of the reusable function
            //  'checkDocumentValid()' to sort out (critical) typos first,
            // and then evaluate the cross references we're interested in by checking
            //  the referenced AST element as well as for a potential error message;
            checkDocumentValid(document)
            ?? s`
            Profiles:
                ${document.parseResult.value?.profile?.map(p => p.ref?.name)?.join('\n')}
            Tools:
                ${document.parseResult.value?.tools?.map(p => p.ref?.name)?.join('\n')}
            Dependencies:
                ${document.parseResult.value?.dependencies?.map(p => p.ref?.name)?.join('\n')}
        `
        ).toBe(s`
            Profiles:
                xsmp-sdk
                esa-cdk

            Tools:
                org.eclipse.xsmp.tool.smp
                org.eclipse.xsmp.tool.adoc

            Dependencies:
                project-name
                
        `);
    });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length && s`
        Parser errors:
          ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
    `
        || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
        || !isProject(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a '${Project}'.`
        || undefined;
}
