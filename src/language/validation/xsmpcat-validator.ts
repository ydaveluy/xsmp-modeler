import { AstNode, AstUtils, IndexManager, LangiumDocuments, MultiMap, Properties, Reference, URI, WorkspaceCache, type ValidationAcceptor, type ValidationChecks } from 'langium';
import * as ast from '../generated/ast.js';
import type { XsmpcatServices } from '../xsmpcat-module.js';
import { isFloatingType, PrimitiveTypeKind, XsmpUtils } from '../utils/xsmp-utils.js';
import { Solver } from '../utils/solver.js';
import { Instant } from '@js-joda/core';
import { findVisibleUris } from '../utils/project-utils.js';
/**
 * Register custom validation checks.
 */
export function registerXsmpcatValidationChecks(services: XsmpcatServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.XsmpcatValidator;
    const checks: ValidationChecks<ast.XsmpAstType> = {

        NamedElement: validator.checkNamedElement,
        Attribute: validator.checkAttribute,
        Constant: validator.checkConstant,
        Field: validator.checkField,
        Enumeration: validator.checkEnumeration,
        Float: validator.checkFloat,
        Integer: validator.checkInteger,
        Type: validator.checkType,
        Association: validator.checkAssociation,
        Container: validator.checkContainer,
        NamedElementWithMultiplicity: validator.checkNamedElementWithMultiplicity,
        Interface: validator.checkInterface,
        Component: validator.checkComponent,
        Structure: validator.checkStructure,
        Class: validator.checkClass,
        EventType: validator.checkEventType,
        NativeType: validator.checkNativeType,
        EventSink: validator.checkEventSink,
        EventSource: validator.checkEventSource,
        StringType: validator.checkString,
        ArrayType: validator.checkArrayType,
        AttributeType: validator.checkAttributeType,
        Document: validator.checkDocument,
        EntryPoint: validator.checkEntryPoint,
        Service: validator.checkService,
        Catalogue: validator.checkCatalogue,
        Property: validator.checkProperty,
        Reference_: validator.checkReference,
        ValueReference: validator.checkValueReference,
        Operation: validator.checkOperation,
        Parameter: validator.checkParameter,
        ReturnParameter: validator.checkReturnParameter,
        PrimitiveType: validator.checkPrimitiveType,



    };
    registry.register(checks, validator, 'fast');
}


const reservedNames = new Set([
    'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor', 'bool', 'break',
    'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t', 'class', 'compl', 'concept',
    'const', 'consteval', 'constexpr', 'constinit', 'const_cast', 'continue', 'co_await',
    'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'double', 'dynamic_cast',
    'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto',
    'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'not', 'not_eq',
    'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected', 'public', 'register',
    'reinterpret_cast', 'requires', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert',
    'static_cast', 'struct', 'switch', 'template', 'this', 'thread_local', 'throw', 'true', 'try',
    'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile',
    'wchar_t', 'while', 'xor', 'xor_eq'
]);

const validUsages = new Set(['NamedElement', 'Array', 'Association', 'AttributeType', 'Catalogue',
    'Class', 'Component', 'Constant', 'Container', 'Document', 'EntryPoint', 'Enumeration',
    'EnumerationLiteral', 'EventSink', 'EventSource', 'EventType', 'Exception', 'Field', 'Float',
    'Integer', 'Interface', 'LanguageType', 'Model', 'Namespace', 'NativeType', 'Operation', 'Parameter',
    'PrimitiveType', 'Property', 'ReferenceType', 'Reference', 'Service', 'SimpleType', 'String',
    'Structure', 'Type', 'ValueReference', 'ValueType', 'VisibilityElement'])

const namedElementRegex = /^[a-zA-Z]\w*$/;
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Implementation of custom validations.
 */
export class XsmpcatValidator {
    protected readonly indexManager: IndexManager;
    protected documents: LangiumDocuments;

    protected readonly globalCache: WorkspaceCache<string, MultiMap<string, ast.Type>>;
    protected readonly visibleCache: WorkspaceCache<URI, MultiMap<string, ast.Type>>;
    constructor(services: XsmpcatServices) {
        this.indexManager = services.shared.workspace.IndexManager;
        this.documents = services.shared.workspace.LangiumDocuments;
        this.globalCache = new WorkspaceCache<string, MultiMap<string, ast.Type>>(services.shared);
        this.visibleCache = new WorkspaceCache<URI, MultiMap<string, ast.Type>>(services.shared);
    }

