
import type { AstNode, AstNodeDescription, AstNodeDescriptionProvider, AstReflection, IndexManager, LangiumCoreServices, LangiumDocument, LangiumDocuments, PrecomputedScopes, Reference, ReferenceInfo, Scope, ScopeComputation, ScopeProvider, Stream, URI } from 'langium';
import type { XsmpcatServices } from '../xsmpcat-module.js';
import * as ast from '../generated/ast.js';
import { AstUtils, Cancellation, DocumentCache, EMPTY_SCOPE, MultiMap, WorkspaceCache, interruptAndCheck, stream } from 'langium';
import * as ProjectUtils from '../utils/project-utils.js';
import type { XsmpTypeProvider } from './type-provider.js';
import * as XsmpUtils from '../utils/xsmp-utils.js';
import { VisibilityKind } from '../utils/visibility-kind.js';

export class XsmpcatScopeComputation implements ScopeComputation {

    protected readonly descriptions: AstNodeDescriptionProvider;

    constructor(services: LangiumCoreServices) {
        this.descriptions = services.workspace.AstNodeDescriptionProvider;
    }

    async computeExports(document: LangiumDocument, cancelToken = Cancellation.CancellationToken.None): Promise<AstNodeDescription[]> {
        const catalogue = document.parseResult.value as ast.Catalogue,
            exportedDescriptions: AstNodeDescription[] = [];
        //Export the Catalogue
        if (catalogue.name) {
            exportedDescriptions.push(this.descriptions.createDescription(catalogue, catalogue.name, document));
        }
        for (const namespace of catalogue.elements) {
            await interruptAndCheck(cancelToken);
            if (namespace.name) {
                await this.computeNamespaceExports(document, namespace, exportedDescriptions, namespace.name, cancelToken);
            }
        }
        return exportedDescriptions;
    }

    async computeNamespaceExports(document: LangiumDocument, namespace: ast.Namespace, exportedDescriptions: AstNodeDescription[], baseName: string, cancelToken: Cancellation.CancellationToken) {
        //Export the Namespace
        exportedDescriptions.push(this.descriptions.createDescription(namespace, baseName, document));
        for (const element of namespace.elements) {
            if (element.name) {
                await interruptAndCheck(cancelToken);
                const elementName = `${baseName}.${element.name}`;
                if (ast.isType(element)) {
                    this.computeTypeExports(document, element, exportedDescriptions, elementName);
                }
                else {
                    await this.computeNamespaceExports(document, element, exportedDescriptions, elementName, cancelToken);
                }
            }
        }
    }
    computeTypeExports(document: LangiumDocument, type: ast.Type, exportedDescriptions: AstNodeDescription[], typeName: string) {
        //Export the Type
        exportedDescriptions.push(this.descriptions.createDescription(type, typeName, document));

        if (ast.isEnumeration(type)) {
            const elementBaseName = `${typeName}.`;
            for (const literal of type.literal) { // Export the literals
                if (literal.name) {
                    exportedDescriptions.push(this.descriptions.createDescription(literal, elementBaseName + literal.name, document));
                }
            }

        } else if (ast.isStructure(type) || ast.isReferenceType(type)) {
            const elementBaseName = `${typeName}.`;
            for (const member of type.elements) {
                if (member.name && ast.isConstant(member) && XsmpUtils.getRealVisibility(member) === VisibilityKind.public) { // Export only public constants
                    exportedDescriptions.push(this.descriptions.createDescription(member, elementBaseName + member.name, document));
                }
            }
        }
    }

    async computeLocalScopes(document: LangiumDocument, cancelToken = Cancellation.CancellationToken.None): Promise<PrecomputedScopes> {
        const catalogue = document.parseResult.value as ast.Catalogue,
            scopes = new MultiMap<AstNode, AstNodeDescription>(),

            localDescriptions: AstNodeDescription[] = [];
        for (const namespace of catalogue.elements) {
            if (namespace.name) {
                const nestedDescriptions = await this.computeNamespaceLocalScopes(namespace, scopes, document, cancelToken);
                nestedDescriptions.forEach(description => {
                    localDescriptions.push(this.createAliasDescription(namespace, description));
                });
            }
        }
        scopes.addAll(catalogue, localDescriptions);

        return scopes;
    }

