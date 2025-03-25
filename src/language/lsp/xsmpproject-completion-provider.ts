import type { MaybePromise} from 'langium';
import { AstUtils, UriUtils, type AstNodeDescription, type GrammarAST, type ReferenceInfo, type Stream } from 'langium';
import type { CompletionAcceptor, CompletionContext, CompletionValueItem, NextFeature } from 'langium/lsp';
import { DefaultCompletionProvider } from 'langium/lsp';
import * as ast from '../generated/ast.js';
import type { XsmpServices } from '../xsmp-module.js';
import { SmpStandards, type ProjectManager } from '../workspace/project-manager.js';
import { CompletionItemKind } from 'vscode-languageserver';

export class XsmpprojectCompletionProvider extends DefaultCompletionProvider {

    protected readonly projectManager: ProjectManager;
    constructor(services: XsmpServices) {
        super(services);
        this.projectManager = services.shared.workspace.ProjectManager;
    }
    /**
     * Filter duplicate tools and dependencies
     *
     * @param refInfo Information about the reference for which the candidates are requested.
     * @param _context Information about the completion request including document, cursor position, token under cursor, etc.
     * @returns A stream of all elements being valid for the given reference.
     */
    protected override getReferenceCandidates(refInfo: ReferenceInfo, _context: CompletionContext): Stream<AstNodeDescription> {

        const refId = `${refInfo.container.$type}:${refInfo.property}`;
        const project = AstUtils.getContainerOfType(refInfo.container, ast.isProject);
        if (project) {
            switch (refId) {
                case 'Dependency:project':
                    return this.scopeProvider.getScope(refInfo).getAllElements().filter(d => ast.isProject(d.node) && !this.projectManager.getDependencies(d.node).has(project) &&
                        !this.projectManager.getDependencies(project).has(d.node));
                case 'ToolReference:tool':
                    return this.scopeProvider.getScope(refInfo).getAllElements().filter(d => !project.elements.filter(ast.isToolReference).some(r => r.tool?.$refText === d.name));
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
            insertText: `'${nodeDescription.name}'`,
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

    protected override completionFor(context: CompletionContext, next: NextFeature, acceptor: CompletionAcceptor): MaybePromise<void> {
        if (next.property === 'standard') {
            SmpStandards.forEach(v => {
                acceptor(context, {
                    label: v,
                    kind: CompletionItemKind.Text,
                    detail: 'Version',
                    insertText: `'${v}'`,
                    sortText: '1'
                });
            });
        } else {
            super.completionFor(context, next, acceptor);
        }
    }
}