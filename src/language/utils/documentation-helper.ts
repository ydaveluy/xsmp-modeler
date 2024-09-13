import type { AstNode, JSDocComment, JSDocParagraph, JSDocTag } from 'langium';
import { isAstNodeWithComment, isJSDoc, parseJSDoc, WorkspaceCache } from 'langium';
import * as ast from '../generated/ast.js';
import { type XsmpSharedServices } from '../xsmp-module.js';
import { findCommentNode } from './xsmp-utils.js';

export class DocumentationHelper {
    protected readonly cache: WorkspaceCache<AstNode, JSDocComment | undefined>;
    constructor(services: XsmpSharedServices) {
        this.cache = new WorkspaceCache(services);
    }
    getJSDoc(element: AstNode): JSDocComment | undefined {
        return this.cache.get(element, () => {
            const comment = findCommentNode(element.$cstNode);
            if (comment && isJSDoc(comment)) {
                return parseJSDoc(comment);
            }
            if (isAstNodeWithComment(element) && element.$comment) {
                return parseJSDoc(element.$comment);
            }
            return undefined;
        });
    }

    private getTag(element: AstNode, tagName: string): JSDocParagraph | undefined {
        const tag = this.getJSDoc(element)?.getTag(tagName);
        return tag?.inline ? undefined : tag?.content;
    }

    private getTags(element: AstNode, tagName: string): JSDocParagraph[] | undefined {
        return this.getJSDoc(element)?.getTags(tagName).filter(t => !t.inline).map(t => t.content);
    }

    getUsages(element: ast.AttributeType): JSDocParagraph[] | undefined {
        return this.getTags(element, 'usage');
    }

    getId(element: ast.NamedElement | ast.ReturnParameter): string | undefined {
        return this.getTag(element, 'id')?.toString().trim();
    }
    getNativeType(element: ast.NativeType): string | undefined {
        return this.getTag(element, 'type')?.toString().trim();
    }
    getNativeNamespace(element: ast.NativeType): string | undefined {
        return this.getTag(element, 'namespace')?.toString().trim();
    }
    getNativeLocation(element: ast.NativeType): string | undefined {
        return this.getTag(element, 'location')?.toString().trim();
    }
    isMulticast(element: ast.EventSource): boolean {
        return this.getTag(element, 'singlecast') === undefined;
    }

    getPropertyCategory(element: ast.Property): string | undefined {
        return this.getTag(element, 'category')?.toString().trim();
    }
    getUnit(element: ast.Integer | ast.Float): string | undefined {
        return this.getTag(element, 'unit')?.toString().trim();
    }

    getTitle(element: ast.Document): string | undefined {
        return this.getTag(element, 'title')?.toString().trim();
    }
    getDate(element: ast.Document): JSDocParagraph | undefined {
        return this.getTag(element, 'date');
    }

    getCreator(element: ast.Document): string | undefined {
        return this.getTags(element, 'creator')?.map(e => e.toString().trim()).join(', ');
    }
    getVersion(element: ast.Document): string | undefined {
        return this.getTag(element, 'version')?.toString().trim();
    }

    getUuid(type: ast.Type): JSDocParagraph | undefined {
        return this.getTag(type, 'uuid');
    }

    getDeprecated(element: ast.NamedElement): JSDocParagraph | undefined {
        return this.getTag(element, 'deprecated');
    }

    IsDeprecated(element: ast.NamedElement): boolean {
        return this.getDeprecated(element) !== undefined;
    }

    getDescription(element: ast.NamedElement | ast.ReturnParameter): string | undefined {
        if (ast.Parameter === element.$type) {
            const regex = new RegExp(`^${element.name}\\s`);
            return this.getJSDoc(element.$container as AstNode)?.getTags('param').find(t => regex.test(t.content.toString()))?.content.toString().slice(element.name.length).trim();
        }
        if (ast.ReturnParameter === element.$type) {
            return this.getJSDoc(element.$container)?.getTag('return')?.content.toString().trim();
        }
        const jsDoc = this.getJSDoc(element);
        if (!jsDoc) {
            return undefined;
        }

        const result: string[] = [];
        for (const e of jsDoc.elements) {
            if (typeof (e as JSDocTag).name === 'string' && !(e as JSDocTag).inline) {
                break;
            }
            result.push(e.toString());
        }
        return result.length > 0 ? result.join('\n').trim() : undefined;
    }
    allowMultiple(element: ast.AttributeType): boolean {
        return this.getTag(element, 'allowMultiple') !== undefined;
    }

}