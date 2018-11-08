import { ItemDescription, PID, Catalog } from '../catalog';

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

    // isComponentOf(pid: PID, item: ItemInstance): boolean {
    //     const description = this.catalog.get(item.pid);
    //     return Catalog.IsComponentOf(pid, description);
    // }

    // isDefaultOf(pid: PID, item: ItemInstance): boolean {
    //     const description = this.catalog.get(item.pid);
    //     return Catalog.IsDefaultOf(pid, description);
    // }

    // defaultQuantity(pid: PID, item: ItemInstance): number {
    //     const description = this.catalog.get(pid);
    //     return Catalog.defaultQuantity(pid, description);
    // }

    // isStandalone(pid: PID): boolean {
    //     const description = this.catalog.get(pid);
    //     return Catalog.isStandalone(description);
    // }

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
                updated.push(result);

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
        else {
            // TODO: report or log error here?
            console.log(`CartOps.updateCart(): no modifications for pid=${pid}.`)
        }

        if (changed) {
            return { ...cart, items: updated };
        }
        else {
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
                        result.push({pid, quantity, modifications:[]});
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
}