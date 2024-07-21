grammar Xsmpcat
import 'Terminals'
import 'xsmp-types'

entry Catalogue returns Catalogue:
    attributes+=Attribute*  
    'catalogue' name=ValidID  
    namespace+=Namespace*
;
terminal FLOATING_LITERAL:FRACTIONALCONSTANT EXPONENTPART? FLOATINGSUFFIX?  | DIGITSEQUENCE EXPONENTPART FLOATINGSUFFIX?;
terminal FRACTIONALCONSTANT:DIGITSEQUENCE? '.' DIGITSEQUENCE  | DIGITSEQUENCE '.';
terminal DIGITSEQUENCE:/[0-9][0-9']*/;
terminal EXPONENTPART:/[eE][+-]?[0-9][0-9']*/;
terminal FLOATINGSUFFIX:/[fF]/;
terminal INTEGER_LITERAL:DECIMAL_LITERAL INTEGER_TIME_SUFFIX?  | OCTAL_LITERAL INTEGER_TIME_SUFFIX?  | HEXADECIMAL_LITERAL INTEGER_SUFFIX?  | BINARY_LITERAL INTEGER_SUFFIX?;
terminal DECIMAL_LITERAL:/[1-9][0-9']*/;
terminal OCTAL_LITERAL:/0[0-7']*/;
terminal HEXADECIMAL_LITERAL:/0[xX][0-9a-fA-F][0-9a-fA-F']*/;
terminal BINARY_LITERAL:/0[bB][01]['01]*/;
terminal INTEGER_SUFFIX:/(?:[uU][lL]?|[lL][uU]?)/;
terminal INTEGER_TIME_SUFFIX:'ns' | 'us' | 'ms' | 's' | 'mn' | 'h' | 'd' | 'y' | INTEGER_SUFFIX;


ValidID returns string:
    ID | 'extends' | 'implements' | 'in' | 'out' | 'inout' | 'class' | 'struct' | 'exception' | 'model' | 'service' | 'interface' | 'string' | 'native' | 'primitive' | 'attribute' | 'integer' | 'catalogue' | 'entrypoint' | 'field' | 'container' | 'reference' | 'eventsink' | 'eventsource' | 'property' | 'association' | 'constant' | 'input' | 'output' | 'transient' | 'event' | 'def' | 'abstract' | 'get' | 'set' | 'readWrite' | 'readOnly' | 'writeOnly' | 'array' | 'enum' | 'namespace' | 'throws' 
;
Namespace returns Namespace:
    attributes+=Attribute*  
    'namespace' name=ValidID  
    '{'
        (namespace+=Namespace|type+=Type)*
    '}'
;

Type returns Type:
    Structure | Class | Exception | Interface | Model | Service | ArrayType | ValueReference | Integer | Float | EventType | StringType | PrimitiveType | NativeType | AttributeType | Enumeration
;
VisibilityModifiers returns string:
    'private' | 'protected' | 'public' 
;
FieldModifiers returns string:
    VisibilityModifiers | 'input' | 'output' | 'transient' 
;
ClassModifiers returns string:
    VisibilityModifiers | 'abstract' 
;
PropertyModifiers returns string:
    VisibilityModifiers | 'readWrite' | 'readOnly' | 'writeOnly' 
;

Structure returns Structure:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers* 'struct' name=ValidID  
    '{' 
        element+=(Constant|Field)* 
    '}' 
;
Class returns Class:
    attributes+=Attribute*  
    modifiers+=ClassModifiers* 'class' name=ValidID ('extends' base=[Type:QualifiedName ] )?  
    '{' 
        element+=(Constant|Field|Property|Operation|Association)* 
    '}' 
;

Exception returns Exception:
    attributes+=Attribute*  
    modifiers+=ClassModifiers* 'exception' name=ValidID ('extends' base=[Type:QualifiedName ] )?  
    '{' 
        element+=(Constant|Field|Property|Operation|Association)* 
    '}' 
;
Interface returns Interface:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers* 'interface' name=ValidID ('extends' base+=[Type:QualifiedName ] (',' base+=[Type:QualifiedName ] )* )? 
    '{' 
        element+=(Constant|Property|Operation)* 
    '}' 
;

Model returns Model:
    attributes+=Attribute*  
    modifiers+=ClassModifiers* 'model' name=ValidID ('extends' base=[Type:QualifiedName ] )? ('implements' ^interface+=[Type:QualifiedName ] (',' ^interface+=[Type:QualifiedName ] )* )?
    '{' 
        element+=(Constant|Field|Property|Operation|Association|Container|Reference|EntryPoint|EventSink|EventSource)* 
    '}' 
;
Service returns Service:
    attributes+=Attribute*  
    modifiers+=ClassModifiers* 'service' name=ValidID ('extends' base=[Type:QualifiedName ] )? ('implements' ^interface+=[Type:QualifiedName ] (',' ^interface+=[Type:QualifiedName ] )* )?
    '{' 
        element+=(Constant|Field|Property|Operation|Association|Container|Reference|EntryPoint|EventSink|EventSource)* 
    '}' 
;

ArrayType returns ArrayType:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers* 'array' name=ValidID  '=' itemType=[Type:QualifiedName ] '['  size=Expression ? ']' 
;
ValueReference returns ValueReference:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers* 'using' name=ValidID  '=' ^type=[Type:QualifiedName ] '*' 
;
Integer returns Integer:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers* 'integer' name=ValidID  ('extends' primitiveType=[Type:QualifiedName ] )? ('in' (minimum=Expression  | '*' )'...' (maximum=Expression  | '*' ))?  
;
Float returns Float:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers* 'float' name=ValidID  ('extends' primitiveType=[Type:QualifiedName ] )? ('in' (minimum=Expression  | '*' ) range=RangeKind  (maximum=Expression  | '*' ))?
;
RangeKind returns RangeKind:
    '...' | '..<'  | '<..' | '<.<' 
;


EventType returns EventType:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers* 'event' name=ValidID  ('extends' eventArgs=[Type:QualifiedName ] )? 
;
StringType returns StringType:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers* 'string' name=ValidID  ('[' length=Expression  ']' )? 
;
PrimitiveType returns PrimitiveType:
    attributes+=Attribute*  
     modifiers+=VisibilityModifiers* 'primitive' name=ValidID 
;

NativeType returns NativeType:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers* 'native' name=ValidID  
;
AttributeType returns AttributeType:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers* 'attribute' ^type=[Type:QualifiedName ] name=ValidID  ('=' default=Expression  )? 
;

Enumeration returns Enumeration:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers* 'enum' name=ValidID  '{' (literal+=EnumerationLiteral  (',' literal+=EnumerationLiteral  )* ','? )? '}'
;
EnumerationLiteral returns EnumerationLiteral:
    attributes+=Attribute*  
    name=ValidID  '=' value=Expression   
;

Constant returns Constant:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers * 'constant' ^type=[Type:QualifiedName ] name=ValidID  ('=' value=Expression  )?  
;
Field returns Field:
    attributes+=Attribute*  
    modifiers+=FieldModifiers * 'field' ^type=[Type:QualifiedName ] name=ValidID  ('=' default=Expression  )?  
;
Property returns Property:
    attributes+=Attribute*  
    modifiers+=PropertyModifiers * 'property' ^type=[Type:QualifiedName ] name=ValidID  
    ('get' 'throws' getRaises+=[Type:QualifiedName ] (',' getRaises+=[Type:QualifiedName ] )* )? 
    ('set' 'throws' setRaises+=[Type:QualifiedName ] (',' setRaises+=[Type:QualifiedName ] )* )? 
    ('->' attachedField=[Field:QualifiedName ] )?  
;

Operation returns Operation:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers * 'def' (returnParameter=(ReturnParameter|ReturnParameterWithName)  | 'void' )name=ValidID  '(' (parameter+=Parameter  (',' parameter+=Parameter  )* )? ')' 
    ('throws' raisedException+=[Type:QualifiedName ] (',' raisedException+=[Type:QualifiedName ] )* )?  
;

ReturnParameter returns Parameter:
    attributes+=Attribute*  
    ^type=[Type:QualifiedName ]
;
ReturnParameterWithName returns Parameter:
    attributes+=Attribute*  
    ^type=[Type:QualifiedName ] name=ValidID
;

Parameter returns Parameter:
    attributes+=Attribute*  
    direction=ParameterDirectionKind? ^type=[Type:QualifiedName ] name=ValidID  ('=' default=Expression  )?  
;
ParameterDirectionKind returns ParameterDirectionKind:
    'in' | 'out' | 'inout'
;

Association returns Association:
    attributes+=Attribute*  
    modifiers+=VisibilityModifiers * 'association' ^type=[Type:QualifiedName ] name=ValidID  ('=' default=Expression  )?  
;


Container returns Container:
    attributes+=Attribute*  
    'container' ^type=[Type:QualifiedName ] MultiplicityDeclaration name=ValidID  ('=' defaultComponent=[Type:QualifiedName ] )?  
;

Reference returns Reference_:
    attributes+=Attribute*  
    'reference' ^interface=[Type:QualifiedName ] MultiplicityDeclaration name=ValidID   
;
fragment MultiplicityDeclaration*:
    optional?='?'  | multiplicity=Multiplicity ? 
;

Multiplicity returns Multiplicity:
    {Multiplicity} '[' ((lower=Expression  ('...' (aux?='*'  | upper=Expression  ))? ) | aux?='+'  | '*' )?']'  
;
EntryPoint returns EntryPoint:
    attributes+=Attribute*  
    'entrypoint' name=ValidID  ('{' ('in' input+=[Field:QualifiedName ]  | 'out' output+=[Field:QualifiedName ]  )*'}' )?  
;

EventSink returns EventSink:
    attributes+=Attribute*  
    'eventsink' ^type=[Type:QualifiedName ] name=ValidID   
;

EventSource returns EventSource:
    attributes+=Attribute*  
    'eventsource' ^type=[Type:QualifiedName ] name=ValidID   
;



Expression returns Expression:
    OrExpression 
;

Attribute returns Attribute:
    '@' ^type=[Type:QualifiedName ]  ('(' value=Expression ? ')' )?  
;

QualifiedName returns string:
    ValidID ('.' ValidID)*;


OrExpression returns Expression:
    AndExpression ({BinaryOperation.leftOperand=current} feature=OpOr    rightOperand=AndExpression  )*  
;

OpOr returns string:
    '||' 
;

AndExpression returns Expression:
    BitwiseOrExpression ({BinaryOperation.leftOperand=current} feature=OpAnd    rightOperand=BitwiseOrExpression  )*  
;

OpAnd returns string:
    '&&' 
;

BitwiseOrExpression returns Expression:
    BitwiseXorExpression ({BinaryOperation.leftOperand=current} feature=OpBitwiseOr    rightOperand=BitwiseXorExpression  )*  
;

OpBitwiseOr returns string:
    '|' 
;

BitwiseXorExpression returns Expression:
    BitwiseAndExpression ({BinaryOperation.leftOperand=current} feature=OpBitwiseXor    rightOperand=BitwiseAndExpression  )*  
;

OpBitwiseXor returns string:
    '^' 
;

BitwiseAndExpression returns Expression:
    EqualityExpression ({BinaryOperation.leftOperand=current} feature=OpBitwiseAnd    rightOperand=EqualityExpression  )*  
;

OpBitwiseAnd returns string:
    '&' 
;

EqualityExpression returns Expression:
    RelationalExpression ({BinaryOperation.leftOperand=current} feature=OpEquality    rightOperand=RelationalExpression  )*  
;

OpEquality returns string:
    '==' | '!=' 
;

RelationalExpression returns Expression:
    BitwiseExpression ({BinaryOperation.leftOperand=current} feature=OpCompare    rightOperand=BitwiseExpression  )*  
;

OpCompare returns string:
    '>=' | '<=' | '>' | '<' 
;

BitwiseExpression returns Expression:
    AdditiveExpression ({BinaryOperation.leftOperand=current} feature=OpBitwise    rightOperand=AdditiveExpression  )*  
;

OpBitwise returns string:
    '<<' | '>>' 
;

AdditiveExpression returns Expression:
    MultiplicativeExpression ({BinaryOperation.leftOperand=current} feature=OpAdd    rightOperand=MultiplicativeExpression  )*  
;

OpAdd returns string:
    '+' | '-' 
;

MultiplicativeExpression returns Expression:
    UnaryOperation ({BinaryOperation.leftOperand=current} feature=OpMulti    rightOperand=UnaryOperation  )*  
;

OpMulti returns string:
    '*' | '/' | '%' 
;

UnaryOperation returns Expression:
    {UnaryOperation} feature=OpUnary  operand=UnaryOperation   | Literal 
;

OpUnary returns string:
    "!" | "-" | "+" | "~" 
;

NamedElementReference returns Expression:
    {NamedElementReference} value=[NamedElement:QualifiedName ]  
;

Literal returns Expression:
    CollectionLiteral | FloatingLiteral | IntegerLiteral | StringLiteral | /*CharacterLiteral |*/ BooleanLiteral | ParenthesizedExpression | NamedElementReference | BuiltInConstant | BuiltInFunction | KeywordExpression 
;

ParenthesizedExpression returns Expression:
    {ParenthesizedExpression} '(' expr=Expression  ')'  
;

DesignatedInitializer returns Expression:
    {DesignatedInitializer} '.' field=[Field:ValidID ] ('=' expr=Expression  )?  
;

CollectionExpression returns Expression:
    Expression | DesignatedInitializer 
;

CollectionLiteral returns Expression:
    {CollectionLiteral} '{' (elements+=CollectionExpression  (',' elements+=CollectionExpression  )* )? '}'  
;

IntegerLiteral returns IntegerLiteral:
    {IntegerLiteral} text=INTEGER_LITERAL  
;

FloatingLiteral returns FloatingLiteral:
    {FloatingLiteral} text=FLOATING_LITERAL   
;

StringLiteral returns Expression:
    {StringLiteral} (value+=STRING )+  
;

CharacterLiteral returns Expression:
    {CharacterLiteral} value=STRING   
;

BuiltInConstant returns Expression:
    {BuiltInConstant} '$' name=ValidID   
;

BuiltInFunction returns Expression:
    {BuiltInFunction} '$' name=ValidID  '(' (parameter+=Expression  (',' parameter+=Expression  )* )? ')'  
;

BooleanLiteral returns Expression:
    {BooleanLiteral} ('false' | isTrue?='true'  ) 
;

KeywordExpression returns Expression:
    {KeywordExpression} name='nullptr'   
;
