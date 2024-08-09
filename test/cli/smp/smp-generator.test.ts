import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import { createXsmpServices } from "../../../src/language/xsmp-module.js";
import { Catalogue, isCatalogue } from "../../../src/language/generated/ast.js";
import { SmpcatGenerator } from "../../../src/cli/smp/generator.js";
import * as path from 'path';
import * as fs from 'fs';

let services: ReturnType<typeof createXsmpServices>;
let parse: ReturnType<typeof parseHelper<Catalogue>>;
let document: LangiumDocument<Catalogue> | undefined;

beforeAll(async () => {
  services = createXsmpServices(EmptyFileSystem);
  parse = parseHelper<Catalogue>(services.xsmpcat);

  await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('SMP generator tests', () => {



  test('test catalogue', async () => {

    const generator = new SmpcatGenerator();
    document = await parse(fs.readFileSync(path.resolve(__dirname, 'test.xsmpcat')).toString(), { documentUri: 'test.xsmpcat' });

    // check for absensce of parser errors the classic way:
    //  deacivated, find a much more human readable way below!
    // expect(document.parseResult.parserErrors).toHaveLength(0);

    expect(
      // here we use a (tagged) template expression to create a human readable representation
      //  of the AST part we are interested in and that is to be compared to our expectation;
      // prior to the tagged template expression we check for validity of the parsed document object
      //  by means of the reusable function 'checkDocumentValid()' to sort out (critical) typos first;
      checkDocumentValid(document) ??
      generator.doGenerateCatalogue(document.parseResult.value)
    ).toBe(fs.readFileSync(path.resolve(__dirname,'test.smpcat')).toString());

    expect(
      // here we use a (tagged) template expression to create a human readable representation
      //  of the AST part we are interested in and that is to be compared to our expectation;
      // prior to the tagged template expression we check for validity of the parsed document object
      //  by means of the reusable function 'checkDocumentValid()' to sort out (critical) typos first;
      checkDocumentValid(document) ??
      generator.doGeneratePackage(document.parseResult.value)
    ).toBe(fs.readFileSync(path.resolve(__dirname, 'test.smppkg')).toString());
  });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
  return document.parseResult.parserErrors.length && s`
        Parser errors:
          ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
    `
    || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
    || !isCatalogue(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a '${Catalogue}'.`
    || undefined;
}