    private computeUuidsForTypes(): MultiMap<string, ast.Type> {
        const map = new MultiMap<string, ast.Type>()
        for (const type of this.indexManager.allElements(ast.Type)) {
            if (ast.isType(type.node)) {
                const uuid = XsmpUtils.getUuid(type.node)?.content.toString()
                if (uuid)
                    map.add(uuid, type.node)
            }
        }
        return map;
    }

    private isDuplicatedUuid(type: ast.Type, uuid: string): boolean {
        return this.globalCache.get('uuids', () => this.computeUuidsForTypes()).get(uuid).length > 1;
    }

    private computeServiceNames(): MultiMap<string, ast.Service> {
        const map = new MultiMap<string, ast.Service>()
        for (const type of this.indexManager.allElements(ast.Service)) {
            if (ast.isService(type.node))
                map.add(type.name, type.node)
        }
        return map;
    }
    private isDuplicatedServiceName(service: ast.Service): boolean {
        return this.globalCache.get('services', () => this.computeServiceNames()).get(service.name).length > 1;
    }

    private computeTypeNames(uri: URI): MultiMap<string, ast.Type> {
        const map = new MultiMap<string, ast.Type>()
        for (const type of this.indexManager.allElements(ast.Type, findVisibleUris(this.documents, uri)?.add(uri.toString()))) {
            if (ast.isType(type.node))
                map.add(XsmpUtils.getQualifiedName(type.node), type.node)
        }
        return map;
    }

    private isDuplicatedTypeName(type: ast.Type): boolean {
        const uri = AstUtils.getDocument(type).uri;
        return this.visibleCache.get(uri, () => this.computeTypeNames(uri)).get(XsmpUtils.getQualifiedName(type)).length > 1;
    }




    public static getType(node: AstNode): string {
        switch (node.$type) {

            case ast.Reference_:
                return 'Reference'
            case ast.ArrayType:
                return 'Array'
            case ast.ReturnParameter:
                return ast.Parameter
            case ast.StringType:
                return 'String'
            default:
                return node.$type;
        }
    }

    checkNamedElement(element: ast.NamedElement, accept: ValidationAcceptor): void {


        if (!namedElementRegex.test(element.name)) {
            accept('error', 'An Element Name shall start with a letter.',
                { node: element, property: 'name' });
        }
        if (reservedNames.has(element.name)) {
            accept('error', 'An Element Name shall not be an ISO/ANSI C++ keyword.',
                { node: element, property: 'name' });
        }

        const visited = new Set<ast.AttributeType>()
        for (const attribute of element.attributes) {
            if (this.checkTypeReference(accept, attribute, attribute.type, 'type')) {
                const type = attribute.type.ref as ast.AttributeType

                const usages = XsmpUtils.getUsages(type)
                if (usages?.every(t => !ast.reflection.isSubtype(XsmpcatValidator.getType(element), t.content.toString())))
                    accept('warning', `This annotation is disallowed for element of type ${XsmpcatValidator.getType(element)}.`, { node: attribute, property: 'type' });

                if (!XsmpUtils.allowMultiple(type) && visited.has(type))
                    accept('warning', "Duplicate annotation of a non-repeatable type. Only annotation types marked with `@allowMultiple` can be used multiple times on a single target.",
                        { node: attribute, property: 'type' })

                visited.add(type)
            }
        }

    }


    public static getReferenceType(type: string, property: string): string {

        const referenceId = `${type}:${property}`;
        switch (referenceId) {
            case 'Attribute:type':
                return ast.AttributeType
            case 'Class:base':
                return ast.Class
            case 'Interface:base':
            case 'Model:interface':
            case 'Service:interface':
            case 'Reference_:interface':
                return ast.Interface
            case 'Model:base':
                return ast.Model
            case 'Service:base':
                return ast.Service
            case 'ArrayType:itemType':
            case 'ValueReference:type':
            case 'AttributeType:type':
            case 'Field:type':
            case 'Property:type':
                return ast.ValueType
            case 'Integer:primitiveType':
            case 'Float:primitiveType':
                return ast.PrimitiveType
            case 'EventType:eventArgs':
            case 'Constant:type':
                return ast.SimpleType
            case 'Parameter:type':
            case 'ReturnParameter:type':
            case 'Association:type':
                return ast.LanguageType
            case 'Container:type':
                return ast.ReferenceType
            case 'Container:defaultComponent':
                return ast.Component
            case 'EventSink:type':
            case 'EventSource:type':
                return ast.EventType
            case 'Operation:raisedException':
            case 'Property:getRaises':
            case 'Property:setRaises':
            case 'Exception:base':
                return ast.Exception

            default: {
                throw new Error(`${referenceId} is not a valid reference id.`);
            }
        }
    }

