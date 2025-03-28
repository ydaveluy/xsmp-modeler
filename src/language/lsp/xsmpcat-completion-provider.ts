import type { AstNodeDescription, MaybePromise, ReferenceInfo, Stream } from 'langium';
import { AstUtils, GrammarAST } from 'langium';
import type { CompletionAcceptor, CompletionContext, CompletionValueItem, NextFeature } from 'langium/lsp';
import { DefaultCompletionProvider } from 'langium/lsp';
import type { MarkupContent } from 'vscode-languageserver';
import { CompletionItemKind, CompletionItemTag, InsertTextFormat } from 'vscode-languageserver';
import * as os from 'os';
import * as ast from '../generated/ast-partial.js';
import * as XsmpUtils from '../utils/xsmp-utils.js';
import type { XsmpcatServices } from '../xsmpcat-module.js';
import type { XsmpTypeProvider } from '../references/type-provider.js';
import * as Solver from '../utils/solver.js';
import { PTK } from '../utils/primitive-type-kind.js';
import { VisibilityKind } from '../utils/visibility-kind.js';
import { type DocumentationHelper } from '../utils/documentation-helper.js';
import { type AttributeHelper } from '../utils/attribute-helper.js';

export class XsmpcatCompletionProvider extends DefaultCompletionProvider {

    protected readonly typeProvider: XsmpTypeProvider;
    protected readonly docHelper: DocumentationHelper;
    protected readonly attrHelper: AttributeHelper;

    constructor(services: XsmpcatServices) {
        super(services);
        this.typeProvider = services.shared.TypeProvider;
        this.docHelper = services.shared.DocumentationHelper;
        this.attrHelper = services.shared.AttributeHelper;
    }

    private isValidAttributeType(desc: AstNodeDescription, attribute: ast.Attribute): boolean {
        if (!ast.isAttributeType(desc.node)) { return false; }

        const usages = this.docHelper.getUsages(desc.node),
            elementType = XsmpUtils.getNodeType(attribute.$container);

        if (!usages?.find(u => ast.reflection.isSubtype(elementType, u.toString()))) {
            return false;
        }

        if (attribute.$container.attributes.some(a => a.type?.ref === desc.node) && !this.docHelper.allowMultiple(desc.node)) {
            return false;
        }
        return XsmpUtils.isTypeVisibleFrom(attribute, desc.node);
    }

    private isValidNamedElementReference(desc: AstNodeDescription, expression: ast.Expression): boolean {
        const type = this.typeProvider.getType(expression);
        if (!type) {
            return false;
        }

        if (ast.isEnumeration(type)) {
            return desc.node?.$container === type;
        }
        return ast.isConstant(desc.node) && XsmpUtils.isConstantVisibleFrom(expression, desc.node);

    }

