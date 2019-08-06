import { assert } from 'chai';
import 'mocha';

import { AttributeInfo, CartOps, ItemInstance, Key } from 'prix-fixe';

import { EntityBuilder, Parser, Segment } from '../../src';

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

const parser: Parser = {
    attributes: attributeInfo,
    debugMode: false,
    cartOps: ops,
    catalog: smallWorldCatalog,
    rules: smallWorldRuleChecker,

    // TODO: clean this up.
    // The following properties are never used by these test.
    // Just type-assert.
    intentTokens: undefined!,
    productTokens: undefined!,
    lexer: undefined!,
};

export interface SimpleItemInstance {
    key: Key;
    quantity: number;
    children: SimpleItemInstance[];
}


function stripUIDs(item: ItemInstance): SimpleItemInstance {
    return {
        key: item.key,
        quantity: item.quantity,
        children: item.children.map(stripUIDs)
    };
}

function process(segment: Segment) {
    const builder = new EntityBuilder(
        parser,
        segment
    );

    const score = builder.getScore();
    const item = builder.getItem();

    return {
        score,
        item: stripUIDs(item)
    };
}

describe('Parser2', () => {
    describe('EntityBuilder', () => {
        it('entity', () => {
            const segment: Segment = {
                left: [],
                entity: productCone.pid,
                right: [],
            };

            const expected = {
                score: 1,
                item: {
                    key: '8000:0:0',
                    quantity: 1,
                    children: []
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        // TODO: after reintroducing implied entity quantifiers, remove quantityOne.
        // Problem introducted in 8bbd7455. Same issue below.
        it('attribute attribute product', () => {
            const segment: Segment = {
                left: [quantityOne, attributeMedium, attributeChocolate],
                entity: productCone.pid,
                right: [],
            };

            const expected = {
                score: 4,
                item: {
                    key: '8000:1:1',
                    quantity: 1,
                    children: []
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        it('quantityOne attribute product attribute', () => {
            const segment: Segment = {
                left: [quantityOne, attributeSmall],
                entity: productCone.pid,
                right: [attributeChocolate],
            };

            const expected = {
                score: 4,
                item: {
                    key: '8000:0:1',
                    quantity: 1,
                    children: []
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        it('bad-attribute product attribute', () => {
            const segment: Segment = {
                left: [attributeDecaf],
                entity: productCone.pid,
                right: [attributeChocolate],
            };

            const expected = {
                score: 2,
                item: {
                    key: '8000:0:1',
                    quantity: 1,
                    children: []
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        it('quantity attribute product attribute', () => {
            const segment: Segment = {
                left: [quantityTwo, attributeMedium],
                entity: productCone.pid,
                right: [attributeChocolate],
            };

            const expected = {
                score: 4,
                item: {
                    key: '8000:1:1',
                    quantity: 2,
                    children: []
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        it('option product', () => {
            const segment: Segment = {
                left: [quantityOne, optionMilk],
                entity: productCoffee.pid,
                right: [],
            };

            const expected = {
                score: 3,
                item: {
                    key: '9000:0:0:0',
                    quantity: 1,
                    children: [
                        {
                            key: '5000:1',
                            quantity: 1,
                            children: [],
                        }
                    ]
                }
            };

            assert.deepEqual(process(segment), expected);
        });


        it('product conjunction option', () => {
            const segment: Segment = {
                left: [],
                entity: productCoffee.pid,
                right: [conjunction, optionMilk],
            };

            const expected = {
                score: 3,
                item: {
                    key: '9000:0:0:0',
                    quantity: 1,
                    children: [
                        {
                            key: '5000:1',
                            quantity: 1,
                            children: [],
                        }
                    ]
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        it('option-attribute option product', () => {
            const segment: Segment = {
                left: [quantityOne, attributeSoy, optionMilk],
                entity: productCoffee.pid,
                right: [],
            };

            const expected = {
                score: 4,
                item: {
                    key: '9000:0:0:0',
                    quantity: 1,
                    children: [
                        {
                            key: '5000:3',
                            quantity: 1,
                            children: [],
                        }
                    ]
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        // TODO: Reinstate this test.
        // For now, the pattern [QUANTITY, UNITS, OPTION, PRODUCT]
        // is not supported. Previously, QUANTITY was for UNITS.
        // Now it is for PRODUCT.
        //
        // it('quantity units option product', () => {
        //     const segment: Segment = {
        //         left: [quantityTwo, unitPumps, optionMilk],
        //         entity: productCoffee,
        //         right: [],
        //     };

        //     const expected = {
        //         score: 4,
        //         item: {
        //             key: '9000:0:0:0',
        //             quantity: 1,
        //             children: [
        //                 {
        //                     key: '5000:1',
        //                     quantity: 2,
        //                     children: [],
        //                 }
        //             ]
        //         }
        //     };

        //     assert.deepEqual(process(segment), expected);
        // });

        it('quantity quantity units option product', () => {
            const segment: Segment = {
                left: [quantityFive, quantityTwo, unitPumps, optionMilk],
                entity: productCoffee.pid,
                right: [],
            };

            const expected = {
                score: 5,
                item: {
                    key: '9000:0:0:0',
                    quantity: 5,
                    children: [
                        {
                            key: '5000:1',
                            quantity: 2,
                            children: [],
                        }
                    ]
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        it('attribute product conjunction quantity unit option', () => {
            const segment: Segment = {
                left: [quantityOne, attributeDecaf],
                entity: productCoffee.pid,
                right: [conjunction, quantityTwo, unitPumps, optionMilk],
            };

            const expected = {
                score: 7,
                item: {
                    key: '9000:0:0:1',
                    quantity: 1,
                    children: [
                        {
                            key: '5000:1',
                            quantity: 2,
                            children: [],
                        }
                    ]
                }
            };

            assert.deepEqual(process(segment), expected);
        });


        ///////////////////////////////////////////////////////////////////////
        //
        // Error handling cases
        //

        // Second attribute on caffeine dimension is ignored.
        it('attribute !attribute product', () => {
            const segment: Segment = {
                left: [quantityOne,attributeDecaf, attributeRegular],
                entity: productCoffee.pid,
                right: [],
            };

            const expected = {
                score: 3,
                item: {
                    key: '9000:0:0:1',
                    quantity: 1,
                    children: []
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        // Second option in exclusion zone is ignored.
        it('option-attribute option !option product', () => {
            const segment: Segment = {
                left: [quantityOne, attributeSoy, optionMilk, optionMilk],
                entity: productCoffee.pid,
                right: [],
            };

            const expected = {
                score: 4,
                item: {
                    key: '9000:0:0:0',
                    quantity: 1,
                    children: [
                        {
                            key: '5000:3',
                            quantity: 1,
                            children: [],
                        }
                    ]
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        // Second option in exclusion zone is ignored.
        it('!option option-attribute option product', () => {
            const segment: Segment = {
                left: [quantityOne, optionMilk, attributeSoy, optionMilk],
                entity: productCoffee.pid,
                right: [],
            };

            const expected = {
                score: 3,
                item: {
                    key: '9000:0:0:0',
                    quantity: 1,
                    children: [
                        {
                            key: '5000:1',
                            quantity: 1,
                            children: [],
                        }
                    ]
                }
            };

            assert.deepEqual(process(segment), expected);
        });


        // Dangling quantifier is ignored.
        it('product quanitfier', () => {
            const segment: Segment = {
                left: [],
                entity: productCoffee.pid,
                right: [quantityTwo],
            };

            const expected = {
                score: 1,
                item: {
                    key: '9000:0:0:0',
                    quantity: 1,
                    children: []
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        // Second product quantifier.
        // Note that 'quantifier quantifier unit option product' would be
        // legal because the second quantifier applies to an option.
        it('quanitfier quantifier product', () => {
            const segment: Segment = {
                left: [quantityTwo, quantityFive],
                entity: productCoffee.pid,
                right: [],
            };

            const expected = {
                score: 2,
                item: {
                    key: '9000:0:0:0',
                    quantity: 2,
                    children: []
                }
            };

            assert.deepEqual(process(segment), expected);
        });

    });
});
