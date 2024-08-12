import { ReferenceInfo, AstNodeDescription, Stream } from "langium";
import { CompletionContext, DefaultCompletionProvider } from "langium/lsp";
import * as ast from '../generated/ast.js';
import { getAllDependencies } from "../utils/project-utils.js";

import type { TextEdit } from 'vscode-languageserver-protocol';



export class XsmpprojectCompletionProvider extends DefaultCompletionProvider {


    /**
     * Filter duplicate tools and dependencies
     *
     * @param refInfo Information about the reference for which the candidates are requested.
     * @param _context Information about the completion request including document, cursor position, token under cursor, etc.
     * @returns A stream of all elements being valid for the given reference.
     */
    protected override getReferenceCandidates(refInfo: ReferenceInfo/*, context: CompletionContext*/): Stream<AstNodeDescription> {
        if (ast.isProject(refInfo.container)) {
            const project = refInfo.container
            switch (refInfo.property) {
                case 'dependencies':
                    return this.scopeProvider.getScope(refInfo).getAllElements().filter(d => ast.isProject(d.node) && !getAllDependencies(d.node).has(project) &&
                        !getAllDependencies(project).has(d.node))
                case 'tools':
                    return this.scopeProvider.getScope(refInfo).getAllElements().filter(d => !project.tools.some(e => e.$refText === d.name))
            }

        }
        return this.scopeProvider.getScope(refInfo).getAllElements();
    }


    protected override buildCompletionTextEdit(context: CompletionContext, label: string, newText: string): TextEdit | undefined {
        const content = context.textDocument.getText();
        const identifier = content.substring(context.tokenOffset, context.offset);
        if (this.fuzzyMatcher.match(identifier, label)) {
            const start = context.textDocument.positionAt(context.tokenOffset);
            const end = context.position;

            return {
                newText: `"${newText}"`,
                range: {
                    start,
                    end
                }
            };
        } else {
            return undefined;
        }
    }
}