    checkTypeReference<N extends AstNode, P extends string = Properties<N>>(accept: ValidationAcceptor, node: N, reference: Reference<ast.Type>, property: Properties<N>, index?: number): boolean {

        if (!reference.ref)
            return false

        const expectedType = XsmpcatValidator.getReferenceType(node.$type, property)

        if (!ast.reflection.isSubtype(reference.ref.$type, expectedType)) {
            accept('error', `The type ${reference.ref?.$type} is not a sub type of ${expectedType}.`, { node: node, property: property, index: index });
            return false
        }

        const visibility = XsmpUtils.getRealVisibility(reference.ref)
        if ((visibility === 'protected' && AstUtils.getDocument(reference.ref) !== AstUtils.getDocument(node)) ||
            (visibility === 'private' && !XsmpUtils.isAncestor(AstUtils.getContainerOfType(node, ast.isNamespace), reference.ref)))
            accept('error', `The ${reference.ref.$type} ${XsmpUtils.getQualifiedName(reference.ref)} is not visible.`, { node: node, property: property, index: index })

        const deprecated = XsmpUtils.getDeprecated(reference.ref)
        if (deprecated) {
            accept('warning', `Deprecated: ${deprecated.content.toString()}`, { node: node, property: property, index: index });
        }
        return true
    }

    checkExpression(type: ast.Type | PrimitiveTypeKind | undefined, expression: ast.Expression | undefined, accept: ValidationAcceptor) {

        if (!expression || !type)
            return

        if (ast.isArrayType(type)) {
            if (ast.isCollectionLiteral(expression)) {
                const arraySize = Solver.getValue(type.size)?.integralValue('UInt64')?.getValue()
                if (arraySize) {
                    const collectionSize = expression.elements.length
                    const size = collectionSize < arraySize ? collectionSize : arraySize
                    for (let i = 0; i < size; ++i)
                        this.checkExpression(type.itemType.ref, expression.elements[i], accept)
                    const more = expression.elements.at(Number(arraySize))
                    if (more)
                        accept('error', `The array type expect ${arraySize} element(s), got ${collectionSize} element(s).`, { node: more })
                    else if (collectionSize < arraySize)
                        accept('warning', `Partial initialization, the array type expect ${arraySize} element(s), got ${collectionSize} element(s).`, { node: expression })
                }
            }
            else {
                accept('error', 'An array shall be initialized with a collection.', { node: expression })
            }
        }

        else if (ast.isStructure(type)) {
            if (ast.isCollectionLiteral(expression)) {
                const fields = XsmpUtils.getAllFields(type).toArray()
                const fieldCount = fields.length
                const collectionSize = expression.elements.length
                const size = collectionSize < fieldCount ? collectionSize : fieldCount
                for (let i = 0; i < size; ++i) {
                    let exp = expression.elements[i]
                    let field = fields[i]
                    if (ast.isDesignatedInitializer(exp)) {
                        if (exp.field.ref !== field)
                            accept('error', `Invalid field name, expecting ${field.name}.`, { node: exp, property: 'field' })
                        exp = exp.expr;
                    }
                    this.checkExpression(field?.type.ref, exp, accept)
                }
                const more = expression.elements.at(Number(fieldCount))
                if (more)
                    accept('error', `The structure type expect ${fieldCount} element(s), got ${collectionSize} element(s).`, { node: more })
                else if (collectionSize < fieldCount)
                    accept('warning', `Partial initialization, the structure type expect ${fieldCount} element(s), got ${collectionSize} element(s).`, { node: expression })
            }
            else {
                accept('error', `A ${type.$type} shall be initialized with a collection.`, { node: expression })
            }
        }
        else {
            return Solver.getValueAs(expression, type, accept)?.getValue()
        }
        return undefined
    }


    checkAttribute(attribute: ast.Attribute, accept: ValidationAcceptor): void {
        if (this.checkTypeReference(accept, attribute, attribute.type, 'type')) {
            const attributeType = attribute.type?.ref as ast.AttributeType
            if (attribute.value)
                this.checkExpression(attributeType.type.ref, attribute.value, accept)
            else if (!attributeType.default)
                accept('error', 'A value is required.', { node: attribute, property: 'value' });
        }
    }

    checkConstant(constant: ast.Constant, accept: ValidationAcceptor): void {

        if (this.checkTypeReference(accept, constant, constant.type, 'type')) {
            const type = constant.type.ref as ast.PrimitiveType
            if (!constant.value)
                accept('error', 'A Constant must have an initialization value.', { node: constant, property: 'value' });
            else
                this.checkExpression(type, constant.value, accept)
        }
    }

