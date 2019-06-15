import { assert } from 'chai';
import 'mocha';

import { AttributeInfo, CartOps, ItemInstance, Key } from 'prix-fixe';
import { NumberToken, NUMBERTOKEN } from 'token-flow';

import {
    ATTRIBUTE,
    AttributeToken,
    CONJUNCTION,
    CreateIntent,
    ENTITY,
    EntityToken,
    OPTION,
    OptionToken,
    UNIT,
    UnitToken
} from '../../src';

import { EntityBuilder, Segment, ConjunctionToken } from '../../src/parser2';

import {
    caffeineDecaf,
    genericCoffeePID,
    genericConePID,
    genericMilkPID,
    sizeMedium,
    sizeSmall,
    flavorChocolate,
    smallWorldAttributes,
    smallWorldCatalog,
    smallWorldRuleChecker,
    milkSoy,
    caffeineRegular
} from '../shared';

const productCone: EntityToken = {
    type: ENTITY,
    pid: genericConePID,
    name: 'ice cream cone',
};

const productCoffee: EntityToken = {
    type: ENTITY,
    pid: genericCoffeePID,
    name: 'coffee',
};

const optionMilk: OptionToken = {
    type: OPTION,
    id: genericMilkPID,
    name: 'milk',
};

const quantityTwo: NumberToken = {
    type: NUMBERTOKEN,
    value: 2,
};

const quantityFive: NumberToken = {
    type: NUMBERTOKEN,
    value: 5,
};

const conjunction: ConjunctionToken = {
    type: CONJUNCTION
};

const unitPumps: UnitToken = {
    type: UNIT,
    id: 0,
    name: 'pumps'
};

const attributeDecaf: AttributeToken = {
    type: ATTRIBUTE,
    id: caffeineDecaf,
    name: 'decaf',
};

const attributeRegular: AttributeToken = {
    type: ATTRIBUTE,
    id: caffeineRegular,
    name: 'regular',
};

const attributeSmall: AttributeToken = {
    type: ATTRIBUTE,
    id: sizeSmall,
    name: 'small',
};

const attributeMedium: AttributeToken = {
    type: ATTRIBUTE,
    id: sizeMedium,
    name: 'medium',
};

const attributeChocolate: AttributeToken = {
    type: ATTRIBUTE,
    id: flavorChocolate,
    name: 'chocolate',
};

const attributeSoy: AttributeToken = {
    type: ATTRIBUTE,
    id: milkSoy,
    name: 'soy',
};

const attributeInfo = new AttributeInfo(
    smallWorldCatalog,
    smallWorldAttributes
);

const ops: CartOps = new CartOps(
    attributeInfo,
    smallWorldCatalog,
    smallWorldRuleChecker
);

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
    const builder = new EntityBuilder(segment, ops, attributeInfo, smallWorldRuleChecker);

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
                entity: productCone,
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

        it('attribute attribute product', () => {
            const segment: Segment = {
                left: [attributeMedium, attributeChocolate],
                entity: productCone,
                right: [],
            };

            const expected = {
                score: 3,
                item: {
                    key: '8000:1:1',
                    quantity: 1,
                    children: []
                }
            };

            assert.deepEqual(process(segment), expected);
        });

        it('attribute product attribute', () => {
            const segment: Segment = {
                left: [attributeSmall],
                entity: productCone,
                right: [attributeChocolate],
            };

            const expected = {
                score: 3,
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
                entity: productCone,
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
                entity: productCone,
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
                left: [optionMilk],
                entity: productCoffee,
                right: [],
            };

            const expected = {
                score: 2,
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
                entity: productCoffee,
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
                left: [attributeSoy, optionMilk],
                entity: productCoffee,
                right: [],
            };

            const expected = {
                score: 3,
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

        it('quantity units option product', () => {
            const segment: Segment = {
                left: [quantityTwo, unitPumps, optionMilk],
                entity: productCoffee,
                right: [],
            };

            const expected = {
                score: 4,
                item: {
                    key: '9000:0:0:0',
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

        it('quantity quantity units option product', () => {
            const segment: Segment = {
                left: [quantityFive, quantityTwo, unitPumps, optionMilk],
                entity: productCoffee,
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
                left: [attributeDecaf],
                entity: productCoffee,
                right: [conjunction, quantityTwo, unitPumps, optionMilk],
            };

            const expected = {
                score: 6,
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
                left: [attributeDecaf, attributeRegular],
                entity: productCoffee,
                right: [],
            };

            const expected = {
                score: 2,
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
                left: [attributeSoy, optionMilk, optionMilk],
                entity: productCoffee,
                right: [],
            };

            const expected = {
                score: 3,
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
                left: [optionMilk, attributeSoy, optionMilk],
                entity: productCoffee,
                right: [],
            };

            const expected = {
                score: 2,
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
                entity: productCoffee,
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
                entity: productCoffee,
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

// TODO: TokenSequence.startsWith()
// TODO: syrups in Small World
// x TODO: mutual exclusion on attributes
// x TODO: mutual exclusion on options
// x TODO: conjunctions
// x TODO: number after entity
// x TODO: number after number
// splitOnEntities
// enumerateSplits
// Parser2
