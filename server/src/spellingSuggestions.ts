import { spawnSync } from "child_process";
import log from "./log";

export const spellingSuggestions = (content: string): Record<string, string[]> => {
    const invalidWordsAndSuggetions: Record<string, string[]> = {};
    const allOutput = spawnSync("aspell", ["-a"], {
        input: content,
        encoding: "utf-8",
    })
        .stdout.trim()
        .split("\n");

    allOutput.forEach((line) => {
        const prefix = line.slice(0, 1);
        switch (prefix) {
            case "&":
                const suggestionsMatch = line.match(/^& (.*?) \d.*: (.*)$/);
                if (!suggestionsMatch) {
                    log.write({ error: "Invalid aspell output", line });
                    return;
                }
                invalidWordsAndSuggetions[suggestionsMatch[1]] = suggestionsMatch[2].split(", ");
                break;
            case "*":
                const match = line.match(/^# (.*?) \d/);
                if (!match) {
                    log.write({ error: "Invalid aspell output", line });
                    return;
                }
                invalidWordsAndSuggetions[match[1]] = [];
                break;
            default:
                break;
        }
    });

    return invalidWordsAndSuggetions;
};
