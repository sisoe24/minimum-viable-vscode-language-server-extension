import { Position, Range } from "../../types";
import { RequestMessage } from "../../server";
import log from "../../log";
import { TextDocumentIdentifier, wordUnderCursor } from "../../documents";
import { spawnSync } from "child_process";

namespace MarkupKind {
    export const PlainText: "plaintext" = "plaintext";
    export const Markdown: "markdown" = "markdown";
}

type MarkupKind = "plaintext" | "markdown";

interface MarkupContent {
    kind: MarkupKind;
    value: string;
}

export interface Hover {
    contents: MarkupContent;
    range: Range;
}

interface TextDocumentPositionParams {
    textDocument: TextDocumentIdentifier;
    position: Position;
}

interface HoverParams extends TextDocumentPositionParams {}

export const hover = (message: RequestMessage): Hover | null => {
    const params = message.params as HoverParams;

    log.write({ Hover: params });

    const currentWord = wordUnderCursor(params.textDocument.uri, params.position);
    if (!currentWord) {
        return null;
    }

    const rawDefinition = spawnSync("dict", [currentWord.text, "-d", "wn"], {
        encoding: "utf-8",
    })
        .stdout.trim()
        .split("\n");

    const value =
        `${currentWord.text}\n${"-".repeat(currentWord.text.length)}\n\n` +
        rawDefinition
            .splice(5)
            .map((line) => line.replace("      ", ""))
            .map((line) => (line.startsWith(" ") ? line : "\n" + line))
            .join("\n")
            .trim();

    return {
        contents: {
            kind: MarkupKind.Markdown,
            value: value,
        },
        range: currentWord.range,
    };
};
