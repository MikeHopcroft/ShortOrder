import { assert } from 'chai';
import 'mocha';

import { AttributeToken, TokenSequence } from '../../src';

import {
    attributeChocolate,
    attributeDecaf,
    attributeMedium,
    attributeRegular,
    attributeSmall,
    attributeSoy,
    conjunction,
    optionMilk,
    productCone,
    productCoffee,
    quantityTwo,
    quantityFive,
    unitPumps,
} from '../shared';


describe('TokenSequence', () => {
    it('startsWith()', () => {
        const sequence = new TokenSequence([
            attributeChocolate,
            attributeDecaf,
            attributeMedium,
            attributeRegular,
        ]);

        // True assertions
        assert.isTrue(sequence.startsWith([]));
        assert.isTrue(sequence.startsWith([
            attributeChocolate.type,
        ]));
        assert.isTrue(sequence.startsWith([
            attributeChocolate.type,
            attributeDecaf.type,
        ]));
        assert.isTrue(sequence.startsWith([
            attributeChocolate.type,
            attributeDecaf.type,
            attributeMedium.type,
        ]));
        assert.isTrue(sequence.startsWith([
            attributeChocolate.type,
            attributeDecaf.type,
            attributeMedium.type,
            attributeRegular.type,
        ]));

        // False assertions
        assert.isFalse(sequence.startsWith([
            attributeChocolate.type,
            attributeDecaf.type,
            attributeMedium.type,
            attributeRegular.type,
            conjunction.type,
        ]));
        assert.isFalse(sequence.startsWith([
            attributeDecaf.type,
            attributeMedium.type,
            attributeRegular.type,
            conjunction.type,
        ]));
    });

    it('take()', () => {
        const tokens = [
            attributeChocolate,
            attributeDecaf,
            attributeMedium,
            attributeRegular,
        ];

        const sequence = new TokenSequence(tokens);
        assert.equal(sequence.tokensUsed, 0);

        sequence.take(1);
        assert.equal(sequence.tokensUsed, 1);
        assert.equal(sequence.peek(0), attributeDecaf);

        sequence.take(2);
        assert.equal(sequence.tokensUsed, 3);
        assert.equal(sequence.peek(0), attributeRegular);

        sequence.take(0);
        assert.equal(sequence.tokensUsed, 3);
        assert.equal(sequence.peek(0), attributeRegular);

        const f = () => sequence.take(2);
        assert.throws(f, 'TokenSequence.take(): beyond end of sequence.');

        sequence.take(1);
        assert.equal(sequence.tokensUsed, 4);
        assert.isTrue(sequence.atEOS());
    });

    it('peek()', () => {
        const tokens = [
            attributeChocolate,
            attributeDecaf,
            attributeMedium,
            attributeRegular,
        ];

        const sequence = new TokenSequence(tokens);

        const a0 = sequence.peek<AttributeToken>(0);
        assert.equal(a0.type, attributeChocolate.type);
        const a1 = sequence.peek<AttributeToken>(1);
        assert.equal(a1.type, attributeDecaf.type);
        const a2 = sequence.peek<AttributeToken>(2);
        assert.equal(a2.type, attributeMedium.type);
        const a3 = sequence.peek<AttributeToken>(3);
        assert.equal(a3.type, attributeRegular.type);

        const f = () => sequence.peek<AttributeToken>(4);
        assert.throws(f, 'TokenSequence.peek(): beyond end of sequence.');
    });

    it('discard()', () => {
        const tokens = [
            attributeChocolate,
            attributeDecaf,
            attributeMedium,
            attributeRegular,
        ];

        const sequence = new TokenSequence(tokens);
        assert.equal(sequence.tokensUsed, 0);

        sequence.discard(1);
        assert.equal(sequence.tokensUsed, 0);
        assert.equal(sequence.peek(0), attributeDecaf);

        sequence.discard(2);
        assert.equal(sequence.tokensUsed, 0);
        assert.equal(sequence.peek(0), attributeRegular);

        sequence.discard(0);
        assert.equal(sequence.tokensUsed, 0);
        assert.equal(sequence.peek(0), attributeRegular);

        const f = () => sequence.discard(2);
        assert.throws(f, 'TokenSequence.discard(): beyond end of sequence.');

        sequence.discard(1);
        assert.equal(sequence.tokensUsed, 0);
        assert.isTrue(sequence.atEOS());
    });

    it('atEOS()', () => {
        const t1 = new TokenSequence([]);
        assert.isTrue(t1.atEOS());

        const t2 = new TokenSequence([
            attributeChocolate,
            attributeDecaf,
        ]);
        assert.isFalse(t2.atEOS());
        t2.take(1);
        assert.isFalse(t2.atEOS());
        t2.take(1);
        assert.isTrue(t2.atEOS());
    });
});
