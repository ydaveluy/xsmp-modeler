import type { AstNode, CstNode, JSDocComment, JSDocParagraph, Stream } from 'langium';
import { AstUtils, CstUtils, isAstNodeWithComment, isJSDoc, parseJSDoc, stream } from 'langium';
import * as ast from '../generated/ast.js';
import * as Solver from './solver.js';

export type IntegralPrimitiveTypeKind = 'Int8' | 'Int16' | 'UInt8' | 'UInt16' | 'Int32' | 'Int64' | 'UInt32' | 'UInt64' | 'DateTime' | 'Duration';

const integralTypes = new Set<PrimitiveTypeKind>([
    'Int8', 'Int16', 'UInt8', 'UInt16', 'Int32', 'Int64', 'UInt32', 'UInt64', 'DateTime', 'Duration'
]);

export function isIntegralType(type: PrimitiveTypeKind): type is IntegralPrimitiveTypeKind {
    return integralTypes.has(type);
}
export type FloatingPrimitiveTypeKind = 'Float32' | 'Float64';

const floatingTypes = new Set<PrimitiveTypeKind>([
    'Float32', 'Float64'
]);

export function isFloatingType(type: PrimitiveTypeKind): type is FloatingPrimitiveTypeKind {
    return floatingTypes.has(type);
}
export type PrimitiveTypeKind = 'Bool' | 'Char8' | FloatingPrimitiveTypeKind | IntegralPrimitiveTypeKind | 'String8' | 'None' | 'Enum';

export type Attributes = 'Attributes.Static'
    | 'Attributes.Const' | 'Attributes.Mutable'
    | 'Attributes.ByPointer' | 'Attributes.ByReference'
    | 'Attributes.Abstract' | 'Attributes.Virtual'
    | 'Attributes.Constructor' | 'Attributes.Forcible'
    | 'Attributes.Failure' | 'Attributes.ConstGetter'
    | 'Attributes.NoConstructor' | 'Attributes.NoDestructor'
    | 'Attributes.SimpleArray' | 'Attributes.OperatorKind';

/**
 * Get the full qualified name of an element
 * @param element the element
 * @param separator optional separator (default is '.')
 * @returns qualified name separated by the separator
 */
export function fqn(node: ast.NamedElement | ast.ReturnParameter, separator: string = '.'): string {
    let name = node.name ?? 'return',
        parent = node.$container;

    while (ast.isNamespace(parent) || ast.isType(parent)) {
        name = `${parent.name}${separator}${name}`;
        parent = parent.$container;
    }
    return name;
}

export function escape(input: string | undefined): string {
    if (!input) {
        return '';
    }
    return input.replaceAll('\t', '\\t').replaceAll('\b', '\\b').replaceAll('\n', '\\n').replaceAll('\r', '\\r')
        .replaceAll('\f', '\\f').replaceAll("'", "\\'").replaceAll('"', '\\"');
}

/**
 * @param element the element
 * @returns the visibility
 */
export function getVisibility(node: ast.VisibilityElement): ast.VisibilityModifiers | undefined {
    if (node.modifiers.includes('private')) { return 'private'; }
    if (node.modifiers.includes('protected')) { return 'protected'; }
    if (node.modifiers.includes('public')) { return 'public'; }
    return undefined;
}
export function getRealVisibility(node: ast.VisibilityElement): ast.VisibilityModifiers {
    if (node.$container?.$type === ast.Structure || node.$container?.$type === ast.Interface) { return 'public'; }

    return getVisibility(node) ?? 'private';
}

export function getAccessKind(node: ast.Property): ast.AccessKind | undefined {
    if (node.modifiers.includes('readOnly')) { return 'readOnly'; }
    if (node.modifiers.includes('readWrite')) { return 'readWrite'; }
    if (node.modifiers.includes('writeOnly')) { return 'writeOnly'; }
    return undefined;
}

export function isAbstractType(node: ast.Class | ast.Component): boolean {
    return node.modifiers.includes('abstract');
}
export function isInput(node: ast.VisibilityElement): boolean {
    return node.modifiers.includes('input');
}
export function isOutput(node: ast.VisibilityElement): boolean {
    return node.modifiers.includes('output');
}
export function isState(node: ast.VisibilityElement): boolean {
    return !node.modifiers.includes('transient');
}

