import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import { createXsmpServices } from "../../src/language/xsmp-module.js";
import { isProject, Project } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createXsmpServices>;
let parse: ReturnType<typeof parseHelper<Project>>;
let document: LangiumDocument<Project> | undefined;

beforeAll(async () => {
  services = createXsmpServices(EmptyFileSystem);
  parse = parseHelper<Project>(services.xsmpproject);

  await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Parsing tests', () => {

  test('parse simple model', async () => {
    document = await parse(`
            project "project-name"

            profile "profile-name"
            profile "duplicated-profile"

            tool "tool1"
            tool "tool2"

            source "smdl"
            source "smdl2"


            dependency "dep1"
            dependency "dep2"
        `);

    expect(
      checkDocumentValid(document) ?? s`
                Profiles:
                  ${document.parseResult.value?.profile?.map(p => p.$refText)?.join('\n')}
                Tools:
                  ${document.parseResult.value?.tools?.map(p => p.$refText)?.join('\n')}
                Sources:
                  ${document.parseResult.value?.sourcePaths?.join('\n')}
                Dependencies:
                  ${document.parseResult.value?.dependencies?.map(p => p.$refText)?.join('\n')}
            `
    ).toBe(s`
            Profiles:
              profile-name
              duplicated-profile
            Tools:
              tool1
              tool2
            Sources:
              smdl
              smdl2
            Dependencies:
              dep1
              dep2
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
