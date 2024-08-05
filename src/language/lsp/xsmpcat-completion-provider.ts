import { ReferenceInfo, AstNodeDescription, Stream, MaybePromise, GrammarAST } from "langium";
import { CompletionAcceptor, CompletionContext, DefaultCompletionProvider } from "langium/lsp";


import { CompletionItemKind, InsertTextFormat, MarkupContent } from 'vscode-languageserver';
import { Instant } from "@js-joda/core";
import * as os from 'os';


export class XsmpcatCompletionProvider extends DefaultCompletionProvider {



    public static getFilter(refInfo: ReferenceInfo,): ((desc: AstNodeDescription) => boolean) | undefined {

        const refId = `${refInfo.container.$type}_${refInfo.property}`
        switch (refId) {
            case 'Attribute_type':
                return (desc) => 'AttributeType' === desc.type
            case 'Class_base':
                return (desc) => 'Class' === desc.type// && (desc.node as ast.Class ).base?.ref !== refInfo.container
            case 'Interface_base':
            case 'Model_interface':
            case 'Service_interface':
            case 'Reference__interface':
                return (desc) => 'Interface' === desc.type
            case 'Model_base':
                return (desc) => 'Model' === desc.type
            case 'Service_base':
                return (desc) => 'Service' === desc.type
            case 'ArrayType_itemType':
            case 'ValueReference_type':
            case 'AttributeType_type':
            case 'Field_type':
            case 'Property_type':
                return (desc) => ['ArrayType', 'Class', 'Enumeration', 'Exception', 'Float', 'Integer', 'PrimitiveType', 'StringType', 'Structure'].includes(desc.type) // ValueType
            case 'Integer_primitiveType':
                return (desc) => 'PrimitiveType' === desc.type && ['Int8', 'Int16', 'Int32', 'Int64', 'UInt8', 'UInt16', 'UInt32', 'UInt64'].includes(desc.name)
            case 'Float_primitiveType':
                return (desc) => 'PrimitiveType' === desc.type && ['Float32', 'Float64'].includes(desc.name)
            case 'EventType_eventArg':
            case 'Constant_type':
                return (desc) => ['Enumeration', 'Float', 'Integer', 'PrimitiveType', 'StringType'].includes(desc.type) // SimpleType
            case 'Parameter_type':
            case 'Association_type':
                return (desc) => ['ArrayType', 'Class', 'Enumeration', 'Exception', 'Float', 'Integer', 'Interface', 'Model', 'NativeType', 'PrimitiveType', 'Service', 'StringType', 'Structure', 'ValueReference'].includes(desc.type) // LanguageType
            case 'Container_type':
                return (desc) => ['Interface', 'Model', 'Service'].includes(desc.type) // ReferenceType
            case 'Container_defaultComponent':
                return (desc) => ['Model', 'Service'].includes(desc.type) // Component
            case 'EventSink_type':
            case 'EventSource_type':
                return (desc) => 'EventType' === desc.type
            case 'Operation_raisedException':
            case 'Property_getRaises':
            case 'Property_setRaises':
            case 'Exception_base':
                return (desc) => 'Exception' === desc.type
        }
        return undefined
    }


    /**
     * Filter duplicate tools and dependencies
     *
     * @param refInfo Information about the reference for which the candidates are requested.
     * @param _context Information about the completion request including document, cursor position, token under cursor, etc.
     * @returns A stream of all elements being valid for the given reference.
     */
    protected override getReferenceCandidates(refInfo: ReferenceInfo, _context: CompletionContext): Stream<AstNodeDescription> {

        const filter = XsmpcatCompletionProvider.getFilter(refInfo)
        if (filter) {
            return super.getReferenceCandidates(refInfo, _context).filter(filter)
        }
        return super.getReferenceCandidates(refInfo, _context)
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
            sortText: '1'
        });

        const snippet = this.getSnippet(context, keyword)

        if (snippet) {
            acceptor(context, {
                label: keyword.value,
                insertText: snippet,
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: this.documentationProvider.getDocumentation(keyword),
                kind: CompletionItemKind.Snippet,
                detail: 'Snippet',
                sortText: '0'
            })
        }
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
            property: property
        };

        return this.getReferenceCandidates(refInfo, context).map(c => c.name).join(',')


    }
    protected getSnippet(context: CompletionContext, keyword: GrammarAST.Keyword): string | undefined {

        switch (keyword.value) {
            case 'array': return `
/** @uuid $UUID */
array \${1:name} = \${2|${this.getCrossReferences(context, 'ArrayType', 'itemType')}|}[$0]`
            case 'association': return `association \${1|${this.getCrossReferences(context, 'Association', 'type')}|} \${2:name}`
            case 'catalogue': return `
/**
* Specifies the SMP Component Model as Catalogue.
*
* @date ${Instant.now().toString()}
* @author ${os.userInfo().username}
* @title Catalogue
* @version 1.0
*/
catalogue \${1:name}
`
            case 'class': return `
/** @uuid $UUID */
class \${1:name}
{
    $0
}`
            case 'constant': return `constant \${1|${this.getCrossReferences(context, 'Constant', 'type')}|} \${2:name} = $0`
            case 'container': return `container \${1|${this.getCrossReferences(context, 'Container', 'type')}|}[*] \${2:name}`
            case 'def': return `def void \${1:name} ($0)`
            case 'entrypoint': return `entrypoint \${1:name}`
            case 'enum': return `
/** @uuid $UUID */
enum \${1:name}
{
    \${2:literal} = 0
}`
            case 'event': return `
/** @uuid $UUID */
event \${1:name}`
            case 'eventsink': return `eventsink \${1|${this.getCrossReferences(context, 'EventSink', 'type')}|} \${2:name}`
            case 'eventsource': return `eventsource \${1|${this.getCrossReferences(context, 'EventSource', 'type')}|} \${2:name}`
            case 'exception': return `
/** @uuid $UUID */
exception \${1:name} 
{
    $0
}`
            case 'field': return `field \${1|${this.getCrossReferences(context, 'Field', 'type')}|} \${2:name}`
            case 'integer': return `
/** @uuid $UUID */
integer \${1:name}`
            case 'float': return `
/** @uuid $UUID */
float \${1:name}`
            case 'interface': return `
/** @uuid $UUID */
interface \${1:name} 
{
    $0
}`
            case 'model': return `
/** @uuid $UUID */
model \${1:name}
{
    $0
}`
            case 'namespace': return `
namespace \${1:name}
{
    $0
} // namespace \${1:name}`
            case 'property': return `property \${1|${this.getCrossReferences(context, 'Property', 'type')}|} \${2:name}`
            case 'reference': return `reference \${1|${this.getCrossReferences(context, 'Reference_', 'interface')}|}[*] \${2:name}`
            case 'service': return `
/** @uuid $UUID */
service \${1:name}
{
    $0
}`
            case 'string': return `
/** @uuid $UUID */
string \${1:name}[$0]`
            case 'struct': return `
/** @uuid $UUID */
struct \${1:name}
{
    $0
}`
            case 'using': return `
/** @uuid $UUID */
using \${1:name} = \${2|${this.getCrossReferences(context, 'ValueReference', 'type')}|}*`

            case 'native': return `
/** 
 * @type native_type
 * @location native_location
 * @namespace native_namespace
 * @uuid $UUID
 */
native \${1:name}`
            case 'attribute': return `
/** 
 * // @allowMultiple
 * @usage ...
 * @uuid $UUID
 */
attribute \${1|${this.getCrossReferences(context, 'AttributeType', 'type')}|} \${2:name} = $0`
            default:
                return undefined
        }


    }

}