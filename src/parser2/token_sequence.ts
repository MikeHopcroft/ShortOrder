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
        // if (tags.length > this.tokens.length) {
        //     return false;
        // }

        // for (const [index, tag] of tags.entries()) {
        //     if (tag !== this.tokens[index].type) {
        //         return false;
        //     }
        // }

        // return true;
    }

    take(count: number) {
        if (count + this.cursor > this.tokens.length) {
            const message = 'TokenSequence.take(): beyond end of sequence.';
            throw TypeError(message);
        }
        this.tokensUsed += count;
        this.cursor += count;

        // if (count > this.tokens.length) {
        //     const message = 'TokenSequence.take(): beyond end of sequence.';
        //     throw TypeError(message);
        // }
        // this.tokensUsed += count;
        // this.tokens.splice(0, count);
    }

    peek<U extends T>(index: number) {
        if (index + this.cursor >= this.tokens.length) {
            const message = 'TokenSequence.peek(): beyond end of sequence.';
            throw TypeError(message);
        }
        return this.tokens[this.cursor + index] as U;

        // if (index >= this.tokens.length) {
        //     const message = 'TokenSequence.peek(): beyond end of sequence.';
        //     throw TypeError(message);
        // }
        // return this.tokens[index] as U;
    }

    discard(count: number) {
        if (count + this.cursor > this.tokens.length) {
            const message = 'TokenSequence.discard(): beyond end of sequence.';
            throw TypeError(message);
        }
        this.cursor += count;

        // if (count > this.tokens.length) {
        //     const message = 'TokenSequence.discard(): beyond end of sequence.';
        //     throw TypeError(message);
        // }
        // this.tokens.splice(0, count);
    }

    atEOS() {
        return this.cursor === this.tokens.length;
//        return this.tokens.length === 0;
    }
}