    checkField(field: ast.Field, accept: ValidationAcceptor): void {
        if (this.checkTypeReference(accept, field, field.type, 'type')) {
            this.checkExpression(field.type.ref, field.default, accept)
        }
    }

    checkEnumeration(enumeration: ast.Enumeration, accept: ValidationAcceptor): void {
        this.checkModifier(enumeration, [ast.isVisibilityModifiers], accept)
        if (enumeration.literal.length == 0) {
            accept('error', 'An Enumeration shall contains at least one literal.', { node: enumeration, property: 'literal' });
        }

        const values = new Set<any>();
        const literals = new Set<string>();
        for (const literal of enumeration.literal) {
            if (literals.has(literal.name))
                accept('error', 'Duplicated literal name.', { node: literal, property: 'name' });
            else
                literals.add(literal.name)

            const value = this.checkExpression('Int32', literal.value, accept)
            if (value !== undefined) {
                if (values.has(value)) {
                    accept('error', "Enumeration Literal Values shall be unique within an Enumeration.", { node: literal, property: 'value' });
                }
                else {
                    values.add(value)
                }
            }
        }
    }
    private readonly integerTypes: Set<PrimitiveTypeKind> = new Set([
        'Int8', 'Int16', 'UInt8', 'UInt16', 'Int32', 'Int64', 'UInt32', 'UInt64', 'DateTime', 'Duration'
    ]);
    checkInteger(integer: ast.Integer, accept: ValidationAcceptor): void {
        this.checkModifier(integer, [ast.isVisibilityModifiers], accept)
        const kind = XsmpUtils.getPrimitiveTypeKind(integer)
        if (this.integerTypes.has(kind)) {
            const min = this.checkExpression(kind, integer.minimum, accept)
            const max = this.checkExpression(kind, integer.maximum, accept)
            if (min !== undefined && max !== undefined && min > max) {
                accept('error', "Minimum shall be less or equal than Maximum.", { node: integer, property: 'minimum' });
            }
        }
        else {
            accept('error', 'Expecting an Integral Type.', { node: integer, property: 'primitiveType' })
        }

    }
    checkFloat(float: ast.Float, accept: ValidationAcceptor): void {
        this.checkModifier(float, [ast.isVisibilityModifiers], accept)
        const kind = XsmpUtils.getPrimitiveTypeKind(float)
        if (isFloatingType(kind)) {
            const min = this.checkExpression(kind, float.minimum, accept)
            const max = this.checkExpression(kind, float.maximum, accept)

            if (min !== undefined && max !== undefined) {
                if (min > max || (min === max && float.range !== '...'))
                    accept('error', float.range !== '...' ? "Minimum shall be less than Maximum." : "Minimum shall be less or equal than Maximum.",
                        { node: float, property: 'minimum' });
            }
        }
        else {
            accept('error', 'Expecting a Floating Point  Type.', { node: float, property: 'primitiveType' })
        }
    }

    checkType(type: ast.Type, accept: ValidationAcceptor): void {

        const uuid = XsmpUtils.getUuid(type)
        if (uuid === undefined) {
            accept('error', 'Missing Type UUID.', { node: type, property: 'name' })
        }
        else if (!uuidRegex.test(uuid.content.toString())) {
            accept('error', 'The UUID is invalid.', { node: type, range: uuid.range })
        }
        else if (this.isDuplicatedUuid(type, uuid.content.toString())) {
            accept('error', 'Duplicated UUID.', { node: type, range: uuid.range })
        }

        if (this.isDuplicatedTypeName(type)) {
            accept('error', 'Duplicated Type name.', { node: type, property: 'name' })
        }
    }

    checkAssociation(association: ast.Association, accept: ValidationAcceptor): void {
        this.checkTypeReference(accept, association, association.type, 'type')
    }


    checkContainer(container: ast.Container, accept: ValidationAcceptor): void {

        if (this.checkTypeReference(accept, container, container.type, 'type')) {
            if (container.defaultComponent && this.checkTypeReference(accept, container, container.defaultComponent, 'defaultComponent')) {
                //TODO check type is base of defaultComponent
            }
        }

    }
    checkNamedElementWithMultiplicity(element: ast.NamedElementWithMultiplicity, accept: ValidationAcceptor): void {
        const lower = XsmpUtils.getLower(element)
        if (lower !== undefined && lower < 0)
            accept('error', "Lower bound shall be a positive number or 0.", { node: element.multiplicity as ast.Multiplicity, property: 'lower' })

        const upper = XsmpUtils.getUpper(element)
        if (upper !== undefined && upper != BigInt(-1) && lower !== undefined && upper < lower)
            accept('error', "Lower bound shall be less or equal to the upper bound, if present.\nUpper bound shall be -1 or larger or equal to the lower bound.",
                { node: element.multiplicity as ast.Multiplicity, property: 'lower' });
    }


