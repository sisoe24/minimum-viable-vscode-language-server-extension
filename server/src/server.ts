import log from "./log";
import { initialize } from "./methods/initialize";

interface Message {
    jsonrpc: string;
}

export interface RequestMessage extends Message {
    id: number | string;
    method: string;
    params?: unknown[] | object;
}

let buffer = "";

process.stdin.on("data", (data) => {
    buffer += data;

    while (true) {
        const lengthMatch = buffer.match(/Content-Length: (\d+)\r\n/);
        if (!lengthMatch) {
            break;
        }

        const contentLength = parseInt(lengthMatch[1], 10);
        const messageStart = buffer.indexOf("\r\n\r\n") + 4;
        if (buffer.length < messageStart + contentLength) {
            break;
        }

        const rawMessage = buffer.slice(messageStart, messageStart + contentLength);
        const message = JSON.parse(rawMessage);

        log.write({ id: message.id, method: message.method });

        buffer = buffer.slice(messageStart + contentLength);
    }
});
