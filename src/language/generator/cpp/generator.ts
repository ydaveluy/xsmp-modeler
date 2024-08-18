import * as ast from '../../generated/ast.js';
import { type AstNode, AstUtils, type JSDocElement, type JSDocTag, type URI } from 'langium';
import * as fs from 'fs';
import type { TaskAcceptor, XsmpGenerator } from '../generator.js';
import { escape, fqn, getDescription, getJSDoc, getPrimitiveTypeKind, getUuid, getViewKind } from '../../utils/xsmp-utils.js';
import * as CopyrightNoticeProvider from '../copyright-notice-provider.js';
import { expandToString as s } from 'langium/generate';
import * as Path from 'path';
import { format as ClangFormat } from './clang-format.js';
import type { XsmpSharedServices } from '../../xsmp-module.js';
import type { XsmpTypeProvider } from '../../references/type-provider.js';
import * as Solver from '../../utils/solver.js';
import { PTK, PTKToString } from '../../utils/primitive-type-kind.js';

export enum CxxStandard { CXX_STD_11 = 0, CXX_STD_14 = 1, CXX_STD_17 = 2 }

export class CppGenerator implements XsmpGenerator {
    protected static readonly defaultIncludeFolder = 'src';
    protected static readonly defaultSourceFolder = 'src';
    protected readonly includeFolder = CppGenerator.defaultIncludeFolder;
    protected readonly sourceFolder = CppGenerator.defaultSourceFolder;

    protected readonly cxxStandard: CxxStandard;
    protected readonly typeProvider: XsmpTypeProvider;

    constructor(services: XsmpSharedServices, cxxStandard: CxxStandard) {
        this.cxxStandard = cxxStandard;
        this.typeProvider = services.TypeProvider;
    }

    clean(projectUri: URI) {
        // ignore
    }

    generate(node: AstNode, projectUri: URI, acceptTask: TaskAcceptor) {
        if (ast.isCatalogue(node)) {
            const notice = CopyrightNoticeProvider.getCopyrightNotice(node.$document, '// ');
            node.elements.forEach(n => this.generateNamespace(n, projectUri, notice, acceptTask));
            this.generatePackage(node, projectUri, notice, acceptTask);
        }
    }

    public generatePackage(catalogue: ast.Catalogue, projectUri: URI, notice: string | undefined, acceptTask: TaskAcceptor) {
        //TODO
    }

    private generateNamespace(namespace: ast.Namespace, projectUri: URI, notice: string | undefined, acceptTask: TaskAcceptor) {
        for (const element of namespace.elements) {
            if (ast.isNamespace(element))
                this.generateNamespace(element, projectUri, notice, acceptTask);
            else
                this.generateType(element, projectUri, notice, acceptTask);
        }
    }

    protected generateType(type: ast.Type, projectUri: URI, notice: string | undefined, acceptTask: TaskAcceptor) {
        //TODO
    }
    protected async format(path: string, content: string): Promise<string> {
        return await ClangFormat(path, content);
    }

    protected async generateFile(path: string, content: string) {
        try {
            await fs.promises.mkdir(Path.dirname(path), { recursive: true });

            const formatted = await ClangFormat(path, content);;

            await fs.promises.writeFile(path, formatted);
        } catch (error) {
            console.error(`Error generating file ${path}:`, error);
        }
    }
    protected comment(element: ast.NamedElement): string | undefined {
        const comment = getJSDoc(element);
        if (!comment)
            return undefined;
        const newLine = '\n/// ';
        const mapElement = (e: JSDocElement) => {
            if (typeof (e as JSDocTag).name === 'string') {
                const tag = e as JSDocTag;
                if (tag.name === 'uuid' || tag.name === 'id')
                    return undefined;
            }
            return e.toString().trimEnd().replaceAll('\n', newLine);
        };
        const result = comment.elements.map(mapElement).filter(e => e !== undefined).join(newLine);
        if (result.length === 0) {
            return undefined;
        }
        return '/// ' + result;
    }

    protected fqn(reference: ast.NamedElement | undefined, defaultFqn?: string): string {
        if (!reference) {
            return defaultFqn ?? '';
        }
        return `::${fqn(reference, '::')}`;
    }