    checkModifier(element: ast.VisibilityElement, checks: ((item: unknown) => boolean)[], accept: ValidationAcceptor) {
        for (const check of checks) {
            let visited = false
            for (const [index, modifier] of element.modifiers.entries()) {
                if (check(modifier)) {
                    if (visited)
                        accept('error', 'Invalid modifier.', { node: element, property: 'modifiers', index: index })
                    visited = true
                }
            }
        }

        for (const [index, modifier] of element.modifiers.entries()) {
            if (!checks.some(check => check(modifier)))
                accept('error', 'Illegal modifier.', { node: element, property: 'modifiers', index: index })
        }
    }



    checkInterface(inter: ast.Interface, accept: ValidationAcceptor): void {
        this.checkModifier(inter, [ast.isVisibilityModifiers], accept)
        const visited = new Set<ast.Type | undefined>()
        for (const [index, base] of inter.base.entries()) {
            if (this.checkTypeReference(accept, inter, base, 'base', index)) {
                if (visited.has(base.ref))
                    accept('error', 'Duplicated interface.', { node: inter, property: 'base', index: index })
                else {
                    visited.add(base.ref)
                    if (XsmpUtils.isCyclicInterfaceBase(inter, base))
                        accept('error', 'Cyclic dependency detected.', { node: inter, property: 'base', index: index })
                }
            }
        }

        for (const element of inter.elements) {
            switch (element.$type) {
                case ast.Constant:
                case ast.Operation:
                    this.checkModifier(element, [], accept)
                    break;
                case ast.Property:
                    this.checkModifier(element, [ast.isAccessKind], accept)
                    break;
            }
        }
    }

    checkComponent(component: ast.Component, accept: ValidationAcceptor): void {
        this.checkModifier(component, [ast.isVisibilityModifiers, (elem) => elem === 'abstract'], accept)
        if (component.base && XsmpUtils.isCyclicComponentBase(component, component.base))
            accept('error', 'Cyclic dependency detected.', { node: component, property: 'base' })

        const visited = new Set<ast.Type | undefined>()
        for (const [index, inter] of component.interface.entries()) {
            if (this.checkTypeReference(accept, component, inter, 'interface', index)) {
                if (visited.has(inter.ref))
                    accept('error', 'Duplicated interface.', { node: component, property: 'interface', index: index })
                else
                    visited.add(inter.ref)
            }
        }

        for (const element of component.elements) {
            switch (element.$type) {
                case ast.Constant:
                case ast.Operation:
                case ast.Association:
                    this.checkModifier(element, [ast.isVisibilityModifiers], accept)
                    break;
                case ast.Field:
                    this.checkModifier(element, [ast.isVisibilityModifiers, (elem) => elem === 'input', (elem) => elem === 'output', (elem) => elem === 'transient'], accept)
                    break;
                case ast.Property:
                    this.checkModifier(element, [ast.isVisibilityModifiers, ast.isAccessKind], accept)
                    break;
            }
        }

        if (!component.modifiers.includes('abstract') &&
            component.elements.some(e => (ast.isOperation(e) || ast.isProperty(e)) && XsmpUtils.isAbstract(e)))
            accept('error', `The ${component.$type} shall be abstract.`, { node: component, property: 'name' })
    }

    checkStructure(structure: ast.Structure, accept: ValidationAcceptor): void {
        if (structure.$type !== ast.Structure) return
        this.checkModifier(structure, [ast.isVisibilityModifiers], accept)

        for (const element of structure.elements) {
            switch (element.$type) {
                case ast.Constant:
                    this.checkModifier(element, [], accept)
                    break;
                case ast.Field:
                    this.checkModifier(element, [(elem) => elem === 'input', (elem) => elem === 'output', (elem) => elem === 'transient'], accept)
                    if (XsmpUtils.isRecursiveType(structure, element.type.ref))
                        accept('error', 'Recursive Field Type.', { node: element, property: 'type' })
                    break;
            }
        }
    }

