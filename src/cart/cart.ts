// import { ItemDescription, PID, Catalog } from '../catalog';

// // TODO
// //   Finalize Catalog interfaces.
// //     Perhaps we want an interface for the ItemDescription, but a class for the catalog.
// //   Write Catalog yaml file.
// //   Write Catalog loader from JSON and YAML.

// // DESIGN INTENT: most objects are POJOs, instead of classes to allow for
// // serialization.

// ///////////////////////////////////////////////////////////////////////////////
// //
// // ItemInstance
// //
// ///////////////////////////////////////////////////////////////////////////////

// // globally unique identifier for item instances.
// // type UID = number;

// export enum ModificationType {
//     QUANTITY,
//     REMOVE,
//     SUBSTITUTE,
//     NOTE,
//     CHOICE,
//     CUSTOM
// }

// // Increase or decrease the quantity of a default or option item.
// // (e.g. no pickles, extra onions, triple cheese).
// export interface QuantityModification {
//     type: ModificationType.QUANTITY;

//     // QUESTION: The property below represents a delta to be applied to the
//     // previous value - should this, instead, be the just the final value?
//     // In the latter case, the order of the Modifications matters.
//     //
//     // NOTE: This data structure allows one to specify a delta that would
//     // result in an illegal quantity. Implementations should never allow this.
//     //
//     // NOTE: Delta can be negative.
//     //
//     // DESIGN_NOTE: We would probably disallow multiple quantity modifications
//     // of the same pid. An attempt to add another quantity modification would
//     // just fold its delta into the existing quantity modification for that
//     // pid.
//     quantity: number;

//     // The PID of the item whose quantity is being adjusted. This should 
//     // be either a default item or an optional item.
//     pid: PID;
// }

// export interface RemoveModification {
//     type: ModificationType.REMOVE;

//     // The PID of the item whose quantity being removed. This should 
//     // be either a default item or an optional item.
//     pid: PID;
// }

// // Substitute a quantity of one substitute item for all of another default item.
// // (e.g. give me two slices of Swiss instead of the American).
// export interface SubstitutionModification {
//     type: ModificationType.SUBSTITUTE;

//     // The quantity of items to substitute.
//     quantity: number;

//     // The new item.
//     pid: PID;

//     // The item to be replaced.
//     for: PID;
// }

// // Add a note to an item (e.g. on the side or cook well done).
// export interface NoteModification {
//     type: ModificationType.NOTE;

//     // PID of the note (e.g. on the side, well done)
//     pid: PID;
// }

// // Add a choice selection to an item (e.g. choose a Coke with no ice as a
// // drink in a Dakota Combo).
// export interface ChoiceModification {
//     type: ModificationType.CHOICE;

//     // PID of the choice class (e.g. DRINK, THEMED_CUP)
//     pid: PID;

//     // The choice is an ItemInstance, not a PID. The reason is that choices
//     // can sometimes be modified, in the case of DRINK in a combo (e.g. Coke
//     // with no ice, or a decaf coffee with two sugars and one cream.)
//     choice: ItemInstance;
// }

// // Customize one of the default or option items. (e.g. add pickles to the 
// // Dakota Burger in the Dakota Combo).
// export interface CustomModification {
//     type: ModificationType.CUSTOM;

//     // The choice is an ItemInstance, not a PID. The reason is that
//     // customizations are for items with default, option, substitute, and
//     // choice ingredients.
//     item: ItemInstance;
// }

// export type Modification =
//     QuantityModification |
//     RemoveModification |
//     SubstitutionModification |
//     NoteModification |
//     ChoiceModification |
//     CustomModification;


// export interface ItemInstance {
//     pid: PID;
//     quantity: number;
//     modifications: Modification[];
// }

// export interface Cart {
//     items: ItemInstance[];
// }


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


// //
// // Sample function implementations
// //
// export class CartOps {
//     static createItemInstance(description: ItemDescription, quantity: number): ItemInstance {
//         return {
//             pid: description.pid,
//             quantity,
//             modifications: []
//         };
//     }

//     static addItem(cart: Cart, item: ItemInstance): Cart {
//         // TODO: also try adding choice to item in cart.
//         return { items: [...cart.items, item] };
//     }

//     static removeItem(cart: Cart, predicate: (item: ItemInstance) => boolean): Cart {
//         // ISSUE: this removes all instances of item.
//         // TODO: also try removing choice from item in cart.
//         return { items: cart.items.filter(predicate) };
//     }

