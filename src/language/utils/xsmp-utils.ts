import { AstNode, CstNode, CstUtils, isAstNodeWithComment, isJSDoc, JSDocComment, JSDocTag, parseJSDoc, stream, Stream } from "langium";
import * as ast from "../generated/ast.js";

import { LangiumServices } from "langium/lsp";
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


    constructor(services: LangiumServices) {

    }

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
        return input.replace("\t", "\\t").replace("\b", "\\b").replace("\n", "\\n").replace("\r", "\\r")
            .replace("\f", "\\f").replace("\'", "\\'").replace("\"", "\\\"");
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
        const visibility = this.getVisibility(node)
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

    public static isAbstract(node: ast.VisibilityElement): boolean {
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
                return this.getPrimitiveTypeKind(type.primitiveType.ref)
            return 'Float64'
        }
        else if (ast.isInteger(type)) {
            if (type.primitiveType?.ref)
                return this.getPrimitiveTypeKind(type.primitiveType.ref)
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
        const comment = this.getCommentNode(element)
        if (comment && isJSDoc(comment)) {
            return parseJSDoc(comment)
        }
        return undefined
    }

    public static getTag(element: AstNode, tagName: string): JSDocTag | undefined {
        const tag = this.getJSDoc(element)?.getTag(tagName)
        return tag?.inline ? undefined : tag
    }

    public static getTags(element: AstNode, tagName: string): JSDocTag[] {
        return this.getJSDoc(element)?.getTags(tagName).filter(t => !t.inline) ?? []
    }

    public static getUuid(type: ast.Type): JSDocTag | undefined {
        return this.getTag(type, 'uuid')
    }

    public static IsDeprecated(element: ast.NamedElement): boolean {
        return this.getTag(element, 'deprecated') !== undefined
    }

    protected static attribute(element: ast.NamedElement, id: Attributes): ast.Attribute | undefined {
        return element.attributes.find(a => a.type.ref && XsmpUtils.getQualifiedName(a.type.ref) == id)
    }

    protected static attributeBoolValue(element: ast.NamedElement, id: Attributes): boolean | undefined {
        return true
    }

    public static getDescription(element: ast.NamedElement): string | undefined {
        const jsDoc = this.getJSDoc(element);
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
        return this.getJSDoc(element.$container)?.getTags('param').find(t => regex.test(t.content.toString()))?.content.toString().slice(element.name.length).trim()
    }
    public static getReturnParameterDescription(element: ast.ReturnParameter): string | undefined {
        return this.getJSDoc(element.$container)?.getTag('return')?.content.toString().trim()
    }


    public static isStatic(element: ast.NamedElement): boolean {

        return false
    }
    public static allowMultiple(element: ast.AttributeType): boolean {
        return XsmpUtils.getTag(element, 'allowMultiple') !== undefined
    }
    public static usage(element: ast.AttributeType): string[] {
        return XsmpUtils.getTags(element, 'usage').map(t => t.content.toString())
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
            return element.multiplicity.aux ? BigInt(-1) : Solver.getValue(element.multiplicity.lower)?.integralValue('Int64')?.getValue() ?? BigInt(0);;

        return Solver.getValue(element.multiplicity.upper)?.integralValue('Int64')?.getValue();
    }


    public static getAllFields(element: ast.Structure): Stream<ast.Field> {
        // return non static and public fields from element's base if any and current element
        const result = stream(element.elements).filter(ast.isField).filter(f => !XsmpUtils.isStatic(f) && this.getRealVisibility(f) === 'public')
        if (ast.isClass(element) && ast.isStructure(element.base))
            return this.getAllFields(element.base).concat(result)
        return result
    }
}