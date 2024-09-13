
import type { Module } from 'langium';
import { XsmpcatValidator } from './validation/xsmpcat-validator.js';
import type { LangiumServices, PartialLangiumServices } from 'langium/lsp';
import { XsmpcatScopeComputation, XsmpcatScopeProvider } from './references/xsmpcat-scope.js';
import { XsmpcatFormatter } from './lsp/xsmpcat-formatter.js';
import { XsmpHoverProvider } from './lsp/hover-provider.js';
import { XsmpDocumentSymbolProvider } from './lsp/document-symbol-provider.js';
import { XsmpcatCompletionProvider } from './lsp/xsmpcat-completion-provider.js';
import { XsmpValueConverter } from './parser/value-converter.js';
import { XsmpcatCodeActionProvider } from './lsp/xsmpcat-code-action.js';
import { XsmpCommentProvider } from './lsp/comment-provider.js';
import { XsmpcatTypeDefinitionProvider } from './lsp/xsmpcat-type-provider.js';
import { XsmpcatTypeHierarchyProvider } from './lsp/xsmpcat-type-hierarchy-provider.js';
import type { XsmpSharedServices } from './xsmp-module.js';
import { XsmpDocumentationProvider } from './lsp/documentation-provider.js';
import { XsmpcatFoldingRangeProvider } from './lsp/xsmpcat-folding-range-provider.js';

/**
 * Declaration of Xsmp services.
 */
export interface XsmpcatAddedServices {
    readonly validation: {
        readonly XsmpcatValidator: XsmpcatValidator
    },
}

/**
 * Union of Langium default services and Xsmp custom services.
 */
export type XsmpcatServices = LangiumServices & XsmpcatAddedServices & { shared: XsmpSharedServices; }

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the Xsmp services must be fully specified.
 */
export const XsmpcatModule: Module<XsmpcatServices, PartialLangiumServices & XsmpcatAddedServices> = {
    references: {
        ScopeProvider: (services) => new XsmpcatScopeProvider(services),
        ScopeComputation: (services) => new XsmpcatScopeComputation(services),
    },
    validation: {
        XsmpcatValidator: (services) => new XsmpcatValidator(services)
    },
    lsp: {
        Formatter: () => new XsmpcatFormatter(),
        HoverProvider: (services) => new XsmpHoverProvider(services),
        DocumentSymbolProvider: (services) => new XsmpDocumentSymbolProvider(services),
        CompletionProvider: (services) => new XsmpcatCompletionProvider(services),
        CodeActionProvider: (services) => new XsmpcatCodeActionProvider(services),
        TypeProvider: (services) => new XsmpcatTypeDefinitionProvider(services),
        TypeHierarchyProvider: (services) => new XsmpcatTypeHierarchyProvider(services),
        FoldingRangeProvider: (services) => new XsmpcatFoldingRangeProvider(services),
    },
    parser:
    {
        ValueConverter: () => new XsmpValueConverter(),
    },
    documentation: {
        CommentProvider: (services) => new XsmpCommentProvider(services),
        DocumentationProvider: (services) => new XsmpDocumentationProvider(services),
    },
};

