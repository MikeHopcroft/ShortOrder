import { assert } from 'chai';
import 'mocha';

import { AttributeInfo, CartOps, ItemInstance, Key } from 'prix-fixe';

import { Interpretation, Parser2 } from '../../src/parser2';

import {
    smallWorldAttributes,
    smallWorldCatalog,
    smallWorldRuleChecker,
} from '../shared';

import {
    attributeChocolate,
    attributeDecaf,
    attributeMedium,
    attributeRegular,
    attributeSmall,
    attributeSoy,
    attributeWhole,
    conjunction,
    optionMilk,
    productCone,
    productCoffee,
    quantityTwo,
    quantityFive,
    unitPumps,
} from '../shared';
import { Item } from 'token-flow';


const attributeInfo = new AttributeInfo(
    smallWorldCatalog,
    smallWorldAttributes
);

const ops: CartOps = new CartOps(
    attributeInfo,
    smallWorldCatalog,
    smallWorldRuleChecker
);

function normalizeUIDsRecursion(items: ItemInstance[]): ItemInstance[] {
    return items.map(item => ({
        ...item,
        uid: 0,
        children: normalizeUIDsRecursion(item.children)
    }));
}

function normalizeUIDs(interpretation: Interpretation) {
    return {
        ...interpretation,
        items: normalizeUIDsRecursion(interpretation.items)
    };
}

describe('Parser2', () => {
    describe('findBestInterpretation()', () => {
        it('segment on attribute dimension repeat', () => {
            const parser = new Parser2(ops, attributeInfo, smallWorldRuleChecker);
            const tokens = [
                attributeSmall,
                productCoffee,
                attributeDecaf,
                // Should split here because decaf conflicts with regular.
                attributeRegular,
                attributeMedium,
                productCoffee,
            ];

            const expected: Interpretation = {
                score: 6,
                items: [
                    {
                        uid: 0,
                        key: '9000:0:0:1',
                        quantity: 1,
                        children: []
                    },
                    {
                        uid: 0,
                        key: '9000:1:0:0',
                        quantity: 1,
                        children: []
                    }
                ]
            };

            const interpretation = 
                normalizeUIDs(parser.findBestInterpretation(tokens));

            assert.deepEqual(interpretation, expected);
        });

        it('segment on quantifier', () => {
            const parser = new Parser2(ops, attributeInfo, smallWorldRuleChecker);
            const tokens = [
                attributeSmall,
                productCoffee,
                // Should split here because a product quantifer is not allowed.
                quantityFive,
                attributeDecaf,
                productCoffee,
            ];

            const expected: Interpretation = {
                score: 5,
                items: [
                    {
                        uid: 0,
                        key: '9000:0:0:0',
                        quantity: 1,
                        children: []
                    },
                    {
                        uid: 0,
                        key: '9000:0:0:1',
                        quantity: 5,
                        children: []
                    }
                ]
            };

            const interpretation = 
                normalizeUIDs(parser.findBestInterpretation(tokens));

            assert.deepEqual(interpretation, expected);
        });


        it('segment on option exclusivity conflict', () => {
            const parser = new Parser2(ops, attributeInfo, smallWorldRuleChecker);
            const tokens = [
                attributeSmall,
                attributeSoy,
                optionMilk,
                attributeDecaf,
                productCoffee,
                // Should split here because previous item is soy.
                attributeWhole,
                optionMilk,
                attributeMedium,
                productCoffee,
            ];

            const expected: Interpretation = {
                score: 9,
                items: [
                    {
                        uid: 0,
                        key: '9000:0:0:1',
                        quantity: 1,
                        children: [
                            {
                                uid: 0,
                                key: '5000:3',
                                quantity: 1,
                                children: []
                            }        
                        ]
                    },
                    {
                        uid: 0,
                        key: '9000:1:0:0',
                        quantity: 1,
                        children: [
                            {
                                uid: 0,
                                key: '5000:0',
                                quantity: 1,
                                children: []
                            }        
                        ]
                    }
                ]
            };

            const interpretation = 
                normalizeUIDs(parser.findBestInterpretation(tokens));

            assert.deepEqual(interpretation, expected);
        });

        // TODO: enable this test when parser checks for legal options.
        // it('segment ambiguous size based on options', () => {
        //     const parser = new Parser2(ops, attributeInfo, smallWorldRuleChecker);
        //     const tokens = [
        //         productCoffee,
        //         attributeMedium,
        //         attributeSoy,
        //         optionMilk,
        //         // Should split here because soy milk can only apply to coffee.
        //         // Therefore medium cannot apply to the cone.
        //         productCone,
        //     ];

        //     const expected: Interpretation = {
        //         score: 5,
        //         items: [
        //             {
        //                 uid: 0,
        //                 key: '9000:1:0:0',
        //                 quantity: 1,
        //                 children: [
        //                     {
        //                         uid: 0,
        //                         key: '5000:3',
        //                         quantity: 1,
        //                         children: []
        //                     }        
        //                 ]
        //             },
        //             {
        //                 uid: 0,
        //                 key: '8000:0:0',
        //                 quantity: 1,
        //                 children: [
        //                     {
        //                         uid: 0,
        //                         key: '5000:0',
        //                         quantity: 1,
        //                         children: []
        //                     }        
        //                 ]
        //             }
        //         ]
        //     };

        //     const interpretation = 
        //         normalizeUIDs(parser.findBestInterpretation(tokens));

        //     assert.deepEqual(interpretation, expected);
        // });

    });
});

