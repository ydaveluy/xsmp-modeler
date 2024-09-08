import * as ast from '../../generated/ast.js';
import { expandToString as s } from 'langium/generate';
import * as CopyrightNoticeProvider from '../../generator/copyright-notice-provider.js';
import type { AstNode, URI } from 'langium';
import { UriUtils } from 'langium';
import * as fs from 'fs';
import * as Path from 'path';
import type { TaskAcceptor, XsmpGenerator } from '../../generator/generator.js';
import { xsmpVersion } from '../../version.js';
import { getUuid } from '../../utils/xsmp-utils.js';

export class PythonGenerator implements XsmpGenerator {

    generate(node: AstNode, projectUri: URI, acceptTask: TaskAcceptor) {
        if (ast.isCatalogue(node)) {

            const notice = CopyrightNoticeProvider.getCopyrightNotice(node.$document, '# ');
            projectUri = UriUtils.joinPath(projectUri, this.pythonFolder);
            acceptTask(() => this.generateCatalogue(node, projectUri, notice));

            node.elements.forEach(namespace => this.generateNamespace(namespace, projectUri, notice, acceptTask));
        }
    }

    protected readonly pythonFolder = 'python';
    protected readonly INIT_PY_FILE = '__init__.py';

    clean(_projectUri: URI) {
        // ignore
    }

    protected generatedBy() {
        return `PythonGenerator-${xsmpVersion}`;
    }

    protected async generateFile(path: string, content: string) {
        try {
            await fs.promises.mkdir(Path.dirname(path), { recursive: true });

            try {
                // check if existing file is different
                if (await fs.promises.readFile(path, { encoding: 'utf8' }) !== content) {
                    await fs.promises.writeFile(path, content);
                }
            }
            catch {
                await fs.promises.writeFile(path, content, { encoding: 'utf8' });
            }
        } catch (error) {
            console.error(`Error generating file ${path}:`, error);
        }
    }
    fqn(node: ast.NamedElement, separator: string = '/'): string {
        let name = node.name;
        let parent = node.$container;

        while (parent) {
            name = `${(parent as ast.NamedElement).name}${separator}${name}`;
            parent = parent.$container;
        }
        return name;
    }

    public async generateCatalogue(catalogue: ast.Catalogue, projectUri: URI, notice: string | undefined): Promise<void> {

        const path = UriUtils.joinPath(projectUri, catalogue.name, this.INIT_PY_FILE).fsPath;
        await this.generateFile(path, s`
            ${notice}

            # -----------------------------------------------------------------------------
            # File Name    : ${catalogue.name}/${this.INIT_PY_FILE}
            # Generated by : ${this.generatedBy()}
            # -----------------------------------------------------------------------------
            # This file is auto-generated. Do not edit otherwise your changes will be lost.

            ${catalogue.elements.map(ns => `from . import ${ns.name}`).join('\n')}

            `);
    }
    private generateNamespace(namespace: ast.Namespace, projectUri: URI, notice: string | undefined, acceptTask: TaskAcceptor) {

        acceptTask(() => this.doGenerateNamespace(namespace, projectUri, notice));
        for (const element of namespace.elements) {
            if (ast.isNamespace(element))
                this.generateNamespace(element, projectUri, notice, acceptTask);
        }
    }
    private async doGenerateNamespace(namespace: ast.Namespace, projectUri: URI, notice: string | undefined): Promise<void> {
        const qualifiedName = this.fqn(namespace, '/');
        const path = UriUtils.joinPath(projectUri, qualifiedName, this.INIT_PY_FILE).fsPath;
        const components = namespace.elements.filter(ast.isComponent);
        const namespaces = namespace.elements.filter(ast.isNamespace);
        await this.generateFile(path, s`
            ${notice}

            # -----------------------------------------------------------------------------
            # File Name    : ${qualifiedName}/${this.INIT_PY_FILE}
            # Generated by : ${this.generatedBy()}
            # -----------------------------------------------------------------------------
            # This file is auto-generated. Do not edit otherwise your changes will be lost.
            
            ${namespaces.length > 0 ? namespace.elements.filter(ast.isNamespace).map(ns => `from . import ${ns.name}`).join('\n') : undefined}
            ${components.length > 0 ? s`
                import ecss_smp

                ${components.map(type => s`
                class ${type.name}:
                    uuid: ecss_smp.Smp.Uuid = ecss_smp.Smp.Uuid("${getUuid(type)}")
                `).join('\n')}

                `: undefined}
                
            `);
    }
}

