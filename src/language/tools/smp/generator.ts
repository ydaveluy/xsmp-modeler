import * as ast from '../../generated/ast.js';
import type * as Catalogue from './model/catalogue.js';
import type * as Elements from './model/elements.js';
import type * as Types from './model/types.js';
import type * as Package from './model/package.js';
import type * as xlink from './model/xlink.js';
import * as XsmpUtils from '../../utils/xsmp-utils.js';
import type { AstNode, JSDocParagraph, Reference, URI } from 'langium';
import { AstUtils, UriUtils } from 'langium';
import * as fs from 'fs';
import * as Solver from '../../utils/solver.js';
import { Duration, Instant } from '@js-joda/core';
import type { TaskAcceptor, XsmpGenerator } from '../../generator/generator.js';
import { create } from 'xmlbuilder2';

export class SmpGenerator implements XsmpGenerator {

    protected getId(element: ast.NamedElement | ast.ReturnParameter): string {
        return XsmpUtils.getId(element) ?? XsmpUtils.fqn(element);
    }

    protected convertNamedElement(element: ast.NamedElement): Elements.NamedElement {
        return {
            '@Id': this.getId(element),
            '@Name': element.name,
            Description: XsmpUtils.getDescription(element),
            Metadata: element.attributes.map(this.convertAttribute, this),
        };
    }
    protected convertAttribute(element: ast.Attribute): Types.Attribute {
        return {
            '@xsi:type': 'Types:Attribute',
            '@Id': `${this.getId(element.$container)}.${element.type.ref?.name}.${element.$containerIndex}`,
            '@Name': element.type.ref?.name ?? '',
            Type: this.convertXlink(element.type, element),
            Value: element.value ? this.convertValue((element.type.ref as ast.AttributeType).type.ref, element.value) :
                this.convertValue((element.type.ref as ast.AttributeType).type.ref, (element.type.ref as ast.AttributeType).default!),
        };
    }
    protected convertVisibilityElement(element: ast.VisibilityElement): Types.VisibilityElement {
        return {
            ...this.convertNamedElement(element),
            '@Visibility': XsmpUtils.getVisibility(element),
        };
    }

    protected convertNamespace(namespace: ast.Namespace): Catalogue.Namespace {
        return {
            ...this.convertNamedElement(namespace),
            Namespace: namespace.elements.filter(ast.isNamespace).map(this.convertNamespace, this),
            Type: namespace.elements.filter(ast.isType).map(this.convertTypeDispatch, this),
        };
    }

    protected convertTypeDispatch(type: ast.Type): Types.Type {

        switch (type.$type) {
            case ast.Structure:
                return this.convertStructure(type as ast.Structure);
            case ast.Class:
                return this.convertClass(type as ast.Class);
            case ast.Exception:
                return this.convertException(type as ast.Exception);
            case ast.PrimitiveType:
                return this.convertType(type, 'Types:PrimitiveType');
            case ast.ArrayType:
                return this.convertArrayType(type as ast.ArrayType);
            case ast.AttributeType:
                return this.convertAttributeType(type as ast.AttributeType);
            case ast.Enumeration:
                return this.convertEnumeration(type as ast.Enumeration);
            case ast.EventType:
                return this.convertEventType(type as ast.EventType);
            case ast.Float:
                return this.convertFloat(type as ast.Float);
            case ast.Integer:
                return this.convertInteger(type as ast.Integer);
            case ast.Service:
            case ast.Model:
                return this.convertComponent(type as ast.Component);
            case ast.Interface:
                return this.convertInterface(type as ast.Interface);
            case ast.NativeType:
                return this.convertNativeType(type as ast.NativeType);
            case ast.StringType:
                return this.convertStringType(type as ast.StringType);
            case ast.ValueReference:
                return this.convertValueReference(type as ast.ValueReference);
        }
        throw Error(`Unsupported type ${type.$type}`);
    }

    protected convertType(type: ast.Type, id: string): Types.Type {

        return {
            '@xsi:type': id,
            ...this.convertVisibilityElement(type),
            '@Uuid': XsmpUtils.getUuid(type)?.toString() ?? '',
        };
    }
    protected convertValueReference(valueReference: ast.ValueReference): Types.ValueReference {

        return {
            ...this.convertType(valueReference, 'Types:ValueReference'),
            Type: this.convertXlink(valueReference.type, valueReference),
        };
    }
    protected convertStringType(string: ast.StringType): Types.String {

        return {
            ...this.convertType(string, 'Types:String'),
            '@Length': Solver.getValue(string.length)?.integralValue('Int64')?.getValue() ?? BigInt(0),
        };
    }

