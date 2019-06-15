import { assert } from 'chai';
import 'mocha';

import { enumerateSplits, splitOnEntities, SequenceToken, GapToken } from '../../src/parser2';

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

import { EntityToken } from '../../src';

describe('Parser Utilities', () => {

    ///////////////////////////////////////////////////////////////////////////
    //
    // splitOnEntities()
    //
    ///////////////////////////////////////////////////////////////////////////
    describe('splitOnEntities()', () => {
        it('general', () => {
            const tokens: SequenceToken[] = [
                attributeMedium,
                attributeChocolate,
                productCone,
                attributeSmall,
                attributeDecaf,
                productCoffee,
                conjunction,
                attributeSoy,
                optionMilk,
            ];

            const expectedEntities: EntityToken[] = [
                productCone,
                productCoffee,
            ];

            const expectedGaps: GapToken[][] = [
                [
                    attributeMedium,
                    attributeChocolate,
                ],
                [
                    attributeSmall,
                    attributeDecaf,
                ],
                [
                    conjunction,
                    attributeSoy,
                    optionMilk,
                ],
            ];

            const { entities, gaps } = splitOnEntities(tokens);

            assert.deepEqual(expectedEntities, entities);
            assert.deepEqual(expectedGaps, gaps);
        });

        it('product', () => {
            const tokens: SequenceToken[] = [
                productCone,
            ];

            const expectedEntities: EntityToken[] = [
                productCone,
            ];

            const expectedGaps: GapToken[][] = [
                [
                ],
                [
                ],
            ];

            const { entities, gaps } = splitOnEntities(tokens);

            assert.deepEqual(expectedEntities, entities);
            assert.deepEqual(expectedGaps, gaps);
        });

        it('entity product', () => {
            const tokens: SequenceToken[] = [
                productCone,
                productCoffee,
            ];

            const expectedEntities: EntityToken[] = [
                productCone,
                productCoffee,
            ];

            const expectedGaps: GapToken[][] = [
                [
                ],
                [
                ],
                [
                ],
            ];

            const { entities, gaps } = splitOnEntities(tokens);

            assert.deepEqual(expectedEntities, entities);
            assert.deepEqual(expectedGaps, gaps);
        });

        it('attribute product', () => {
            const tokens: SequenceToken[] = [
                attributeChocolate,
                productCone,
            ];

            const expectedEntities: EntityToken[] = [
                productCone,
            ];

            const expectedGaps: GapToken[][] = [
                [
                    attributeChocolate,
                ],
                [
                ],
            ];

            const { entities, gaps } = splitOnEntities(tokens);

            assert.deepEqual(expectedEntities, entities);
            assert.deepEqual(expectedGaps, gaps);
        });

        it('product attribute', () => {
            const tokens: SequenceToken[] = [
                productCoffee,
                attributeDecaf,
            ];

            const expectedEntities: EntityToken[] = [
                productCoffee,
            ];

            const expectedGaps: GapToken[][] = [
                [
                ],
                [
                    attributeDecaf,
                ],
            ];

            const { entities, gaps } = splitOnEntities(tokens);

            assert.deepEqual(expectedEntities, entities);
            assert.deepEqual(expectedGaps, gaps);
        });

        it('product attribute product', () => {
            const tokens: SequenceToken[] = [
                productCone,
                attributeDecaf,
                productCoffee,
            ];

            const expectedEntities: EntityToken[] = [
                productCone,
                productCoffee,
            ];

            const expectedGaps: GapToken[][] = [
                [
                ],
                [
                    attributeDecaf,
                ],
                [
                ],
            ];

            const { entities, gaps } = splitOnEntities(tokens);

            assert.deepEqual(expectedEntities, entities);
            assert.deepEqual(expectedGaps, gaps);
        });

        it('(empty)', () => {
            const tokens: SequenceToken[] = [];

            const expectedEntities: EntityToken[] = [];

            const expectedGaps: GapToken[][] = [];

            const { entities, gaps } = splitOnEntities(tokens);

            assert.deepEqual(expectedEntities, entities);
            assert.deepEqual(expectedGaps, gaps);
        });
    });

    ///////////////////////////////////////////////////////////////////////////
    //
    // enumerateSplits()
    //
    ///////////////////////////////////////////////////////////////////////////
    describe('enumerateSplits()', () => {
        it('general', () => {
            const lengths = [4, 3, 2, 1];
            const expectedSplits = [
                [0, 0, 0, 1],
                [0, 0, 1, 1],
                [0, 0, 2, 1],

                [0, 1, 0, 1],
                [0, 1, 1, 1],
                [0, 1, 2, 1],

                [0, 2, 0, 1],
                [0, 2, 1, 1],
                [0, 2, 2, 1],

                [0, 3, 0, 1],
                [0, 3, 1, 1],
                [0, 3, 2, 1],
            ];
            const splits = [...enumerateSplits(lengths)];
            assert.deepEqual(splits, expectedSplits);
        });

        it('length === 2', () => {
            const lengths = [4, 1];
            const expectedSplits = [
                [0, 1],
            ];
            const splits = [...enumerateSplits(lengths)];
            assert.deepEqual(splits, expectedSplits);
        });

        it('length === 1', () => {
            const lengths = [4];
            const expectedSplits = [
                [0],
            ];
            const f = () => [...enumerateSplits(lengths)];
            assert.throws(f, 'enumerateSplits: must have at least two lengths.');
        });
    });
});