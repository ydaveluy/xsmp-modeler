
import { FloatingPrimitiveTypeKind, IntegralPrimitiveTypeKind, isFloatingType, isIntegralType, PrimitiveTypeKind, XsmpUtils } from "./xsmp-utils.js";
import * as ast from '../generated/ast.js';
import { ValidationAcceptor } from "langium";
import { ChronoUnit, Duration, Instant } from "@js-joda/core";

abstract class Value<T> /*implements Value*/ {


    getValue(): boolean | bigint | number | string | ast.EnumerationLiteral {
        throw new Error("Method not implemented.");
    }

    primitiveTypeKind(): PrimitiveTypeKind { return 'None' }
    as<U>(type: ast.Type | PrimitiveTypeKind): Value<U> | undefined { return undefined }
    /*as(type: ast.Type | PrimitiveTypeKind): Value | undefined {
        const kind = ast.isType(type) ? XsmpUtils.getPrimitiveTypeKind(type) : type
        if (isIntegralType(kind))
            return this.integralValue(kind)
        if (isFloatingType(kind))
            return this.floatValue(kind)
        if (kind == 'Enum') {
            const value = this.enumerationLiteral()
            if (ast.isEnumeration(type)) {
                if (value?.getValue().$container == type)
                    return value
                return undefined
            }
            return value
        }

        return undefined
    }*/
    //convertion functions
    boolValue(): BoolValue | undefined { return undefined }
    enumerationLiteral(): EnumerationLiteralValue | undefined { return undefined }
    integralValue(type: IntegralPrimitiveTypeKind): IntegralValue | undefined { return undefined }
    floatValue(type: FloatingPrimitiveTypeKind): FloatValue | undefined { return undefined }
    stringValue(): StringValue | undefined { return undefined }
    charValue(): CharValue | undefined { return undefined }

    // unary operations
    not(): BoolValue | undefined { return undefined }
    unaryComplement(): Value<T> | undefined { return undefined }
    plus<U>(): Value<U> | undefined { return undefined }
    negate<U>(): Value<U> | undefined { return undefined }

    // binary operations
    logicalOr(val: Value<T>): BoolValue | undefined {
        const left = this.boolValue()?.getValue();
        const right = val.boolValue()?.getValue()
        if (left && right)
            return new BoolValue(left || right)
        return undefined
    }
    logicalAnd(val: Value<T>): BoolValue | undefined {
        const left = this.boolValue();
        const right = val.boolValue()
        if (left && right)
            return new BoolValue(left.value && right.value)
        return undefined
    }
    or<U>(val: Value<T>): Value<U> | undefined { return undefined }
    and<U>(val: Value<T>): Value<U> | undefined { return undefined }
    xor<U>(val: Value<T>): Value<U> | undefined { return undefined }
    add<U>(val: Value<T>): Value<U> | undefined { return undefined }
    subtract<U>(val: Value<T>): Value<U> | undefined { return undefined }
    divide<U>(val: Value<T>): Value<U> | undefined { return undefined }
    multiply<U>(val: Value<T>): Value<U> | undefined { return undefined }
    remainder<U>(val: Value<T>): Value<U> | undefined { return undefined }
    shiftLeft<U>(n: Value<T>): Value<U> | undefined { return undefined }
    shiftRight<U>(n: Value<T>): Value<U> | undefined { return undefined }

    equal(val: Value<T>): BoolValue | undefined { return undefined }
    notEqual(val: Value<T>): BoolValue | undefined { return undefined }
    lessEqual(val: Value<T>): BoolValue | undefined { return undefined }
    greaterEqual(val: Value<T>): BoolValue | undefined { return undefined }
    less(val: Value<T>): BoolValue | undefined { return undefined }
    greater(val: Value<T>): BoolValue | undefined { return undefined }

}

class BoolValue extends Value<BoolValue> {
    readonly value: boolean
    constructor(value: boolean) {
        super()
        this.value = value
    }
    override getValue(): boolean { return this.value }
    override primitiveTypeKind(): PrimitiveTypeKind { return 'Bool' }
    override boolValue(): this { return this }
    override integralValue(type: IntegralPrimitiveTypeKind): IntegralValue { return new IntegralValue(BigInt(this.value), type) }
    override floatValue(type: FloatingPrimitiveTypeKind): FloatValue { return new FloatValue(Number(this.value), type) }
}
class StringValue extends Value<StringValue> {
    readonly value: string
    constructor(value: string) {
        super()
        this.value = value
    }
    override getValue(): string { return this.value }
    override primitiveTypeKind(): PrimitiveTypeKind { return 'String8' }
    override stringValue(): this | undefined { return this }

