import type { URI } from 'vscode-uri';

export const builtInScheme = 'xsmp';
export function isBuiltinLibrary(uri: URI): boolean {
    return uri.scheme === builtInScheme;
}
