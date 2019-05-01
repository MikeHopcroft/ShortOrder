// OPEN ISSUES & DESIGN PRINCIPLES
//   Optional elements (vs array of 0)
//   Deltas vs overrides
//   Fully normalized vs partial static denormalization vs cached denormalizations
//      e.g. canonical name, cash register tape description, pricing

// TODO: ItemDescription to menu.ts or catalog.ts. ItemInstance should go to cart.ts.

///////////////////////////////////////////////////////////////////////////////
//
// itemDescription
//
///////////////////////////////////////////////////////////////////////////////

// product ID
// unique across top-level menu items, choices, and ingredients.
// TODO: rationalize this with PID type from token-flow.
// export type PID = number;
import { PID } from 'token-flow';

export interface ComponentDescription {
    pid: PID;
    defaultQuantity: number;    // default quantity
    minQuantity: number;        // minimum legal quantity
    maxQuantity: number;        // maximum legal quantity

    // DESIGN NOTE: consider making price reprent pennies or smallest
    // non-divisible unit of money to avoid precision issues in Javascript
    // floating point representation.
    price: number;              // Price for each above default quantity.
}

export interface ChoiceDescription {
    // friendly name for the class of items this choice selected.
    // e.g. drink
    pid: PID;
    className: string;

    // DESIGN NOTE: should we include all of the alternatives here or just have
    // that be part of the class definition?
    alternatives: PID[];
}

export interface SubstitutionDescription {
    canReplace: PID;
    replaceWith: PID;
    price: number;              // Price for this substitution.
}

export interface IndexableItem {
    pid: PID;
    name: string;
    aliases: string[];
}

export interface IndexableItemCollection {
    items: IndexableItem[];
}

// note; ItemDescription shouldn't be a kitchensink of properties
export interface ItemDescription extends IndexableItem {
    pid: PID;
    name: string;
    aliases: string[];
    price: number;
    standalone: boolean;
    note?: boolean;
    matrix?: PID;
    key?: string;
    isOption?: boolean;
    isQuantifiable?: boolean;
    composition: {
        defaults: ComponentDescription[];
        choices: ChoiceDescription[];
        substitutions: SubstitutionDescription[];
        options: ComponentDescription[];
    };
}

export interface CatalogItems {
    items: ItemDescription[];
}
