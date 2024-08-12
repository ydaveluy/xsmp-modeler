import type { AstNode, AstNodeDescription } from 'langium';
import { isAstNodeDescription } from 'langium';
import type { NodeKindProvider } from 'langium/lsp';
import { CompletionItemKind, SymbolKind } from 'vscode-languageserver';
import * as ast from '../generated/ast.js';

export class XsmpNodeKindProvider implements NodeKindProvider {
    getCompletionItemKind(_node: AstNode | AstNodeDescription): CompletionItemKind {
        return CompletionItemKind.Reference;
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
            case ast.Association:
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
                return SymbolKind.File;
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
            default: return SymbolKind.Field;
        }

    }
}