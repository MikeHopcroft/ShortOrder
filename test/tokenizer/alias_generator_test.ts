import { assert } from 'chai';
import 'mocha';

import { generateAliases } from '../../src/tokenizer';

describe('Alias Generation', () => {
    describe('#generate aliases', () => {
        it('should correctly generate aliases', () => {
            const pattern = '[very small,medium,] [red,green] marble [rolling,]';

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
});
