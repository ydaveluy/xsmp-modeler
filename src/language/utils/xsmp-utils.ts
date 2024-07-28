import { AstNode, CstNode, CstUtils, GrammarConfig, isAstNodeWithComment, isJSDoc, JSDocComment, JSDocTag, parseJSDoc } from "langium";
import { Attribute, isEnumeration, isFloat, isInteger, isNamespace, isPrimitiveType, isStringType, isType, NamedElement, Type } from "../generated/ast.js";

import { LangiumServices } from "langium/lsp";




export type IntegralPrimitiveTypeKind = 'Int8' | 'Int16' | 'UInt8' | 'UInt16' | 'Int32' | 'Int64' | 'UInt32' | 'UInt64';

const integralTypes: Set<PrimitiveTypeKind> = new Set([
    'Int8', 'Int16', 'UInt8', 'UInt16', 'Int32', 'Int64', 'UInt32', 'UInt64'
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
export type PrimitiveTypeKind = 'Bool' | 'Char8' | 'DateTime' | 'Duration' | FloatingPrimitiveTypeKind | IntegralPrimitiveTypeKind | 'String8' | 'None' | 'Enum';



export type Attributes = 'Attributes.Static'
    | 'Attributes.Const' | 'Attributes.Mutable'
    | 'Attributes.ByPointer' | 'Attributes.ByReference'
    | 'Attributes.Abstract' | 'Attributes.Virtual'
    | 'Attributes.Constructor' | 'Attributes.Forcible'
    | 'Attributes.Failure' | 'Attributes.ConstGetter'
    | 'Attributes.NoConstructor' | 'Attributes.NoDestructor'
    | 'Attributes.SimpleArray' | 'Attributes.OperatorKind';

export class XsmpUtils {
    protected readonly grammarConfig: () => GrammarConfig;


    constructor(services: LangiumServices) {
        this.grammarConfig = () => services.parser.GrammarConfig;
    }

    /**
      * @param element the element
      * @returns qualified name separated by `.`
      */
    public static getQualifiedName(node: NamedElement): string {
        let name = node.name as string;
        let parent = node.$container;

        while (/*parent && */(isNamespace(parent) || isType(parent))) {
            name = `${parent.name}.${name}`;
            parent = parent.$container;
        }
        return name;
    }

    public static getPrimitiveTypeKind(type: Type): PrimitiveTypeKind {
        if (isPrimitiveType(type)) {
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
        else if (isFloat(type)) {
            if (type.primitiveType?.ref)
                return this.getPrimitiveTypeKind(type.primitiveType.ref)
            return 'Float64'
        }
        else if (isInteger(type)) {
            if (type.primitiveType?.ref)
                return this.getPrimitiveTypeKind(type.primitiveType.ref)
            return 'Int32'
        }
        else if (isStringType(type)) {
            return 'String8'
        }
        else if (isEnumeration(type)) {
            return 'Enum'
        }
        return 'None'
    }

    protected getCommentNode(node: AstNode): CstNode | undefined {
        if (isAstNodeWithComment(node)) {
            return node.$cstNode;
        }
        return CstUtils.findCommentNode(node.$cstNode, this.grammarConfig().multilineCommentRules);
    }

    public getJSDoc(element: NamedElement): JSDocComment | undefined {
        const comment = this.getCommentNode(element)
        if (comment && isJSDoc(comment)) {
            return parseJSDoc(comment)
        }
        return undefined
    }



    public getTag(element: NamedElement, tagName: string): JSDocTag | undefined {
        const tag = this.getJSDoc(element)?.getTag(tagName)
        return tag?.inline ? undefined : tag
    }

    public getTags(element: NamedElement, tagName: string): JSDocTag[]  {
        return this.getJSDoc(element)?.getTags(tagName).filter(t => !t.inline)??[]
    }

    public getUuid(type: Type): JSDocTag | undefined {
        return this.getTag(type, 'uuid')
    }

    public IsDeprecated(element: NamedElement): boolean {
        return this.getTag(element, 'deprecated') != undefined
    }

    protected static attribute(element: NamedElement, id: Attributes): Attribute | undefined {
        return element.attributes.find(a => a.type.ref && XsmpUtils.getQualifiedName(a.type.ref) == id)
    }

    protected static attributeBoolValue(element: NamedElement, id: Attributes): boolean | undefined {
        return true
    }


    public isStatic(element: NamedElement): boolean {

        return false
    }
}