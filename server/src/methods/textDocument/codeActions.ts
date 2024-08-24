import { DocumentUri, TextDocumentIdentifier } from "../../documents";
import { RequestMessage } from "../../server";
import { Range } from "../../types";
import { Diagnostic } from "./diagnostic";

export interface CodeActionContext {
    diagnostics: Diagnostic[];
}

export interface CodeActionParams {
    textDocument: TextDocumentIdentifier;
    range: Range;
    context: CodeActionContext;
}

interface TextEdit {
    range: Range;
    newText: string;
}

export interface WorkspaceEdit {
    changes?: { [uri: DocumentUri]: TextEdit[] };
}

export interface CodeAction {
    title: string;
    kind?: "quickfix";
    edit?: WorkspaceEdit;
    data?: unknown;
}

export const codeAction = (message: RequestMessage): CodeAction[] | null => {
    const params = message.params as CodeActionParams;
    const diagnostic = params.context.diagnostics;
    return diagnostic.flatMap((diagnostic): CodeAction[] => {
        return diagnostic.data.wordSuggestions.map((wordSuggestion): CodeAction => {
            const codeAction: CodeAction = {
                title: `Replace with ${wordSuggestion}`,
                kind: "quickfix",
                edit: {
                    changes: {
                        [params.textDocument.uri]: [
                            {
                                range: diagnostic.range,
                                newText: wordSuggestion,
                            },
                        ],
                    },
                },
            };
            return codeAction;
        });
    });
};
