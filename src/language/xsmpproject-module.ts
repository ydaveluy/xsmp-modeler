
import type { Module } from 'langium';
import { XsmpprojectValidator } from './xsmpproject-validator.js';
import type { LangiumServices, PartialLangiumServices } from 'langium/lsp';

/**
 * Declaration of custom services - add your own service classes here.
 */
export type XsmpprojectAddedServices = {
    validation: {
        XsmpprojectValidator: XsmpprojectValidator
    }
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type XsmpprojectServices = LangiumServices & XsmpprojectAddedServices

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const XsmpprojectModule: Module<XsmpprojectServices, PartialLangiumServices & XsmpprojectAddedServices> = {
    validation: {
        XsmpprojectValidator: () => new XsmpprojectValidator()
    }
};