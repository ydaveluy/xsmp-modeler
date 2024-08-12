import type { AstNode } from 'langium';
import type { NodeFormatter } from 'langium/lsp';
import { AbstractFormatter, Formatting } from 'langium/lsp';
import * as ast from '../generated/ast.js';

export class XsmpcatFormatter extends AbstractFormatter {
    protected override format(node: AstNode): void {

        if (ast.isExpression(node)) {
            this.formatExpression(node);
        }
        else if (ast.isVisibilityElement(node)) {
            this.formatIsVisibilityElement(node);
        }
        else if (ast.isNamespace(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('name').prepend(Formatting.oneSpace());
            this.formatBody(node, formatter);
        }
        else if (ast.isAttribute(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('type').prepend(Formatting.noSpace());
            const bracesOpen = formatter.keyword('('),
                bracesClose = formatter.keyword(')');
            bracesOpen.surround(Formatting.noSpace());
            bracesClose.prepend(Formatting.noSpace());
        }
        else if (ast.isParameter(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('direction').append(Formatting.oneSpace());
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.keywords('=').surround(Formatting.oneSpace());
        }
        else if (ast.isContainer(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('type').prepend(Formatting.oneSpace());
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.property('optional').prepend(Formatting.noSpace());
            formatter.property('multiplicity').prepend(Formatting.noSpace());
            formatter.keywords('=').surround(Formatting.oneSpace());
        }
        else if (ast.isReference_(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('interface').prepend(Formatting.oneSpace());
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.property('optional').prepend(Formatting.noSpace());
            formatter.property('multiplicity').prepend(Formatting.noSpace());
        }
        else if (ast.isMultiplicity(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('[').append(Formatting.noSpace());
            formatter.keyword(']').prepend(Formatting.noSpace());
            formatter.keyword('...').surround(Formatting.oneSpace());
        }
        else if (ast.isEntryPoint(node)) {
            this.getNodeFormatter(node).property('name').prepend(Formatting.oneSpace());
        }
        else if (ast.isEventSink(node) || ast.isEventSource(node)) {
            this.getNodeFormatter(node).property('type').surround(Formatting.oneSpace());
        }
        else if (ast.isEnumerationLiteral(node)) {
            this.getNodeFormatter(node).keyword('=').surround(Formatting.oneSpace());
        }
        else if (ast.isCatalogue(node)) {
            this.getNodeFormatter(node).property('name').prepend(Formatting.oneSpace()).append(Formatting.newLine({ allowMore: true }));
        }
    }

    protected formatIsVisibilityElement(node: ast.VisibilityElement): void {
        if (ast.isType(node)) {
            this.formatType(node);
        }
        else if (ast.isConstant(node) || ast.isField(node) || ast.isAssociation(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('type').surround(Formatting.oneSpace());
            formatter.keyword('=').surround(Formatting.oneSpace());
        }
        else if (ast.isProperty(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('type').surround(Formatting.oneSpace());
            formatter.keyword('get').surround(Formatting.oneSpace());
            formatter.keyword('set').surround(Formatting.oneSpace());
            formatter.keywords('throws').surround(Formatting.oneSpace());
            this.formatCommaList(formatter);
            formatter.keyword('->').surround(Formatting.oneSpace());
        }
        else if (ast.isOperation(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.keywords('void').surround(Formatting.oneSpace());
            formatter.property('returnParameter').surround(Formatting.oneSpace());
            formatter.property('name').prepend(Formatting.oneSpace()).append(Formatting.noSpace());
            this.formatCommaList(formatter);
            formatter.keywords(')').prepend(Formatting.noSpace());
            formatter.keywords('throws').surround(Formatting.oneSpace());
        }

    }

    protected formatType(node: ast.Type): void {
        if (ast.isClass(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.keyword('extends').surround(Formatting.oneSpace());
            this.formatBody(node, formatter);
        }
        else if (ast.isStructure(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
            this.formatBody(node, formatter);
        }
        else if (ast.isInteger(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.keyword('extends').surround(Formatting.oneSpace());
            formatter.keyword('in').surround(Formatting.oneSpace());
            formatter.keyword('...').surround(Formatting.oneSpace());
        }
        else if (ast.isFloat(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.keyword('extends').surround(Formatting.oneSpace());
            formatter.keyword('in').surround(Formatting.oneSpace());
            formatter.property('range').surround(Formatting.oneSpace());
        }
        else if (ast.isComponent(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.keyword('extends').surround(Formatting.oneSpace());
            formatter.keyword('implements').surround(Formatting.oneSpace());
            this.formatCommaList(formatter);
            this.formatBody(node, formatter);
        }
        else if (ast.isInterface(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.keyword('extends').surround(Formatting.oneSpace());
            this.formatCommaList(formatter);
            this.formatBody(node, formatter);
        }
        else if (ast.isArrayType(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.keyword('=').surround(Formatting.oneSpace());
            formatter.keyword('[').surround(Formatting.noSpace());
            formatter.keyword(']').prepend(Formatting.noSpace());
        }
        else if (ast.isEnumeration(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
            const bracesOpen = formatter.keyword('{'),
                bracesClose = formatter.keyword('}');
            bracesOpen.prepend(Formatting.newLine()).append(Formatting.newLine({ allowMore: true }));
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.newLine());
            bracesClose.prepend(Formatting.newLine()).append(Formatting.newLine({ allowMore: true }));
        }
        else if (ast.isEventType(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.keyword('extends').surround(Formatting.oneSpace());
        }
        else if (ast.isStringType(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.keyword('[').surround(Formatting.noSpace());
            formatter.keyword(']').prepend(Formatting.noSpace());
        }

        else if (ast.isValueReference(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
            formatter.keyword('=').surround(Formatting.oneSpace());
            formatter.keyword('*').prepend(Formatting.noSpace());
        }
        else if (ast.isAttributeType(node)) {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('type').surround(Formatting.oneSpace());
            formatter.keyword('=').surround(Formatting.oneSpace());
        }
        else {
            const formatter = this.getNodeFormatter(node);
            this.formatMofifiers(formatter);
            formatter.property('name').prepend(Formatting.oneSpace());
        }
    }

    protected formatExpression(node: ast.Expression): void {

        if (ast.isCollectionLiteral(node)) {
            const formatter = this.getNodeFormatter(node),
                bracesOpen = formatter.keyword('{'),
                bracesClose = formatter.keyword('}');

            bracesOpen.surround(Formatting.oneSpace());
            formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
            bracesClose.prepend(Formatting.oneSpace());
        }
        else if (ast.isDesignatedInitializer(node)) {
            this.getNodeFormatter(node).keyword('.').append(Formatting.noSpace());
            this.getNodeFormatter(node).keyword('=').surround(Formatting.oneSpace());
        }
        else if (ast.isUnaryOperation(node)) {
            this.getNodeFormatter(node).property('feature').append(Formatting.noSpace());
        }
        else if (ast.isBinaryOperation(node)) {
            this.getNodeFormatter(node).property('feature').surround(Formatting.oneSpace());
        }
        else if (ast.isParenthesizedExpression(node)) {
            this.getNodeFormatter(node).property('expr').surround(Formatting.noSpace());
        }
    }

    protected formatCommaList(formatter: NodeFormatter<AstNode>): void {
        formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
    }

    protected formatMofifiers(formatter: NodeFormatter<ast.VisibilityElement>): void {
        formatter.properties('modifiers').append(Formatting.oneSpace());
    }

    protected formatBody(type: ast.WithBody, formatter: NodeFormatter<ast.WithBody>): void {
        const bracesOpen = formatter.keyword('{'),
            bracesClose = formatter.keyword('}');
        bracesOpen.prepend(Formatting.newLine());
        bracesOpen.append(Formatting.newLine({ allowMore: true }));
        formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent({ allowMore: true }));
        bracesClose.prepend(Formatting.newLine());
        bracesClose.append(Formatting.newLine({ allowMore: true }));
    }

}