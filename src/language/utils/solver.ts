
import { FloatingPrimitiveTypeKind, IntegralPrimitiveTypeKind, isFloatingType, isIntegralType, PrimitiveTypeKind, XsmpUtils } from "./xsmp-utils.js";
import * as ast from '../generated/ast.js';

interface Value {
    getValue(): boolean | bigint | number | string | ast.EnumerationLiteral
    primitiveTypeKind(): PrimitiveTypeKind
    boolValue(): BoolValue | undefined
    enumerationLiteral(): EnumerationLiteralValue | undefined
    integralValue(type: IntegralPrimitiveTypeKind): IntegralValue | undefined
    floatValue(type: FloatingPrimitiveTypeKind): FloatValue | undefined
    not(): BoolValue
    as(type: ast.Type | PrimitiveTypeKind): Value | undefined

}
abstract class SimpleValue<T> implements Value {
    getValue(): boolean | bigint | number | string | ast.EnumerationLiteral {
        throw new Error("Method not implemented.");
    }

    primitiveTypeKind(): PrimitiveTypeKind { return 'None' }
    as(type: ast.Type | PrimitiveTypeKind): Value | undefined {
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
    }
    boolValue(): BoolValue | undefined { return undefined }
    enumerationLiteral(): EnumerationLiteralValue | undefined { return undefined }
    integralValue(type: IntegralPrimitiveTypeKind): IntegralValue | undefined { return undefined }
    floatValue(type: FloatingPrimitiveTypeKind): FloatValue | undefined { return undefined }
    not(): BoolValue { return new BoolValue(!this.boolValue()) }
    unaryComplement(): SimpleValue<T> { throw Error("") }
    plus(): SimpleValue<T> { throw Error("plus") }
    negate(): SimpleValue<T> { throw Error("negate") }
    logicalOr(val: SimpleValue<T>): BoolValue | undefined {
        const left = this.boolValue()?.getValue();
        const right = val.boolValue()?.getValue()
        if (left && right)
            return new BoolValue(left || right)
        return undefined
    }
    logicalAnd(val: SimpleValue<T>): BoolValue | undefined {
        const left = this.boolValue();
        const right = val.boolValue()
        if (left && right)
            return new BoolValue(left.value && right.value)
        return undefined
    }
    or(val: SimpleValue<T>): SimpleValue<T> | undefined { return undefined }
    and(val: SimpleValue<T>): SimpleValue<T> | undefined { return undefined }
    xor(val: SimpleValue<T>): SimpleValue<T> | undefined { return undefined }
    add(val: SimpleValue<T>): SimpleValue<T> | undefined { return undefined }
    subtract(val: SimpleValue<T>): SimpleValue<T> | undefined { return undefined }
    divide(val: SimpleValue<T>): SimpleValue<T> | undefined { return undefined }
    multiply(val: SimpleValue<T>): SimpleValue<T> | undefined { return undefined }
    remainder(val: SimpleValue<T>): SimpleValue<T> | undefined { return undefined }
    shiftLeft(n: SimpleValue<T>): SimpleValue<T> | undefined { return undefined }
    shiftRight(n: SimpleValue<T>): SimpleValue<T> | undefined { return undefined }
}

class BoolValue extends SimpleValue<BoolValue> {
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

class EnumerationLiteralValue extends SimpleValue<EnumerationLiteralValue> {
    readonly value: ast.EnumerationLiteral
    constructor(value: ast.EnumerationLiteral) {
        super()
        this.value = value
    }
    override getValue(): ast.EnumerationLiteral { return this.value }
    override enumerationLiteral(): this { return this }
    override primitiveTypeKind(): PrimitiveTypeKind { return 'Enum' }

}

class IntegralValue extends SimpleValue<IntegralValue> {
    readonly value: bigint
    readonly type: IntegralPrimitiveTypeKind

