import type { AstNode, CstNode, JSDocComment, JSDocParagraph, JSDocTag, Stream } from 'langium';
import { AstUtils, CstUtils, isJSDoc, isLeafCstNode, isRootCstNode, parseJSDoc, stream } from 'langium';
import * as ast from '../generated/ast.js';
import * as Solver from './solver.js';
import { PTK } from './primitive-type-kind.js';
import { VisibilityKind } from './visibility-kind.js';
import { OperatorKind } from './operator-kind.js';

export type Attributes = 'Attributes.Static'
    | 'Attributes.Const' | 'Attributes.Mutable'
    | 'Attributes.ByPointer' | 'Attributes.ByReference'
    | 'Attributes.Abstract' | 'Attributes.Virtual'
    | 'Attributes.Constructor' | 'Attributes.Forcible'
    | 'Attributes.Failure' | 'Attributes.ConstGetter'
    | 'Attributes.NoConstructor' | 'Attributes.NoDestructor'
    | 'Attributes.SimpleArray' | 'Attributes.Operator' | 'Attributes.View';

/**
 * Get the full qualified name of an element
 * @param element the element
 * @param separator optional separator (default is '.')
 * @returns qualified name separated by the separator
 */
export function fqn(node: ast.NamedElement | ast.ReturnParameter | undefined, separator: string = '.'): string {
    if (!node) {
        return '<undefined>';
    }
    let name = node.name ?? 'return';
    let parent = node.$container;

    while (parent && (parent.$type === ast.Namespace || ast.reflection.isSubtype(parent.$type, ast.Type))) {
        name = `${(parent as ast.NamedElement).name}${separator}${name}`;
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
export function getVisibility(node: ast.VisibilityElement): VisibilityKind | undefined {
    if (node.modifiers.includes('private')) { return VisibilityKind.private; }
    if (node.modifiers.includes('protected')) { return VisibilityKind.protected; }
    if (node.modifiers.includes('public')) { return VisibilityKind.public; }
    return undefined;
}
export function getRealVisibility(node: ast.NamedElement): VisibilityKind {

    if (ast.reflection.isSubtype(node.$type, ast.VisibilityElement)) {
        if (node.$container?.$type === ast.Structure || node.$container?.$type === ast.Interface) {
            return VisibilityKind.public;
        }
        return getVisibility(node as ast.VisibilityElement) ?? VisibilityKind.private;
    }
    return VisibilityKind.public;
}

export function getAccessKind(node: ast.Property): ast.AccessKind | undefined {
    if (node.modifiers.includes('readOnly')) { return 'readOnly'; }
    if (node.modifiers.includes('readWrite')) { return 'readWrite'; }
    if (node.modifiers.includes('writeOnly')) { return 'writeOnly'; }
    return undefined;
}

export function getViewKind(node: ast.Property | ast.Field | ast.Operation | ast.EntryPoint): ast.Expression | undefined {
    return attribute(node, 'Attributes.View')?.value;
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
export function isString8(type: ast.Type | undefined): boolean {
    return fqn(type) === 'Smp.String8';
}
export function getPTK(type: ast.Type | undefined, defaultKind: PTK = PTK.None): PTK {
    if (!type) { return defaultKind; }
    switch (type.$type) {
        case ast.PrimitiveType:
            switch (fqn(type)) {
                case 'Smp.Bool': return PTK.Bool;
                case 'Smp.Char8': return PTK.Char8;
                case 'Smp.DateTime': return PTK.DateTime;
                case 'Smp.Duration': return PTK.Duration;
                case 'Smp.Float32': return PTK.Float32;
                case 'Smp.Float64': return PTK.Float64;
                case 'Smp.Int8': return PTK.Int8;
                case 'Smp.Int16': return PTK.Int16;
                case 'Smp.Int32': return PTK.Int32;
                case 'Smp.Int64': return PTK.Int64;
                case 'Smp.UInt8': return PTK.UInt8;
                case 'Smp.UInt16': return PTK.UInt16;
                case 'Smp.UInt32': return PTK.UInt32;
                case 'Smp.UInt64': return PTK.UInt64;
                case 'Smp.String8': return PTK.String8;
                default: return PTK.None;
            }
        case ast.Float: return getPTK((type as ast.Float).primitiveType?.ref, PTK.Float64);
        case ast.Integer: return getPTK((type as ast.Integer).primitiveType?.ref, PTK.Int32);
        case ast.StringType: return PTK.String8;
        case ast.Enumeration: return PTK.Enum;
        default: return PTK.None;
    }
}

export function findCommentNode(cstNode: CstNode | undefined): CstNode | undefined {
    if (cstNode) {
        let previous = CstUtils.getPreviousNode(cstNode, true);
        while (previous) {
            if (isCommentNode(previous)) {
                return previous;
            }
            if (!previous.hidden) {
                break;
            }
            previous = CstUtils.getPreviousNode(previous, true);
        }
        if (isRootCstNode(cstNode)) {
            // Go from the first non-hidden node through all nodes in reverse order
            // We do this to find the comment node which directly precedes the root node
            const endIndex = cstNode.content.findIndex(e => !e.hidden);
            for (let i = endIndex - 1; i >= 0; i--) {
                const child = cstNode.content[i];
                if (isCommentNode(child)) {
                    return child;
                }
            }
        }
    }
    return undefined;
}

function isCommentNode(cstNode: CstNode): boolean {
    return isLeafCstNode(cstNode) && 'ML_COMMENT' === cstNode.tokenType.name && isJSDoc(cstNode);
}

export function getJSDoc(element: AstNode): JSDocComment | undefined {
    const comment = findCommentNode(element.$cstNode);
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
    return getTag(element, 'id')?.toString().trim();
}
export function getNativeType(element: ast.NativeType): string | undefined {
    return getTag(element, 'type')?.toString().trim();
}
export function getNativeNamespace(element: ast.NativeType): string | undefined {
    return getTag(element, 'namespace')?.toString().trim();
}
export function getNativeLocation(element: ast.NativeType): string | undefined {
    return getTag(element, 'location')?.toString().trim();
}
export function isMulticast(element: ast.EventSource): boolean {
    return getTag(element, 'singlecast') === undefined;
}

export function getPropertyCategory(element: ast.Property): string | undefined {
    return getTag(element, 'category')?.toString().trim();
}
export function getUnit(element: ast.Integer | ast.Float): string | undefined {
    return getTag(element, 'unit')?.toString().trim();
}

export function getTitle(element: ast.Document): string | undefined {
    return getTag(element, 'title')?.toString().trim();
}
export function getDate(element: ast.Document): JSDocParagraph | undefined {
    return getTag(element, 'date');
}

export function getCreator(element: ast.Document): string | undefined {
    return getTags(element, 'creator')?.map(e => e.toString().trim()).join(', ');
}
export function getVersion(element: ast.Document): string | undefined {
    return getTag(element, 'version')?.toString().trim();
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

export function getDescription(element: ast.NamedElement | ast.ReturnParameter): string | undefined {
    if (ast.Parameter === element.$type) {
        const regex = new RegExp(`^${element.name}\\s`);
        return getJSDoc(element.$container as AstNode)?.getTags('param').find(t => regex.test(t.content.toString()))?.content.toString().slice(element.name.length).trim();
    }
    if (ast.ReturnParameter === element.$type) {
        return getJSDoc(element.$container)?.getTag('return')?.content.toString().trim();
    }
    const jsDoc = getJSDoc(element);
    if (!jsDoc) {
        return undefined;
    }

    const result: string[] = [];
    for (const e of jsDoc.elements) {
        if (typeof (e as JSDocTag).name === 'string' && !(e as JSDocTag).inline) {
            break;
        }
        result.push(e.toString());
    }
    return result.length > 0 ? result.join('\n').trim() : undefined;
}
export function isConstructor(element: ast.NamedElement | ast.ReturnParameter): boolean | undefined {
    return attributeBoolValue(element, 'Attributes.Constructor');
}
export function operatorKind(op: ast.Operation): OperatorKind {
    const attr = attribute(op, 'Attributes.Operator');
    if (!attr?.value) {
        return OperatorKind.NONE;
    }
    const value = Solver.getValueAs(attr.value, (attr.type.ref as ast.AttributeType).type.ref!)?.enumerationLiteral()?.getValue();
    switch (value?.name) {
        case 'Positive': return OperatorKind.POSITIVE;
        case 'Negative': return OperatorKind.NEGATIVE;
        case 'Assign': return OperatorKind.ASSIGN;
        case 'Add': return OperatorKind.ADD;
        case 'Subtract': return OperatorKind.SUBTRACT;
        case 'Multiply': return OperatorKind.MULTIPLY;
        case 'Divide': return OperatorKind.DIVIDE;
        case 'Remainder': return OperatorKind.REMAINDER;
        case 'Greater': return OperatorKind.GREATER;
        case 'Less': return OperatorKind.LESS;
        case 'Equal': return OperatorKind.EQUAL;
        case 'NotGreater': return OperatorKind.NOT_GREATER;
        case 'NotLess': return OperatorKind.NOT_LESS;
        case 'NotEqual': return OperatorKind.NOT_EQUAL;
        case 'Indexer': return OperatorKind.INDEXER;
        case 'Sum': return OperatorKind.SUM;
        case 'Difference': return OperatorKind.DIFFERENCE;
        case 'Product': return OperatorKind.PRODUCT;
        case 'Quotient': return OperatorKind.QUOTIENT;
        case 'Module': return OperatorKind.MODULE;
        case 'None':
        default:
            return OperatorKind.NONE;
    }
}
export function isFailure(element: ast.Field): boolean | undefined {
    return attributeBoolValue(element, 'Attributes.Failure');
}
export function isForcible(element: ast.Field): boolean | undefined {
    return attributeBoolValue(element, 'Attributes.Forcible');
}
export function isStatic(element: ast.Operation | ast.Property | ast.Field | ast.Association): boolean | undefined {
    return !isConstructor(element) && attributeBoolValue(element, 'Attributes.Static');
}
export function isAbstract(element: ast.Operation | ast.Property): boolean {
    return !isStatic(element)
        && (ast.isInterface(element.$container) || (attributeBoolValue(element, 'Attributes.Abstract') ?? false));
}
export function isVirtual(element: ast.Operation | ast.Property): boolean {
    return !isConstructor(element) && (isAbstract(element) || (attributeBoolValue(element, 'Attributes.Virtual') ?? (ast.isReferenceType(element.$container) && !isStatic(element))));
}

export function isMutable(element: ast.Field | ast.Association): boolean | undefined {
    return attributeBoolValue(element, 'Attributes.Mutable');
}
export function isConst(element: ast.Parameter | ast.ReturnParameter | ast.Association | ast.Operation | ast.Property): boolean | undefined {
    if (isConstructor(element)) {
        return false;
    }
    return attributeBoolValue(element, 'Attributes.Const') ?? (ast.isParameter(element) && (!element.direction || element.direction === 'in') && !ast.isValueType(element.type.ref));
}
export function isConstGetter(element: ast.Property): boolean | undefined {
    return attributeBoolValue(element, 'Attributes.ConstGetter');
}

function kind(parameter: ast.Parameter | ast.ReturnParameter): ArgKind {
    if (ast.isReferenceType(parameter.type.ref)) {
        if (ast.isParameter(parameter) && (parameter.direction === undefined || parameter.direction === 'in')) {
            return ArgKind.BY_REF;
        }
        return ArgKind.BY_PTR;
    }
    if ((ast.isNativeType(parameter.type.ref) || ast.isValueType(parameter.type.ref)) && ast.isParameter(parameter) && (parameter.direction === 'inout' || parameter.direction === 'out')) {
        return ArgKind.BY_PTR;
    }
    return ArgKind.BY_VALUE;
}

enum ArgKind {
    BY_VALUE, BY_PTR, BY_REF
}

export function isByPointer(element: ast.Parameter | ast.ReturnParameter | ast.Association | ast.Property): boolean {
    const value = attributeBoolValue(element, 'Attributes.ByPointer');
    switch (element.$type) {
        case ast.Association: return value ?? ast.isReferenceType(element.type.ref);
        case ast.Property: return value ?? (ast.isReferenceType(element.type.ref) && !isByReference(element));
        case ast.Parameter:
        case ast.ReturnParameter:
            return value ?? (kind(element) === ArgKind.BY_PTR && !(attributeBoolValue(element, 'Attributes.ByReference') ?? false));
    }

}
export function isByReference(element: ast.Parameter | ast.ReturnParameter | ast.Property): boolean {
    const value = attributeBoolValue(element, 'Attributes.ByReference');
    switch (element.$type) {
        case ast.Property: return value ?? false;
        case ast.Parameter:
        case ast.ReturnParameter:
            return value ?? (kind(element) === ArgKind.BY_REF && !(attributeBoolValue(element, 'Attributes.ByPointer') ?? false));
    }
}

export function isSimpleArray(element: ast.ArrayType): boolean | undefined {
    return attributeBoolValue(element, 'Attributes.SimpleArray');
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
    return Solver.getValue(element.multiplicity.lower)?.integralValue(PTK.Int64)?.getValue();
}

export function getUpper(element: ast.NamedElementWithMultiplicity): bigint | undefined {
    if (element.optional || element.multiplicity === undefined) {
        return BigInt(1);
    }
    if (element.multiplicity.lower === undefined && element.multiplicity.upper === undefined) {
        return BigInt(-1);
    }
    if (element.multiplicity.upper === undefined) {
        return element.multiplicity.aux ? BigInt(-1) : Solver.getValue(element.multiplicity.lower)?.integralValue(PTK.Int64)?.getValue() ?? BigInt(0);
    }
    return Solver.getValue(element.multiplicity.upper)?.integralValue(PTK.Int64)?.getValue();
}

export function getAllFields(element: ast.Structure): Stream<ast.Field> {
    // Return non static and public fields from element's base if any and current element
    const result = stream(element.elements).filter(ast.isField).filter(f => isStatic(f) !== true && getRealVisibility(f) === VisibilityKind.public);
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
    if (ast.isInterface(base)) {
        return base.base.some(i => checkIsBaseOfReferenceType(parent, i.ref, visited));
    }

    if (ast.isComponent(base)) {
        return (base.base !== undefined && checkIsBaseOfReferenceType(parent, base.base.ref, visited)) ||
            base.interface.some(i => checkIsBaseOfReferenceType(parent, i.ref, visited));
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
    return element.$container === AstUtils.getContainerOfType(from, ast.isType) || getRealVisibility(element) !== VisibilityKind.private;
}
export function isTypeVisibleFrom(from: AstNode, element: ast.Type): boolean {
    const visibility = getRealVisibility(element);
    return !((visibility === VisibilityKind.protected && AstUtils.getDocument(element) !== AstUtils.getDocument(from)) ||
        (visibility === VisibilityKind.private && !isAncestor(AstUtils.getContainerOfType(from, ast.isNamespace), element)));

}

/**
 * Compute the signature of an element
 *
 * @param op
 *          the input Operation
 * @return the signature
 */
export function getSignature(element: ast.NamedElement): string {
    if (ast.Operation === element.$type) {
        return `${element.name}(${(element as ast.Operation).parameter.map(getParameterSignature).join(',')})`;
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
export function getParameterSignature(p: ast.Parameter) {
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