    protected convertNativeType(nativeType: ast.NativeType): Types.NativeType {

        return {
            ...this.convertType(nativeType, 'Types:NativeType'),
            Platform: [{
                '@Name': 'cpp',
                '@Type': XsmpUtils.getNativeType(nativeType) ?? '',
                '@Namespace': XsmpUtils.getNativeNamespace(nativeType),
                '@Location': XsmpUtils.getNativeLocation(nativeType),
            }],
        };
    }
    protected convertReferenceType(inter: ast.ReferenceType, id: string): Catalogue.ReferenceType {

        return {
            ...this.convertType(inter, id),
            Constant: inter.elements.filter(ast.isConstant).map(this.convertConstant, this),
            Property: inter.elements.filter(ast.isProperty).map(this.convertProperty, this),
            Operation: inter.elements.filter(ast.isOperation).map(this.convertOperation, this),
        };
    }
    protected convertInterface(inter: ast.Interface): Catalogue.Interface {

        return {
            ...this.convertReferenceType(inter, 'Catalogue:Interface'),
            Base: inter.base.map(i => this.convertXlink(i, inter), this),
        };
    }
    protected convertComponent(component: ast.Component): Catalogue.Component {

        return {
            ...this.convertReferenceType(component, `Catalogue:${component.$type}`),
            Base: component.base ? this.convertXlink(component.base, component) : undefined,
            Interface: component.interface.map(i => this.convertXlink(i, component), this),
            EntryPoint: component.elements.filter(ast.isEntryPoint).map(this.convertEntryPoint, this),
            EventSink: component.elements.filter(ast.isEventSink).map(this.convertEventSink, this),
            EventSource: component.elements.filter(ast.isEventSource).map(this.convertEventSource, this),
            Field: component.elements.filter(ast.isField).map(this.convertField, this),
            Association: component.elements.filter(ast.isAssociation).map(this.convertAssociation, this),
            Container: component.elements.filter(ast.isContainer).map(this.convertContainer, this),
            Reference: component.elements.filter(ast.isReference_).map(this.convertReference, this),
        };
    }
    protected convertProperty(property: ast.Property): Types.Property {
        return {
            ...this.convertVisibilityElement(property),
            Type: this.convertXlink(property.type, property),
            AttachedField: property.attachedField ? this.convertXlink(property.attachedField, property) : undefined,
            GetRaises: property.getRaises.map(e => this.convertXlink(e, property)),
            SetRaises: property.setRaises.map(e => this.convertXlink(e, property)),
            '@Access': XsmpUtils.getAccessKind(property),
            '@Category': XsmpUtils.getPropertyCategory(property),
        };
    }
    protected convertReference(reference: ast.Reference_): Catalogue.Reference {
        return {
            ...this.convertNamedElement(reference),
            Interface: this.convertXlink(reference.interface, reference),
            '@Lower': XsmpUtils.getLower(reference),
            '@Upper': XsmpUtils.getUpper(reference),
        };
    }
    protected convertEventSink(eventSink: ast.EventSink): Catalogue.EventSink {
        return {
            ...this.convertNamedElement(eventSink),
            Type: this.convertXlink(eventSink.type, eventSink),
        };
    }
    protected convertEventSource(eventSource: ast.EventSource): Catalogue.EventSource {
        return {
            ...this.convertNamedElement(eventSource),
            Type: this.convertXlink(eventSource.type, eventSource),
            '@Multicast': XsmpUtils.isMulticast(eventSource),
        };
    }
    protected convertFloat(float: ast.Float): Types.Float {
        const range = float.range ? false : undefined;
        return {
            ...this.convertType(float, 'Types:Float'),
            PrimitiveType: float.primitiveType ? this.convertXlink(float.primitiveType, float) : undefined,
            '@Minimum': Solver.getValue(float.minimum)?.floatValue(XsmpUtils.getPrimitiveTypeKind(float) as XsmpUtils.FloatingPrimitiveTypeKind)?.getValue(),
            '@Maximum': Solver.getValue(float.maximum)?.floatValue(XsmpUtils.getPrimitiveTypeKind(float) as XsmpUtils.FloatingPrimitiveTypeKind)?.getValue(),
            '@MinInclusive': float.range === '...' || float.range === '..<' ? true : range,
            '@MaxInclusive': float.range === '...' || float.range === '<..' ? true : range,
            '@Unit': XsmpUtils.getUnit(float),
        };
    }
    protected convertInteger(integer: ast.Integer): Types.Integer {

        return {
            ...this.convertType(integer, 'Types:Integer'),
            PrimitiveType: integer.primitiveType ? this.convertXlink(integer.primitiveType, integer) : undefined,
            '@Minimum': Solver.getValue(integer.minimum)?.integralValue(XsmpUtils.getPrimitiveTypeKind(integer) as XsmpUtils.IntegralPrimitiveTypeKind)?.getValue(),
            '@Maximum': Solver.getValue(integer.maximum)?.integralValue(XsmpUtils.getPrimitiveTypeKind(integer) as XsmpUtils.IntegralPrimitiveTypeKind)?.getValue(),
            '@Unit': XsmpUtils.getUnit(integer),
        };
    }
    protected convertEventType(eventType: ast.EventType): Catalogue.EventType {

        return {
            ...this.convertType(eventType, 'Catalogue:EventType'),
            EventArgs: eventType.eventArgs ? this.convertXlink(eventType.eventArgs, eventType) : undefined,
        };
    }
    protected convertEnumeration(enumeration: ast.Enumeration): Types.Enumeration {

        return {
            ...this.convertType(enumeration, 'Types:Enumeration'),
            Literal: enumeration.literal.map(this.convertEnumerationLiteral, this) ?? [],
        };
    }
    protected convertEnumerationLiteral(literal: ast.EnumerationLiteral): Types.EnumerationLiteral {

        return {
            ...this.convertNamedElement(literal),
            '@Value': Solver.getValue(literal.value)?.integralValue('Int32')?.getValue() ?? BigInt(0),
        };
    }
    private toDateTime(expression: ast.Expression): string {
        const dateTime = Solver.getValue(expression)?.integralValue('DateTime')?.getValue() ?? BigInt(0);
        return Instant.ofEpochSecond(Number(dateTime / BigInt(1000000000)), Number(dateTime % BigInt(1000000000))).toString();
    }
    private toDuration(expression: ast.Expression): string {
        const duration = Solver.getValue(expression)?.integralValue('Duration')?.getValue() ?? BigInt(0);
        return Duration.ofSeconds(Number(duration / BigInt(1000000000)), Number(duration % BigInt(1000000000))).toString();
    }
    private toEnumerationValue(expression: ast.Expression): bigint | undefined {
        return Solver.getValue(Solver.getValue(expression)?.enumerationLiteral()?.getValue().value)?.integralValue('Int32')?.getValue();
    }
    private toString8(expression: ast.Expression): string {
        return XsmpUtils.escape(Solver.getValue(expression)?.stringValue()?.getValue());
    }

