import * as ast from '../../generated/ast.js';
import * as fs from 'fs';
import { expandToString as s } from 'langium/generate';
import { type URI, UriUtils } from 'langium';
import { fqn, getNativeNamespace, getNativeType, getUnit, isInput, isOutput, isSimpleArray, isState, isStatic } from '../../utils/xsmp-utils.js';
import { CppGenerator, CxxStandard } from './generator.js';
import type { TaskAcceptor } from '../generator.js';
import type { XsmpSharedServices } from '../../xsmp-module.js';

export class GapPatternCppGenerator extends CppGenerator {

    protected static readonly defaultIncludeGenFolder = 'src-gen';
    protected static readonly defaultSourceGenFolder = 'src-gen';
    protected readonly includeGenFolder = GapPatternCppGenerator.defaultIncludeGenFolder;
    protected readonly sourceGenFolder = GapPatternCppGenerator.defaultSourceGenFolder;
    constructor(services: XsmpSharedServices, cxxStandard: CxxStandard) {
        super(services, cxxStandard);
    }

    override clean(projectUri: URI) {
        fs.rmSync(UriUtils.joinPath(projectUri, this.includeGenFolder).fsPath, { recursive: true, force: true });
        fs.rmSync(UriUtils.joinPath(projectUri, this.sourceGenFolder).fsPath, { recursive: true, force: true });
    }
    protected useGenerationGapPattern(type: ast.Type): boolean {
        return ast.isReferenceType(type);
    }

    protected override generateType(type: ast.Type, projectUri: URI, notice: string | undefined, acceptTask: TaskAcceptor) {

        const qualifiedName = fqn(type, '/');

        // include path of user code
        const includePath = UriUtils.joinPath(projectUri, this.includeFolder, qualifiedName + '.h').fsPath;

        // if the file already exist in include directories or the type requires the generation gap
        // pattern, use the generation gap pattern
        const includePathExist = fs.existsSync(includePath);
        const useGenerationGapPattern = includePathExist || this.useGenerationGapPattern(type);

        // generate header in include directory
        if (useGenerationGapPattern && !includePathExist) {
            acceptTask(() => this.generateHeader(includePath, type, notice));
        }

        // generate source in src directory if file does not exist
        const sourcePath = UriUtils.joinPath(projectUri, this.sourceFolder, qualifiedName + '.cpp').fsPath;
        if (!fs.existsSync(sourcePath)) {
            acceptTask(() => this.generateSource(sourcePath, type, notice));
        }

        const qualifiedNameGen = useGenerationGapPattern ? qualifiedName + 'Gen' : qualifiedName;

        const includeGenPath = UriUtils.joinPath(projectUri, this.includeGenFolder, qualifiedNameGen + '.h').fsPath;
        acceptTask(() => this.generateHeaderGen(includeGenPath, type, useGenerationGapPattern, notice));

        const sourceGenPath = UriUtils.joinPath(projectUri, this.sourceGenFolder, qualifiedNameGen + '.cpp').fsPath;
        acceptTask(() => this.generateSourceGen(sourceGenPath, type, useGenerationGapPattern, notice));
    }

    public async generateHeader(path: string, type: ast.Type, notice: string | undefined) {
        let body: string | undefined;
        switch (type.$type) {
            case ast.Class:
                body = await this.generateClassHeader(type as ast.Class);
                break;
            case ast.Exception:
                body = await this.generateExceptionHeader(type as ast.Exception);
                break;
            case ast.Structure:
                body = await this.generateStructureHeader(type as ast.Structure);
                break;
            case ast.Integer:
                body = await this.generateIntegerHeader(type as ast.Integer);
                break;
            case ast.Float:
                body = await this.generateFloatHeader(type as ast.Float);
                break;
            case ast.Model:
            case ast.Service:
                body = await this.generateComponentHeader(type as ast.Component);
                break;
            case ast.Interface:
                body = await this.generateInterfaceHeader(type as ast.Interface);
                break;
            case ast.ArrayType:
                body = await this.generateArrayHeader(type as ast.ArrayType);
                break;
            case ast.Enumeration:
                body = await this.generateEnumerationHeader(type as ast.Enumeration);
                break;
            case ast.StringType:
                body = await this.generateStringHeader(type as ast.StringType);
                break;
            case ast.NativeType:
                body = await this.generateNativeTypeHeader(type as ast.NativeType);
                break;
        }
        if (body?.length) {
            await this.generateFile(path, s`
                ${notice}
                // -----------------------------------------------------------------------------
                // File Name    : ${type.name}.h
                // Generated by : «generatedBy()»
                // -----------------------------------------------------------------------------
                /// @file ${fqn(type, '/')}.h

                // Include the generated header file
                #include <${fqn(type, '/')}Gen.h>

                ${this.namespace(type, body)}
                `);
        }
    }