    // list of types with uuids defined in namespace ::Smp::Uuids
    protected static smpUuids = new Set<string>(['Smp.Uuid', 'Smp.Char8', 'Smp.Bool', 'Smp.Int8', 'Smp.UInt8', 'Smp.Int16', 'Smp.UInt16', 'Smp.Int32',
        'Smp.UInt32', 'Smp.Int64', 'Smp.UInt64', 'Smp.Float32', 'Smp.Float64', 'Smp.Duration', 'Smp.DateTime', 'Smp.String8', 'Smp.PrimitiveTypeKind',
        'Smp.EventId', 'Smp.LogMessageKind', 'Smp.TimeKind', 'Smp.ViewKind', 'Smp.ParameterDirectionKind', 'Smp.ComponentStateKind', 'Smp.AccessKind',
        'Smp.SimulatorStateKind'
    ]);
    protected uuid(type: ast.Type | undefined): string {
        if (!type) {
            return '::Smp::Uuids::Uuid_Void';
        }
        if (CppGenerator.smpUuids.has(fqn(type))) {
            return `::Smp::Uuids::Uuid_${type.name}`;
        }
        return `${this.fqn(type.$container as ast.NamedElement)}::Uuid_${type.name}`;
    }

    protected description(element: ast.NamedElement): string {
        return `"${escape(getDescription(element))}"`;
    }

    protected viewKind(element: ast.Property | ast.Field | ast.Operation | ast.EntryPoint): string {
        const vk = getViewKind(element);
        if (vk) {
            return this.expression(vk);
        }
        return '::Smp::ViewKind::VK_All';
    }

    protected expression(expr: ast.Expression | undefined): string {
        if (!expr) {
            return '';
        }
        switch (expr.$type) {
            case ast.CollectionLiteral: return `{ ${(expr as ast.CollectionLiteral).elements.map(e => this.expression(e), this).join(', ')}}`;
            case ast.DesignatedInitializer: return `/* .${(expr as ast.DesignatedInitializer).field.ref?.name} = */${this.expression((expr as ast.DesignatedInitializer).expr)}`;
            case ast.UnaryOperation: return `${(expr as ast.UnaryOperation).feature}${this.expression((expr as ast.UnaryOperation).operand)}`;
            case ast.BinaryOperation: return `${this.expression((expr as ast.BinaryOperation).leftOperand)} ${(expr as ast.BinaryOperation).feature} ${this.expression((expr as ast.BinaryOperation).rightOperand)}`;
            case ast.ParenthesizedExpression: return `(${this.expression((expr as ast.ParenthesizedExpression).expr)})`;
            case ast.BooleanLiteral: return (expr as ast.BooleanLiteral).isTrue ? 'true' : 'false';
            case ast.BuiltInConstant: return `M_${(expr as ast.BuiltInConstant).name}`;
            case ast.BuiltInFunction: return `${(expr as ast.BuiltInFunction).name}(${this.expression((expr as ast.BuiltInFunction).argument)})`;
            case ast.IntegerLiteral: {
                const type = this.typeProvider.getType(expr);
                if (ast.isEnumeration(type)) {
                    const value = Solver.getValueAs(expr, type)?.enumerationLiteral()?.getValue();
                    if (value) {
                        return this.fqn(value);
                    }
                }
                return (expr as ast.IntegerLiteral).text.replaceAll("'", '');
            }
            case ast.FloatingLiteral: return (expr as ast.FloatingLiteral).text.replaceAll("'", '');
            case ast.StringLiteral: {
                const kind = getPrimitiveTypeKind(this.typeProvider.getType(expr));
                switch (kind) {
                    case PTK.Duration:
                    case PTK.DateTime: {
                        const value = Solver.getValue(expr)?.integralValue(kind)?.getValue();
                        if (value) { return `${value}L`; }
                        break;
                    }
                }
                return (expr as ast.StringLiteral).$cstNode?.text as string;
            }
            case ast.CharacterLiteral: return (expr as ast.CharacterLiteral).$cstNode?.text as string;
            case ast.KeywordExpression: return (expr as ast.KeywordExpression).name;
            case ast.NamedElementReference: {
                const value = (expr as ast.NamedElementReference).value;
                return value.ref?.$container === AstUtils.getContainerOfType(expr, ast.isType) ? value.ref?.name ?? '' : this.fqn(value.ref);
            }
        }
        return `${expr.$cstNode?.text}`;
    }
    protected stringTypeIsConstexpr(): boolean { return true; }

    protected directListInitializer(expr: ast.Expression): string {
        return `{${this.expression(expr)}}`;
    }

