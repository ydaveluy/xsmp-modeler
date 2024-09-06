import { GapPatternCppGenerator } from '../../generator/cpp/gap-pattern-generator.js';
import type { XsmpSharedServices } from '../../xsmp-module.js';
import { CxxStandard, type Include } from '../../generator/cpp/generator.js';
import * as ast from '../../generated/ast.js';
import { expandToString as s } from 'langium/generate';
import { getAccessKind, isByPointer, isFailure, isForcible, isInput, isMutable, isOutput, isSimpleArray, isState, isStatic } from '../../utils/xsmp-utils.js';
import { VisibilityKind } from '../../utils/visibility-kind.js';

export class XsmpSdkGenerator extends GapPatternCppGenerator {
    constructor(services: XsmpSharedServices) {
        super(services, CxxStandard.CXX_STD_17);
    }
    override registerModel(model: ast.Model): string {
        return s`
        // Register factory for Model ${model.name}
        simulator->RegisterFactory(::Xsmp::Factory::Create<${this.fqn(model)}>(
            "${model.name}", // Name
            ${this.description(model)}, // Description
            simulator, // Simulator
            ${this.uuid(model)} // UUID
            ));
        
        `;
    }

    override factoryIncludes(): Include[] {
        return ['Xsmp/Factory.h'];
    }

    override async generateArrayHeaderGen(type: ast.ArrayType, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.comment(type)}using ${type.name}${gen ? 'Gen' : ''} = ::Xsmp::Array<${this.fqn(type.itemType.ref)}, ${this.expression(type.size)}>${isSimpleArray(type) ? '::simple' : ''};

