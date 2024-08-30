import { GapPatternCppGenerator } from '../../generator/cpp/gap-pattern-generator.js';
import type { XsmpSharedServices } from '../../xsmp-module.js';
import { CxxStandard, type Include } from '../../generator/cpp/generator.js';
import type * as ast from '../../generated/ast.js';
import { expandToString as s } from 'langium/generate';
import { isSimpleArray } from '../../utils/xsmp-utils.js';

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
}