//     // TODO: consistent policy of indicating changes were made. Option to return undefined?
//     static tryModifyNewestMatchingItem(cart: Cart, modifier: (item: ItemInstance) => ItemInstance | undefined): Cart {
//         let changed = false;
//         const modifiedItems: ItemInstance[] = [];
//         const reversed = cart.items.slice().reverse();
//         for (const originalItem of reversed) {
//             if (changed) {
//                 // After changing one modification, copy all remaining
//                 // modifications, unchanged.
//                 modifiedItems.push(originalItem);
//             }
//             else {
//                 // Attempt to modify this item.
//                 const modifiedItem = modifier(originalItem);

//                 if (modifiedItem === originalItem) {
//                     // This item was not changed. Just copy it.
//                     modifiedItems.push(originalItem);
//                 }
//                 else {
//                     // We either changed or eliminated this item.
//                     changed = true;
//                     if (modifiedItem != null) {
//                         modifiedItems.push(modifiedItem);
//                     }
//                 }
//             }
//         }

//         if (changed) {
//             modifiedItems.reverse();
//             return { ...cart, items: modifiedItems };
//         }
//         else {
//             return cart;
//         }
//     }

//     static tryAddComponent(pid: PID, count: number, parent: ItemInstance, pd: ItemDescription): ItemInstance | undefined {
//         if (Catalog.IsDefaultOf(pid, pd) || Catalog.IsOptionOf(pid, pd)) {
//             return this.trySetQuantity(pid, count, parent, pd);
//         }

//         if (Catalog.IsChoiceOf(pid, pd)) {
//             return this.trySetChoice(pid, count, parent, pd);
//         }

//         // pid could not be added because it is not a default, option, or
//         // choice of parent.
//         return undefined;
//     }

//     static trySetQuantity(pid: PID, delta: number, parent: ItemInstance, pd: ItemDescription): ItemInstance | undefined {
//         let changed = false;
//         let updated = false;
//         const modifications: Modification[] = [];

//         for (const mod of parent.modifications) {
//             switch (mod.type) {
//                 case ModificationType.CUSTOM:
//                     // Only copy this modification for other pid values.
//                     if (pid !== mod.item.pid) {
//                         modifications.push(mod);
//                     }
//                     else {
//                         // Update the QUANTITY in the CUSTOM.
//                         updated = true;
//                         const item = { ...mod.item, quantity: delta};
//                         modifications.push({ ...mod, item });
//                     }
//                     break;
//                 case ModificationType.CHOICE:
//                     if (pid !== mod.choice.pid) {
//                         // Only copy this modification for other pid values.
//                         modifications.push(mod);
//                     }
//                     else {
//                         // Update the quantity in the CHOICE.
//                         updated = true;
//                         const choice = { ...mod.choice, quantity: delta};
//                         modifications.push({ ...mod, choice });
//                     }
//                     break;
//                 case ModificationType.NOTE:
//                     break;
//                 case ModificationType.QUANTITY:
//                 case ModificationType.SUBSTITUTE:
//                     if (pid !== mod.pid) {
//                         // Only copy these modification for other pid values.
//                         modifications.push(mod);
//                     }
//                     else {
//                         // Update the quantity in the QUANTITY or SUBSTITUTE.
//                         updated = true;
//                         modifications.push({ ...mod, quantity: delta });
//                     }
//                     break;
//                 case ModificationType.REMOVE:
//                     if (pid !== mod.pid) {
//                         // Only copy REMOVE modifications for other pid values.
//                         modifications.push(mod);
//                     }
//                     else {
//                         changed = true;
//                     }
//                 break;
//                 default:
//                     // Copy other modifications.
//                     modifications.push(mod);
//             }
//         }

//         if (!updated) {
//             if (Catalog.IsDefaultOf(pid, pd) || Catalog.IsOptionOf(pid, pd)) {
//                 modifications.push({ type: ModificationType.QUANTITY, pid, quantity: delta });
//             }
//             else if (Catalog.IsChoiceOf(pid, pd)) {
//                 const choice = CartOps.createItemInstance(pid, delta);
//                 modifications.push({ type: ModificationType.CHOICE, pid_of_class, choice });
//             }

//             // TODO: What about substitution, note?

//             changed = true;
//         }

//         if (changed) {
//             return { ...parent, modifications };
//         }
//         else {
//             return undefined;
//         }
//     }