    protected async computeNamespaceLocalScopes(
        namespace: ast.Namespace,
        scopes: PrecomputedScopes,
        document: LangiumDocument,
        cancelToken: Cancellation.CancellationToken
    ): Promise<AstNodeDescription[]> {
        const localDescriptions: AstNodeDescription[] = [];

        for (const element of namespace.elements) {
            if (!element.name) { continue; }
            await interruptAndCheck(cancelToken);
            if (ast.isType(element)) {
                // Add the type to local scope
                localDescriptions.push(this.descriptions.createDescription(element, element.name, document));

                if (ast.isEnumeration(element)) {

                    const nestedDescriptions = element.literal.map(literal =>
                        this.descriptions.createDescription(literal, literal.name, document)
                    );
                    scopes.addAll(element, nestedDescriptions);

                    nestedDescriptions.forEach(description => {
                        localDescriptions.push(this.createAliasDescription(element, description));
                    });
                } else if (ast.isStructure(element) || ast.isReferenceType(element)) {
                    const nestedDescriptions: AstNodeDescription[] = [],
                        internalDescriptions: AstNodeDescription[] = [];

                    // Constants are exported to parent scopes whereas fields are local
                    element.elements.forEach(member => {
                        if (ast.isConstant(member) && member.name) {
                            nestedDescriptions.push(this.descriptions.createDescription(member, member.name, document));
                        }
                        else if (ast.isField(member) && member.name) {
                            internalDescriptions.push(this.descriptions.createDescription(member, member.name, document));
                        }
                    });

                    scopes.addAll(element, [...nestedDescriptions, ...internalDescriptions]);
                    nestedDescriptions.forEach(nestedDescription => {
                        localDescriptions.push(this.createAliasDescription(element, nestedDescription));
                    });
                }
            } else {
                const nestedDescriptions = await this.computeNamespaceLocalScopes(element, scopes, document, cancelToken);
                nestedDescriptions.forEach(description => {
                    localDescriptions.push(this.createAliasDescription(element, description));
                });
            }
        }

        scopes.addAll(namespace, localDescriptions);
        return localDescriptions;
    }

    private createAliasDescription(
        element: ast.NamedElement,
        description: AstNodeDescription
    ): AstNodeDescription {
        // Override the name
        return { ...description, name: `${element.name}.${description.name}` };
    }

}

export class XsmpcatScopeProvider implements ScopeProvider {
    protected documents: LangiumDocuments;
    protected readonly visibleUris: WorkspaceCache<URI, Set<string> | undefined>;
    protected readonly reflection: AstReflection;
    protected readonly indexManager: IndexManager;
    protected readonly typeProvider: XsmpTypeProvider;
    protected readonly globalScopeCache: WorkspaceCache<URI, Scope>;
    protected readonly contexts: Set<Reference> = new Set<Reference>();
    protected readonly precomputedCache: DocumentCache<AstNode, Map<string, AstNodeDescription>>;

    constructor(services: XsmpcatServices) {
        this.documents = services.shared.workspace.LangiumDocuments;
        this.visibleUris = new WorkspaceCache<URI, Set<string> | undefined>(services.shared);
        this.reflection = services.shared.AstReflection;
        this.indexManager = services.shared.workspace.IndexManager;
        this.typeProvider = services.shared.TypeProvider;
        this.globalScopeCache = new WorkspaceCache<URI, Scope>(services.shared);
        this.precomputedCache = new DocumentCache<AstNode, Map<string, AstNodeDescription>>(services.shared);
    }

    protected collectScopesFromNode(node: AstNode, scopes: Array<Map<string, AstNodeDescription>>,
        document: LangiumDocument) {

        const precomputed = this.getPrecomputedScope(node, document);
        if (precomputed.size > 0) {
            scopes.push(precomputed);
        }
        if (ast.isComponent(node)) {
            if (node.base) {
                this.collectScopesFromReference(node.base, scopes);
            }
            node.interface.forEach(i => { this.collectScopesFromReference(i, scopes); });
        }
        else if (ast.isClass(node) && node.base) {
            this.collectScopesFromReference(node.base, scopes);
        }
        else if (ast.isInterface(node)) {
            node.base.forEach(i => { this.collectScopesFromReference(i, scopes); });
        }
    }
    protected collectScopesFromReference(node: Reference, scopes: Array<Map<string, AstNodeDescription>>) {
        // Check if the node is currently processed to avoid cyclic dependency
        if (!this.contexts.has(node) && node.ref) {
            this.contexts.add(node);
            try {
                this.collectScopesFromNode(node.ref, scopes, AstUtils.getDocument(node.ref));
            }
            finally {
                // Remove the context
                this.contexts.delete(node);
            }
        }
    }

