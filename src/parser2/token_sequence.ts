import { Token } from 'token-flow';

export class TokenSequence<T extends Token> {
    tokens: T[];
    cursor = 0;
    tokensUsed = 0;

    constructor(tokens: T[]) {
        this.tokens = tokens;
    }

    startsWith(tags: Symbol[]): boolean {
        if (tags.length + this.cursor > this.tokens.length) {
            return false;
        }

        for (const [index, tag] of tags.entries()) {
            if (tag !== this.tokens[this.cursor + index].type) {
                return false;
            }
        }

        return true;
    }

    take(count: number) {
        if (count + this.cursor > this.tokens.length) {
            const message = 'TokenSequence.take(): beyond end of sequence.';
            throw TypeError(message);
        }
        this.tokensUsed += count;
        this.cursor += count;
    }

    peek<U extends T>(index: number) {
        if (index + this.cursor >= this.tokens.length) {
            const message = 'TokenSequence.peek(): beyond end of sequence.';
            throw TypeError(message);
        }
        return this.tokens[this.cursor + index] as U;
    }

    discard(count: number) {
        if (count + this.cursor > this.tokens.length) {
            const message = 'TokenSequence.discard(): beyond end of sequence.';
            throw TypeError(message);
        }
        this.cursor += count;
    }

    atEOS() {
        return this.cursor === this.tokens.length;
    }
}

