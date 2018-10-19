import { assert } from 'chai';
import 'mocha';

import { generateAliases } from '../../src/tokenizer';

describe('Alias Generation', () => {
    it('should enumerate optionals', () => {
        const pattern = 'a [b,c] d';

        const expected = [
            'a b d',
            'a c d',
            'a d'
        ];

        const observed = [...generateAliases(pattern)];
        assert.deepEqual(observed, expected);
    });

    it('should enumerate requireds', () => {
        const pattern = 'a (b,c) d';

        const expected = [
            'a b d',
            'a c d'
        ];

        const observed = [...generateAliases(pattern)];
        assert.deepEqual(observed, expected);
    });

    it('should throw on trailing commas', () => {
        const f = () =>  {
            const pattern = 'a []d,e,] (b,c,) d';
            const result = [...generateAliases(pattern)];
        };
        assert.throws(f, TypeError);
    });

    it('should work for more complex examples', () => {
        const pattern = '[very small,medium] (red,green) marble [rolling]';

        const expected = [
            "very small red marble rolling",
            "very small red marble",
            "very small green marble rolling",
            "very small green marble",
            "medium red marble rolling",
            "medium red marble",
            "medium green marble rolling",
            "medium green marble",
            "red marble rolling",
            "red marble",
            "green marble rolling",
            "green marble"
        ];

        const observed = [...generateAliases(pattern)];
        assert.deepEqual(observed, expected);
    });
});
