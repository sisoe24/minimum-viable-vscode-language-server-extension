import log from "../../log";
import { Range } from "../../types";
import { RequestMessage } from "../../server";

import { documents, TextDocumentIdentifier } from "../../documents";
import { spellingSuggestions } from "../../spellingSuggestions";

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

export interface SpellingSuggestionData {
    wordSuggestions: string[];
    type: "spelling-suggestion";
}

export interface Diagnostic {
    range: Range;
    severity?: DiagnosticSeverity;
    source: "vscode-lsp";
    message: string;
    data: SpellingSuggestionData;
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

    const items: Diagnostic[] = [];
    const lines = content.split("\n");

    const invalidWordsAndSuggetions: Record<string, string[]> = spellingSuggestions(content);
    log.write({ spellingSuggestions: invalidWordsAndSuggetions });

    Object.keys(invalidWordsAndSuggetions).forEach((invalidWord) => {
        const regex = new RegExp(`\\b${invalidWord}\\b`, "g");
        const wordSuggestions = invalidWordsAndSuggetions[invalidWord];

        // prettier-ignore
        const message = wordSuggestions.length
            ? `Word "${invalidWord}" is not in the dictionary. Did you mean "${wordSuggestions.join(", ")}"?`
            : `Word "${invalidWord}" is not in the dictionary`;

        lines.forEach((line, lineNumber) => {
            let match;
            while ((match = regex.exec(line))) {
                items.push({
                    source: "vscode-lsp",
                    severity: DiagnosticSeverity.Error,
                    message: message,
                    data: {
                        wordSuggestions: wordSuggestions,
                        type: "spelling-suggestion",
                    },
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
