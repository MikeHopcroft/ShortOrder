import { assert } from 'chai';
import 'mocha';
import { Cart, CartOps, Catalog, ChoiceDescription, ConvertDollarsToPennies, ItemInstance, SubstitutionDescription } from '../../src';
import { PID } from 'token-flow';


function makeComponent(pid: PID) {
    return {
        pid,
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 2 + pid % 3,
        price: 0.30
    };
}

function makeStandalone(
    pid: PID,
    name: string,
    price: number,
    defaults: PID[],
    choices: ChoiceDescription[],
    substitutions: PID[],
    options: PID[]
) {
    return {
        pid,
        name,
        aliases: [] as string[],
        price,
        standalone: true,
        composition: {
            defaults: defaults.map(makeComponent),
            choices,
            substitutions: [] as SubstitutionDescription[],
            options: options.map(makeComponent)
        }
    };
}

function makeIngredient(
    pid: PID,
    name: string,
    price: number
) {
    return {
        pid,
        name,
        aliases: [] as string[],
        price,
        standalone: false,
        composition: {
            defaults: [],
            choices: [],
            substitutions: [] as SubstitutionDescription[],
            options: []
        }
    };
}

const catalogItems = {
    items: [
        makeStandalone(2, 'Cheeseburger', 1.99, [5000, 5100, 5200, 5201, 5202], [], [], [5101, 5102, 7000]),
        makeIngredient(5000, 'Seasame Bun', 0),
        makeIngredient(5100, 'American Cheese Slice', 0.30),
        makeIngredient(5101, 'Cheddar Cheese Slice', 0.30),
        makeIngredient(5102, 'Swiss Cheese Slice', 0.30),
        makeIngredient(5200, 'Pickles', 0.10),
        makeIngredient(5201, 'Sliced Red Onion', 0),
        makeIngredient(5202, 'Leaf Lettuce', 0),
        {
            pid: 7000,
            name: "Well Done",
            aliases: [] as string[],
            price: 0,
            standalone: false,
            note: true,
            composition: {
                defaults: [],
                choices: [],
                substitutions: [] as SubstitutionDescription[],
                options: []
            }
        },
//        makeIngredient(7000, 'Well Done', 0),

        makeStandalone(200, "Down East Fish Sandwich", 3.99, [], [], [], []),

        makeStandalone(
            6000,
            'Surf N Turf',
            7.99,
            [2, 200],
            [{
                pid: 10000,
                className: 'beverage',
                alternatives: [1000, 1003]
            }],
            [],
            []),
        makeStandalone(1000, 'Small Coke', 0.99, [1090], [], [], []),
        makeStandalone(1003, 'Small Diet Coke', 0.99, [1090], [], [], []),
        makeIngredient(1090, 'Ice', 0),

        makeStandalone(1100, 'Small Coffee', 0.99, [], [], [], [1190, 1194]),
        makeIngredient(1190, 'Sugar', 0),
        makeIngredient(1194, 'Cream', 0),
    ]
};

ConvertDollarsToPennies(catalogItems);
const catalog = new Catalog(catalogItems);

const ops = new CartOps(catalog);

