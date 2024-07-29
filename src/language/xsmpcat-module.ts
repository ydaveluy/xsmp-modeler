
import type { Module } from 'langium';
import { XsmpcatValidator } from './validation/xsmpcat-validator.js';
import type { LangiumServices, PartialLangiumServices } from 'langium/lsp';
import { XsmpcatScopeComputation, XsmpcatScopeProvider } from './references/xsmpcat-scope.js';
import { XsmpcatFormatter } from './lsp/xsmpcat-formatter.js';
import { XsmpHoverProvider } from './lsp/hover-provider.js';
import { XsmpUtils } from './utils/xsmp-utils.js';
import { XsmpDocumentSymbolProvider } from './lsp/document-symbol-provider.js';

/**
 * Declaration of Xsmp services.
 */
export type XsmpcatAddedServices = {
    validation: {
        XsmpcatValidator: XsmpcatValidator
    },
    XsmpUtils:XsmpUtils
}

/**
 * Union of Langium default services and Xsmp custom services.
 */
export type XsmpcatServices = LangiumServices & XsmpcatAddedServices

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
        DocumentSymbolProvider:  (services) => new XsmpDocumentSymbolProvider(services),
    },
    XsmpUtils:(services) => new XsmpUtils(services)
};