    checkClass(clazz: ast.Class, accept: ValidationAcceptor): void {
        this.checkModifier(clazz, [ast.isVisibilityModifiers, (elem) => elem === 'abstract'], accept)
        if (clazz.base && XsmpUtils.isCyclicClassBase(clazz, clazz.base))
            accept('error', 'Cyclic dependency detected.', { node: clazz, property: 'base' })


        for (const element of clazz.elements) {
            switch (element.$type) {
                case ast.Constant:
                case ast.Operation:
                case ast.Association:
                    this.checkModifier(element, [ast.isVisibilityModifiers], accept)
                    break;
                case ast.Field:
                    this.checkModifier(element, [ast.isVisibilityModifiers, (elem) => elem === 'input', (elem) => elem === 'output', (elem) => elem === 'transient'], accept)
                    if (XsmpUtils.isRecursiveType(clazz, element.type.ref))
                        accept('error', 'Recursive Field Type.', { node: element, property: 'type' })
                    break;
                case ast.Property:
                    this.checkModifier(element, [ast.isVisibilityModifiers, ast.isAccessKind], accept)
                    break;
            }
        }
        if (!clazz.modifiers.includes('abstract') &&
            clazz.elements.some(e => (ast.isOperation(e) || ast.isProperty(e)) && XsmpUtils.isAbstract(e)))
            accept('error', `The ${clazz.$type} shall be abstract.`, { node: clazz, property: 'name' })
    }

    checkEventType(eventType: ast.EventType, accept: ValidationAcceptor): void {
        this.checkModifier(eventType, [ast.isVisibilityModifiers], accept)
        if (eventType.eventArgs)
            this.checkTypeReference(accept, eventType, eventType.eventArgs, 'eventArgs')
    }

    checkNativeType(nativeType: ast.NativeType, accept: ValidationAcceptor): void {
        this.checkModifier(nativeType, [ast.isVisibilityModifiers], accept)
        if (!XsmpUtils.getNativeType(nativeType))
            accept('error', 'The javadoc `@type` tag shall be defined.', { node: nativeType, property: 'name' })
    }

    checkEventSink(eventSink: ast.EventSink, accept: ValidationAcceptor): void {
        this.checkTypeReference(accept, eventSink, eventSink.type, 'type')
    }

    checkEventSource(eventSource: ast.EventSource, accept: ValidationAcceptor): void {
        this.checkTypeReference(accept, eventSource, eventSource.type, 'type')
    }
    checkString(string: ast.StringType, accept: ValidationAcceptor): void {
        this.checkModifier(string, [ast.isVisibilityModifiers], accept)
        const length = this.checkExpression('Int64', string.length, accept)
        if (length && length as bigint < 0)
            accept('error', 'The String length shall be a positive number.', { node: string, property: 'length' })
    }

    checkArrayType(array: ast.ArrayType, accept: ValidationAcceptor): void {
        this.checkModifier(array, [ast.isVisibilityModifiers], accept)
        const size = this.checkExpression('Int64', array.size, accept)
        if (size && size as bigint < 0)
            accept('error', 'The Array size shall be a positive number.', { node: array, property: 'size' })

        if (this.checkTypeReference(accept, array, array.itemType, 'itemType')) {
            const type = array.itemType.ref as ast.ValueType

            if (XsmpUtils.isRecursiveType(array, type))
                accept('error', 'Recursive Array Type.', { node: array, property: 'itemType' })

            if (!ast.isSimpleType(type) && XsmpUtils.isSimpleArray(array))
                accept('error', 'An array annotated with `@SimpleArray` requires a SimpleType item type.', { node: array, property: 'itemType' })
        }
    }

    checkAttributeType(attribute: ast.AttributeType, accept: ValidationAcceptor): void {
        this.checkModifier(attribute, [ast.isVisibilityModifiers], accept)
        if (this.checkTypeReference(accept, attribute, attribute.type, 'type')) {
            if (!attribute.default)
                accept('warning', 'Default value is missing.', { node: attribute, property: 'name' })
            else
                this.checkExpression(attribute.type.ref, attribute.default, accept)

            const usages = XsmpUtils.getUsages(attribute)
            const visited = new Set<string>()
            if (usages) {
                for (const usage of usages) {
                    const str = usage.content.toString();
                    if (!validUsages.has(str))
                        accept('warning', 'Invalid usage.', { node: attribute, range: usage.content.range })
                    if (visited.has(str))
                        accept('warning', "Duplicated usage.", { node: attribute, range: usage.content.range })
                    visited.add(str)
                }
            }
        }
    }