    public async generateSource(path: string, type: ast.Type, notice: string | undefined) {
        let body: string | undefined;
        switch (type.$type) {
            case ast.Class:
                body = await this.generateClassSource(type as ast.Class);
                break;
            case ast.Exception:
                body = await this.generateExceptionSource(type as ast.Exception);
                break;
            case ast.Structure:
                body = await this.generateStructureSource(type as ast.Structure);
                break;
            case ast.Integer:
                body = await this.generateIntegerSource(type as ast.Integer);
                break;
            case ast.Float:
                body = await this.generateFloatSource(type as ast.Float);
                break;
            case ast.Model:
            case ast.Service:
                body = await this.generateComponentSource(type as ast.Component);
                break;
            case ast.Interface:
                body = await this.generateInterfaceSource(type as ast.Interface);
                break;
            case ast.ArrayType:
                body = await this.generateArraySource(type as ast.ArrayType);
                break;
            case ast.Enumeration:
                body = await this.generateEnumerationSource(type as ast.Enumeration);
                break;
            case ast.StringType:
                body = await this.generateStringSource(type as ast.StringType);
                break;
            case ast.NativeType:
                body = await this.generateNativeTypeSource(type as ast.NativeType);
                break;
        }
        if (body?.length) {
            await this.generateFile(path, s`
                ${notice}
                // -----------------------------------------------------------------------------
                // File Name    : ${type.name}.cpp
                // Generated by : «generatedBy()»
                // -----------------------------------------------------------------------------
                /// @file ${fqn(type, '/')}.cpp

                #include <${fqn(type, '/')}.h>

                ${this.namespace(type, body)}
                `);
        }
    }
    public async generateHeaderGen(path: string, type: ast.Type, useGenerationGapPattern: boolean, notice: string | undefined) {
        let body: string | undefined;
        switch (type.$type) {
            case ast.Class:
                body = await this.generateClassHeaderGen(type as ast.Class, useGenerationGapPattern);
                break;
            case ast.Exception:
                body = await this.generateExceptionHeaderGen(type as ast.Exception, useGenerationGapPattern);
                break;
            case ast.Structure:
                body = await this.generateStructureHeaderGen(type as ast.Structure, useGenerationGapPattern);
                break;
            case ast.Integer:
                body = await this.generateIntegerHeaderGen(type as ast.Integer, useGenerationGapPattern);
                break;
            case ast.Float:
                body = await this.generateFloatHeaderGen(type as ast.Float, useGenerationGapPattern);
                break;
            case ast.Model:
            case ast.Service:
                body = await this.generateComponentHeaderGen(type as ast.Component, useGenerationGapPattern);
                break;
            case ast.Interface:
                body = await this.generateInterfaceHeaderGen(type as ast.Interface, useGenerationGapPattern);
                break;
            case ast.ArrayType:
                body = await this.generateArrayHeaderGen(type as ast.ArrayType, useGenerationGapPattern);
                break;
            case ast.Enumeration:
                body = await this.generateEnumerationHeaderGen(type as ast.Enumeration, useGenerationGapPattern);
                break;
            case ast.StringType:
                body = await this.generateStringHeaderGen(type as ast.StringType, useGenerationGapPattern);
                break;
            case ast.NativeType:
                body = await this.generateNativeTypeHeaderGen(type as ast.NativeType, useGenerationGapPattern);
                break;
        }
        if (body?.length) {
            await this.generateFile(path, s`
                ${notice}
                // -----------------------------------------------------------------------------
                // File Name    : ${type.name}${useGenerationGapPattern ? 'Gen' : ''}.h
                // Generated by : «generatedBy()»
                // -----------------------------------------------------------------------------
                /// @file ${fqn(type, '/')}${useGenerationGapPattern ? 'Gen' : ''}.h
                // This file is auto-generated, Do not edit otherwise your changes will be lost

                ${this.namespace(type, body)}
                `);
        }
    }