export function getPrimitiveTypeKind(type: ast.Type): PrimitiveTypeKind {
    if (ast.isPrimitiveType(type)) {
        switch (fqn(type)) {
            case 'Smp.Bool': return 'Bool';
            case 'Smp.Char8': return 'Char8';
            case 'Smp.DateTime': return 'DateTime';
            case 'Smp.Duration': return 'Duration';
            case 'Smp.Float32': return 'Float32';
            case 'Smp.Float64': return 'Float64';
            case 'Smp.Int8': return 'Int8';
            case 'Smp.Int16': return 'Int16';
            case 'Smp.Int32': return 'Int32';
            case 'Smp.Int64': return 'Int64';
            case 'Smp.UInt8': return 'UInt8';
            case 'Smp.UInt16': return 'UInt16';
            case 'Smp.UInt32': return 'UInt32';
            case 'Smp.UInt64': return 'UInt64';
            case 'Smp.String8': return 'String8';
        }
    }
    else if (ast.isFloat(type)) { return type.primitiveType?.ref ? getPrimitiveTypeKind(type.primitiveType.ref) : 'Float64'; }
    else if (ast.isInteger(type)) { return type.primitiveType?.ref ? getPrimitiveTypeKind(type.primitiveType.ref) : 'Int32'; }
    else if (ast.isStringType(type)) { return 'String8'; }
    else if (ast.isEnumeration(type)) { return 'Enum'; }
    return 'None';
}

function getCommentNode(node: AstNode): CstNode | undefined {
    return isAstNodeWithComment(node) ? node.$cstNode : CstUtils.findCommentNode(node.$cstNode, ['ML_COMMENT']);
}

export function getJSDoc(element: AstNode): JSDocComment | undefined {
    const comment = getCommentNode(element);
    if (comment && isJSDoc(comment)) {
        return parseJSDoc(comment);
    }
    return undefined;
}

function getTag(element: AstNode, tagName: string): JSDocParagraph | undefined {
    const tag = getJSDoc(element)?.getTag(tagName);
    return tag?.inline ? undefined : tag?.content;
}

function getTags(element: AstNode, tagName: string): JSDocParagraph[] | undefined {
    return getJSDoc(element)?.getTags(tagName).filter(t => !t.inline).map(t => t.content);
}

export function getUsages(element: ast.AttributeType): JSDocParagraph[] | undefined {
    return getTags(element, 'usage');
}

export function getId(element: ast.NamedElement | ast.ReturnParameter): string | undefined {
    return getTag(element, 'id')?.toString();
}
export function getNativeType(element: ast.NativeType): string | undefined {
    return getTag(element, 'type')?.toString();
}
export function getNativeNamespace(element: ast.NativeType): string | undefined {
    return getTag(element, 'namespace')?.toString();
}
export function getNativeLocation(element: ast.NativeType): string | undefined {
    return getTag(element, 'location')?.toString();
}
export function isMulticast(element: ast.EventSource): boolean {
    return getTag(element, 'singlecast') === undefined;
}

export function getPropertyCategory(element: ast.Property): string | undefined {
    return getTag(element, 'category')?.toString();
}
export function getUnit(element: ast.Integer | ast.Float): string | undefined {
    return getTag(element, 'unit')?.toString();
}

export function getTitle(element: ast.Document): string | undefined {
    return getTag(element, 'title')?.toString();
}
export function getDate(element: ast.Document): JSDocParagraph | undefined {
    return getTag(element, 'date');
}

export function getCreator(element: ast.Document): string | undefined {
    return getTags(element, 'creator')?.map(e => e.toString()).join(', ');
}
export function getVersion(element: ast.Document): string | undefined {
    return getTag(element, 'version')?.toString();
}

export function getUuid(type: ast.Type): JSDocParagraph | undefined {
    return getTag(type, 'uuid');
}

export function getDeprecated(element: ast.NamedElement): JSDocParagraph | undefined {
    return getTag(element, 'deprecated');
}

export function IsDeprecated(element: ast.NamedElement): boolean {
    return getDeprecated(element) !== undefined;
}

export function attribute(element: ast.NamedElement | ast.ReturnParameter, id: Attributes): ast.Attribute | undefined {
    return element.attributes.find(a => a.type.ref && fqn(a.type.ref) === id);
}
export function isAttributeTrue(attribute: ast.Attribute | undefined): boolean | undefined {
    if (!attribute) {
        return undefined;
    }
    if (attribute.value) {
        return Solver.getValue(attribute.value)?.boolValue()?.getValue();
    }
    if (ast.isAttributeType(attribute.type.ref)) {
        return Solver.getValue(attribute.type.ref.default)?.boolValue()?.getValue();
    }
    return undefined;
}

function attributeBoolValue(element: ast.NamedElement | ast.ReturnParameter, id: Attributes): boolean | undefined {
    return isAttributeTrue(attribute(element, id));
}

