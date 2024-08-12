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
 [26:10..26:13]: An Element Name shall start with a letter.
 [52:1..52:19]: Duplicated annotation of a non-repeatable type. Only annotation types marked with '@allowMultiple' can be used multiple times on a single target.
 [53:1..53:19]: This annotation is disallowed for element of type PrimitiveType.
 [52:1..52:19]: A value is required.
 [104:47..104:51]: The PrimitiveType Smp.Bool is not visible.
 [104:22..104:32]: A Parameter shall not be both ByPointer and ByReference.
 [3:9..3:21]: Invalid date format (e.g: 1970-01-01T00:00:00Z).
 [16:4..16:11]: Missing Type UUID.
 [23:4..23:13]: Missing Type UUID.
 [23:14..23:18]: Duplicated Type name.
 [29:4..29:11]: Missing Type UUID.
 [40:19..40:28]: Missing Type UUID.
 [48:11..48:20]: Missing Type UUID.
 [54:1..54:10]: Missing Type UUID.
 [56:21..56:27]: Missing Type UUID.
 [58:8..58:40]: A Constant must have an initialization value.
 [64:4..66:5]: An Enumeration shall contains at least one literal.
 [71:8..71:10]: Duplicated literal name.
 [71:13..71:14]: Enumeration Literal Values shall be unique within an Enumeration.
 [74:26..74:33]: Expecting an Integral Type.
 [77:22..77:23]: Minimum shall be less or equal than Maximum.
 [81:26..81:31]: Expecting a Floating Point  Type.
 [84:22..84:25]: Minimum shall be less or equal than Maximum.
 [88:22..88:25]: Minimum shall be less than Maximum.
 [90:14..90:50]: Duplicated UUID.
 [96:4..96:10]: Missing Type UUID.
 [98:4..98:13]: Missing Type UUID.
 [101:8..101:15]: An Operation of an Interface shall not be static.
 [102:8..102:16]: An Operation shall not be both Static and Virtual.
 [103:8..103:17]: An Operation shall not be both Static and Abstract.
 [104:79..104:94]: Duplicated parameter name.
 [104:146..104:147]: Duplicated parameter name.
 [104:138..104:147]: The Parameter requires a default vallue.
 [104:74..104:78]: The PrimitiveType Smp.Bool is not visible.
 [104:123..104:127]: The PrimitiveType Smp.Bool is not visible.
 [104:96..104:106]: A Parameter shall not be both ByPointer and ByReference.
 [104:141..104:145]: The PrimitiveType Smp.Bool is not visible.
 [110:61..110:65]: Expecting a Field.
 [106:8..106:15]: A Property of an Interface shall not be static.
 [107:8..107:16]: A Property shall not be both Static and Virtual.
 [108:8..108:17]: A Property shall not be both Static and Abstract.
 [106:8..106:15]: A Property shall not be Static if the attached field is not Static.
 [114:4..114:9]: Missing Type UUID.
 [116:39..116:89]: Binary operator '+' is not supported for operands of type 'Float64' and 'String8'.
 [117:25..117:34]: Deprecated.
 [118:38..118:40]: A 'Char8' shall contain exactly one character.
 [119:38..119:45]: A 'Char8' shall contain exactly one character.
 [120:38..120:48]: A 'Char8' shall contain exactly one character.
 [126:53..126:65]: Duplicated exception.
 [127:30..127:34]: The PrimitiveType Smp.Bool is not visible.
 [128:30..128:34]: The PrimitiveType Smp.Bool is not visible.
 [133:14..133:35]: The Integer hidden.privateInteger is not visible.
 [137:137..137:138]: Deprecated.
 [137:137..137:138]: The Type of the AttachedField shall match the Type of the Property.
 [137:84..137:96]: Duplicated exception.
 [137:121..137:133]: Duplicated exception.
 [135:8..135:18]: A Property shall not be both ByPointer and ByReference.
 [141:11..141:12]: Deprecated.
 [141:11..141:12]: Field is not an Input.
 [143:11..143:18]: Expecting a Field.
 [142:12..142:13]: Deprecated.
 [142:12..142:13]: Field is not an Output.
 [144:12..144:19]: Expecting a Field.
 [150:29..150:31]: Lower bound shall be a positive number or 0.
 [152:29..152:31]: Lower bound shall be a positive number or 0.
 [152:29..152:31]: Lower bound shall be less or equal to the upper bound, if present.
 Upper bound shall be -1 or larger or equal to the lower bound.
 [153:29..153:30]: Lower bound shall be less or equal to the upper bound, if present.
 Upper bound shall be -1 or larger or equal to the lower bound.
 [160:4..160:9]: Missing Type UUID.
 [163:36..163:37]: The Field is not visible.
 [163:36..163:37]: Deprecated.
 [163:36..163:37]: The Type of the AttachedField shall match the Type of the Property.
 [166:18..166:22]: The type PrimitiveType is not a sub type of EventType.
 [167:20..167:24]: The type PrimitiveType is not a sub type of EventType.
 [172:4..172:9]: Missing Type UUID.
 [176:37..176:41]: The PrimitiveType Smp.Bool is not visible.
 [179:17..179:21]: The PrimitiveType Smp.Bool is not visible.
 [182:4..182:9]: Missing Type UUID.
 [187:4..187:13]: Missing Type UUID.
 [190:17..190:21]: The PrimitiveType Smp.Bool is not visible.
 [193:4..193:9]: Missing Type UUID.
 [195:4..195:9]: Missing Type UUID.
 [197:4..197:9]: Missing Type UUID.
 [201:4..201:9]: Missing Type UUID.
 [203:4..203:9]: Missing Type UUID.
 [205:4..205:9]: Missing Type UUID.
 [207:4..207:9]: Missing Type UUID.
 [209:4..209:10]: Missing Type UUID.
 [232:31..232:33]: Partial initialization, the array type expect 3 element(s), got 0 element(s).
 [233:38..233:39]: The array type expect 3 element(s), got 4 element(s).
 [235:31..235:35]: An array shall be initialized with a collection.
 [236:34..236:35]: Invalid field name, expecting x.
 [236:54..236:55]: Invalid field name, expecting z.
 [237:32..237:42]: Partial initialization, the structure type expect 3 element(s), got 1 element(s).
 [238:39..238:40]: The structure type expect 3 element(s), got 4 element(s).
 [239:32..239:36]: A Structure shall be initialized with a collection.
 [240:26..240:29]: Int32 cannot be converted to Smp.Int8.
 [242:36..242:50]: Conversion overflow for type Int32.
 [243:29..243:33]: RangeError: Division by zero
 [247:14..247:18]: The PrimitiveType Smp.Bool is not visible.
 [248:41..248:44]: Unary operator '-' is not supported for operand of type 'String8'.
 [248:47..248:50]: Unary operator '!' is not supported for operand of type 'String8'.
 [248:53..248:56]: Unary operator '+' is not supported for operand of type 'String8'.
 [248:59..248:62]: Unary operator '~' is not supported for operand of type 'String8'.
 [14:4..14:11]: Missing Type UUID.
 [29:30..29:38]: The type Structure is not a sub type of Service.
 [29:4..29:11]: The Service shall be abstract.
 [40:11..40:18]: Illegal modifier.
 [40:29..40:33]: The PrimitiveType Smp.Bool is not visible.
 [40:34..40:49]: Default value is missing.
 [48:21..48:25]: The PrimitiveType Smp.Bool is not visible.
 [44:14..44:19]: Duplicated usage.
 [45:14..45:21]: Invalid usage.
 [54:11..54:16]: Unsupported Primitive Type.
 [56:11..56:20]: Illegal modifier.
 [58:8..58:14]: Invalid modifier.
 [60:36..60:44]: Recursive Field Type.
 [64:4..64:8]: Missing Type UUID.
 [68:4..68:8]: Missing Type UUID.
 [74:4..74:11]: Missing Type UUID.
 [77:4..77:11]: Missing Type UUID.
 [80:14..80:22]: The UUID is invalid.
 [84:4..84:9]: Missing Type UUID.
 [84:10..84:18]: Duplicated Type name.
 [87:14..87:50]: Duplicated UUID.
 [88:10..88:18]: Duplicated Type name.
 [91:20..91:22]: The String length shall be a positive number.
 [96:4..96:22]: Missing String length.
 [98:46..98:56]: Duplicated interface.
 [98:58..98:69]: Cyclic dependency detected.
 [100:8..100:15]: Invalid modifier.
 [104:8..104:17]: Invalid modifier.
 [110:24..110:33]: Illegal modifier.
 [110:17..110:23]: Invalid modifier.
 [114:26..114:33]: Cyclic dependency detected.
 [114:58..114:69]: Duplicated interface.
 [118:31..118:35]: Duplicated identifier.
 [119:31..119:35]: Duplicated identifier.
 [120:31..120:35]: Duplicated identifier.
 [121:31..121:35]: Duplicated identifier.
 [123:36..123:40]: Duplicated identifier.
 [128:27..128:29]: Duplicated identifier.
 [137:49..137:57]: Duplicated identifier.
 [137:24..137:33]: Illegal modifier.
 [114:4..114:9]: The Model shall be abstract.
 [146:17..146:24]: The type Model is not a sub type of Interface.
 [193:4..193:30]: Missing Array size.
 [193:20..193:28]: The type Model is not a sub type of ValueType.
 [195:26..195:28]: The Array size shall be a positive number.
 [197:27..197:41]: Recursive Array Type.
 [201:27..201:35]: An array annotated with '@SimpleArray' requires a SimpleType item type.
 [205:28..205:36]: The type Model is not a sub type of SimpleType.
 [207:21..207:36]: The type AttributeType is not a sub type of ValueType.
 [209:11..209:21]: The javadoc '@type' tag shall be defined.
 [16:12..16:21]: Duplicated Service name.
 [29:12..29:21]: Duplicated Service name.
 [172:24..172:32]: The type Model is not a sub type of Class.
 [177:14..177:19]: Recursive Field Type.
 [172:4..172:9]: The Class shall be abstract.
 [182:25..182:31]: Cyclic dependency detected.
 [187:35..187:41]: The type Class is not a sub type of Exception.
 [187:4..187:13]: The Exception shall be abstract.
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