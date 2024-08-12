import * as XsmpUtils from './xsmp-utils.js';
import * as ast from '../generated/ast.js';
import type { ValidationAcceptor } from 'langium';
import { ChronoUnit, Duration, Instant } from '@js-joda/core';

abstract class Value<T> {

    abstract getValue(): boolean | bigint | number | string | ast.EnumerationLiteral

    abstract primitiveTypeKind(): XsmpUtils.PrimitiveTypeKind

    //Convertion functions
    boolValue(): BoolValue | undefined { return undefined; }
    enumerationLiteral(): EnumerationLiteralValue | undefined { return undefined; }
    integralValue(_type: XsmpUtils.IntegralPrimitiveTypeKind): IntegralValue | undefined { return undefined; }
    floatValue(_type: XsmpUtils.FloatingPrimitiveTypeKind): FloatValue | undefined { return undefined; }
    stringValue(): StringValue | undefined { return undefined; }
    charValue(): CharValue | undefined { return undefined; }

    // Unary operations
    not(): BoolValue | undefined { return undefined; }
    unaryComplement(): Value<T> | undefined { return undefined; }
    plus<U>(): Value<U> | undefined { return undefined; }
    negate<U>(): Value<U> | undefined { return undefined; }

    // Binary operations
    logicalOr(val: Value<T>): BoolValue | undefined {
        const left = this.boolValue()?.getValue(),
            right = val.boolValue()?.getValue();
        if (left !== undefined && right !== undefined) { return new BoolValue(left || right); }
        return undefined;
    }
    logicalAnd(val: Value<T>): BoolValue | undefined {
        const left = this.boolValue(),
            right = val.boolValue();
        if (left !== undefined && right !== undefined) { return new BoolValue(left.value && right.value); }
        return undefined;
    }
    or<U>(_val: Value<T>): Value<U> | undefined { return undefined; }
    and<U>(_val: Value<T>): Value<U> | undefined { return undefined; }
    xor<U>(_val: Value<T>): Value<U> | undefined { return undefined; }
    add<U>(_val: Value<T>): Value<U> | undefined { return undefined; }
    subtract<U>(_val: Value<T>): Value<U> | undefined { return undefined; }
    divide<U>(_val: Value<T>): Value<U> | undefined { return undefined; }
    multiply<U>(_val: Value<T>): Value<U> | undefined { return undefined; }
    remainder<U>(_val: Value<T>): Value<U> | undefined { return undefined; }
    shiftLeft<U>(_n: Value<T>): Value<U> | undefined { return undefined; }
    shiftRight<U>(_n: Value<T>): Value<U> | undefined { return undefined; }

    equal(_val: Value<T>): BoolValue | undefined { return undefined; }
    notEqual(_val: Value<T>): BoolValue | undefined { return undefined; }
    lessEqual(_val: Value<T>): BoolValue | undefined { return undefined; }
    greaterEqual(_val: Value<T>): BoolValue | undefined { return undefined; }
    less(_val: Value<T>): BoolValue | undefined { return undefined; }
    greater(_val: Value<T>): BoolValue | undefined { return undefined; }

}

export class BoolValue extends Value<BoolValue> {
    readonly value: boolean;
    constructor(value: boolean) {
        super();
        this.value = value;
    }
    override not(): BoolValue { return new BoolValue(!this.value); }
    override getValue(): boolean { return this.value; }
    override primitiveTypeKind(): XsmpUtils.PrimitiveTypeKind { return 'Bool'; }
    override boolValue(): this { return this; }
    override integralValue(type: XsmpUtils.IntegralPrimitiveTypeKind): IntegralValue { return new IntegralValue(BigInt(this.value), type); }
    override floatValue(type: XsmpUtils.FloatingPrimitiveTypeKind): FloatValue { return new FloatValue(Number(this.value), type); }
}
export class StringValue extends Value<StringValue> {
    readonly value: string;
    constructor(value: string) {
        super();
        this.value = value;
    }
    override getValue(): string { return this.value; }
    override primitiveTypeKind(): XsmpUtils.PrimitiveTypeKind { return 'String8'; }
    override stringValue(): this | undefined { return this; }

