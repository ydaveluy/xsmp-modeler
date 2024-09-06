import { DefaultServiceRegistry, type LangiumCoreServices, type URI, UriUtils } from 'langium';

export class XsmpServiceRegistry extends DefaultServiceRegistry {
    override getServices(uri: URI): LangiumCoreServices {
        const ext = UriUtils.extname(uri);
        const services = this.fileExtensionMap.get(ext);
        if (!services) {
            const languageId = this.textDocuments?.get(uri.toString())?.languageId;
            if (languageId) {
                throw new Error(`The service registry contains no services for the extension '${ext}' for language '${languageId}'.`);
            } else {
                throw new Error(`The service registry contains no services for the extension '${ext}'.`);
            }
        }
        return services;
    }
}