    checkDocument(document: ast.Document, accept: ValidationAcceptor): void {
        const date = XsmpUtils.getDate(document)
        if (date) {
            try {
                Instant.parse(date.content.toString())
            }
            catch (error) {
                accept('error', 'Invalid date format (e.g: 1970-01-01T00:00:00Z).', { node: document, range: date.content.range })
            }
        }
    }
    checkEntryPoint(entryPoint: ast.EntryPoint, accept: ValidationAcceptor): void {
        entryPoint.input.forEach((f, i) => {
            if (f.ref && !XsmpUtils.isInput(f.ref))
                accept('error', 'Field is not an Input.', { node: entryPoint, property: 'input', index: i })
        })
        entryPoint.output.forEach((f, i) => {
            if (f.ref && !XsmpUtils.isOutput(f.ref))
                accept('error', 'Field is not an Output.', { node: entryPoint, property: 'output', index: i })
        })
    }
    checkService(service: ast.Service, accept: ValidationAcceptor): void {
        if (this.isDuplicatedServiceName(service))
            accept('error', 'Duplicated Service name.', { node: service, property: 'name' })
    }
    checkCatalogue(catalogue: ast.Catalogue, accept: ValidationAcceptor): void {
        if (this.indexManager.allElements(ast.Catalogue).filter(c => c.name === catalogue.name).count() > 1)
            accept('error', 'Duplicated Catalogue name.', { node: catalogue, property: 'name' })
    }

    checkProperty(property: ast.Property, accept: ValidationAcceptor): void {
        if (this.checkTypeReference(accept, property, property.type, 'type') && property.attachedField?.ref) {
            //TODO checkFieldReferenceVisibility(field, p, XsmpPackage.Literals.PROPERTY__ATTACHED_FIELD, -1);
            if (property.type.ref !== property.attachedField?.ref.type.ref)
                accept('error', 'The Type of the AttachedField shall match the Type of the Property.', { node: property, property: 'attachedField' });
        }

        const getRaises = new Set<ast.Type | undefined>()
        for (const [index, exception] of property.getRaises.entries()) {
            if (this.checkTypeReference(accept, property, exception, 'getRaises', index)) {
                if (getRaises.has(exception.ref))
                    accept('error', 'Duplicated exception.', { node: property, property: 'getRaises', index: index })
                else
                    getRaises.add(exception.ref)
            }
        }
        const setRaises = new Set<ast.Type | undefined>()
        for (const [index, exception] of property.setRaises.entries()) {
            if (this.checkTypeReference(accept, property, exception, 'setRaises', index)) {
                if (setRaises.has(exception.ref))
                    accept('error', 'Duplicated exception.', { node: property, property: 'setRaises', index: index })
                else
                    setRaises.add(exception.ref)
            }
        }
        const isStatic = XsmpUtils.attribute(property, 'Attributes.Static')
        if (XsmpUtils.isAttributeTrue(isStatic)) {
            if (ast.isInterface(property.$container))
                accept('error', 'A Property of an Interface shall not be static.', { node: isStatic as ast.Attribute });

            const isVirtual = XsmpUtils.attribute(property, 'Attributes.Virtual')
            if (XsmpUtils.isAttributeTrue(isVirtual))
                accept('error', 'A Property shall not be both Static and Virtual.', { node: isVirtual as ast.Attribute });

            const isAbstract = XsmpUtils.attribute(property, 'Attributes.Abstract')
            if (XsmpUtils.isAttributeTrue(isAbstract))
                accept('error', 'A Property shall not be both Static and Abstract.', { node: isAbstract as ast.Attribute });

            const isConst = XsmpUtils.attribute(property, 'Attributes.Const')
            if (XsmpUtils.isAttributeTrue(isConst))
                accept('error', 'A Property shall not be both Static and Const.', { node: isConst as ast.Attribute });

            if (property.attachedField?.ref && !XsmpUtils.isStatic(property.attachedField.ref))
                accept('error', 'A Property shall not be Static if the attached field is not Static.', { node: isStatic as ast.Attribute });
        }

        // an element shall not be both byPointer and ByReference
        const isByPointer = XsmpUtils.attribute(property, 'Attributes.ByPointer')
        if (XsmpUtils.isAttributeTrue(isByPointer) && XsmpUtils.isAttributeTrue(XsmpUtils.attribute(property, 'Attributes.ByReference')))
            accept('error', 'A Property shall not be both ByPointer and ByReference.', { node: isByPointer as ast.Attribute });
    }

    checkReference(reference: ast.Reference_, accept: ValidationAcceptor): void {
        this.checkTypeReference(accept, reference, reference.interface, 'interface')
    }

    checkValueReference(valueReference: ast.ValueReference, accept: ValidationAcceptor): void {
        this.checkModifier(valueReference, [ast.isVisibilityModifiers], accept)
        this.checkTypeReference(accept, valueReference, valueReference.type, 'type')
    }

