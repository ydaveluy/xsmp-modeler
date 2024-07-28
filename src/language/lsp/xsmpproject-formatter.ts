import { AstNode } from 'langium';
import { AbstractFormatter, Formatting } from 'langium/lsp';
import * as ast from '../generated/ast.js';

export class XsmpprojectFormatter extends AbstractFormatter {
    protected override format(node: AstNode): void {
        if (ast.isProject(node)) {
            const formatter = this.getNodeFormatter(node);

            formatter.keyword('project').prepend(Formatting.newLine({ allowMore: true })).append(Formatting.oneSpace())

            node.profile.forEach((_, index) => {
                formatter.keyword('profile', index).prepend(Formatting.newLine({ allowMore: true })).append(Formatting.oneSpace())
            });
            node.tools.forEach((_, index) => {
                formatter.keyword('tool', index).prepend(Formatting.newLine({ allowMore: true })).append(Formatting.oneSpace())
            });

            node.sourcePaths.forEach((_, index) => {
                formatter.keyword('source', index).prepend(Formatting.newLine({ allowMore: true })).append(Formatting.oneSpace())
            });
            node.dependencies.forEach((_, index) => {
                formatter.keyword('dependency', index).prepend(Formatting.newLine({ allowMore: true })).append(Formatting.oneSpace())
            });

        }
    }
}