describe('CartOps', () => {
    describe('Updates', () => {
        //
        // Top-level items
        //

        it('add standalone top level', () => {
            let cart: Cart = { items: [] };
            cart = ops.updateCart(cart, 2, 1);

            const expected = { items: [
                { pid: 2, quantity: 1, modifications: [] as ItemInstance[]}
            ]};

            assert.deepEqual(expected, cart);
        });

        // // Fails because the functionality is not implemented.
        // // Adds a second cheeseburger ItemInstance instead of bumping the
        // // quantity of the existing ItemInstance.
        // it('add duplicate standalone top level', () => {
        //     let cart: Cart = { items: [] };
        //     cart = ops.updateCart(cart, 2, 1);
        //     cart = ops.updateCart(cart, 2, 1);

        //     const expected = { items: [
        //         { pid: 2, quantity: 2, modifications: [] as ItemInstance[]}
        //     ]};

        //     assert.deepEqual(expected, cart);
        // });

        it('remove standalone top level', () => {
            let cart: Cart = { items: [] };

            // Add a cheeseburger.
            cart = ops.updateCart(cart, 2, 1);

            // Add a coffee for good measure.
            cart = ops.updateCart(cart, 1100, 1);

            // Remove the cheeseburger.
            cart = ops.updateCart(cart, 2, 0);

            const expected = { items: [
                { pid: 1100, quantity: 1, modifications: [] as ItemInstance[]}
            ]};

            assert.deepEqual(expected, cart);
        });

        //
        // Modify defaults
        //

        it('add default to newest', () => {
            let cart: Cart = { items: [] };

            // Add a cheeseburger.
            cart = ops.updateCart(cart, 2, 1);

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add two creams.
            cart = ops.updateCart(cart, 1190, 2);

            const expected = { items: [
                { pid: 1100, quantity: 1, modifications: [
                    {
                        pid: 1190,
                        quantity: 2,
                        modifications: [] as ItemInstance[]
                    }
                ]},
                { pid: 2, quantity: 1, modifications: [] as ItemInstance[]}
            ]};

            assert.deepEqual(expected, cart);
        });

        it('modify default in newest', () => {
            let cart: Cart = { items: [] };

            // Add a cheeseburger.
            cart = ops.updateCart(cart, 2, 1);

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add two creams.
            cart = ops.updateCart(cart, 1190, 2);

            // Change to three creams.
            cart = ops.updateCart(cart, 1190, 3);

            const expected = { items: [
                { pid: 1100, quantity: 1, modifications: [
                    {
                        pid: 1190,
                        quantity: 3,
                        modifications: [] as ItemInstance[]
                    }
                ]},
                { pid: 2, quantity: 1, modifications: [] as ItemInstance[]}
            ]};

            assert.deepEqual(expected, cart);
        });

        it('remove default from newest', () => {
            let cart: Cart = { items: [] };

            // Add a cheeseburger.
            cart = ops.updateCart(cart, 2, 1);

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add two creams.
            cart = ops.updateCart(cart, 1190, 2);

            // Change to three creams.
            cart = ops.updateCart(cart, 1190, 0);

            const expected = { items: [
                { pid: 1100, quantity: 1, modifications: [] as ItemInstance[] },
                { pid: 2, quantity: 1, modifications: [] as ItemInstance[] }
            ]};

            assert.deepEqual(expected, cart);
        });

        it('add default to older item', () => {
            let cart: Cart = { items: [] };

            // Add a cheeseburger.
            cart = ops.updateCart(cart, 2, 1);

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add three pickles.
            cart = ops.updateCart(cart, 5200, 3);

            const expected = { items: [
                { pid: 1100, quantity: 1,modifications: [] as ItemInstance[] },
                { pid: 2, quantity: 1, modifications: [
                    {
                        pid: 5200,
                        quantity: 3,
                        modifications: [] as ItemInstance[]
                    }
                ]}
            ]};

            assert.deepEqual(expected, cart);
        });

        // Fails because the pickles aren't removed.
        // Their quantity is just set to zero.
        it('modify default in older item', () => {
            let cart: Cart = { items: [] };

            // Add a cheeseburger.
            cart = ops.updateCart(cart, 2, 1);

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add three pickles.
            cart = ops.updateCart(cart, 5200, 3);

            // Add two red onion.
            cart = ops.updateCart(cart, 5201, 2);

            // Remove pickles.
            cart = ops.updateCart(cart, 5200, 4);

            const expected = { items: [
                { pid: 1100, quantity: 1,modifications: [] as ItemInstance[] },
                { pid: 2, quantity: 1, modifications: [
                    {
                        pid: 5201,
                        quantity: 2,
                        modifications: [] as ItemInstance[]
                    },
                    {
                        pid: 5200,
                        quantity: 4,
                        modifications: [] as ItemInstance[]
                    }
                ]}
            ]};

            assert.deepEqual(expected, cart);
        });

        // This test fails because the pickles aren't removed.
        // Their quantity is just set to zero.
        it('remove default from older item', () => {
            let cart: Cart = { items: [] };

            // Add a cheeseburger.
            cart = ops.updateCart(cart, 2, 1);

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add three pickles.
            cart = ops.updateCart(cart, 5200, 3);

            // Add two red onion.
            cart = ops.updateCart(cart, 5201, 2);

            // Remove pickles.
            cart = ops.updateCart(cart, 5200, 0);

            const expected = { items: [
                { pid: 1100, quantity: 1,modifications: [] as ItemInstance[] },
                { pid: 2, quantity: 1, modifications: [
                    {
                        pid: 5201,
                        quantity: 2,
                        modifications: [] as ItemInstance[]
                    }
                ]}
            ]};

            assert.deepEqual(expected, cart);
        });

        //
        // Modify options
        //

        it('add option to newest', () => {
            let cart: Cart = { items: [] };

            // Add a cheeseburger.
            cart = ops.updateCart(cart, 2, 1);

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add Swiss Cheese.
            cart = ops.updateCart(cart, 5102, 2);

            const expected = { items: [
                { pid: 1100, quantity: 1, modifications: [] as ItemInstance[]},
                { pid: 2, quantity: 1, modifications: [
                    {
                        pid: 5102,
                        quantity: 2,
                        modifications: [] as ItemInstance[]
                    }
                ]},
            ]};

            assert.deepEqual(expected, cart);
        });

        it('modify option in newest', () => {
            let cart: Cart = { items: [] };

            // Add a cheeseburger.
            cart = ops.updateCart(cart, 2, 1);

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add Swiss Cheese.
            cart = ops.updateCart(cart, 5102, 2);

            // Add a cream
            cart = ops.updateCart(cart, 1194, 1);

            // Make it three slices of Swiss Cheese.
            cart = ops.updateCart(cart, 5102, 3);

            const expected = { items: [
                { pid: 1100, quantity: 1, modifications: [
                    {
                        pid: 1194,
                        quantity: 1,
                        modifications: [] as ItemInstance[]
                    }
                ]},
                { pid: 2, quantity: 1, modifications: [
                    {
                        pid: 5102,
                        quantity: 3,
                        modifications: [] as ItemInstance[]
                    }
                ]},
            ]};

            assert.deepEqual(expected, cart);
        });

        it('remove option from newest', () => {
            let cart: Cart = { items: [] };

            // Add a cheeseburger.
            cart = ops.updateCart(cart, 2, 1);

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add Swiss Cheese.
            cart = ops.updateCart(cart, 5102, 2);

            // Add a cream
            cart = ops.updateCart(cart, 1194, 1);

            // Make it three slices of Swiss Cheese.
            cart = ops.updateCart(cart, 5102, 0);

            const expected = { items: [
                { pid: 1100, quantity: 1, modifications: [
                    {
                        pid: 1194,
                        quantity: 1,
                        modifications: [] as ItemInstance[]
                    }
                ]},
                { pid: 2, quantity: 1, modifications: [] as ItemInstance[]}
            ]};

            assert.deepEqual(expected, cart);
        });

        // TODO: consider cases for modifying options in older items.
        // These may be too redundant.


        //
        // Modify choices
        //

        it('add choice to newest', () => {
            let cart: Cart = { items: [] };

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add a Surf N Turf.
            cart = ops.updateCart(cart, 6000, 1);

            const expected1 = { items: [
                { pid: 6000, quantity: 1, modifications: [] as ItemInstance[]},
                { pid: 1100, quantity: 1, modifications: [] as ItemInstance[]}
            ]};

            assert.deepEqual(expected1, cart);

            // Add a small Coke.
            cart = ops.updateCart(cart, 1000, 1);

            const expected2 = { items: [
                { pid: 6000, quantity: 1, modifications: [
                    {
                        pid: 1000,
                        quantity: 1,
                        modifications: [] as ItemInstance[]
                    }
                ]},
                { pid: 1100, quantity: 1, modifications: [] as ItemInstance[]}
            ]};

            assert.deepEqual(expected2, cart);
        });

        it('modify choice in newest', () => {
            let cart: Cart = { items: [] };

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add a Surf N Turf.
            cart = ops.updateCart(cart, 6000, 1);

            // Add a small Coke.
            cart = ops.updateCart(cart, 1000, 1);

            // Remove the Coke.
            cart = ops.updateCart(cart, 1000, 0);

            // Add a small Diet Coke.
            cart = ops.updateCart(cart, 1003, 1);

            const expected2 = { items: [
                { pid: 6000, quantity: 1, modifications: [
                    {
                        pid: 1003,
                        quantity: 1,
                        modifications: [] as ItemInstance[]
                    }
                ]},
                { pid: 1100, quantity: 1, modifications: [] as ItemInstance[]}
            ]};

            assert.deepEqual(expected2, cart);
        });

        it('add modification to choice in newest', () => {
            let cart: Cart = { items: [] };

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add a Surf N Turf.
            cart = ops.updateCart(cart, 6000, 1);

            // Add a small Coke.
            cart = ops.updateCart(cart, 1000, 1);

            // Remove the Coke.
            cart = ops.updateCart(cart, 1090, 0);

            const expected2 = { items: [
                { pid: 6000, quantity: 1, modifications: [
                    {
                        pid: 1000,
                        quantity: 1,
                        modifications: [
                            {
                                pid: 1090,
                                quantity: 0,
                                modifications: [] as ItemInstance[]
                            }
                        ]
                    }
                ]},
                { pid: 1100, quantity: 1, modifications: [] as ItemInstance[]}
            ]};

            assert.deepEqual(expected2, cart);
        });

        it('remove choice from newest', () => {
            let cart: Cart = { items: [] };

            // Add a coffee.
            cart = ops.updateCart(cart, 1100, 1);

            // Add a Surf N Turf.
            cart = ops.updateCart(cart, 6000, 1);

            // Add a small Coke.
            cart = ops.updateCart(cart, 1000, 1);

            // Remove the Coke.
            cart = ops.updateCart(cart, 1000, 0);

            const expected2 = { items: [
                { pid: 6000, quantity: 1, modifications: [] as ItemInstance[]},
                { pid: 1100, quantity: 1, modifications: [] as ItemInstance[]}
            ]};

            assert.deepEqual(expected2, cart);
        });

        //
        // Special cases
        //

        // TODO: Adding another identical item.
        // Should collapse to a single item with quantity = 2.

        // TODO: Removing modifications until item is identical with
        // another item in the cart.

        // TODO: Adding a choice to an item with quantity > 1.
        // Should add enough copies of choice.

        // TODO: Adding exactly one choice to an item with quantity > 1.
        // Should split the item.

        // TODO: Adding modification that applies to nothing in the cart.

        // TODO: Detect imcomplete choices.

    });

    describe('Formatting', () => {
        it('One singular standalone, unmodified', () => {
            const cart = { items: [
                { pid: 2, quantity: 1, modifications: [] as ItemInstance[]}
            ]};

            const order = ops.formatCart(cart);

            const expected = { lines: [
                {indent: 0, left: "QTY", middle: "ITEM", right: "TOTAL"},
                {indent: 0, left: "1", middle: "Cheeseburger", price: 199},
                {indent: 0, left: "Subtotal", middle: "", price: 199},
                {indent: 0, left: "", middle: "Tax", price: 18},
                {indent: 0, left: "Total", middle: "", price: 217}
            ]};

            assert.deepEqual(expected, order);
        });

        it('One double standalone, unmodified', () => {
            const cart = { items: [
                { pid: 2, quantity: 2, modifications: [] as ItemInstance[]}
            ]};

            const order = ops.formatCart(cart);

            const expected = { lines: [
                {indent: 0, left: "QTY", middle: "ITEM", right: "TOTAL"},
                {indent: 0, left: "2", middle: "Cheeseburger", price: 398},
                {indent: 0, left: "Subtotal", middle: "", price: 398},
                {indent: 0, left: "", middle: "Tax", price: 36},
                {indent: 0, left: "Total", middle: "", price: 434}
            ]};

            assert.deepEqual(expected, order);
        });

        it('Multiple standalones, unmodified', () => {
            const cart = { items: [
                { pid: 2, quantity: 2, modifications: [] as ItemInstance[]},
                { pid: 1100, quantity: 3, modifications: [] as ItemInstance[]},
                { pid: 1000, quantity: 1, modifications: [] as ItemInstance[]},
            ]};

            const order = ops.formatCart(cart);

            const expected = { lines: [
                {indent: 0, left: "QTY", middle: "ITEM", right: "TOTAL"},
                {indent: 0, left: "1", middle: "Small Coke", price: 99},
                {indent: 0, left: "3", middle: "Small Coffee", price: 297},
                {indent: 0, left: "2", middle: "Cheeseburger", price: 398},
                {indent: 0, left: "Subtotal", middle: "", price: 794},
                {indent: 0, left: "", middle: "Tax", price: 71},
                {indent: 0, left: "Total", middle: "", price: 865}
            ]};

            assert.deepEqual(expected, order);
        });

        it('XTRA, LIGHT, NO', () => {
            const cart = { items: [
                { pid: 2, quantity: 1, modifications: [
                    {
                        pid: 5100,
                        quantity: 2,
                        modifications: [] as ItemInstance[]
                    },
                    {
                        pid: 5200,
                        quantity: 0,
                        modifications: [] as ItemInstance[]
                    }
                ]},
            ]};

            const order = ops.formatCart(cart);

            const expected = { lines: [
                {indent: 0, left: "QTY", middle: "ITEM", right: "TOTAL"},
                {indent: 0, left: "1", middle: "Cheeseburger", price: 199},
                {indent: 1, left: "", middle: "NO Pickles", price: undefined},
                {indent: 1, left: "", middle: "XTRA American Cheese Slice", price: 30},
                {indent: 0, left: "Subtotal", middle: "", price: 229},
                {indent: 0, left: "", middle: "Tax", price: 21},
                {indent: 0, left: "Total", middle: "", price: 250}
            ]};

            assert.deepEqual(expected, order);
        });

        it('ADD, ADD N', () => {
            const cart = { items: [
                { pid: 2, quantity: 1, modifications: [
                    {
                        pid: 5101,
                        quantity: 1,
                        modifications: [] as ItemInstance[]
                    },
                    {
                        pid: 5102,
                        quantity: 4,
                        modifications: [] as ItemInstance[]
                    }
                ]},
            ]};

            const order = ops.formatCart(cart);

            const expected = { lines: [
                {indent: 0, left: "QTY", middle: "ITEM", right: "TOTAL"},
                {indent: 0, left: "1", middle: "Cheeseburger", price: 199},
                {indent: 1, left: "", middle: "ADD 4 Swiss Cheese Slice", price: 120},
                {indent: 1, left: "", middle: "ADD Cheddar Cheese Slice", price: 30},
                {indent: 0, left: "Subtotal", middle: "", price: 349},
                {indent: 0, left: "", middle: "Tax", price: 31},
                {indent: 0, left: "Total", middle: "", price: 380}
            ]};

            assert.deepEqual(expected, order);
        });

        it('CHOICE', () => {
            const cart = { items: [
                { pid: 6000, quantity: 1, modifications: [
                    {
                        pid: 1000,
                        quantity: 1,
                        modifications: [] as ItemInstance[]
                    }
                ]},
            ]};

            const order = ops.formatCart(cart);

            const expected = { lines: [
                {indent: 0, left: "QTY", middle: "ITEM", right: "TOTAL"},
                {indent: 0, left: "1", middle: "Surf N Turf", price: 799},
                {indent: 1, left: "1", middle: "Small Coke", price: undefined},
                {indent: 0, left: "Subtotal", middle: "", price: 799},
                {indent: 0, left: "", middle: "Tax", price: 72},
                {indent: 0, left: "Total", middle: "", price: 871}
            ]};

            assert.deepEqual(expected, order);
        });

        it('NOTE', () => {
            const cart = { items: [
                { pid: 2, quantity: 1, modifications: [
                    {
                        pid: 7000,
                        quantity: 1,
                        modifications: [] as ItemInstance[]
                    }
                ]},
            ]};

            const order = ops.formatCart(cart);

            const expected = { lines: [
                {indent: 0, left: "QTY", middle: "ITEM", right: "TOTAL"},
                {indent: 0, left: "1", middle: "Cheeseburger", price: 199},
                {indent: 1, left: "", middle: "Well Done", price: undefined},
                {indent: 0, left: "Subtotal", middle: "", price: 199},
                {indent: 0, left: "", middle: "Tax", price: 18},
                {indent: 0, left: "Total", middle: "", price: 217}
            ]};

            assert.deepEqual(expected, order);
        });

        it('Subtotal, tax, total', () => {
            const cart = { items: [
                { pid: 2, quantity: 2, modifications: [] as ItemInstance[]},
                { pid: 1100, quantity: 3, modifications: [] as ItemInstance[]},
                { pid: 1000, quantity: 1, modifications: [] as ItemInstance[]},
            ]};

            const order = ops.formatCart(cart);

            const expected = { lines: [
                {indent: 0, left: "QTY", middle: "ITEM", right: "TOTAL"},
                {indent: 0, left: "1", middle: "Small Coke", price: 99},
                {indent: 0, left: "3", middle: "Small Coffee", price: 297},
                {indent: 0, left: "2", middle: "Cheeseburger", price: 398},
                {indent: 0, left: "Subtotal", middle: "", price: 794},
                {indent: 0, left: "", middle: "Tax", price: 71},
                {indent: 0, left: "Total", middle: "", price: 865}
            ]};

            assert.deepEqual(expected, order);
        });
    });
});
