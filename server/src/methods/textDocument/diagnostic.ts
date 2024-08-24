import { RequestMessage } from "../../server";
import { Range } from "../../types";

import * as fs from "fs";
import log from "../../log";
import { documents, TextDocumentIdentifier } from "../../documents";

const dictionaryWords = fs.readFileSync("/usr/share/dict/words").toString().split("\n");

export interface DocumentDiagnosticParams {
    textDocument: TextDocumentIdentifier;
}

export namespace DiagnosticSeverity {
    export const Error: 1 = 1;
    export const Warning: 2 = 2;
    export const Information: 3 = 3;
    export const Hint: 4 = 4;
}

export type DiagnosticSeverity = 1 | 2 | 3 | 4;

export interface Diagnostic {
    range: Range;
    severity?: DiagnosticSeverity;
    source: "vscode-lsp";
    message: string;
    data?: unknown;
}

export interface FullDocumentDiagnosticReport {
    kind: "full";
    items: Diagnostic[];
}

export const diagnostic = (message: RequestMessage): FullDocumentDiagnosticReport | null => {
    const params = message.params as DocumentDiagnosticParams;
    const content = documents.get(params.textDocument.uri);
    if (!content) {
        return null;
    }

    const wordsInDocument = content?.split(/\W/);
    const invalidWords = new Set(wordsInDocument.filter((word) => !dictionaryWords.includes(word)));

    const items: Diagnostic[] = [];
    const lines = content.split("\n");

    invalidWords.forEach((invalidWord) => {
        const regex = new RegExp(`\\b${invalidWord}\\b`, "g");
        lines.forEach((line, lineNumber) => {
            let match;
            while ((match = regex.exec(line))) {
                items.push({
                    source: "vscode-lsp",
                    severity: DiagnosticSeverity.Error,
                    message: `Word "${invalidWord}" is not in the dictionary`,
                    range: {
                        start: {
                            line: lineNumber,
                            character: match.index,
                        },
                        end: {
                            line: lineNumber,
                            character: match.index + invalidWord.length,
                        },
                    },
                });
            }
        });
    });

    return {
        kind: "full",
        items: items,
    };
};
