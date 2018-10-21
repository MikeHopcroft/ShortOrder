import { Recognizer, Token, TokenFactory, UNKNOWN } from '../tokenizer';
import { PeekableSequence } from '../utilities';
import wordsToNumbers from 'words-to-numbers';

export class NumberRecognizer implements Recognizer {
    static lexicon: Set<string> = new Set([
        'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
        'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
        'hundred', 'thousand', 'million', 'trillion'
    ]);

    tokenFactory: TokenFactory<Token>;

    constructor(tokenFactory: TokenFactory<Token>) {
        this.tokenFactory = tokenFactory;
    }

    private parseNumberSequence(sequence: PeekableSequence<string>): Token {
        const terms: string[] = [];
        while (!sequence.atEOF()) {
            if (NumberRecognizer.lexicon.has(sequence.peek())) {
                terms.push(sequence.get());
            }
            else {
                break;
            }
        }

        if (terms.length === 0) {
            throw TypeError('parseNumberSequence: expected a number.');
        }

        const text = terms.join(' ');
        const value = wordsToNumbers(text);
        if (typeof (value) !== 'number') {
            // TODO: consider logging an error and then returning the unknown token.
            throw TypeError('parseNumberSequence: expected a number.');
        }
        return this.tokenFactory(value, text);
    }

    private parseTextSequence(sequence: PeekableSequence<string>): Token {
        const terms: string[] = [];
        while (!sequence.atEOF()) {
            if (!NumberRecognizer.lexicon.has(sequence.peek())) {
                terms.push(sequence.get());
            }
            else {
                break;
            }
        }

        if (terms.length === 0) {
            throw TypeError('parseTextSequence: expected a word.');
        }

        const text = terms.join(' ');
        return { type: UNKNOWN, text };
    }

    private parseSequence(sequence: PeekableSequence<string>): Token[] {
        const tokens: Token[] = [];
        while (!sequence.atEOF()) {
            if (NumberRecognizer.lexicon.has(sequence.peek())) {
                tokens.push(this.parseNumberSequence(sequence));
            }
            else {
                tokens.push(this.parseTextSequence(sequence));
            }
        }
        return tokens;
    }

    apply = (token: Token) => {
        const text = token.text;
        const terms = text.split(' ');
        return this.parseSequence(new PeekableSequence(terms[Symbol.iterator]()));
    }

    terms = () => {
        return NumberRecognizer.lexicon;
    }

    stemmer = (word: string): string => {
        // DESIGN NOTE: NumberRecognizer does not stem.
        return word;
    }
}
