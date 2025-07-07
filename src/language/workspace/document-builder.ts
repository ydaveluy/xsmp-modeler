import type { Cancellation, LangiumDocument, ValidationOptions } from 'langium';
import { DefaultDocumentBuilder, ValidationCategory } from 'langium';
import type { XsmpSharedServices } from '../xsmp-module.js';
import type { ProjectManager } from './project-manager.js';
import * as ast from '../generated/ast-partial.js';

export class XsmpDocumentBuilder extends DefaultDocumentBuilder {

    protected readonly projectManager: () => ProjectManager;
    constructor(services: XsmpSharedServices) {
        super(services);
        this.projectManager = () => services.workspace.ProjectManager;
    }

    protected override async validate(document: LangiumDocument, cancelToken: Cancellation.CancellationToken): Promise<void> {
        const validator = this.serviceRegistry.getServices(document.uri).validation.DocumentValidator;
        const options = this.getValidationOptions(document);
        const diagnostics = await validator.validateDocument(document, options, cancelToken);
        if (document.diagnostics) {
            document.diagnostics.push(...diagnostics);
        } else {
            document.diagnostics = diagnostics;
        }

        // Store information about the executed validation in the build state
        const state = this.buildState.get(document.uri.toString());
        if (state) {
            state.result ??= {};
            const newCategories = options.categories ?? ValidationCategory.all;
            if (state.result.validationChecks) {
                state.result.validationChecks.push(...newCategories);
            } else {
                state.result.validationChecks = [...newCategories];
            }
        }
    }
    protected getValidationOptions(document: LangiumDocument): ValidationOptions {
        const project = this.projectManager().getProject(document);
        const categories = ['fast', 'built-in'];
        if (project) {
            for (const profile of project.elements.filter(ast.isProfileReference)) {
                if (profile.profile?.ref?.name) {
                    categories.push(profile.profile.ref.name);
                }
            }
            for (const tool of project.elements.filter(ast.isToolReference)) {
                if (tool.tool?.ref?.name) {
                    categories.push(tool.tool.ref.name);
                }
            }
        }
        return { categories };
    }
}