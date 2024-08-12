
import { describe, test, afterEach, beforeAll } from 'vitest';
import type { LangiumDocument, AsyncDisposable } from 'langium';
import { EmptyFileSystem } from 'langium';
import { clearDocuments, expectCompletion, ExpectedCompletion } from 'langium/test';
import { createXsmpServices } from '../../src/language/xsmp-module.js';
import { Catalogue } from '../../src/language/generated/ast.js';

let services: ReturnType<typeof createXsmpServices>;
let document: LangiumDocument<Catalogue> | undefined;

let completion: (expectedCompletion: ExpectedCompletion) => Promise<AsyncDisposable>;

beforeAll(async () => {
    services = createXsmpServices(EmptyFileSystem);
    completion = expectCompletion(services.xsmpcat);
});

afterEach(async () => {
    document && clearDocuments(services.shared, [document]);
});


describe('Xsmpcat completion provider', () => {

    const text = `
    <|>
    catalogue name
    <|>
    namespace Smp
    {
        public primitive Bool
        public primitive Int8
        public primitive Int16
        public primitive Int32
        public primitive Int64
        public primitive UInt8
        public primitive UInt16
        public primitive UInt32
        public primitive UInt64
        public primitive Float32
        public primitive Float64
        public primitive Char8
        public primitive String8
        public primitive Duration
        public primitive DateTime

        <|>
    }
    namespace Attribute {public attribute <|>Bool AnAttribute = <|> false}
    namespace Type 
    { 
        model MyModel {<|>}
    }
    `;


    test('Complete Catalogue', async () => {
        await completion({
            text,
            index: 0,
            expectedItems: [
                'catalogue', 'catalogue'
            ]
        });
    });
    test('Complete Namespace', async () => {
        await completion({
            text,
            index: 1,
            expectedItems: [
                'namespace', 'namespace'
            ]
        });
    });

    test('Complete Type', async () => {
        await completion({
            text,
            index: 2,
            expectedItems: [
                'namespace', 'struct', 'class', 'exception', 'interface', 'model', 'service', 'array', 'using', 'integer',
                'float', 'event', 'string', 'native', 'attribute', 'enum', 'namespace', 'private', 'protected', 'public',
                'struct', 'abstract', 'class', 'exception', 'interface', 'model', 'service', 'array', 'using', 'integer',
                'float', 'event', 'string', 'primitive', 'native', 'attribute', 'enum',
            ]
        });
    });
    test('Complete Attribute Type', async () => {
        await completion({
            text,
            index: 3,
            expectedItems: [
                'Bool', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt8', 'UInt16', 'UInt32', 'UInt64', 'Float32', 'Float64', 'Char8',
                'String8', 'Duration', 'DateTime', 'Smp.Bool', 'Smp.Int8', 'Smp.Int16', 'Smp.Int32', 'Smp.Int64', 'Smp.UInt8',
                'Smp.UInt16', 'Smp.UInt32', 'Smp.UInt64', 'Smp.Float32', 'Smp.Float64', 'Smp.Char8', 'Smp.String8', 'Smp.Duration',
                'Smp.DateTime',
            ]
        });
    });

    test('Complete Attribute value', async () => {
        await completion({
            text,
            index: 4,
            expectedItems: [
                'Default Value', 'false', 'true', 'nullptr',
            ]
        });
    });

    test('Complete Model member', async () => {
        await completion({
            text,
            index: 5,
            expectedItems: [
                'constant', 'field', 'property', 'def', 'association', 'container', 'reference', 'entrypoint',
                 'eventsink', 'eventsource', 'private', 'protected', 'public', 'constant', 'input', 'output', 
                 'transient', 'field', 'readWrite', 'readOnly', 'writeOnly', 'property', 'def', 'association', 
                 'container', 'reference', 'entrypoint', 'eventsink', 'eventsource',
            ]
        });
    });


});