export function getDescription(element: ast.NamedElement): string | undefined {
    const jsDoc = getJSDoc(element);
    if (!jsDoc) {
        return undefined;
    }

    const result: string[] = [];
    for (const e of jsDoc.elements) {
        const text = e.toString();
        if (text.startsWith('@')) {
            break;
        }
        result.push(text);
    }
    return result.length > 0 ? result.join('\n').trim() : undefined;
}
export function getParameterDescription(element: ast.Parameter): string | undefined {
    const regex = new RegExp(`^${element.name}\\s`);
    return getJSDoc(element.$container)?.getTags('param').find(t => regex.test(t.content.toString()))?.content.toString().slice(element.name.length).trim();
}
export function getReturnParameterDescription(element: ast.ReturnParameter): string | undefined {
    return getJSDoc(element.$container)?.getTag('return')?.content.toString().trim();
}

export function isStatic(element: ast.NamedElement | ast.ReturnParameter): boolean {
    return attributeBoolValue(element, 'Attributes.Static') ?? false;
}
export function isAbstract(element: ast.Operation | ast.Property): boolean {
    return attributeBoolValue(element, 'Attributes.Abstract') ?? false;
}

export function isConst(element: ast.Parameter | ast.ReturnParameter | ast.Association | ast.Operation | ast.Property): boolean {
    return attributeBoolValue(element, 'Attributes.Const') ?? false;
}
export function isByPointer(element: ast.Parameter | ast.ReturnParameter | ast.Association | ast.Property): boolean {
    return attributeBoolValue(element, 'Attributes.ByPointer') ?? false;
}
export function isByReference(element: ast.Parameter | ast.ReturnParameter | ast.Property): boolean {
    return attributeBoolValue(element, 'Attributes.ByReference') ?? false;
}

export function isSimpleArray(element: ast.ArrayType): boolean {
    return attributeBoolValue(element, 'Attributes.SimpleArray') ?? false;
}

export function allowMultiple(element: ast.AttributeType): boolean {
    return getTag(element, 'allowMultiple') !== undefined;
}

export function isAncestor(ancestor: AstNode | undefined, element: AstNode | undefined): boolean {
    return AstUtils.hasContainerOfType(element, c => c === ancestor);
}

export function getLower(element: ast.NamedElementWithMultiplicity): bigint | undefined {
    if (element.optional) {
        return BigInt(0);
    }
    if (element.multiplicity === undefined) {
        return BigInt(1);
    }
    if (element.multiplicity.lower === undefined && element.multiplicity.upper === undefined) {
        return BigInt(element.multiplicity.aux ? 1 : 0);
    }
    return Solver.getValue(element.multiplicity.lower)?.integralValue('Int64')?.getValue();
}

export function getUpper(element: ast.NamedElementWithMultiplicity): bigint | undefined {
    if (element.optional || element.multiplicity === undefined) {
        return BigInt(1);
    }
    if (element.multiplicity.lower === undefined && element.multiplicity.upper === undefined) {
        return BigInt(-1);
    }
    if (element.multiplicity.upper === undefined) {
        return element.multiplicity.aux ? BigInt(-1) : Solver.getValue(element.multiplicity.lower)?.integralValue('Int64')?.getValue() ?? BigInt(0);
    }
    return Solver.getValue(element.multiplicity.upper)?.integralValue('Int64')?.getValue();
}

export function getAllFields(element: ast.Structure): Stream<ast.Field> {
    // Return non static and public fields from element's base if any and current element
    const result = stream(element.elements).filter(ast.isField).filter(f => !isStatic(f) && getRealVisibility(f) === 'public');
    if (ast.isClass(element) && ast.isStructure(element.base)) {
        return getAllFields(element.base).concat(result);
    }
    return result;
}

function checkIsBaseOfInterface(parent: ast.Interface, base: ast.Type | undefined, visited: Set<ast.Type>): boolean {
    if (!base || visited.has(base)) {
        return false;
    }
    visited.add(base);
    return base === parent || ast.isInterface(base) && base.base.some(b => checkIsBaseOfInterface(parent, b.ref, visited));
}

export function isBaseOfInterface(parent: ast.Interface, base: ast.Type | undefined): boolean {
    return checkIsBaseOfInterface(parent, base, new Set<ast.Type>());
}

function checkIsBaseOfComponent(parent: ast.Component, base: ast.Type | undefined, visited: Set<ast.Type>): boolean {
    if (!base || visited.has(base)) {
        return false;
    }
    visited.add(base);
    return base === parent || ast.isComponent(base) && base.base !== undefined && checkIsBaseOfComponent(parent, base.base.ref, visited);
}
export function isBaseOfComponent(parent: ast.Component, base: ast.Type | undefined): boolean {
    return checkIsBaseOfComponent(parent, base, new Set<ast.Type>());
}