//     static trySetChoice(pid: PID, delta: number, parent: ItemInstance, pd: ItemDescription): ItemInstance | undefined {
//         let changed = false;
//         const modifications: Modification[] = [];
//         for (const mod of parent.modifications) {
//             // Only retain modifications that are not removals.
//             if (mod.type !== ModificationType.CHOICE ||
//                 mod.pid !== pid ||
//                 mod.choice.quantity !== delta
//             ) {
//                 modifications.push(mod);
//             }
//             else {
//                 const choice = CartOps.createItemInstance(pid, delta);
//                 modifications.push({ type: ModificationType.CHOICE, pid, choice });
//                 changed = true;
//             }
//         }

//         if (changed) {
//             return { ...parent, modifications };
//         }
//         else {
//             return undefined;
//         }
//     }

//     // TODO: what about items that contradict each other?
//     //   Add medium-rare to an item that is well-done.
//     // TODO: handle CUSTOM modification.
//     static tryRemoveComponent(pid: PID, parent: ItemInstance, pd: ItemDescription): ItemInstance | null {
//         if (pid === parent.pid) {
//             // Remove the entire item.
//             return null;
//         }
//         else {
//             // Otherwise, try to remove a component of the item.
//             // Filter out additions, substitutions, choices, notes, etc. for this PID.
//             let hasRemove = false;
//             const modifications: Modification[] = [];
//             for (const mod of parent.modifications) {
//                 switch (mod.type) {
//                     case ModificationType.CUSTOM:
//                         // Only copy this modification for other pid values.
//                         if (pid !== mod.item.pid) {
//                             modifications.push(mod);
//                         }
//                         break;
//                     case ModificationType.CHOICE:
//                         // Only copy this modification for other pid values.
//                         if (pid !== mod.choice.pid) {
//                             modifications.push(mod);
//                         }
//                         break;
//                     case ModificationType.NOTE:
//                     case ModificationType.QUANTITY:
//                     case ModificationType.SUBSTITUTE:
//                         // Only copy these modification for other pid values.
//                         if (pid !== mod.pid) {
//                             modifications.push(mod);
//                         }
//                         break;
//                     case ModificationType.REMOVE:
//                         modifications.push(mod);
//                         if (pid !== mod.pid) {
//                             hasRemove = true;
//                         }
//                     break;
//                     default:
//                         // Copy other modifications.
//                         modifications.push(mod);
//                 }
//             }

//             let changed = (modifications.length !== parent.modifications.length));

//             // If this PID is a default and there is not already a remove, remove.
//             if (Catalog.IsDefaultOf(pid, pd) && !hasRemove) {
//                 // If the PID represents a default, add a REMOVE if there 
//                 // isn't one already there.
//                 modifications.push({ type: ModificationType.REMOVE, pid });
//                 changed = true;
//             }

//             if (changed) {
//                 return { ...parent, modifications };
//             }
//             else {
//                 return parent;
//             }
//         }
//     }

//     static traverse(cart: Cart, f: (item: ItemInstance) => ItemInstance | null) {
//         let changed = false;
//         const items: ItemInstance[] = [];

//         for (const item of cart.items) {
//             let result: ItemInstance | null = item;

//             if (changed) {
//                 // We've already changed an item, so just copy this one.
//                 items.push(result);
//             }
//             else {
//                 // We haven't yet changed an item, so attempt to change this
//                 // one. First try to change one of this item's choices.
//                 result = CartOps.traverseChoices(item, f);

//                 if (result === item) {
//                     // If none of the item's choices were changed,
//                     // attempt to change the item itself.
//                     result = f(item);
//                 }

//                 if (result !== null) {
//                     items.push(result);
//                 }

//                 if (result !== item) {
//                     changed = true;
//                 }
//             }
//         }

//         if (changed) {
//             return { items };
//         }
//         else {
//             return cart;
//         }

//     }

//     static traverseChoices(
//         item: ItemInstance,
//         f: (item: ItemInstance) => ItemInstance | null
//     ): ItemInstance {
//         let changed = false;
//         const modifications: Modification[] = [];

//         for (const mod of item.modifications) {
//             if (mod.type !== ModificationType.CHOICE || changed) {
//                 // If this isn't a CHOICE or we've already changed a
//                 // modification, just copy unchanged.
//                 modifications.push(mod);
//             }
//             else {
//                 // Otherwise, attempt to change this choice.
//                 const choice = f(mod.choice);

//                 if (choice === mod.choice) {
//                     // No changes. Just copy.
//                     modifications.push(mod);
//                 }
//                 else {
//                     // We changed this choice.
//                     // Copy the choice if it wasn't removed.
//                     changed = true;
//                     if (choice !== null) {
//                         modifications.push({ ...mod, choice });
//                     }
//                 }
//             }
//         }

//         if (changed) {
//             return { ...item, modifications };
//         }
//         else {
//             return item;
//         }
//     }
// }


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

