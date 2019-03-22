import { Action, ChoiceAction, CHOICE, CONFUSED, COMPLETE, OK } from '../actions';
import { Catalog, ComponentDescription } from '../catalog';
import { LineItem, Order, OrderOps } from '../order';
import { PID } from 'token-flow';


// DESIGN INTENT: most objects are POJOs, instead of classes to allow for
// serialization.

// ///////////////////////////////////////////////////////////////////////////////
// //
// // DESIGN NOTE: We might want a function that will compute a hash for a
// // canonical representation of the components ItemInstance. We could use this
// // hash to convert a "Hamburger with Cheese" into a "Cheeseburger". Another
// // use case would be when someone orders two Dakota Burgers and we replace it
// // with a Two-Fer combo.
// //
// // DESIGN NOTE: We should think about canonical forms for ItemInstances.
// // Are two ItemInstances with the same ingredients, but different orders
// // considered the same? Are we optimizing for capturing customer history
// // timeline or for canonical contents.
// //
// // DESIGN NOTE: We might want a function that takes an ItemInstance and
// // returns its flattened form. One could use this to, say, convert a Dakota
// // Combo to a sandwich, fries, and a drink choice, as the first step in
// // replacing the drink with a Frappe, which is not a part of the Dakota Combo.
// // 
// ///////////////////////////////////////////////////////////////////////////////


// function CanItemAddComponent(item: ItemInstance, component: ItemDescription): boolean {
//     return false;
// }

// type CanItemRemoveComponent = (item: ItemInstance, component: ItemDescription) => boolean;
// type CanItemReplaceComponent = (item: ItemInstance, replaces: ItemDescription, replacesWith: ItemDescription) => boolean;
// type IsComponentOfItem = (parent: ItemDescription, child: ItemDescription) => boolean;
// type IsItemFullySpecified = (item: ItemInstance) => boolean;

// // for developer asserts, only. Not public? Part of test harness?
// type IsItemValid = (item: ItemInstance) => boolean;

// // QUESTION: does this return an array of UID or ComponentInstance?
// // QUESTION: does the system provide a map from UID to ComponentInstance?
// type ListIncompleteComponents = (item: ItemInstance) => ItemInstance[];


///////////////////////////////////////////////////////////////////////////////
//
// ItemInstance
//
///////////////////////////////////////////////////////////////////////////////

export interface ItemInstance {
    pid: PID;
    quantity: number;
    modifications: ItemInstance[];
    substituteFor?: PID;
}

export interface Cart {
    items: ItemInstance[];
}

export interface State {
    cart: Cart;
    actions: Action[];
}

export class CartOps {
    private readonly catalog: Catalog;

    constructor(catalog: Catalog) {
        this.catalog = catalog;
    }

    updateCart(state: State, pid: PID, quantity: number): State {
        const cart = state.cart;
        let changed = false;
        const updated: ItemInstance[] = [];
        for (const item of cart.items) {
            if (changed) {
                // We've already edited an item. Just copy the remaining items.
                updated.push(item);
            }
            else {
                // Attempt to edit an item.
                const result = this.updateItem(item, pid, quantity);
                if (result.quantity !== 0) {
                    updated.push(result);
                }

                if (result !== item) {
                    changed = true;
                }
            }
        }

        // The update did not apply to anything already in the cart.
        // Attempt to add pid to cart as top-level, stand-alone item.
        if (!changed && this.catalog.isStandalone(pid)) {
            changed = true;
            updated.unshift({ pid, quantity, modifications: [] });
        }

        if (changed) {
            const actions = [ { type: OK }, ...state.actions ];
            return { cart: { ...cart, items: updated }, actions };
        }
        else {
            // TODO: report or log error here?
            console.log(`CartOps.updateCart(): no modifications for pid=${pid}.`);
            const actions = [{ type: CONFUSED }, ...state.actions];
            return { ...state, actions };
        }
    }

    private updateItem(item: ItemInstance, pid: PID, quantity: number): ItemInstance {
        if (pid === item.pid) {
            if (quantity === item.quantity) {
                return item;
            }
            else {
                // TODO: do we always want to update the quantity of an
                // existing item? How do we add a new item?
                // Think this is ok, because the convention is that items
                // with the same PID are always represented as a single line
                // with a quantity adjustment.
                return { ...item, quantity };
            }
        }
        else {
            let changed = false;
            const result = this.updateChildren(item, pid, quantity);
            if (result === item.modifications) {
                // No changes made so far.
                if (this.catalog.isComponentOf(pid, item.pid)) {
                    // TODO: handle adding n items that are choices of this item.
                    // Add correct number as choices. Then add remaining to top level.

                    const n = this.catalog.defaultQuantity(pid, item.pid);
                    if (n !== quantity) {
                        // TODO: how do we know whether to fill in substituteFor?
                        result.unshift({ pid, quantity, modifications: [] });
                    }
                    changed = true;
                }
            }
            else {
                changed = true;
            }

            if (changed) {
                return { ...item, modifications: result };
            }
            else {
                return item;
            }
        }
    }

