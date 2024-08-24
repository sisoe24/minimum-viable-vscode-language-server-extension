export  type DocumentUri = string;
type DocumentBody = string;

export interface TextDocumentIdentifier {
    uri: DocumentUri;
}

export interface VersionedTextDocumentIdentifier extends TextDocumentIdentifier {
    version: number;
}
/**
 * An event describing a change to a text document. If only a text is provided
 * it is considered to be the full content of the document.
 */
export type TextDocumentContentChangeEvent = {
    text: string;
};

export const documents = new Map<DocumentUri, DocumentBody>();