    override integralValue(type: XsmpUtils.IntegralPrimitiveTypeKind): IntegralValue | undefined {
        if (type === 'DateTime') {
            try {
                const instant = Instant.parse(this.value);
                return new IntegralValue(BigInt(instant.epochSecond()) * BigInt(1000000000) + BigInt(instant.nano()), type);
            }
            catch {
                return undefined;
            }
        }
        else if (type === 'Duration') {
            try {
                const duration = Duration.parse(this.value);
                return new IntegralValue(BigInt(duration.get(ChronoUnit.SECONDS)) * BigInt(1000000000) + BigInt(duration.get(ChronoUnit.NANOS)), type);
            }
            catch {
                return undefined;
            }
        }
        return undefined;
    }

}
export class CharValue extends Value<CharValue> {
    readonly value: string;
    constructor(value: string) {
        super();
        this.value = value;
    }
    override getValue(): string { return this.value; }
    override primitiveTypeKind(): XsmpUtils.PrimitiveTypeKind { return 'Char8'; }
    override charValue(): this | undefined { return this; }
}

export class EnumerationLiteralValue extends Value<EnumerationLiteralValue> {
    readonly value: ast.EnumerationLiteral;
    constructor(value: ast.EnumerationLiteral) {
        super();
        this.value = value;
    }
    override getValue(): ast.EnumerationLiteral { return this.value; }
    override enumerationLiteral(): this { return this; }
    override primitiveTypeKind(): XsmpUtils.PrimitiveTypeKind { return 'Enum'; }

}

export class IntegralValue extends Value<IntegralValue> {
    readonly value: bigint;
    readonly type: XsmpUtils.IntegralPrimitiveTypeKind;

    public static of(expr: ast.IntegerLiteral, accept?: ValidationAcceptor): IntegralValue | undefined {
        let text = expr.text.replaceAll("'", ''),

            type: XsmpUtils.IntegralPrimitiveTypeKind = 'Int32';
        if (text.endsWith('u') || text.endsWith('U')) {
            type = 'UInt32';
            text = text.slice(0, -1);
        }
        if (text.endsWith('l') || text.endsWith('L')) {
            type = type === 'Int32' ? 'Int64' : 'UInt64';
            text = text.slice(0, -1);
        }
        if (text.endsWith('u') || text.endsWith('U')) {
            type = type === 'Int32' ? 'UInt32' : 'UInt64';
            text = text.slice(0, -1);
        }
        const value = BigInt(text),
            result = new IntegralValue(value, type);
        if (result.value !== value) {
            if (accept) {
                accept('error', `Conversion overflow for type ${type}.`, { node: expr });
            }
            return undefined;
        }
        return result;
    }

    constructor(value: bigint, type: XsmpUtils.IntegralPrimitiveTypeKind) {
        super();
        switch (type) {
            case 'Int8': this.value = BigInt.asIntN(8, value); break;
            case 'Int16': this.value = BigInt.asIntN(16, value); break;
            case 'Int32': this.value = BigInt.asIntN(32, value); break;
            case 'Duration':
            case 'DateTime':
            case 'Int64': this.value = BigInt.asIntN(64, value); break;
            case 'UInt8': this.value = BigInt.asUintN(8, value); break;
            case 'UInt16': this.value = BigInt.asUintN(16, value); break;
            case 'UInt32': this.value = BigInt.asUintN(32, value); break;
            case 'UInt64': this.value = BigInt.asUintN(64, value); break;
        }

        this.type = type;

    }
    override getValue(): bigint { return this.value; }
    override primitiveTypeKind(): XsmpUtils.IntegralPrimitiveTypeKind { return this.type; }
    override boolValue(): BoolValue { return new BoolValue(this.value !== BigInt(0)); }
    override integralValue(type: XsmpUtils.IntegralPrimitiveTypeKind): IntegralValue | undefined {
        if (this.type === type) {
            return this;
        }
        const result = new IntegralValue(this.value, type);
        if (result.value !== this.value) {
            return undefined;
        }
        return result;
    }
    override floatValue(type: XsmpUtils.FloatingPrimitiveTypeKind): FloatValue { return new FloatValue(Number(this.value), type); }
    override charValue(): CharValue | undefined { return new CharValue(String.fromCharCode(Number(this.value))); }

