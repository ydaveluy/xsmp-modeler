

type RangeKind = RangeKind_Exclusive | RangeKind_MinInclusive | RangeKind_MaxInclusive | RangeKind_Inclusive;
type RangeKind_Exclusive = '<.<';
type RangeKind_MinInclusive = '..<';
type RangeKind_MaxInclusive = '<..';
type RangeKind_Inclusive = '...';

type ParameterDirectionKind = ParameterDirectionKind_in | ParameterDirectionKind_out | ParameterDirectionKind_inout;
type ParameterDirectionKind_in = 'in';
type ParameterDirectionKind_out = 'out';
type ParameterDirectionKind_inout = 'inout';

type WithBody = Structure | ReferenceType | Namespace;
type Invokable = Operation | Property;
type Publicable = Invokable | Field;


interface Catalogue extends Document {
	elements:Namespace[]
}

interface Document extends NamedElement {
}

interface NamedElement {
	name: string
	attributes: Attribute[]
}


interface Attribute {
	^type: @Type
	value?: Expression
}

interface Type extends VisibilityElement {
}

interface VisibilityElement extends NamedElement {
	modifiers: string[]
}


type BodyMember = Constant|Field|Property|Operation|Association|Container|Reference_|EntryPoint|EventSink|EventSource;

interface Namespace extends NamedElement {
	elements:(Namespace|Type)[]
}

interface Structure extends ValueType {
	elements:BodyMember[]
}

interface ValueType extends LanguageType {
}

interface LanguageType extends Type {
}

interface Class extends Structure {
	base?: @Type
}


interface Exception extends Class {
}

interface Interface extends ReferenceType {
	base: @Type[]
}

interface ReferenceType extends LanguageType {
	elements:BodyMember[]
}

interface Model extends Component {
}

interface Component extends ReferenceType {
	^interface: @Type[]
	base?: @Type
}

interface Service extends Component {
}

interface ArrayType extends ValueType {
	itemType: @Type
	size: Expression
}

interface ValueReference extends LanguageType {
	^type: @Type
}

interface Integer extends SimpleType {
	primitiveType?: @Type
	minimum?: Expression
	maximum?: Expression
}

interface SimpleType extends ValueType {
}

interface Float extends SimpleType {
	primitiveType?: @Type
	minimum?: Expression
	maximum?: Expression
	range?: RangeKind
}

interface EventType extends Type {
	eventArgs?: @Type
}

interface StringType extends SimpleType {
	length: Expression
}

interface PrimitiveType extends SimpleType {
}

interface NativeType extends LanguageType {
}

interface AttributeType extends Type {
	^type: @Type
	default?: Expression
}

interface Enumeration extends SimpleType {
	literal: EnumerationLiteral[]
}

interface EnumerationLiteral extends NamedElement {
	value: Expression
}

interface Field extends VisibilityElement, Resolvable {
	^type: @Type
	default?: Expression
}

interface Resolvable extends NamedElement {
}

interface Constant extends VisibilityElement {
	^type: @Type
	value: Expression
}

interface Property extends VisibilityElement, Resolvable {
	^type: @Type
	attachedField?: @Field
	getRaises: @Type[]
	setRaises: @Type[]
}

interface Operation extends VisibilityElement, Resolvable {
	returnParameter?: ReturnParameter
	parameter: Parameter[]
	raisedException: @Type[]
}

interface ReturnParameter {
	name?: string
	attributes: Attribute[]
	^type: @Type
}

interface Parameter extends NamedElement {
	^type: @Type
	default?: Expression
	direction?: ParameterDirectionKind
}

interface Association extends VisibilityElement {
	^type: @Type
	//default?: Expression
}

interface Container extends NamedElementWithMultiplicity, Resolvable {
	^type: @Type
	defaultComponent?: @Type
}

interface NamedElementWithMultiplicity extends NamedElement {
	multiplicity?: Multiplicity
	optional?: boolean
}

interface Multiplicity {
	lower?: Expression
	upper?: Expression
	aux?: boolean
}

interface Reference_ extends NamedElementWithMultiplicity, Resolvable {
	^interface: @Type
}

interface EntryPoint extends NamedElement, Resolvable {
	input: @Field[]
	output: @Field[]
}

interface EventSink extends NamedElement, Resolvable {
	^type: @Type
}

interface EventSource extends NamedElement, Resolvable {
	^type: @Type
}


type SmpStandard = 'ECSS_SMP_2019' | 'ECSS_SMP_2024'
interface Project extends Document {
	standard?: SmpStandard = 'ECSS_SMP_2019'
	elements: (ProfileReference | ToolReference | Dependency | Source)[]
}
interface ProfileReference{
	profile: @Profile
}
interface ToolReference{
	tool: @Tool
}
interface Dependency{
	project: @Project
}
interface Source{
	path: string
}


interface Tool extends Document {
}

interface Profile extends Document {
}

interface Expression {
}
interface BinaryOperation extends Expression {
	leftOperand: Expression
	rightOperand: Expression
	feature: OpBinary
}

type OpBinary = OpOr | OpAnd | OpBitwiseOr | OpBitwiseXor | OpBitwiseAnd | OpEquality | OpCompare | OpBitwise | OpAdd | OpMulti;
type OpOr = '||';
type OpAnd = '&&';
type OpBitwiseOr = '|';
type OpBitwiseAnd = '&';
type OpBitwiseXor = "^"
type OpEquality = '==' | '!=';
type OpCompare = '>=' | '<=' | '>' | '<';
type OpBitwise = '<<' | '>>';
type OpAdd = '+' | '-';
type OpMulti = '*' | '/' | '%';

interface UnaryOperation extends Expression {
	operand: Expression
	feature: OpUnary
}

type OpUnary = "!" | "-" | "+" | "~";


type ConstantOrEnumerationLiteral = Constant|EnumerationLiteral
interface NamedElementReference extends Expression {
	value: @ConstantOrEnumerationLiteral
}

interface ParenthesizedExpression extends Expression {
	expr?: Expression
}

interface DesignatedInitializer extends Expression {
	field: @Field
	expr: Expression
}

interface CollectionLiteral extends Expression {
	elements: Expression[]
}

interface IntegerLiteral extends Expression {
	text: string
}

interface FloatingLiteral extends Expression {
	text: string
}

interface StringLiteral extends Expression {
	value: string[]
}

interface CharacterLiteral extends Expression {
	value: string
}

interface BuiltInConstant extends Expression {
	name: string
}


interface BuiltInFunction extends Expression {
	name: string
	argument?: Expression
}

interface BooleanLiteral extends Expression {
	isTrue: boolean
}

interface KeywordExpression extends Expression {
	name: string
}
;
