
import type { AstNode, AstNodeDescription, AstNodeDescriptionProvider, LangiumCoreServices, LangiumDocument, LangiumDocuments, PrecomputedScopes, Reference, ReferenceInfo, Scope, ScopeComputation, Stream } from 'langium';
import type { XsmpcatServices } from '../xsmpcat-module.js';
import * as ast from '../generated/ast.js';
import { AstUtils, Cancellation, DefaultScopeProvider, WorkspaceCache, EMPTY_SCOPE, interruptAndCheck, MapScope, MultiMap, stream } from 'langium';
import { findVisibleUris } from '../utils/project-utils.js';



export class XsmpcatScopeComputation implements ScopeComputation {

    protected readonly descriptions: AstNodeDescriptionProvider;

    constructor(services: LangiumCoreServices) {
        this.descriptions = services.workspace.AstNodeDescriptionProvider;
    }


    async computeExports(document: LangiumDocument, cancelToken = Cancellation.CancellationToken.None): Promise<AstNodeDescription[]> {

        console.time('computeExports ' + document.uri);

        const catalogue = document.parseResult.value as ast.Catalogue;
        const exportedDescriptions: AstNodeDescription[] = [];

        for (const namespace of catalogue.elements) {
            await interruptAndCheck(cancelToken)
            this.computeNamespaceExports(document, namespace, exportedDescriptions, namespace.name + '.', cancelToken)
            // import elements in Smp and Attributes namespaces in global namespace
            if (namespace.name === 'Smp' || namespace.name === 'Attributes') {
                await interruptAndCheck(cancelToken)
                this.computeNamespaceExports(document, namespace, exportedDescriptions, '', cancelToken)
            }
        }

        console.timeEnd('computeExports ' + document.uri);
        return exportedDescriptions

    }

    computeNamespaceExports(document: LangiumDocument, namespace: ast.Namespace, exportedDescriptions: AstNodeDescription[], baseName: string, cancelToken: Cancellation.CancellationToken) {


        for (const element of namespace.elements) {
            const elementName = baseName + element.name
            if (ast.isType(element)) {
                //export the type
                exportedDescriptions.push(this.descriptions.createDescription(element, elementName, document));

                if (ast.isEnumeration(element)) {
                    const elementBaseName = elementName + '.'
                    for (const literal of element.literal) // export the literals
                        exportedDescriptions.push(this.descriptions.createDescription(literal, elementBaseName + literal.name, document));

                } else if (ast.isStructure(element) || ast.isReferenceType(element)) {
                    const elementBaseName = elementName + '.'
                    for (const member of element.elements) {
                        if (ast.isConstant(member)) // export only constants
                            exportedDescriptions.push(this.descriptions.createDescription(member, elementBaseName + member.name, document));
                    }
                }
            }
            else {
                this.computeNamespaceExports(document, element, exportedDescriptions, elementName + '.', cancelToken)
            }
        }
    }

    async computeLocalScopes(document: LangiumDocument, cancelToken = Cancellation.CancellationToken.None): Promise<PrecomputedScopes> {

        console.time('computeLocalScopes ' + document.uri);
        const catalogue = document.parseResult.value as ast.Catalogue;
        const scopes = new MultiMap<AstNode, AstNodeDescription>();

        const localDescriptions: AstNodeDescription[] = [];
        for (const namespace of catalogue.elements) {
            //  await interruptAndCheck(cancelToken)
            const nestedDescriptions = this.computeNamespaceLocalScopes(namespace, scopes, document, cancelToken)
            nestedDescriptions.forEach(description => {
                localDescriptions.push(this.createAliasDescription(namespace, description));
            })
        }
        scopes.addAll(catalogue, localDescriptions);

        console.timeEnd('computeLocalScopes ' + document.uri);
        return scopes;
    }