    protected namespace(object: AstNode, body: string): string {
        const namespace = AstUtils.getContainerOfType(object, ast.isNamespace);
        if (namespace !== undefined)
            if (this.cxxStandard >= CxxStandard.CXX_STD_17) {
                const name = fqn(namespace, '::');
                return s`
                    ${this.comment(namespace)}
                    namespace ${name}
                    {
                        ${body}
                    } // namespace ${name}
                `;
            }
            else
                return this.namespace(namespace.$container,
                    s`
                    ${this.comment(namespace)}
                    namespace ${namespace.name}
                    {
                        ${body}
                    } // namespace ${namespace.name}
                `);
        else
            return body;
    }
    protected uuidDeclaration(type: ast.Type): string | undefined {
        return `
        /// Universally unique identifier of type ${type.name}.
        ${this.cxxStandard >= CxxStandard.CXX_STD_17 ? 'inline ' : ''}constexpr ::Smp::Uuid Uuid_${type.name} { ${getUuid(type)?.toString().trim().split('-').map(u => `0x${u}U`).join(', ')} };
    `;
    }
    protected uuidDefinition(type: ast.Type): string | undefined {
        return undefined;
    }
    protected primitiveTypeKind(type: ast.Type): string {
        const kind = getPrimitiveTypeKind(type);
        return kind === PTK.Enum ? '::Smp::PrimitiveTypeKind::PTK_Int32' : `::Smp::PrimitiveTypeKind::PTK_${PTKToString(kind)}`;
    }

    protected lower(element: ast.NamedElementWithMultiplicity): string {
        if (element.optional) {
            return '0';
        }
        if (element.multiplicity === undefined) {
            return '1';
        }
        if (element.multiplicity.lower === undefined && element.multiplicity.upper === undefined) {
            return element.multiplicity.aux ? '1' : '0';
        }
        return this.expression(element.multiplicity.lower);
    }

    protected upper(element: ast.NamedElementWithMultiplicity): string {
        if (element.optional || element.multiplicity === undefined) {
            return '1';
        }
        if (element.multiplicity.lower === undefined && element.multiplicity.upper === undefined) {
            return '-1';
        }
        if (element.multiplicity.upper === undefined) {
            return element.multiplicity.aux ? '-1' : this.expression(element.multiplicity.lower);
        }
        return this.expression(element.multiplicity.upper);
    }

    protected eventType(element: ast.EventSink | ast.EventSource): ast.Type | undefined {
        return ast.isEventType(element.type.ref) ? element.type.ref.eventArgs?.ref : undefined;
    }

    protected declare(element: ast.NamedElement): string | undefined {
        switch (element.$type) {
            case ast.Association: return this.declareAssociation(element as ast.Association);
            case ast.Constant: return this.declareConstant(element as ast.Constant);
            case ast.Container: return this.declareContainer(element as ast.Container);
            case ast.EntryPoint: return this.declareEntryPoint(element as ast.EntryPoint);
            case ast.EventSink: return this.declareEventSink(element as ast.EventSink);
            case ast.EventSource: return this.declareEventSource(element as ast.EventSource);
            case ast.Field: return this.declareField(element as ast.Field);
            case ast.Operation: return this.declareOperation(element as ast.Operation);
            case ast.Property: return this.declareProperty(element as ast.Property);
            case ast.Reference_: return this.declareReference(element as ast.Reference_);
            default: return undefined;
        }
    }
    protected define(element: ast.NamedElement): string | undefined {
        switch (element.$type) {
            case ast.Association: return this.defineAssociation(element as ast.Association);
            case ast.Constant: return this.defineConstant(element as ast.Constant);
            case ast.Container: return this.defineContainer(element as ast.Container);
            case ast.EntryPoint: return this.defineEntryPoint(element as ast.EntryPoint);
            case ast.EventSink: return this.defineEventSink(element as ast.EventSink);
            case ast.EventSource: return this.defineEventSource(element as ast.EventSource);
            case ast.Field: return this.defineField(element as ast.Field);
            case ast.Operation: return this.defineOperation(element as ast.Operation);
            case ast.Property: return this.defineProperty(element as ast.Property);
            case ast.Reference_: return this.defineReference(element as ast.Reference_);
            default: return undefined;
        }
    }
    protected initialize(element: ast.NamedElement): string | undefined {
        switch (element.$type) {
            case ast.Association: return this.initializeAssociation(element as ast.Association);
            case ast.Constant: return this.initializeConstant(element as ast.Constant);
            case ast.Container: return this.initializeContainer(element as ast.Container);
            case ast.EntryPoint: return this.initializeEntryPoint(element as ast.EntryPoint);
            case ast.EventSink: return this.initializeEventSink(element as ast.EventSink);
            case ast.EventSource: return this.initializeEventSource(element as ast.EventSource);
            case ast.Field: return this.initializeField(element as ast.Field);
            case ast.Operation: return this.initializeOperation(element as ast.Operation);
            case ast.Property: return this.initializeProperty(element as ast.Property);
            case ast.Reference_: return this.initializeReference(element as ast.Reference_);
            default: return undefined;
        }
    }
    protected finalize(element: ast.NamedElement): string | undefined {
        switch (element.$type) {
            case ast.Association: return this.finalizeAssociation(element as ast.Association);
            case ast.Constant: return this.finalizeConstant(element as ast.Constant);
            case ast.Container: return this.finalizeContainer(element as ast.Container);
            case ast.EntryPoint: return this.finalizeEntryPoint(element as ast.EntryPoint);
            case ast.EventSink: return this.finalizeEventSink(element as ast.EventSink);
            case ast.EventSource: return this.finalizeEventSource(element as ast.EventSource);
            case ast.Field: return this.finalizeField(element as ast.Field);
            case ast.Operation: return this.finalizeOperation(element as ast.Operation);
            case ast.Property: return this.finalizeProperty(element as ast.Property);
            case ast.Reference_: return this.finalizeReference(element as ast.Reference_);
            default: return undefined;
        }
    }
    protected declareAssociation(element: ast.Association): string | undefined {
        return undefined;
    }
    protected defineAssociation(element: ast.Association): string | undefined {
        return undefined;
    }
    protected initializeAssociation(element: ast.Association): string | undefined {
        return undefined;
    }
    protected finalizeAssociation(element: ast.Association): string | undefined {
        return undefined;
    }

