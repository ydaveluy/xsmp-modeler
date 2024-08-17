import type { AstNode, AstNodeDescription } from 'langium';
import { isAstNodeDescription } from 'langium';
import type { NodeKindProvider } from 'langium/lsp';
import { CompletionItemKind, SymbolKind } from 'vscode-languageserver';
import * as ast from '../generated/ast.js';

export class XsmpNodeKindProvider implements NodeKindProvider {
    getCompletionItemKind(node: AstNode | AstNodeDescription): CompletionItemKind {

        const type = isAstNodeDescription(node) ? node.type : node.$type;
        switch (type) {
            case ast.ArrayType: return CompletionItemKind.Operator;
            case ast.Constant: return CompletionItemKind.Constant;
            case ast.Enumeration: return CompletionItemKind.Enum;
            case ast.EnumerationLiteral: return CompletionItemKind.EnumMember;
            case ast.EventSink:
            case ast.EventSource:
            case ast.EventType:
                return CompletionItemKind.Event;
            case ast.Interface: return CompletionItemKind.Interface;
            case ast.Integer:
            case ast.PrimitiveType:
            case ast.Float:
                return CompletionItemKind.TypeParameter;
            case ast.Project:
            case ast.Tool:
            case ast.Profile:
            case ast.Catalogue:
                return CompletionItemKind.File;
            case ast.StringType: return CompletionItemKind.Text;
            case ast.Structure: return CompletionItemKind.Struct;
            case ast.Class:
            case ast.Exception:
            case ast.Model:
            case ast.Service:
                return CompletionItemKind.Class;
            case ast.Field:
            case ast.Property:
            default: return CompletionItemKind.Field;
        }
    }

    getSymbolKind(node: AstNode | AstNodeDescription): SymbolKind {

        const type = isAstNodeDescription(node) ? node.type : node.$type;
        switch (type) {
            case ast.ArrayType: return SymbolKind.Array;
            case ast.Constant: return SymbolKind.Constant;
            case ast.Enumeration: return SymbolKind.Enum;
            case ast.EnumerationLiteral: return SymbolKind.EnumMember;
            case ast.EventSink:
            case ast.EventSource:
            case ast.EventType:
                return SymbolKind.Event;
            case ast.EntryPoint:
                return SymbolKind.Object;
            case ast.Operation: return SymbolKind.Method;
            case ast.Interface: return SymbolKind.Interface;
            case ast.Integer:
            case ast.PrimitiveType:
            case ast.Float: return SymbolKind.Number;
            case ast.Project:
            case ast.Tool:
            case ast.Profile:
            case ast.Catalogue:
                return SymbolKind.Package;
            case ast.Property: return SymbolKind.Property;
            case ast.Parameter: return SymbolKind.Variable;
            case ast.StringType: return SymbolKind.String;
            case ast.Structure: return SymbolKind.Struct;
            case ast.Namespace: return SymbolKind.Namespace;
            case ast.Class:
            case ast.Exception:
            case ast.Model:
            case ast.Service:
                return SymbolKind.Class;
            case ast.Association:
            case ast.Field:
            default: return SymbolKind.Field;
        }

    }

}