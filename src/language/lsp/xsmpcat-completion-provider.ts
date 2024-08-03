import { ReferenceInfo, AstNodeDescription, Stream } from "langium";
import { CompletionContext, DefaultCompletionProvider } from "langium/lsp";
//import * as ast from '../generated/ast.js';





export class XsmpcatCompletionProvider extends DefaultCompletionProvider {



    public static getFilter(refId: string): ((node: AstNodeDescription) => boolean) | undefined {

        switch (refId) {
            case 'Attribute_type':
                return (node) => 'AttributeType' === node.type
            case 'Class_base':
                return (node) => 'Class' === node.type
            case 'Interface_base':
            case 'Model_interface':
            case 'Service_interface':
            case 'Reference__interface':
                return (node) => 'Interface' === node.type
            case 'Model_base':
                return (node) => 'Model' === node.type
            case 'Service_base':
                return (node) => 'Service' === node.type
            case 'ArrayType_itemType':
            case 'ValueReference_type':
            case 'AttributeType_type':
            case 'Field_type':
            case 'Property_type':
                return (node) => ['ArrayType', 'Class', 'Enumeration', 'Exception', 'Float', 'Integer', 'PrimitiveType', 'StringType', 'Structure'].includes(node.type) // ValueType
            case 'Integer_primitiveType':
            case 'Float_primitiveType':
                return (node) => 'PrimitiveType' === node.type
            case 'EventType_eventArg':
            case 'Constant_type':
                return (node) => ['Enumeration', 'Float', 'Integer', 'PrimitiveType', 'StringType'].includes(node.type) // SimpleType
            case 'Parameter_type':
            case 'Association_type':
                return (node) => ['ArrayType', 'Class', 'Enumeration', 'Exception', 'Float', 'Integer', 'Interface', 'Model', 'NativeType', 'PrimitiveType', 'Service', 'StringType', 'Structure', 'ValueReference'].includes(node.type) // LanguageType
            case 'Container_type':
                return (node) => ['Interface', 'Model', 'Service'].includes(node.type) // ReferenceType
            case 'Container_defaultComponent':
                return (node) => ['Model', 'Service'].includes(node.type) // Component
            case 'EventSink_type':
            case 'EventSource_type':
                return (node) => 'EventType' === node.type
            case 'Operation_raisedException':
            case 'Property_getRaises':
            case 'Property_setRaises':
            case 'Exception_base':
                return (node) => 'Exception' === node.type
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

        const refId = `${refInfo.container.$type}_${refInfo.property}`
        const filter = XsmpcatCompletionProvider.getFilter(refId)
        if (filter) {
            return super.getReferenceCandidates(refInfo, _context).filter(filter)
        }
        return super.getReferenceCandidates(refInfo, _context)
    }


}