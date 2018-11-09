import { LineItem, Order, OrderOps, PID, Catalog } from '..';


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

export class CartOps {
    catalog: Catalog;

    constructor(catalog: Catalog) {
        this.catalog = catalog;
    }

    updateCart(cart: Cart, pid: PID, quantity: number): Cart {
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
            updated.unshift({ pid, quantity, modifications:[] });
        }

        if (changed) {
            return { ...cart, items: updated };
        }
        else {
            // TODO: report or log error here?
            console.log(`CartOps.updateCart(): no modifications for pid=${pid}.`);
            return cart;
        }
    }

    updateItem(item: ItemInstance, pid: PID, quantity: number ): ItemInstance {
        if (pid === item.pid) {
            if (quantity === item.quantity) {
                return item;
            }
            else {
                return { ...item, quantity };
            }
        }
        else {
            let changed = false;
            const result = this.updateChildren(item, pid, quantity);
            if (result === item.modifications) {
                // No changes made so far.
                if (this.catalog.isComponentOf(pid, item.pid))
                {
                    const n = this.catalog.defaultQuantity(pid, item.pid);
                    if (n !== quantity) {
                        // TODO: how do we know whether to fill in substituteFor?
                        result.unshift({pid, quantity, modifications:[]});
                    }
                    changed = true;
                }
            }

            if (changed) {
                return { ...item, modifications: result };
            }
            else {
                return item;
            }
        }
    }

    updateChildren(parent: ItemInstance, pid: PID, quantity: number ): ItemInstance[] {
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
                    const n = this.catalog.defaultQuantity(pid, parent.pid);
                    if (n !== result.quantity || 
                        (result.quantity > 0 && result.modifications.length > 0)) {
                        // Keep the item if it specifies a non-default quantity
                        // or has other modifications and a non-zero quantity.
                        updated.push(result);
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

    formatCart(cart: Cart): Order {
        const lines: LineItem[] = [];

        for (const item of cart.items) {
            this.formatItem(lines, item, 0);
        }

        let subtotal = 0;
        for (const line of lines) {
            if (line.price) {
                subtotal += line.price;
            }
        }
        lines.push({
            indent: 0,
            price: subtotal,
            product: 'Subtotal',
            quantity: 1
        });

        const taxRate = 0.09;
        // DESIGN NOTE: All prices are in lowest denomination units
        // (e.g. pennies in the US, nickels in Canada).
        const tax = Math.round(subtotal * taxRate);
        lines.push({
            indent: 1,
            price: tax,
            product: 'Tax',
            quantity: 1
        });

        const total = subtotal + tax;
        lines.push({
            indent: 0,
            price: total,
            product: 'Total',
            quantity: 1
        });

        return { lines };
    }

    formatItem(order: LineItem[], item: ItemInstance, level: number) {
        for (const mod of item.modifications) {
            this.formatItem(order, mod, level + 1);
        }

        const d = this.catalog.get(item.pid);

        const product = d.name;
        const quantity = item.quantity;
        const indent = level;
        const price = d.price * quantity;

        let operation = undefined;
        if (!this.catalog.isStandalone(item.pid)) {
            // TODO: CHOICE
            // TODO: ADD quantity
            // TODO: Add excess quantity (over default)
            // TODO: only charge for excess above default
            if (this.catalog.isNote(item.pid)) {
                operation = 'NOTE';
            }
            else if (quantity === 0) {
                operation = 'NO';
            }
            else if (quantity === 1) {
                operation = 'ADD';
            }
            else {
                operation = `ADD ${quantity}`;
            }
        }

        order.unshift({ indent, operation, price, product, quantity });
    }

    // TODO: does this convenience method really belong here?
    printCart(cart: Cart) {
        const order = this.formatCart(cart);
        const text = OrderOps.formatOrder(order);
        console.log(text);
    }
}

// TODO: pricing in pennies?
// TODO: prices for everything in menu (including drinks)
// TODO: register tape name
// TODO: options with prices
// TODO: defaults with prices
// TODO: correct prices for order printing
// TODO: ADD delta above default for order printing
// TODO: menu item with choices
// TODO: fields for order printing
// TODO: subtotal, tax, total for cart formatting
// TODO: add options to menu items (e.g. 7000 = well done)
// x TODO: format messages without ADD
// TODO: unit tests
//   add sub item that matches nothing
//   add top level item
//   remove top level item
//   add sub item that matches 1st top level
//   add sub item that matches 2nd top level
// TODO: check for legal quantities/pids in add/remove