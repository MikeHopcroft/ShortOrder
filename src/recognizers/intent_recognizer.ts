import * as fs from 'fs';
import { itemMapFromYamlString, Item, PatternRecognizer } from 'token-flow';
import { CompositeToken, PID, StemmerFunction, Token, Tokenizer } from 'token-flow';

export const INTENT: unique symbol = Symbol('INTENT');
export type INTENT = typeof INTENT;

export interface IntentToken extends CompositeToken {
    type: INTENT;
    children: Token[];
    id: PID;
    name: string;
}

export type IntentRecognizer = PatternRecognizer<Item>;

export function CreateIntentRecognizer(
    intentFile: string,
    downstreamWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false
): IntentRecognizer {
    const items = itemMapFromYamlString(fs.readFileSync(intentFile, 'utf8'));

    const tokenFactory = (id: PID, children: Token[]): CompositeToken => {
        const item = items.get(id);

        let name = "UNKNOWN";
        if (item) {
            name = item.name;
        }
        const symbol = Symbol.for(name);
        return { type: symbol, children };
    };

    // DESIGN NOTE: The intents aliases include references to the @QUANTITY token.
    // Pass addTokensToDownstream as true so that we won't get partial matches to
    // the @QUANTITY token.
    return new PatternRecognizer(items, tokenFactory, downstreamWords, stemmer, true, true, debugMode);
}
