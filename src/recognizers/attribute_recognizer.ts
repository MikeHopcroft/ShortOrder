import { indexYamlFilename, Item, PatternRecognizer } from '../tokenizer';
import { PID, Token } from '../tokenizer';

export const ATTRIBUTE: unique symbol = Symbol('ATTRIBUTE');
export type ATTRIBUTE = typeof ATTRIBUTE;

export interface AttributeToken extends Token {
    type: ATTRIBUTE;
    text: string;
    id: PID;
    name: string;
}

export type AttributeRecognizer = PatternRecognizer<Item>;

export function CreateAttributeRecognizer(intentFile: string, badWords: Set<string>, debugMode = false): AttributeRecognizer {
    const index = indexYamlFilename(intentFile);

    const tokenFactory = (id: PID, text: string): AttributeToken => {
        const name = index.items[id].name;
        return { type: ATTRIBUTE, id, name, text };
    };

    return new PatternRecognizer(index, tokenFactory, badWords, debugMode);
}
