import { AstNode, AstUtils, CstNode, CstUtils, isAstNodeWithComment, isJSDoc, JSDocComment, JSDocTag, parseJSDoc, Reference, stream, Stream } from "langium";
import * as ast from "../generated/ast.js";
import { Solver } from "./solver.js";




export type IntegralPrimitiveTypeKind = 'Int8' | 'Int16' | 'UInt8' | 'UInt16' | 'Int32' | 'Int64' | 'UInt32' | 'UInt64' | 'DateTime' | 'Duration';

const integralTypes: Set<PrimitiveTypeKind> = new Set([
    'Int8', 'Int16', 'UInt8', 'UInt16', 'Int32', 'Int64', 'UInt32', 'UInt64', 'DateTime', 'Duration'
]);


export function isIntegralType(type: PrimitiveTypeKind): type is IntegralPrimitiveTypeKind {
    return integralTypes.has(type);
}
export type FloatingPrimitiveTypeKind = 'Float32' | 'Float64';

const floatingTypes: Set<PrimitiveTypeKind> = new Set([
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

export class XsmpUtils {

    /**
     * @param element the element
     * @returns qualified name separated by `.`
     */
    public static getQualifiedName(node: ast.NamedElement | ast.ReturnParameter): string {
        let name = node.name ?? 'return';
        let parent = node.$container;

        while (ast.isNamespace(parent) || ast.isType(parent)) {
            name = `${parent.name}.${name}`;
            parent = parent.$container;
        }
        return name;
    }


    public static escape(input: string | undefined): string {
        if (!input) return ''
        return input.replaceAll('\t', '\\t').replaceAll('\b', '\\b').replaceAll('\n', '\\n').replaceAll('\r', '\\r')
            .replaceAll('\f', '\\f').replaceAll("'", "\\'").replaceAll('"', '\\"');
    }


    /**
     * @param element the element
     * @returns the visibility
     */
    public static getVisibility(node: ast.VisibilityElement): ast.VisibilityModifiers | undefined {
        if (node.modifiers.includes('private'))
            return 'private'
        if (node.modifiers.includes('protected'))
            return 'protected'
        if (node.modifiers.includes('public'))
            return 'public'
        return undefined;
    }
    public static getRealVisibility(node: ast.VisibilityElement): ast.VisibilityModifiers {
        const visibility = XsmpUtils.getVisibility(node)
        if (visibility)
            return visibility
        if (node.$container?.$type === ast.Structure || node.$container?.$type === ast.Interface)
            return 'public'
        return 'private'
    }

    public static getAccessKind(node: ast.Property): ast.AccessKind | undefined {
        if (node.modifiers.includes('readOnly'))
            return 'readOnly'
        if (node.modifiers.includes('readWrite'))
            return 'readWrite'
        if (node.modifiers.includes('writeOnly'))
            return 'writeOnly'
        return undefined;
    }

    public static isAbstractType(node: ast.Class | ast.Component): boolean {
        return node.modifiers.includes('abstract')
    }
    public static isInput(node: ast.VisibilityElement): boolean {
        return node.modifiers.includes('input')
    }
    public static isOutput(node: ast.VisibilityElement): boolean {
        return node.modifiers.includes('output')
    }
    public static isState(node: ast.VisibilityElement): boolean {
        return !node.modifiers.includes('transient')
    }

    public static getPrimitiveTypeKind(type: ast.Type): PrimitiveTypeKind {
        if (ast.isPrimitiveType(type)) {
            switch (XsmpUtils.getQualifiedName(type)) {
                case 'Smp.Bool': return 'Bool'
                case 'Smp.Char8': return 'Char8'
                case 'Smp.DateTime': return 'DateTime'
                case 'Smp.Duration': return 'Duration'
                case 'Smp.Float32': return 'Float32'
                case 'Smp.Float64': return 'Float64'
                case 'Smp.Int8': return 'Int8'
                case 'Smp.Int16': return 'Int16'
                case 'Smp.Int32': return 'Int32'
                case 'Smp.Int64': return 'Int64'
                case 'Smp.UInt8': return 'UInt8'
                case 'Smp.UInt16': return 'UInt16'
                case 'Smp.UInt32': return 'UInt32'
                case 'Smp.UInt64': return 'UInt64'
                case 'Smp.String8': return 'String8'
            }
        }
        else if (ast.isFloat(type)) {
            if (type.primitiveType?.ref)
                return XsmpUtils.getPrimitiveTypeKind(type.primitiveType.ref)
            return 'Float64'
        }
        else if (ast.isInteger(type)) {
            if (type.primitiveType?.ref)
                return XsmpUtils.getPrimitiveTypeKind(type.primitiveType.ref)
            return 'Int32'
        }
        else if (ast.isStringType(type)) {
            return 'String8'
        }
        else if (ast.isEnumeration(type)) {
            return 'Enum'
        }
        return 'None'
    }

    protected static getCommentNode(node: AstNode): CstNode | undefined {
        if (isAstNodeWithComment(node)) {
            return node.$cstNode;
        }
        return CstUtils.findCommentNode(node.$cstNode, ['ML_COMMENT']);
    }

    public static getJSDoc(element: AstNode): JSDocComment | undefined {
        const comment = XsmpUtils.getCommentNode(element)
        if (comment && isJSDoc(comment)) {
            return parseJSDoc(comment)
        }
        return undefined
    }

    private static getTag(element: AstNode, tagName: string): JSDocTag | undefined {
        const tag = XsmpUtils.getJSDoc(element)?.getTag(tagName)
        return tag?.inline ? undefined : tag
    }

    private static getTags(element: AstNode, tagName: string): JSDocTag[] | undefined {
        return XsmpUtils.getJSDoc(element)?.getTags(tagName).filter(t => !t.inline)
    }

    public static getUsages(element: ast.AttributeType): JSDocTag[] | undefined {
        return XsmpUtils.getTags(element, 'usage')
    }


    public static getId(element: ast.NamedElement | ast.ReturnParameter): string | undefined {
        return XsmpUtils.getTag(element, 'id')?.content.toString()
    }
    public static getNativeType(element: ast.NativeType): string | undefined {
        return XsmpUtils.getTag(element, 'type')?.content.toString()
    }
    public static getNativeNamespace(element: ast.NativeType): string | undefined {
        return XsmpUtils.getTag(element, 'namespace')?.content.toString()
    }
    public static getNativeLocation(element: ast.NativeType): string | undefined {
        return XsmpUtils.getTag(element, 'location')?.content.toString()
    }
    public static isMulticast(element: ast.EventSource): boolean {
        return XsmpUtils.getTag(element, 'singlecast') === undefined
    }


    public static getPropertyCategory(element: ast.Property): string | undefined {
        return XsmpUtils.getTag(element, 'category')?.content.toString()
    }
    public static getUnit(element: ast.Integer | ast.Float): string | undefined {
        return XsmpUtils.getTag(element, 'unit')?.content.toString()
    }

    public static getTitle(element: ast.Document): string | undefined {
        return XsmpUtils.getTag(element, 'title')?.content.toString()
    }
    public static getDate(element: ast.Document): JSDocTag | undefined {
        return XsmpUtils.getTag(element, 'date')
    }

    public static getCreator(element: ast.Document): string | undefined {
        return XsmpUtils.getTags(element, 'creator')?.map(e => e.content.toString()).join(', ')
    }
    public static getVersion(element: ast.Document): string | undefined {
        return XsmpUtils.getTag(element, 'version')?.content.toString()
    }

    public static getUuid(type: ast.Type): JSDocTag | undefined {
        return XsmpUtils.getTag(type, 'uuid')
    }

    public static getDeprecated(element: ast.NamedElement): JSDocTag | undefined {
        return XsmpUtils.getTag(element, 'deprecated')
    }

    public static IsDeprecated(element: ast.NamedElement): boolean {
        return XsmpUtils.getDeprecated(element) !== undefined
    }

    public static attribute(element: ast.NamedElement | ast.ReturnParameter, id: Attributes): ast.Attribute | undefined {
        return element.attributes.find(a => a.type.ref && XsmpUtils.getQualifiedName(a.type.ref) === id)
    }
    public static isAttributeTrue(attribute: ast.Attribute | undefined): boolean | undefined {
        if (!attribute) return undefined
        if (attribute.value)
            return Solver.getValue(attribute.value)?.boolValue()?.getValue()
        if (ast.isAttributeType(attribute.type.ref))
            return Solver.getValue(attribute.type.ref.default)?.boolValue()?.getValue()
        return undefined
    }

    protected static attributeBoolValue(element: ast.NamedElement | ast.ReturnParameter, id: Attributes): boolean | undefined {
        return XsmpUtils.isAttributeTrue(XsmpUtils.attribute(element, id))
    }

    public static getDescription(element: ast.NamedElement): string | undefined {
        const jsDoc = XsmpUtils.getJSDoc(element);
        if (!jsDoc)
            return undefined

        const result: string[] = []
        for (const e of jsDoc.elements) {
            const text = e.toString()
            if (text.startsWith('@'))
                break
            result.push(text)
        }
        return result.length > 0 ? result.join('\n').trim() : undefined
    }
    public static getParameterDescription(element: ast.Parameter): string | undefined {
        const regex = new RegExp(`^${element.name}\\s`);
        return XsmpUtils.getJSDoc(element.$container)?.getTags('param').find(t => regex.test(t.content.toString()))?.content.toString().slice(element.name.length).trim()
    }
    public static getReturnParameterDescription(element: ast.ReturnParameter): string | undefined {
        return XsmpUtils.getJSDoc(element.$container)?.getTag('return')?.content.toString().trim()
    }


    public static isStatic(element: ast.NamedElement | ast.ReturnParameter): boolean {
        return XsmpUtils.attributeBoolValue(element, 'Attributes.Static') ?? false
    }
    public static isAbstract(element: ast.Operation | ast.Property): boolean {
        return XsmpUtils.attributeBoolValue(element, 'Attributes.Abstract') ?? false
    }

    public static isConst(element: ast.Parameter | ast.ReturnParameter | ast.Association | ast.Operation | ast.Property): boolean {
        return XsmpUtils.attributeBoolValue(element, 'Attributes.Const') ?? false
    }
    public static isByPointer(element: ast.Parameter | ast.ReturnParameter | ast.Association | ast.Property): boolean {
        return XsmpUtils.attributeBoolValue(element, 'Attributes.ByPointer') ?? false
    }
    public static isByReference(element: ast.Parameter | ast.ReturnParameter | ast.Property): boolean {
        return XsmpUtils.attributeBoolValue(element, 'Attributes.ByReference') ?? false
    }

    public static isSimpleArray(element: ast.ArrayType): boolean {
        return XsmpUtils.attributeBoolValue(element, 'Attributes.SimpleArray') ?? false
    }

    public static allowMultiple(element: ast.AttributeType): boolean {
        return XsmpUtils.getTag(element, 'allowMultiple') !== undefined
    }

    public static isAncestor(ancestor: AstNode | undefined, element: AstNode | undefined): boolean {
        return AstUtils.hasContainerOfType(element, c => c === ancestor)
    }


    public static getLower(element: ast.NamedElementWithMultiplicity): bigint | undefined {
        if (element.optional)
            return BigInt(0);

        if (element.multiplicity === undefined)
            return BigInt(1);

        if (element.multiplicity.lower === undefined && element.multiplicity.upper === undefined)
            return BigInt(element.multiplicity.aux ? 1 : 0);

        return Solver.getValue(element.multiplicity.lower)?.integralValue('Int64')?.getValue();
    }

    public static getUpper(element: ast.NamedElementWithMultiplicity): bigint | undefined {

        if (element.optional || element.multiplicity === undefined)
            return BigInt(1);

        if (element.multiplicity.lower === undefined && element.multiplicity.upper === undefined)
            return BigInt(-1);

        if (element.multiplicity.upper === undefined)
            return element.multiplicity.aux ? BigInt(-1) : Solver.getValue(element.multiplicity.lower)?.integralValue('Int64')?.getValue() ?? BigInt(0);

        return Solver.getValue(element.multiplicity.upper)?.integralValue('Int64')?.getValue();
    }


    public static getAllFields(element: ast.Structure): Stream<ast.Field> {
        // return non static and public fields from element's base if any and current element
        const result = stream(element.elements).filter(ast.isField).filter(f => !XsmpUtils.isStatic(f) && XsmpUtils.getRealVisibility(f) === 'public')
        if (ast.isClass(element) && ast.isStructure(element.base))
            return XsmpUtils.getAllFields(element.base).concat(result)
        return result
    }

    public static isCyclicInterfaceBase(parent: ast.Interface, base: Reference<ast.Type>): boolean {
        return base.ref === parent || ast.isInterface(base.ref) && base.ref.base.some(b => XsmpUtils.isCyclicInterfaceBase(parent, b))
    }

    public static isCyclicComponentBase(parent: ast.Component, base: Reference<ast.Type>): boolean {
        return base.ref === parent || ast.isComponent(base.ref) && base.ref.base !== undefined && XsmpUtils.isCyclicComponentBase(parent, base.ref.base)
    }


    public static isCyclicClassBase(parent: ast.Class, base: Reference<ast.Type>): boolean {
        return base.ref === parent || ast.isClass(base.ref) && base.ref.base !== undefined && XsmpUtils.isCyclicClassBase(parent, base.ref.base)
    }

    public static isRecursiveType(parent: ast.Type, other: ast.Type | undefined): boolean {
        if (parent === other) return true
        if (ast.isArrayType(other))
            return XsmpUtils.isRecursiveType(parent, other.itemType.ref)
        if (ast.isStructure(other))
            return other.elements.filter(ast.isField).some(f => XsmpUtils.isRecursiveType(parent, f.type.ref))
        return false
    }


    /**
     * Compute the signature of an element
     *
     * @param op
     *          the input Operation
     * @return the signature
     */
    public static getSignature(element: ast.NamedElement): string {
        if (ast.isOperation(element))
            return element.name + '(' + element.parameter.map(XsmpUtils.getParameterSignature).join(',') + ')';
        return element.name
    }

    /**
     * Get the signature of a parameter
     *
     * @param p
     *          the input Parameter
     * @return the signature of the parameter
     */
    private static getParameterSignature(p: ast.Parameter) {
        let signature = ''

        if (XsmpUtils.isConst(p))
            signature += 'const '

        signature += p.type.ref ? XsmpUtils.getQualifiedName(p.type.ref) : p.type.$refText

        if (XsmpUtils.isByPointer(p))
            signature += '*'

        if (XsmpUtils.isByReference(p))
            signature += '&'

        return signature
    }


}