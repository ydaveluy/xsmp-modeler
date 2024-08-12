
// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
    files: ['src/**/*.ts'],
    extends: [
        eslint.configs.recommended,
        ...tseslint.configs.recommended,
    ],
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            project: true,
        },
    },
    rules: {
        '@typescript-eslint/no-empty-object-type': 'off',
        "arrow-parens": ["off", "as-needed"],             // do not force arrow function parentheses
        "constructor-super": "error",                     // checks the correct use of super() in sub-classes
        "dot-notation": "error",                          // obj.a instead of obj['a'] when possible
        "eqeqeq": "error",                                // ban '==', don't use 'smart' option!
        "guard-for-in": "error",                          // needs obj.hasOwnProperty(key) checks
        "new-parens": "error",                            // new Error() instead of new Error
        //"no-bitwise": "error",                            // bitwise operators &, | can be confused with &&, ||
        "no-caller": "error",                             // ECMAScript deprecated arguments.caller and arguments.callee
        "no-cond-assign": "error",                        // assignments if (a = '1') are error-prone
        "no-debugger": "error",                           // disallow debugger; statements
        "no-eval": "error",                               // eval is considered unsafe
        "no-inner-declarations": "off",                   // we need to have 'namespace' functions when using TS 'export ='
        "no-labels": "error",                             // GOTO is only used in BASIC ;)
        "no-multiple-empty-lines": ["error", {"max": 1}], // two or more empty lines need to be fused to one
        "no-new-wrappers": "error",                       // there is no reason to wrap primitve values
        "no-throw-literal": "error",                      // only throw Error but no objects {}
        "no-trailing-spaces": "error",                    // trim end of lines
        "no-unsafe-finally": "error",                     // safe try/catch/finally behavior
        "no-var": "error",                                // use const and let instead of var
        "@typescript-eslint/no-var-requires": "error",              // use import instead of require
        "@typescript-eslint/prefer-for-of": "error",                // prefer for-of loop over arrays
        "@typescript-eslint/prefer-namespace-keyword": "error",     // prefer namespace over module in TypeScript
        "@typescript-eslint/triple-slash-reference": "error",       // ban /// <reference />, prefer imports
        "@typescript-eslint/consistent-type-imports": "error",       // use import type whenever import is only used for type checking
        "space-before-function-paren": ["error", {        // space in function decl: f() vs async () => {}
            "anonymous": "never",
            "asyncArrow": "always",
            "named": "never"
        }],
        "semi": [2, "always"],                            // Always use semicolons at end of statement
        "quotes": [2, "single", { "avoidEscape": true }], // Prefer single quotes
        "use-isnan": "error",                             // isNaN(i) Number.isNaN(i) instead of i === NaN

        "no-restricted-imports": ["error", {
            "paths": [{
                "name": "vscode-jsonrpc",
                "importNames": [ "CancellationToken" ],
                "message": "Import 'CancellationToken' via 'Cancellation.CancellationToken' from 'langium', or directly from './utils/cancellation.ts' within Langium."
            }, {
                "name": "vscode-jsonrpc/",
                "importNames": [ "CancellationToken"],
                "message": "Import 'CancellationToken' via 'Cancellation.CancellationToken' from 'langium', or directly from './utils/cancellation.ts' within Langium."
            }],
            "patterns": [ {
                "group": [ "vscode-jsonrpc" ],
                "importNamePattern": "^(?!CancellationToken)",
                "message": "Don't import types or symbols from 'vscode-jsonrpc' (package index), as that brings a large overhead in bundle size. Import from 'vscode-jsonrpc/lib/common/...js' and add a // eslint-disable..., if really necessary."
            }]
        }],
        // List of [@typescript-eslint rules](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#supported-rules)
        "@typescript-eslint/adjacent-overload-signatures": "error", // grouping same method names
        "@typescript-eslint/array-type": ["error", {                // string[] instead of Array<string>
            "default": "array-simple"
        }],
        "@typescript-eslint/no-inferrable-types": "off",            // don't blame decls like "index: number = 0", esp. in api signatures!
        "@typescript-eslint/no-explicit-any": "error",              // don't use :any type
        "@typescript-eslint/no-misused-new": "error",               // no constructors for interfaces or new for classes
        "@typescript-eslint/no-namespace": "off",                   // disallow the use of custom TypeScript modules and namespaces 
        "@typescript-eslint/no-non-null-assertion": "off",          // allow ! operator
        "@typescript-eslint/parameter-properties": "error",          // no property definitions in class constructors
        "@typescript-eslint/no-unused-vars": ["error", {            // disallow Unused Variables
            "argsIgnorePattern": "^_"
        }],
    },
});

