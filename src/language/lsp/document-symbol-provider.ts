import { type DocumentBuilder, DocumentState, type AstNode, type Cancellation, type LangiumDocument, type MaybePromise } from 'langium';
import type { DocumentSymbolProvider, NodeKindProvider } from 'langium/lsp';
import type { DocumentSymbol, DocumentSymbolParams } from 'vscode-languageserver';
import { SymbolTag } from 'vscode-languageserver';
import * as ast from '../generated/ast.js';
import * as XsmpUtils from '../utils/xsmp-utils.js';
import type { XsmpcatServices } from '../xsmpcat-module.js';
import type { XsmpprojectServices } from '../xsmpproject-module.js';
import { getValueAs } from '../utils/solver.js';
import { PTK } from '../utils/primitive-type-kind.js';

export class XsmpDocumentSymbolProvider implements DocumentSymbolProvider {

    protected readonly nodeKindProvider: NodeKindProvider;
    protected readonly documentBuilder: DocumentBuilder;

    constructor(services: XsmpcatServices | XsmpprojectServices) {
        this.nodeKindProvider = services.shared.lsp.NodeKindProvider;
        this.documentBuilder = services.shared.workspace.DocumentBuilder;
    }
    getSymbols(document: LangiumDocument, _params: DocumentSymbolParams, cancelToken?: Cancellation.CancellationToken): MaybePromise<DocumentSymbol[]> {
        return this.documentBuilder.waitUntil(DocumentState.ComputedScopes, document.uri, cancelToken)
            .then(() => this.getSymbol(document, document.parseResult.value));
    }

    protected getSymbol(document: LangiumDocument, astNode: AstNode): DocumentSymbol[] {
        const node = astNode.$cstNode;

        if (node && ast.isNamedElement(astNode)) {

            return [{
                kind: this.nodeKindProvider.getSymbolKind(astNode),
                name: this.getSymbolName(astNode),
                range: node.range,
                selectionRange: node.range,
                children: this.getChildSymbols(document, astNode),
                tags: this.getSymbolTags(astNode),
                detail: this.getSymbolDetails(astNode),
            }];
        }
        return this.getChildSymbols(document, astNode) || [];

    }

    protected getSymbolTags(node: ast.NamedElement): SymbolTag[] | undefined {
        if (XsmpUtils.IsDeprecated(node)) {
            return [SymbolTag.Deprecated];
        }
        return undefined;
    }

    protected getChildSymbols(document: LangiumDocument, astNode: AstNode): DocumentSymbol[] | undefined {
        if ('elements' in astNode) {
            return (astNode.elements as AstNode[]).flatMap(e => this.getSymbol(document, e));
        }
        return undefined;
    }
    protected getSymbolDetails(node: ast.NamedElement): string | undefined {
        switch (node.$type) {

            case ast.Association: return (node as ast.Association).type.$refText + '*'; //TODO add * if by pointer
            case ast.Constant: return (node as ast.Constant).type.$refText;
            case ast.Container: return (node as ast.Container).type.$refText + this.getMultiplicity(node as ast.NamedElementWithMultiplicity);
            case ast.EventSink: return `EventSink<${(node as ast.EventSink).type.$refText}>`;
            case ast.EventSource: return `EventSource<${(node as ast.EventSource).type.$refText}>`;
            case ast.Field: return (node as ast.Field).type.$refText;
            case ast.AttributeType: return (node as ast.AttributeType).type.$refText;
            case ast.EventType: return (node as ast.EventType).eventArgs ? (node as ast.EventType).eventArgs?.$refText : 'void';
            case ast.Integer: return (node as ast.Integer).primitiveType ? (node as ast.Integer).primitiveType?.$refText : 'Smp::Int32';
            case ast.Float: return (node as ast.Float).primitiveType ? (node as ast.Float).primitiveType?.$refText : 'Smp::Float64';
            case ast.ValueReference: return (node as ast.ValueReference).type.$refText + '*';
            case ast.ArrayType: return `${(node as ast.ArrayType).itemType.$refText}[${getValueAs((node as ast.ArrayType).size, PTK.Int64)?.getValue()}]`;
            case ast.Operation: return (node as ast.Operation).returnParameter ? (node as ast.Operation).returnParameter?.type.$refText : 'void';
            case ast.Property: return (node as ast.Property).type.$refText;
            case ast.Reference_: return (node as ast.Reference_).interface.$refText + this.getMultiplicity(node as ast.NamedElementWithMultiplicity);
            case ast.Model:
            case ast.Service:
            case ast.Class:
            case ast.Exception:
            case ast.EntryPoint:
                return node.$type;
            default: return undefined;
        }
    }
    protected getSymbolName(node: ast.NamedElement): string {
        if (node.$type === ast.Operation) {
            return `${node.name}(${(node as ast.Operation).parameter.map(XsmpUtils.getParameterSignature).join(', ')})`;
        }
        return node.name;
    }

    protected getMultiplicity(node: ast.NamedElementWithMultiplicity): string {
        const lower = XsmpUtils.getLower(node) ?? BigInt(1);
        const upper = XsmpUtils.getUpper(node) ?? BigInt(1);
        if (lower === BigInt(0) && upper === BigInt(1)) {
            return '?';
        }
        else if (lower === BigInt(1) && upper === BigInt(1)) {
            return '';
        }
        else if (lower === upper) {
            return `[${lower}]`;
        }
        else if (upper < BigInt(0)) {
            if (lower === BigInt(0)) {
                return '*';
            }
            else if (lower === BigInt(1)) {
                return '+';
            }
            else {
                return `[${lower} ... *]`;
            }
        }
        else {
            return `[${lower} ... ${upper}]`;
        }

    }

}