    public static of(expr: ast.IntegerLiteral): IntegralValue | undefined {
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

class FloatValue extends SimpleValue<FloatValue> {
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
    public static of(expr: ast.FloatingLiteral): FloatValue {
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


    public static getValue(expression: ast.Expression | undefined): Value | undefined {
        if (expression) {
            if (ast.isIntegerLiteral(expression)) {
                return IntegralValue.of(expression)
            }
            if (ast.isFloatingLiteral(expression)) {
                return FloatValue.of(expression)
            }
            if (ast.isBooleanLiteral(expression)) {
                return new BoolValue(expression.isTrue)
            }
            if (ast.isUnaryOperation(expression)) {
                return this.unaryOperation(expression)
            }
            if (ast.isBinaryOperation(expression)) {
                return this.binaryOperation(expression)
            }
            if (ast.isParenthesizedExpression(expression)) {
                return this.getValue(expression.expr)
            }
            if (ast.isNamedElementReference(expression)) {
                if (ast.isEnumerationLiteral(expression.value?.ref))
                    return new EnumerationLiteralValue(expression.value?.ref)
                return this.getValue(expression.value?.ref?.value)
            }
        }


        return undefined
    }

    private static binaryOperationFunction<T>(left: SimpleValue<T>, right: SimpleValue<T>, feature: string): Value | undefined {
        switch (feature) {

            case "||": return left.logicalOr(right)
            case "&&": return left.logicalAnd(right)
            case "|": return left.or(right)
            case "&": return left.and(right)
            case "^": return left.xor(right)
            case "==": return new BoolValue(left.getValue() == right.getValue())
            case "!=": return new BoolValue(left.getValue() != right.getValue())
            case "<=": return new BoolValue(left.getValue() <= right.getValue())
            case ">=": return new BoolValue(left.getValue() >= right.getValue())
            case "<": return new BoolValue(left.getValue() < right.getValue())
            case ">": return new BoolValue(left.getValue() > right.getValue())
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

    private static binaryOperation(expression: ast.BinaryOperation): Value | undefined {

        let left = this.getValue(expression.leftOperand)
        let right = this.getValue(expression.rightOperand)

        if (left instanceof BoolValue) {
            if (right instanceof BoolValue) {
                return Solver.binaryOperationFunction(left, right, expression.feature)
            }
            if (right instanceof IntegralValue) {
                return Solver.binaryOperationFunction(left.integralValue(right.primitiveTypeKind()), right, expression.feature)
            }
            if (right instanceof FloatValue) {
                return Solver.binaryOperationFunction(left.floatValue(right.primitiveTypeKind()), right, expression.feature)
            }
        }
        else if (left instanceof IntegralValue) {
            if (right instanceof BoolValue) {
                return Solver.binaryOperationFunction(left, right.integralValue(left.primitiveTypeKind()), expression.feature)
            }
            if (right instanceof IntegralValue) {
                return Solver.binaryOperationFunction(left, right, expression.feature)
            }
            if (right instanceof FloatValue) {
                return Solver.binaryOperationFunction(left.floatValue(right.primitiveTypeKind()), right, expression.feature)
            }
        }
        else if (left instanceof FloatValue) {
            if (right instanceof BoolValue) {
                return Solver.binaryOperationFunction(left, right.floatValue(left.primitiveTypeKind()), expression.feature)
            }
            if (right instanceof IntegralValue) {
                return Solver.binaryOperationFunction(left, right.floatValue(left.primitiveTypeKind()), expression.feature)
            }
            if (right instanceof FloatValue) {
                return Solver.binaryOperationFunction(left, right, expression.feature)
            }
        }
        return undefined
    }

    private static unaryOperationFunction<T>(operand: SimpleValue<T>, feature: string): Value | undefined {
        switch (feature) {
            case '+': return operand.plus()
            case '-': return operand.negate()
            case '~': return operand.unaryComplement()
            case '!': return operand.not()
        }
        return undefined
    }
    private static unaryOperation(expression: ast.UnaryOperation): Value | undefined {
        let operand = this.getValue(expression.operand)

        if (operand instanceof BoolValue) {
            return Solver.unaryOperationFunction(operand, expression.feature)
        }
        if (operand instanceof IntegralValue) {
            return Solver.unaryOperationFunction(operand, expression.feature)
        }

        if (operand instanceof FloatValue) {
            return Solver.unaryOperationFunction(operand, expression.feature)
        }
        return undefined
    }

}