    private readonly floatRegex = /^(Smp\.)?Float(32|64)$/;
    private readonly intRegex = /^(Smp\.)?U?Int(8|16|32|64)$/;
    public getFilter(refInfo: ReferenceInfo,): ((desc: AstNodeDescription) => boolean) | undefined {

        const refId = `${refInfo.container.$type}:${refInfo.property}`;
        switch (refId) {
            case 'Attribute:type':
                return (desc) => this.isValidAttributeType(desc, refInfo.container as ast.Attribute);
            case 'Class:base':
                return (desc) => ast.isClass(desc.node) && !XsmpUtils.isBaseOfClass(refInfo.container as ast.Class, desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node);
            case 'Interface:base':
                return (desc) => ast.isInterface(desc.node) && !XsmpUtils.isBaseOfInterface(refInfo.container as ast.Interface, desc.node) &&
                    !(refInfo.container as ast.Interface).base.some(i => i.ref === desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node);
            case 'Model:interface':
            case 'Service:interface':
                return (desc) => ast.isInterface(desc.node) && !(refInfo.container as ast.Component).interface.some(i => i.ref===desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node);
            case 'Reference_:interface':
                return (desc) => ast.isInterface(desc.node);
            case 'Model:base':
                return (desc) => ast.isModel(desc.node) && !XsmpUtils.isBaseOfComponent(refInfo.container as ast.Component, desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node);
            case 'Service:base':
                return (desc) => ast.isService(desc.node) && !XsmpUtils.isBaseOfComponent(refInfo.container as ast.Component, desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node);
            case 'ArrayType:itemType':
                return (desc) => ast.isValueType(desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node) && !XsmpUtils.isRecursiveType(refInfo.container as ast.ArrayType, desc.node);
            case 'ValueReference:type':
            case 'AttributeType:type':
                return (desc) => ast.isValueType(desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node);
            case 'Field:type':
                return (desc) => ast.isValueType(desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node) && !XsmpUtils.isRecursiveType((refInfo.container as ast.Field).$container, desc.node);
            case 'Property:attachedField':
                return (desc) => ast.isField(desc.node) && (desc.node.$container === refInfo.container.$container || XsmpUtils.getRealVisibility(desc.node) !== VisibilityKind.private);
            case 'Integer:primitiveType':
                return (desc) => desc.type === ast.PrimitiveType && this.intRegex.test(desc.name) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node as ast.Type);
            case 'Float:primitiveType':
                return (desc) => desc.type === ast.PrimitiveType && this.floatRegex.test(desc.name) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node as ast.Type);
            case 'EventType:eventArgs':
            case 'Constant:type':
                return (desc) => ast.reflection.isSubtype(desc.type, ast.SimpleType) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node as ast.Type);
            case 'Parameter:type':
            case 'ReturnParameter:type':
            case 'Association:type':
            case 'Property:type':
                return (desc) => ast.reflection.isSubtype(desc.type, ast.LanguageType) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node as ast.Type);
            case 'Container:type':
                return (desc) => ast.reflection.isSubtype(desc.type, ast.ReferenceType) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node as ast.Type);
            case 'Container:defaultComponent':
                return (desc) => ast.reflection.isSubtype(desc.type, ast.Component) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node as ast.Type);
            case 'EventSink:type':
            case 'EventSource:type':
                return (desc) => ast.EventType === desc.type && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node as ast.Type);
            case 'Operation:raisedException':
                return (desc) => ast.Exception === desc.type && !(refInfo.container as ast.Operation).raisedException.some(e => e.ref === desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node as ast.Type);
            case 'Property:getRaises':
                return (desc) => ast.Exception === desc.type && !(refInfo.container as ast.Property).getRaises.some(e => e.ref === desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node as ast.Type);
            case 'Property:setRaises':
                return (desc) => ast.Exception === desc.type && !(refInfo.container as ast.Property).setRaises.some(e => e.ref === desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node as ast.Type);
            case 'Exception:base':
                return (desc) => ast.isException(desc.node) && !XsmpUtils.isBaseOfClass(refInfo.container as ast.Class, desc.node) && XsmpUtils.isTypeVisibleFrom(refInfo.container, desc.node as ast.Type);
            case 'EntryPoint:input':
                return (desc) => ast.isField(desc.node) && XsmpUtils.isInput(desc.node) && (desc.node.$container === refInfo.container.$container || XsmpUtils.getRealVisibility(desc.node) !== VisibilityKind.private);
            case 'EntryPoint:output':
                return (desc) => ast.isField(desc.node) && XsmpUtils.isOutput(desc.node) && (desc.node.$container === refInfo.container.$container || XsmpUtils.getRealVisibility(desc.node) !== VisibilityKind.private);
            case 'NamedElementReference:value':
                return (desc) => this.isValidNamedElementReference(desc, refInfo.container as ast.Expression);
            default:
                return undefined;
        }

    }

    /**
     * Filter elements
     *
     * @param refInfo Information about the reference for which the candidates are requested.
     * @param _context Information about the completion request including document, cursor position, token under cursor, etc.
     * @returns A stream of all elements being valid for the given reference.
     */
    protected override getReferenceCandidates(refInfo: ReferenceInfo, _context: CompletionContext): Stream<AstNodeDescription> {

        const filter = this.getFilter(refInfo);
        if (filter) {
            return super.getReferenceCandidates(refInfo, _context).filter(filter);
        }
        return super.getReferenceCandidates(refInfo, _context);
    }

    protected override createReferenceCompletionItem(nodeDescription: AstNodeDescription): CompletionValueItem {
        const kind = this.nodeKindProvider.getCompletionItemKind(nodeDescription),
            documentation = this.getReferenceDocumentation(nodeDescription);
        return {
            nodeDescription,
            kind,
            documentation,
            tags: this.getCompletionTags(nodeDescription),
            detail: nodeDescription.type,
            sortText: nodeDescription.name.split('.').length.toString().padStart(4, '0')
        };
    }
    getCompletionTags(nodeDescription: AstNodeDescription): CompletionItemTag[] | undefined {
        if (ast.isNamedElement(nodeDescription.node) && this.docHelper.IsDeprecated(nodeDescription.node))
            return [CompletionItemTag.Deprecated];
        return undefined;
    }

    protected getKeywordDocumentation(keyword: GrammarAST.Keyword): MarkupContent | string | undefined {

        const documentationText = this.documentationProvider.getDocumentation(keyword);
        if (!documentationText) {
            return undefined;
        }
        return { kind: 'markdown', value: documentationText };
    }

    protected override completionForKeyword(context: CompletionContext, keyword: GrammarAST.Keyword, acceptor: CompletionAcceptor): MaybePromise<void> {
        if (!this.filterKeyword(context, keyword)) {
            return;
        }
        acceptor(context, {
            label: keyword.value,
            documentation: this.getKeywordDocumentation(keyword),
            kind: this.getKeywordCompletionItemKind(keyword),
            detail: 'Keyword',
            sortText: '0000'
        });

        const snippet = this.getSnippet(context, keyword);

        if (snippet) {
            acceptor(context, {
                label: keyword.value,
                insertText: snippet,
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: this.documentationProvider.getDocumentation(keyword),
                kind: CompletionItemKind.Snippet,
                detail: 'Snippet',
                sortText: '1000'
            });
        }
    }

    protected override  completionForCrossReference(context: CompletionContext, next: NextFeature<GrammarAST.CrossReference>, acceptor: CompletionAcceptor): MaybePromise<void> {
        const assignment = AstUtils.getContainerOfType(next.feature, GrammarAST.isAssignment);
        let { node } = context;
        if (assignment && node) {
            if (next.type) {
                // When `type` is set, it indicates that we have just entered a new parser rule.
                // The cross reference that we're trying to complete is on a new element that doesn't exist yet.
                // So we create a new synthetic element with the correct type information.
                node = {
                    $type: next.type,
                    $container: node,
                    $containerProperty: next.property
                };
                AstUtils.assignMandatoryProperties(this.astReflection, node);
            }
            const refInfo: ReferenceInfo = {
                reference: {
                    $refText: ''
                },
                container: node,
                property: assignment.feature
            };
            try {
                for (const candidate of this.getReferenceCandidates(refInfo, context)) {
                    acceptor(context, this.createReferenceCompletionItem(candidate));
                }
            } catch (err) {
                console.error(err);
            }

            if (node.$type === 'NamedElementReference' && assignment.feature === 'value') {

                const type = this.typeProvider.getType(node);
                if (type) {
                    acceptor(context, {
                        label: 'Default Value',
                        insertText: this.getDefaultValueForType(type),
                        kind: CompletionItemKind.Value,
                        detail: `Default value for ${type.$type} ${XsmpUtils.fqn(type)}.`,
                        sortText: '0000'
                    });
                }
            }
        }
    }
    getDefaultValueForType(type: ast.Type | undefined): string {
        if (!type) {
            return '';
        }

        if (ast.isArrayType(type)) {
            const value = Solver.getValueAs(type.size, PTK.Int64)?.integralValue(PTK.Int64)?.getValue();
            return value ? `{${new Array(Number(value)).fill(this.getDefaultValueForType(type.itemType?.ref)).join(', ')}}` : '{}';
        }
        if (ast.isStructure(type)) {
            return `{${this.attrHelper.getAllFields(type).map(f => `.${f.name} = ${this.getDefaultValueForType((f as ast.Field).type?.ref)}`).join(', ')}}`;
        }

        if (ast.isEnumeration(type)) {
            return type.literal.length > 0 ? XsmpUtils.fqn(type.literal[0]) : '0';
        }

        switch (XsmpUtils.getPTK(type)) {
            case PTK.Bool:
                return 'false';
            case PTK.Float32:
                return '0.0f';
            case PTK.Float64:
                return '0.0';
            case PTK.Int8:
            case PTK.Int16:
            case PTK.Int32:
                return '0';
            case PTK.Int64:
                return '0L';
            case PTK.UInt8:
            case PTK.UInt16:
            case PTK.UInt32:
                return '0U';
            case PTK.UInt64:
                return '0UL';
            case PTK.Char8:
                return "'\\0'";
            case PTK.String8:
                return '""';
            case PTK.DateTime:
                return '"1970-01-01T00:00:00Z"';
            case PTK.Duration:
                return '"PT0S"';
        }
        return '';
    }

    protected getCrossReferences(context: CompletionContext, type: string, property: string): string {

        const refInfo: ReferenceInfo = {
            reference: {
                $refText: ''
            },
            container: {
                $container: context.node,
                $type: type,

            },
            property
        };

        return this.getReferenceCandidates(refInfo, context).map(c => c.name).join(',');

    }
    protected getSnippet(context: CompletionContext, keyword: GrammarAST.Keyword): string | undefined {

        switch (keyword.value) {
            case 'array': return `
/** @uuid $UUID */
array \${1:name} = \${2|${this.getCrossReferences(context, 'ArrayType', 'itemType')}|}[$0]`;
            case 'association': return `association \${1|${this.getCrossReferences(context, 'Association', 'type')}|} \${2:name}`;
            case 'catalogue': return `
/**
* Specifies the SMP Component Model as Catalogue.
*
* @creator ${os.userInfo().username}
* @date ${new Date(Date.now()).toISOString()}
*/
catalogue \${1:name}
`;
            case 'class': return `
/** @uuid $UUID */
class \${1:name}
{
    $0
}`;
            case 'constant': return `constant \${1|${this.getCrossReferences(context, 'Constant', 'type')}|} \${2:name} = $0`;
            case 'container': return `container \${1|${this.getCrossReferences(context, 'Container', 'type')}|}[*] \${2:name}`;
            case 'def': return 'def void ${1:name} ($0)';
            case 'entrypoint': return 'entrypoint ${1:name}';
            case 'enum': return `
/** @uuid $UUID */
enum \${1:name}
{
    \${2:literal} = 0
}`;
            case 'event': return `
/** @uuid $UUID */
event \${1:name}`;
            case 'eventsink': return `eventsink \${1|${this.getCrossReferences(context, 'EventSink', 'type')}|} \${2:name}`;
            case 'eventsource': return `eventsource \${1|${this.getCrossReferences(context, 'EventSource', 'type')}|} \${2:name}`;
            case 'exception': return `
/** @uuid $UUID */
exception \${1:name} 
{
    $0
}`;
            case 'field': return `field \${1|${this.getCrossReferences(context, 'Field', 'type')}|} \${2:name}`;
            case 'integer': return `
/** @uuid $UUID */
integer \${1:name}`;
            case 'float': return `
/** @uuid $UUID */
float \${1:name}`;
            case 'interface': return `
/** @uuid $UUID */
interface \${1:name} 
{
    $0
}`;
            case 'model': return `
/** @uuid $UUID */
model \${1:name}
{
    $0
}`;
            case 'namespace': return `
namespace \${1:name}
{
    $0
} // namespace \${1:name}`;
            case 'property': return `property \${1|${this.getCrossReferences(context, 'Property', 'type')}|} \${2:name}`;
            case 'reference': return `reference \${1|${this.getCrossReferences(context, 'Reference_', 'interface')}|}[*] \${2:name}`;
            case 'service': return `
/** @uuid $UUID */
service \${1:name}
{
    $0
}`;
            case 'string': return `
/** @uuid $UUID */
string \${1:name}[$0]`;
            case 'struct': return `
/** @uuid $UUID */
struct \${1:name}
{
    $0
}`;
            case 'using': return `
/** @uuid $UUID */
using \${1:name} = \${2|${this.getCrossReferences(context, 'ValueReference', 'type')}|}*`;

            case 'native': return `
/** 
 * @type native_type
 * @location native_location
 * @namespace native_namespace
 * @uuid $UUID
 */
native \${1:name}`;
            case 'attribute': return `
/** 
 * // @allowMultiple
 * @usage ...
 * @uuid $UUID
 */
attribute \${1|${this.getCrossReferences(context, 'AttributeType', 'type')}|} \${2:name} = $0`;
            default:
                return undefined;
        }

    }

}
