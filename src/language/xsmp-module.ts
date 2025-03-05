import { inject } from 'langium';
import type { DeepPartial, Module } from 'langium';
import type { LangiumServices } from 'langium/lsp';
import { type DefaultSharedModuleContext, type LangiumSharedServices, createDefaultModule, createDefaultSharedModule } from 'langium/lsp';
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
import { XsmpDocumentGenerator } from './workspace/document-generator.js';
import { XsmpDocumentUpdateHandler } from './lsp/document-update-handler.js';
import { XsmpTypeProvider } from './references/type-provider.js';
import { XsmpNodeInfoProvider } from './lsp/node-info-provider.js';
import { XsmpServiceRegistry } from './lsp/service-registry.js';
import { DocumentationHelper } from './utils/documentation-helper.js';
import { AttributeHelper } from './utils/attribute-helper.js';
import { QualifiedNameProvider } from './naming/xsmp-naming.js';

export type XsmpServices = LangiumServices & { shared: XsmpSharedServices; }
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
    shared: XsmpSharedServices,
    xsmpcat: XsmpcatServices,
    xsmpproject: XsmpprojectServices,
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
    return { shared, xsmpcat, xsmpproject, };
}
/**
 * Declaration of custom shared services
 */
export interface XsmpAddedSharedServices {
    readonly DocumentGenerator: XsmpDocumentGenerator,
    readonly TypeProvider: XsmpTypeProvider,
    readonly lsp: {
        readonly NodeInfoProvider: XsmpNodeInfoProvider,
    },
    readonly references: {
        readonly QualifiedNameProvider: QualifiedNameProvider,
    },
    readonly DocumentationHelper: DocumentationHelper,
    readonly AttributeHelper: AttributeHelper,
}

/**
 * Union of Langium default shared services and Xsmp custom shared services
 */
export type XsmpSharedServices = LangiumSharedServices & XsmpAddedSharedServices;

export const XsmpSharedModule: Module<XsmpSharedServices, DeepPartial<XsmpSharedServices>> = {
    AttributeHelper: (services) => new AttributeHelper(services),
    DocumentGenerator: (services) => new XsmpDocumentGenerator(services),
    DocumentationHelper: (services) => new DocumentationHelper(services),
    TypeProvider: (services) => new XsmpTypeProvider(services),
    lsp: {
        DocumentUpdateHandler: (services) => new XsmpDocumentUpdateHandler(services),
        NodeInfoProvider: (services) => new XsmpNodeInfoProvider(services),
        NodeKindProvider: () => new XsmpNodeKindProvider(),
    },
    references: {
        QualifiedNameProvider: () => new QualifiedNameProvider()
    },
    workspace: {
        DocumentBuilder: (services) => new XsmpDocumentBuilder(services),
        IndexManager: (services) => new XsmpIndexManager(services),
        LangiumDocuments: (services) => new XsmpLangiumDocuments(services),
        WorkspaceManager: (services) => new XsmpWorkspaceManager(services),
    },
    ServiceRegistry: (services) => new XsmpServiceRegistry(services),
};