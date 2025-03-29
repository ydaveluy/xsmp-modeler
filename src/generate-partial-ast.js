
import * as fs from 'fs'

const INPUT_FILE = "./src/language/generated/ast.ts";
const OUTPUT_FILE = "./src/language/generated/ast-partial.ts";

const content = fs.readFileSync(INPUT_FILE, "utf-8");

const typeRegex = /export\s+(?:interface|type)\s+(\w+)/g;
const functionRegex = /export\s+function\s+(is\w+)\s*\(/g;
const constRegex = /export\s+const\s+(\w+)\s*=/g;

const types = [...content.matchAll(typeRegex)].map(match => match[1]);

const functions = [...content.matchAll(functionRegex)].map(match => match[1]);

const constants = [...content.matchAll(constRegex)].map(match => match[1]);

const output = `import * as ast from './ast.js';
import * as langium from 'langium';

export type DeepPartialAstNode<T> =
    // if T is a Reference<U> transform it to langium.Reference<DeepPartialAstNode<U>>
    T extends langium.Reference<infer U extends langium.AstNode> ? langium.Reference<DeepPartialAstNode<U>> :
        // if T is an AstNode
        T extends langium.AstNode ? {
            // transform the type of each property starting with '$' or with a boolean or array type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [K in keyof T as K extends \`$\${string}\` | (T[K] extends (boolean | any[]) ? K : never) ? K : never]: DeepPartialAstNode<T[K]>;
        } & {
            // force the property as optional and transform its type for each property not starting with '$' or with a type different from boolean or array type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [K in keyof T as K extends \`$\${string}\` ? never: T[K] extends (boolean | any[]) ? never : K]?: DeepPartialAstNode<T[K]>;
        } :
            // if T is an Array<U> convert to Array<DeepPartialAstNode<U>>
            T extends Array<infer U> ? Array<DeepPartialAstNode<U>> :
                // otherwise keep T as is
                T;
${types.map(type => `export type ${type} = DeepPartialAstNode<ast.${type}>;`).join("\n")}

${functions.map(fn => `export function ${fn}(item: unknown): item is ${fn.slice(2)} {\n    return ast.${fn}(item);\n}`).join("\n")}

${constants.map(constName => `export const ${constName} = ast.${constName};`).join("\n")}

`;

fs.writeFileSync(OUTPUT_FILE, output, "utf-8");