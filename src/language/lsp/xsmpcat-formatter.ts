import { isLeafCstNode, type AstNode, type CstNode, type TextDocument } from 'langium';
import type { FormattingAction, FormattingContext, NodeFormatter } from 'langium/lsp';
import { AbstractFormatter, Formatting } from 'langium/lsp';
import * as ast from '../generated/ast.js';
import type { TextEdit, Range } from 'vscode-languageserver-protocol';

export class XsmpcatFormatter extends AbstractFormatter {

    protected override avoidOverlappingEdits(textDocument: TextDocument, textEdits: TextEdit[]): TextEdit[] {
        const edits: TextEdit[] = [];
        for (const edit of textEdits) {
            let last = edits[edits.length - 1];
            while (last) {
                const currentStart = textDocument.offsetAt(edit.range.start);
                const lastEnd = textDocument.offsetAt(last.range.end);
                if (currentStart < lastEnd) {
                    edits.pop();
                    last = edits[edits.length - 1];
                }
                else {
                    break;
                }
            }
            edits.push(edit);
        }
        return edits.filter(e => e.newText !== textDocument.getText(e.range));
    }

    protected override createTextEdit(a: CstNode | undefined, b: CstNode, formatting: FormattingAction, context: FormattingContext): TextEdit[] {
        if (b.hidden) {
            return this.createHiddenTextEdits(a, b, formatting, context);
        }
        const betweenRange: Range = {
            start: a?.range.end ?? {
                character: 0,
                line: 0
            },
            end: b.range.start
        };
        const move = this.findFittingMove(betweenRange, formatting.moves, context);
        if (!move) {
            return [];
        }
        const chars = move.characters;
        const lines = move.lines;
        const tabs = move.tabs;
        const existingIndentation = context.indentation;
        context.indentation += (tabs ?? 0);
        const edits: TextEdit[] = [];
        if (chars !== undefined) {
            // Do not apply formatting on the same line if preceding node is hidden
            if (!a?.hidden) {
                edits.push(this.createSpaceTextEdit(betweenRange, chars, formatting.options));
            }
        } else if (lines !== undefined) {
            edits.push(this.createLineTextEdit(betweenRange, lines, context, formatting.options));
        } else if (tabs !== undefined) {
            edits.push(this.createTabTextEdit(betweenRange, Boolean(a), context));
        }
        if (isLeafCstNode(b)) {
            context.indentation = existingIndentation;
        }
        return edits;
    }

    [key: string]: any;



    protected override format(node: AstNode): void {
        const id = `format${node.$type}`;

        if (typeof this[id] === 'function') {
            const formatter = this.getNodeFormatter(node);
            this[id](node, formatter);
        }
    }

    formatAttribute(node: ast.Attribute, formatter: NodeFormatter<ast.Attribute>) {
        formatter.property('type').prepend(Formatting.noSpace());
        const bracesOpen = formatter.keyword('(');
        const bracesClose = formatter.keyword(')');
        bracesOpen.surround(Formatting.noSpace());
        bracesClose.prepend(Formatting.noSpace());
    }

    formatParameter(node: ast.Parameter, formatter: NodeFormatter<ast.Parameter>) {
        formatter.property('direction').append(Formatting.oneSpace());
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.keyword('=').surround(Formatting.oneSpace());
    }
    formatReturnParameter(node: ast.ReturnParameter, formatter: NodeFormatter<ast.ReturnParameter>) {
        formatter.property('name').surround(Formatting.oneSpace());
    }
    formatContainer(node: ast.Container, formatter: NodeFormatter<ast.Container>) {
        formatter.property('type').prepend(Formatting.oneSpace());
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.property('optional').prepend(Formatting.noSpace());
        formatter.property('multiplicity').prepend(Formatting.noSpace());
        formatter.keyword('=').surround(Formatting.oneSpace());
    }

    formatReference_(node: ast.Reference_, formatter: NodeFormatter<ast.Reference_>) {
        formatter.property('interface').prepend(Formatting.oneSpace());
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.property('optional').prepend(Formatting.noSpace());
        formatter.property('multiplicity').prepend(Formatting.noSpace());
    }

    formatMultiplicity(node: ast.Multiplicity, formatter: NodeFormatter<ast.Multiplicity>) {
        formatter.keyword('[').append(Formatting.noSpace());
        formatter.keyword(']').prepend(Formatting.noSpace());
        formatter.keyword('...').surround(Formatting.oneSpace());
    }

