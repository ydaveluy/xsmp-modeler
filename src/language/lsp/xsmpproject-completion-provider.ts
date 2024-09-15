import { UriUtils, type AstNodeDescription, type GrammarAST, type ReferenceInfo, type Stream } from 'langium';
import type { CompletionContext, CompletionValueItem } from 'langium/lsp';
import { DefaultCompletionProvider } from 'langium/lsp';
import * as ast from '../generated/ast.js';
import * as ProjectUtils from '../utils/project-utils.js';

export class XsmpprojectCompletionProvider extends DefaultCompletionProvider {

    /**
     * Filter duplicate tools and dependencies
     *
     * @param refInfo Information about the reference for which the candidates are requested.
     * @param _context Information about the completion request including document, cursor position, token under cursor, etc.
     * @returns A stream of all elements being valid for the given reference.
     */
    protected override getReferenceCandidates(refInfo: ReferenceInfo, _context: CompletionContext): Stream<AstNodeDescription> {
        if (ast.isProject(refInfo.container)) {
            const project = refInfo.container;
            switch (refInfo.property) {
                case 'dependencies':
                    return this.scopeProvider.getScope(refInfo).getAllElements().filter(d => ast.isProject(d.node) && !ProjectUtils.getAllDependencies(d.node).has(project) &&
                        !ProjectUtils.getAllDependencies(project).has(d.node));
                case 'tools':
                    return this.scopeProvider.getScope(refInfo).getAllElements().filter(d => !project.tools.some(e => e.$refText === d.name));
            }

        }
        return this.scopeProvider.getScope(refInfo).getAllElements();
    }

    protected override createReferenceCompletionItem(nodeDescription: AstNodeDescription): CompletionValueItem {
        const kind = this.nodeKindProvider.getCompletionItemKind(nodeDescription);
        const documentation = this.getReferenceDocumentation(nodeDescription);
        return {
            nodeDescription,
            kind,
            documentation,
            insertText: `"${nodeDescription.name}"`,
            detail: nodeDescription.type,
            sortText: '0'
        };
    }
    protected override filterKeyword(context: CompletionContext, keyword: GrammarAST.Keyword): boolean {
        if (!context.node) {
            switch (keyword.value) {
                case 'project':
                case 'profile':
                case 'tool':
                    return UriUtils.extname(context.document.uri) === `.${keyword.value}`;
            }
        }
        return super.filterKeyword(context, keyword);
    }
}