
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
        '@typescript-eslint/no-unused-vars': 'off',
    },
});