    private updateChildren(parent: ItemInstance, pid: PID, quantity: number): ItemInstance[] {
        let changed = false;
        const updated: ItemInstance[] = [];

        // Attempt to find a child item that needs updating.
        for (const item of parent.modifications) {
            if (changed) {
                // We've already edited a child item, so just copy the
                // remaining ones.
                updated.push(item);
            }
            else {
                // Attempt to edit this child item.
                const result = this.updateItem(item, pid, quantity);
                if (result !== item) {
                    // If it was edited, determine whether is should remain on
                    // the child item list.
                    changed = true;
                    if (result.quantity > 0) {
                        const n = this.catalog.defaultQuantity(pid, parent.pid);
                        if (n !== result.quantity || result.modifications.length > 0) {
                            // Keep the item if it specifies a non-default quantity
                            // or has other modifications and a non-zero quantity.
                            updated.push(result);
                        }
                    }
                }
                else {
                    // If no edits were made, just copy the child item.
                    updated.push(item);
                }
            }
        }

        if (changed) {
            return updated;
        }
        else {
            return parent.modifications;
        }
    }

    // TODO: this should return a more structured type than a string.
    // Perhaps it should return an object with the parent PID and an
    // array of unmet choices.
    missingChoicesInCart(state: State): State {
        const missingChoices: ChoiceAction[] = [];
        for (const item of state.cart.items) {
            this.missingChoicesInItem(item, missingChoices);
        }

        if (missingChoices.length > 0) {
            return {...state, actions: [...missingChoices, ...state.actions]};
        }
        else {
            return state;
        }
        // else {
        //     return {...state, actions: [ { type: COMPLETE }, ...state.actions]};
        // }
    }

