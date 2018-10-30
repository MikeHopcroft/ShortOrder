import * as fs from 'fs';
import { CompositeToken, itemMapFromYamlString, Item, PatternRecognizer, PID, StemmerFunction, Token, Tokenizer } from 'token-flow';

export const ENTITY: unique symbol = Symbol('ENTITY');
export type ENTITY = typeof ENTITY;

export interface EntityToken extends CompositeToken {
    type: ENTITY;
    children: Token[];
    pid: PID;
    name: string;
}

export type EntityRecognizer = PatternRecognizer<Item>;

export function CreateEntityRecognizer(
    entityFile: string,
    downstreamWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false) {
    const items = itemMapFromYamlString(fs.readFileSync(entityFile, 'utf8'));

    const tokenFactory = (id: PID, children: Token[]): EntityToken => {
        const item = items.get(id);

        let name = "UNKNOWN";
        if (item) {
            name = item.name;
        }
        return { type: ENTITY, pid: id, name, children };
    };

    return new PatternRecognizer(items, tokenFactory, downstreamWords, stemmer, false, false, debugMode);
}
