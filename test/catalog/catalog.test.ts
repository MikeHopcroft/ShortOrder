import { assert } from 'chai';
import 'mocha';

import { ItemDescription, Catalog } from '../../src/catalog';
import { PID } from 'prix-fixe';

const anyPrice = 0.99;
const anyDefaultQuantity = 1;
const anyMinQuantity = 0;
const anyMaxQuantity = 3;

const item1: ItemDescription = {
    pid: 1,
    name: 'item1',
    aliases: [],
    price: 0.99,
    standalone: true,
    composition: {
        defaults: [
            {
                pid: 2,
                defaultQuantity: anyDefaultQuantity,
                minQuantity: anyMinQuantity,
                maxQuantity: anyMaxQuantity,
                price: anyPrice,
            }
        ],
        choices: [
            {
                pid: 3,
                className: 'beverage',
                alternatives: [100, 200, 300]
            },
            {
                pid: 3,
                className: 'size',
                alternatives: [400, 500, 600]
            }
        ],
        substitutions: [
            {
                canReplace: 2,
                replaceWith: 4,
                price: anyPrice
            }
        ],
        options: [
            {
                pid: 5,
                defaultQuantity: anyDefaultQuantity,
                minQuantity: anyMinQuantity,
                maxQuantity: anyMaxQuantity,
                price: anyPrice
            }
        ]
    }
};

function makeItem(pid: PID) {
    return {
        pid,
        name: `item${pid}`,
        aliases: [],
        price: anyPrice,
        standalone: true,
        composition: {
            defaults: [],
            choices: [],
            substitutions: [],
            options: []
        }
    };
}

const item2 = makeItem(2);
const item3 = makeItem(3);
const item4 = makeItem(4);
const item5 = makeItem(5);
const item100 = makeItem(100);
const item400 = makeItem(400);

const catalog = new Catalog({ items: [item1, item2, item3, item4, item5, item100, item400] });

describe('Catalog', () => {
    describe('PredicatesX', () => {
        it('IsChoiceOf', () => {
            assert.isTrue(catalog.isChoiceOf(100, 1));
            assert.isTrue(catalog.isChoiceOf(400, 1));
            assert.isFalse(catalog.isChoiceOf(3, 1));
        });

        it('IsComponentOf', () => {
            assert.isTrue(catalog.isComponentOf(100, 1));
            assert.isTrue(catalog.isComponentOf(2, 1));
            assert.isTrue(catalog.isComponentOf(5, 1));
            assert.isTrue(catalog.isComponentOf(4, 1));
            assert.isFalse(catalog.isChoiceOf(3, 1));
        });

        it('IsDefaultOf', () => {
            assert.isTrue(catalog.isDefaultOf(2, 1));
            assert.isFalse(catalog.isDefaultOf(3, 1));
        });

        it('IsOptionOf', () => {
            assert.isTrue(catalog.isOptionOf(5, 1));
            assert.isFalse(catalog.isOptionOf(2, 1));
        });
        
        it('isSubstitutionOf', () => {
            assert.isTrue(catalog.isSubstitutionOf(4, 1));
            assert.isFalse(catalog.isSubstitutionOf(2, 1));
        });
    });
});