    override integralValue(type: IntegralPrimitiveTypeKind): IntegralValue | undefined {
        if (type === 'DateTime')
            try {
                const instant = Instant.parse(this.value)
                return new IntegralValue(BigInt(instant.epochSecond()) * BigInt(1000000000) + BigInt(instant.nano()), type)
            }
            catch (error) {
                // return undefined
            }
        else if (type === 'Duration')
            try {
                const duration = Duration.parse(this.value)
                return new IntegralValue(BigInt(duration.get(ChronoUnit.SECONDS)) * BigInt(1000000000) + BigInt(duration.get(ChronoUnit.NANOS)), type)
            }
            catch (error) {
                // return undefined
            }
        return undefined
    }


}
class CharValue extends Value<CharValue> {
    readonly value: string
    constructor(value: string) {
        super()
        this.value = value
    }
    override getValue(): string { return this.value }
    override primitiveTypeKind(): PrimitiveTypeKind { return 'String8' }
    override charValue(): this | undefined { return this }
}

class EnumerationLiteralValue extends Value<EnumerationLiteralValue> {
    readonly value: ast.EnumerationLiteral
    constructor(value: ast.EnumerationLiteral) {
        super()
        this.value = value
    }
    override getValue(): ast.EnumerationLiteral { return this.value }
    override enumerationLiteral(): this { return this }
    override primitiveTypeKind(): PrimitiveTypeKind { return 'Enum' }

}

class IntegralValue extends Value<IntegralValue> {
    readonly value: bigint
    readonly type: IntegralPrimitiveTypeKind

    public static of(expr: ast.IntegerLiteral, accept: ValidationAcceptor): IntegralValue | undefined {
        let text = expr.text.replaceAll("'", '')

        let type: IntegralPrimitiveTypeKind = 'Int32'
        if (text.endsWith('u') || text.endsWith('U')) {
            type = 'UInt32'
            text = text.slice(0, -1)
        }
        if (text.endsWith('l') || text.endsWith('L')) {
            type = type == 'Int32' ? 'Int64' : 'UInt64'
            text = text.slice(0, -1)
        }
        if (text.endsWith('u') || text.endsWith('U')) {
            type = type == 'Int32' ? 'UInt32' : 'UInt64'
            text = text.slice(0, -1)
        }
        const value = BigInt(text)
        const result = new IntegralValue(value, type)
        if (result.value != value) {
            //TODO warning
            return undefined
        }
        return result


    }

    constructor(value: bigint, type: IntegralPrimitiveTypeKind) {
        super()
        switch (type) {
            case 'Int8': this.value = BigInt.asIntN(8, value); break
            case 'Int16': this.value = BigInt.asIntN(16, value); break
            case 'Int32': this.value = BigInt.asIntN(32, value); break
            case 'Duration':
            case 'DateTime':
            case 'Int64': this.value = BigInt.asIntN(64, value); break
            case 'UInt8': this.value = BigInt.asUintN(8, value); break
            case 'UInt16': this.value = BigInt.asUintN(16, value); break
            case 'UInt32': this.value = BigInt.asUintN(32, value); break
            case 'UInt64': this.value = BigInt.asUintN(64, value); break
        }

        this.type = type

    }
    override getValue(): bigint { return this.value }
    override primitiveTypeKind(): IntegralPrimitiveTypeKind { return this.type }
    override boolValue(): BoolValue { return new BoolValue(this.value != BigInt(0)) }
    override integralValue(type: IntegralPrimitiveTypeKind): IntegralValue | undefined {
        if (this.type == type)
            return this
        const result = new IntegralValue(this.value, type)
        if (result.value != this.value) {
            return undefined
        }
        return result
    }
    override floatValue(type: FloatingPrimitiveTypeKind): FloatValue { return new FloatValue(Number(this.value), type) }


