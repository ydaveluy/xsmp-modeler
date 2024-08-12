
import { AstReflection, IndexManager, LangiumDocument, MaybePromise, DiagnosticData, Cancellation } from 'langium';

import { CodeActionProvider, LangiumServices } from 'langium/lsp';
import { CodeActionKind, type Diagnostic } from 'vscode-languageserver';
import type { CodeActionParams } from 'vscode-languageserver-protocol';
import type { CodeAction, Command } from 'vscode-languageserver-types';
import { IssueCodes } from '../validation/xsmpcat-validator.js';
import { randomUUID } from 'crypto';

export class XsmpcatCodeActionProvider implements CodeActionProvider {

    protected readonly reflection: AstReflection;
    protected readonly indexManager: IndexManager;

    constructor(services: LangiumServices) {
        this.reflection = services.shared.AstReflection;
        this.indexManager = services.shared.workspace.IndexManager;
    }

    /**
     * Handle a code action request.
     *
     * @throws `OperationCancelled` if cancellation is detected during execution
     * @throws `ResponseError` if an error is detected that should be sent as response to the client
     */
    getCodeActions(document: LangiumDocument, params: CodeActionParams, cancelToken?: Cancellation.CancellationToken): MaybePromise<Array<Command | CodeAction>> {
        const result: CodeAction[] = [];
        const acceptor = (ca: CodeAction | undefined) => ca && result.push(ca);
        for (const diagnostic of params.context.diagnostics) {
            this.createCodeActions(diagnostic, document, acceptor);
        }
        return result;
    }

    private createCodeActions(diagnostic: Diagnostic, document: LangiumDocument, accept: (ca: CodeAction | undefined) => void): void {
        switch ((diagnostic.data as DiagnosticData)?.code) {
            case IssueCodes.InvalidUuid:
            case IssueCodes.DuplicatedUuid:
                accept(this.replaceUuid(diagnostic, document));
                break;
            case IssueCodes.IllegalModifier:
            case IssueCodes.InvalidModifier:
            case IssueCodes.InvalidAttribute:
            case IssueCodes.InvalidUsage:
            case IssueCodes.DuplicatedUsage:
                accept(this.removeRegion(diagnostic, document));
                break;
            case IssueCodes.MissingAbstract:
                accept(this.addAbstract(diagnostic, document));
                break;
            case IssueCodes.MissingUuid:
                accept(this.generateUuid(diagnostic, document));
                break;


        }
        return undefined;
    }

    private replaceUuid(diagnostic: Diagnostic, document: LangiumDocument): CodeAction {
        return {
            title: 'Generate new UUID.',
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: true,
            edit: { changes: { [document.textDocument.uri]: [{ range: diagnostic.range, newText: randomUUID().toString() }] } }
        };
    }

    private generateUuid(diagnostic: Diagnostic, document: LangiumDocument): CodeAction | undefined {
        const data = diagnostic.data as DiagnosticData;

        if (data.actionRange) {


            let newText: string
            if (data.actionRange.start.character !== data.actionRange.end.character || data.actionRange.start.line !== data.actionRange.end.line)
                newText = `\n${' '.repeat(data.actionRange.start.character - 2)} * @uuid ${randomUUID().toString()}`
            else
                newText = `/** @uuid ${randomUUID().toString()} */\n${' '.repeat(data.actionRange.start.character)}`

            return {
                title: 'Generate missing UUID.',
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                isPreferred: true,
                edit: { changes: { [document.textDocument.uri]: [{ range: { start: data.actionRange.end, end: data.actionRange.end }, newText: newText }] } }
            };
        }
        return undefined
    }

    private removeRegion(diagnostic: Diagnostic, document: LangiumDocument): CodeAction {
        return {
            title: `Remove ${document.textDocument.getText(diagnostic.range)}`,
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: true,
            edit: { changes: { [document.textDocument.uri]: [{ range: diagnostic.range, newText: '' }] } }
        };
    }

    private addAbstract(diagnostic: Diagnostic, document: LangiumDocument): CodeAction {
        return {
            title: 'Add `abstract` keyword.',
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: true,
            edit: { changes: { [document.textDocument.uri]: [{ range: { start: diagnostic.range.start, end: diagnostic.range.start }, newText: 'abstract ' }] } }
        };
    }
}