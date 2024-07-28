import {  type ValidationAcceptor, type ValidationChecks } from 'langium';
import * as ast from '../generated/ast.js';
import type { XsmpcatServices } from '../xsmpcat-module.js';
import { isFloatingType, isIntegralType, XsmpUtils } from '../utils/xsmp-utils.js';
import { Solver } from '../utils/solver.js';

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
const namedElementRegex = /^[a-zA-Z]\w*$/;
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Implementation of custom validations.
 */
export class XsmpcatValidator {

    protected readonly xsmpUtils: XsmpUtils;

    constructor(services: XsmpcatServices) {

        this.xsmpUtils = services.XsmpUtils
    }

    checkNamedElement(element: ast.NamedElement, accept: ValidationAcceptor): void {

        if (element.name) {
            if (!namedElementRegex.test(element.name)) {
                accept('error', 'An Element Name shall start with a letter.',
                    { node: element, property: 'name' });
            }
            if (reservedNames.has(element.name)) {
                accept('error', 'An Element Name shall not be an ISO/ANSI C++ keyword.',
                    { node: element, property: 'name' });
            }
        }
        //TODO check attribute is valid for element
        for (const attribute of element.attributes) {
            if (attribute.type.ref) {
                const tags = this.xsmpUtils.getTags(attribute.type.ref, 'usage')

                if (!tags.some(t => ast.reflection.isSubtype(element.$type, t.content.toString()))) {
                    accept('warning', "This annotation is disallowed for this location.", { node: attribute, property: 'type' });
                }
                //TODO check duplicates
            }
        }

    }




    checkAttribute(attribute: ast.Attribute, accept: ValidationAcceptor): void {
        if (attribute.type.ref) {

            if (!attribute.type.ref.default && !attribute.value) {
                accept('error', 'A value is required.', { node: attribute, property: 'value' });
            }
            else if (attribute.value && attribute.type.ref.type.ref) {

                // const value = Solver.getValue(attribute.value)?.as(attribute.type.ref.type.ref)

                //TODO check value is ok for type
                // attribute.type.ref.type.ref
            }

        }
    }

    checkConstant(constant: ast.Constant, accept: ValidationAcceptor): void {


        if (constant.type.ref) {
            if (!constant.value) {
                accept('error', 'A Constant must have an initialization value.', { node: constant, property: 'value' });
            }
            else {
                const kind = XsmpUtils.getPrimitiveTypeKind(constant.type.ref)
                if (!Solver.getValueAs(constant.value, constant.type.ref, accept))
                    accept('error', `Value shall be of type ${kind}.`, { node: constant, property: 'value' });
            }
        }
    }

    checkField(field: ast.Field, accept: ValidationAcceptor): void {
        if (field.type.ref) {

            if (field.default) {
                //TODO check value
            }
        }
    }

    checkEnumeration(enumeration: ast.Enumeration, accept: ValidationAcceptor): void {
        if (enumeration.literal.length == 0) {
            accept('error', 'An Enumeration shall contains at least one literal.', { node: enumeration, property: 'literal' });
        }

        const values = new Set<any>();
        for (const literal of enumeration.literal) {

            const value = Solver.getValueAs(literal.value, 'Int32', accept)?.getValue()
            if (value === undefined) {
                accept('error', "Literal value shall be an Int32", { node: literal, property: 'value' });
            }
            else if (values.has(value)) {
                accept('error', "Enumeration Literal Values shall be unique within an Enumeration.", { node: literal, property: 'value' });
            }
            else {
                values.add(value)
            }
        }
    }

    checkInteger(integer: ast.Integer, accept: ValidationAcceptor): void {
        const kind = XsmpUtils.getPrimitiveTypeKind(integer)
        if (isIntegralType(kind)) {
            const min = Solver.getValueAs(integer.minimum, kind, accept)?.getValue()
            const max = Solver.getValueAs(integer.maximum, kind, accept)?.getValue()
            if (integer.minimum && min === undefined) {
                accept('error', `Minimum value shall be an ${kind}.`, { node: integer, property: 'minimum' });
            }
            if (integer.maximum && max === undefined) {
                accept('error', `Maximum value shall be an ${kind}.`, { node: integer, property: 'maximum' });
            }
            if (min !== undefined && max !== undefined && min > max) {
                accept('error', "Minimum shall be less or equal than Maximum.", { node: integer, property: 'minimum' });
            }
        }
        else {
            accept('error', 'Expecting an Integral Type.', { node: integer, property: 'primitiveType' })
        }

    }
    checkFloat(float: ast.Float, accept: ValidationAcceptor): void {

        const kind = XsmpUtils.getPrimitiveTypeKind(float)
        if (isFloatingType(kind)) {
            const min = Solver.getValueAs(float.minimum, kind, accept)?.getValue()
            const max = Solver.getValueAs(float.maximum, kind, accept)?.getValue()
            if (float.minimum && min === undefined) {
                accept('error', `Minimum value shall be a ${kind}.`, { node: float, property: 'minimum' });
            }
            if (float.maximum && max === undefined) {
                accept('error', `Maximum value shall be a ${kind}.`, { node: float, property: 'maximum' });
            }
            if (min !== undefined && max !== undefined) {

                // final var cmp = min.compareTo(max);
                if (min >= max && (min > max || float.range != '...')) {
                    accept('error', "Minimum shall be less than Maximum.", { node: float, property: 'minimum' });
                }
            }
        }
        else {
            accept('error', 'Expecting a Floating Point  Type.', { node: float, property: 'primitiveType' })
        }

    }

    checkType(type: ast.Type, accept: ValidationAcceptor): void {

        const uuid = this.xsmpUtils.getUuid(type)
        if (uuid === undefined) {
            accept('error', 'Missing Type UUID.', { node: type, property: 'name' })
        }
        else if (!uuidRegex.test(uuid.content.toString())) {
            accept('error', 'The UUID is invalid.', { node: type, range: uuid?.range })
        }


    }
}
