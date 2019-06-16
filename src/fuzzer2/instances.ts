
import { AID, Key, PID } from 'prix-fixe';

import { ATTRIBUTE, ENTITY, OPTION, WORD, QUANTITY } from '../unified';

///////////////////////////////////////////////////////////////////////////////
//
// Instances
//
///////////////////////////////////////////////////////////////////////////////
export interface Instance {
    type: symbol;
}

export interface AliasedInstance extends Instance {
    type: symbol;
    alias: string;
}

// export const MODIFIER: unique symbol = Symbol('MODIFIER');
// export type MODIFIER = typeof MODIFIER;

export const PRODUCT: unique symbol = Symbol('PRODUCT');
export type PRODUCT = typeof PRODUCT;

export interface AttributeInstance extends AliasedInstance {
    type: ATTRIBUTE;
    id: AID;
}

export function CreateAttributeInstance(id: PID, alias: string): AttributeInstance {
    return { type: ATTRIBUTE, id, alias };
}

export interface EntityInstance extends AliasedInstance {
    type: ENTITY;
    key: Key;

    quantity: Quantity;
}

export function CreateEntityInstance(key: Key, alias: string, quantity: Quantity): EntityInstance {
    return { type: ENTITY, key, alias, quantity };
}

// export interface ModifierInstance extends AliasedInstance {
//     type: MODIFIER;
//     id: PID;
// }

// export function CreateModifierInstance(id: PID, alias: string): ModifierInstance {
//     return { type: MODIFIER, id, alias };
// }

export interface Quantity {
    value: number;
    text: string;
}

export interface QuantityInstance extends AliasedInstance {
    type: QUANTITY;
    value: number;
}

export function CreateQuantityInstance(quantity: Quantity): QuantityInstance {
    return { type: QUANTITY, alias: quantity.text, value: quantity.value };
}

export interface OptionInstance extends AliasedInstance {
    type: OPTION;
    key: Key;

    quantity: Quantity;
}

export function CreateOptionInstance(key: Key, alias: string, quantity: Quantity): OptionInstance {
    return { type: OPTION, key, alias, quantity };
}

export interface WordInstance extends AliasedInstance {
    type: WORD;
}

export function CreateWordInstance(text: string): WordInstance {
    return { type: WORD, alias: text };
}

export interface ProductInstance extends Instance {
    type: PRODUCT;
    instances: BasicInstance[];
}

export function CreateProductInstance(instances: BasicInstance[]): ProductInstance {
    return { type: PRODUCT, instances };
}

export type BasicInstance = 
    AttributeInstance |
    EntityInstance |
    // ModifierInstance |
    OptionInstance |
    QuantityInstance |
    WordInstance;

export type WordOrProductInstance = WordInstance | ProductInstance;

export type AnyInstance = BasicInstance | ProductInstance;

export function formatInstanceDebug(instance: AnyInstance): string {
    switch (instance.type) {
        case ATTRIBUTE:
            return `ATTRIBUTE(${instance.alias},${instance.id})`;
        case ENTITY:
            if (instance.quantity.text.length > 0) {
                return `QUANTITY(${instance.quantity.text},${instance.quantity.value}) ENTITY(${instance.alias},${instance.key})`;
            }
            else {
                return `ENTITY(${instance.alias},${instance.key})`;
            }
        // case MODIFIER:
        //     return `MODIFIER(${instance.alias},${instance.id})`;
        case OPTION:
            if (instance.quantity.text.length > 0) {
                return `QUANTITY(${instance.quantity.text},${instance.quantity.value}) OPTION(${instance.alias},${instance.key})`;
            }
            else {
                return `OPTION(${instance.alias},${instance.key})`;
            }
        case PRODUCT:
            const product = instance.instances.map(formatInstanceDebug).join('');
            return `PRODUCT[${product}]`;
        case QUANTITY:
            return `QUANTITY(${instance.alias},${instance.value})`;
        case WORD:
            return `WORD(${instance.alias})`;
        default:
            return 'UNKNOWN';
    }
}

export function formatInstanceAsText(instance: AnyInstance): string {
    switch (instance.type) {
        case ATTRIBUTE:
        case ENTITY:
        // case MODIFIER:
        case QUANTITY:
        case WORD:
            return instance.alias;
        case OPTION:
            if (instance.quantity.text.length > 0) {
                return `${instance.quantity.text} ${instance.alias}`;
            }
            else {
                return instance.alias;
            }
        case PRODUCT:
            return instance.instances.map(formatInstanceAsText).join(' ');
        default:
            return 'UNKNOWN';
    }
}
