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
    milkSoy
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

// TODO: TokenSequence.startsWith()
// TODO: syrups in Small World

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
    const builder = new EntityBuilder(segment, ops, attributeInfo);

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


        // TODO: mutual exclusion on attributes
        // TODO: mutual exclusion on options
        // x TODO: conjunctions
        // TODO: number after entity
        // TODO: number after number
    });
});

