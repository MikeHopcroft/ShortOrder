import { assert } from 'chai';
import 'mocha';

import { AttributeInfo, CartOps, ItemInstance, State } from 'prix-fixe';

import {
    Interpretation,
    parseAdd,
    Parser,
    LexicalAnalyzer,
    SequenceToken,
    Span
} from '../../src';

import {
    smallWorldAttributes,
    smallWorldCatalog,
    smallWorldCookbook,
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
    quantityOne,
    quantityTwo,
    quantityFive,
    unitPumps,
} from '../shared';


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

// ActionFunction that does nothing.
function nop(state: State): State {
    return state;
}

describe('Parser2', () => {
    describe('findBestInterpretation()', () => {
        // // TODO: Reenable this test. Currently there is no way to test splitting
        // // across dimension repeat because segments have to start with quantities.
        // // Plan to change this back. Problem introducted in 8bbd7455.
        // it('segment on attribute dimension repeat', () => {
        //     const parser = new Parser2(ops, attributeInfo, smallWorldRuleChecker);
        //     const tokens = [
        //         attributeSmall,
        //         productCoffee,
        //         attributeDecaf,
        //         // Should split here because decaf conflicts with regular.
        //         attributeRegular,
        //         attributeMedium,
        //         productCoffee,
        //     ];

        //     const expected: Interpretation = {
        //         score: 6,
        //         items: [
        //             {
        //                 uid: 0,
        //                 key: '9000:0:0:1',
        //                 quantity: 1,
        //                 children: []
        //             },
        //             {
        //                 uid: 0,
        //                 key: '9000:1:0:0',
        //                 quantity: 1,
        //                 children: []
        //             }
        //         ]
        //     };

        //     const interpretation = 
        //         normalizeUIDs(parser.findBestInterpretation(tokens));

        //     assert.deepEqual(interpretation, expected);
        // });

        it('segment on quantifier', () => {
            // TODO: HACK: BUGBUG: Remove temporary code in following line.
            const lexer: LexicalAnalyzer = (undefined!);
            const parser = new Parser(
                ops,
                smallWorldCatalog,
                smallWorldCookbook,
                attributeInfo,
                lexer,
                smallWorldRuleChecker,
                false
            );
            const tokens = [
                quantityOne,
                attributeSmall,
                productCoffee,
                // Should split here because a product quantifer is not allowed.
                quantityFive,
                attributeDecaf,
                productCoffee,
            ];

            const expected: Interpretation = {
                score: 6,
                tokenCount2: 0, // This field never inspected by test.
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
                ],
                action: nop
            };

            // TODO: Remove type assertion.
            const interpretation = normalizeUIDs(
                    parseAdd(parser, tokens as Array<SequenceToken & Span>)
            );

            // TODO: Remove this temporary code.
            // TEMPORARY code to hide Interpretion.action from deepEqual.
            const expected2 = {
                score: expected.score,
                items: expected.items
            };

            const observed2 = {
                score: interpretation.score,
                items: interpretation.items
            };

            assert.deepEqual(observed2, expected2);
            // assert.deepEqual(interpretation, expected);
        });


        // TODO: Reenable this test. Currently there is no way to test splitting
        // across dimension repeat because segments have to start with quantities.
        // // Plan to change this back. Problem introducted in 8bbd7455.
        // it('segment on option exclusivity conflict', () => {
        //     const parser = new Parser2(ops, attributeInfo, smallWorldRuleChecker);
        //     const tokens = [
        //         attributeSmall,
        //         attributeSoy,
        //         optionMilk,
        //         attributeDecaf,
        //         productCoffee,
        //         // Should split here because previous item is soy.
        //         attributeWhole,
        //         optionMilk,
        //         attributeMedium,
        //         productCoffee,
        //     ];

        //     const expected: Interpretation = {
        //         score: 9,
        //         items: [
        //             {
        //                 uid: 0,
        //                 key: '9000:0:0:1',
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
        //                 key: '9000:1:0:0',
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

        it('segment ambiguous size based on options', () => {
            // TODO: HACK: BUGBUG: Remove temporary code in following line.
            const lexer: LexicalAnalyzer = (undefined!);
            const parser = new Parser(
                ops,
                smallWorldCatalog,
                smallWorldCookbook,
                attributeInfo,
                lexer,
                smallWorldRuleChecker,
                false
            );
            const tokens = [
                productCoffee,
                attributeMedium,
                attributeSoy,
                optionMilk,
                // Should split here because soy milk can only apply to coffee.
                // Therefore medium cannot apply to the cone.
                productCone,
            ];

            const expected: Interpretation = {
                score: 5,
                tokenCount2: 0, // This field never inspected by test.
                items: [
                    {
                        uid: 0,
                        key: '9000:1:0:0',
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
                        key: '8000:0:0',
                        quantity: 1,
                        children: []
                    }
                ],
                action: nop
            };

            // TODO: Remove type assertion.
            const interpretation = normalizeUIDs(
                    parseAdd(parser, tokens as Array<SequenceToken & Span>)
            );

            // assert.deepEqual(interpretation, expected);
            // TODO: Remove this temporary code.
            // TEMPORARY code to hide Interpretion.action from deepEqual.
            const expected2 = {
                score: expected.score,
                items: expected.items
            };

            const observed2 = {
                score: interpretation.score,
                items: interpretation.items
            };

            assert.deepEqual(observed2, expected2);
        });
    });
});

