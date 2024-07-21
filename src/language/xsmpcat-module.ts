
import type { Module } from 'langium';
import { XsmpcatValidator } from './xsmpcat-validator.js';
import type { LangiumServices, PartialLangiumServices } from 'langium/lsp';
import { QualifiedNameProvider as XsmpcatQualifiedNameProvider } from './xsmpcat-naming.js';
import { XsmpcatScopeComputation, XsmpcatScopeProvider } from './xsmpcat-scope.js';

/**
 * Declaration of custom services - add your own service classes here.
 */
export type XsmpcatAddedServices = {
    references: {
        QualifiedNameProvider: XsmpcatQualifiedNameProvider
    },
    validation: {
        XsmpcatValidator: XsmpcatValidator
    }
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type XsmpcatServices = LangiumServices & XsmpcatAddedServices

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const XsmpcatModule: Module<XsmpcatServices, PartialLangiumServices & XsmpcatAddedServices> = {
    references: {

         ScopeProvider: (services) => new XsmpcatScopeProvider(services),
         ScopeComputation: (services) => new XsmpcatScopeComputation(services),
         QualifiedNameProvider: () => new XsmpcatQualifiedNameProvider()
     },
    validation: {
        XsmpcatValidator: () => new XsmpcatValidator()
    }
};

