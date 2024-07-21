
import type { AstNode, AstNodeDescription, LangiumCoreServices, LangiumDocument, PrecomputedScopes, Scope } from 'langium';
import type { XsmpcatServices } from './xsmpcat-module.js';
import type { QualifiedNameProvider } from './xsmpcat-naming.js';
import type { Namespace, Catalogue, NamedElement, Enumeration } from './generated/ast.js';
import { AstUtils, Cancellation, DefaultScopeComputation, DefaultScopeProvider, interruptAndCheck, MultiMap, StreamScope } from 'langium';
import { isNamedElement, isCatalogue, isEnumeration } from './generated/ast.js';

export class XsmpcatScopeComputation extends DefaultScopeComputation {

    qualifiedNameProvider: QualifiedNameProvider;

    constructor(services: XsmpcatServices) {
        super(services);
        this.qualifiedNameProvider = services.references.QualifiedNameProvider;
    }

    /**
     * Exports only types (`DataType or `Entity`) with their qualified names.
     */
    override async computeExports(document: LangiumDocument, cancelToken = Cancellation.CancellationToken.None): Promise<AstNodeDescription[]> {
        const descr: AstNodeDescription[] = [];
        for (const modelNode of AstUtils.streamAllContents(document.parseResult.value)) {
            await interruptAndCheck(cancelToken);
            if (isNamedElement(modelNode)) {
                let name = this.nameProvider.getName(modelNode);
                if (name) {
                    if (isNamedElement(modelNode.$container) && !isCatalogue(modelNode.$container)) {
                        name = this.qualifiedNameProvider.getQualifiedName(modelNode.$container as Catalogue, name);
                    }
                    descr.push(this.descriptions.createDescription(modelNode, name, document));
                    if (name.startsWith("Smp."))
                    {
                        descr.push(this.descriptions.createDescription(modelNode, name.substring(4), document));
                    }
                    else if (name.startsWith("Attributes."))
                        {
                            descr.push(this.descriptions.createDescription(modelNode, name.substring(11), document));
                        }
                }
            }
        }
        return descr;
    }

    override async computeLocalScopes(document: LangiumDocument, cancelToken = Cancellation.CancellationToken.None): Promise<PrecomputedScopes> {
        const model = document.parseResult.value as Catalogue;
        const scopes = new MultiMap<AstNode, AstNodeDescription>();
        await this.processCatalogue(model, scopes, document, cancelToken);
        return scopes;
    }

    protected async processCatalogue(container: Catalogue, scopes: PrecomputedScopes, document: LangiumDocument, cancelToken: Cancellation.CancellationToken): Promise<AstNodeDescription[]> {
        const localDescriptions: AstNodeDescription[] = [];
        if (container.namespace)
            for (const element of container.namespace) {
                await interruptAndCheck(cancelToken);
                if (element.name) {
                    const nestedDescriptions = await this.processNamespace(element, scopes, document, cancelToken);
                    for (const description of nestedDescriptions) {
                        // Add qualified names to the container
                        const qualified = this.createQualifiedDescription(element, description, document);
                        localDescriptions.push(qualified);
                    }
                }
            }
        scopes.addAll(container, localDescriptions);
        return localDescriptions;
    }

    protected async processNamespace(container: Namespace, scopes: PrecomputedScopes, document: LangiumDocument, cancelToken: Cancellation.CancellationToken): Promise<AstNodeDescription[]> {
        const localDescriptions: AstNodeDescription[] = [];
        for (const element of container.namespace) {
            await interruptAndCheck(cancelToken);
            if (element.name) {
                const nestedDescriptions = await this.processNamespace(element, scopes, document, cancelToken);
                for (const description of nestedDescriptions) {
                    // Add qualified names to the container
                    const qualified = this.createQualifiedDescription(element, description, document);
                    localDescriptions.push(qualified);
                }
            }
        }
        for (const element of container.type) {
            await interruptAndCheck(cancelToken);
            if (element.name) {

                if (isEnumeration(element)) {
                    const nestedDescriptions = await this.processEnumeration(element, scopes, document, cancelToken);
                    for (const description of nestedDescriptions) {
                        // Add qualified names to the container
                        const qualified = this.createQualifiedDescription(element, description, document);
                        localDescriptions.push(qualified);
                    }
                }

                const description = this.descriptions.createDescription(element, element.name, document);
                localDescriptions.push(description);
            }
        }

        scopes.addAll(container, localDescriptions);
        return localDescriptions;
    }


    protected async processEnumeration(container: Enumeration, scopes: PrecomputedScopes, document: LangiumDocument, cancelToken: Cancellation.CancellationToken): Promise<AstNodeDescription[]> {
        const localDescriptions: AstNodeDescription[] = [];
        for (const element of container.literal) {
            await interruptAndCheck(cancelToken);
            if (element.name) {
                const description = this.descriptions.createDescription(element, element.name, document);
                localDescriptions.push(description);
            }
        }

        scopes.addAll(container, localDescriptions);
        return localDescriptions;
    }

    protected createQualifiedDescription(pack: NamedElement, description: AstNodeDescription, document: LangiumDocument): AstNodeDescription {
        const name = this.qualifiedNameProvider.getQualifiedName(pack.name as string, description.name);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.descriptions.createDescription(description.node!, name, document);
    }

}

export class XsmpcatScopeProvider extends DefaultScopeProvider {

    constructor(services: LangiumCoreServices) {
        super(services);
        this.globalScopeCache.set
    }

 

    protected override getGlobalScope(referenceType: string): Scope {
        return new StreamScope(this.indexManager.allElements(referenceType), undefined, { caseInsensitive: true });
    }

}