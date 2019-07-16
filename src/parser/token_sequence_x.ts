import { TokenX } from '../lexer';

export class TokenSequenceX {
    tokens: TokenX[];
    cursor = 0;
    tokensUsed = 0;

    constructor(tokens: TokenX[]) {
        this.tokens = tokens;
    }

    startsWith(tags: Symbol[]): boolean {
        if (tags.length + this.cursor > this.tokens.length) {
            return false;
        }

        for (const [index, tag] of tags.entries()) {
            if (tag !== this.tokens[this.cursor + index].token.type) {
                return false;
            }
        }

        return true;
    }

    take(count: number) {
        if (count + this.cursor > this.tokens.length) {
            const message = 'TokenSequenceX.take(): beyond end of sequence.';
            throw TypeError(message);
        }
        this.tokensUsed += count;
        this.cursor += count;
    }

    peek(index: number): TokenX {
        if (index + this.cursor >= this.tokens.length) {
            const message = 'TokenSequenceX.peek(): beyond end of sequence.';
            throw TypeError(message);
        }
        return this.tokens[this.cursor + index];
    }

    discard(count: number) {
        if (count + this.cursor > this.tokens.length) {
            const message = 'TokenSequenceX.discard(): beyond end of sequence.';
            throw TypeError(message);
        }
        this.cursor += count;
    }

    atEOS() {
        return this.cursor === this.tokens.length;
    }
}
