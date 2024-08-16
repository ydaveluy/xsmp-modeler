
import { CstUtils, isJSDoc, isLeafCstNode, type LangiumDocument } from 'langium';
import { getCommentNode } from '../utils/xsmp-utils.js';
import { ChronoUnit, ZonedDateTime, ZoneOffset } from '@js-joda/core';

export function getCopyrightNotice(document: LangiumDocument | undefined, prefix: string = ''): string | undefined {
    if (!document) {
        return undefined;
    }
    const notice = computeCopyrightNotice(document);
    if (prefix.length === 0) {
        return notice;
    }
    if (notice) {
        return prefix + notice.replace(/\r?\n/g, `\n${prefix}`);
    }
    return undefined;
}

const slPattern = /^\/\/ ?/;
const mlEndsPattern = /(^\/\*+)|(\*+\/$)/g;
const mlMiddlePattern = /\r?\n *\* ?/g;

function computeCopyrightNotice(document: LangiumDocument): string | undefined {

    const rootNode = document.parseResult.value.$cstNode?.root;

    if (!rootNode)
        return undefined;

    for (const node of rootNode.content) {
        if (!node.hidden) {
            break;
        }
        if (!isLeafCstNode(node)) {
            continue;
        }

        if (node.tokenType.name === 'ML_COMMENT') {
            const commentNode = getCommentNode(document.parseResult.value);
            if (commentNode === node && isJSDoc(commentNode)) {
                return undefined;
            }

            return processVariables(
                node.text.replace(mlEndsPattern, '')
                    .replaceAll(mlMiddlePattern, '\n')
                    .trim()
            );
        }
        if (node.tokenType.name === 'SL_COMMENT') {
            let comment = node.text.replace(slPattern, '');
            let sibling = CstUtils.getNextNode(node);
            while (isLeafCstNode(sibling) && sibling.tokenType.name === 'SL_COMMENT') {
                comment += '\n' + sibling.text.replace(slPattern, '');
                sibling = CstUtils.getNextNode(sibling);
            }
            return processVariables(comment.trim());
        }

    }
    return undefined;
}

function processVariables(input: string): string {
    const zdt = ZonedDateTime.now(ZoneOffset.UTC);
    return input.replaceAll('${year}', zdt.year().toString())
        .replaceAll('${user}', process.env.USER ?? 'unknown')
        .replaceAll('${time}', zdt.toLocalTime().truncatedTo(ChronoUnit.SECONDS).toString())
        .replaceAll('${date}', zdt.toLocalDate().toString());
}