    private missingChoicesInItem(item: ItemInstance, missingChoices: ChoiceAction[]) {
        const d = this.catalog.get(item.pid);
        const choices = d.composition.choices;

        for (const choice of choices) {
            if (!intersect(choice.alternatives, item.modifications)) {
                missingChoices.push({
                    type:CHOICE,
                    item,
                    choice });
                // missingChoices.push(`>>> PROMPT: Select ${choice.className} for ${d.name}.`);
            }
        }

        for (const mod of item.modifications) {
            this.missingChoicesInItem(mod, missingChoices);
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    //
    // Generating Orders from the a Cart
    //
    ///////////////////////////////////////////////////////////////////////////   
    formatCart(cart: Cart): Order {
        const lines: LineItem[] = [];

        for (const item of cart.items) {
            this.formatItem(lines, item, 0, undefined);
        }

        lines.unshift({
            indent: 0,
            left: 'QTY',
            middle: 'ITEM',
            right: 'TOTAL'
        });

        let subtotal = 0;
        for (const line of lines) {
            if (line.price) {
                subtotal += line.price;
            }
        }
        lines.push({
            indent: 0,
            left: 'Subtotal',
            middle: '',
            price: subtotal
        });

        const taxRate = 0.09;
        // DESIGN NOTE: All prices are in lowest denomination units
        // (e.g. pennies in the US, nickels in Canada).
        const tax = Math.round(subtotal * taxRate);
        lines.push({
            indent: 0,
            left: '',
            middle: 'Tax',
            price: tax
        });

        const total = subtotal + tax;
        lines.push({
            indent: 0,
            left: 'Total',
            middle: '',
            price: total
        });

        return { lines };
    }

    private formatItem(order: LineItem[], item: ItemInstance, indent: number, parent: PID | undefined) {
        for (const mod of item.modifications) {
            this.formatItem(order, mod, indent + 1, item.pid);
        }

        const d = this.catalog.get(item.pid);

        let price: number | undefined = undefined;

        let left = '';
        let middle = '';
        if (parent === undefined) {
            left = item.quantity.toString();
            middle = d.name;
            price = item.quantity * d.price;
        }
        else {
            if (this.catalog.isNote(item.pid)) {
                middle = d.name;
            }
            else if (this.catalog.isChoiceOf(item.pid, parent)) {
                left = item.quantity.toString();
                middle = d.name;
                price = undefined;
            }
            else if (this.catalog.isDefaultOf(item.pid, parent)) {
                const info = this.catalog.getDefaultInfo(item.pid, parent) as ComponentDescription;
                const delta = item.quantity - info.defaultQuantity;

                if (delta > 0 && d.price !== undefined) {
                    price = delta * d.price;
                }

                if (item.quantity === 0) {
                    middle = `NO ${d.name}`;
                }
                else if (delta === 0) {
                    console.log('this should never happen');
                }
                else if (delta === 1) {
                    middle = `XTRA ${d.name}`;
                }
                else if (delta > 1) {
                    middle = `XTRA ${delta} ${d.name}`;
                }
                else if (delta === -1) {
                    middle = `LIGHT ${d.name}`;
                }
                else if (delta < -2) {
                    middle = `LIGHT ${-delta} ${d.name}`;
                }
            }
            else if (item.quantity === 0) {
                middle = `NO ${d.name}`;
            }
            else if (item.quantity === 1) {
                price = d.price;
                middle = `ADD ${d.name}`;
            }
            else {
                if (d.price !== undefined) {
                    price = item.quantity * d.price;
                }
                middle = `ADD ${item.quantity} ${d.name}`;
            }
        }

        order.unshift({ indent, left, middle, price });
    }

    cartToString(cart: Cart) {
        const order = this.formatCart(cart);
        return OrderOps.formatOrder(order);
    }

    // TODO: does this convenience method really belong here?
    printCart(cart: Cart) {
        console.log(this.cartToString(cart));
    }
}

function intersect(choices: PID[], items: ItemInstance[]): boolean {
    for (const item of items) {
        if (item.quantity > 0 && choices.includes(item.pid)) {
            return true;
        }
    }
    return false;
}

// BUG: adding second cheeseburger in cart_demo adds new line item.
// BUG: no price for adding 2 Cheddar Cheese Slice 5101
//   ISSUE was that options list price was not consulted. Used price for pid.
// BUG: 5100 is on hamburger - investigate
// TODO: merging two menu items when their modifications become identical - originally they were different.
// x TODO: pricing in pennies?
// x TODO: XTRA, LIGHT (see https://www.yelp.com/biz_photos/mcdonalds-los-angeles-50?select=2CRC1OC4ZyF8_94zxJqUNA)
//   (see also https://i.imgur.com/YpFyFW7.jpg, google for "mcdonalds receipt extra bacon"
// x TODO: sample app to replace junk.ts
// TODO: prices for everything in menu (including drinks)
// TODO: register tape name
// TODO: options with prices
// TODO: defaults with prices
// TODO: correct prices for order printing
// x TODO: ADD delta above default for order printing
// x TODO: menu item with choices
// x TODO: fields for order printing - numbers right justified in own fields.
// x TODO: subtotal, tax, total for cart formatting
// x TODO: add options to menu items (e.g. 7000 = well done)
// x TODO: format messages without ADD
// TODO: unit tests
//   add sub item that matches nothing
//   add top level item
//   remove top level item
//   add sub item that matches 1st top level
//   add sub item that matches 2nd top level
//   n copies of an item with m options that have a non-zero cost
// TODO: check for legal quantities/pids in add/remove
// TODO: detect missing choice - choice validator
// TODO: scenario: attempt to change quantity of choice item

// Choices
//   Price should be zero since choice is included
//   Quantity should be multiplied by parent quantity - when adding or dispaying?
//   Scenario: order two meals, then select two different drinks - what happens?
//     e.q "2 surf n turf with coke and sprite" or "2 surf n turf one with coke and the other with sprite"
//   One can choose "NO foobar" for a choice of foobar.
//   Scenario: order the surf n turf, then customize one sandwich.
//     Add a default quantity item with modifications

// Quantified item - standalone or choice. Could also be used for header if qty was text
//   indent qty name price
// QTY ITEM                     TOTAL
//   1 Cheeseburger              1.99
//       EXTRA Pickles
//       NO Onions
//       Well done
//   1 Surf N Turf               7.99
//     1 Small Coke
//         NO Ice
// Subtotal
//   Tax
// Total
//
// Mofication
//   indent mod [qty] name price
//     ADD 4 American Cheese     3.44
//     XTRA Ketchup
//     LIGHT Mayonnaise
//     NO pickles
//     SUB Swiss cheese
//
// Info - header, subtotal, tax, total
//   indent name price
// Subtotal
//   Tax
// Total