    protected computeNamespaceLocalScopes(
        namespace: ast.Namespace,
        scopes: PrecomputedScopes,
        document: LangiumDocument,
        cancelToken: Cancellation.CancellationToken
    ): AstNodeDescription[] {
        const localDescriptions: AstNodeDescription[] = [];

        for (const element of namespace.elements) {
            if (ast.isType(element)) {
                // add the type to local scope
                const description = this.descriptions.createDescription(element, element.name, document);
                localDescriptions.push(description);

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
                        if (ast.isConstant(member))
                            nestedDescriptions.push(this.descriptions.createDescription(member, member.name, document));
                        else if (ast.isField(member))
                            internalDescriptions.push(this.descriptions.createDescription(member, member.name, document));
                    });

                    scopes.addAll(element, [...nestedDescriptions, ...internalDescriptions]);
                    nestedDescriptions.forEach(nestedDescription => {
                        localDescriptions.push(this.createAliasDescription(element, nestedDescription));
                    });
                }
            } else {
                const nestedDescriptions = this.computeNamespaceLocalScopes(element, scopes, document, cancelToken)
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
        return { ...description, name: `${element.name}.${description.name}` }
    }

}

export class XsmpcatScopeProvider extends DefaultScopeProvider {
    protected documents: LangiumDocuments;

    protected readonly visibleUris: WorkspaceCache<LangiumDocument, Set<string>>;

    constructor(services: XsmpcatServices) {
        super(services);
        this.documents = services.shared.workspace.LangiumDocuments;
        this.visibleUris = new WorkspaceCache<LangiumDocument, Set<string>>(services.shared)
    }

    getType(expression: AstNode): ast.Type | undefined {
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

    protected collectScopesFromNode(context: ReferenceInfo, node: AstNode, scopes: Array<readonly AstNodeDescription[]>,
        allDescriptions: readonly AstNodeDescription[]) {


        if (allDescriptions.length > 0) {
            scopes.push(allDescriptions);
        }
        if (ast.isComponent(node)) {
            if (node.base)
                this.collectScopesFromReference(context, node.base, scopes)
            node.interface.forEach(i => this.collectScopesFromReference(context, i, scopes))
        }
        else if (ast.isClass(node) && node.base) {
            this.collectScopesFromReference(context, node.base, scopes)
        }
        else if (ast.isInterface(node)) {
            node.base.forEach(i => this.collectScopesFromReference(context, i, scopes))
        }
    }
    protected collectScopesFromReference(context: ReferenceInfo, node: Reference, scopes: Array<readonly AstNodeDescription[]>) {
        if (context.reference != node && node.ref) {
            const precomputed = AstUtils.getDocument(node.ref).precomputedScopes;
            if (precomputed) {
                this.collectScopesFromNode(context, node.ref, scopes, precomputed.get(node.ref))
            }
        }
    }


    override getScope(context: ReferenceInfo): Scope {

        if (ast.isDesignatedInitializer(context.container) && context.property === 'field') {
            const type = this.getType(context.container.$container as AstNode)
            if (ast.isStructure(type)) {
                //TODO handle element from base class in case of class
                return this.createScopeForNodes(type.elements)
            }
            else {
                return EMPTY_SCOPE
            }
        }

        const scopes: Array<readonly AstNodeDescription[]> = [];
        const referenceType = this.reflection.getReferenceType(context);

        const precomputed = AstUtils.getDocument(context.container).precomputedScopes;
        if (precomputed) {
            let currentNode: AstNode | undefined = context.container;
            do {
                this.collectScopesFromNode(context, currentNode, scopes, precomputed.get(currentNode))
                currentNode = currentNode.$container;
            } while (currentNode);
        }

        let result: Scope = this.getGlobalScope(referenceType, context);
        const filter = (desc: AstNodeDescription) => this.reflection.isSubtype(desc.type, referenceType)
        for (let i = scopes.length - 1; i >= 0; i--) {
            //result = this.createScope(stream(scopes[i]).filter(filter), result)
            result = new FilteredStreamScope(scopes[i], result, filter);

        }
        return result;
    }
    private getVisibleUris(_context: ReferenceInfo): Set<string> {
        return this.visibleUris.get(AstUtils.getDocument(_context.container), () => findVisibleUris(this.documents, AstUtils.getDocument(_context.container).uri))
    }

    /**
     * Create a global scope filtered for the given referenceType and on visibles projects URIs
     */
    protected override getGlobalScope(referenceType: string, _context: ReferenceInfo): Scope {

        return this.globalScopeCache.get(referenceType, () => new MapScope(this.indexManager.allElements(referenceType, this.getVisibleUris(_context))));
    }
}

export class FilteredStreamScope implements Scope {
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
        const local = this.elements.find(e => e.name === name && this.filter(e));
        return local ? local : this.outerScope.getElement(name);
    }
}