    protected declareConstant(element: ast.Constant): string | undefined {
        return undefined;
    }
    protected defineConstant(element: ast.Constant): string | undefined {
        return undefined;
    }
    protected initializeConstant(element: ast.Constant): string | undefined {
        return undefined;
    }
    protected finalizeConstant(element: ast.Constant): string | undefined {
        return undefined;
    }

    protected declareContainer(element: ast.Container): string | undefined {
        return undefined;
    }
    protected defineContainer(element: ast.Container): string | undefined {
        return undefined;
    }
    protected initializeContainer(element: ast.Container): string | undefined {
        return undefined;
    }
    protected finalizeContainer(element: ast.Container): string | undefined {
        return undefined;
    }

    protected declareEntryPoint(element: ast.EntryPoint): string | undefined {
        return undefined;
    }
    protected defineEntryPoint(element: ast.EntryPoint): string | undefined {
        return undefined;
    }
    protected initializeEntryPoint(element: ast.EntryPoint): string | undefined {
        return undefined;
    }
    protected finalizeEntryPoint(element: ast.EntryPoint): string | undefined {
        return undefined;
    }

    protected declareEventSink(element: ast.EventSink): string | undefined {
        return undefined;
    }
    protected defineEventSink(element: ast.EventSink): string | undefined {
        return undefined;
    }
    protected initializeEventSink(element: ast.EventSink): string | undefined {
        return undefined;
    }
    protected finalizeEventSink(element: ast.EventSink): string | undefined {
        return undefined;
    }

    protected declareEventSource(element: ast.EventSource): string | undefined {
        return undefined;
    }
    protected defineEventSource(element: ast.EventSource): string | undefined {
        return undefined;
    }
    protected initializeEventSource(element: ast.EventSource): string | undefined {
        return undefined;
    }
    protected finalizeEventSource(element: ast.EventSource): string | undefined {
        return undefined;
    }

    protected declareField(element: ast.Field): string | undefined {
        return undefined;
    }
    protected defineField(element: ast.Field): string | undefined {
        return undefined;
    }
    protected initializeField(element: ast.Field): string | undefined {
        return undefined;
    }
    protected finalizeField(element: ast.Field): string | undefined {
        return undefined;
    }

    protected declareOperation(element: ast.Operation): string | undefined {
        return undefined;
    }
    protected defineOperation(element: ast.Operation): string | undefined {
        return undefined;
    }
    protected initializeOperation(element: ast.Operation): string | undefined {
        return undefined;
    }
    protected finalizeOperation(element: ast.Operation): string | undefined {
        return undefined;
    }

    protected declareProperty(element: ast.Property): string | undefined {
        return undefined;
    }
    protected defineProperty(element: ast.Property): string | undefined {
        return undefined;
    }
    protected initializeProperty(element: ast.Property): string | undefined {
        return undefined;
    }
    protected finalizeProperty(element: ast.Property): string | undefined {
        return undefined;
    }

    protected declareReference(element: ast.Reference_): string | undefined {
        return undefined;
    }
    protected defineReference(element: ast.Reference_): string | undefined {
        return undefined;
    }
    protected initializeReference(element: ast.Reference_): string | undefined {
        return undefined;
    }
    protected finalizeReference(element: ast.Reference_): string | undefined {
        return undefined;
    }
}