    override unaryComplement(): IntegralValue { return new IntegralValue(~this.value, this.type); }
    override plus(): this { return this; }
    override negate(): IntegralValue { return new IntegralValue(-this.value, this.type); }
    promote(type: XsmpUtils.IntegralPrimitiveTypeKind): XsmpUtils.IntegralPrimitiveTypeKind {

        switch (this.type) { // Promote correctly Int8
            case 'Int8':
            case 'Int16':
            case 'UInt8':
            case 'UInt16':
                return type === 'Int8' || type === 'Int16' || type === 'UInt8' || type === 'UInt16' ? 'Int32' : type;
            case 'Int32':
                return type;
            case 'UInt32':
                return type === 'Int32' ? this.type : type;
            case 'Duration':
            case 'DateTime':
            case 'Int64':
                return type === 'UInt64' ? type : this.type;
            case 'UInt64':
                return 'UInt64';
        }
    }
    override or(val: IntegralValue): IntegralValue { return new IntegralValue(this.value | val.value, this.promote(val.type)); }
    override and(val: IntegralValue): IntegralValue { return new IntegralValue(this.value & val.value, this.promote(val.type)); }
    override xor(val: IntegralValue): IntegralValue { return new IntegralValue(this.value ^ val.value, this.promote(val.type)); }
    override add(val: IntegralValue): IntegralValue { return new IntegralValue(this.value + val.value, this.promote(val.type)); }
    override subtract(val: IntegralValue): IntegralValue { return new IntegralValue(this.value - val.value, this.promote(val.type)); }
    override divide(val: IntegralValue): IntegralValue { return new IntegralValue(this.value / val.value, this.promote(val.type)); }
    override multiply(val: IntegralValue): IntegralValue { return new IntegralValue(this.value * val.value, this.promote(val.type)); }
    override remainder(val: IntegralValue): IntegralValue { return new IntegralValue(this.value % val.value, this.promote(val.type)); }
    override shiftLeft(n: IntegralValue): IntegralValue { return new IntegralValue(this.value << n.value, this.type); }
    override shiftRight(n: IntegralValue): IntegralValue { return new IntegralValue(this.value >> n.value, this.type); }
}

export class FloatValue extends Value<FloatValue> {
    readonly value: number;
    readonly type: XsmpUtils.FloatingPrimitiveTypeKind;
    constructor(value: number, type: XsmpUtils.FloatingPrimitiveTypeKind) {
        super();
        switch (type) {
            case 'Float32': this.value = Math.fround(value); break;
            case 'Float64': this.value = value; break;
        }
        this.type = type;
    }
    public static of(expr: ast.FloatingLiteral, _accept?: ValidationAcceptor): FloatValue {
        const text = expr.text.replaceAll("'", '');
        if (text.endsWith('f') || text.endsWith('F')) {
            return new FloatValue(parseFloat(text.slice(0, -1)), 'Float32');
        }
        return new FloatValue(parseFloat(text), 'Float64');
    }