    override unaryComplement(): IntegralValue { return new IntegralValue(~this.value, this.type) }
    override plus(): this { return this }
    override negate(): IntegralValue { return new IntegralValue(-this.value, this.type) }
    promote(type: IntegralPrimitiveTypeKind): IntegralPrimitiveTypeKind {

        switch (this.type) { // promote correcty Int8
            case 'Int8':
            case 'Int16':
            case 'UInt8':
            case 'UInt16':
                return type == 'Int8' || type == 'Int16' || type == 'UInt8' || type == 'UInt16' ? 'Int32' : type
            case 'Int32':
                return type
            case 'UInt32':
                return type == 'Int32' ? this.type : type
            case 'Duration':
            case 'DateTime':
            case 'Int64':
                return type == 'UInt64' ? type : this.type
            case 'UInt64':
                return 'UInt64'
        }
    }
    override or(val: IntegralValue): IntegralValue { return new IntegralValue(this.value | val.value, this.promote(val.type)) }
    override and(val: IntegralValue): IntegralValue { return new IntegralValue(this.value & val.value, this.promote(val.type)) }
    override xor(val: IntegralValue): IntegralValue { return new IntegralValue(this.value ^ val.value, this.promote(val.type)) }
    override add(val: IntegralValue): IntegralValue { return new IntegralValue(this.value + val.value, this.promote(val.type)) }
    override subtract(val: IntegralValue): IntegralValue { return new IntegralValue(this.value - val.value, this.promote(val.type)) }
    override divide(val: IntegralValue): IntegralValue { return new IntegralValue(this.value / val.value, this.promote(val.type)) }
    override multiply(val: IntegralValue): IntegralValue { return new IntegralValue(this.value * val.value, this.promote(val.type)) }
    override remainder(val: IntegralValue): IntegralValue { return new IntegralValue(this.value % val.value, this.promote(val.type)) }
    override shiftLeft(n: IntegralValue): IntegralValue { return new IntegralValue(this.value << n.value, this.type) }
    override shiftRight(n: IntegralValue): IntegralValue { return new IntegralValue(this.value >> n.value, this.type) }
}

class FloatValue extends Value<FloatValue> {
    readonly value: number
    readonly type: FloatingPrimitiveTypeKind
    constructor(value: number, type: FloatingPrimitiveTypeKind) {
        super()
        switch (type) {
            case 'Float32': this.value = Math.fround(value); break
            case 'Float64': this.value = value; break
        }
        this.type = type
    }
    public static of(expr: ast.FloatingLiteral, accept: ValidationAcceptor): FloatValue {
        let text = expr.text.replaceAll("'", '')
        if (text.endsWith('f') || text.endsWith('F')) {
            return new FloatValue(parseFloat(text.slice(0, -1)), 'Float32')
        }
        return new FloatValue(parseFloat(text), 'Float64')
    }


    override getValue(): number { return this.value }
    override primitiveTypeKind(): FloatingPrimitiveTypeKind { return this.type }
    override boolValue(): BoolValue { return new BoolValue(this.value != 0.) }
    override integralValue(type: IntegralPrimitiveTypeKind): IntegralValue | undefined {
        try {

            return new IntegralValue(BigInt(this.value), type)
        } catch (error) {
            return undefined
        }
    }
    override floatValue(type: FloatingPrimitiveTypeKind): FloatValue {
        if (this.type == type)
            return this

        return new FloatValue(this.value, type)
    }
    override plus(): this { return this }
    override negate(): FloatValue { return new FloatValue(-this.value, this.type) }
    override add(val: FloatValue): FloatValue { return new FloatValue(this.value + val.value, val.type == 'Float64' || this.type == 'Float64' ? 'Float64' : 'Float32') }
    override subtract(val: FloatValue): FloatValue { return new FloatValue(this.value - val.value, val.type == 'Float64' || this.type == 'Float64' ? 'Float64' : 'Float32') }
    override divide(val: FloatValue): FloatValue { return new FloatValue(this.value / val.value, val.type == 'Float64' || this.type == 'Float64' ? 'Float64' : 'Float32') }
    override multiply(val: FloatValue): FloatValue { return new FloatValue(this.value * val.value, val.type == 'Float64' || this.type == 'Float64' ? 'Float64' : 'Float32') }
}


export class Solver {


    public static getValue<T>(expression: ast.Expression | undefined, accept: ValidationAcceptor): Value<T> | undefined {
        if (expression) {
            if (ast.isIntegerLiteral(expression)) {
                return IntegralValue.of(expression, accept)
            }
            if (ast.isFloatingLiteral(expression)) {
                return FloatValue.of(expression, accept)
            }
            if (ast.isBooleanLiteral(expression)) {
                return new BoolValue(expression.isTrue)
            }
            if (ast.isStringLiteral(expression)) {
                return new StringValue(expression.value)
            }
            if (ast.isCharacterLiteral(expression)) {
                //TODO CharValue.of()
                return new CharValue(expression.value)
            }
            if (ast.isUnaryOperation(expression)) {
                return this.unaryOperation(expression, accept)
            }
            if (ast.isBinaryOperation(expression)) {
                return this.binaryOperation(expression, accept)
            }
            if (ast.isParenthesizedExpression(expression)) {
                return this.getValue(expression.expr, accept)
            }
            if (ast.isNamedElementReference(expression)) {
                if (ast.isEnumerationLiteral(expression.value?.ref))
                    return new EnumerationLiteralValue(expression.value?.ref)
                return this.getValue(expression.value?.ref?.value, accept)
            }
        }
        return undefined
    }

