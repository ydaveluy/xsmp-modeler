import { GapPatternCppGenerator } from '../../generator/cpp/gap-pattern-generator.js';
import type { XsmpSharedServices } from '../../xsmp-module.js';
import { CxxStandard } from '../../generator/cpp/generator.js';
import type * as ast from '../../generated/ast.js';

import { expandToString as s } from 'langium/generate';
import { isSimpleArray } from '../../utils/xsmp-utils.js';

export class XsmpSdkGenerator extends GapPatternCppGenerator {
    constructor(services: XsmpSharedServices) {
        super(services, CxxStandard.CXX_STD_17);
    }

    override async generateArrayHeaderGen(type: ast.ArrayType, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        using ${type.name}${gen ? 'Gen' : ''} = ::Xsmp::Array<${this.fqn(type.itemType.ref)}, ${this.expression(type.size)}>${isSimpleArray(type) ? '::simple' : ''};

        ${this.uuidDeclaration(type)}
        
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry);
        `;
    }
    override async generateStringHeaderGen(type: ast.StringType, gen: boolean): Promise<string | undefined> {
        return s`
        ${this.comment(type)}
        using ${type.name}${gen ? 'Gen' : ''} = ::Xsmp::String<${this.expression(type.length)}>;

        ${this.uuidDeclaration(type)}
        
        void _Register_${type.name}(::Smp::Publication::ITypeRegistry* registry);
        `;
    }

    protected override declareContainerGen(element: ast.Container): string | undefined {
        return s`
        ${this.comment(element)}
        ::Xsmp::Container<${this.fqn(element.type.ref)}> ${element.name};
        `;
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

    protected override declareEntryPointGen(element: ast.EntryPoint, gen: boolean): string | undefined {
        return s`
        ${this.comment(element)}
        ::Xsmp::EntryPoint ${element.name}; 
        virtual void _${element.name}()${gen ? ' = 0' : ''};
        `;
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
        ${this.comment(element)}
        ::Xsmp::EventSink<${this.fqn(eventType)}> ${element.name};
        virtual void _${element.name}(::Smp::IObject* sender${eventType ? `, ${this.fqn(eventType)}` : ''})${gen ? ' = 0' : ''};
        `;
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
        ${this.comment(element)}
        ::Xsmp::EventSource<${this.fqn(eventType)}> ${element.name};
        `;
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