    public async generateSourceGen(path: string, type: ast.Type, useGenerationGapPattern: boolean, notice: string | undefined) {
        let body: string | undefined;
        switch (type.$type) {
            case ast.Class:
                body = await this.generateClassSourceGen(type as ast.Class, useGenerationGapPattern);
                break;
            case ast.Exception:
                body = await this.generateExceptionSourceGen(type as ast.Exception, useGenerationGapPattern);
                break;
            case ast.Structure:
                body = await this.generateStructureSourceGen(type as ast.Structure, useGenerationGapPattern);
                break;
            case ast.Integer:
                body = await this.generateIntegerSourceGen(type as ast.Integer, useGenerationGapPattern);
                break;
            case ast.Float:
                body = await this.generateFloatSourceGen(type as ast.Float, useGenerationGapPattern);
                break;
            case ast.Model:
            case ast.Service:
                body = await this.generateComponentSourceGen(type as ast.Component, useGenerationGapPattern);
                break;
            case ast.Interface:
                body = await this.generateInterfaceSourceGen(type as ast.Interface, useGenerationGapPattern);
                break;
            case ast.ArrayType:
                body = await this.generateArraySourceGen(type as ast.ArrayType, useGenerationGapPattern);
                break;
            case ast.Enumeration:
                body = await this.generateEnumerationSourceGen(type as ast.Enumeration, useGenerationGapPattern);
                break;
            case ast.StringType:
                body = await this.generateStringSourceGen(type as ast.StringType, useGenerationGapPattern);
                break;
            case ast.NativeType:
                body = await this.generateNativeTypeSourceGen(type as ast.NativeType, useGenerationGapPattern);
                break;
        }
        if (body?.length) {
            await this.generateFile(path, s`
                ${notice}
                // -----------------------------------------------------------------------------
                // File Name    : ${type.name}${useGenerationGapPattern ? 'Gen' : ''}.cpp
                // Generated by : «generatedBy()»
                // -----------------------------------------------------------------------------
                /// @file ${fqn(type, '/')}${useGenerationGapPattern ? 'Gen' : ''}.cpp
                // This file is auto-generated, Do not edit otherwise your changes will be lost

                ${this.namespace(type, body)}
                `);
        }
    }
    async generateTypeHeader(type: ast.Type): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        using ${type.name} = ${type.name}Gen;
        `;
    }

    async generateClassHeader(type: ast.Class): Promise<string | undefined> {
        return s`
            ${this.comment(type)}
            class ${type.name}: public ${type.name}Gen
            {
                friend class ${this.fqn(type)}Gen;
            public:
                ${type.name}()=default;
                ${type.name}(const ${type.name}&)=default;
                //«declareMembers(VisibilityKind.PUBLIC)»
            };
        `;
    }
    async generateClassSource(type: ast.Class): Promise<string | undefined> {
        return s`
        //«defineMembers(useGenPattern)»
        `;
    }
    async generateClassHeaderGen(type: ast.Class, gen: boolean): Promise<string | undefined> {
        const base = this.fqn(type.base?.ref, ast.isException(type) ? '::Smp::Exception' : undefined);
        return s`
        ${gen ? `class ${type.name};` : ''}
        ${this.comment(type)}
        class ${type.name}${gen ? 'Gen' : ''}${base ? `: public ${base}` : ''}
        {
            ${gen ? `friend class ${this.fqn(type)};` : ''}
        public:
            static void _Register(::Smp::Publication::ITypeRegistry* registry);
            
            //«IF constructor»${type.name}${gen ? 'Gen' : ''} () = default;«ENDIF»
            //«IF destructor»~${type.name}${gen ? 'Gen' : ''} () noexcept = default;«ENDIF»
            ${type.name}${gen ? 'Gen' : ''} (const ${type.name}${gen ? 'Gen' : ''} &) = default;
            
            //«declareMembersGen(useGenPattern, VisibilityKind.PUBLIC)»
        };
        
        ${this.uuidDeclaration(type)}
        `;
    }
    async generateClassSourceGen(type: ast.Class, gen: boolean): Promise<string | undefined> {
        const fields = type.elements.filter(ast.isField);
        return s`
        void ${type.name}${gen ? 'Gen' : ''} ::_Register(::Smp::Publication::ITypeRegistry* registry) 
        {
            ${fields.length > 0 ? 'auto *type = ' : ''}registry->AddClassType(
                "${type.name}",  /// Name
                ${this.description(type)},   /// description
                ${this.uuid(type)}, /// UUID
                ${this.uuid(type.base?.ref)} /// Base Class UUID
                ); 
            
            ${fields.length > 0 ? '/// Register the Fields of the Class' : ''}
            ${fields.map(f => `
                  type->AddField(
                    "${f.name}",
                    ${this.description(f)},
                    ${this.uuid(f.type.ref)}, /// UUID of the Field Type
                    offsetof(${type.name}, ${f.name}), ///Compute the offset of the current item
                    ${this.viewKind(f)}, /// viewkind
                    ${isState(f)}, /// state
                    ${isInput(f)}, /// input
                    ${isOutput(f)}/// output
                    );  
                `).join('\n')}
        }
        //«defineMembersGen(useGenPattern)»
        