    override getValue(): number { return this.value; }
    override primitiveTypeKind(): XsmpUtils.FloatingPrimitiveTypeKind { return this.type; }
    override boolValue(): BoolValue { return new BoolValue(this.value !== 0.); }
    override integralValue(type: XsmpUtils.IntegralPrimitiveTypeKind): IntegralValue | undefined {
        try {
            return new IntegralValue(BigInt(this.value), type);
        } catch {
            return undefined;
        }
    }
    override floatValue(type: XsmpUtils.FloatingPrimitiveTypeKind): FloatValue {
        if (this.type === type) {
            return this;
        }

        return new FloatValue(this.value, type);
    }
    override plus(): this { return this; }
    override negate(): FloatValue { return new FloatValue(-this.value, this.type); }
    override add(val: FloatValue): FloatValue { return new FloatValue(this.value + val.value, val.type === 'Float64' || this.type === 'Float64' ? 'Float64' : 'Float32'); }
    override subtract(val: FloatValue): FloatValue { return new FloatValue(this.value - val.value, val.type === 'Float64' || this.type === 'Float64' ? 'Float64' : 'Float32'); }
    override divide(val: FloatValue): FloatValue { return new FloatValue(this.value / val.value, val.type === 'Float64' || this.type === 'Float64' ? 'Float64' : 'Float32'); }
    override multiply(val: FloatValue): FloatValue { return new FloatValue(this.value * val.value, val.type === 'Float64' || this.type === 'Float64' ? 'Float64' : 'Float32'); }
}

function convertBuiltinFunction<T>(func: ast.BuiltInFunction, accept?: ValidationAcceptor): Value<T> | undefined {
    if (func.name.endsWith('f')) {
        const value = getValueAs(func.argument, 'Float32', accept)?.floatValue('Float32');
        return value ? new FloatValue(Math[func.name.substring(0, -1) as ast.BuiltInFloat64Functions](value.getValue()), 'Float32') : undefined;
    }

    const value = getValueAs(func.argument, 'Float64', accept)?.floatValue('Float64');
    return value ? new FloatValue(Math[func.name as ast.BuiltInFloat64Functions](value.getValue()), 'Float64') : undefined;

}
export function getValue<T>(expression: ast.Expression | undefined, accept?: ValidationAcceptor): Value<T> | undefined {
    if (expression) {
        switch (expression.$type) {
            case ast.IntegerLiteral: return IntegralValue.of(expression as ast.IntegerLiteral, accept);
            case ast.FloatingLiteral: return FloatValue.of(expression as ast.FloatingLiteral, accept);
            case ast.BooleanLiteral: return new BoolValue((expression as ast.BooleanLiteral).isTrue);
            case ast.StringLiteral: return new StringValue((expression as ast.StringLiteral).value.join(''));
            case ast.CharacterLiteral: return new CharValue((expression as ast.CharacterLiteral).value);
            case ast.UnaryOperation: return unaryOperation(expression as ast.UnaryOperation, accept);
            case ast.BinaryOperation: return binaryOperation(expression as ast.BinaryOperation, accept);
            case ast.ParenthesizedExpression: return getValue((expression as ast.ParenthesizedExpression).expr, accept);
            case ast.BuiltInConstant: return new FloatValue(Math[(expression as ast.BuiltInConstant).name], 'Float64');
            case ast.BuiltInFunction:
                if (!(expression as ast.BuiltInFunction).argument && accept) {
                    accept('error', 'Missing argument.', { node: expression, property: 'argument' });
                }
                return convertBuiltinFunction(expression as ast.BuiltInFunction, accept);
            case ast.NamedElementReference:
                {
                    const ref = expression as ast.NamedElementReference;
                    if (ast.isEnumerationLiteral(ref.value.ref)) { return new EnumerationLiteralValue(ref.value.ref); }
                    else if (ast.isConstant(ref.value.ref)) {
                        if (accept && !XsmpUtils.isConstantVisibleFrom(expression, ref.value.ref)) { accept('error', 'The Constant is not visible.', { node: expression }); }
                        return getValue(ref.value.ref.value, accept);
                    }
                    else if (accept) {
                        accept('error', 'Invalid element.', { node: expression });
                        return undefined;
                    }
                }
        }
    }
    return undefined;
}
function getTypeName(type: ast.Type | XsmpUtils.PrimitiveTypeKind): string {
    if (ast.isType(type)) { return XsmpUtils.fqn(type); }
    return type;
}

