
import type { AstNode, AstNodeDescription, AstNodeDescriptionProvider, AstReflection, IndexManager, LangiumCoreServices, LangiumDocument, LangiumDocuments, PrecomputedScopes, Reference, ReferenceInfo, Scope, ScopeComputation, ScopeProvider, Stream, URI } from 'langium';
import type { XsmpcatServices } from '../xsmpcat-module.js';
import * as ast from '../generated/ast.js';
import { AstUtils, Cancellation, WorkspaceCache, EMPTY_SCOPE, interruptAndCheck, MultiMap, stream, MapScope } from 'langium';
import { findVisibleUris } from '../utils/project-utils.js';



export class XsmpcatScopeComputation implements ScopeComputation {

    protected readonly descriptions: AstNodeDescriptionProvider;

    constructor(services: LangiumCoreServices) {
        this.descriptions = services.workspace.AstNodeDescriptionProvider;
    }


    async computeExports(document: LangiumDocument, cancelToken = Cancellation.CancellationToken.None): Promise<AstNodeDescription[]> {
        const catalogue = document.parseResult.value as ast.Catalogue;
        const exportedDescriptions: AstNodeDescription[] = [];

        for (const namespace of catalogue.elements) {
            await interruptAndCheck(cancelToken);
            if (namespace.name) {
                await this.computeNamespaceExports(document, namespace, exportedDescriptions, namespace.name + '.', cancelToken)
                // import elements in Smp and Attributes namespaces in global namespace
                if (namespace.name === 'Smp' || namespace.name === 'Attributes') {

                    await this.computeNamespaceExports(document, namespace, exportedDescriptions, '', cancelToken)
                }
            }
        }
        return exportedDescriptions

    }

    async computeNamespaceExports(document: LangiumDocument, namespace: ast.Namespace, exportedDescriptions: AstNodeDescription[], baseName: string, cancelToken: Cancellation.CancellationToken) {
        for (const element of namespace.elements) {
            if (element.name) {
                await interruptAndCheck(cancelToken)
                const elementName = baseName + element.name
                if (ast.isType(element)) {
                    this.computeTypeExports(document, element, exportedDescriptions, elementName)
                }
                else {
                    await this.computeNamespaceExports(document, element, exportedDescriptions, elementName + '.', cancelToken)
                }
            }
        }
    }
    computeTypeExports(document: LangiumDocument, type: ast.Type, exportedDescriptions: AstNodeDescription[], typeName: string) {

        //export the type
        exportedDescriptions.push(this.descriptions.createDescription(type, typeName, document));

        if (ast.isEnumeration(type)) {
            const elementBaseName = typeName + '.'
            for (const literal of type.literal) // export the literals
                if (literal.name)
                    exportedDescriptions.push(this.descriptions.createDescription(literal, elementBaseName + literal.name, document));

        } else if (ast.isStructure(type) || ast.isReferenceType(type)) {
            const elementBaseName = typeName + '.'
            for (const member of type.elements) {
                if (ast.isConstant(member) && member.name) // export only constants
                    exportedDescriptions.push(this.descriptions.createDescription(member, elementBaseName + member.name, document));
            }
        }

    }
    async computeLocalScopes(document: LangiumDocument, cancelToken = Cancellation.CancellationToken.None): Promise<PrecomputedScopes> {
        const catalogue = document.parseResult.value as ast.Catalogue;
        const scopes = new MultiMap<AstNode, AstNodeDescription>();

        const localDescriptions: AstNodeDescription[] = [];
        for (const namespace of catalogue.elements) {
            if (namespace.name) {
                const nestedDescriptions = await this.computeNamespaceLocalScopes(namespace, scopes, document, cancelToken)
                nestedDescriptions.forEach(description => {
                    localDescriptions.push(this.createAliasDescription(namespace, description));
                })
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
            if (!element.name)
                continue
            await interruptAndCheck(cancelToken)
            if (ast.isType(element)) {
                // add the type to local scope
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
                    const nestedDescriptions: AstNodeDescription[] = [];
                    const internalDescriptions: AstNodeDescription[] = [];

                    // constants are exported to parent scopes whereas fields are local
                    element.elements.forEach(member => {
                        if (ast.isConstant(member) && member.name)
                            nestedDescriptions.push(this.descriptions.createDescription(member, member.name, document));
                        else if (ast.isField(member) && member.name)
                            internalDescriptions.push(this.descriptions.createDescription(member, member.name, document));
                    });

                    scopes.addAll(element, [...nestedDescriptions, ...internalDescriptions]);
                    nestedDescriptions.forEach(nestedDescription => {
                        localDescriptions.push(this.createAliasDescription(element, nestedDescription));
                    });
                }
            } else {
                const nestedDescriptions = await this.computeNamespaceLocalScopes(element, scopes, document, cancelToken)
                nestedDescriptions.forEach(description => {
                    localDescriptions.push(this.createAliasDescription(element, description));
                })
            }
        }

        scopes.addAll(namespace, localDescriptions);
        return localDescriptions;
    }

    private createAliasDescription(
        element: ast.NamedElement,
        description: AstNodeDescription
    ): AstNodeDescription {
        // override the name
        return { ...description, name: `${element.name}.${description.name}` }
    }

}

export class XsmpcatScopeProvider implements ScopeProvider {
    protected documents: LangiumDocuments;
    protected readonly visibleUris: WorkspaceCache<URI, Set<string> | undefined>;
    protected readonly reflection: AstReflection;
    protected readonly indexManager: IndexManager;

    protected readonly exprToType: WorkspaceCache<AstNode, ast.Type | undefined>;

    protected readonly globalScopeCache: WorkspaceCache<string, Scope>;

