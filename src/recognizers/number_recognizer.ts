import {QUANTITY, QuantityToken} from './quantity_recognizer';
import { Token, UNKNOWN } from '../tokenizer';
import wordsToNumbers from 'words-to-numbers';

export class NumberRecognizer {
    apply = (token: Token) => {
        const text = token.text;
        const withNumbers = wordsToNumbers(text);
        if (withNumbers == null) {
            // There are no numbers in this string.
            // Fall through to next step.
            return [token];
        }
        else if (typeof (withNumbers) === 'number') {
            // The entire string was converted into a single number.
            // Just return the token.
            return [{ type: QUANTITY, text, value: withNumbers }];
        }
        else {
            // The numbers have been inlined into the string.
            // Need to convert numbers to tokens.
            const terms = withNumbers.split(' ');

            const tokens: Token[] = [];
            terms.forEach((term, index) => {
                const value = Number(term);
                if (!isNaN(value)) {
                    // TODO: Verify behavior with negatives, decimal points, etc.
                    tokens.push({type: QUANTITY, text: term, value} as Token);
                }
                else {
                    // This term was not identified as a numeber. Pass it through as
                    // an UNKNOWN token.
                    if (tokens.length === 0 || tokens[tokens.length - 1].type !== UNKNOWN) {
                        // We can't merge this term into the previous token because
                        // we're either creating the first token, or we're in a
                        // situation where the previous token is somethign other
                        //  than UNKNOWN.
                        tokens.push({type: UNKNOWN, text: term});
                    }
                    else {
                        // The previous token was UNKNONW, so just append the current
                        // term's text.
                        const text = `${tokens[tokens.length - 1].text} ${terms[index]}`;
                        tokens[tokens.length - 1] = { type: UNKNOWN, text };
                    }
                }    
            });
            return tokens;
        }
    }
}