    formatEntryPoint(node: ast.EntryPoint, formatter: NodeFormatter<ast.EntryPoint>) {
        formatter.property('name').prepend(Formatting.oneSpace());
    }

    formatEventSource(node: ast.EventSource, formatter: NodeFormatter<ast.EventSource>) {
        formatter.property('type').surround(Formatting.oneSpace());
    }

    formatEventSink(node: ast.EventSink, formatter: NodeFormatter<ast.EventSink>) {
        formatter.property('type').surround(Formatting.oneSpace());
    }

    formatEnumerationLiteral(node: ast.EnumerationLiteral, formatter: NodeFormatter<ast.EnumerationLiteral>) {
        formatter.keyword('=').surround(Formatting.oneSpace());
    }

    formatCatalogue(node: ast.Catalogue, formatter: NodeFormatter<ast.Catalogue>) {
        formatter.keyword('catalogue').prepend(Formatting.noIndent())
        formatter.property('name').prepend(Formatting.oneSpace()).append(Formatting.newLine({ allowMore: true }));
        formatter.nodes(...node.elements).prepend(Formatting.noIndent())
    }

    formatNamespace(node: ast.Namespace, formatter: NodeFormatter<ast.Namespace>) {
        formatter.property('name').prepend(Formatting.oneSpace());
        this.formatBody(node, formatter);
    }

    formatConstantOrFieldOrAssociationOrAttributeType(node: ast.Constant | ast.Field | ast.Association | ast.AttributeType,
        formatter: NodeFormatter<ast.Constant | ast.Field | ast.Association | ast.AttributeType>) {
        this.formatMofifiers(formatter);
        formatter.property('type').surround(Formatting.oneSpace());
        formatter.keyword('=').surround(Formatting.oneSpace());
    }

    formatAttributeType(node: ast.AttributeType, formatter: NodeFormatter<ast.AttributeType>) {
        this.formatConstantOrFieldOrAssociationOrAttributeType(node, formatter);
    }

    formatField(node: ast.Field, formatter: NodeFormatter<ast.Field>) {
        this.formatConstantOrFieldOrAssociationOrAttributeType(node, formatter);
    }

    formatConstant(node: ast.Constant, formatter: NodeFormatter<ast.Constant>) {
        this.formatConstantOrFieldOrAssociationOrAttributeType(node, formatter);
    }

    formatAssociation(node: ast.Association, formatter: NodeFormatter<ast.Association>) {
        this.formatConstantOrFieldOrAssociationOrAttributeType(node, formatter);
    }

    formatProperty(node: ast.Property, formatter: NodeFormatter<ast.Property>) {
        this.formatMofifiers(formatter);
        formatter.property('type').surround(Formatting.oneSpace());
        formatter.keyword('get').surround(Formatting.oneSpace());
        formatter.keyword('set').surround(Formatting.oneSpace());
        formatter.keywords('throws').append(Formatting.oneSpace());
        this.formatCommaList(formatter);
        formatter.keyword('->').surround(Formatting.oneSpace());
    }

    formatOperation(node: ast.Operation, formatter: NodeFormatter<ast.Operation>) {
        this.formatMofifiers(formatter);
        formatter.keyword('void').surround(Formatting.oneSpace());
        formatter.property('returnParameter').surround(Formatting.oneSpace());
        formatter.property('name').prepend(Formatting.oneSpace()).append(Formatting.noSpace());
        formatter.keyword('(').append(Formatting.noSpace());
        this.formatCommaList(formatter);
        formatter.keyword(')').prepend(Formatting.noSpace());
        formatter.keyword('throws').surround(Formatting.oneSpace());
    }

    formatClass(node: ast.Class, formatter: NodeFormatter<ast.Class>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.keyword('extends').surround(Formatting.oneSpace());
        this.formatBody(node, formatter);
    }

    formatException(node: ast.Exception, formatter: NodeFormatter<ast.Exception>) {
        this.formatClass(node, formatter);
    }

    formatStructure(node: ast.Structure, formatter: NodeFormatter<ast.Structure>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
        this.formatBody(node, formatter);
    }

    formatInteger(node: ast.Integer, formatter: NodeFormatter<ast.Integer>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.keyword('extends').surround(Formatting.oneSpace());
        formatter.keyword('in').surround(Formatting.oneSpace());
        formatter.keyword('...').surround(Formatting.oneSpace());
    }

    formatFloat(node: ast.Float, formatter: NodeFormatter<ast.Float>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.keyword('extends').surround(Formatting.oneSpace());
        formatter.keyword('in').surround(Formatting.oneSpace());
        formatter.property('range').surround(Formatting.oneSpace());
    }