function doGetValueAs<T>(expression: ast.Expression, value: Value<T>, type: ast.Type | XsmpUtils.PrimitiveTypeKind, accept?: ValidationAcceptor): Value<T> | undefined {
    const kind = ast.isType(type) ? XsmpUtils.getPrimitiveTypeKind(type) : type;
    if (XsmpUtils.isIntegralType(kind)) {
        const integralValue = value.integralValue(kind);
        if (integralValue && accept && ast.isInteger(type)) {
            const min = getValue(type.minimum)?.integralValue(kind)?.getValue();
            if (min !== undefined && integralValue.getValue() < min) {
                accept('error', `Integral value shall be greater than or equal to ${min}.`, { node: expression });
            }

            const max = getValue(type.maximum)?.integralValue(kind)?.getValue();
            if (max !== undefined && integralValue.getValue() > max) {
                accept('error', `Integral value shall be less than or equal to ${min}.`, { node: expression });
            }
        }
        return integralValue;
    }
    else if (XsmpUtils.isFloatingType(kind)) {
        const floatValue = value.floatValue(kind);
        if (floatValue && accept && ast.isFloat(type)) {
            const min = getValue(type.minimum)?.floatValue(kind)?.getValue();
            if (min !== undefined) {
                if (floatValue.getValue() < min || floatValue.getValue() === min && (type.range === '<..' || type.range === '<.<')) {
                    if (type.range === '<..' || type.range === '<.<') {
                        accept('error', `Float value shall be greater than ${min}.`, { node: expression });
                    }
                    else {
                        accept('error', `Float value shall be greater than or equal to ${min}.`, { node: expression });
                    }
                }
            }

            const max = getValue(type.maximum)?.floatValue(kind)?.getValue();
            if (max !== undefined) {
                if (floatValue.getValue() > max || floatValue.getValue() === max && (type.range === '<..' || type.range === '<.<')) {
                    if (type.range === '..<' || type.range === '<.<') {
                        accept('error', `Float value shall be less than ${max}.`, { node: expression });
                    }
                    else {
                        accept('error', `Float value shall be less than or equal to ${max}.`, { node: expression });
                    }
                }
            }
        }

        return floatValue;
    }
    else if (ast.isEnumeration(type)) {
        if (value instanceof EnumerationLiteralValue) {
            if (accept && value.getValue().$container !== type) {
                accept('error', `Enumeration literal ${value.getValue().name} is not of type ${type.name}.`, { node: expression });
            }
            return value;
        }
        else if (value instanceof IntegralValue) {
            const literal = type.literal.find(l => getValueAs(l.value, 'Int32')?.getValue() === value.getValue());
            if (literal) {
                if (accept) {
                    accept('warning', `The enumeration literal ${XsmpUtils.fqn(literal)} should be used.`, { node: expression, data: XsmpUtils.fqn(literal) });
                }
                return new EnumerationLiteralValue(literal);
            }
        }
    }
    else if (kind === 'Bool') { return value.boolValue(); }
    else if (kind === 'String8') {
        const stringValue = value.stringValue();
        if (stringValue && accept && ast.isStringType(type)) {
            const length = getValue(type.length)?.integralValue('Int64')?.getValue();
            if (length !== undefined && stringValue.getValue().length > length) {
                accept('error', `The string length exceeds the allowed length for its type: ${length} character(s).`, { node: expression });
            }
        }
        return stringValue;
    }
    else if (kind === 'Char8') {
        const charValue = value.charValue();
        if (charValue && accept) {
            if (charValue.getValue().length !== 1) {
                accept('error', 'A \'Char8\' shall contain exactly one character.', { node: expression });
            }
        }
        return charValue;
    }

    return undefined;
}

export function getValueAs<T>(expression: ast.Expression | undefined, type: ast.Type | XsmpUtils.PrimitiveTypeKind, accept?: ValidationAcceptor): Value<T> | undefined {
    if (!expression) {
        return;
    }
    const value = getValue(expression, accept);
    if (value === undefined) {
        return undefined;
    }

    const result = doGetValueAs(expression, value, type, accept);
    if (!result && accept) {
        accept('error', `${value.primitiveTypeKind()} cannot be converted to ${getTypeName(type)}.`, { node: expression });
    }

    return result;
}