    public static getValueAs<T>(expression: ast.Expression | undefined, type: ast.Type | PrimitiveTypeKind, accept: ValidationAcceptor): Value<T> | undefined {

        const value = Solver.getValue(expression, accept)
        if (value == undefined) return undefined

        let result: Value<T> | undefined

        const kind = ast.isType(type) ? XsmpUtils.getPrimitiveTypeKind(type) : type
        if (isIntegralType(kind))
            result = value.integralValue(kind)
        else if (isFloatingType(kind))
            result = value.floatValue(kind)
        else if (ast.isEnumeration(type)) {
            const literal = value.enumerationLiteral()
            if (ast.isEnumeration(type) && literal?.getValue().$container == type)
                result = literal
            else
                result = undefined
        }
        else if (kind === 'Bool') {
            result = value.boolValue()
        }
        else if (kind === 'String8') {
            result = value.stringValue()
        }
        else if (kind === 'Char8') {
            result = value.charValue()
        }
        //TODO handle Duration an DateTime


        return result
    }


    private static binaryOperationFunction<T, U>(left: Value<T>, right: Value<T>, feature: string): Value<U> | undefined {
        switch (feature) {
            case "||": return left.logicalOr(right)
            case "&&": return left.logicalAnd(right)
            case "|": return left.or(right)
            case "&": return left.and(right)
            case "^": return left.xor(right)
            case "==": return left.equal(right)
            case "!=": return left.notEqual(right)
            case "<=": return left.lessEqual(right)
            case ">=": return left.greaterEqual(right)
            case "<": return left.less(right)
            case ">": return left.greater(right)
            case "+": return left.add(right)
            case "-": return left.subtract(right)
            case "/": return left.divide(right)
            case "*": return left.multiply(right)
            case "%": return left.remainder(right)
            case "<<": return left.shiftLeft(right)
            case ">>": return left.shiftRight(right)
            default: return undefined
        }
    }

    private static binaryOperation<T>(expression: ast.BinaryOperation, accept: ValidationAcceptor): Value<T> | undefined {

        let left = this.getValue(expression.leftOperand, accept)
        let right = this.getValue(expression.rightOperand, accept)
        if (!left || !right)
            return undefined

        let result: Value<T> | undefined
        if (left instanceof BoolValue) {
            if (right instanceof BoolValue) {
                result = Solver.binaryOperationFunction(left, right, expression.feature)
            }
            else if (right instanceof IntegralValue) {
                result = Solver.binaryOperationFunction(left.integralValue(right.primitiveTypeKind()), right, expression.feature)
            }
            else if (right instanceof FloatValue) {
                result = Solver.binaryOperationFunction(left.floatValue(right.primitiveTypeKind()), right, expression.feature)
            }
        }
        else if (left instanceof IntegralValue) {
            if (right instanceof BoolValue) {
                result = Solver.binaryOperationFunction(left, right.integralValue(left.primitiveTypeKind()), expression.feature)
            }
            else if (right instanceof IntegralValue) {
                result = Solver.binaryOperationFunction(left, right, expression.feature)
            }
            else if (right instanceof FloatValue) {
                result = Solver.binaryOperationFunction(left.floatValue(right.primitiveTypeKind()), right, expression.feature)
            }
        }
        else if (left instanceof FloatValue) {
            if (right instanceof BoolValue) {
                result = Solver.binaryOperationFunction(left, right.floatValue(left.primitiveTypeKind()), expression.feature)
            }
            else if (right instanceof IntegralValue) {
                result = Solver.binaryOperationFunction(left, right.floatValue(left.primitiveTypeKind()), expression.feature)
            }
            else if (right instanceof FloatValue) {
                result = Solver.binaryOperationFunction(left, right, expression.feature)
            }
        }
        if (result === undefined) {
            accept('error', `Binary operator '${expression.feature}' is not supported for operands of type '${left.primitiveTypeKind}' and '${right.primitiveTypeKind}'.`,
                { node: expression })
        }
        return result
    }

    private static unaryOperationFunction<T, U>(operand: Value<T>, feature: string): Value<U> | undefined {

        switch (feature) {
            case '+': return operand.plus()
            case '-': return operand.negate()
            case '~': return operand.unaryComplement()
            case '!': return operand.not()
        }
        return undefined
    }
    private static unaryOperation<T>(expression: ast.UnaryOperation, accept: ValidationAcceptor): Value<T> | undefined {
        let operand = this.getValue(expression.operand, accept)
        if (!operand)
            return undefined

        const result  = Solver.unaryOperationFunction(operand, expression.feature)

        if (result === undefined) {
            accept('error', `Unary operator '${expression.feature}' is not supported for operand of type '${operand.primitiveTypeKind}'.`, { node: expression })
        }
        return result
    }

}