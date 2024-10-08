import { startLanguageServer } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node.js';
import { createXsmpServices } from './xsmp-module.js';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared } = createXsmpServices({ connection, ...NodeFileSystem });

// Start the language server with the shared services
startLanguageServer(shared);