        ${this.uuidDefinition(type)}
        `;
    }
    async generateExceptionHeader(type: ast.Exception): Promise<string | undefined> {
        return this.generateClassHeader(type);
    }

    async generateExceptionSource(type: ast.Exception): Promise<string | undefined> {
        return this.generateClassSource(type);
    }

    async generateExceptionHeaderGen(type: ast.Exception, gen: boolean): Promise<string | undefined> {
        return this.generateClassHeaderGen(type, gen);
    }

    async generateExceptionSourceGen(type: ast.Exception, gen: boolean): Promise<string | undefined> {
        return this.generateClassSourceGen(type, gen);
    }
    async generateStructureHeader(type: ast.Structure): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        struct ${type.name} : public ${type.name}Gen 
        {
            //«declareMembers(VisibilityKind.PUBLIC)»
        };
        `;
    }

    async generateStructureSource(type: ast.Structure): Promise<string | undefined> {
        return undefined;
    }

    async generateStructureHeaderGen(type: ast.Structure, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        struct ${type.name}${gen ? 'Gen' : ''}  
        {
            «declareMembersGen(useGenPattern,  VisibilityKind.PUBLIC)»
            
           // «IF hasConstructor»
                ${type.name}${gen ? 'Gen' : ''} (/*«FOR f : member.filter(Field) SEPARATOR ", "»«f.type.id» «f.name» = «IF f.^default !== null»«f.^default.generateExpression()»«ELSE»{}«ENDIF»«ENDFOR»*/)//:
                        //«FOR f : member.filter(Field) SEPARATOR ", "»«f.name»(«f.name»)«ENDFOR» {}
                ~${type.name}${gen ? 'Gen' : ''} () = default;
                ${type.name}${gen ? 'Gen' : ''} (const ${type.name}${gen ? 'Gen' : ''}  &) = default;
                ${type.name}${gen ? 'Gen' : ''} (${type.name}${gen ? 'Gen' : ''}  &&) = default;
                ${type.name}${gen ? 'Gen' : ''} & operator=(const ${type.name}${gen ? 'Gen' : ''}  &) = default;
                
            //«ENDIF»
            static void _Register(::Smp::Publication::ITypeRegistry* registry);
        };
        
        ${this.uuidDeclaration(type)}
        `;
    }

    async generateStructureSourceGen(type: ast.Structure, gen: boolean): Promise<string | undefined> {
        const fields = type.elements.filter(ast.isField);
        return s`
        void ${type.name}${gen ? 'Gen' : ''} ::_Register(::Smp::Publication::ITypeRegistry* registry) 
        {
                ${fields.length > 0 ? 'auto *type = ' : ''}registry->AddStructureType(
                "${type.name}",  /// Name
                ${this.description(type)}, /// description
                ${this.uuid(type)} /// UUID
                ); 
                
            ${fields.length > 0 ? '/// Register the Fields of the Class' : ''}
            ${fields.map(f => `
                  type->AddField(
                    "${f.name}",
                    ${this.description(f)},
                    ${this.uuid(f.type.ref)}, /// UUID of the Field Type
                    offsetof(${type.name}, ${f.name}), ///Compute the offset of the current item
                    ${this.viewKind(f)}, /// viewkind
                    ${isState(f)}, /// state
                    ${isInput(f)}, /// input
                    ${isOutput(f)}/// output
                    );  
                `).join('\n')}
        }
        «defineMembersGen(useGenPattern)»
        
        ${this.uuidDefinition(type)}
        `;
    }

    async generateIntegerHeader(type: ast.Integer): Promise<string | undefined> {
        return this.generateTypeHeader(type);
    }
    async generateIntegerSource(type: ast.Integer): Promise<string | undefined> {
        return undefined;
    }

    async generateIntegerHeaderGen(type: ast.Integer, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.uuidDeclaration(type)}
        ${this.comment(type)}
        using ${type.name}${gen ? 'Gen' : ''}  = ${this.fqn(type.primitiveType?.ref, '::Smp::Int32')};
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry);
        `;
    }

    async generateIntegerSourceGen(type: ast.Integer, gen: boolean): Promise<string | undefined> {
        return s`
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry) {
            registry->AddIntegerType(
                "${type.name}", //Name
                ${this.description(type)}, //description
                ${this.uuid(type)}, //UUID
                ${type.minimum ? this.expression(type.minimum) : `std::numeric_limits<${this.fqn(type.primitiveType?.ref, '::Smp::Int32')}>::min()`}, // Minimum
                ${type.maximum ? this.expression(type.maximum) : `std::numeric_limits<${this.fqn(type.primitiveType?.ref, '::Smp::Int32')}>::max()`}, // Maximum
                "${getUnit(type)}", // Unit
                ${this.primitiveTypeKind(type)} // Primitive Type Kind
            );
        }
        ${this.uuidDefinition(type)}
        `;
    }
    async generateFloatHeader(type: ast.Float): Promise<string | undefined> {
        return this.generateTypeHeader(type);
    }

    async generateFloatSource(type: ast.Float): Promise<string | undefined> {
        return undefined;
    }
    async generateFloatHeaderGen(type: ast.Float, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.uuidDeclaration(type)}
        ${this.comment(type)}
        using ${type.name}${gen ? 'Gen' : ''}  = ${this.fqn(type.primitiveType?.ref, '::Smp::Float64')};
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry);
        `;
    }

    async generateFloatSourceGen(type: ast.Float, gen: boolean): Promise<string | undefined> {
        return s`
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry) {
        registry->AddFloatType(
            "${type.name}", //Name
            ${this.description(type)}, //description
            ${this.uuid(type)}, //UUID
            ${type.minimum ? this.expression(type.minimum) : `std::numeric_limits<${this.fqn(type.primitiveType?.ref, '::Smp::Float64')}>::min()`}, // Minimum
            ${type.maximum ? this.expression(type.maximum) : `std::numeric_limits<${this.fqn(type.primitiveType?.ref, '::Smp::Float64')}>::max()`}, // Maximum
            ${type.range !== '<..' && type.range !== '<.<'}, // Minimm inclusive
            ${type.range !== '..<' && type.range !== '<.<'}, // Maximim inclusive
            "${getUnit(type)}", // Unit
            ${this.primitiveTypeKind(type)} // Primitive Type Kind
        );  
    }
    ${this.uuidDefinition(type)}
    `;
    }
    async generateComponentHeader(type: ast.Component): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        class ${type.name}: public ${type.name}Gen {
        public:
            /// Re-use parent constructors
            using ${type.name}Gen::${type.name}Gen;
            
            /// Virtual destructor to release memory.
            ~${type.name}() noexcept override = default;
            
        private:
            // ${type.name}Gen call DoPublish/DoConfigure/DoConnect/DoDisconnect
            friend class ::${fqn(type, '::')}Gen;
            
            /// Publish fields, operations and properties of the model.
            /// @param receiver Publication receiver.
            void DoPublish(::Smp::IPublication* receiver);
            
            /// Request for configuration.
            /// @param logger Logger to use for log messages during Configure().
            /// @param linkRegistry Link Registry to use for registration of
            ///         links created during Configure() or later.
            void DoConfigure( ::Smp::Services::ILogger* logger, ::Smp::Services::ILinkRegistry* linkRegistry);
            
            /// Connect model to simulator.
            /// @param simulator Simulation Environment that hosts the model.
            ///
            void DoConnect( ::Smp::ISimulator* simulator);
            
            /// Disconnect model to simulator.
            void DoDisconnect();
        
            //«declareMembers(VisibilityKind.PRIVATE)»
        };
        `;
    }
    async generateInterfaceHeader(type: ast.Interface): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        class ${type.name}: public ${type.name}Gen {
        public:
            ~${type.name}() override = default;
            //«declareMembers(VisibilityKind.PRIVATE)»
        };
        `;
    }

    async generateInterfaceSource(type: ast.Interface): Promise<string | undefined> {
        return undefined;
    }
    async generateInterfaceHeaderGen(type: ast.Interface, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        class ${type.name}${gen ? 'Gen' : ''}${type.base.length > 0 ? ': ' : ''}${type.base.map(b => `public virtual ${this.fqn(b.ref)}`).join(', ')} {
            public:
            virtual ~${type.name}${gen ? 'Gen' : ''} () = default;
            //«declareMembersGen(useGenPattern, VisibilityKind.PUBLIC)»
        };
        
        ${this.uuidDeclaration(type)}
        `;
    }
    async generateInterfaceSourceGen(type: ast.Interface, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.uuidDefinition(type)}
        //«defineMembersGen(useGenPattern)»
        `;
    }

    async generateArrayHeader(type: ast.ArrayType): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        using ${type.name} = ::${type.name}Gen;
        `;
    }
    async generateArrayHeaderGen(type: ast.ArrayType, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        struct ${type.name}${gen ? 'Gen' : ''} 
        { 
            ${this.fqn(type.itemType.ref)} internalArray[${this.expression(type.size)}];
        };
        
        ${this.uuidDeclaration(type)}
        
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry);
        `;
    }
    async generateArraySource(type: ast.ArrayType): Promise<string | undefined> {
        return undefined;
    }
    async generateArraySourceGen(type: ast.ArrayType, gen: boolean): Promise<string | undefined> {
        return s`
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry) {
            registry->AddArrayType(
                "${type.name}", // Name
                ${this.description(type)}, // Description
                ${this.uuid(type)}, // UUID
                ${this.uuid(type.itemType.ref)}, // Item Type UUID
                sizeof(${this.fqn(type.itemType.ref)}), // Item Type size
                ${this.expression(type.size)}, // size of the array
                ${isSimpleArray(type) === true} // is simple array
            );
        }
        ${this.uuidDefinition(type)}
        `;
    }
    async generateEnumerationHeader(type: ast.Enumeration): Promise<string | undefined> {
        return this.generateTypeHeader(type);
    }
    async generateEnumerationSource(type: ast.Enumeration): Promise<string | undefined> {
        return undefined;
    }
    async generateEnumerationHeaderGen(type: ast.Enumeration, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        enum class ${type.name}${gen ? 'Gen' : ''}: ::Smp::Int32 {
            ${type.literal.map(l => `
                ${this.comment(l)}
                ${l.name} = ${this.expression(l.value)}
                `).join(', ')}
        };
        
        ${this.uuidDeclaration(type)}
        
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry);
        
        const std::map<${type.name}${gen ? 'Gen' : ''} , std::string> ${type.name}_name_map = {
            ${type.literal.map(l => `{ ${type.name}${gen ? 'Gen' : ''}::${l.name}, "${l.name}" }`).join(', ')}
        };
        
        const std::map<${type.name}${gen ? 'Gen' : ''} , std::string> ${type.name}_descr_map = {
            ${type.literal.map(l => `{ ${type.name}${gen ? 'Gen' : ''}::${l.name}, ${this.description(l)} }`).join(', ')}
        };
        `;
    }
    async generateEnumerationSourceGen(type: ast.Enumeration, gen: boolean): Promise<string | undefined> {
        return s`
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry) {
        auto *type = registry->AddEnumerationType(
            "${type.name}", // name
            ${this.description(type)}, // description
            ${this.uuid(type)}, // UUID
            sizeof(${this.fqn(type)}) // Size
            );
    
        // Register the Literals of the Enumeration
        ${type.literal.map(l => `type->AddLiteral("${l.name}", ${this.description(l)}, static_cast<::Smp::Int32>(${this.fqn(l)}));`).join('\n')}
        }
        ${this.uuidDefinition(type)}
        `;
    }
    async generateStringHeader(type: ast.StringType): Promise<string | undefined> {
        return this.generateTypeHeader(type);
    }
    async generateStringSource(type: ast.StringType): Promise<string | undefined> {
        return undefined;
    }
    async generateStringHeaderGen(type: ast.StringType, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        struct ${type.name}${gen ? 'Gen' : ''}  
        { 
            ::Smp::Char8 internalString[(${this.expression(type.length)}) + 1];
        };
        
        ${this.uuidDeclaration(type)}
        
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry);
        `;
    }

    async generateStringSourceGen(type: ast.StringType, gen: boolean): Promise<string | undefined> {
        return s`
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry) {
            registry->AddStringType(
                "${type.name}", //Name
                ${this.description(type)}, // Description
                ${this.uuid(type)}, // UUID
                ${this.expression(type.length)} // Length of the String
                );
        }
        ${this.uuidDefinition(type)}
        `;
    }

    async generateNativeTypeHeader(type: ast.NativeType): Promise<string | undefined> {
        return this.generateTypeHeader(type);
    }
    async generateNativeTypeSource(type: ast.NativeType): Promise<string | undefined> {
        return undefined;
    }
    async generateNativeTypeHeaderGen(type: ast.NativeType, gen: boolean): Promise<string | undefined> {
        const cppType = getNativeType(type);
        const cppNamespace = getNativeNamespace(type);
        return s`
        ${this.comment(type)}
        using ${type.name}${gen ? 'Gen' : ''}  = ::${cppNamespace && cppNamespace.length > 0 ? cppNamespace + '::' : ''}${cppType};
        ${this.uuidDeclaration(type)}
        `;
    }
    async generateNativeTypeSourceGen(type: ast.NativeType, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.uuidDefinition(type)}
        `;
    }

    async generateComponentSource(type: ast.Component): Promise<string | undefined> {
        return s`
        void ${type.name}::DoPublish( ::Smp::IPublication* receiver) {
        }
        
        void ${type.name}::DoConfigure(::Smp::Services::ILogger* logger, ::Smp::Services::ILinkRegistry* linkRegistry) {
        }
        
        void ${type.name}::DoConnect(::Smp::ISimulator* simulator) {
        }
        
        void ${type.name}::DoDisconnect() {
        }
        `;
    }

    async generateComponentHeaderGen(type: ast.Component, gen: boolean): Promise<string | undefined> {
        return undefined;
    }

    async generateComponentSourceGen(type: ast.Component, gen: boolean): Promise<string | undefined> {
        return undefined;
    }

    protected override initialize(element: ast.NamedElement, gen: boolean = false): string | undefined {
        switch (element.$type) {
            case ast.Association: return this.initializeAssociation(element as ast.Association, gen);
            case ast.Constant: return this.initializeConstant(element as ast.Constant, gen);
            case ast.Container: return this.initializeContainer(element as ast.Container, gen);
            case ast.EntryPoint: return this.initializeEntryPoint(element as ast.EntryPoint, gen);
            case ast.EventSink: return this.initializeEventSink(element as ast.EventSink);
            case ast.EventSource: return this.initializeEventSource(element as ast.EventSource, gen);
            case ast.Field: return this.initializeField(element as ast.Field, gen);
            case ast.Operation: return this.initializeOperation(element as ast.Operation, gen);
            case ast.Property: return this.initializeProperty(element as ast.Property, gen);
            case ast.Reference_: return this.initializeReference(element as ast.Reference_, gen);
            default: return undefined;
        }
    }
    protected override initializeAssociation(element: ast.Association, gen: boolean = false): string | undefined {
        if (isStatic(element) !== true)
            return s`
                // ${element.name} initialization
                ${element.name}{ }
            `;
        return undefined;
    }
    protected override initializeConstant(element: ast.Constant, gen: boolean = false): string | undefined {
        return undefined;
    }
    protected override initializeContainer(element: ast.Container, gen: boolean = false): string | undefined {
        return undefined;
    }
    protected override initializeEntryPoint(element: ast.EntryPoint, gen: boolean = false): string | undefined {
        return undefined;
    }
    protected override initializeEventSink(element: ast.EventSink, gen: boolean = false): string | undefined {
        return undefined;
    }
    protected override initializeEventSource(element: ast.EventSource, gen: boolean = false): string | undefined {
        return undefined;
    }
    protected override initializeField(element: ast.Field, gen: boolean = false): string | undefined {
        return undefined;
    }
    protected override initializeOperation(element: ast.Operation, gen: boolean = false): string | undefined {
        return undefined;
    }
    protected override initializeProperty(element: ast.Property, gen: boolean = false): string | undefined {
        return undefined;
    }
    protected override initializeReference(element: ast.Reference_, gen: boolean = false): string | undefined {
        return undefined;
    }

    protected declareGen(element: ast.NamedElement, gen: boolean): string | undefined {
        switch (element.$type) {
            case ast.Association: return this.declareAssociationGen(element as ast.Association, gen);
            case ast.Constant: return this.declareConstantGen(element as ast.Constant, gen);
            case ast.Container: return this.declareContainerGen(element as ast.Container, gen);
            case ast.EntryPoint: return this.declareEntryPointGen(element as ast.EntryPoint, gen);
            case ast.EventSink: return this.declareEventSinkGen(element as ast.EventSink, gen);
            case ast.EventSource: return this.declareEventSourceGen(element as ast.EventSource, gen);
            case ast.Field: return this.declareFieldGen(element as ast.Field, gen);
            case ast.Operation: return this.declareOperationGen(element as ast.Operation, gen);
            case ast.Property: return this.declarePropertyGen(element as ast.Property, gen);
            case ast.Reference_: return this.declareReferenceGen(element as ast.Reference_, gen);
            default: return undefined;
        }
    }
    protected defineGen(element: ast.NamedElement, gen: boolean): string | undefined {
        switch (element.$type) {
            case ast.Association: return this.defineAssociationGen(element as ast.Association, gen);
            case ast.Constant: return this.defineConstantGen(element as ast.Constant, gen);
            case ast.Container: return this.defineContainerGen(element as ast.Container, gen);
            case ast.EntryPoint: return this.defineEntryPointGen(element as ast.EntryPoint, gen);
            case ast.EventSink: return this.defineEventSinkGen(element as ast.EventSink, gen);
            case ast.EventSource: return this.defineEventSourceGen(element as ast.EventSource, gen);
            case ast.Field: return this.defineFieldGen(element as ast.Field, gen);
            case ast.Operation: return this.defineOperationGen(element as ast.Operation, gen);
            case ast.Property: return this.definePropertyGen(element as ast.Property, gen);
            case ast.Reference_: return this.defineReferenceGen(element as ast.Reference_, gen);
            default: return undefined;
        }
    }

    protected declareAssociationGen(element: ast.Association, gen: boolean): string | undefined {
        return s`
            «comment»
            «IF isConst»const «ENDIF»«IF isStatic»static «ENDIF»«IF isMutable»mutable «ENDIF»«type.id»«IF isByPointer»*«ENDIF» «name»;
            `;
    }
    protected defineAssociationGen(element: ast.Association, gen: boolean): string | undefined {
        return undefined;
    }

    protected declareConstantGen(element: ast.Constant, gen: boolean): string | undefined {
        if (!this.stringTypeIsConstexpr() && ast.isStringType(element.type)) {
            return s`
                ${this.comment(element)}
                static const ${this.fqn(element.type.ref)} ${element.name};
                `;
        }

        return s`
            ${this.comment(element)}
            static constexpr ${this.fqn(element.type.ref)} ${element.name}${this.directListInitializer(element.value)};
            `;
    }
    protected defineConstantGen(element: ast.Constant, gen: boolean): string | undefined {
        if (!this.stringTypeIsConstexpr() && ast.isStringType(element.type)) {
            return s`
                ${this.comment(element)}
                const ${this.fqn(element.type.ref)} ${element.$container.name}${gen ? 'Gen' : ''}::${element.name}${this.directListInitializer(element.value)};
                `;
        }

        if (this.cxxStandard < CxxStandard.CXX_STD_17) {
            return s`
                ${this.comment(element)}
                static constexpr ${this.fqn(element.type.ref)} ${element.$container.name}${gen ? 'Gen' : ''}::${element.name};
                `;
        }
        return undefined;
    }

    protected declareContainerGen(element: ast.Container, gen: boolean): string | undefined {
        return s`
        ${this.comment(element)}
        ::Smp::IContainer* ${element.name};
        `;
    }
    protected override finalizeContainer(element: ast.Container): string | undefined {
        return this.finalizePointer(element);
    }
    protected defineContainerGen(element: ast.Container, gen: boolean): string | undefined {
        return undefined;
    }

    protected override declareEntryPoint(element: ast.EntryPoint): string | undefined {
        return `void _${element.name}() override;`;
    }
    protected override defineEntryPoint(element: ast.EntryPoint): string | undefined {
        return s`
            void ${element.$container.name}::_${element.name}() {
                // TODO implement EntryPoint ${element.name}
                ${this.comment(element)}
            }`;
    }

    protected declareEntryPointGen(element: ast.EntryPoint, gen: boolean): string | undefined {
        return s`
            ${this.comment(element)}
            ::Smp::IEntryPoint* ${element.name}; 
            virtual void _${element.name}()${gen ? ' = 0' : ''};
            `;
    }
    protected defineEntryPointGen(element: ast.EntryPoint, gen: boolean): string | undefined {
        return undefined;
    }
    protected finalizePointer(element: ast.NamedElement): string | undefined {
        return s`
            delete ${element.name};
            ${element.name} = nullptr;
            `;
    }
    protected override finalizeEntryPoint(element: ast.EntryPoint): string | undefined {
        return this.finalizePointer(element);
    }

    protected override declareEventSink(element: ast.EventSink): string | undefined {
        const eventType = this.eventType(element);
        return s`
            void _${element.name}(::Smp::IObject* sender${eventType ? `, ${this.fqn(eventType)}` : ''}) override;
            `;
    }
    protected override defineEventSink(element: ast.EventSink): string | undefined {
        const eventType = this.eventType(element);
        return s`
            void ${element.$container.name}::_${element.name}(::Smp::IObject* sender${eventType ? `, ${this.fqn(eventType)}` : ''}) {
                // TODO implement EventSink ${element.name}
                ${this.comment(element)}
            }`;
    }
    protected declareEventSinkGen(element: ast.EventSink, gen: boolean): string | undefined {
        const eventType = this.eventType(element);

        return s`
        ${this.comment(element)}
        ::Smp::IEventSink* ${element.name};
        virtual void _${element.name}(::Smp::IObject* sender${eventType ? `, ${this.fqn(eventType)}` : ''})${gen ? ' = 0' : ''};
        `;
    }
    protected defineEventSinkGen(element: ast.EventSink, gen: boolean): string | undefined {
        return undefined;
    }
    protected override finalizeEventSink(element: ast.EventSink): string | undefined {
        return this.finalizePointer(element);
    }

    protected declareEventSourceGen(element: ast.EventSource, gen: boolean): string | undefined {
        return s`
        ${this.comment(element)}
        ::Smp::IEventSource* ${element.name};
        `;
    }
    protected defineEventSourceGen(element: ast.EventSource, gen: boolean): string | undefined {
        return undefined;
    }
    protected override finalizeEventSource(element: ast.EventSource): string | undefined {
        return this.finalizePointer(element);
    }

    protected declareFieldGen(element: ast.Field, gen: boolean): string | undefined {
        return undefined;
    }
    protected defineFieldGen(element: ast.Field, gen: boolean): string | undefined {
        return undefined;
    }

    protected declareOperationGen(element: ast.Operation, gen: boolean): string | undefined {
        return undefined;
    }
    protected defineOperationGen(element: ast.Operation, gen: boolean): string | undefined {
        return undefined;
    }

    protected declarePropertyGen(element: ast.Property, gen: boolean): string | undefined {
        return undefined;
    }
    protected definePropertyGen(element: ast.Property, gen: boolean): string | undefined {
        return undefined;
    }

    protected declareReferenceGen(element: ast.Reference_, gen: boolean): string | undefined {
        return undefined;
    }
    protected defineReferenceGen(element: ast.Reference_, gen: boolean): string | undefined {
        return undefined;
    }

}