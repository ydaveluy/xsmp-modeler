import { URI } from "vscode-uri";


export function isBuiltinLibrary(uri: URI): boolean {
    return uri.scheme == "builtin"
}


// Déclaration et initialisation de la map
export const builtins: Map<string, string> = new Map([
    [URI.parse('builtin:///xsmp-sdk.profile').toString(), `
    /**
     * XSMP-SDK Profile
     */
    profile "xsmp-sdk"
    `],

    [URI.parse('builtin:///org.eclipse.xsmp.profile.xsmp-sdk.profile').toString(), `
    /**
     * XSMP-SDK Profile
     * @deprecated will be replaced by "xsmp-sdk" in next release
     */
    profile "org.eclipse.xsmp.profile.xsmp-sdk"
    `],

    [URI.parse('builtin:///esa-cdk.profile').toString(), `
    /**
     * ESA-CDK Profile
     */
    profile "esa-cdk"
    `],

    [URI.parse('builtin:///org.eclipse.xsmp.profile.esa-cdk.profile').toString(), `
    /**
     * ESA-CDK Profile
     * @deprecated will be replaced by "esa-cdk" in next release
     */
    profile "org.eclipse.xsmp.profile.esa-cdk"
    `],

    [URI.parse('builtin:///org.eclipse.xsmp.tool.smp.tool').toString(), `
    /**
     * SMP tool
     * 
     * @deprecated Use the "smp" tool instead.
     */
    tool "org.eclipse.xsmp.tool.smp"
    `],
    [URI.parse('builtin:///smp.tool').toString(), `
        /**
         * SMP tool
         */
        tool "smp"
        `],
    
    [URI.parse('builtin:///org.eclipse.xsmp.tool.python.tool').toString(), `
    /**
     * Python tool
     */
    tool "org.eclipse.xsmp.tool.python"
    `],

    [URI.parse('builtin:///org.eclipse.xsmp.tool.adoc.tool').toString(), `
    /**
     * AsciiDoc tool
     */
    tool "org.eclipse.xsmp.tool.adoc"
    `],

    [URI.parse('builtin:///ecss.smp.xsmpcat').toString(), `
    /**
     * Specifies the SMP Component Model as SMDL Catalogue.
     * 
     * @title SMP Component Model
     * @date 2019-10-24T17:58:59.567+02:00
     * @creator ECSS E40-07
     * @version 1.0
     * @id ecss.smp.smp.cat
     */
    catalogue ecss_smp_smp


    /**
     * Namespace for standard attributes
     * 
     * @id Smp.Attributes
     */
    namespace Attributes
    {
        /**
         * This attribute defines that a property setter raises an exception.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed666
         * @usage Property
         * @allowMultiple
         * @id Smp.Attributes.GetRaises
         */
        public attribute Smp.String8 GetRaises = "Smp::Exception"

        /**
         * This attribute defines that an operation raises an exception.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed665
         * @usage Operation
         * @allowMultiple
         * @id Smp.Attributes.RaisedException
         */
        public attribute Smp.String8 RaisedException = "Smp::Exception"

        /**
         * This attribute defines that a property setter raises an exception.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed667
         * @usage Property
         * @allowMultiple
         * @id Smp.Attributes.SetRaises
         */
        public attribute Smp.String8 SetRaises = "Smp::Exception"

        /**
         * This attribute marks a field as being a failure.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed660
         * @usage Field
         * @id Smp.Attributes.Failure
         */
        public attribute Smp.Bool Failure = true

        /**
         * This attribute defines that a property getter is constant, i.e. does not change the state of the owning class or component.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6cd
         * @usage Property
         * @id Smp.Attributes.ConstGetter
         */
        public attribute Smp.Bool ConstGetter = true

        /**
         * This enumeration allows to specify the behaviour when a Trigger is updated.
         * 
         * @uuid cdce9add-f196-11dc-a846-558902839034
         * @id Smp.Attributes.FieldUpdateKind
         */
        public enum FieldUpdateKind
        {
            /**
             * Field values are not updated automatically when the entry point is executed. In this case, all field updates must be explicitly scheduled via Transfer elements.
             * 
             * @id Smp.Attributes.FieldUpdateKind.None
             */
            None = 0,
            /**
             * All input fields associated with the entry point are updated from the linked outputs <i>before</i> the entry point is called.
             * 
             * @id Smp.Attributes.FieldUpdateKind.Pull
             */
            Pull = 1,
            /**
             * The values of all output fields associated with the entry point are automatically transferred to their linked input fields (in other models) <i>after</i> the entry point has been called.
             * 
             * @id Smp.Attributes.FieldUpdateKind.Push
             */
            Push = 2
        }

        /**
         * This attribute marks a field as being forcible. A forcible field provides support for forcing, i.e. the field value can be forced to a specified value during runtime. The following semantics apply for the different kinds of fields:
         * <ul>
         * <li>Input field: The forced value is provided to the model by the simulation environment. The containing model must internally operate on the field value obtained via the IField.GetValue() method, which ensures that the forced value is obtained when forcing is enabled; otherwise the real value is obtained.</li>
         * <li>Output field or Input/Output field: The forced value is provided to all connected input fields by the simulation environment (using the IForcibleField interface) according to the Field Links created. The containing model must internally operate on the real (unforced) field value.</li>
         * </ul>
         * The default value for this attribute is false, which corresponds to no support for forcing.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed661
         * @usage Field
         * @id Smp.Attributes.Forcible
         */
        public attribute Smp.Bool Forcible = true

        /**
         * This attribute specifies that an operation or property is abstract, i.e. that it must be overridden in a derived type. The default value for this attribute is false.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6c1
         * @usage Operation
         * @usage Property
         * @id Smp.Attributes.Abstract
         */
        public attribute Smp.Bool Abstract = true

        /**
         * This attribute specifies a name of a C++ class that shall be used as base class (implementation inheritance) for the Class or Structure implementation. This can be used to inherit the implementation from a non-SMP C++ class or structure into an SMP Class or Structure implementation, for example to wrap an existing C++ implementation as SMP Class or Structure. The default value for this attribute is the empty string, which corresponds to no base class.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6c2
         * @usage Class
         * @usage Exception
         * @usage Model
         * @usage Service
         * @usage Structure
         * @id Smp.Attributes.BaseClass
         */
        public attribute Smp.String8 BaseClass

        /**
         * The ByPointer attribute specifies that a parameter is passed by pointer. The default value for this attribute is false.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6c3
         * @usage Parameter
         * @usage Property
         * @usage Association
         * @id Smp.Attributes.ByPointer
         */
        public attribute Smp.Bool ByPointer = true

        /**
         * This attribute specifies that a parameter is passed by reference. The default value for this attribute is false.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6c4
         * @usage Parameter
         * @usage Property
         * @id Smp.Attributes.ByReference
         */
        public attribute Smp.Bool ByReference = true

        /**
         * This attribute specifies that a feature is "constant" in the following sense:
         * <ul>
         * <li>Association: The value of the referenced element is constant, i.e. it cannot be changed during runtime.</li>
         * <li>Operation: The state of the containing type (e.g. Model) is constant, i.e. the operation must not change the state during execution.</li>
         * <li>Property: The property type is constant, i.e. the property setter must not change the property value during execution.</li>
         * <li>Parameter: The value of the parameter is constant, i.e. the operation must not change it during execution. When applied to reference parameters (pointers in C++), the referenced element must not be changed.</li>
         * </ul>
         * The default value for this attribute is false.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6c5
         * @usage Association
         * @usage Property
         * @usage Operation
         * @usage Parameter
         * @id Smp.Attributes.Const
         */
        public attribute Smp.Bool Const = true

        /**
         * This attribute specifies that the operation is mapped to a C++ constructor. The default value for this attribute is false, which corresponds to not mapping to a constructor.
         * A constructor must not have a return parameter.
         * The name of the constructor is ignored as the Class or Model name is used in C++.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6c6
         * @usage Operation
         * @id Smp.Attributes.Constructor
         */
        public attribute Smp.Bool Constructor = true

        /**
         * This attribute defines an operator kind for an operation. It can be used to specify that the operation is mapped to a C++ operator. The default value for this attribute is None, which corresponds to not mapping to an operator.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6c7
         * @usage Operation
         * @id Smp.Attributes.Operator
         */
        public attribute Attributes.OperatorKind Operator

        /**
         * Enumeration of available operator kinds
         * 
         * @uuid d5562bc8-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.Attributes.OperatorKind
         */
        public enum OperatorKind
        {
            /**
             * No operator
             * 
             * @id Smp.Attributes.OperatorKind.None
             */
            None = 0,
            /**
             * Positive value
             * 
             * @id Smp.Attributes.OperatorKind.Positive
             */
            Positive = 1,
            /**
             * Negative value
             * 
             * @id Smp.Attributes.OperatorKind.Negative
             */
            Negative = 2,
            /**
             * Assign new value
             * 
             * @id Smp.Attributes.OperatorKind.Assign
             */
            Assign = 3,
            /**
             * Add value
             * 
             * @id Smp.Attributes.OperatorKind.Add
             */
            Add = 4,
            /**
             * Subtract value
             * 
             * @id Smp.Attributes.OperatorKind.Subtract
             */
            Subtract = 5,
            /**
             * Multiply with value
             * 
             * @id Smp.Attributes.OperatorKind.Multiply
             */
            Multiply = 6,
            /**
             * Divide by value
             * 
             * @id Smp.Attributes.OperatorKind.Divide
             */
            Divide = 7,
            /**
             * Remainder of division
             * 
             * @id Smp.Attributes.OperatorKind.Remainder
             */
            Remainder = 8,
            /**
             * Is greater than
             * 
             * @id Smp.Attributes.OperatorKind.Greater
             */
            Greater = 9,
            /**
             * Is less than
             * 
             * @id Smp.Attributes.OperatorKind.Less
             */
            Less = 10,
            /**
             * Is equal
             * 
             * @id Smp.Attributes.OperatorKind.Equal
             */
            Equal = 11,
            /**
             * Is not greater than
             * 
             * @id Smp.Attributes.OperatorKind.NotGreater
             */
            NotGreater = 12,
            /**
             * Is not less than
             * 
             * @id Smp.Attributes.OperatorKind.NotLess
             */
            NotLess = 13,
            /**
             * Is not equal
             * 
             * @id Smp.Attributes.OperatorKind.NotEqual
             */
            NotEqual = 14,
            /**
             * Index into array
             * 
             * @id Smp.Attributes.OperatorKind.Indexer
             */
            Indexer = 15,
            /**
             * Sum of instance and another value
             * 
             * @id Smp.Attributes.OperatorKind.Sum
             */
            Sum = 16,
            /**
             * Difference between instance and another value
             * 
             * @id Smp.Attributes.OperatorKind.Difference
             */
            Difference = 17,
            /**
             * Product of instance and another value
             * 
             * @id Smp.Attributes.OperatorKind.Product
             */
            Product = 18,
            /**
             * Quotient of instance and another value
             * 
             * @id Smp.Attributes.OperatorKind.Quotient
             */
            Quotient = 19,
            /**
             * Remainder of instance divided by another value
             * 
             * @id Smp.Attributes.OperatorKind.Module
             */
            Module = 20
        }

        /**
         * This attribute specifies that a feature is static, i.e. that it is defined on type/classifier scope. The default value for this attribute is false, which corresponds to instance scope.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6c8
         * @usage Operation
         * @usage Property
         * @usage Field
         * @usage Association
         * @id Smp.Attributes.Static
         */
        public attribute Smp.Bool Static = true

        /**
         * This attribute specifies that an operation or property is virtual, i.e. that it may be overridden in a derived type (polymorphism). The default value for this attribute is false.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6c9
         * @usage Operation
         * @usage Property
         * @id Smp.Attributes.Virtual
         */
        public attribute Smp.Bool Virtual = true

        /**
         * This attribute can be applied to an array type to ensure that it is registered into the TypeRegistry as simple array.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed662
         * @usage ArrayType
         * @id Smp.Attributes.SimpleArray
         */
        public attribute Smp.Bool SimpleArray = true

        /**
         * This attribute identifies that a class or component does not have a default constructor.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6ca
         * @usage Class
         * @usage Model
         * @usage Service
         * @id Smp.Attributes.NoConstructor
         */
        public attribute Smp.Bool NoConstructor = true

        /**
         * This attribute identifies that the destructor of a class or component is defaulted, and hence has no implementation.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6cb
         * @usage Class
         * @usage Model
         * @usage Service
         * @id Smp.Attributes.NoDestructor
         */
        public attribute Smp.Bool NoDestructor = true

        /**
         * This attribute defines that a field or association is mutable.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed6ce
         * @usage Field
         * @usage Association
         * @id Smp.Attributes.Mutable
         */
        public attribute Smp.Bool Mutable = true

        /**
         * This attribute can be applied to a Field, Property, Operation or Entry Point to specify the element's visibility during publication.
         * 
         * @uuid 8596d697-fb84-41ce-a685-6912006ed664
         * @usage Field
         * @usage Property
         * @usage Operation
         * @usage EntryPoint
         * @id Smp.Attributes.View
         */
        public attribute Smp.ViewKind View
    } // namespace Attributes

    /**
     * SMP standard types and interfaces.
     * 
     * @id Smp
     */
    namespace Smp
    {
        /**
         * Namespace for publication
         * 
         * @id Smp.Publication
         */
        namespace Publication
        {
            /**
             * This exception is raised when trying to add a literal to an enumeration using a value that has been used for another literal before.
             * 
             * @uuid eb59084a-47c5-11e8-845f-c7d886caef82
             * @id Smp.Publication.DuplicateLiteral
             */
            public exception DuplicateLiteral extends Smp.Exception
            {
                /**
                 * Get the name of the literal that has been added before using the same value.
                 * 
                 * @return Name of the literal.
                 * @id Smp.Publication.DuplicateLiteral.GetLiteralName
                 */
                public def Smp.String8 GetLiteralName ()

                /**
                 * Get the value of the literal that has been used before.
                 * 
                 * @return Value of the literal.
                 * @id Smp.Publication.DuplicateLiteral.GetLiteralValue
                 */
                public def Smp.Int32 GetLiteralValue ()
            }

            /**
             * This exception is raised when trying to use an invalid primitive type kind as parameter for a user-defined float or integer type.
             * 
             * @uuid 9774fa73-43a9-11e8-af4a-7bb62c2fdc04
             * @id Smp.Publication.InvalidPrimitiveType
             */
            public exception InvalidPrimitiveType extends Smp.Exception
            {
                /**
                 * Get the name of the invalid type that cannot be used.
                 * 
                 * @return Name of the new type that cannot be registered.
                 * @id Smp.Publication.InvalidPrimitiveType.GetTypeName
                 */
                public def Smp.String8 GetTypeName ()

                /**
                 * Get the invalid type that cannot be used.
                 * 
                 * @return Type that uses the same Uuid.
                 * @id Smp.Publication.InvalidPrimitiveType.GetType
                 */
                public def Smp.PrimitiveTypeKind GetType ()
            }

            /**
             * This exception is raised when trying to register a type with a Uuid that has already been registered.
             * 
             * @uuid d5562bbf-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Publication.TypeAlreadyRegistered
             */
            public exception TypeAlreadyRegistered extends Smp.Exception
            {
                /**
                 * Get the name of the new type that cannot be registered.
                 * 
                 * @return Name of the new type that cannot be registered.
                 * @id Smp.Publication.TypeAlreadyRegistered.GetTypeName
                 */
                public def Smp.String8 GetTypeName ()

                /**
                 * Get the type that uses the same Uuid.
                 * 
                 * @return Type that uses the same Uuid.
                 * @id Smp.Publication.TypeAlreadyRegistered.GetType
                 */
                public def @Attributes.Const Smp.Publication.IType GetType ()
            }

            /**
             * This exception is raised when trying to publish a feature with a type Uuid that has not been registered.
             * 
             * @uuid d5562bba-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Publication.TypeNotRegistered
             */
            public exception TypeNotRegistered extends Smp.Exception
            {
                /**
                 * Get the Uuid for which no type has been registered.
                 * 
                 * @return Uuid for which no type has been registered.
                 * @id Smp.Publication.TypeNotRegistered.GetUuid
                 */
                public def Smp.Uuid GetUuid ()
            }

            /**
             * The Parameter Direction Kind enumeration defines the possible parameter directions.
             * 
             * @uuid 1b3641ad-f0f0-11dc-b3ae-77a8f1ab4ab6
             * @id Smp.Publication.ParameterDirectionKind
             */
            public enum ParameterDirectionKind
            {
                /**
                 * The parameter is read-only to the operation, i.e. its value must be specified on call, and cannot be changed inside the operation.
                 * 
                 * @id Smp.Publication.ParameterDirectionKind.PDK_In
                 */
                PDK_In = 0,
                /**
                 * The parameter is write-only to the operation, i.e. its value is unspecified on call, and must be set by the operation.
                 * 
                 * @id Smp.Publication.ParameterDirectionKind.PDK_Out
                 */
                PDK_Out = 1,
                /**
                 * The parameter must be specified on call, and may be changed by the operation.
                 * 
                 * @id Smp.Publication.ParameterDirectionKind.PDK_InOut
                 */
                PDK_InOut = 2,
                /**
                 * The parameter represents the operation's return value.
                 * 
                 * @id Smp.Publication.ParameterDirectionKind.PDK_Return
                 */
                PDK_Return = 3
            }

            /**
             * This interface defines a registration mechanism for user defined types.
             * 
             * @uuid d553e151-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Publication.ITypeRegistry
             */
            public interface ITypeRegistry
            {
                /**
                 * Returns a type by its primitive type kind.
                 * 
                 * @param type
                 *       Primitive type the type is requested for.
                 * @return Interface to the requested type.
                 * @id Smp.Publication.ITypeRegistry.GetType1
                 */
                def Smp.Publication.IType GetType (Smp.PrimitiveTypeKind type)

                /**
                 * Returns a type by universally unique identifier.
                 * 
                 * @param typeUuid
                 *       Universally unique identifier for the requested type.
                 * @return Interface of the requested type, or null if no type with the registered Uuid could be found.
                 * @id Smp.Publication.ITypeRegistry.GetType2
                 */
                def Smp.Publication.IType GetType (Smp.Uuid typeUuid)

                /**
                 * Add a float type to the registry.
                 * 
                 * @param name
                 *       Name of the type.
                 * @param description
                 *       Description of the type.
                 * @param typeUuid
                 *       Universally unique identifier of the type.
                 * @param minimum
                 *       Minimum value for float.
                 * @param maximum
                 *       Maximum value for float.
                 * @param minInclusive
                 *       Flag whether the minimum value for float is valid or not.
                 * @param maxInclusive
                 *       Flag whether the maximum value for float is valid or not.
                 * @param unit
                 *       Unit of the type.
                 * @param type
                 *       Primitive type to use for Float type. This has to be either PTK_Float32 or PTK_Float64. For all other types, an exception of type InvalidPrimitiveType is raised.
                 * @return Interface to new type.
                 * @id Smp.Publication.ITypeRegistry.AddFloatType
                 */
                def Smp.Publication.IType AddFloatType (Smp.String8 name, Smp.String8 description, Smp.Uuid typeUuid,
                        Smp.Float64 minimum, Smp.Float64 maximum, Smp.Bool minInclusive, Smp.Bool maxInclusive,
                        Smp.String8 unit,
                        Smp.PrimitiveTypeKind type = Smp.PrimitiveTypeKind.PTK_Float64) throws Smp.Publication.TypeAlreadyRegistered, Smp.Publication.InvalidPrimitiveType

                /**
                 * Add an integer type to the registry.
                 * 
                 * @param name
                 *       Name of the type.
                 * @param description
                 *       Description of the type.
                 * @param typeUuid
                 *       Universally unique identifier of the type.
                 * @param minimum
                 *       Minimum value for integer.
                 * @param maximum
                 *       Maximum value for integer.
                 * @param unit
                 *       Unit of the type.
                 * @param type
                 *       Primitive type to use for Integer type. This has to be one of the available signed or unsigned integer types. For all other types, an exception of type InvalidPrimitiveType is raised.
                 * @return Interface to new type.
                 * @id Smp.Publication.ITypeRegistry.AddIntegerType
                 */
                def Smp.Publication.IType AddIntegerType (Smp.String8 name, Smp.String8 description, Smp.Uuid typeUuid,
                        Smp.Int64 minimum, Smp.Int64 maximum, Smp.String8 unit,
                        Smp.PrimitiveTypeKind type = Smp.PrimitiveTypeKind.PTK_Float32) throws Smp.Publication.TypeAlreadyRegistered, Smp.Publication.InvalidPrimitiveType

                /**
                 * Add an enumeration type to the registry.
                 * 
                 * @param name
                 *       Name of the type.
                 * @param description
                 *       Description of the type.
                 * @param typeUuid
                 *       Universally unique identifier of the type.
                 * @param memorySize
                 *       Size of an instance of this enumeration in bytes. Valid values are 1, 2, 4 and 8.
                 * @return Interface to new type.
                 * @id Smp.Publication.ITypeRegistry.AddEnumerationType
                 */
                def Smp.Publication.IEnumerationType AddEnumerationType (Smp.String8 name, Smp.String8 description,
                        Smp.Uuid typeUuid, Smp.Int16 memorySize) throws Smp.Publication.TypeAlreadyRegistered

                /**
                 * Add an array type to the registry.
                 * 
                 * @param name
                 *       Name of the type.
                 * @param description
                 *       Description of the type.
                 * @param typeUuid
                 *       Universally unique identifier of the type.
                 * @param itemTypeUuid
                 *       Universally unique identifier of the Type of the array items.
                 * @param itemSize
                 *       Size of an array item in bytes. This needs to take possible padding into account, as it may be used by the simulation environment to calculate the memory offset between array items.
                 * @param arrayCount
                 *       Number of elements in the array.
                 * @param simpleArray
                 *       True if array shall be implemented using ISimpleArrayField, i.e. without representing array items as fields.
                 * @return Interface to new type.
                 * @id Smp.Publication.ITypeRegistry.AddArrayType
                 */
                def Smp.Publication.IArrayType AddArrayType (Smp.String8 name, Smp.String8 description, Smp.Uuid typeUuid,
                        Smp.Uuid itemTypeUuid, Smp.Int64 itemSize, Smp.Int64 arrayCount,
                        Smp.Bool simpleArray) throws Smp.Publication.TypeAlreadyRegistered

                /**
                 * Add a string type to the registry.
                 * 
                 * @param name
                 *       Name of the type.
                 * @param description
                 *       Description of the type.
                 * @param typeUuid
                 *       Universally unique identifier of the type.
                 * @param length
                 *       Maximum length of the string.
                 * @return Interface to new type.
                 * @id Smp.Publication.ITypeRegistry.AddStringType
                 */
                def Smp.Publication.IType AddStringType (Smp.String8 name, Smp.String8 description, Smp.Uuid typeUuid,
                        Smp.Int64 length) throws Smp.Publication.TypeAlreadyRegistered

                /**
                 * Add a structure type to the registry.
                 * 
                 * @param name
                 *       Name of the type.
                 * @param description
                 *       Description of the type.
                 * @param typeUuid
                 *       Universally unique identifier of the type.
                 * @return Interface to new type that allows adding fields.
                 * @id Smp.Publication.ITypeRegistry.AddStructureType
                 */
                def Smp.Publication.IStructureType AddStructureType (Smp.String8 name, Smp.String8 description,
                        Smp.Uuid typeUuid) throws Smp.Publication.TypeAlreadyRegistered

                /**
                 * Add a class type to the registry.
                 * 
                 * @param name
                 *       Name of the type.
                 * @param description
                 *       Description of the type.
                 * @param typeUuid
                 *       Universally unique identifier of the type.
                 * @param baseClassUuid
                 *       Universally unique identifier of the base class.
                 *       Use Uuid_Void when the type has no base type.
                 * @return Interface to new type that allows adding fields.
                 * @id Smp.Publication.ITypeRegistry.AddClassType
                 */
                def Smp.Publication.IClassType AddClassType (Smp.String8 name, Smp.String8 description, Smp.Uuid typeUuid,
                        Smp.Uuid baseClassUuid) throws Smp.Publication.TypeAlreadyRegistered
            }

            /**
             * This base interface defines a type in the type registry.
             * 
             * @uuid d5517107-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Publication.IType
             */
            public interface IType extends Smp.IObject
            {
                /**
                 * Get primitive type kind that this type maps to, or PTK_None when the type cannot be mapped to a primitive type.
                 * 
                 * @return Primitive type kind that this type can be mapped to, or PTK_None for none.
                 * @id Smp.Publication.IType.GetPrimitiveTypeKind
                 */
                def Smp.PrimitiveTypeKind GetPrimitiveTypeKind ()

                /**
                 * Get Universally Unique Identifier of type.
                 * 
                 * @return Universally Unique Identifier of type.
                 * @id Smp.Publication.IType.GetUuid
                 */
                def Smp.Uuid GetUuid ()

                /**
                 * Publish an instance of the type against a receiver.
                 * 
                 * @param receiver
                 *       Receiver to publish against.
                 * @param name
                 *       Name of instance.
                 * @param description
                 *       Description of instance.
                 * @param address
                 *       Address of instance.
                 * @param view
                 *       View kind of instance.
                 * @param state
                 *       State flag of instance.
                 * @param input
                 *       Input flag of instance.
                 * @param output
                 *       Output flag of instance.
                 * @id Smp.Publication.IType.Publish
                 */
                def void Publish (inout Smp.IPublication receiver, Smp.String8 name, Smp.String8 description,
                        inout Smp.Int32 address, Smp.ViewKind view = Smp.ViewKind.VK_All, Smp.Bool state = true,
                        Smp.Bool input = false, Smp.Bool output = false)
            }

            /**
             * This interface defines a user defined enumeration type.
             * 
             * @uuid d5517145-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Publication.IEnumerationType
             */
            public interface IEnumerationType extends Smp.Publication.IType
            {
                /**
                 * Add a literal to the Enumeration.
                 * If the name is not a valid object name, an exception of type InvalidObjectName is thrown.
                 * If the name has already been used for another literal, an exception of type DuplicateName is thrown.
                 * If the value has already been used for another literal, a exception of type DuplicateLiteral is thrown.
                 * 
                 * @param name
                 *       Name of the literal.
                 * @param description
                 *       Description of the literal.
                 * @param value
                 *       Value of the literal
                 * @id Smp.Publication.IEnumerationType.AddLiteral
                 */
                def void AddLiteral (Smp.String8 name, Smp.String8 description,
                        Smp.Int32 value) throws Smp.InvalidObjectName, Smp.DuplicateName, Smp.Publication.DuplicateLiteral
            }

            /**
             * This interface defines a user defined array type.
             * 
             * @uuid 9774fa68-43a9-11e8-af4a-7bb62c2fdc04
             * @id Smp.Publication.IArrayType
             */
            public interface IArrayType extends Smp.Publication.IType
            {
                /**
                 * Get the size (number of array items) of the array type.
                 * 
                 * @return Size (number of array items) of the array type.
                 * @id Smp.Publication.IArrayType.GetSize
                 */
                def Smp.UInt64 GetSize ()

                /**
                 * Get the type of each array item.
                 * Within one array, each array item needs to be of the same type.
                 * 
                 * @return Type of each array item.
                 * @id Smp.Publication.IArrayType.GetItemType
                 */
                def @Attributes.Const Smp.Publication.IType GetItemType ()
            }

            /**
             * This interface defines a user defined structure type.
             * 
             * @uuid d5517128-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Publication.IStructureType
             */
            public interface IStructureType extends Smp.Publication.IType
            {
                /**
                 * Add a field to the Structure.
                 * 
                 * @param name
                 *       Name of field.
                 * @param description
                 *       Description of field.
                 * @param uuid
                 *       Uuid of field Type, which must be a value type, but not String8.
                 * @param offset
                 *       Memory offset of field relative to Structure.
                 * @param view
                 *       View kind of field.
                 * @param state
                 *       State flag of field. When true, the field shall be part of a state vector (Store/Restore).
                 * @param input
                 *       Input flag of field. When true, the field can be used as target of a dataflow connection.
                 * @param output
                 *       Output flag of field. When true, the field can be used as source of a dataflow connection.
                 * @id Smp.Publication.IStructureType.AddField
                 */
                def void AddField (Smp.String8 name, Smp.String8 description, Smp.Uuid uuid, Smp.Int64 offset,
                        Smp.ViewKind view = Smp.ViewKind.VK_All, Smp.Bool state = true, Smp.Bool input = false,
                        Smp.Bool output = false)
            }

            /**
             * This interface defines a user defined class type.
             * 
             * @uuid d5517142-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Publication.IClassType
             */
            public interface IClassType extends Smp.Publication.IStructureType
            {
            }

            /**
             * This interface provides functionality to publish operation parameters.
             * 
             * @uuid d54f270c-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Publication.IPublishOperation
             */
            public interface IPublishOperation
            {
                /**
                 * Publish a parameter of an operation with the given name, description, type and direction.
                 * If a parameter with the same name has already been published, and exception of type DuplicateName is thrown.
                 * If the name is not a valid name, an exception of type InvalidObjectName is thrown.
                 * If no type with the given type UUID exists, an exception of type TypeNotRegistered is thrown.
                 * 
                 * @param name
                 *       Name of parameter.
                 * @param description
                 *       Description of parameter.
                 * @param typeUuid
                 *       Uuid of parameter type.
                 * @param direction
                 *       Direction kind of parameter.
                 * @id Smp.Publication.IPublishOperation.PublishParameter
                 */
                def void PublishParameter (Smp.String8 name, Smp.String8 description, Smp.Uuid typeUuid,
                        Smp.Publication.ParameterDirectionKind direction = Smp.Publication.ParameterDirectionKind.PDK_In) throws Smp.Publication.TypeNotRegistered, Smp.DuplicateName, Smp.InvalidObjectName
            }
        } // namespace Publication

        /**
         * Namespace for simulation services
         * 
         * @id Smp.Services
         */
        namespace Services
        {
            /**
             * This interface is implemented by the Link Registry Service.
             * 
             * @uuid d54f26d7-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.ILinkRegistry
             */
            public interface ILinkRegistry extends Smp.IService
            {
                /**
                 * Name of the LinkRegistry service.
                 * 
                 * @id Smp.Services.ILinkRegistry.SMP_LinkRegistry
                 */
                constant Smp.String8 SMP_LinkRegistry = "LinkRegistry"

                /**
                 * Add a link from source component to target component.
                 * This increments the link count between source and target.
                 * 
                 * @param source
                 *       Source component of link (i.e. the component that links to another component).
                 * @param target
                 *       Target component of link (i.e. the component that is being linked to by another component).
                 * @id Smp.Services.ILinkRegistry.AddLink
                 */
                def void AddLink (inout Smp.IComponent source, Smp.IComponent target)

                /**
                 * Returns the number of links between source and target.
                 * This number is incremented each time AddLink() is called, and decremented each time that RemoveLink() is called.
                 * 
                 * @param source
                 *       Source component of link (i.e. the component that links to another component).
                 * @param target
                 *       Target component of link (i.e. the component that is being linked to by another component).
                 * @return True if such a link has been added before (and not been removed), false otherwise.
                 * @id Smp.Services.ILinkRegistry.GetLinkCount
                 */
                def Smp.UInt32 GetLinkCount (Smp.IComponent source, Smp.IComponent target)

                /**
                 * Remove a link between source and target that has been added to the service using AddLink() before.
                 * This decrements the link count between source and target.
                 * 
                 * @param source
                 *       Source component of link (i.e. the component that links to another component).
                 * @param target
                 *       Target component of link (i.e. the component that is being linked to by another component).
                 * @return True if the link count between source and target had been positive and has been decremented, false if the link count had already been 0.
                 * @id Smp.Services.ILinkRegistry.RemoveLink
                 */
                def Smp.Bool RemoveLink (Smp.IComponent source, Smp.IComponent target)

                /**
                 * Returns a collection of all sources that have a link to the given target.
                 * 
                 * @param target
                 *       Target component to return link sources for.
                 * @return Collection of source components which link to the given target.
                 * @id Smp.Services.ILinkRegistry.GetLinkSources
                 */
                def Smp.ComponentCollection GetLinkSources (Smp.IComponent target)

                /**
                 * Returns true if all sources linking to the given target can be asked to remove their link(s), false otherwise.
                 * 
                 * @param target
                 *       Target component to check for links.
                 * @return True if all links to the given target can be removed, false otherwise.
                 * @id Smp.Services.ILinkRegistry.CanRemove
                 */
                def Smp.Bool CanRemove (Smp.IComponent target)

                /**
                 * Removes all links to the given target.
                 * 
                 * @param target
                 *       Target component of link (i.e. the component that is being linked to by other components).
                 * @id Smp.Services.ILinkRegistry.RemoveLinks
                 */
                def void RemoveLinks (Smp.IComponent target)
            }

            /**
             * This exception is raised when trying to subscribe an entry point to an event that is already subscribed.
             * 
             * @uuid d54f26af-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.EntryPointAlreadySubscribed
             */
            public exception EntryPointAlreadySubscribed extends Smp.Exception
            {
                /**
                 * Get the entry point that is already subscribed to the event.
                 * 
                 * @return Entry point that is already subscribed to the event.
                 * @id Smp.Services.EntryPointAlreadySubscribed.GetEntryPoint
                 */
                public def @Attributes.Const Smp.IEntryPoint GetEntryPoint ()

                /**
                 * Get the name of the event that the entry point is already subscribed to.
                 * 
                 * @return Name of the event that the entry point is already subscribed to.
                 * @id Smp.Services.EntryPointAlreadySubscribed.GetEventName
                 */
                public def Smp.String8 GetEventName ()
            }

            /**
             * This exception is raised when trying to unsubscribe an entry point from an event that is not subscribed to it.
             * 
             * @uuid d54f26b6-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.EntryPointNotSubscribed
             */
            public exception EntryPointNotSubscribed extends Smp.Exception
            {
                /**
                 * Get the entry point that is not subscribed to the event.
                 * 
                 * @return Entry point that is not subscribed to the event.
                 * @id Smp.Services.EntryPointNotSubscribed.GetEntryPoint
                 */
                public def @Attributes.Const Smp.IEntryPoint GetEntryPoint ()

                /**
                 * Get the name of the event that the entry point is not subscribed to.
                 * 
                 * @return Name of the event that the entry point is not subscribed to.
                 * @id Smp.Services.EntryPointNotSubscribed.GetEventName
                 */
                public def Smp.String8 GetEventName ()
            }

            /**
             * This exception is thrown by one of the AddEvent() methods of the scheduler when the event is a cyclic event (i.e. repeat is not 0), but the cycle time specified is not a positive duration.
             * 
             * @uuid d54a451e-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.InvalidCycleTime
             */
            public exception InvalidCycleTime extends Smp.Exception
            {
            }

            /**
             * This exception is thrown by the QueryEventId() method of the event manger when an empty event name has been provided.
             * 
             * @uuid 96e6f604-e943-11e9-a377-f3d7a7ed9a31
             * @id Smp.Services.InvalidEventName
             */
            public exception InvalidEventName extends Smp.Exception
            {
            }

            /**
             * This exception is thrown by one of the AddEvent() methods of the scheduler when the time specified for the first execution of the event is in the past.
             * 
             * @uuid d54a451c-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.InvalidEventTime
             */
            public exception InvalidEventTime extends Smp.Exception
            {
            }

            /**
             * This exception is thrown by SetSimulationTime if the new simulation time is not between the current simulation time and the simulation time of the next event on the scheduler.
             * 
             * @uuid b31f9aa2-cde0-11e6-a1c3-13e36fcced83
             * @id Smp.Services.InvalidSimulationTime
             */
            public exception InvalidSimulationTime extends Smp.Exception
            {
                /**
                 * Get the current simulation time maintained by the time keeper.
                 * 
                 * @return Current simulation time maintained by the time keeper.
                 * @id Smp.Services.InvalidSimulationTime.GetCurrentTime
                 */
                public def Smp.Duration GetCurrentTime ()

                /**
                 * Get the simulation time provided to SetSimulationTime.
                 * 
                 * @return Simulation time provided to SetSimulationTime.
                 * @id Smp.Services.InvalidSimulationTime.GetProvidedTime
                 */
                public def Smp.Duration GetProvidedTime ()

                /**
                 * Get the maximum simulation time that can be set using SetSimulationTime.
                 * 
                 * @return Maximum simulation time that can be set using SetSimulationTime.
                 * @id Smp.Services.InvalidSimulationTime.GetMaximumTime
                 */
                public def Smp.Duration GetMaximumTime ()
            }

            /**
             * This interface gives access to the Logger Service.
             * 
             * @uuid d5434051-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.ILogger
             */
            public interface ILogger extends Smp.IService
            {
                /**
                 * The message contains general information.
                 * 
                 * @id Smp.Services.ILogger.LMK_Information
                 */
                constant Smp.Services.LogMessageKind LMK_Information = 0L

                /**
                 * The message has been sent from an event, typically from a state transition.
                 * 
                 * @id Smp.Services.ILogger.LMK_Event
                 */
                constant Smp.Services.LogMessageKind LMK_Event = 1L

                /**
                 * The message contains a warning.
                 * 
                 * @id Smp.Services.ILogger.LMK_Warning
                 */
                constant Smp.Services.LogMessageKind LMK_Warning = 2L

                /**
                 * The message has been raised because of an error.
                 * 
                 * @id Smp.Services.ILogger.LMK_Error
                 */
                constant Smp.Services.LogMessageKind LMK_Error = 3L

                /**
                 * The message contains debug information.
                 * 
                 * @id Smp.Services.ILogger.LMK_Debug
                 */
                constant Smp.Services.LogMessageKind LMK_Debug = 4L

                /**
                 * The message contains general information.
                 * 
                 * @id Smp.Services.ILogger.LMK_InformationName
                 */
                constant Smp.String8 LMK_InformationName = "Information"

                /**
                 * The message contains debug information.
                 * 
                 * @id Smp.Services.ILogger.LMK_DebugName
                 */
                constant Smp.String8 LMK_DebugName = "Debug"

                /**
                 * The message has been raised because of an error.
                 * 
                 * @id Smp.Services.ILogger.LMK_ErrorName
                 */
                constant Smp.String8 LMK_ErrorName = "Error"

                /**
                 * The message contains a warning.
                 * 
                 * @id Smp.Services.ILogger.LMK_WarningName
                 */
                constant Smp.String8 LMK_WarningName = "Warning"

                /**
                 * The message has been sent from an event, typically from a state transition.
                 * 
                 * @id Smp.Services.ILogger.LMK_EventName
                 */
                constant Smp.String8 LMK_EventName = "Event"

                /**
                 * Name of the Logger service.
                 * 
                 * @id Smp.Services.ILogger.SMP_Logger
                 */
                constant Smp.String8 SMP_Logger = "Logger"

                /**
                 * Return identifier of log message kind by name.
                 * 
                 * @param messageKindName
                 *       Name of log message kind.
                 * @return Identifier of log message kind.
                 * @id Smp.Services.ILogger.QueryLogMessageKind
                 */
                def Smp.Services.LogMessageKind QueryLogMessageKind (Smp.String8 messageKindName)

                /**
                 * This function logs a message to the simulation log.
                 * 
                 * @param sender
                 *       Object that sends the message.
                 * @param message
                 *       The message to log.
                 * @param kind
                 *       Kind of message.
                 * @id Smp.Services.ILogger.Log
                 */
                def void Log (Smp.IObject sender, Smp.String8 message, Smp.Services.LogMessageKind kind = 0L)
            }

            /**
             * This type is used as identifier of a log message kind.
             * 
             * @uuid d543404f-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.LogMessageKind
             */
            public integer LogMessageKind extends Smp.Int32 in 0 ... 2147483647

            /**
             * This interface gives access to the Time Keeper Service.
             * 
             * @uuid d5458977-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.ITimeKeeper
             */
            public interface ITimeKeeper extends Smp.IService
            {
                /**
                 * Name of the TimeKeeper service.
                 * 
                 * @id Smp.Services.ITimeKeeper.SMP_TimeKeeper
                 */
                constant Smp.String8 SMP_TimeKeeper = "TimeKeeper"

                /**
                 * Return Simulation time.
                 * 
                 * @return Current simulation time.
                 * @id Smp.Services.ITimeKeeper.GetSimulationTime
                 */
                def Smp.Duration GetSimulationTime ()

                /**
                 * Return Epoch time.
                 * 
                 * @return Current epoch time.
                 * @id Smp.Services.ITimeKeeper.GetEpochTime
                 */
                def Smp.DateTime GetEpochTime ()

                /**
                 * Get mission start time.
                 * 
                 * @return Mission start date and time.
                 * @id Smp.Services.ITimeKeeper.GetMissionStartTime
                 */
                def Smp.DateTime missionStart GetMissionStartTime ()

                /**
                 * Return Mission time.
                 * 
                 * @return Current mission time.
                 * @id Smp.Services.ITimeKeeper.GetMissionTime
                 */
                def Smp.Duration GetMissionTime ()

                /**
                 * Return Zulu time.
                 * 
                 * @return Current Zulu time.
                 * @id Smp.Services.ITimeKeeper.GetZuluTime
                 */
                def Smp.DateTime GetZuluTime ()

                /**
                 * Manually advance Simulation time.
                 * 
                 * @param simulationTime
                 *       New value of simulation time to set in the Time Keeper. This has to be in the future.
                 * @id Smp.Services.ITimeKeeper.SetSimulationTime
                 */
                def void SetSimulationTime (Smp.Duration simulationTime) throws Smp.Services.InvalidSimulationTime

                /**
                 * Set Epoch time.
                 * 
                 * @param epochTime
                 *       New epoch time.
                 * @id Smp.Services.ITimeKeeper.SetEpochTime
                 */
                def void SetEpochTime (Smp.DateTime epochTime)

                /**
                 * Set Mission time by defining the mission start time.
                 * In future calls to GetMissionTime, the mission time is calculated using the formula MissionTime = EpochTime - missionStart.
                 * 
                 * @param missionStart
                 *       New mission start date and time.
                 * @id Smp.Services.ITimeKeeper.SetMissionStartTime
                 */
                def void SetMissionStartTime (Smp.DateTime missionStart)

                /**
                 * Set Mission time by providing the current mission time.
                 * This effectively sets the MissionStartTime using the formula MissionStartTime = EpochTime - missionTime.
                 * 
                 * @param missionTime
                 *       New mission time.
                 * @id Smp.Services.ITimeKeeper.SetMissionTime
                 */
                def void SetMissionTime (Smp.Duration missionTime)
            }

            /**
             * Enumeration of supported time kinds.
             * 
             * @uuid d54589a6-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.TimeKind
             */
            public enum TimeKind
            {
                /**
                 * Simulation time.
                 * 
                 * @id Smp.Services.TimeKind.TK_SimulationTime
                 */
                TK_SimulationTime = 0,
                /**
                 * Mission time.
                 * 
                 * @id Smp.Services.TimeKind.TK_MissionTime
                 */
                TK_MissionTime = 1,
                /**
                 * Epoch time.
                 * 
                 * @id Smp.Services.TimeKind.TK_EpochTime
                 */
                TK_EpochTime = 2,
                /**
                 * Zulu time.
                 * 
                 * @id Smp.Services.TimeKind.TK_ZuluTime
                 */
                TK_ZuluTime = 3
            }

            /**
             * This interface gives access to the Scheduler Service.
             * 
             * @uuid d54589b4-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.IScheduler
             */
            public interface IScheduler extends Smp.IService
            {
                /**
                 * Name of the Scheduler service.
                 * 
                 * @id Smp.Services.IScheduler.SMP_Scheduler
                 */
                constant Smp.String8 SMP_Scheduler = "Scheduler"

                /**
                 * Add an immediate event to the scheduler.
                 * 
                 * @param entryPoint
                 *       Entry point to call from event.
                 * @return Event identifier that can be used to change or remove event.
                 * @id Smp.Services.IScheduler.AddImmediateEvent
                 */
                def Smp.Services.EventId AddImmediateEvent (Smp.IEntryPoint entryPoint)

                /**
                 * Add event to scheduler that is called based on simulation time.
                 * 
                 * @param entryPoint
                 *       Entry point to call from event.
                 * @param simulationTime
                 *       Duration from now when to trigger the event for the first time.
                 *       This must not be a negative simulation time, as this would be in the past.
                 * @param cycleTime
                 *       Duration between two triggers of the event.
                 *       When repeat is not zero, this must be a positive duration.
                 * @param repeat
                 *       Number of times the event shall be repeated, or 0 for a single event, or -1 for no limit.
                 * @return Event identifier that can be used to change or remove event.
                 * @id Smp.Services.IScheduler.AddSimulationTimeEvent
                 */
                def Smp.Services.EventId AddSimulationTimeEvent (Smp.IEntryPoint entryPoint, Smp.Duration simulationTime,
                        Smp.Duration cycleTime = "PT0S",
                        Smp.Int64 repeat = 0L) throws Smp.Services.InvalidCycleTime, Smp.Services.InvalidEventTime

                /**
                 * Add event to scheduler that is called based on mission time.
                 * 
                 * @param entryPoint
                 *       Entry point to call from event.
                 * @param missionTime
                 *       Absolute mission time when to trigger the event for the first time.
                 *       This must not be a mission time in the past.
                 * @param cycleTime
                 *       Duration between two triggers of the event.
                 *       When repeat is not zero, this must be a positive duration.
                 * @param repeat
                 *       Number of times the event shall be repeated, or 0 for a single event, or -1 for no limit.
                 * @return Event identifier that can be used to change or remove event.
                 * @id Smp.Services.IScheduler.AddMissionTimeEvent
                 */
                def Smp.Services.EventId AddMissionTimeEvent (Smp.IEntryPoint entryPoint, Smp.Duration missionTime,
                        Smp.Duration cycleTime = "PT0S",
                        Smp.Int64 repeat = 0L) throws Smp.Services.InvalidCycleTime, Smp.Services.InvalidEventTime

                /**
                 * Add event to scheduler that is called based on epoch time.
                 * 
                 * @param entryPoint
                 *       Entry point to call from event.
                 * @param epochTime
                 *       Epoch time when to trigger the event for the first time.
                 *       This must not be an epoch time in the past.
                 * @param cycleTime
                 *       Duration between two triggers of the event.
                 *       When repeat is not zero, this must be a positive duration.
                 * @param repeat
                 *       Number of times the event shall be repeated, or 0 for a single event, or -1 for no limit.
                 * @return Event identifier that can be used to change or remove event.
                 * @id Smp.Services.IScheduler.AddEpochTimeEvent
                 */
                def Smp.Services.EventId AddEpochTimeEvent (Smp.IEntryPoint entryPoint, Smp.DateTime epochTime,
                        Smp.Duration cycleTime = "PT0S",
                        Smp.Int64 repeat = 0L) throws Smp.Services.InvalidCycleTime, Smp.Services.InvalidEventTime

                /**
                 * Add event to scheduler that is called based on Zulu time.
                 * 
                 * @param entryPoint
                 *       Entry point to call from event.
                 * @param zuluTime
                 *       Absolute (Zulu) time when to trigger the event for the first time.
                 *       This must not be a time in the past.
                 * @param cycleTime
                 *       Duration between two triggers of the event.
                 *       When repeat is not zero, this must be a positive duration.
                 * @param repeat
                 *       Number of times the event shall be repeated, or 0 for a single event, or -1 for no limit.
                 * @return Event identifier that can be used to change or remove event.
                 * @id Smp.Services.IScheduler.AddZuluTimeEvent
                 */
                def Smp.Services.EventId AddZuluTimeEvent (Smp.IEntryPoint entryPoint, Smp.DateTime zuluTime,
                        Smp.Duration cycleTime = "PT0S",
                        Smp.Int64 repeat = 0L) throws Smp.Services.InvalidCycleTime, Smp.Services.InvalidEventTime

                /**
                 * Update when an existing simulation time event on the scheduler shall be triggered.
                 * 
                 * @param event
                 *       Identifier of event to modify.
                 * @param simulationTime
                 *       Duration from now when to trigger event.
                 *       If the simulation time is negative, the event will never be executed but instead be removed immediately from the scheduler.
                 * @id Smp.Services.IScheduler.SetEventSimulationTime
                 */
                def void SetEventSimulationTime (Smp.Services.EventId event,
                        Smp.Duration simulationTime) throws Smp.Services.InvalidEventId

                /**
                 * Update when an existing mission time event on the scheduler shall be triggered.
                 * 
                 * @param event
                 *       Identifier of event to modify.
                 * @param missionTime
                 *       Absolute mission time when to trigger event.
                 *       If the mission time is before the current mission time, the event will never be executed but instead be removed immediately from the scheduler.
                 * @id Smp.Services.IScheduler.SetEventMissionTime
                 */
                def void SetEventMissionTime (Smp.Services.EventId event,
                        Smp.Duration missionTime) throws Smp.Services.InvalidEventId

                /**
                 * Update when an existing epoch time event on the scheduler (an event that has been registered using AddEpochTimeEvent()) shall be triggered.
                 * 
                 * @param event
                 *       Identifier of event to modify.
                 * @param epochTime
                 *       Epoch time when to trigger event.
                 *       If the epoch time is before the current epoch time, the event will never be executed but instead be removed immediately from the scheduler.
                 * @id Smp.Services.IScheduler.SetEventEpochTime
                 */
                def void SetEventEpochTime (Smp.Services.EventId event,
                        Smp.DateTime epochTime) throws Smp.Services.InvalidEventId

                /**
                 * Update when an existing zulu time event on the scheduler shall be triggered.
                 * 
                 * @param event
                 *       Identifier of event to modify.
                 * @param zuluTime
                 *       Absolute (Zulu) time when to trigger event.
                 *       If the zulu time is before the current zulu time, the event will never be executed but instead be removed immediately from the scheduler.
                 * @id Smp.Services.IScheduler.SetEventZuluTime
                 */
                def void SetEventZuluTime (Smp.Services.EventId event,
                        Smp.DateTime zuluTime) throws Smp.Services.InvalidEventId

                /**
                 * Update cycle time of an existing event on the scheduler.
                 * 
                 * @param event
                 *       Identifier of event to modify.
                 * @param cycleTime
                 *       Duration between two triggers of the event.
                 *       For a cyclic event, this needs to be a positive duration. Otherwise, an exception of type InvalidCycleTime is thrown.
                 * @id Smp.Services.IScheduler.SetEventCycleTime
                 */
                def void SetEventCycleTime (Smp.Services.EventId event,
                        Smp.Duration cycleTime) throws Smp.Services.InvalidEventId, Smp.Services.InvalidCycleTime

                /**
                 * Update the repeat counter of an existing event on the scheduler.
                 * 
                 * @param event
                 *       Identifier of event to modify.
                 * @param repeat
                 *       Number of times the event shall be repeated, or 0 for a single event, or -1 for no limit.
                 *       An event with a repeat different from 0 is called cyclic. For such an event, a positive cycle time has to be defined before. Otherwise, an exception of type InvalidCycleTime is thrown.
                 * @id Smp.Services.IScheduler.SetEventRepeat
                 */
                def void SetEventRepeat (Smp.Services.EventId event, Smp.Int64 repeat) throws Smp.Services.InvalidEventId

                /**
                 * Remove an event from the scheduler.
                 * 
                 * @param event
                 *       Event identifier of the event to remove.
                 * @id Smp.Services.IScheduler.RemoveEvent
                 */
                def void RemoveEvent (Smp.Services.EventId event) throws Smp.Services.InvalidEventId

                /**
                 * Return the ID of the event currently executed by the scheduler. If not event is executed, this function returns -1.
                 * 
                 * @return Event Id or -1 if no event is being executed.
                 * @id Smp.Services.IScheduler.GetCurrentEventId
                 */
                def Smp.Services.EventId GetCurrentEventId ()

                /**
                 * Get the time of next scheduled Event.
                 * 
                 * @return Time of the next event on the scheduler.
                 * @id Smp.Services.IScheduler.GetNextScheduledEventTime
                 */
                def Smp.Duration GetNextScheduledEventTime ()
            }

            /**
             * Identifier of global event of scheduler or event manager service.
             * 
             * @uuid d54589a4-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.EventId
             */
            public integer EventId extends Smp.Int64

            /**
             * This exception is raised when an invalid event id is provided, e.g. when calling Subscribe(), Unsubscribe() or Emit() of the Event Manager (using an invalid global event id), or when calling SetEventSimulationTime(), SetEventMissionTime(), SetEventEpochTime(), SetEventZuluTime(), SetEventCycleTime(), SetEventCount() or RemoveEvent() of the Scheduler (using an invalid scheduler event id).
             * 
             * @uuid d54f26d2-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.InvalidEventId
             */
            public exception InvalidEventId extends Smp.Exception
            {
                /**
                 * Get the invalid event identifier.
                 * 
                 * @return Invalid event identifier.
                 * @id Smp.Services.InvalidEventId.GetInvalidEventId
                 */
                public def Smp.Services.EventId GetInvalidEventId ()
            }

            /**
             * This interface is implemented by the Event Manager Service.
             * 
             * @uuid d54a4520-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.IEventManager
             */
            public interface IEventManager extends Smp.IService
            {
                /**
                 * Name of the EventManager service.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EventManager
                 */
                constant Smp.String8 SMP_EventManager = "EventManager"

                /**
                 * This event is raised when leaving the Connecting state with an automatic state transition to Initializing state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveConnectingId
                 */
                constant Smp.Services.EventId SMP_LeaveConnectingId = 1L

                /**
                 * Leave Connecting state.
                 * When leaving the Connecting state with an automatic state transition to Initializing state
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveConnecting
                 */
                constant Smp.String8 SMP_LeaveConnecting = "SMP_LeaveConnecting"

                /**
                 * This event is raised when entering the Initialising state with an automatic state transition from Connecting state, or with the Initialise() state transition.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterInitialisingId
                 */
                constant Smp.Services.EventId SMP_EnterInitialisingId = 2L

                /**
                 * Enter Initialising state.
                 * When entering the Initialising state with an automatic state transition from Connecting state, or with the Initialise() state transition.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterInitialising
                 */
                constant Smp.String8 SMP_EnterInitialising = "SMP_EnterInitialising"

                /**
                 * This event is raised when leaving the Initialising state with an automatic state transition to Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveInitialisingId
                 */
                constant Smp.Services.EventId SMP_LeaveInitialisingId = 3L

                /**
                 * Leave Initialising state.
                 * When leaving the Initialising state with an automatic state transition to Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveInitialising
                 */
                constant Smp.String8 SMP_LeaveInitialising = "SMP_LeaveInitialising"

                /**
                 * This event is raised when entering the Standby state with an automatic state transition from Initialising, Storing or Restoring state, or with the Hold() state transition command from Executing state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterStandbyId
                 */
                constant Smp.Services.EventId SMP_EnterStandbyId = 4L

                /**
                 * Enter Standby state.
                 * When entering the Standby state with an automatic state transition from Initialising, Storing or Restoring state, or the Hold() state transition command from Executing state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterStandby
                 */
                constant Smp.String8 SMP_EnterStandby = "SMP_EnterStandby"

                /**
                 * This event is raised when leaving the Standby state with the Run() state transition command to Executing state, with the Store() state transition command to Storing state, with the Restore() state transition command to Restoring state, or with the Initialise() state transition command to Initialising state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveStandbyId
                 */
                constant Smp.Services.EventId SMP_LeaveStandbyId = 5L

                /**
                 * Leave Standby state.
                 * When leaving the Standby state with
                 * <ul>
                 * <li>the Run() state transition command to Executing state,
                 * <li>the Store() state transition command to Storing state,
                 * <li>the Restore() state transition command to Restoring state,
                 * <li>the Initialise() state transition command to Initialising state.
                 * </ul>
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveStandby
                 */
                constant Smp.String8 SMP_LeaveStandby = "SMP_LeaveStandby"

                /**
                 * This event is raised when entering the Executing state with the Run() state transition command from Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterExecutingId
                 */
                constant Smp.Services.EventId SMP_EnterExecutingId = 6L

                /**
                 * Enter Executing state.
                 * When entering the Executing state with the Run() state transition command from Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterExecuting
                 */
                constant Smp.String8 SMP_EnterExecuting = "SMP_EnterExecuting"

                /**
                 * This event is raised when leaving the Executing state with the Hold() state transition command to Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveExecutingId
                 */
                constant Smp.Services.EventId SMP_LeaveExecutingId = 7L

                /**
                 * Leave Executing state.
                 * When leaving the Executing state with the Hold() state transition command to Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveExecuting
                 */
                constant Smp.String8 SMP_LeaveExecuting = "SMP_LeaveExecuting"

                /**
                 * This event is raised when entering the Storing state with the Store() state transition command from Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterStoringId
                 */
                constant Smp.Services.EventId SMP_EnterStoringId = 8L

                /**
                 * Enter Storing state.
                 * When entering the Storing state with the Store() state transition command from Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterStoring
                 */
                constant Smp.String8 SMP_EnterStoring = "SMP_EnterStoring"

                /**
                 * This event is raised when leaving the Storing state with an automatic state transition to Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveStoringId
                 */
                constant Smp.Services.EventId SMP_LeaveStoringId = 9L

                /**
                 * Leave Storing state.
                 * When leaving the Storing state with an automatic state transition to Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveStoring
                 */
                constant Smp.String8 SMP_LeaveStoring = "SMP_LeaveStoring"

                /**
                 * This event is raised when entering the Restoring state with the Restore() state transition command from Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterRestoringId
                 */
                constant Smp.Services.EventId SMP_EnterRestoringId = 10L

                /**
                 * Enter Restoring state.
                 * When entering the Restoring state with the Restore() state transition command from Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterRestoring
                 */
                constant Smp.String8 SMP_EnterRestoring = "SMP_EnterRestoring"

                /**
                 * This event is raised when leaving the Restoring state with an automatic state transition to Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveRestoringId
                 */
                constant Smp.Services.EventId SMP_LeaveRestoringId = 11L

                /**
                 * Leave Restoring state.
                 * When leaving the Restoring state with an automatic state transition to Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveRestoring
                 */
                constant Smp.String8 SMP_LeaveRestoring = "SMP_LeaveRestoring"

                /**
                 * This event is raised when entering the Exiting state with the Exit() state transition command from Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterExitingId
                 */
                constant Smp.Services.EventId SMP_EnterExitingId = 12L

                /**
                 * Enter Exiting state.
                 * When entering the Exiting state with the Exit() state transition command from Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterExiting
                 */
                constant Smp.String8 SMP_EnterExiting = "SMP_EnterExiting"

                /**
                 * This event is raised when entering the Aborting state with the Abort() state transition command from any other state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterAbortingId
                 */
                constant Smp.Services.EventId SMP_EnterAbortingId = 13L

                /**
                 * Enter Aborting state.
                 * When entering the Aborting state with the Abort() state transition command from any other state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterAborting
                 */
                constant Smp.String8 SMP_EnterAborting = "SMP_EnterAborting"

                /**
                 * This event is raised when changing the epoch time with the SetEpochTime() method of the time keeper service.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EpochTimeChangedId
                 */
                constant Smp.Services.EventId SMP_EpochTimeChangedId = 14L

                /**
                 * Epoch Time has changed.
                 * When changing the epoch time with the SetEpochTime() method of the time keeper service.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EpochTimeChanged
                 */
                constant Smp.String8 SMP_EpochTimeChanged = "SMP_EpochTimeChanged"

                /**
                 * This event is raised when changing the mission time with one of the SetMissionTime() and SetMissionStart() methods of the time keeper service.
                 * 
                 * @id Smp.Services.IEventManager.SMP_MissionTimeChangedId
                 */
                constant Smp.Services.EventId SMP_MissionTimeChangedId = 15L

                /**
                 * Mission time has changed.
                 * When changing the mission time with one of the SetMissionTime() and SetMissionStartTime() methods of the time keeper service.
                 * 
                 * @id Smp.Services.IEventManager.SMP_MissionTimeChanged
                 */
                constant Smp.String8 SMP_MissionTimeChanged = "SMP_MissionTimeChanged"

                /**
                 * This event is raised when entering the Reconnecting state with the Reconnect() state transition from Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterReconnectingId
                 */
                constant Smp.Services.EventId SMP_EnterReconnectingId = 16L

                /**
                 * Enter Reconnecting state.
                 * When entering the Reconnecting state with the Reconnect() state transition from Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_EnterReconnecting
                 */
                constant Smp.String8 SMP_EnterReconnecting = "SMP_EnterReconnecting"

                /**
                 * This event is raised when leaving the Reconnecting state with an automatic state transition to Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveReconnectingId
                 */
                constant Smp.Services.EventId SMP_LeaveReconnectingId = 17L

                /**
                 * Leave Reconnecting state.
                 * When leaving the Reconnecting state with an automatic state transition to Standby state.
                 * 
                 * @id Smp.Services.IEventManager.SMP_LeaveReconnecting
                 */
                constant Smp.String8 SMP_LeaveReconnecting = "SMP_LeaveReconnecting"

                /**
                 * This event is raised before the Time Keeper updates the Simulation Time.
                 * 
                 * @id Smp.Services.IEventManager.SMP_PreSimTimeChangeId
                 */
                constant Smp.Services.EventId SMP_PreSimTimeChangeId = 18L

                /**
                 * Before changing the Simulation Time.
                 * When all events have been executed by the Scheduler for a specific Simulation Time, but before the TimeKeeper changes the Simulation time to the time of next event.
                 * 
                 * @id Smp.Services.IEventManager.SMP_PreSimTimeChange
                 */
                constant Smp.String8 SMP_PreSimTimeChange = "SMP_PreSimTimeChange"

                /**
                 * This event is raised after the simulation time has been changed by the Time Keeper, but before an event has been executed by the Scheduler.
                 * 
                 * @id Smp.Services.IEventManager.SMP_PostSimTimeChangeId
                 */
                constant Smp.Services.EventId SMP_PostSimTimeChangeId = 19L

                /**
                 * After changing the Simulation Time.
                 * When the simulation time has been changed by the Time Keeper, but before any events have been executed by the Scheduler.
                 * 
                 * @id Smp.Services.IEventManager.SMP_PostSimTimeChange
                 */
                constant Smp.String8 SMP_PostSimTimeChange = "SMP_PostSimTimeChange"

                /**
                 * Get unique event identifier for an event name.
                 * 
                 * @param eventName
                 *       Name of the global event.
                 * @return Event identifier for global event with given name.
                 * @id Smp.Services.IEventManager.QueryEventId
                 */
                def Smp.Services.EventId QueryEventId (Smp.String8 eventName) throws Smp.Services.InvalidEventName

                /**
                 * Subscribe entry point to a global event.
                 * 
                 * @param event
                 *       Event identifier of global event to subscribe to.
                 * @param entryPoint
                 *       Entry point to subscribe to global event.
                 * @id Smp.Services.IEventManager.Subscribe
                 */
                def void Subscribe (Smp.Services.EventId event,
                        Smp.IEntryPoint entryPoint) throws Smp.Services.InvalidEventId, Smp.Services.EntryPointAlreadySubscribed

                /**
                 * Unsubscribe entry point from a global event.
                 * 
                 * @param event
                 *       Event identifier of global event to unsubscribe from.
                 * @param entryPoint
                 *       Entry point to unsubscribe from global event.
                 * @id Smp.Services.IEventManager.Unsubscribe
                 */
                def void Unsubscribe (Smp.Services.EventId event,
                        Smp.IEntryPoint entryPoint) throws Smp.Services.InvalidEventId, Smp.Services.EntryPointNotSubscribed

                /**
                 * Emit a global event.
                 * 
                 * @param event
                 *       Event identifier of global event to emit.
                 * @param synchronous
                 *       Flag whether to emit the given event synchronously (the default) or asynchronously.
                 * @id Smp.Services.IEventManager.Emit
                 */
                def void Emit (Smp.Services.EventId event, Smp.Bool synchronous = true) throws Smp.Services.InvalidEventId
            }

            /**
             * This interface gives access to the Resolver Service.
             * 
             * @uuid d54f26bd-e618-11dc-ab64-bf8df6d7b83a
             * @id Smp.Services.IResolver
             */
            public interface IResolver extends Smp.IService
            {
                /**
                 * Name of the Resolver service.
                 * 
                 * @id Smp.Services.IResolver.SMP_Resolver
                 */
                constant Smp.String8 SMP_Resolver = "Resolver"

                /**
                 * Resolve reference to an object via absolute path.
                 * 
                 * @param absolutePath
                 *       Absolute path to object in simulation.
                 * @return Object identified by path, or null if no object with the given path could be found.
                 * @id Smp.Services.IResolver.ResolveAbsolute
                 */
                def Smp.IObject ResolveAbsolute (Smp.String8 absolutePath)

                /**
                 * Resolve reference to an object via relative path.
                 * 
                 * @param relativePath
                 *       Relative path to object in simulation.
                 * @param sender
                 *       Component that asks for resolving the reference.
                 * @return Component identified by path, or null if no component with the given path could be found.
                 * @id Smp.Services.IResolver.ResolveRelative
                 */
                def Smp.IObject ResolveRelative (Smp.String8 relativePath, Smp.IComponent sender)
            }
        } // namespace Services

        /**
         * 8 bit character
         * 
         * @uuid 00000000-0000-0000-2020-204368617238
         * @id Smp.Char8
         */
        public primitive Char8

        /**
         * 8 bit character string
         * 
         * @uuid 00000000-0000-0000-2053-7472696e6738
         * @id Smp.String8
         */
        public primitive String8

        /**
         * 32 bit single-precision float
         * 
         * @uuid 00000000-0000-0000-2046-6c6f61723332
         * @id Smp.Float32
         */
        public primitive Float32

        /**
         * 64 bit double-precision float
         * 
         * @uuid 00000000-0000-0000-2046-6c6f61723634
         * @id Smp.Float64
         */
        public primitive Float64

        /**
         * 8 bit   signed integer
         * 
         * @uuid 00000000-0000-0000-2020-2020496e7238
         * @id Smp.Int8
         */
        public primitive Int8

        /**
         * 8 bit unsigned integer
         * 
         * @uuid 00000000-0000-0000-2020-2055496e7238
         * @id Smp.UInt8
         */
        public primitive UInt8

        /**
         * 16 bit   signed integer
         * 
         * @uuid 00000000-0000-0000-2020-20496e723136
         * @id Smp.Int16
         */
        public primitive Int16

        /**
         * 16 bit unsigned integer
         * 
         * @uuid 00000000-0000-0000-2020-55496e723136
         * @id Smp.UInt16
         */
        public primitive UInt16

        /**
         * 32 bit   signed integer
         * 
         * @uuid 00000000-0000-0000-2020-20496e723332
         * @id Smp.Int32
         */
        public primitive Int32

        /**
         * 32 bit unsigned integer
         * 
         * @uuid 00000000-0000-0000-2020-55496e723332
         * @id Smp.UInt32
         */
        public primitive UInt32

        /**
         * 64 bit   signed integer
         * 
         * @uuid 00000000-0000-0000-2020-20496e723634
         * @id Smp.Int64
         */
        public primitive Int64

        /**
         * 64 bit unsigned integer
         * 
         * @uuid 00000000-0000-0000-2020-55496e723634
         * @id Smp.UInt64
         */
        public primitive UInt64

        /**
         * boolean with true or false
         * 
         * @uuid 00000000-0000-0000-2020-2020426f6f6c
         * @id Smp.Bool
         */
        public primitive Bool

        /**
         * point in time in nanoseconds
         * relative to MJD 2000+0.5
         * 
         * @uuid 00000000-0000-0000-4461-746554696d65
         * @id Smp.DateTime
         */
        public primitive DateTime

        /**
         * duration in nanoseconds
         * 
         * @uuid 00000000-0000-0000-4475-726174696f6e
         * @id Smp.Duration
         */
        public primitive Duration

        /**
         * Interface for a collection.
         * A collection allows querying for the contained elements.
         * A collection must enforce uniqueness of the names of the contained elements.
         * Elements in the collection can be queried by name and by position.
         * The query by position must always return the elements based on order of insertion.
         * 
         * @uuid 89e86764-b214-11e9-9160-512f4ecdaa5f
         * @id Smp.ICollection
         */
        public interface ICollection extends Smp.IObject
        {
        }

        /**
         * This interface is implemented by a Field that can take part in direct inter-component data flow.
         * 
         * @uuid 9b7c7c8f-cc52-11e6-a1c3-13e36fcced83
         * @id Smp.IDataflowField
         */
        public interface IDataflowField extends Smp.IField
        {
            /**
             * Connect this field to a target field for direct data flow.
             * As the Push() operation only requires to set a value, the target field can be any field (it does not need to be of type IDataflowField).
             * 
             * @param target
             *       Target field to connect to. The field type must be compatible.
             * @id Smp.IDataflowField.Connect
             */
            def void Connect (inout Smp.IField target) throws Smp.InvalidTarget, Smp.FieldAlreadyConnected

            /**
             * Push the current field value to all connected target fields.
             * 
             * @id Smp.IDataflowField.Push
             */
            def void Push ()
        }

        /**
         * Interface for a failure.
         * 
         * @uuid d572db2e-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IFailure
         */
        public interface IFailure extends Smp.IPersist
        {
            /**
             * Sets the state of the failure to failed.
             * 
             * @id Smp.IFailure.Fail
             */
            def void Fail ()

            /**
             * Sets the state of the failure to unfailed.
             * 
             * @id Smp.IFailure.Unfail
             */
            def void Unfail ()

            /**
             * Returns whether the failure's state is set to failed.
             * 
             * @return Returns true if the failure state is Failed, false otherwise.
             * @id Smp.IFailure.IsFailed
             */
            @Attributes.Const
            def Smp.Bool IsFailed ()
        }

        /**
         * Interface for a fallible model that exposes its failure state and a collection of failures.
         * 
         * @uuid d572db1a-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IFallibleModel
         */
        public interface IFallibleModel extends Smp.IModel
        {
            /**
             * Query for whether the model is failed. A model is failed when at least one of its failures is failed.
             * 
             * @return Whether the model is failed or not.
             * @id Smp.IFallibleModel.IsFailed
             */
            @Attributes.Const
            def Smp.Bool IsFailed ()

            /**
             * Query for the collection of all failures.
             * 
             * @return Failure collection of the model.
             * @id Smp.IFallibleModel.GetFailures
             */
            @Attributes.Const
            def @Attributes.Const Smp.FailureCollection GetFailures ()

            /**
             * Get a failure by name.
             * 
             * @param name
             *       Name of the failure to return.
             * @return Failure queried for by name, or null if no failure with this name exists.
             * @id Smp.IFallibleModel.GetFailure
             */
            @Attributes.Const
            def Smp.IFailure GetFailure (Smp.String8 name)
        }

        /**
         * Interface for a component which can hold links to other components.
         * 
         * @uuid d5752575-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.ILinkingComponent
         */
        public interface ILinkingComponent extends Smp.IComponent
        {
            /**
             * Asks a component to remove all its links to the given target component.
             * After this method has been called, the component must not try to access the given target component anymore.
             * 
             * @param target
             *       Target component to which all links shall be removed.
             * @id Smp.ILinkingComponent.RemoveLinks
             */
            def void RemoveLinks (@Attributes.Const Smp.IComponent target)
        }

        /**
         * This interface describes a published operation.
         * 
         * @uuid 0dedc888-cc39-11e9-abb3-9f6a2356f7e2
         * @id Smp.IOperation
         */
        public interface IOperation extends Smp.IObject
        {
            /**
             * Provides the collection of parameters that will end-up in the request object of CreateRequest(), i.e. all parameter that are not of direction return. This collection is ordered the same way as the parameters in the request object, and may be empty.
             * The optional return parameter is returned via GetReturnParameter.
             * 
             * @return Collection of parameters, in the same order as in the request object created by CreateRequest().
             * @id Smp.IOperation.GetParameters
             */
            @Attributes.Const
            def @Attributes.Const Smp.ParameterCollection GetParameters ()

            /**
             * Return a parameter by name. This works both for parameters in the collection of GetParameters(), and for the optional return parameter.
             * 
             * @param name
             *       Parameter name.
             * @return Parameter object, or null if no parameter with the given name exists.
             * @id Smp.IOperation.GetParameter
             */
            @Attributes.Const
            def Smp.IParameter GetParameter (Smp.String8 name)

            /**
             * This operation returns the return parameter, or nullptr if no return parameter exists (for a void operation).
             * 
             * @return The return parameter of the operation, or nullptr for a void operation.
             * @id Smp.IOperation.GetReturnParameter
             */
            @Attributes.Const
            def Smp.IParameter GetReturnParameter ()

            /**
             * Provides the view kind of the operation.
             * 
             * @return View kind of the operation.
             * @id Smp.IOperation.GetView
             */
            @Attributes.Const
            def Smp.ViewKind GetView ()

            /**
             * Return a request object for the operation that describes the parameters and the return value.
             * 
             * @return Request object for operation, or null if the operation does not support dynamic invocation.
             * @id Smp.IOperation.CreateRequest
             */
            def Smp.IRequest CreateRequest ()

            /**
             * Dynamically invoke the operation using a request object that has been created and filled with parameter values by the caller.
             * 
             * @param request
             *       Request object to invoke.
             * @id Smp.IOperation.Invoke
             */
            def void Invoke (
                    inout Smp.IRequest request) throws Smp.InvalidParameterCount, Smp.InvalidOperationName, Smp.InvalidParameterType

            /**
             * Destroy a request object that has been created with the CreateRequest() method before.
             * 
             * @param request
             *       Request object to destroy.
             * @id Smp.IOperation.DeleteRequest
             */
            def void DeleteRequest (inout Smp.IRequest request)
        }

        /**
         * This interface describes a parameter of a published operation.
         * 
         * @uuid 0dedc8a7-cc39-11e9-abb3-9f6a2356f7e2
         * @id Smp.IParameter
         */
        public interface IParameter extends Smp.IObject
        {
            /**
             * Provides the type of the parameter.
             * 
             * @return Type of the parameter.
             * @id Smp.IParameter.GetType
             */
            @Attributes.Const
            def Smp.Publication.IType GetType ()

            /**
             * Provides the parameter direction kind of the parameter.
             * 
             * @return Parameter direction kind of the parameter.
             * @id Smp.IParameter.GetDirection
             */
            @Attributes.Const
            def Smp.Publication.ParameterDirectionKind GetDirection ()
        }

        /**
         * This interface describes a published property.
         * 
         * @uuid 0dedc891-cc39-11e9-abb3-9f6a2356f7e2
         * @id Smp.IProperty
         */
        public interface IProperty extends Smp.IObject
        {
            /**
             * Provides the type of the property.
             * 
             * @return Type of the property.
             * @id Smp.IProperty.GetType
             */
            @Attributes.Const
            def Smp.Publication.IType GetType ()

            /**
             * Provides the access kind of the property.
             * 
             * @return Access kind of the property.
             * @id Smp.IProperty.GetAccess
             */
            @Attributes.Const
            def Smp.AccessKind GetAccess ()

            /**
             * Provides the view kind of the property.
             * 
             * @return View kind of the property.
             * @id Smp.IProperty.GetView
             */
            @Attributes.Const
            def Smp.ViewKind GetView ()

            /**
             * Provides the value of the property.
             * Throws InvalidAccess if the property is Write Only.
             * 
             * @return The current value of the property.
             * @id Smp.IProperty.GetValue
             */
            @Attributes.Const
            def Smp.AnySimple GetValue ()

            /**
             * Sets the value of the property.
             * Throws InvalidAccess if the property is Read Only.
             * 
             * @param value
             *       New value of the property.
             * @id Smp.IProperty.SetValue
             */
            def void SetValue (Smp.AnySimple value)
        }

        /**
         * Interface to an array where each array item is of a simple type.
         * 
         * @uuid b0b7564c-40ba-11e8-b859-115ced83748f
         * @id Smp.ISimpleArrayField
         */
        public interface ISimpleArrayField extends Smp.IField
        {
            /**
             * Get the size (number of array items) of the field.
             * 
             * @return Size (number of array items) of the field.
             * @id Smp.ISimpleArrayField.GetSize
             */
            @Attributes.Const
            def Smp.UInt64 GetSize ()

            /**
             * Get a value from a specific index of the array field.
             * 
             * @param index
             *       Index of value to get.
             * @return Value from given index.
             * @id Smp.ISimpleArrayField.GetValue
             */
            @Attributes.Const
            def Smp.AnySimple GetValue (Smp.UInt64 index) throws Smp.InvalidArrayIndex

            /**
             * Set a value at given index of the array field.
             * 
             * @param index
             *       Index of value to set.
             * @param value
             *       Value to set at given index.
             * @id Smp.ISimpleArrayField.SetValue
             */
            def void SetValue (Smp.UInt64 index,
                    @Attributes.ByReference Smp.AnySimple value) throws Smp.InvalidFieldValue, Smp.InvalidArrayIndex

            /**
             * Get all values of the array field.
             * 
             * @param length
             *       Size of given values array.
             * @param values
             *       Pre-allocated array of values to store result to.
             * @id Smp.ISimpleArrayField.GetValues
             */
            @Attributes.Const
            def void GetValues (Smp.UInt64 length, inout Smp.AnySimpleArray values) throws Smp.InvalidArraySize

            /**
             * Set all values of the array field.
             * 
             * @param length
             *       Size of given values array.
             * @param values
             *       Array of values to store in array field.
             * @id Smp.ISimpleArrayField.SetValues
             */
            def void SetValues (Smp.UInt64 length,
                    Smp.AnySimpleArray values) throws Smp.InvalidArraySize, Smp.InvalidArrayValue
        }

        /**
         * Interface of a structure field.
         * 
         * @uuid 9b7c7cae-cc52-11e6-a1c3-13e36fcced83
         * @id Smp.IStructureField
         */
        public interface IStructureField extends Smp.IField
        {
            /**
             * Return the collection of fields of the structure.
             * 
             * @return Collection of fields of the structure.
             * @id Smp.IStructureField.GetFields
             */
            @Attributes.Const
            def @Attributes.Const Smp.FieldCollection GetFields ()

            /**
             * Return a field by name.
             * 
             * @param name
             *       Name of the field to retrieve.
             * @return Field object, or null if no field with the given name exists.
             * @id Smp.IStructureField.GetField
             */
            @Attributes.Const
            def Smp.IField GetField (Smp.String8 name)
        }

        /**
         * This exception is thrown when trying to delete a component from a container when the number of contained components is lower than or equal to the Lower limit.
         * 
         * @uuid 0dedc8c1-cc39-11e9-abb3-9f6a2356f7e2
         * @id Smp.CannotDelete
         */
        public exception CannotDelete extends Smp.Exception
        {
            /**
             * Get the name of the container.
             * 
             * @return Name of the container.
             * @id Smp.CannotDelete.GetContainerName
             */
            public def Smp.String8 GetContainerName ()

            /**
             * Get the Component that could not be deleted.
             * 
             * @return Component that could not be deleted.
             * @id Smp.CannotDelete.GetComponent
             */
            public def @Attributes.Const Smp.IComponent GetComponent ()

            /**
             * Get the lower limit of the container.
             * 
             * @return Lower limit of the container.
             * @id Smp.CannotDelete.GetLowerLimit
             */
            public def Smp.Int64 GetLowerLimit ()
        }

        /**
         * This exception is thrown when trying to remove a component from a reference when the number of referenced components is lower than or equal to the Lower limit.
         * 
         * @uuid d53e5dda-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.CannotRemove
         */
        public exception CannotRemove extends Smp.Exception
        {
            /**
             * Get the name of the reference.
             * 
             * @return Name of the reference.
             * @id Smp.CannotRemove.GetReferenceName
             */
            public def Smp.String8 GetReferenceName ()

            /**
             * Get the Component that could not be removed.
             * 
             * @return Component that could not be removed.
             * @id Smp.CannotRemove.GetComponent
             */
            public def @Attributes.Const Smp.IComponent GetComponent ()

            /**
             * Get the lower limit of the reference.
             * 
             * @return Lower limit of the reference.
             * @id Smp.CannotRemove.GetLowerLimit
             */
            public def Smp.Int64 GetLowerLimit ()
        }

        /**
         * This exception is raised when the content of the storage reader passed to the Restore() method contains invalid data.
         * 
         * @uuid d55fc866-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.CannotRestore
         */
        public exception CannotRestore extends Smp.Exception
        {
        }

        /**
         * This exception is raised when the component cannot store its data to the storage writer given to the Store() method.
         * 
         * @uuid d55fc86c-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.CannotStore
         */
        public exception CannotStore extends Smp.Exception
        {
        }

        /**
         * This exception is raised when trying to register a factory under a Uuid that has already been used to register another (or the same) factory.This would lead to duplicate implementation Uuids.
         * 
         * @uuid d540cf46-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.DuplicateUuid
         */
        public exception DuplicateUuid extends Smp.Exception
        {
            /**
             * Get the name of factory that tried to register under this Uuid.
             * 
             * @return Name of factory that tried to register under this Uuid.
             * @id Smp.DuplicateUuid.GetOldName
             */
            public def Smp.String8 GetOldName ()

            /**
             * Get the name of factory that tried to register under this Uuid.
             * 
             * @return Name of factory that tried to register under this Uuid.
             * @id Smp.DuplicateUuid.GetNewName
             */
            public def Smp.String8 GetNewName ()
        }

        /**
         * This exception is raised when trying to subscribe an event sink to an event source that is already subscribed.
         * 
         * @uuid d55d57ad-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.EventSinkAlreadySubscribed
         */
        public exception EventSinkAlreadySubscribed extends Smp.Exception
        {
            /**
             * Returns the event sink that the event source has already been subscribed to.
             * 
             * @return Event sink that the event source has already been subscribed to.
             * @id Smp.EventSinkAlreadySubscribed.GetEventSink
             */
            public def @Attributes.Const Smp.IEventSink GetEventSink ()

            /**
             * Returns the event source that is already subscribed to the event sink.
             * 
             * @return Event source that is already subscribed to the event sink.
             * @id Smp.EventSinkAlreadySubscribed.GetEventSource
             */
            public def @Attributes.Const Smp.IEventSource GetEventSource ()
        }

        /**
         * This exception is raised when trying to unsubscribe an event sink from an event source that is not subscribed to it.
         * 
         * @uuid d55d57b4-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.EventSinkNotSubscribed
         */
        public exception EventSinkNotSubscribed extends Smp.Exception
        {
            /**
             * Returns the event source that is not subscribed to the event sink.
             * 
             * @return Event source that is not subscribed to the event sink.
             * @id Smp.EventSinkNotSubscribed.GetEventSource
             */
            public def @Attributes.Const Smp.IEventSource GetEventSource ()

            /**
             * Returns the event sink that the event source has not been subscribed to.
             * 
             * @return Event sink that the event source has not been subscribed to.
             * @id Smp.EventSinkNotSubscribed.GetEventSink
             */
            public def @Attributes.Const Smp.IEventSink GetEventSink ()
        }

        /**
         * This exception is raised when trying to connect a target field to a data flow field that is already connected.
         * 
         * @uuid 9b7c7c9d-cc52-11e6-a1c3-13e36fcced83
         * @id Smp.FieldAlreadyConnected
         */
        public exception FieldAlreadyConnected extends Smp.Exception
        {
            /**
             * Get the field for which the Connect operation was called.
             * 
             * @return Field for which the Connect operation was called
             * @id Smp.FieldAlreadyConnected.GetSource
             */
            public def @Attributes.Const Smp.IDataflowField GetSource ()

            /**
             * Get the target field that was passed to the Connect operation.
             * 
             * @return Target field that was passed to the Connect operation.
             * @id Smp.FieldAlreadyConnected.GetTarget
             */
            public def @Attributes.Const Smp.IField GetTarget ()
        }

        /**
         * This exception is raised when an invalid index is specified.
         * 
         * @uuid d5779719-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidArrayIndex
         */
        public exception InvalidArrayIndex extends Smp.Exception
        {
            /**
             * Get the invalid array index, i.e. the index that was passed as argument, but is outside of the array.
             * 
             * @return Invalid array index, i.e. the index that was passed as argument, but is outside of the array.
             * @id Smp.InvalidArrayIndex.GetInvalidIndex
             */
            public def Smp.Int64 GetInvalidIndex ()

            /**
             * Get the array size.
             * 
             * @return Array size.
             * @id Smp.InvalidArrayIndex.GetArraySize
             */
            public def Smp.Int64 GetArraySize ()
        }

        /**
         * This exception is raised when an invalid array size is specified.
         * 
         * @uuid d5779710-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidArraySize
         */
        public exception InvalidArraySize extends Smp.Exception
        {
            /**
             * Get the array size.
             * 
             * @return Array size.
             * @id Smp.InvalidArraySize.GetArraySize
             */
            public def Smp.Int64 GetArraySize ()

            /**
             * Get the invalid array size, i.e. the size of the array that was passed as argument.
             * 
             * @return Invalid array size, i.e. the size of the array that was passed as argument.
             * @id Smp.InvalidArraySize.GetInvalidSize
             */
            public def Smp.Int64 GetInvalidSize ()
        }

        /**
         * This exception is raised when trying to assign an illegal value to an array field.
         * 
         * @uuid d5779709-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidArrayValue
         */
        public exception InvalidArrayValue extends Smp.Exception
        {
            /**
             * Get the index in the array where the first invalid value was found.
             * 
             * @return Index in the array where the first invalid value was found.
             * @id Smp.InvalidArrayValue.GetInvalidValueIndex
             */
            public def Smp.Int64 GetInvalidValueIndex ()

            /**
             * Get the invalid value that was passed as new field value.
             * 
             * @return Invalid value that was passed as new field value.
             * @id Smp.InvalidArrayValue.GetInvalidValue
             */
            public def Smp.AnySimple GetInvalidValue ()
        }

        /**
         * This exception is raised by a component when one of the state transition commands is called in an invalid state.
         * 
         * @uuid d55d57f6-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidComponentState
         */
        public exception InvalidComponentState extends Smp.Exception
        {
            /**
             * Get the invalid state in which a state transition was attempted.
             * 
             * @return Invalid state in which a state transition was attempted.
             * @id Smp.InvalidComponentState.GetInvalidState
             */
            public def Smp.ComponentStateKind GetInvalidState ()

            /**
             * Get the expected state of the component when calling this state transition.
             * 
             * @return Expected state of the component when calling this state transition.
             * @id Smp.InvalidComponentState.GetExpectedState
             */
            public def Smp.ComponentStateKind GetExpectedState ()
        }

        /**
         * This exception is raised when trying to subscribe an event sink to an event source that has a different event type.
         * 
         * @uuid d55d57bb-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidEventSink
         */
        public exception InvalidEventSink extends Smp.Exception
        {
            /**
             * Returns the event source that cannot be subscribed to the event sink.
             * 
             * @return Event source that cannot be subscribed to the event sink.
             * @id Smp.InvalidEventSink.GetEventSource
             */
            public def @Attributes.Const Smp.IEventSource GetEventSource ()

            /**
             * Returns the event sink that the event source that cannot be subscribed to.
             * 
             * @return Event sink that the event source that cannot be subscribed to.
             * @id Smp.InvalidEventSink.GetEventSink
             */
            public def @Attributes.Const Smp.IEventSink GetEventSink ()
        }

        /**
         * This exception is raised when an invalid field name is specified.
         * 
         * @uuid d53c13b4-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidFieldName
         */
        public exception InvalidFieldName extends Smp.Exception
        {
            /**
             * Get the fully qualified field name that is invalid.
             * 
             * @return Fully qualified field name that is invalid.
             * @id Smp.InvalidFieldName.GetFieldName
             */
            public def Smp.String8 GetFieldName ()
        }

        /**
         * Invalid field type.
         * 
         * @uuid e7cc6b40-eb8a-11dc-8642-c38618fe0a20
         * @id Smp.InvalidFieldType
         */
        public exception InvalidFieldType extends Smp.Exception
        {
        }

        /**
         * This exception is raised when trying to load a library that does not contain an Initialise() function.
         * 
         * @uuid 9711af89-e943-11e9-a377-f3d7a7ed9a31
         * @id Smp.InvalidLibrary
         */
        public exception InvalidLibrary extends Smp.Exception
        {
            /**
             * Get the file name of the library that is invalid.
             * 
             * @return Fully qualified field name that is invalid.
             * @id Smp.InvalidLibrary.GetLibraryName
             */
            public def Smp.String8 GetLibraryName ()
        }

        /**
         * This exception is raised by the Invoke() method when trying to invoke a method that does not exist, or that does not support dynamic invocation.
         * 
         * @uuid d56483d6-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidOperationName
         */
        public exception InvalidOperationName extends Smp.Exception
        {
            /**
             * Get the Operation name of request passed to the Invoke() method.
             * 
             * @return Operation name of request passed to the Invoke() method.
             * @id Smp.InvalidOperationName.GetOperationName
             */
            public def Smp.String8 GetOperationName ()
        }

        /**
         * This exception is raised by the Invoke() method when trying to invoke a method with a wrong number of parameters.
         * 
         * @uuid d56212c0-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidParameterCount
         */
        public exception InvalidParameterCount extends Smp.Exception
        {
            /**
             * Get the Operation name of request passed to the Invoke() method.
             * 
             * @return Operation name of request passed to the Invoke() method.
             * @id Smp.InvalidParameterCount.GetOperationName
             */
            public def Smp.String8 GetOperationName ()

            /**
             * Get the correct number of parameters of operation.
             * 
             * @return Correct number of parameters of operation.
             * @id Smp.InvalidParameterCount.GetOperationParameters
             */
            public def Smp.Int32 GetOperationParameters ()

            /**
             * Get the wrong number of parameters of operation.
             * 
             * @return Wrong number of parameters of operation.
             * @id Smp.InvalidParameterCount.GetRequestParameters
             */
            public def Smp.Int32 GetRequestParameters ()
        }

        /**
         * This exception is raised when using an invalid parameter index to set (SetParameterValue()) or get (GetParameterValue()) a parameter value of an operation in a request.
         * 
         * @uuid d562128f-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidParameterIndex
         */
        public exception InvalidParameterIndex extends Smp.Exception
        {
            /**
             * Get the name of the operation.
             * 
             * @return Name of the operation.
             * @id Smp.InvalidParameterIndex.GetOperationName
             */
            public def Smp.String8 GetOperationName ()

            /**
             * Get the invalid parameter index used.
             * 
             * @return Invalid parameter index used.
             * @id Smp.InvalidParameterIndex.GetParameterIndex
             */
            public def Smp.Int32 GetParameterIndex ()

            /**
             * Get the number of parameters of the operation.
             * 
             * @return Number of parameters of the operation.
             * @id Smp.InvalidParameterIndex.GetParameterCount
             */
            public def Smp.Int32 GetParameterCount ()
        }

        /**
         * This exception is raised by the Invoke() method when trying to invoke a method passing a parameter of wrong type.
         * 
         * @uuid d56212ca-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidParameterType
         */
        public exception InvalidParameterType extends Smp.Exception
        {
            /**
             * Get the Operation name of request passed to the Invoke() method.
             * 
             * @return Operation name of request passed to the Invoke() method.
             * @id Smp.InvalidParameterType.GetOperationName
             */
            public def Smp.String8 GetOperationName ()

            /**
             * Get the name of parameter of wrong type.
             * 
             * @return Name of parameter of wrong type.
             * @id Smp.InvalidParameterType.GetParameterName
             */
            public def Smp.String8 GetParameterName ()

            /**
             * Get the Type that is not valid.
             * 
             * @return Type that is not valid.
             * @id Smp.InvalidParameterType.GetInvalidType
             */
            public def Smp.PrimitiveTypeKind GetInvalidType ()

            /**
             * Get the Type that was expected.
             * 
             * @return Type that was expected.
             * @id Smp.InvalidParameterType.GetExpectedType
             */
            public def Smp.PrimitiveTypeKind GetExpectedType ()
        }

        /**
         * This exception is raised when trying to assign an illegal value to a parameter of an operation in a request using SetParameterValue().
         * 
         * @uuid d5621296-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidParameterValue
         */
        public exception InvalidParameterValue extends Smp.Exception
        {
            /**
             * Get the name of parameter value was assigned to.
             * 
             * @return Name of parameter value was assigned to.
             * @id Smp.InvalidParameterValue.GetParameterName
             */
            public def Smp.String8 GetParameterName ()

            /**
             * Get the value that was passed as parameter.
             * 
             * @return Value that was passed as parameter.
             * @id Smp.InvalidParameterValue.GetValue
             */
            public def Smp.AnySimple GetValue ()
        }

        /**
         * This exception is raised when trying to assign an invalid return value of an operation in a request using SetReturnValue().
         * 
         * @uuid d562129d-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidReturnValue
         */
        public exception InvalidReturnValue extends Smp.Exception
        {
            /**
             * Get the name of the operation.
             * 
             * @return Name of the operation.
             * @id Smp.InvalidReturnValue.GetOperationName
             */
            public def Smp.String8 GetOperationName ()

            /**
             * Get the value that was passed as return value.
             * 
             * @return Value that was passed as return value.
             * @id Smp.InvalidReturnValue.GetValue
             */
            public def Smp.AnySimple GetValue ()
        }

        /**
         * This exception is raised by the simulator when one of the operations is called in an invalid state.
         * 
         * @uuid 0dedc8d0-cc39-11e9-abb3-9f6a2356f7e2
         * @id Smp.InvalidSimulatorState
         */
        public exception InvalidSimulatorState extends Smp.Exception
        {
            /**
             * Get the invalid state in which an operation call was made.
             * 
             * @return Invalid state in which an operation call was made.
             * @id Smp.InvalidSimulatorState.GetInvalidState
             */
            public def Smp.SimulatorStateKind GetInvalidState ()
        }

        /**
         * This exception is raised when trying to connect two data flow fields of incompatible types.
         * 
         * @uuid 9b7c7c92-cc52-11e6-a1c3-13e36fcced83
         * @id Smp.InvalidTarget
         */
        public exception InvalidTarget extends Smp.Exception
        {
            /**
             * Get the field for which the Connect operation was called.
             * 
             * @return Field for which the Connect operation was called
             * @id Smp.InvalidTarget.GetSource
             */
            public def @Attributes.Const Smp.IDataflowField GetSource ()

            /**
             * Get the target field that was passed to the Connect operation.
             * 
             * @return Target field that was passed to the Connect operation.
             * @id Smp.InvalidTarget.GetTarget
             */
            public def @Attributes.Const Smp.IField GetTarget ()
        }

        /**
         * This exception is raised when trying to load a library that does not exist.
         * 
         * @uuid 9711af90-e943-11e9-a377-f3d7a7ed9a31
         * @id Smp.LibraryNotFound
         */
        public exception LibraryNotFound extends Smp.Exception
        {
            /**
             * Get the file name of the library that is invalid.
             * 
             * @return Fully qualified field name that is invalid.
             * @id Smp.LibraryNotFound.GetLibraryName
             */
            public def Smp.String8 GetLibraryName ()
        }

        /**
         * This exception is thrown when trying to delete a component from a container which is not contained.
         * 
         * @uuid 0dedc8b6-cc39-11e9-abb3-9f6a2356f7e2
         * @id Smp.NotContained
         */
        public exception NotContained extends Smp.Exception
        {
            /**
             * Get the name of the container.
             * 
             * @return Name of the container.
             * @id Smp.NotContained.GetContainerName
             */
            public def Smp.String8 GetContainerName ()

            /**
             * Get the Component that is not contained.
             * 
             * @return Component that is not contained.
             * @id Smp.NotContained.GetComponent
             */
            public def @Attributes.Const Smp.IComponent GetComponent ()
        }

        /**
         * This exception is thrown when trying to remove a component from a reference which was not referenced before.
         * 
         * @uuid d53e5dd3-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.NotReferenced
         */
        public exception NotReferenced extends Smp.Exception
        {
            /**
             * Get the name of the reference.
             * 
             * @return Name of the reference.
             * @id Smp.NotReferenced.GetReferenceName
             */
            public def Smp.String8 GetReferenceName ()

            /**
             * Get the Component that is not referenced.
             * 
             * @return Component that is not referenced.
             * @id Smp.NotReferenced.GetComponent
             */
            public def @Attributes.Const Smp.IComponent GetComponent ()
        }

        /**
         * This exception is raised when trying to add a component to a reference that is full, i.e. where the Count has reached the Upper limit.
         * 
         * @uuid d53c13dc-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.ReferenceFull
         */
        public exception ReferenceFull extends Smp.Exception
        {
            /**
             * Get the name of the reference.
             * 
             * @return Name of the reference.
             * @id Smp.ReferenceFull.GetReferenceName
             */
            public def Smp.String8 GetReferenceName ()

            /**
             * Get the number of components in the reference, which is its Upper limit when the reference is full.
             * 
             * @return Number of components in the reference, which is its Upper limit when the reference is full.
             * @id Smp.ReferenceFull.GetReferenceSize
             */
            public def Smp.Int64 GetReferenceSize ()
        }

        /**
         * Universally Unique Identifier.
         * 
         * @uuid d55b0e59-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.Uuid
         */
        public struct Uuid
        {
            /**
             * 8 hex nibbles.
             * 
             * @id Smp.Uuid.Data1
             */
            field Smp.UInt32 Data1 = 0U

            /**
             * 3*4=12 hex nibbles.
             * 
             * @id Smp.Uuid.Data2
             */
            field Smp.UInt16 Data2 = 0U

            /**
             * 6*2=12 hex nibbles.
             * 
             * @id Smp.Uuid.Data3
             */
            field Smp.UuidBytes Data3
        }

        /**
         * Final 6 bytes of Uuid.
         * 
         * @uuid d55b0e57-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.UuidBytes
         */
        public array UuidBytes = Smp.UInt8[6]

        /**
         * This exception is raised when trying to read (GetReturnValue()) or write (SetReturnValue()) the return value of a void operation.
         * 
         * @uuid d56212a4-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.VoidOperation
         */
        public exception VoidOperation extends Smp.Exception
        {
            /**
             * Get the name of the operation.
             * 
             * @return Name of the operation.
             * @id Smp.VoidOperation.GetOperationName
             */
            public def Smp.String8 GetOperationName ()
        }

        /**
         * The Access Kind of a property defines whether it has getter and setter.
         * 
         * @uuid e7d5e125-eb8a-11dc-8642-c38618fe0a20
         * @id Smp.AccessKind
         */
        public enum AccessKind
        {
            /**
             * Read/Write access, i.e. getter and setter.
             * 
             * @id Smp.AccessKind.AK_ReadWrite
             */
            AK_ReadWrite = 0,
            /**
             * Read only access, i.e. only getter method.
             * 
             * @id Smp.AccessKind.AK_ReadOnly
             */
            AK_ReadOnly = 1,
            /**
             * Write only access, i.e. only setter method.
             * 
             * @id Smp.AccessKind.AK_WriteOnly
             */
            AK_WriteOnly = 2
        }

        /**
         * This enumeration defines possible options for the View attribute, which can be used to control if and how an element is made visible when published to the simulation infrastructure.
         * The simulation infrastructure must at least support the "None" and the "All" roles (i.e. hidden or always visible).
         * The simulation infrastructure may support the selection of different user roles, in which case the "Debug" and the "Expert" role must also be supported as described.
         * 
         * @uuid d579e033-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.ViewKind
         */
        public enum ViewKind
        {
            /**
             * The element is not made visible to the user (this is the default).
             * 
             * @id Smp.ViewKind.VK_None
             */
            VK_None = 0,
            /**
             * The element is made visible for debugging purposes.
             * The element is not visible to end users. If the simulation infrastructure supports the selection of different user roles, then the element shall be visible to "Debug" users only.
             * 
             * @id Smp.ViewKind.VK_Debug
             */
            VK_Debug = 1,
            /**
             * The element is made visible for expert users.
             * The element is not visible to end users. If the simulation infrastructure supports the selection of different user roles, then the element shall be visible to "Debug" and "Expert" users.
             * 
             * @id Smp.ViewKind.VK_Expert
             */
            VK_Expert = 2,
            /**
             * The element is made visible to all users.
             * 
             * @id Smp.ViewKind.VK_All
             */
            VK_All = 3
        }

        /**
         * Variant that can store a value of any of the simple types. The type attribute defines the type used to represent the value, while the value attribute contains the actual value.
         * 
         * @uuid d575259e-e618-11dc-ab64-bf8df6d7b83a
         * @type NT_AnySimple
         * @id Smp.AnySimple
         */
        public native AnySimple


        /**
         * This interface is the base interface for almost all other SMP interfaces. While most interfaces derive from IComponent, which itself is derived from IObject, some objects (including IField, IFailure, IEntryPoint, IEventSink, IEventSource, IContainer and IReference) are directly derived from IObject.
         * 
         * @uuid d55b0e67-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IObject
         */
        public interface IObject
        {
            /**
             * Return the name of the object.
             * 
             * @return Name of object.
             * @id Smp.IObject.GetName
             */
            @Attributes.Const
            def Smp.String8 GetName ()

            /**
             * Return the description of the object ("property getter").
             * 
             * @return Description of object.
             * @id Smp.IObject.GetDescription
             */
            @Attributes.Const
            def Smp.String8 GetDescription ()

            /**
             * Returns the parent object of the object.
             * 
             * @return Parent object of object or null if object has no parent.
             * @id Smp.IObject.GetParent
             */
            @Attributes.Const
            def Smp.IObject GetParent ()
        }

        /**
         * This is the base class for all SMP exceptions.
         * 
         * @uuid d5706b05-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.Exception
         */
        public exception Exception
        {
            /**
             * Implements the C++ standard interface for exceptions.
             * 
             * @return Name of the exception class.
             * @id Smp.Exception.what
             */
            public def Smp.String8 what ()

            /**
             * Returns the name of the exception class. This name can be used e.g. for debugging purposes.
             * 
             * @return Name of the exception class.
             * @id Smp.Exception.GetName
             */
            public def Smp.String8 GetName ()

            /**
             * Returns a textual description of the exception class. This description can be used e.g. for debugging purposes.
             * 
             * @return Textual description of the exception class.
             * @id Smp.Exception.GetDescription
             */
            public def Smp.String8 GetDescription ()

            /**
             * Returns the description of the problem encountered. This message can be used e.g. for debugging purposes.
             * 
             * @return Textual description of the problem encountered.
             * @id Smp.Exception.GetMessage
             */
            public def Smp.String8 GetMessage ()

            /**
             * Returns the sender of the exception instance. This object (and its name and path) can be used e.g. for debugging purposes.
             * 
             * @return Object that emitted the exception.
             * @id Smp.Exception.GetSender
             */
            public def @Attributes.Const Smp.IObject GetSender ()
        }

        /**
         * Interface of an event source that event sinks (IEventSink) can subscribe to.
         * 
         * @uuid d55d579c-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IEventSource
         */
        public interface IEventSource extends Smp.IObject
        {
            /**
             * Subscribe to the event source, i.e. request notifications.
             * 
             * @param eventSink
             *       Event sink to subscribe to event source.
             * @id Smp.IEventSource.Subscribe
             */
            def void Subscribe (inout Smp.IEventSink eventSink) throws Smp.EventSinkAlreadySubscribed, Smp.InvalidEventSink

            /**
             * Unsubscribe from the event source, i.e. cancel notifications.
             * 
             * @param eventSink
             *       Event sink to unsubscribe from event source.
             * @id Smp.IEventSource.Unsubscribe
             */
            def void Unsubscribe (inout Smp.IEventSink eventSink) throws Smp.EventSinkNotSubscribed
        }

        /**
         * Interface of a field.
         * 
         * @uuid d57796d2-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IField
         */
        public interface IField extends Smp.IPersist
        {
            /**
             * Return View kind of the field.
             * 
             * @return The View kind of the field.
             *       The view kind indicates which user roles have visibility of the field.
             * @id Smp.IField.GetView
             */
            @Attributes.Const
            def Smp.ViewKind GetView ()

            /**
             * Return State flag of the field.
             * 
             * @return The State flag of the field.
             *       When true, the state of the field shall be stored by the simulation infrastructure persistence mechanism on Store(), and restored on Restore().
             * @id Smp.IField.IsState
             */
            @Attributes.Const
            def Smp.Bool IsState ()

            /**
             * Return Input flag of the field.
             * 
             * @return The Input flag of the field.
             *       When true, the field is considered an input into the model and can be used as target of a field link in data flow based design.
             * @id Smp.IField.IsInput
             */
            @Attributes.Const
            def Smp.Bool IsInput ()

            /**
             * Return Output flag of the field.
             * 
             * @return The Output flag of the field.
             *       When true, the field is considered an output of the model and can be used as source of a field link in data flow based design.
             * @id Smp.IField.IsOutput
             */
            @Attributes.Const
            def Smp.Bool IsOutput ()

            /**
             * Returns the type of this field.
             * 
             * @return The type of this field.
             * @id Smp.IField.GetType
             */
            @Attributes.Const
            def @Attributes.Const Smp.Publication.IType GetType ()
        }

        /**
         * An event source collection is an ordered collection of event sources, which allows iterating all members.
         * 
         * @uuid d55d57c2-e618-11dc-ab64-bf8df6d7b83a
         * @location Smp/IEventSource.h
         * @type ICollection<IEventSource>
         * @namespace Smp
         * @id Smp.EventSourceCollection
         */
        public native EventSourceCollection


        /**
         * Interface of a field which is of array type.
         * 
         * @uuid d57796e5-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IArrayField
         */
        public interface IArrayField extends Smp.IField
        {
            /**
             * Get the size (number of array items) of the field.
             * 
             * @return Size (number of array items) of the field.
             * @id Smp.IArrayField.GetSize
             */
            @Attributes.Const
            def Smp.UInt64 GetSize ()

            /**
             * Get an array item by index.
             * 
             * @param index
             *       Index of item to get.
             * @return Array item (Field) at given index.
             * @id Smp.IArrayField.GetItem
             */
            @Attributes.Const
            def Smp.IField GetItem (Smp.UInt64 index) throws Smp.InvalidArrayIndex
        }

        /**
         * Interface for a component that supports dynamic invocation of operations.
         * 
         * @uuid d56212a9-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IDynamicInvocation
         */
        public interface IDynamicInvocation extends Smp.IComponent
        {
            /**
             * Return a request object for the given operation that describes the parameters and the return value.
             * 
             * @param operationName
             *       Name of operation.
             * @return Request object for operation, or null if either no operation with the given name could be found, or the operation with the given name does not support dynamic invocation.
             * @id Smp.IDynamicInvocation.CreateRequest
             */
            def Smp.IRequest CreateRequest (Smp.String8 operationName)

            /**
             * Dynamically invoke an operation using a request object that has been created and filled with parameter values by the caller.
             * 
             * @param request
             *       Request object to invoke.
             * @id Smp.IDynamicInvocation.Invoke
             */
            def void Invoke (
                    inout Smp.IRequest request) throws Smp.InvalidParameterCount, Smp.InvalidOperationName, Smp.InvalidParameterType

            /**
             * Destroy a request object that has been created with the CreateRequest() method before.
             * 
             * @param request
             *       Request object to destroy.
             * @id Smp.IDynamicInvocation.DeleteRequest
             */
            def void DeleteRequest (inout Smp.IRequest request)

            /**
             * Provides the collection of properties that have been published.
             * 
             * @return Collection of properties that have been published, which may be empty.
             * @id Smp.IDynamicInvocation.GetProperties
             */
            @Attributes.Const
            def @Attributes.Const Smp.PropertyCollection GetProperties ()

            /**
             * Provides the collection of operations that have been published.
             * 
             * @return Collection of operations that have been published, which may be empty.
             * @id Smp.IDynamicInvocation.GetOperations
             */
            @Attributes.Const
            def @Attributes.Const Smp.OperationCollection GetOperations ()
        }

        /**
         * A request holds information, which is passed between a client invoking an operation via the IDynamicInvocation interface and a component being invoked.
         * 
         * @uuid d55fc872-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IRequest
         */
        public interface IRequest
        {
            /**
             * Return the name of the operation that this request is for.
             * 
             * @return Name of the operation.
             * @id Smp.IRequest.GetOperationName
             */
            @Attributes.Const
            def Smp.String8 GetOperationName ()

            /**
             * Return the number of parameters stored in the request.
             * This only considers parameters of direction in, out or in/out, but not of type return.
             * 
             * @return Number of parameters in request object.
             * @id Smp.IRequest.GetParameterCount
             */
            @Attributes.Const
            def Smp.Int32 GetParameterCount ()

            /**
             * Query for a parameter index by parameter name.
             * This only considers parameters of direction in, out or in/out, but not of type return.
             * 
             * @param parameterName
             *       Name of parameter.
             * @return Index of parameter with the given name, or -1 if no parameter with the given name could be found.
             * @id Smp.IRequest.GetParameterIndex
             */
            @Attributes.Const
            def Smp.Int32 GetParameterIndex (Smp.String8 parameterName)

            /**
             * Assign a value to a parameter at a given position.
             * This only considers parameters of direction in, out or in/out, but not of type return.
             * 
             * @param index
             *       Index of parameter (0-based).
             * @param value
             *       Value of parameter.
             * @id Smp.IRequest.SetParameterValue
             */
            @Attributes.Const
            def void SetParameterValue (Smp.Int32 index,
                    Smp.AnySimple value) throws Smp.InvalidParameterIndex, Smp.InvalidParameterValue, Smp.InvalidAnyType

            /**
             * Query a value of a parameter at a given position.
             * This only considers parameters of direction in, out or in/out, but not of type return.
             * 
             * @param index
             *       Index of parameter (0-based).
             * @return Value of parameter.
             * @id Smp.IRequest.GetParameterValue
             */
            @Attributes.Const
            def Smp.AnySimple GetParameterValue (Smp.Int32 index) throws Smp.InvalidParameterIndex

            /**
             * Assign the return value of the operation.
             * 
             * @param value
             *       Return value.
             * @id Smp.IRequest.SetReturnValue
             */
            def void SetReturnValue (
                    Smp.AnySimple value) throws Smp.InvalidReturnValue, Smp.VoidOperation, Smp.InvalidAnyType

            /**
             * Query the return value of the operation.
             * 
             * @return Return value of the operation.
             * @id Smp.IRequest.GetReturnValue
             */
            @Attributes.Const
            def Smp.AnySimple GetReturnValue () throws Smp.VoidOperation
        }

        /**
         * Interface of a field of simple type.
         * 
         * @uuid d579e020-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.ISimpleField
         */
        public interface ISimpleField extends Smp.IField
        {
            /**
             * Get primitive type kind that this simple field uses.
             * 
             * @return Primitive type kind that this field uses.
             * @id Smp.ISimpleField.GetPrimitiveTypeKind
             */
            @Attributes.Const
            def Smp.PrimitiveTypeKind GetPrimitiveTypeKind ()

            /**
             * Get the value of the simple field.
             * 
             * @return Field value.
             * @id Smp.ISimpleField.GetValue
             */
            @Attributes.Const
            def Smp.AnySimple GetValue ()

            /**
             * Set the value of the simple field.
             * If the given value simple type kind does match the simple type kind of the field, than it changes the field value to the given value.
             * 
             * @param value
             *       Field value.
             * @id Smp.ISimpleField.SetValue
             */
            def void SetValue (Smp.AnySimple value) throws Smp.InvalidFieldValue
        }

        /**
         * Interface of a forcible field.
         * 
         * @uuid d5779722-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IForcibleField
         */
        public interface IForcibleField extends Smp.ISimpleField
        {
            /**
             * Force field to given value.
             * 
             * @param value
             *       Value to force field to.
             * @id Smp.IForcibleField.Force
             */
            def void Force (Smp.AnySimple value) throws Smp.InvalidFieldValue

            /**
             * Unforce field.
             * 
             * @id Smp.IForcibleField.Unforce
             */
            def void Unforce ()

            /**
             * Query for the forced state of the field.
             * 
             * @return Whether the field is forced or not.
             * @id Smp.IForcibleField.IsForced
             */
            @Attributes.Const
            def Smp.Bool IsForced ()

            /**
             * Force field to its current value.
             * 
             * @id Smp.IForcibleField.Freeze
             */
            def void Freeze ()
        }

        /**
         * Interface of a self-persisting object that provides operations to allow for storing and restoring its state.
         * 
         * @uuid d55fc858-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IPersist
         */
        public interface IPersist extends Smp.IObject
        {
            /**
             * Restore object state from storage.
             * 
             * @param reader
             *       Interface that allows reading from storage.
             * @id Smp.IPersist.Restore
             */
            def void Restore (inout Smp.IStorageReader reader) throws Smp.CannotRestore

            /**
             * Store object state to storage.
             * 
             * @param writer
             *       Interface that allows writing to storage.
             * @id Smp.IPersist.Store
             */
            def void Store (inout Smp.IStorageWriter writer) throws Smp.CannotStore
        }

        /**
         * This interface provides functionality to read data from storage.
         * 
         * @uuid d55fc850-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IStorageReader
         */
        public interface IStorageReader
        {
            /**
             * Get the state vector file name.
             * 
             * @return This method returns the full path of the state vector file currently loaded by the Storage Reader.
             * @id Smp.IStorageReader.GetStateVectorFileName
             */
            @Attributes.Const
            def Smp.String8 GetStateVectorFileName ()

            /**
             * Get the state vector file path.
             * 
             * @return This method returns the full path for auxiliary files corresponding to the state vector file currently loaded by the Storage Reader.
             * @id Smp.IStorageReader.GetStateVectorFilePath
             */
            @Attributes.Const
            def Smp.String8 GetStateVectorFilePath ()
        }

        /**
         * This interface provides functionality to write data to storage.
         * 
         * @uuid d55fc854-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IStorageWriter
         */
        public interface IStorageWriter
        {
            /**
             * Get the state vector file name.
             * 
             * @return This method returns the full path of the state vector file currently stored by the Storage Writer.
             * @id Smp.IStorageWriter.GetStateVectorFileName
             */
            @Attributes.Const
            def Smp.String8 GetStateVectorFileName ()

            /**
             * Get the state vector file path.
             * 
             * @return This method returns the full path for auxiliary files corresponding to the state vector file currently stored by the Storage Writer.
             * @id Smp.IStorageWriter.GetStateVectorFilePath
             */
            @Attributes.Const
            def Smp.String8 GetStateVectorFilePath ()
        }

        /**
         * Interface of an entry point.
         * 
         * @uuid d55b0e86-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IEntryPoint
         */
        public interface IEntryPoint extends Smp.IObject
        {
            /**
             * This method shall be called when an associated event is emitted.
             * 
             * @id Smp.IEntryPoint.Execute
             */
            def void Execute ()
        }

        /**
         * This is an enumeration of the available states of the simulator. The Setup phase is split into three different states, the Execution phase has five different states, and the Termination phase has two states.
         * 
         * @uuid d56483dc-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.SimulatorStateKind
         */
        public enum SimulatorStateKind
        {
            /**
             * In Building state, the component hierarchy is created. This is done by an external component, not by the simulator.
             * This state is entered automatically after the simulation environment has performed its initialisation.
             * In this state, Publish() and Configure() can be called any time to call the corresponding Publish() and Configure() operations of each component.
             * This state is left with the Connect() state transition method.
             * 
             * @id Smp.SimulatorStateKind.SSK_Building
             */
            SSK_Building = 0,
            /**
             * In Connecting state, the simulation environment traverses the component hierarchy and calls the Connect() method of each component.
             * This state is entered using the Connect() state transition.
             * After connecting all components to the simulator, an automatic state transition to the Initialising state is performed.
             * 
             * @id Smp.SimulatorStateKind.SSK_Connecting
             */
            SSK_Connecting = 1,
            /**
             * In Initialising state, the simulation environment executes all initialisation entry points in the order they have been added to the simulator using the AddInitEntryPoint() method.
             * This state is either entered automatically after the simulation environment has connected all models to the simulator, or manually from Standby state using the Initialise() state transition.
             * After calling all initialisation entry points, an automatic state transition to the Standby state is performed.
             * 
             * @id Smp.SimulatorStateKind.SSK_Initialising
             */
            SSK_Initialising = 2,
            /**
             * In Standby state, the simulation environment (namely the Time Keeper Service) does not progress simulation time. Only entry points registered relative to Zulu time are executed.
             * This state is entered automatically from the Initialising, Storing, and Restoring states, or manually from the Executing state using the Hold() state transition.
             * This state is left with one of the Run(), Store(), Restore(), Initialise(), Reconnect() or Exit() state transitions.
             * 
             * @id Smp.SimulatorStateKind.SSK_Standby
             */
            SSK_Standby = 3,
            /**
             * In Executing state, the simulation environment (namely the Time Keeper Service) does progress simulation time. Entry points registered with any of the available time kinds are executed.
             * This state is entered using the Run() state transition.
             * This state is left using the Hold() state transition.
             * 
             * @id Smp.SimulatorStateKind.SSK_Executing
             */
            SSK_Executing = 4,
            /**
             * In Storing state, the simulation environment first stores the values of all fields published with the State attribute to storage (typically a file). Afterwards, the Store() method of all components (Models and Services) implementing the optional IPersist interface is called, to allow custom storing of additional information. While in this state, fields published with the State attribute must not be modified by the models, to ensure that a consistent set of field values is stored.
             * This state is entered using the Store() state transition.
             * After storing the simulator state, an automatic state transition to the Standby state is performed.
             * 
             * @id Smp.SimulatorStateKind.SSK_Storing
             */
            SSK_Storing = 5,
            /**
             * In Restoring state, the simulation environment first restores the values of all fields published with the State attribute from storage. Afterwards, the Restore() method of all components implementing the optional IPersist interface is called, to allow custom restoring of additional information. While in this state, fields published with the State attribute must not be modified by the models, to ensure that a consistent set of field values is restored.
             * This state is entered using the Restore() state transition.
             * After restoring the simulator state, an automatic state transition to the Standby state is performed.
             * 
             * @id Smp.SimulatorStateKind.SSK_Restoring
             */
            SSK_Restoring = 6,
            /**
             * In Reconnecting state, the simulation environment makes sure that models that have been added to the simulator after leaving the Building state are properly published, configured and connected.
             * This state is entered using the Reconnect() state transition.
             * After connecting all new models, an automatic state transition to the Standby state is performed.
             * 
             * @id Smp.SimulatorStateKind.SSK_Reconnecting
             */
            SSK_Reconnecting = 7,
            /**
             * In Exiting state, the simulation environment is properly terminating a running simulation.
             * This state is entered using the Exit() state transition. After exiting, the simulator is in an undefined state.
             * 
             * @id Smp.SimulatorStateKind.SSK_Exiting
             */
            SSK_Exiting = 8,
            /**
             * In this state, the simulation environment performs an abnormal simulation shut-down.
             * This state is entered using the Abort() state transition. After aborting, the simulator is in an undefined state.
             * 
             * @id Smp.SimulatorStateKind.SSK_Aborting
             */
            SSK_Aborting = 9
        }

        /**
         * An entry point collection is an ordered collection of entry points, which allows iterating all members.
         * 
         * @uuid d55b0e92-e618-11dc-ab64-bf8df6d7b83a
         * @location Smp/IEntryPoint.h
         * @type ICollection<IEntryPoint>
         * @namespace Smp
         * @id Smp.EntryPointCollection
         */
        public native EntryPointCollection


        /**
         * This interface gives access to the simulation environment state and state transitions. Further, it provides convenience methods to add models, and to add and retrieve simulation services.
         * 
         * @uuid d566f4f2-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.ISimulator
         */
        public interface ISimulator extends Smp.IComposite
        {
            /**
             * Name of the model container.
             * 
             * @id Smp.ISimulator.SMP_SimulatorModels
             */
            constant Smp.String8 SMP_SimulatorModels = "Models"

            /**
             * Name of the service container.
             * 
             * @id Smp.ISimulator.SMP_SimulatorServices
             */
            constant Smp.String8 SMP_SimulatorServices = "Services"

            /**
             * Return interface to link registry service.
             * 
             * @return Interface to mandatory link registry service.
             * @id Smp.ISimulator.GetLinkRegistry
             */
            @Attributes.Const
            def Smp.Services.ILinkRegistry GetLinkRegistry ()

            /**
             * This method registers a component factory with the simulator. The simulator can use this factory to create component instances of the component implementation in its CreateInstance() method.
             * The memory management of the factory is passed to the simulator, who is in charge of deleting the factory at the exiting or aborting state.
             * 
             * @param componentFactory
             *       Factory to create instance of the component implementation.
             * @id Smp.ISimulator.RegisterFactory
             */
            def void RegisterFactory (inout Smp.IFactory componentFactory) throws Smp.DuplicateUuid

            /**
             * This method creates an instance of the component with the given unique identifier.
             * 
             * @param uuid
             *       Unique identifier of the component to create.
             * @param name
             *       Name of the new instance.
             *       f the name provided is not a valid object name, an exception of type InvalidObjectName is raised.
             * @param description
             *       Description of the new instance.
             * @param parent
             *       Parent object of the new instance.
             * @return New instance of the component with the given implementation identifier or null in case no factory for the given implementation identifier has been registered.
             * @id Smp.ISimulator.CreateInstance
             */
            def Smp.IComponent CreateInstance (Smp.Uuid uuid, Smp.String8 name, Smp.String8 description,
                    inout Smp.IComposite parent) throws Smp.InvalidObjectName

            /**
             * This method returns the factory of the component with the given implementation identifier.
             * 
             * @param uuid
             *       Unique identifier of the component to get the factory for.
             * @return Factory of the component with the given implementation identifier or null in case no factory for the given implementation identifier has been registered.
             * @id Smp.ISimulator.GetFactory
             */
            @Attributes.Const
            def Smp.IFactory GetFactory (Smp.Uuid uuid)

            /**
             * This method returns all factories that have been registered with the simulator.
             * 
             * @return Collection of factories.
             * @id Smp.ISimulator.GetFactories
             */
            @Attributes.Const
            def @Attributes.Const Smp.FactoryCollection GetFactories ()

            /**
             * Give access to the global type registry.
             * 
             * @return Reference to global type registry.
             * @id Smp.ISimulator.GetTypeRegistry
             */
            @Attributes.Const
            def Smp.Publication.ITypeRegistry GetTypeRegistry ()

            /**
             * This operation loads a library of a package into memory.
             * At loading time, the Initialise() function of this library will be called.
             * At exiting or aborting time, the Finalise() function of this library will be called.
             * 
             * @param libraryPath
             *       Path to the library to load.
             *       This needs to be a valid path name given the constraints of the operating system.
             * @id Smp.ISimulator.LoadLibrary
             */
            def void LoadLibrary (Smp.String8 libraryPath) throws Smp.LibraryNotFound, Smp.InvalidLibrary

            /**
             * This method asks the simulation environment to call all initialisation entry points again.
             * 
             * @id Smp.ISimulator.Initialise
             */
            def void Initialise ()

            /**
             * This method adds a model to the models collection of the simulator, i.e. to the "Models" container.
             * 
             * @param model
             *       New model to add to collection of root models, i.e. to the "Models" container.
             * @id Smp.ISimulator.AddModel
             */
            def void AddModel (inout Smp.IModel model) throws Smp.DuplicateName, Smp.InvalidSimulatorState

            /**
             * This method adds a user-defined service to the services collection, i.e. to the "Services" container.
             * 
             * @param service
             *       Service to add to services collection.
             * @id Smp.ISimulator.AddService
             */
            def void AddService (inout Smp.IService service) throws Smp.DuplicateName, Smp.InvalidSimulatorState

            /**
             * Query for a service component by its name.
             * 
             * @param name
             *       Service name.
             * @return Service with the given name, or null if no service with the given name could be found.
             * @id Smp.ISimulator.GetService
             */
            @Attributes.Const
            def Smp.IService GetService (Smp.String8 name)

            /**
             * Return interface to logger service.
             * 
             * @return Interface to mandatory logger service.
             * @id Smp.ISimulator.GetLogger
             */
            @Attributes.Const
            def Smp.Services.ILogger GetLogger ()

            /**
             * Return interface to time keeper service.
             * 
             * @return Interface to mandatory time keeper service.
             * @id Smp.ISimulator.GetTimeKeeper
             */
            @Attributes.Const
            def Smp.Services.ITimeKeeper GetTimeKeeper ()

            /**
             * Return interface to scheduler service.
             * 
             * @return Interface to mandatory scheduler service.
             * @id Smp.ISimulator.GetScheduler
             */
            @Attributes.Const
            def Smp.Services.IScheduler GetScheduler ()

            /**
             * Return interface to event manager service.
             * 
             * @return Interface to mandatory event manager service.
             * @id Smp.ISimulator.GetEventManager
             */
            @Attributes.Const
            def Smp.Services.IEventManager GetEventManager ()

            /**
             * Return interface to resolver service.
             * 
             * @return Interface to mandatory resolver service.
             * @id Smp.ISimulator.GetResolver
             */
            @Attributes.Const
            def Smp.Services.IResolver GetResolver ()

            /**
             * This method asks the simulation environment to call the Publish() method of all service and model instances in the component hierarchy which are still in Created state.
             * 
             * @id Smp.ISimulator.Publish
             */
            def void Publish ()

            /**
             * This method asks the simulation environment to call the Configure() method of all service and model instances which are still in Publishing state.
             * 
             * @id Smp.ISimulator.Configure
             */
            def void Configure ()

            /**
             * This method informs the simulation environment that the hierarchy of model instances has been configured, and can now be connected to the simulator. Thus, the simulation environment calls the Connect() method of all service and model instances.
             * 
             * @id Smp.ISimulator.Connect
             */
            def void Connect ()

            /**
             * This method changes from Standby to Executing state.
             * 
             * @id Smp.ISimulator.Run
             */
            def void Run ()

            /**
             * This method changes from Executing to Standby state.
             * 
             * @param immediate
             *       True if the simulator shall stop immediately after completion of the current scheduler event, false if the simulator shall still process all events of the current simulation time before entering Standby state.
             * @id Smp.ISimulator.Hold
             */
            def void Hold (Smp.Bool immediate)

            /**
             * This method is used to store a state vector to file.
             * 
             * @param filename
             *       Name including the full path to use for simulation state vector file.
             * @id Smp.ISimulator.Store
             */
            def void Store (Smp.String8 filename)

            /**
             * This method is used to restore a state vector from file.
             * 
             * @param filename
             *       Name including the full path of simulation state vector file.
             * @id Smp.ISimulator.Restore
             */
            def void Restore (Smp.String8 filename)

            /**
             * This method asks the simulation environment to reconnect the component hierarchy starting at the given root component.
             * 
             * @param root
             *       Root component to start reconnecting from. This can be the parent component of a newly added model, or e.g. the simulator itself.
             * @id Smp.ISimulator.Reconnect
             */
            def void Reconnect (inout Smp.IComponent root)

            /**
             * This method is used for a normal termination of a simulation.
             * 
             * @id Smp.ISimulator.Exit
             */
            def void Exit ()

            /**
             * This method is used for an abnormal termination of a simulation.
             * 
             * @id Smp.ISimulator.Abort
             */
            def void Abort ()

            /**
             * Return the current simulator state.
             * 
             * @return Current simulator state.
             * @id Smp.ISimulator.GetState
             */
            @Attributes.Const
            def Smp.SimulatorStateKind GetState ()

            /**
             * This method can be used to add entry points that shall be executed in the Initialising state.
             * If the simulation is in Building, Connecting or Standby state, it adds the entry point to the list of entry points to be executed once the simulation reaches Initialising state.
             * If the simulation is not in Building, Connecting or Standby state, then it returns and no action is taken.
             * This allows components to subscribe to a callback during initialization phase since there are only explicit methods defined for Publish, Configure and Connect. This choice is taken since most models require actions to be taken in Publish, Configure and Connect, however only a minority require to perform some actions during initialization.
             * 
             * @param entryPoint
             *       Entry point to execute in Initialising state.
             * @id Smp.ISimulator.AddInitEntryPoint
             */
            def void AddInitEntryPoint (inout Smp.IEntryPoint entryPoint)
        }

        /**
         * Interface for a component factory.
         * 
         * @uuid d56baf53-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IFactory
         */
        public interface IFactory extends Smp.IObject
        {
            /**
             * Get Universally unique identifier of the type instantiated by the factory.
             * 
             * @return Universally unique identifier of component.
             * @id Smp.IFactory.GetUuid
             */
            @Attributes.Const
            def Smp.Uuid GetUuid ()

            /**
             * Returns the fully qualified C++ name of the type.
             * 
             * @return Fully qualified C++ name of type that is created by this factory.
             * @id Smp.IFactory.GetTypeName
             */
            @Attributes.Const
            def Smp.String8 GetTypeName ()

            /**
             * Create a new instance with given name, description and parent.
             * 
             * @param name
             *       Name of the new instance.
             *       f the name provided is not a valid object name, an exception of type InvalidObjectName is raised.
             * @param description
             *       Description of the new instance.
             * @param parent
             *       Parent object of the new instance.
             * @return New component instance.
             * @id Smp.IFactory.CreateInstance
             */
            def Smp.IComponent CreateInstance (Smp.String8 name, Smp.String8 description,
                    inout Smp.IComposite parent) throws Smp.InvalidObjectName

            /**
             * Delete an existing instance.
             * 
             * @param instance
             *       Instance to delete.
             * @id Smp.IFactory.DeleteInstance
             */
            def void DeleteInstance (inout Smp.IComponent instance)
        }

        /**
         * A factory collection is an ordered collection of factories, which allows iterating all members.
         * 
         * @uuid d56baf66-e618-11dc-ab64-bf8df6d7b83a
         * @location Smp/IFactory.h
         * @type ICollection<IFactory>
         * @namespace Smp
         * @id Smp.FactoryCollection
         */
        public native FactoryCollection


        /**
         * Interface that provides functionality to allow publishing members, including fields, properties and operations.
         * 
         * @uuid d56baf6b-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IPublication
         */
        public interface IPublication
        {
            /**
             * Give access to the global type registry.
             * 
             * @return Reference to global type registry.
             * @id Smp.IPublication.GetTypeRegistry
             */
            @Attributes.Const
            def Smp.Publication.ITypeRegistry GetTypeRegistry ()

            /**
             * Publish a field defined internally that implements the IField interface.
             * If a field with the same name has been published before, an exception of type DuplicateName is thrown.
             * 
             * @param field
             *       Field to publish.
             * @id Smp.IPublication.PublishField
             */
            def void PublishField (inout Smp.IField field) throws Smp.DuplicateName

            /**
             * Publish top-level node of an array without using the type registry.
             * This operation can be used, together with subsequent calls to PublishField, for direct publication of an array.
             * 
             * @param name
             *       Array name.
             * @param description
             *       Array description.
             * @param view
             *       Show field in model tree.
             * @param state
             *       Include field in store/restore of simulation state.
             * @return Interface to publish item type against.
             * @id Smp.IPublication.PublishArray
             */
            def Smp.IPublication PublishArray (Smp.String8 name, Smp.String8 description,
                    Smp.ViewKind view = Smp.ViewKind.VK_All,
                    Smp.Bool state = true) throws Smp.DuplicateName, Smp.InvalidObjectName

            /**
             * Publish top-level node of a structure without using the type registry.
             * This operation can be used, together with subsequent calls to PublishField, for direct publication of a structure.
             * 
             * @param name
             *       Structure name.
             * @param description
             *       Structure description.
             * @param view
             *       Show field in model tree.
             * @param state
             *       Include field in store/restore of simulation state.
             * @return Reference to publish structure fields against.
             * @id Smp.IPublication.PublishStructure
             */
            def Smp.IPublication PublishStructure (Smp.String8 name, Smp.String8 description,
                    Smp.ViewKind view = Smp.ViewKind.VK_All,
                    Smp.Bool state = true) throws Smp.DuplicateName, Smp.InvalidObjectName

            /**
             * Publish an operation with the given name, description and view kind.
             * If an Operations with the same name has already been published, this will update the "description" and "view"  of the previous publication and it returns the same IPublishOperation of the previously published Operation.
             * If an Operation with the same name has not been published, this creates a new IPublishOperation instance and returns it.
             * 
             * @param name
             *       Name of operation.
             * @param description
             *       Description of operation.
             * @param view
             *       View kind of operation node in simulation tree.
             * @return Reference to publish parameters against.
             * @id Smp.IPublication.PublishOperation
             */
            def Smp.Publication.IPublishOperation PublishOperation (Smp.String8 name, Smp.String8 description,
                    Smp.ViewKind view = Smp.ViewKind.VK_None) throws Smp.InvalidObjectName

            /**
             * Publish a property
             * 
             * @param name
             *       Property name.
             * @param description
             *       Property description.
             * @param typeUuid
             *       Uuid of type of property.
             * @param accessKind
             *       Access kind of Property.
             * @param view
             *       Show field in model tree.
             * @id Smp.IPublication.PublishProperty
             */
            def void PublishProperty (Smp.String8 name, Smp.String8 description, Smp.Uuid typeUuid,
                    Smp.AccessKind accessKind,
                    Smp.ViewKind view = Smp.ViewKind.VK_None) throws Smp.Publication.TypeNotRegistered, Smp.InvalidObjectName

            /**
             * Get the field of given name.
             * 
             * @param fullName
             *       Fully qualified field name (relative to the component).
             * @return Instance of field for given full name.
             * @id Smp.IPublication.GetField
             */
            @Attributes.Const
            def Smp.IField GetField (Smp.String8 fullName) throws Smp.InvalidFieldName

            /**
             * Returns a collection of all fields that have been published.
             * 
             * @return Collection of the fields (immediate children) of the component.
             * @id Smp.IPublication.GetFields
             */
            @Attributes.Const
            def @Attributes.Const Smp.FieldCollection GetFields ()

            /**
             * Provides the collection of properties that have been published.
             * 
             * @return Collection of properties that have been published, which may be empty.
             * @id Smp.IPublication.GetProperties
             */
            @Attributes.Const
            def @Attributes.Const Smp.PropertyCollection GetProperties ()

            /**
             * Provides the collection of operations that have been published.
             * 
             * @return Collection of operations that have been published, which may be empty.
             * @id Smp.IPublication.GetOperations
             */
            @Attributes.Const
            def @Attributes.Const Smp.OperationCollection GetOperations ()

            /**
             * Create request object.
             * 
             * @param operationName
             *       Name of operation.
             * @return Request object for operation.
             * @id Smp.IPublication.CreateRequest
             */
            def Smp.IRequest CreateRequest (Smp.String8 operationName)

            /**
             * Delete request object.
             * 
             * @param request
             *       Request object to delete.
             * @id Smp.IPublication.DeleteRequest
             */
            def void DeleteRequest (inout Smp.IRequest request)

            /**
             * Call this operation to release all data created during earlier Publish calls to this instance.
             * This invalidated all pointers retrieved earlier via GetField(), GetFields() or CreateRequest().
             * 
             * @id Smp.IPublication.Unpublish
             */
            def void Unpublish ()
        }

        /**
         * This is the base interface for all SMP components.
         * 
         * @uuid d55b0e77-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IComponent
         */
        public interface IComponent extends Smp.IObject
        {
            /**
             * Returns the state the component is currently in.
             * 
             * @return Current component state.
             * @id Smp.IComponent.GetState
             */
            @Attributes.Const
            def Smp.ComponentStateKind GetState ()

            /**
             * Request the component to publish its fields, properties and operations against the provided publication receiver.
             * 
             * @param receiver
             *       Publication receiver.
             * @id Smp.IComponent.Publish
             */
            def void Publish (inout Smp.IPublication receiver) throws Smp.InvalidComponentState

            /**
             * Request the component to perform any custom configuration. The component can create and configure other components using the field values of its published fields.
             * 
             * @param logger
             *       Logger service for logging of error messages during configuration.
             * @param linkRegistry
             *       Reference to the link registry services, so that the component can register links that it creates during configuration.
             * @id Smp.IComponent.Configure
             */
            def void Configure (inout Smp.Services.ILogger logger,
                    inout Smp.Services.ILinkRegistry linkRegistry) throws Smp.InvalidComponentState

            /**
             * Allow the component to connect to the simulator and its simulation services.
             * 
             * @param simulator
             *       Simulation Environment that hosts the component.
             * @id Smp.IComponent.Connect
             */
            def void Connect (inout Smp.ISimulator simulator) throws Smp.InvalidComponentState

            /**
             * Ask the component to disconnect from the simulator and all its simulation services.
             * 
             * @id Smp.IComponent.Disconnect
             */
            def void Disconnect () throws Smp.InvalidComponentState

            /**
             * Get the field of given name.
             * 
             * @param fullName
             *       Fully qualified field name (relative to the component).
             * @return Instance of field for given full name.
             * @id Smp.IComponent.GetField
             */
            @Attributes.Const
            def Smp.IField GetField (Smp.String8 fullName) throws Smp.InvalidFieldName

            /**
             * Returns a collection of all fields of the component.
             * 
             * @return Collection of the fields (immediate children) of the component.
             * @id Smp.IComponent.GetFields
             */
            @Attributes.Const
            def @Attributes.Const Smp.FieldCollection GetFields ()

            /**
             * Get Universally Unique Identifier of Component Type.
             * 
             * @return Universally Unique Identifier of Component.
             * @id Smp.IComponent.GetUuid
             */
            @Attributes.Const
            def @Attributes.Const @Attributes.ByReference Smp.Uuid GetUuid ()
        }

        /**
         * This exception is raised when trying to set an object's name to an invalid name. Names
         * <ul>
         * <li>must not be empty,</li>
         * <li>must start with a letter, and</li>
         * <li>must only contain letters, digits, the underscore ("_") and brackets ("[" and "]").</li>
         * </ul>
         * 
         * @uuid d539a38f-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidObjectName
         */
        public exception InvalidObjectName extends Smp.Exception
        {
            /**
             * Get the invalid object name passed to the constructor of the object.
             * 
             * @return Invalid object name passed to the constructor of the object.
             * @id Smp.InvalidObjectName.GetInvalidName
             */
            public def Smp.String8 GetInvalidName ()
        }

        /**
         * This is an enumeration of the available primitive types.
         * 
         * @uuid d55b0e31-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.PrimitiveTypeKind
         */
        public enum PrimitiveTypeKind
        {
            /**
             * No type, e.g. for void.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_None
             */
            PTK_None = 0,
            /**
             * 8 bit character type.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_Char8
             */
            PTK_Char8 = 1,
            /**
             * Boolean with true and false.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_Bool
             */
            PTK_Bool = 2,
            /**
             * 8 bit signed integer type.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_Int8
             */
            PTK_Int8 = 3,
            /**
             * 8 bit unsigned integer type.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_UInt8
             */
            PTK_UInt8 = 4,
            /**
             * 16 bit signed integer type.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_Int16
             */
            PTK_Int16 = 5,
            /**
             * 16 bit unsigned integer type.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_UInt16
             */
            PTK_UInt16 = 6,
            /**
             * 32 bit signed integer type.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_Int32
             */
            PTK_Int32 = 7,
            /**
             * 32 bit unsigned integer type.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_UInt32
             */
            PTK_UInt32 = 8,
            /**
             * 64 bit signed integer type.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_Int64
             */
            PTK_Int64 = 9,
            /**
             * 64 bit unsigned integer type.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_UInt64
             */
            PTK_UInt64 = 10,
            /**
             * 32 bit single-precision floating-point type.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_Float32
             */
            PTK_Float32 = 11,
            /**
             * 64 bit double-precision floating-point type.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_Float64
             */
            PTK_Float64 = 12,
            /**
             * Duration in nanoseconds.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_Duration
             */
            PTK_Duration = 13,
            /**
             * Absolute time in nanoseconds.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_DateTime
             */
            PTK_DateTime = 14,
            /**
             * 8 bit character string.
             * 
             * @id Smp.PrimitiveTypeKind.PTK_String8
             */
            PTK_String8 = 15
        }

        /**
         * A component collection is an ordered collection of components, which allows iterating all members.
         * 
         * @uuid d55b0e81-e618-11dc-ab64-bf8df6d7b83a
         * @location Smp/IComponent.h
         * @type ICollection<IComponent>
         * @namespace Smp
         * @id Smp.ComponentCollection
         */
        public native ComponentCollection


        /**
         * A failure collection is an ordered collection of failures, which allows iterating all members.
         * 
         * @uuid d572db3a-e618-11dc-ab64-bf8df6d7b83a
         * @location Smp/IFailure.h
         * @type ICollection<IFailure>
         * @namespace Smp
         * @id Smp.FailureCollection
         */
        public native FailureCollection


        /**
         * A field collection is an ordered collection of fields, which allows iterating all members.
         * 
         * @uuid 9b7c7cbe-cc52-11e6-a1c3-13e36fcced83
         * @location Smp/IField.h
         * @type ICollection<IField>
         * @namespace Smp
         * @id Smp.FieldCollection
         */
        public native FieldCollection


        /**
         * A field collection is an ordered collection of operations, which allows iterating all members.
         * 
         * @uuid 8a44a5be-cc2d-11e9-abb3-9f6a2356f7e2
         * @location Smp/IOperation.h
         * @type ICollection<IOperation>
         * @namespace Smp
         * @id Smp.OperationCollection
         */
        public native OperationCollection


        /**
         * A parameter collection is an ordered collection of parameters, which allows iterating all members.
         * 
         * @uuid 0dedc8b4-cc39-11e9-abb3-9f6a2356f7e2
         * @location Smp/IParameter.h
         * @type ICollection<IParameter>
         * @namespace Smp
         * @id Smp.ParameterCollection
         */
        public native ParameterCollection


        /**
         * A field collection is an ordered collection of properties, which allows iterating all members.
         * 
         * @uuid 8a44a5b9-cc2d-11e9-abb3-9f6a2356f7e2
         * @location Smp/IProperty.h
         * @type ICollection<IProperty>
         * @namespace Smp
         * @id Smp.PropertyCollection
         */
        public native PropertyCollection


        /**
         * This is an enumeration of the available states of a component. Each component is always in one of these four component states.
         * 
         * @uuid d55d57c7-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.ComponentStateKind
         */
        public enum ComponentStateKind
        {
            /**
             * The Created state is the initial state of a component. Component creation is done by an external mechanism, e.g. by factories.
             * This state is entered automatically after the component has been created.
             * This state is left via the Publish() state transition.
             * 
             * @id Smp.ComponentStateKind.CSK_Created
             */
            CSK_Created = 0,
            /**
             * In Publishing state, the component is allowed to publish features. This includes publication of fields, operations and properties. In addition, the component is allowed to create other components.
             * This state is entered via the Publish() state transition.
             * This state is left via the Configure() state transition.
             * 
             * @id Smp.ComponentStateKind.CSK_Publishing
             */
            CSK_Publishing = 1,
            /**
             * In Configured state, the component has been fully configured. This configuration may be done by external components, or internally by the component itself, e.g. by reading data from an external source.
             * This state is entered via the Configure() state transition.
             * This state is left via the Connect() state transition.
             * 
             * @id Smp.ComponentStateKind.CSK_Configured
             */
            CSK_Configured = 2,
            /**
             * In Connected state, the component is connected to the simulator. In this state, neither publication nor creation of other components is allowed anymore. Configuration performed via loading of SMDL configuration file and/or calling of initialisation entry point are performed in this state.
             * This state is entered via the Connect() state transition.
             * This state is left via the Disconnect() state transition or on simulation termination.
             * 
             * @id Smp.ComponentStateKind.CSK_Connected
             */
            CSK_Connected = 3,
            /**
             * In Disconnected state, the component is disconnected from the simulator, and all references to it are deleted, so that it can be deleted.
             * This state is entered via the Disconnect() state transition.
             * This is the final state of a component, and only left on deletion.
             * 
             * @id Smp.ComponentStateKind.CSK_Disconnected
             */
            CSK_Disconnected = 4
        }

        /**
         * Interface for a model.
         * 
         * @uuid d55d57da-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IModel
         */
        public interface IModel extends Smp.IComponent
        {
        }

        /**
         * This exception is raised when trying to add an object to a collection of objects, which have to have unique names, but another object with the same name does exist already in this collection. This would lead to duplicate names.
         * 
         * @uuid d56baf6e-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.DuplicateName
         */
        public exception DuplicateName extends Smp.Exception
        {
            /**
             * Get the name that already exists in the collection.
             * 
             * @return Name that already exists in the collection.
             * @id Smp.DuplicateName.GetDuplicateName
             */
            public def Smp.String8 GetDuplicateName ()
        }

        /**
         * Array of AnySimple values.
         * 
         * @uuid d55b0e53-e618-11dc-ab64-bf8df6d7b83a
         * @location Smp/AnySimple.h
         * @type AnySimple*
         * @id Smp.AnySimpleArray
         */
        public native AnySimpleArray


        /**
         * A model collection is an ordered collection of models, which allows iterating all members.
         * 
         * @uuid d55d57fd-e618-11dc-ab64-bf8df6d7b83a
         * @location Smp/IModel.h
         * @type ICollection<IModel>
         * @namespace Smp
         * @id Smp.ModelCollection
         */
        public native ModelCollection


        /**
         * Interface for a service.
         * 
         * @uuid d55d57d1-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IService
         */
        public interface IService extends Smp.IComponent
        {
        }

        /**
         * This exception is raised when trying to use an AnySimple argument of wrong type.
         * 
         * @uuid d56baf73-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidAnyType
         */
        public exception InvalidAnyType extends Smp.Exception
        {
            /**
             * Get the type that is not valid.
             * 
             * @return Type that is not valid.
             * @id Smp.InvalidAnyType.GetInvalidType
             */
            public def Smp.PrimitiveTypeKind GetInvalidType ()

            /**
             * Get the type that was expected.
             * 
             * @return Type that was expected.
             * @id Smp.InvalidAnyType.GetExpectedType
             */
            public def Smp.PrimitiveTypeKind GetExpectedType ()
        }

        /**
         * A service collection is an ordered collection of services, which allows iterating all members.
         * 
         * @uuid d55d57d5-e618-11dc-ab64-bf8df6d7b83a
         * @location Smp/IService.h
         * @type ICollection<IService>
         * @namespace Smp
         * @id Smp.ServiceCollection
         */
        public native ServiceCollection


        /**
         * Interface for an aggregate component.
         * 
         * @uuid d55fc83f-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IAggregate
         */
        public interface IAggregate extends Smp.IComponent
        {
            /**
             * Query for the collection of all references of the aggregate component.
             * 
             * @return Collection of references.
             * @id Smp.IAggregate.GetReferences
             */
            @Attributes.Const
            def @Attributes.Const @Attributes.ByPointer Smp.ReferenceCollection GetReferences ()

            /**
             * Query for a reference of this aggregate component by its name.
             * 
             * @param name
             *       Reference name.
             * @return Reference queried for by name, or null if no reference with this name exists.
             * @id Smp.IAggregate.GetReference
             */
            @Attributes.Const
            def Smp.IReference GetReference (Smp.String8 name)
        }

        /**
         * This exception is raised when trying to pass an object of wrong type.
         * 
         * @uuid d56baf7b-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidObjectType
         */
        public exception InvalidObjectType extends Smp.Exception
        {
            /**
             * Get the object that is not of valid type.
             * 
             * @return Object that is not of valid type.
             * @id Smp.InvalidObjectType.GetInvalidObject
             */
            public def @Attributes.Const Smp.IObject GetInvalidObject ()
        }

        /**
         * Interface of an event consumer.
         * 
         * @uuid d53e5df4-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IEventConsumer
         */
        public interface IEventConsumer extends Smp.IComponent
        {
            /**
             * Query for the collection of all event sinks of the component.
             * 
             * @return Collection of event sinks.
             * @id Smp.IEventConsumer.GetEventSinks
             */
            @Attributes.Const
            def @Attributes.Const @Attributes.ByPointer Smp.EventSinkCollection GetEventSinks ()

            /**
             * Query for an event sink of this component by its name.
             * 
             * @param name
             *       Event sink name.
             * @return Event sink with the given name, or null if no event sink with the given name could be found.
             * @id Smp.IEventConsumer.GetEventSink
             */
            @Attributes.Const
            def Smp.IEventSink GetEventSink (Smp.String8 name)
        }

        /**
         * Interface for a reference.
         * 
         * @uuid d55fc829-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IReference
         */
        public interface IReference extends Smp.IObject
        {
            /**
             * Query for the collection of all referenced components.
             * 
             * @return Collection of referenced components.
             * @id Smp.IReference.GetComponents
             */
            @Attributes.Const
            def @Attributes.Const @Attributes.ByPointer Smp.ComponentCollection GetComponents ()

            /**
             * Query for a referenced component by its name.
             * 
             * @param name
             *       Component name.
             * @return Referenced component with the given name, or null if no referenced component with the given name could be found.
             *       If multiple components matching the given name argument are found, it returns one of the references.
             * @id Smp.IReference.GetComponent
             */
            @Attributes.Const
            def Smp.IComponent GetComponent (Smp.String8 name)

            /**
             * Add a referenced component.
             * 
             * @param component
             *       New referenced component.
             * @id Smp.IReference.AddComponent
             */
            def void AddComponent (inout Smp.IComponent component) throws Smp.ReferenceFull, Smp.InvalidObjectType

            /**
             * Remove a referenced component.
             * 
             * @param component
             *       Referenced component to remove.
             * @id Smp.IReference.RemoveComponent
             */
            def void RemoveComponent (inout Smp.IComponent component) throws Smp.NotReferenced, Smp.CannotRemove

            /**
             * Query for the number of components in the collection.
             * 
             * @return Current number of components in the collection.
             * @id Smp.IReference.GetCount
             */
            @Attributes.Const
            def Smp.Int64 GetCount ()

            /**
             * Query the maximum number of components in the collection.
             * 
             * @return Maximum number of components in the collection (-1 = unlimited).
             * @id Smp.IReference.GetUpper
             */
            @Attributes.Const
            def Smp.Int64 GetUpper ()

            /**
             * Query the minimum number of components in the collection.
             * 
             * @return Minimum number of components in the collection or 0 when no minimum number has been defined.
             * @id Smp.IReference.GetLower
             */
            @Attributes.Const
            def Smp.Int64 GetLower ()
        }

        /**
         * This exception is raised when trying to add a component to a container that is full, i.e. where the Count has reached the Upper limit.
         * 
         * @uuid d53c13c4-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.ContainerFull
         */
        public exception ContainerFull extends Smp.Exception
        {
            /**
             * Get the name of the full container.
             * 
             * @return Name of the full container.
             * @id Smp.ContainerFull.GetContainerName
             */
            public def Smp.String8 GetContainerName ()

            /**
             * Get the size of the full container.
             * 
             * @return Size of the full container.
             * @id Smp.ContainerFull.GetContainerSize
             */
            public def Smp.Int64 GetContainerSize ()
        }

        /**
         * A reference collection is an ordered collection of references, which allows iterating all members.
         * 
         * @uuid d55fc83a-e618-11dc-ab64-bf8df6d7b83a
         * @location Smp/IReference.h
         * @type ICollection<IReference>
         * @namespace Smp
         * @id Smp.ReferenceCollection
         */
        public native ReferenceCollection


        /**
         * Interface for a composite.
         * 
         * @uuid d55d5818-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IComposite
         */
        public interface IComposite extends Smp.IObject
        {
            /**
             * Query for the collection of all containers of the composite.
             * 
             * @return Collection of containers.
             * @id Smp.IComposite.GetContainers
             */
            @Attributes.Const
            def @Attributes.Const @Attributes.ByPointer Smp.ContainerCollection GetContainers ()

            /**
             * Query for a container of this composite by its name.
             * 
             * @param name
             *       Container name.
             * @return Container queried for by name, or null if no container with this name exists.
             * @id Smp.IComposite.GetContainer
             */
            @Attributes.Const
            def Smp.IContainer GetContainer (Smp.String8 name)
        }

        /**
         * Interface of an event provider.
         * 
         * @uuid d53e5de3-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IEventProvider
         */
        public interface IEventProvider extends Smp.IComponent
        {
            /**
             * Query for the collection of all event sources of the component.
             * 
             * @return Collection of event sources.
             * @id Smp.IEventProvider.GetEventSources
             */
            @Attributes.Const
            def @Attributes.Const @Attributes.ByPointer Smp.EventSourceCollection GetEventSources ()

            /**
             * Query for an event source of this component by its name.
             * 
             * @param name
             *       Event source name.
             * @return Event source with the given name or null if no event source with the given name could be found.
             * @id Smp.IEventProvider.GetEventSource
             */
            @Attributes.Const
            def Smp.IEventSource GetEventSource (Smp.String8 name)
        }

        /**
         * This exception is raised when trying to assign an illegal value to a field.
         * 
         * @uuid d579e02c-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.InvalidFieldValue
         */
        public exception InvalidFieldValue extends Smp.Exception
        {
            /**
             * Get the value that was passed as new field value.
             * 
             * @return Value that was passed as new field value.
             * @id Smp.InvalidFieldValue.GetInvalidFieldValue
             */
            public def Smp.AnySimple GetInvalidFieldValue ()
        }

        /**
         * Interface for a container.
         * 
         * @uuid d55d5802-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IContainer
         */
        public interface IContainer extends Smp.IObject
        {
            /**
             * Query for the collection of all components in the container.
             * 
             * @return Collection of contained components.
             * @id Smp.IContainer.GetComponents
             */
            @Attributes.Const
            def @Attributes.Const @Attributes.ByPointer Smp.ComponentCollection GetComponents ()

            /**
             * Query for a component contained in the container by name.
             * 
             * @param name
             *       Component name.
             * @return Child component, or null if no child component with the given name exists.
             * @id Smp.IContainer.GetComponent
             */
            @Attributes.Const
            def Smp.IComponent GetComponent (Smp.String8 name)

            /**
             * Add a contained component to the container.
             * 
             * @param component
             *       New contained component.
             * @id Smp.IContainer.AddComponent
             */
            def void AddComponent (
                    inout Smp.IComponent component) throws Smp.ContainerFull, Smp.DuplicateName, Smp.InvalidObjectType

            /**
             * Delete a contained component from the container, and from memory.
             * 
             * @param component
             *       Component to delete from container, and from memory.
             * @id Smp.IContainer.DeleteComponent
             */
            def void DeleteComponent (inout Smp.IComponent component) throws Smp.CannotDelete, Smp.NotContained

            /**
             * Query for the number of components in the collection.
             * 
             * @return Current number of components in the collection.
             * @id Smp.IContainer.GetCount
             */
            @Attributes.Const
            def Smp.Int64 GetCount ()

            /**
             * Query the maximum number of components in the collection.
             * 
             * @return Maximum number of components in the collection (-1 = unlimited).
             * @id Smp.IContainer.GetUpper
             */
            @Attributes.Const
            def Smp.Int64 GetUpper ()

            /**
             * Query the minimum number of components in the collection.
             * 
             * @return Minimum number of components in the collection or 0 when no minimum number has been defined.
             * @id Smp.IContainer.GetLower
             */
            @Attributes.Const
            def Smp.Int64 GetLower ()
        }

        /**
         * A container collection is an ordered collection of containers, which allows iterating all members.
         * 
         * @uuid d55d5813-e618-11dc-ab64-bf8df6d7b83a
         * @location Smp/IContainer.h
         * @type ICollection<IContainer>
         * @namespace Smp
         * @id Smp.ContainerCollection
         */
        public native ContainerCollection


        /**
         * Interface of an entry point publisher.
         * 
         * @uuid d53e5e05-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IEntryPointPublisher
         */
        public interface IEntryPointPublisher extends Smp.IObject
        {
            /**
             * Query for the collection of all entry points of the component.
             * 
             * @return Collection of entry points.
             * @id Smp.IEntryPointPublisher.GetEntryPoints
             */
            @Attributes.Const
            def @Attributes.Const @Attributes.ByPointer Smp.EntryPointCollection GetEntryPoints ()

            /**
             * Query for an entry point of this component by its name.
             * 
             * @param name
             *       Entry point name.
             * @return Entry point with given name, or null if no entry point with given name could be found.
             * @id Smp.IEntryPointPublisher.GetEntryPoint
             */
            @Attributes.Const
            def Smp.IEntryPoint GetEntryPoint (Smp.String8 name)
        }

        /**
         * Interface of an event sink that can be subscribed to an event source (IEventSource).
         * 
         * @uuid d55d5787-e618-11dc-ab64-bf8df6d7b83a
         * @id Smp.IEventSink
         */
        public interface IEventSink extends Smp.IObject
        {
            /**
             * Get the primitive type kind of the event argument.
             * Use PTK_None for an event without an argument.
             * 
             * @return Primitive type kind of the event argument, or PTK_None for none.
             * @id Smp.IEventSink.GetEventArgType
             */
            @Attributes.Const
            def Smp.PrimitiveTypeKind GetEventArgType ()

            /**
             * This event handler method is called when an event is emitted.
             * 
             * @param sender
             *       Object emitting the event.
             * @param arg
             *       Event argument with context data for event notification.
             *       The type of the event argument (PTK_None or one of the existing Primitive Type Kinds) depends on the type of the event sink.
             * @id Smp.IEventSink.Notify
             */
            def void Notify (inout Smp.IObject sender, Smp.AnySimple arg)
        }

        /**
         * An event sink collection is an ordered collection of event sinks, which allows iterating all members.
         * 
         * @uuid d55d5797-e618-11dc-ab64-bf8df6d7b83a
         * @location Smp/IEventSink.h
         * @type ICollection<IEventSink>
         * @namespace Smp
         * @id Smp.EventSinkCollection
         */
        public native EventSinkCollection
    } // namespace Smp
    `]
]);