    formatComponent(node: ast.Component, formatter: NodeFormatter<ast.Component>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.keyword('extends').surround(Formatting.oneSpace());
        formatter.keyword('implements').surround(Formatting.oneSpace());
        this.formatCommaList(formatter);
        this.formatBody(node, formatter);
    }

    formatModel(node: ast.Model, formatter: NodeFormatter<ast.Model>) {
        this.formatComponent(node, formatter);
    }

    formatService(node: ast.Service, formatter: NodeFormatter<ast.Service>) {
        this.formatComponent(node, formatter);
    }

    formatInterface(node: ast.Interface, formatter: NodeFormatter<ast.Interface>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.keyword('extends').surround(Formatting.oneSpace());
        this.formatCommaList(formatter);
        this.formatBody(node, formatter);
    }

    formatArrayType(node: ast.ArrayType, formatter: NodeFormatter<ast.ArrayType>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.keyword('=').surround(Formatting.oneSpace());
        formatter.keyword('[').surround(Formatting.noSpace());
        formatter.keyword(']').prepend(Formatting.noSpace());
    }

    formatEnumeration(node: ast.Enumeration, formatter: NodeFormatter<ast.Enumeration>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
        const bracesOpen = formatter.keyword('{');
        const bracesClose = formatter.keyword('}');
        bracesOpen.prepend(Formatting.newLine()).append(Formatting.newLine({ allowMore: true }));
        formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
        formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.newLine());
        bracesClose.prepend(Formatting.newLine()).append(Formatting.newLine({ allowMore: true }));
    }

    formatEventType(node: ast.EventType, formatter: NodeFormatter<ast.EventType>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.keyword('extends').surround(Formatting.oneSpace());
    }

    formatStringType(node: ast.StringType, formatter: NodeFormatter<ast.StringType>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.keyword('[').surround(Formatting.noSpace());
        formatter.keyword(']').prepend(Formatting.noSpace());
    }

    formatValueReference(node: ast.ValueReference, formatter: NodeFormatter<ast.ValueReference>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
        formatter.keyword('=').surround(Formatting.oneSpace());
        formatter.keyword('*').prepend(Formatting.noSpace());
    }

    formatNativeType(node: ast.NativeType, formatter: NodeFormatter<ast.NativeType>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
    }

    formatPrimitiveType(node: ast.PrimitiveType, formatter: NodeFormatter<ast.PrimitiveType>) {
        this.formatMofifiers(formatter);
        formatter.property('name').prepend(Formatting.oneSpace());
    }

    formatCollectionLiteral(node: ast.CollectionLiteral, formatter: NodeFormatter<ast.CollectionLiteral>) {
        formatter.keyword('{').surround(Formatting.oneSpace());
        formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
        formatter.keyword('}').prepend(Formatting.oneSpace());
    }

    formatDesignatedInitializer(node: ast.DesignatedInitializer, formatter: NodeFormatter<ast.DesignatedInitializer>) {
        formatter.keyword('.').append(Formatting.noSpace());
        formatter.keyword('=').surround(Formatting.oneSpace());
    }

    formatUnaryOperation(node: ast.UnaryOperation, formatter: NodeFormatter<ast.UnaryOperation>) {
        formatter.property('feature').append(Formatting.noSpace());
    }

    formatBinaryOperation(node: ast.BinaryOperation, formatter: NodeFormatter<ast.BinaryOperation>) {
        formatter.property('feature').surround(Formatting.oneSpace());
    }

    formatParenthesizedExpression(node: ast.ParenthesizedExpression, formatter: NodeFormatter<ast.ParenthesizedExpression>) {
        formatter.property('expr').surround(Formatting.noSpace());
    }

    protected formatCommaList(formatter: NodeFormatter<AstNode>): void {
        formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
    }

    protected formatMofifiers(formatter: NodeFormatter<ast.VisibilityElement>): void {
        formatter.properties('modifiers').append(Formatting.oneSpace());
    }

    protected formatBody(type: ast.WithBody, formatter: NodeFormatter<ast.WithBody>): void {
        const bracesOpen = formatter.keyword('{');
        const bracesClose = formatter.keyword('}');
        bracesOpen.prepend(Formatting.newLine());
        bracesOpen.append(Formatting.newLine({ allowMore: true }));
        formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
        bracesClose.prepend(Formatting.newLine());
        bracesClose.append(Formatting.newLine({ allowMore: true }));
    }

}