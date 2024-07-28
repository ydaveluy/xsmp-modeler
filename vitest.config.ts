/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://vitest.dev/config/
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
         coverage: {
             provider: 'v8',
             reporter: ['text', 'lcov', 'html'],
             include: ['src'],
             exclude: ['**/generated'],
         },
        deps: {
            interopDefault: true
        },
        reporters: [
            ['vitest-sonar-reporter', { outputFile: 'sonar-report.xml' }],
        ],
        include: ['test/**/*.test.ts']
    }
});