        ${this.uuidDeclaration(type)}
        
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry);
        `;
    }
    override headerIncludesArray(type: ast.ArrayType): Include[] {
        return [...super.headerIncludesArray(type), 'Xsmp/Array.h'];
    }

    override async generateStringHeaderGen(type: ast.StringType, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.comment(type)}using ${type.name}${gen ? 'Gen' : ''} = ::Xsmp::String<${this.expression(type.length)}>;

        ${this.uuidDeclaration(type)}
        
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry);
        `;
    }
    override headerIncludesString(type: ast.StringType): Include[] {
        return [...super.headerIncludesString(type), 'Xsmp/String.h'];
    }

    protected override declareContainerGen(element: ast.Container): string | undefined {
        return s`
        ${this.comment(element)}::Xsmp::Container<${this.fqn(element.type.ref)}> ${element.name};
        `;
    }
    override headerIncludesContainer(_element: ast.Container): Include[] {
        return ['Xsmp/Container.h'];
    }
    protected override finalizeContainer(_element: ast.Container): string | undefined {
        return undefined;
    }

    protected override initializeContainer(element: ast.Container): string | undefined {
        return s`
        // Container: ${element.name}
        ${element.name} { "${element.name}", ${this.description(element)}, this, ${this.lower(element)}, ${this.upper(element)}}
        `;
    }

    protected override declareReferenceGen(element: ast.Reference_): string | undefined {
        return s`
        ${this.comment(element)}::Xsmp::Reference<${this.fqn(element.interface.ref)}> ${element.name};
        `;
    }
    override headerIncludesReference(_element: ast.Reference_): Include[] {
        return ['Xsmp/Reference.h'];
    }
    protected override finalizeReference(_element: ast.Reference_): string | undefined {
        return undefined;
    }

    protected override initializeReference(element: ast.Reference_): string | undefined {
        return s`
        // Reference: ${element.name}
        ${element.name} { "${element.name}", ${this.description(element)}, this, ${this.lower(element)}, ${this.upper(element)}}
        `;
    }

    protected override declareEntryPointGen(element: ast.EntryPoint, gen: boolean): string | undefined {
        return s`
        ${this.comment(element)}::Xsmp::EntryPoint ${element.name}; 
        virtual void _${element.name}()${gen ? ' = 0' : ''};
        `;
    }
    override headerIncludesEntryPoint(_element: ast.EntryPoint): Include[] {
        return ['Xsmp/EntryPoint.h'];
    }
    protected override initializeEntryPoint(element: ast.EntryPoint, gen: boolean): string | undefined {
        return s`
        // EntryPoint: ${element.name}
        ${element.name} { "${element.name}", ${this.description(element)}, this, std::bind(&${element.$container.name}${gen ? 'Gen' : ''}:_${element.name}, this) }
        `;
    }
    protected override finalizeEntryPoint(_element: ast.EntryPoint): string | undefined {
        return undefined;
    }

    protected override declareEventSinkGen(element: ast.EventSink, gen: boolean): string | undefined {
        const eventType = this.eventType(element);

        return s`
        ${this.comment(element)}::Xsmp::EventSink<${this.fqn(eventType)}> ${element.name};
        virtual void _${element.name}(::Smp::IObject* sender${eventType ? `, ${this.fqn(eventType)}` : ''})${gen ? ' = 0' : ''};
        `;
    }
    override headerIncludesEventSink(_element: ast.EventSink): Include[] {
        return ['Xsmp/EventSink.h'];
    }
    protected override initializeEventSink(element: ast.EventSink, gen: boolean): string | undefined {
        const eventType = this.eventType(element);

        if (eventType) {
            return s`
        // Event Sink: ${element.name}
        ${element.name} { "${element.name}", ${this.description(element)}, this, std::bind(&${element.$container.name}${gen ? 'Gen' : ''}:_${element.name}, this, std::placeholders::_1, std::placeholders::_2), ${this.primitiveTypeKind(eventType)} }
        `;
        }
        else {
            return s`
        // Event Sink: ${element.name}
        ${element.name} { "${element.name}", ${this.description(element)}, this, std::bind(&${element.$container.name}${gen ? 'Gen' : ''}:_${element.name}, this, std::placeholders::_1) }
        `;
        }
    }
    protected override finalizeEventSink(_element: ast.EventSink): string | undefined {
        return undefined;
    }

    protected override declareEventSourceGen(element: ast.EventSource, _gen: boolean): string | undefined {
        const eventType = this.eventType(element);
        return s`
        ${this.comment(element)}::Xsmp::EventSource<${this.fqn(eventType)}> ${element.name};
        `;
    }
    override headerIncludesEventSource(_element: ast.EventSource): Include[] {
        return ['Xsmp/EventSource.h'];
    }
    protected override initializeEventSource(element: ast.EventSource, _gen: boolean): string | undefined {
        const eventType = this.eventType(element);
        return s`
        // Event Source: ${element.name}
        ${element.name} { "${element.name}", ${this.description(element)}, this${eventType ? `, ${this.primitiveTypeKind(eventType)}` : ''} }
        `;

    }
    protected override finalizeEventSource(_element: ast.EventSource): string | undefined {
        return undefined;
    }
    override async generateStructureHeaderGen(type: ast.Structure, gen: boolean): Promise<string | undefined> {
        const fields = type.elements.filter(ast.isField).filter(field => !isStatic(field));
        const rawFqn = `${this.fqn(type)}${gen ? 'Gen' : ''}`;
        return s`
        ${this.comment(type)}struct ${type.name}${gen ? 'Gen' : ''} {
            ${this.declareMembersGen(type, gen, VisibilityKind.public)}

            static void _Register(::Smp::Publication::ITypeRegistry* registry);

            template<typename _BASE> struct _Field : public _BASE {
                _Field(::Smp::Publication::ITypeRegistry *typeRegistry, ::Smp::Uuid typeUuid,
                       ::Smp::String8 name, ::Smp::String8 description = "", ::Smp::IObject *parent = nullptr,
                       ::Smp::ViewKind view = ::Smp::ViewKind::VK_All, const ${rawFqn} &value = {}) :
                       _BASE(typeRegistry, typeUuid, name ,description, parent, view)${fields.length === 0 ? '' : ','}
                       ${fields.map(field => s`// ${field.name} initialization\n${field.name}{typeRegistry, ${this.uuid(field.type.ref)}, "${field.name}", ${this.description(field)}, this, ${this.viewKind(field, 'view')}, value.${field.name}}`).join(',\n')}
                {
                }
                _Field(const _Field&) = delete;
                _Field& operator = (const _Field&) = delete;

                // copy operator from ${rawFqn}
                _Field & operator=(const ${rawFqn} &other) {
                    ${fields.map(field => `this->${field.name} = other.${field.name};`).join('\n')}
                    return *this;
                }
                
                // implicit convertion to ${rawFqn}
                operator ${rawFqn}() const noexcept {
                    return {${fields.map(field => field.name).join(', ')}};
                }
                
                ${fields.length === 0 ? '' : '// Fields declaration'}
                ${fields.map(field => `${this.comment(field)}${isMutable(field) ? 'mutable ' : ''}typename _BASE::template Field<${this.fqn(field.type.ref)}>${isState(field) ? '' : '::transient'}${isInput(field) ? '::input' : ''}${isOutput(field) ? '::output' : ''}${isForcible(field) ? '::forcible' : ''}${isFailure(field) ? '::failure' : ''} ${field.name};`).join('\n')}
               };
        };
        
        ${this.uuidDeclaration(type)}
        `;
    }

    override  headerIncludesComponent(type: ast.Component): Include[] {
        const includes = super.headerIncludesComponent(type);
        includes.push('Xsmp/ComponentHelper.h');
        if (!type.base) {
            includes.push(`Xsmp/${type.$type}.h`);
        }
        if (type.elements.filter(ast.isInvokable).some(this.isInvokable, this)) {
            includes.push('map');
            includes.push('Smp/IPublication.h');
            includes.push('Xsmp/Request.h');
        }
        if (type.elements.some(ast.isContainer)) {
            includes.push('Xsmp/Composite.h');
        }
        if (type.elements.some(ast.isReference_)) {
            includes.push('Xsmp/Aggregate.h');
        }
        if (type.elements.some(ast.isEventSource)) {
            includes.push('Xsmp/EventProvider.h');
        }
        if (type.elements.some(ast.isEventSink)) {
            includes.push('Xsmp/EventConsumer.h');
        }
        if (type.elements.some(ast.isEntryPoint)) {
            includes.push('Xsmp/EntryPointPublisher.h');
        }
        if (type.$type === ast.Model && type.elements.some(element => ast.isField(element) && isFailure(element) === true)) {
            includes.push('Xsmp/FallibleModel.h');
        }
        return includes;
    }

    override async generateComponentHeader(type: ast.Component): Promise<string | undefined> {
        return s`
            ${this.comment(type)}class ${type.name}: public ${type.name}Gen {
            public:
                /// Re-use parent constructors
                using ${type.name}Gen::${type.name}Gen;
                
                /// Virtual destructor to release memory.
                ~${type.name}() noexcept override = default;
                
            private:
                // visibility to call DoPublish / DoConfigure / DoConnect / DoDisconnect
                friend class ::Xsmp::Component::Helper;
                
                /// Publish fields, operations and properties of the ${type.$type}.
                /// @param receiver Publication receiver.
                void DoPublish(::Smp::IPublication* receiver);
                
                /// Perform any custom configuration of the ${type.$type}.
                /// @param logger Logger to use for log messages during Configure().
                /// @param linkRegistry Link Registry to use for registration of
                ///         links created during Configure() or later.
                void DoConfigure(::Smp::Services::ILogger* logger, ::Smp::Services::ILinkRegistry* linkRegistry);
                
                /// Connect the ${type.$type} to the simulator and its simulation 
                /// services.
                /// @param simulator Simulation Environment that hosts the ${type.$type}.
                void DoConnect(::Smp::ISimulator* simulator);
                
                /// Disconnect the ${type.$type} from the simulator and all its 
                /// simulation services.
                void DoDisconnect();
            
                ${this.declareMembers(type, VisibilityKind.private)}
            };
            `;
    }
    override async generateComponentHeaderGen(type: ast.Component, gen: boolean): Promise<string | undefined> {
        const name = `${type.name}${gen ? 'Gen' : ''}`;
        const bases = this.componentBases(type);
        return s`
            ${gen ? `// forward declaration of user class\nclass ${type.name};` : ''}
            ${this.uuidDeclaration(type)}
            
            ${this.comment(type)}class ${name}${bases.length > 0 ? ':' : ''} ${bases.join(', ')}
            {
            
            ${gen ? `friend class ${this.fqn(type)};` : ''}
            
            public:
            // --------------------------------------------------------------------------
            // ------------------------ Constructors/Destructor -------------------------
            // --------------------------------------------------------------------------
            
            
            /// Constructor setting name, description, parent and simulator.
            /// @param name Name of new model instance.
            /// @param description Description of new model instance.
            /// @param parent Parent of new model instance.
            /// @param simulator The simulator instance.
            ${name}(::Smp::String8 name,
                    ::Smp::String8 description,
                    ::Smp::IComposite* parent,
                    ::Smp::ISimulator* simulator);
            /// deleted copy constructor
            ${name}(const ${name}&) = delete;
            /// deleted move constructor
            ${name}(${name}&&) = delete;
            /// deleted copy assignment
            ${name}& operator=(const ${name}&) = delete;
            /// deleted move assignment
            ${name}& operator=(${name}&&) = delete;
            
            /// Virtual destructor to release memory.
            ~${name}() override = default;
            
            // --------------------------------------------------------------------------
            // ------------------------------- IComponent -------------------------------
            // --------------------------------------------------------------------------
            
            /// Publish fields, operations and properties of the model.
            /// @param receiver Publication receiver.
            void Publish(::Smp::IPublication* receiver) override;
            
            /// Request for configuration.
            /// @param logger Logger to use for log messages during Configure().
            /// @param linkRegistry Link Registry to use for registration of
            ///         links created during Configure() or later.
            void Configure( ::Smp::Services::ILogger* logger, ::Smp::Services::ILinkRegistry* linkRegistry) override;
            
            /// Connect model to simulator.
            /// @param simulator Simulation Environment that hosts the model.
            ///
            void Connect( ::Smp::ISimulator* simulator) override;
            
            /// Disconnect model to simulator.
            /// @throws Smp::InvalidComponentState
            void Disconnect() override;
            
            /// Return the Universally Unique Identifier of the Model.
            /// @return Universally Unique Identifier of the Model.
            const Smp::Uuid& GetUuid() const override;
            ${type.elements.filter(ast.isInvokable).some(this.isInvokable, this) ? `
            // --------------------------------------------------------------------------
            // --------------------------- IDynamicInvocation ---------------------------
            // --------------------------------------------------------------------------
            using RequestHandlers = std::map<std::string, std::function<void(${name}*, ::Smp::IRequest*)>>;
            static RequestHandlers requestHandlers;
            static RequestHandlers InitRequestHandlers();
            
            /// Invoke the operation for the given request.
            /// @param request Request object to invoke.
            void Invoke(::Smp::IRequest* request) override;
            `: ''}
            
            ${this.declareMembersGen(type, gen, VisibilityKind.public)}
            };
            `;
    }
    protected override componentBase(type: ast.Component): string | undefined {
        return type.base ? this.fqn(type.base.ref) : `::Xsmp::${type.$type}`;
    }
    protected override componentBases(type: ast.Component): string[] {
        const bases = super.componentBases(type);
        if (type.elements.some(ast.isContainer))
            bases.push('public virtual ::Xsmp::Composite');
        if (type.elements.some(ast.isReference_))
            bases.push('public virtual ::Xsmp::Aggregate');
        if (type.elements.some(ast.isEventSource))
            bases.push('public virtual ::Xsmp::EventProvider');
        if (type.elements.some(ast.isEventSink))
            bases.push('public virtual ::Xsmp::EventConsumer');
        if (type.elements.some(ast.isEntryPoint))
            bases.push('public virtual ::Xsmp::EntryPointPublisher');
        if (type.$type === ast.Model && type.elements.filter(ast.isField).some(isFailure))
            bases.push('public virtual ::Xsmp::FallibleModel');
        return bases;
    }

    override async generateComponentSourceGen(type: ast.Component, gen: boolean): Promise<string | undefined> {
        const name = `${type.name}${gen ? 'Gen' : ''}`;
        const base = this.componentBase(type);
        const fqn = this.fqn(type);
        const initializer = this.initializeMembers(type);
        return s`
            //--------------------------- Constructor -------------------------
            ${name}::${name}(
                ::Smp::String8 name,
                ::Smp::String8 description,
                ::Smp::IComposite* parent,
                ::Smp::ISimulator* simulator):
                // Base class initialization
                ${base}(name, description, parent, simulator)${initializer.length > 0 ? `,
                    ${initializer.join(',\n')}` : ''} {
                //«FOR f : member»
                //    «construct(f, useGenPattern)»
                //«ENDFOR»
            }
            
            void ${name}::Publish(::Smp::IPublication* receiver) {
                // Call parent class implementation first
                ${base}::Publish(receiver);
                
                ${this.publishMembers(type)}
                // Call user DoPublish if any
                ::Xsmp::Component::Helper::Publish<${fqn}>(this, receiver);
            }
            
            void ${name}::Configure(::Smp::Services::ILogger* logger, ::Smp::Services::ILinkRegistry* linkRegistry) {
                // Call parent implementation first
                ${base}::Configure(logger, linkRegistry);

                // Call user DoConfigure if any
                ::Xsmp::Component::Helper::Configure<${fqn}>(this, logger, linkRegistry);
            }
            
            void ${name}::Connect(::Smp::ISimulator* simulator) {
                // Call parent implementation first
                ${base}::Connect(simulator);
                    
                // Call user DoConnect if any
                ::Xsmp::Component::Helper::Connect<${fqn}>(this, simulator);
            }
            
            void ${name}::Disconnect() {
                if (this->GetState() == ::Smp::ComponentStateKind::CSK_Connected) {
                    // Call user DoDisconnect if any
                    ::Xsmp::Component::Helper::Disconnect<${fqn}>(this);
                }

                // Call parent implementation last, to remove references to the Simulator and its services
                ${base}::Disconnect();
            }
            
            ${type.elements.filter(ast.isInvokable).some(this.isInvokable, this) ? `
                ${name}::RequestHandlers ${name}::requestHandlers = InitRequestHandlers();
                
                ${name}::RequestHandlers ${name}::InitRequestHandlers() {
                    RequestHandlers handlers;
                    ${type.elements.filter(ast.isOperation).filter(this.isInvokable, this).map(param => this.generateRqHandlerOperation(param, gen), this).join('\n')}
                    ${type.elements.filter(ast.isProperty).filter(this.isInvokable, this).map(property => this.generateRqHandlerProperty(property, gen), this).join('\n')}
                    return handlers;
                }
                
                void ${name}::Invoke(::Smp::IRequest* request) {
                    if (request == nullptr) {
                        return;
                    }
                    const auto handler = requestHandlers.find(request->GetOperationName());
                    if (handler != requestHandlers.end()) {
                        return handler->second(this, request);
                    }
                    // pass the request down to the base class
                    ${base}::Invoke(request);
                }

                `: ''}
            const Smp::Uuid& ${name}::GetUuid() const {
                return Uuid_${type.name};
            }
            ${this.uuidDefinition(type)}
            ${this.defineMembersGen(type, gen)}
            `;
    }

    protected generateRqHandlerOperation(op: ast.Operation, gen: boolean): string {
        const r = op.returnParameter;
        return `
            if (handlers.find("${op.name}") == handlers.end()) {
                handlers["${op.name}"] = [](${op.$container.name}${gen ? 'Gen' : ''}* cmp, ::Smp::IRequest *${r || op.parameter.length > 0 ? 'req' : ''}) {
                
                ${op.parameter.map(this.initParameter, this).join('\n')}
                
                /// Invoke ${op.name}
                ${r ? `const auto p_${r.name ?? 'return'} = ` : ''}cmp->${op.name}(${op.parameter.map(param => `${isByPointer(param) ? '&' : ''}p_${param.name}`).join(', ')});
                
                ${op.parameter.map(this.setParameter, this).join('\n')}
                ${r ? `::Xsmp::Request::setReturnValue(req, ${this.primitiveTypeKind(r.type.ref)}, p_${r.name ?? 'return'});` : ''}
                };
            }
        `;
    }

    initParameter(param: ast.Parameter): string {
        switch (param.direction) {
            case 'in':
            case 'inout':
                // declare and initialize the parameter
                if (ast.isSimpleType(param.type.ref))
                    return `auto p_${param.name} = ::Xsmp::Request::get<${this.fqn(param.type.ref)}>(cmp, req, "${param.name}", ${this.primitiveTypeKind(param.type.ref)}${param.default ? `, ${this.expression(param.default)}` : ''});`;
                else
                    return `auto p_${param.name} = ::Xsmp::Request::get<${this.fqn(param.type.ref)}>(cmp, req, "${param.name}", ${this.uuid(param.type.ref)}${param.default ? `, ${this.expression(param.default)}` : ''});`;
            default:
                // only declare the parameter
                return `${this.fqn(param.type.ref)} p_${param.name}${this.directListInitializer(param.default)};`;
        }
    }

    setParameter(param: ast.Parameter): string | undefined {
        switch (param.direction) {
            case 'out':
            case 'inout':
                return `::Xsmp::Request::set(cmp, req, "${param.name}", ${this.primitiveTypeKind(param.type.ref)}, p_${param.name});`;
            default:
                // do nothing
                return undefined;
        }
    }

    protected generateRqHandlerProperty(property: ast.Property, gen: boolean): string {
        const accessKind = getAccessKind(property);
        const cmp = `${property.$container.name}${gen ? 'Gen' : ''}`;
        return s`
            ${accessKind !== 'writeOnly' ? `
                if (handlers.find("get_${property.name}") == handlers.end()) {
                    handlers["get_${property.name}"] = [](${cmp}* component, :: Smp:: IRequest * request) {
                        /// Invoke get_${property.name}
                        ::Xsmp::Request::setReturnValue(request, ${this.primitiveTypeKind(property.type.ref)}, component->get_${property.name}());
                    };
                }
                `: ''}
            ${accessKind !== 'readOnly' ? `
                if (handlers.find("set_${property.name}") == handlers.end()) {
                    handlers["set_${property.name}"] = [](${cmp}* component, :: Smp:: IRequest * request) {
                        /// Invoke set_${property.name}
                        component->set_${property.name}(::Xsmp::Request::get<${this.fqn(property.type.ref)}>(component, request, "${property.name}", ${this.primitiveTypeKind(property.type.ref)}));
                    };
                }
                `: ''}
            `;
    }
}