    getScope(context: ReferenceInfo): Scope {
        // Store the context
        this.contexts.add(context.reference);
        try {
            return this.computeScope(context);
        }
        finally {
            // Remove the context
            this.contexts.delete(context.reference);
        }
    }

    private computeScope(context: ReferenceInfo): Scope {
        let parent: Scope;

        const scopes: Array<Map<string, AstNodeDescription>> = [];

        if (ast.isDesignatedInitializer(context.container) && context.property === 'field') {
            if (context.container.$container) {
                const type = this.typeProvider.getType(context.container.$container);

                if (ast.isStructure(type)) {
                    this.collectScopesFromNode(type, scopes, AstUtils.getDocument(type));
                    parent = EMPTY_SCOPE;
                }
                else {
                    return EMPTY_SCOPE;
                }
            }
            else {
                return EMPTY_SCOPE;
            }
        }
        else {
            let currentNode = context.container.$container;
            const document = AstUtils.getDocument(context.container);
            parent = this.getGlobalScope(document);
            while (currentNode) {
                this.collectScopesFromNode(currentNode, scopes, document);
                currentNode = currentNode.$container;
            }
        }

        for (let i = scopes.length - 1; i >= 0; i--) {
            parent = new MapScope(scopes[i], parent);
        }

        return parent;
    }

    private getVisibleUris(uri: URI): Set<string> | undefined {
        return this.visibleUris.get(uri, () => ProjectUtils.findVisibleUris(this.documents, uri));
    }

    /**
     * Create a global scope filtered for the given referenceType and on visibles projects URIs
     */
    protected getGlobalScope(document: LangiumDocument): Scope {
        return this.globalScopeCache.get(document.uri, () => new GlobalScope(this.indexManager.allElements(undefined, this.getVisibleUris(document.uri))));
    }

    protected getPrecomputedScope(node: AstNode, document: LangiumDocument): Map<string, AstNodeDescription> {

        let precomputed = this.precomputedCache.get(document.uri, node);
        if (precomputed) {
            return precomputed;
        }
        precomputed = new Map();
        if (document.precomputedScopes) {
            for (const element of document.precomputedScopes.get(node)) {
                precomputed.set(element.name, element);
            }
        }
        this.precomputedCache.set(document.uri, node, precomputed);
        return precomputed;
    }
}

export class GlobalScope implements Scope {
    readonly elements: Map<string, AstNodeDescription>;
    constructor(elements: Stream<AstNodeDescription>) {
        this.elements = new Map();
        for (const element of elements) {
            this.elements.set(element.name, element);

            // Import elements from Smp and Attributes namespaces in global namespace
            if (element.name.startsWith('Smp.')) {
                const name = element.name.substring(4);
                this.elements.set(name, { ...element, name });
            }
            else if (element.name.startsWith('Attributes.')) {
                const name = element.name.substring(11);
                this.elements.set(name, { ...element, name });
            }
        }
    }

    getElement(name: string): AstNodeDescription | undefined {
        return this.elements.get(name);
    }

    getAllElements(): Stream<AstNodeDescription> {
        return stream(this.elements.values());
    }
}

export class MapScope implements Scope {
    readonly elements: Map<string, AstNodeDescription>;
    readonly outerScope: Scope;

    constructor(elements: Map<string, AstNodeDescription>, outerScope: Scope) {
        this.elements = elements;
        this.outerScope = outerScope;
    }

    getElement(name: string): AstNodeDescription | undefined {
        return this.elements.get(name) ?? this.outerScope.getElement(name);
    }

    getAllElements(): Stream<AstNodeDescription> {
        return stream(this.elements.values()).concat(this.outerScope.getAllElements());
    }

}
