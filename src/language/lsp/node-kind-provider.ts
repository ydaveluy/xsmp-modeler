import { AstNode, AstNodeDescription, isAstNodeDescription } from "langium";
import { NodeKindProvider } from "langium/lsp";
import { CompletionItemKind, SymbolKind } from 'vscode-languageserver';

export class XsmpNodeKindProvider implements NodeKindProvider {
    getCompletionItemKind(node: AstNode | AstNodeDescription): CompletionItemKind {
        return CompletionItemKind.Reference;
    }

    getSymbolKind(node: AstNode | AstNodeDescription): SymbolKind {

        const type = isAstNodeDescription(node) ? node.type : node.$type
        switch (type) {
            case 'ArrayType': return SymbolKind.Array
            case 'Constant': return SymbolKind.Constant
            case 'Enumeration': return SymbolKind.Enum
            case 'EnumerationLiteral': return SymbolKind.EnumMember
            case 'EventSink':
            case 'EventSource':
            case 'EventType':
                return SymbolKind.Event
            case 'Association':
            case 'EntryPoint':
                return SymbolKind.Object
            case 'Operation': return SymbolKind.Method
            case 'Interface': return SymbolKind.Interface
            case 'Integer':
            case 'PrimitiveType':
            case 'Float': return SymbolKind.Number
            case 'Project':
            case 'Tool':
            case 'Profile':
            case 'Catalogue':
                return SymbolKind.File
            case 'Property': return SymbolKind.Property
            case 'Parameter': return SymbolKind.Variable
            case 'StringType': return SymbolKind.String
            case 'Structure': return SymbolKind.Struct
            case 'Namespace': return SymbolKind.Namespace
            case 'Class':
            case 'Exception':
            case 'Model':
            case 'Service':
                return SymbolKind.Class
            default: return SymbolKind.Field
        }

    }
}