import * as seedrandom from 'seedrandom';
import { Item, generateAliases } from 'token-flow';
import { patternFromExpression } from '../unified';
import { Generator } from './generator';
import { AnyInstance } from './instances';

export function* aliasesFromOneItem(item: Item) {
    for (const expression of item.aliases) {
        const pattern = patternFromExpression(expression);
        for (const text of generateAliases(pattern)) {
            yield text;
        }
    }
}

export function permutation<T>(items: T[], lehmer: number) {
    const head: T[] = [];
    let tail = items;
    let code = lehmer;
    for (let divisor = items.length; divisor > 0; --divisor) {
        const index = code % divisor;
        code = Math.floor(code / divisor);
        head.push(tail[index]);
        tail = [...tail.slice(0, index), ...tail.slice(index + 1)];
    }
    return head;
}

export function factorial(n: number): number {
    if (n === 0 || n === 1) {
        return 1;
    }
    else {
        return n * factorial(n - 1);
    }
}

export class Random {
    private readonly random: seedrandom.prng;

    constructor(seed: string) {
        this.random = seedrandom('seed1'); 
    }

    // Returns random integer in range [start, end).
    randomInRange(start:number, end:number): number {
        if (end < start) {
            const message = "end must be less than start";
            throw TypeError(message);
        }
        return start + Math.floor(this.random() * (end - start));
    }

    // Returns a random natural number less than max.
    randomNonNegative(max: number): number {
        if (max < 0) {
            const message = "max cannot be less than 0";
            throw TypeError(message);
        }
        return Math.floor(this.random() * max);
    }

    randomChoice<T>(items: T[]): T {
        return items[this.randomNonNegative(items.length)];
    }

    randomInstanceSequence(generator: Generator): AnyInstance[] {
        return generator.version(this.randomNonNegative(generator.count()));
    }
}