    protected convertValue(type: ast.Type | undefined, expression: ast.Expression): Types.Value {

        if (type) {
            switch (XsmpUtils.getPrimitiveTypeKind(type)) {
                case 'Bool': return { '@xsi:type': 'Types:BoolValue', '@Value': Solver.getValue(expression)?.boolValue()?.getValue() } as Types.BoolValue;
                case 'Char8': return { '@xsi:type': 'Types:Char8Value', '@Value': XsmpUtils.escape(Solver.getValue(expression)?.charValue()?.getValue()) } as Types.Char8Value;
                case 'Float32': return { '@xsi:type': 'Types:Float32Value', '@Value': Solver.getValue(expression)?.floatValue('Float32')?.getValue() } as Types.Float32Value;
                case 'Float64': return { '@xsi:type': 'Types:Float64Value', '@Value': Solver.getValue(expression)?.floatValue('Float64')?.getValue() } as Types.Float64Value;
                case 'Int8': return { '@xsi:type': 'Types:Int8Value', '@Value': Solver.getValue(expression)?.integralValue('Int8')?.getValue() } as Types.Int8Value;
                case 'Int16': return { '@xsi:type': 'Types:Int16Value', '@Value': Solver.getValue(expression)?.integralValue('Int16')?.getValue() } as Types.Int16Value;
                case 'Int32': return { '@xsi:type': 'Types:Int32Value', '@Value': Solver.getValue(expression)?.integralValue('Int32')?.getValue() } as Types.Int32Value;
                case 'Int64': return { '@xsi:type': 'Types:Int64Value', '@Value': Solver.getValue(expression)?.integralValue('Int64')?.getValue() } as Types.Int64Value;
                case 'UInt8': return { '@xsi:type': 'Types:UInt8Value', '@Value': Solver.getValue(expression)?.integralValue('UInt8')?.getValue() } as Types.UInt8Value;
                case 'UInt16': return { '@xsi:type': 'Types:UInt16Value', '@Value': Solver.getValue(expression)?.integralValue('UInt16')?.getValue() } as Types.UInt16Value;
                case 'UInt32': return { '@xsi:type': 'Types:UInt32Value', '@Value': Solver.getValue(expression)?.integralValue('UInt32')?.getValue() } as Types.UInt32Value;
                case 'UInt64': return { '@xsi:type': 'Types:UInt64Value', '@Value': Solver.getValue(expression)?.integralValue('UInt64')?.getValue() } as Types.UInt64Value;
                case 'Enum': return { '@xsi:type': 'Types:EnumerationValue', '@Value': this.toEnumerationValue(expression) } as Types.EnumerationValue;
                case 'DateTime': return { '@xsi:type': 'Types:DateTimeValue', '@Value': this.toDateTime(expression) } as Types.DateTimeValue;
                case 'Duration': return { '@xsi:type': 'Types:DurationValue', '@Value': this.toDuration(expression) } as Types.DurationValue;
                case 'String8': return { '@xsi:type': 'Types:String8Value', '@Value': this.toString8(expression) } as Types.String8Value;
                case 'None':
                    if (ast.isCollectionLiteral(expression)) {
                        if (ast.isArrayType(type)) {
                            return this.convertArrayValue(type, expression);
                        }
                        else if (ast.isStructure(type)) {
                            return this.convertStructureValue(type, expression);
                        }
                    }
            }
        }

        return { '@xsi:type': 'Types:Value' };
    }
    protected convertArrayValue(type: ast.ArrayType, expression: ast.CollectionLiteral): Types.Value {

        if (type.itemType.ref) {
            switch (XsmpUtils.getPrimitiveTypeKind(type.itemType.ref)) {
                case 'Bool': return { '@xsi:type': 'Types:BoolArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': Solver.getValue(e)?.boolValue()?.getValue() })) } as Types.BoolArrayValue;
                case 'Char8': return { '@xsi:type': 'Types:Char8ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': XsmpUtils.escape(Solver.getValue(e)?.charValue()?.getValue()) })) } as Types.Char8ArrayValue;
                case 'Float32': return { '@xsi:type': 'Types:Float32ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': Solver.getValue(e)?.floatValue('Float32')?.getValue() })) } as Types.Float32ArrayValue;
                case 'Float64': return { '@xsi:type': 'Types:Float64ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': Solver.getValue(e)?.floatValue('Float64')?.getValue() })) } as Types.Float64ArrayValue;
                case 'Int8': return { '@xsi:type': 'Types:Int8ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': Solver.getValue(e)?.integralValue('Int8')?.getValue() })) } as Types.Int8ArrayValue;
                case 'Int16': return { '@xsi:type': 'Types:Int16ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': Solver.getValue(e)?.integralValue('Int16')?.getValue() })) } as Types.Int16ArrayValue;
                case 'Int32': return { '@xsi:type': 'Types:Int32ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': Solver.getValue(e)?.integralValue('Int32')?.getValue() })) } as Types.Int32ArrayValue;
                case 'Int64': return { '@xsi:type': 'Types:Int64ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': Solver.getValue(e)?.integralValue('Int64')?.getValue() })) } as Types.Int64ArrayValue;
                case 'UInt8': return { '@xsi:type': 'Types:UInt8ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': Solver.getValue(e)?.integralValue('UInt8')?.getValue() })) } as Types.UInt8ArrayValue;
                case 'UInt16': return { '@xsi:type': 'Types:UInt16ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': Solver.getValue(e)?.integralValue('UInt16')?.getValue() })) } as Types.UInt16ArrayValue;
                case 'UInt32': return { '@xsi:type': 'Types:UInt32ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': Solver.getValue(e)?.integralValue('UInt32')?.getValue() })) } as Types.UInt32ArrayValue;
                case 'UInt64': return { '@xsi:type': 'Types:UInt64ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': Solver.getValue(e)?.integralValue('UInt64')?.getValue() })) } as Types.UInt64ArrayValue;
                case 'Enum': return { '@xsi:type': 'Types:EnumerationArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': this.toEnumerationValue(e) })) } as Types.EnumerationArrayValue;
                case 'DateTime': return { '@xsi:type': 'Types:DateTimeArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': this.toDateTime(e) })) } as Types.DateTimeArrayValue;
                case 'Duration': return { '@xsi:type': 'Types:DurationArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': this.toDuration(e) })) } as Types.DurationArrayValue;
                case 'String8': return { '@xsi:type': 'Types:String8ArrayValue', ItemValue: expression.elements.map(e => ({ '@Value': this.toString8(e) })) } as Types.String8ArrayValue;
            }
        }
        return { '@xsi:type': 'Types:ArrayValue', ItemValue: expression.elements.map(e => this.convertValue(type.itemType.ref, e), this) } as Types.ArrayValue;
    }

    protected convertStructureValue(type: ast.Structure, expression: ast.CollectionLiteral): Types.StructureValue {
        const fields = XsmpUtils.getAllFields(type).toArray();
        return { '@xsi:type': 'Types:StructureValue', FieldValue: expression.elements.map((e, index) => this.convertValue(fields.at(index)?.type.ref, e), this) };
    }

    protected convertAttributeType(attributeType: ast.AttributeType): Types.AttributeType {

        return {
            ...this.convertType(attributeType, 'Types:AttributeType'),
            Type: this.convertXlink(attributeType.type, attributeType),
            Default: attributeType.default ? this.convertValue(attributeType.type.ref, attributeType.default) : undefined,
            '@AllowMultiple': XsmpUtils.allowMultiple(attributeType),
            Usage: XsmpUtils.getUsages(attributeType)?.map(t => t.toString()),
        };
    }
    protected convertArrayType(arrayType: ast.ArrayType): Types.Array {

        return {
            ...this.convertType(arrayType, 'Types:Array'),
            ItemType: this.convertXlink(arrayType.itemType, arrayType),
            '@Size': Solver.getValue(arrayType.size)?.integralValue('Int64')?.getValue() ?? BigInt(0),
        };
    }
    protected convertStructure(structure: ast.Structure): Types.Structure {

        return {
            ...this.convertType(structure, 'Types:Structure'),
            Constant: structure.elements.filter(ast.isConstant).map(this.convertConstant, this),
            Field: structure.elements.filter(ast.isField).map(this.convertField, this),
        };
    }
    protected convertClass(type: ast.Class): Types.Class {

        return {
            ...this.convertStructure(type),
            '@xsi:type': 'Types:Class',
            Base: type.base ? this.convertXlink(type.base, type) : undefined,
            Property: type.elements.filter(ast.isProperty).map(this.convertProperty, this),
            Operation: type.elements.filter(ast.isOperation).map(this.convertOperation, this),
            Association: type.elements.filter(ast.isAssociation).map(this.convertAssociation, this),
            '@Abstract': XsmpUtils.isAbstractType(type) ? true : undefined,
        };
    }
    protected convertException(type: ast.Exception): Types.Exception {

        return {
            ...this.convertClass(type),
            '@xsi:type': 'Types:Exception',
        };
    }
    protected convertXlink(link: Reference<ast.NamedElement>, context: AstNode): xlink.Xlink {
        if (link.ref) {
            const refDoc = AstUtils.getDocument(link.ref),
                doc = AstUtils.getDocument(context);

            let href = `#${XsmpUtils.getId(link.ref) ?? XsmpUtils.fqn(link.ref)}`;
            if (doc !== refDoc) {
                let fileName = UriUtils.basename(refDoc.uri).replace(/\.xsmpcat$/, '.smpcat');
                if (fileName === 'ecss.smp.smpcat') { fileName = 'http://www.ecss.nl/smp/2019/Smdl'; }
                href = fileName + href;
            }

            return { '@xlink:title': link.ref.name, '@xlink:href': href };

        }
        return { '@xlink:title': link.$refText, '@xlink:href': `#${link.$refText}` };

    }
    protected convertOperation(operation: ast.Operation): Types.Operation {
        const id = XsmpUtils.getId(operation) ?? XsmpUtils.fqn(operation) + (operation.parameter.length > 0 ? '-' : '') + operation.parameter.map(p => p.type.ref?.name).join('-');
        return {
            ...this.convertVisibilityElement(operation),
            '@Id': id,
            Parameter: operation.returnParameter ?
                operation.parameter.map(p => this.convertParameter(p, id), this).concat(this.convertReturnParameter(operation.returnParameter, id)) :
                operation.parameter.map(p => this.convertParameter(p, id), this),
            RaisedException: operation.raisedException.map(e => this.convertXlink(e, operation)),
        };
    }
    protected convertReturnParameter(parameter: ast.ReturnParameter, id: string): Types.Parameter {
        return {
            '@Id': `${id}.${parameter.name ?? 'return'}`,
            '@Name': parameter.name ?? 'return',
            Description: XsmpUtils.getReturnParameterDescription(parameter),
            Metadata: parameter.attributes.map(this.convertAttribute, this),
            Type: this.convertXlink(parameter.type, parameter),
            '@Direction': 'return',
        };
    }
    protected convertParameter(parameter: ast.Parameter, id: string): Types.Parameter {
        return {
            '@Id': `${id}.${parameter.name}`,
            '@Name': parameter.name,
            Description: XsmpUtils.getParameterDescription(parameter),
            Metadata: parameter.attributes.map(this.convertAttribute, this),
            Type: this.convertXlink(parameter.type, parameter),
            Default: parameter.default ? this.convertValue(parameter.type.ref, parameter.default) : undefined,
            '@Direction': parameter.direction,
        };
    }
    protected convertContainer(container: ast.Container): Catalogue.Container {
        return {
            ...this.convertNamedElement(container),
            Type: this.convertXlink(container.type, container),
            DefaultComponent: container.defaultComponent ? this.convertXlink(container.defaultComponent, container) : undefined,
            '@Lower': XsmpUtils.getLower(container),
            '@Upper': XsmpUtils.getUpper(container),
        };
    }
    protected convertEntryPoint(entryPoint: ast.EntryPoint): Catalogue.EntryPoint {
        return {
            ...this.convertNamedElement(entryPoint),
            Input: entryPoint.input.map(e => this.convertXlink(e, entryPoint)),
            Output: entryPoint.output.map(e => this.convertXlink(e, entryPoint)),
        };
    }
    protected convertAssociation(association: ast.Association): Types.Association {
        return {
            ...this.convertVisibilityElement(association),
            Type: this.convertXlink(association.type, association),
        };
    }

    protected convertConstant(constant: ast.Constant): Types.Constant {
        return {
            ...this.convertVisibilityElement(constant),
            Type: this.convertXlink(constant.type, constant),
            Value: this.convertValue(constant.type.ref, constant.value),
        };
    }
    protected convertField(field: ast.Field): Types.Field {
        return {
            ...this.convertVisibilityElement(field),
            Type: this.convertXlink(field.type, field),
            Default: field.default ? this.convertValue(field.type.ref, field.default) : undefined,
            '@State': XsmpUtils.isState(field) ? undefined : false,
            '@Input': XsmpUtils.isInput(field) ? true : undefined,
            '@Output': XsmpUtils.isOutput(field) ? true : undefined,

        };
    }

    private convertDate(date: JSDocParagraph | undefined): string | undefined {
        if (!date) {
            return undefined;
        }
        try {
            return Instant.parse(date.toString().trim()).toString();
        }
        catch {
            return undefined;
        }
    }

    protected async convertCatalogue(catalogue: ast.Catalogue): Promise<Catalogue.Catalogue> {
        const id = XsmpUtils.getId(catalogue) ?? `_${XsmpUtils.fqn(catalogue)}`;

        return {
            '@xmlns:Elements': 'http://www.ecss.nl/smp/2019/Core/Elements',
            '@xmlns:Types': 'http://www.ecss.nl/smp/2019/Core/Types',
            '@xmlns:Catalogue': 'http://www.ecss.nl/smp/2019/Smdl/Catalogue',
            '@xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
            '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@xmlns:xlink': 'http://www.w3.org/1999/xlink',
            '@Id': id,
            '@Name': catalogue.name,
            '@Title': XsmpUtils.getTitle(catalogue),
            '@Date': this.convertDate(XsmpUtils.getDate(catalogue)),
            '@Creator': XsmpUtils.getCreator(catalogue),
            '@Version': XsmpUtils.getVersion(catalogue),
            Description: XsmpUtils.getDescription(catalogue),
            Metadata: catalogue.attributes.map(this.convertAttribute, this),
            Namespace: catalogue.elements.map(this.convertNamespace, this),
        };
    }
    protected async convertPackage(catalogue: ast.Catalogue): Promise<Package.Package> {
        const id = XsmpUtils.getId(catalogue) ?? `_${XsmpUtils.fqn(catalogue)}`,
            doc = AstUtils.getDocument(catalogue),
            prefix = `${UriUtils.basename(doc.uri).replace(/\.xsmpcat$/, '.smpcat')}#`,
            dependencies = doc.references.map(e => e.ref ? AstUtils.getDocument(e.ref).parseResult.value : undefined).filter(ast.isCatalogue)
                .filter(e => e !== catalogue && e.name !== 'ecss_smp_smp').sort((l, r) => l.name.localeCompare(r.name));
        return {
            '@xmlns:Elements': 'http://www.ecss.nl/smp/2019/Core/Elements',
            '@xmlns:Types': 'http://www.ecss.nl/smp/2019/Core/Types',
            '@xmlns:Catalogue': 'http://www.ecss.nl/smp/2019/Smdl/Catalogue',
            '@xmlns:Package': 'http://www.ecss.nl/smp/2019/Smdl/Package',
            '@xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
            '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@xmlns:xlink': 'http://www.w3.org/1999/xlink',
            '@Id': id,
            '@Name': catalogue.name,
            '@Title': XsmpUtils.getTitle(catalogue),
            '@Date': this.convertDate(XsmpUtils.getDate(catalogue)),
            '@Creator': XsmpUtils.getCreator(catalogue),
            '@Version': XsmpUtils.getVersion(catalogue),
            Description: XsmpUtils.getDescription(catalogue),
            Metadata: catalogue.attributes.map(this.convertAttribute, this),
            Dependency: dependencies.map(e => this.convertXlink({ ref: e, $refText: e.name }, catalogue)),
            Implementation: AstUtils.streamAllContents(catalogue).filter(ast.isType).filter(e => !ast.isInterface(e)).map(e =>
            ({
                '@xlink:href': prefix + this.getId(e),
                '@xlink:title': e.name
            })).toArray(),
        };
    }
    public async doGenerateCatalogue(catalogue: ast.Catalogue): Promise<string> {

        const obj = {
            'Catalogue:Catalogue': await this.convertCatalogue(catalogue),

        },
            doc = create({ version: '1.0', encoding: 'UTF-8' }, obj);
        return doc.end({ prettyPrint: true });
    }

    generate(node: AstNode, projectUri: URI, acceptTask: TaskAcceptor) {
        if (ast.isCatalogue(node)) {
            acceptTask(() => this.generateCatalogue(node, projectUri));
            acceptTask(() => this.generatePackage(node, projectUri));
        }
    }

    protected readonly smdlGenFolder = 'smdl-gen';
    clean(projectUri: URI) {
        fs.rmSync(UriUtils.joinPath(projectUri, this.smdlGenFolder).fsPath, { recursive: true, force: true });
    }

    public async doGeneratePackage(catalogue: ast.Catalogue): Promise<string> {

        const obj = {
            'Package:Package': await this.convertPackage(catalogue),

        },
            doc = create({ version: '1.0', encoding: 'UTF-8' }, obj);
        return doc.end({ prettyPrint: true });
    }

    private async createOutputDir(projectUri: URI): Promise<URI> {
        const outputDir = UriUtils.joinPath(projectUri, this.smdlGenFolder);

        fs.promises.mkdir(outputDir.fsPath, { recursive: true });
        return outputDir;
    }

    public async generateCatalogue(catalogue: ast.Catalogue, projectUri: URI): Promise<void> {

        const outputDir = await this.createOutputDir(projectUri);
        const smpcatFile = UriUtils.joinPath(outputDir, UriUtils.basename(catalogue.$document?.uri as URI).replace(/\.xsmpcat$/, '.smpcat'));
        fs.promises.writeFile(smpcatFile.fsPath, await this.doGenerateCatalogue(catalogue));

    }

    public async generatePackage(catalogue: ast.Catalogue, projectUri: URI): Promise<void> {
        const outputDir = await this.createOutputDir(projectUri);
        const smppkgFile = UriUtils.joinPath(outputDir, UriUtils.basename(catalogue.$document?.uri as URI).replace(/\.xsmpcat$/, '.smppkg'));
        fs.promises.writeFile(smppkgFile.fsPath, await this.doGeneratePackage(catalogue));

    }
}

