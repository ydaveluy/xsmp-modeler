import { DeepPartial, inject, Module } from 'langium';
import { createDefaultModule, createDefaultSharedModule, type DefaultSharedModuleContext, type LangiumSharedServices } from 'langium/lsp';
import { XsmpGeneratedSharedModule, XsmpcatGeneratedModule, XsmpprojectGeneratedModule } from './generated/module.js';
import type { XsmpprojectServices } from './xsmpproject-module.js';
import { XsmpprojectModule } from './xsmpproject-module.js';
import { registerXsmpcatValidationChecks } from './validation/xsmpcat-validator.js';
import type { XsmpcatServices } from './xsmpcat-module.js';
import { XsmpcatModule } from './xsmpcat-module.js';
import { registerXsmpprojectValidationChecks } from './validation/xsmpproject-validator.js';
import { XsmpWorkspaceManager } from './workspace/workspace-manager.js';
import { XsmpIndexManager } from './workspace/index-manager.js';
import { XsmpNodeKindProvider } from './lsp/node-kind-provider.js';
import { XsmpDocumentBuilder } from './workspace/document-builder.js';
import { XsmpLangiumDocuments } from './workspace/documents.js';

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the Xsmp services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createXsmpServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    xsmpproject: XsmpprojectServices,
    xsmpcat: XsmpcatServices,
} {
    const shared = inject(
        createDefaultSharedModule(context),
        XsmpGeneratedSharedModule,
        XsmpSharedModule,
    );
    // XSMP Project
    const xsmpproject = inject(
        createDefaultModule({ shared }),
        XsmpprojectGeneratedModule,
        XsmpprojectModule
    );
    shared.ServiceRegistry.register(xsmpproject);
    registerXsmpprojectValidationChecks(xsmpproject);

    // XSMP Catalogue
    const xsmpcat = inject(
        createDefaultModule({ shared }),
        XsmpcatGeneratedModule,
        XsmpcatModule
    );
    shared.ServiceRegistry.register(xsmpcat);
    registerXsmpcatValidationChecks(xsmpcat);

    if (!context.connection) {
        // We don't run inside a language server
        // Therefore, initialize the configuration provider instantly
        shared.workspace.ConfigurationProvider.initialized({});
    }
    return { shared, xsmpproject, xsmpcat };
}
/**
 * Declaration of custom shared services 
 */
export type XsmpAddedSharedServices = {
}

/**
 * Union of Langium default shared services and Xsmp custom shared services
 */
export type XsmpSharedServices = LangiumSharedServices & XsmpAddedSharedServices


export const XsmpSharedModule: Module<XsmpSharedServices, DeepPartial<XsmpSharedServices>> = {
    workspace: {
        DocumentBuilder: (services) => new XsmpDocumentBuilder(services),
        WorkspaceManager: (services) => new XsmpWorkspaceManager(services),
        IndexManager: (services) => new XsmpIndexManager(services),
        LangiumDocuments: (services) => new XsmpLangiumDocuments(services)
    },
    lsp: {
        NodeKindProvider: () => new XsmpNodeKindProvider(),
    },
}