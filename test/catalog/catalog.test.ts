import { assert } from 'chai';
import 'mocha';

import { ItemDescription, PID, IsChoiceOf, IsComponentOf, IsDefaultOf, IsOptionOf, IsSubstitutionOf } from '../../src/catalog';

const anyPrice = 0.99;
const anyDefaultQuantity = 1;
const anyMinQuantity = 0;
const anyMaxQuantity = 3;

const item1: ItemDescription = {
    pid: 1,
    name: 'item1',
    aliases: [],
    price: 0.99,
    composition: {
        defaults: [
            {
                pid: 2,
                defaultQuantity: anyDefaultQuantity,
                minQuantity: anyMinQuantity,
                maxQuantity: anyMaxQuantity,
                price: anyPrice
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


describe('catalog', () => {
    describe('IsChoiceOf', () => {
        it('should accurately test choice membership.', () => {
            assert.isTrue(IsChoiceOf(item100, item1));
            assert.isTrue(IsChoiceOf(item400, item1));
            assert.isFalse(IsChoiceOf(item3, item1));
        });
    });
    describe('IsComponentOf', () => {
        it('should accurately test choice membership.', () => {
            assert.isTrue(IsComponentOf(item100, item1));
            assert.isTrue(IsComponentOf(item2, item1));
            assert.isTrue(IsComponentOf(item5, item1));
            assert.isTrue(IsComponentOf(item4, item1));
            assert.isFalse(IsChoiceOf(item3, item1));
        });
    });
    describe('IsDefaultOf', () => {
        it('should accurately test default membership.', () => {
            assert.isTrue(IsDefaultOf(item2, item1));
            assert.isFalse(IsDefaultOf(item3, item1));
        });
    });
    describe('IsOptionOf', () => {
        it('should accurately test option membership.', () => {
            assert.isTrue(IsOptionOf(item5, item1));
            assert.isFalse(IsOptionOf(item2, item1));
        });
    });
    describe('IsSubstitutionOf', () => {
        it('should accurately test substitutions membership.', () => {
            assert.isTrue(IsSubstitutionOf(item4, item1));
            assert.isFalse(IsSubstitutionOf(item2, item1));
        });
    });
});