function checkIsBaseOfClass(parent: ast.Class, base: ast.Type | undefined, visited: Set<ast.Type>): boolean {
    if (!base || visited.has(base)) {
        return false;
    }
    visited.add(base);
    return base === parent || ast.isClass(base) && base.base !== undefined && checkIsBaseOfClass(parent, base.base.ref, visited);
}
export function isBaseOfClass(parent: ast.Class, base: ast.Type | undefined): boolean {
    return checkIsBaseOfClass(parent, base, new Set<ast.Type>());
}

function checkIsBaseOfReferenceType(parent: ast.ReferenceType, base: ast.Type | undefined, visited: Set<ast.Type>): boolean {
    if (!base || visited.has(base)) {
        return false;
    }
    if (base === parent) {
        return true;
    }
    visited.add(base);
    if (ast.isInterface(parent)) {
        return checkIsBaseOfInterface(parent, base, visited);
    }

    if (ast.isComponent(parent)) {
        return (parent.base !== undefined && checkIsBaseOfReferenceType(parent, parent.base.ref, visited)) ||
            parent.interface.some(i => checkIsBaseOfReferenceType(parent, i.ref, visited));
    }

    return false;
}
export function isBaseOfReferenceType(parent: ast.ReferenceType, base: ast.Type | undefined): boolean {
    return checkIsBaseOfReferenceType(parent, base, new Set<ast.Type>());
}

function checkIsRecursiveType(parent: ast.Type, other: ast.Type | undefined, visited: Set<ast.Type>): boolean {

    if (!other || visited.has(other)) {
        return false;
    }
    visited.add(other);
    if (parent === other) {
        return true;
    }
    if (ast.isArrayType(other)) {
        return checkIsRecursiveType(parent, other.itemType.ref, visited);
    }
    if (ast.isStructure(other)) {
        return other.elements.filter(ast.isField).some(f => checkIsRecursiveType(parent, f.type.ref, visited));
    }
    return false;
}

export function isRecursiveType(parent: ast.Type, other: ast.Type | undefined): boolean {
    return checkIsRecursiveType(parent, other, new Set<ast.Type>());
}

export function isConstantVisibleFrom(from: ast.Expression, element: ast.Constant): boolean {
    return element.$container === AstUtils.getContainerOfType(from, ast.isType) || getRealVisibility(element) !== 'private';
}
export function isTypeVisibleFrom(from: AstNode, element: ast.Type): boolean {
    const visibility = getRealVisibility(element);
    return !((visibility === 'protected' && AstUtils.getDocument(element) !== AstUtils.getDocument(from)) ||
        (visibility === 'private' && !isAncestor(AstUtils.getContainerOfType(from, ast.isNamespace), element)));

}

/**
 * Compute the signature of an element
 *
 * @param op
 *          the input Operation
 * @return the signature
 */
export function getSignature(element: ast.NamedElement): string {
    if (ast.isOperation(element)) {
        return `${element.name}(${element.parameter.map(getParameterSignature).join(',')})`;
    }
    return element.name;
}

/**
 * Get the signature of a parameter
 *
 * @param p
 *          the input Parameter
 * @return the signature of the parameter
 */
function getParameterSignature(p: ast.Parameter) {
    let signature = '';
    if (isConst(p)) {
        signature += 'const ';
    }
    signature += p.type.ref ? fqn(p.type.ref) : p.type.$refText;
    if (isByPointer(p)) {
        signature += '*';
    }
    if (isByReference(p)) {
        signature += '&';
    }
    return signature;
}
export function getNodeType(node: AstNode): string {
    switch (node.$type) {

        case ast.Reference_:
            return 'Reference';
        case ast.ArrayType:
            return 'Array';
        case ast.ReturnParameter:
            return ast.Parameter;
        case ast.StringType:
            return 'String';
        default:
            return node.$type;
    }
}

export function getKeywordForType(type: ast.Type): string | undefined {
    switch (type.$type) {
        case ast.ArrayType: return 'array';
        case ast.AttributeType: return 'attribute';
        case ast.Class: return 'class';
        case ast.Enumeration: return 'enum';
        case ast.EventType: return 'event';
        case ast.Exception: return 'exception';
        case ast.Float: return 'float';
        case ast.Integer: return 'integer';
        case ast.Interface: return 'interface';
        case ast.Model: return 'model';
        case ast.NativeType: return 'native';
        case ast.PrimitiveType: return 'primitive';
        case ast.Service: return 'service';
        case ast.StringType: return 'string';
        case ast.Structure: return 'struct';
        case ast.ValueReference: return 'using';
    }
    return undefined;
}