    checkOperation(operation: ast.Operation, accept: ValidationAcceptor): void {

        const raisedException = new Set<ast.Type | undefined>()
        for (const [index, exception] of operation.raisedException.entries()) {
            if (this.checkTypeReference(accept, operation, exception, 'raisedException', index)) {
                if (raisedException.has(exception.ref))
                    accept('error', 'Duplicated exception.', { node: operation, property: 'raisedException', index: index })
                else
                    raisedException.add(exception.ref)
            }
        }

        const isStatic = XsmpUtils.attribute(operation, 'Attributes.Static')
        if (XsmpUtils.isAttributeTrue(isStatic)) {
            if (ast.isInterface(operation.$container))
                accept('error', 'An Operation of an Interface shall not be static.', { node: isStatic as ast.Attribute });

            const isVirtual = XsmpUtils.attribute(operation, 'Attributes.Virtual')
            if (XsmpUtils.isAttributeTrue(isVirtual))
                accept('error', 'An Operation shall not be both Static and Virtual.', { node: isVirtual as ast.Attribute });

            const isAbstract = XsmpUtils.attribute(operation, 'Attributes.Abstract')
            if (XsmpUtils.isAttributeTrue(isAbstract))
                accept('error', 'An Operation shall not be both Static and Abstract.', { node: isAbstract as ast.Attribute });

            const isConst = XsmpUtils.attribute(operation, 'Attributes.Const')
            if (XsmpUtils.isAttributeTrue(isConst))
                accept('error', 'An Operation shall not be both Static and Const.', { node: isConst as ast.Attribute });
        }

        const isConstructor = XsmpUtils.attribute(operation, 'Attributes.Constructor')
        if (XsmpUtils.isAttributeTrue(isConstructor)) {
            if (XsmpUtils.isAttributeTrue(isStatic))
                accept('error', 'A Constructor shall not be Static .', { node: isStatic as ast.Attribute });

            const isVirtual = XsmpUtils.attribute(operation, 'Attributes.Virtual')
            if (XsmpUtils.isAttributeTrue(isVirtual))
                accept('error', 'A Constructor shall not be Virtual.', { node: isVirtual as ast.Attribute });

            const isConst = XsmpUtils.attribute(operation, 'Attributes.Const')
            if (XsmpUtils.isAttributeTrue(isConst))
                accept('error', 'A Constructor shall not be Const.', { node: isConst as ast.Attribute });
            if (operation.returnParameter)
                accept('error', 'A Constructors shall not have any return parameters.', { node: operation, property: 'returnParameter' });
        }


        // check that default value of parameters are provided
        let requireDefaultValue = false;
        for (const parameter of operation.parameter) {
            if (parameter.default !== undefined)
                requireDefaultValue = true;
            else if (requireDefaultValue)
                accept('error', 'The Parameter requires a default vallue.', { node: parameter, property: 'default' });
        }

    }
    checkParameter(parameter: ast.Parameter, accept: ValidationAcceptor): void {
        if (this.checkTypeReference(accept, parameter, parameter.type, 'type'))
            this.checkExpression(parameter.type.ref, parameter.default, accept) //TODO isByPointer

        const isByPointer = XsmpUtils.attribute(parameter, 'Attributes.ByPointer')
        if (XsmpUtils.isAttributeTrue(isByPointer) && XsmpUtils.isAttributeTrue(XsmpUtils.attribute(parameter, 'Attributes.ByReference')))
            accept('error', 'A Parameter shall not be both ByPointer and ByReference.', { node: isByPointer as ast.Attribute });
    }

    checkReturnParameter(parameter: ast.ReturnParameter, accept: ValidationAcceptor): void {
        this.checkTypeReference(accept, parameter, parameter.type, 'type')

        const isByPointer = XsmpUtils.attribute(parameter, 'Attributes.ByPointer')
        if (XsmpUtils.isAttributeTrue(isByPointer) && XsmpUtils.isAttributeTrue(XsmpUtils.attribute(parameter, 'Attributes.ByReference')))
            accept('error', 'A Parameter shall not be both ByPointer and ByReference.', { node: isByPointer as ast.Attribute });
    }

    checkPrimitiveType(type: ast.PrimitiveType, accept: ValidationAcceptor): void {
        this.checkModifier(type, [ast.isVisibilityModifiers], accept)
        if (!XsmpUtils.getPrimitiveTypeKind(type))
            accept('error', 'Unsupported Primitive Type.', { node: type, property: 'name' });
    }
}