function binaryOperationFunction<T, U>(left: Value<T>, right: Value<T>, feature: ast.OpBinary): Value<U> | undefined {

    switch (feature) {
        case '||': return left.logicalOr(right);
        case '&&': return left.logicalAnd(right);
        case '|': return left.or(right);
        case '&': return left.and(right);
        case '^': return left.xor(right);
        case '==': return left.equal(right);
        case '!=': return left.notEqual(right);
        case '<=': return left.lessEqual(right);
        case '>=': return left.greaterEqual(right);
        case '<': return left.less(right);
        case '>': return left.greater(right);
        case '+': return left.add(right);
        case '-': return left.subtract(right);
        case '/': return left.divide(right);
        case '*': return left.multiply(right);
        case '%': return left.remainder(right);
        case '<<': return left.shiftLeft(right);
        case '>>': return left.shiftRight(right);
    }

}

function binaryOperation<T>(expression: ast.BinaryOperation, accept?: ValidationAcceptor): Value<T> | undefined {

    const left = getValue(expression.leftOperand, accept),
        right = getValue(expression.rightOperand, accept);
    if (!left || !right) {
        return undefined;
    }

    let result: Value<T> | undefined;
    try {
        if (left instanceof BoolValue) {
            if (right instanceof BoolValue) {
                result = binaryOperationFunction(left, right, expression.feature);
            }
            else if (right instanceof IntegralValue) {
                result = binaryOperationFunction(left.integralValue(right.primitiveTypeKind()), right, expression.feature);
            }
            else if (right instanceof FloatValue) {
                result = binaryOperationFunction(left.floatValue(right.primitiveTypeKind()), right, expression.feature);
            }
        }
        else if (left instanceof IntegralValue) {
            if (right instanceof BoolValue) {
                result = binaryOperationFunction(left, right.integralValue(left.primitiveTypeKind()), expression.feature);
            }
            else if (right instanceof IntegralValue) {
                result = binaryOperationFunction(left, right, expression.feature);
            }
            else if (right instanceof FloatValue) {
                result = binaryOperationFunction(left.floatValue(right.primitiveTypeKind()), right, expression.feature);
            }
        }
        else if (left instanceof FloatValue) {
            if (right instanceof BoolValue) {
                result = binaryOperationFunction(left, right.floatValue(left.primitiveTypeKind()), expression.feature);
            }
            else if (right instanceof IntegralValue) {
                result = binaryOperationFunction(left, right.floatValue(left.primitiveTypeKind()), expression.feature);
            }
            else if (right instanceof FloatValue) {
                result = binaryOperationFunction(left, right, expression.feature);
            }
        }
        if (accept && result === undefined) {
            accept('error', `Binary operator '${expression.feature}' is not supported for operands of type '${left.primitiveTypeKind()}' and '${right.primitiveTypeKind()}'.`,
                { node: expression });
        }
    }
    catch (error) {
        if (accept) {
            accept('error', `${error}`, { node: expression });
        }
    }

    return result;
}

function unaryOperationFunction<T, U>(operand: Value<T>, feature: ast.OpUnary): Value<U> | undefined {

    switch (feature) {
        case '+': return operand.plus();
        case '-': return operand.negate();
        case '~': return operand.unaryComplement();
        case '!': return operand.not();
    }
}
function unaryOperation<T>(expression: ast.UnaryOperation, accept?: ValidationAcceptor): Value<T> | undefined {
    const operand = getValue(expression.operand, accept);
    if (!operand) {
        return undefined;
    }

    const result = unaryOperationFunction(operand, expression.feature);

    if (accept && result === undefined) {
        accept('error', `Unary operator '${expression.feature}' is not supported for operand of type '${operand.primitiveTypeKind()}'.`, { node: expression });
    }
    return result;
}
