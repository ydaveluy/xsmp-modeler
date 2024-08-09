
import { type Module } from 'langium';
import { XsmpprojectValidator } from './validation/xsmpproject-validator.js';
import type { LangiumServices, PartialLangiumServices } from 'langium/lsp';
import { XsmpprojectFormatter } from './lsp/xsmpproject-formatter.js';
import { XsmpHoverProvider } from './lsp/hover-provider.js';
import { XsmpDocumentSymbolProvider } from './lsp/document-symbol-provider.js';
import { XsmpprojectCompletionProvider } from './lsp/xsmpproject-completion-provider.js';

/**
 * Declaration of custom services.
 */
export type XsmpprojectAddedServices = {
    validation: {
        XsmpprojectValidator: XsmpprojectValidator
    },
}

/**
 * Union of Langium default services and your custom services.
 */
export type XsmpprojectServices = LangiumServices & XsmpprojectAddedServices

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the Xsmp services must be fully specified.
 */
export const XsmpprojectModule: Module<XsmpprojectServices, PartialLangiumServices & XsmpprojectAddedServices> = {
    validation: {
        XsmpprojectValidator: () => new XsmpprojectValidator()
    },
    lsp: {
        Formatter: () => new XsmpprojectFormatter(),
        HoverProvider: (services) => new XsmpHoverProvider(services),
        DocumentSymbolProvider: (services) => new XsmpDocumentSymbolProvider(services),
        CompletionProvider: (services) => new XsmpprojectCompletionProvider(services),
    },
};