    constructor(services: XsmpcatServices) {
        this.documents = services.shared.workspace.LangiumDocuments;
        this.visibleUris = new WorkspaceCache<URI, Set<string> | undefined>(services.shared)
        this.reflection = services.shared.AstReflection;
        this.indexManager = services.shared.workspace.IndexManager;

        this.exprToType = new WorkspaceCache<AstNode, ast.Type | undefined>(services.shared)
        this.globalScopeCache = new WorkspaceCache<string, Scope>(services.shared);
    }
    getType(expression: AstNode): ast.Type | undefined {
        return this.exprToType.get(expression, () => this.doGetType(expression))
    }

    doGetType(expression: AstNode): ast.Type | undefined {
        if (ast.isField(expression.$container)) {
            return expression.$container.type.ref
        }
        else if (ast.isConstant(expression.$container)) {
            return expression.$container.type.ref
        }
        else if (ast.isAttributeType(expression.$container)) {
            return expression.$container.type.ref
        }
        else if (ast.isAttribute(expression.$container)) {
            const attributeType = expression.$container.type.ref
            if (ast.isAttributeType(attributeType)) {
                return attributeType.type.ref
            }
        }
        else if (ast.isCollectionLiteral(expression.$container)) {
            const type = this.getType(expression.$container)
            if (ast.isStructure(type)) {
                //TODO handle element from base class in case of class
                const field = type.elements.filter(e => ast.isField(e)).at(expression.$containerIndex as number)
                if (ast.isField(field))
                    return field.type.ref
            }
            else if (ast.isArrayType(type)) {
                return type.itemType.ref
            }
        }

        return undefined
    }

    protected collectScopesFromNode(node: AstNode, scopes: Array<readonly AstNodeDescription[]>,
        allDescriptions: readonly AstNodeDescription[]) {


        if (allDescriptions.length > 0) {
            scopes.push(allDescriptions);
        }
        if (ast.isComponent(node)) {
            if (node.base)
                this.collectScopesFromReference(node.base, scopes)
            node.interface.forEach(i => this.collectScopesFromReference(i, scopes))
        }
        else if (ast.isClass(node) && node.base) {
            this.collectScopesFromReference(node.base, scopes)
        }
        else if (ast.isInterface(node)) {
            node.base.forEach(i => this.collectScopesFromReference(i, scopes))
        }
    }
    protected collectScopesFromReference(node: Reference, scopes: Array<readonly AstNodeDescription[]>) {
        // check if the node is currently processed to avoid cyclic dependency
        if (!this.contexts.has(node) && node.ref) {
            const precomputed = AstUtils.getDocument(node.ref).precomputedScopes;
            if (precomputed) {
                this.collectScopesFromNode(node.ref, scopes, precomputed.get(node.ref))
            }
        }
    }

    protected contexts: Set<Reference> = new Set<Reference>

    getScope(context: ReferenceInfo): Scope {
        // store the context
        this.contexts.add(context.reference)

        try {
            return this.doGetScope(context)
        }
        finally {
            //release the context
            this.contexts.delete(context.reference)
        }
    }

    private doGetScope(context: ReferenceInfo): Scope {

        const scopes: Array<readonly AstNodeDescription[]> = [];
        const referenceType = this.reflection.getReferenceType(context);
        let parent: Scope

        let currentNode: AstNode | undefined

        if (ast.isDesignatedInitializer(context.container) && context.property === 'field') {
            if (context.container.$container) {
                const type = this.getType(context.container.$container)

                if (ast.isStructure(type)) {
                    currentNode = type
                    parent = EMPTY_SCOPE
                }
                else
                    return EMPTY_SCOPE
            }
            else
                return EMPTY_SCOPE
        }
        else {
            currentNode = context.container;
            parent = this.getGlobalScope(referenceType, context);
        }


        const precomputed = AstUtils.getDocument(context.container).precomputedScopes;
        if (precomputed) {
            do {
                this.collectScopesFromNode(currentNode, scopes, precomputed.get(currentNode))
                currentNode = currentNode.$container;
            } while (currentNode);
        }

        const filter = (desc: AstNodeDescription) => this.reflection.isSubtype(desc.type, referenceType)
        for (let i = scopes.length - 1; i >= 0; i--) {
            parent = new FilteredScope(scopes[i], parent, filter);
        }
        return parent;
    }
    private getVisibleUris(uri: URI): Set<string> | undefined {
        return this.visibleUris.get(uri, () => findVisibleUris(this.documents, uri))
    }

    /**
     * Create a global scope filtered for the given referenceType and on visibles projects URIs
     */
    protected getGlobalScope(referenceType: string, _context: ReferenceInfo): Scope {
        const doc = AstUtils.getDocument(_context.container);

        return this.globalScopeCache.get(referenceType + '[' + doc.uri.path + ']', () => new MapScope(this.indexManager.allElements(referenceType, this.getVisibleUris(doc.uri))))

    }
}


export class FilteredScope implements Scope {
    readonly elements: readonly AstNodeDescription[];
    readonly outerScope: Scope;
    readonly filter: (desc: AstNodeDescription) => boolean

    constructor(elements: readonly AstNodeDescription[], outerScope: Scope, filter: (desc: AstNodeDescription) => boolean) {
        this.elements = elements;
        this.outerScope = outerScope;
        this.filter = filter
    }

    getAllElements(): Stream<AstNodeDescription> {
        return stream(this.elements).filter(this.filter).concat(this.outerScope.getAllElements());
    }

    getElement(name: string): AstNodeDescription | undefined {
        // compare first that name are equals then that the filter (more time consuming) is ok 
        return this.elements.find(e => e.name === name && this.filter(e)) ?? this.outerScope.getElement(name);
    }
}