
import { PID } from 'token-flow';

import { ATTRIBUTE, ENTITY, OPTION, WORD, QUANTITY } from '../unified';

///////////////////////////////////////////////////////////////////////////////
//
// Instances
//
///////////////////////////////////////////////////////////////////////////////
export interface Instance {
    type: symbol;
    alias: string;
}

export const MODIFIER: unique symbol = Symbol('MODIFIER');
export type MODIFIER = typeof MODIFIER;

export interface AttributeInstance extends Instance {
    type: ATTRIBUTE;
    id: PID;
}

export function CreateAttributeInstance(id: PID, alias: string): AttributeInstance {
    return { type: ATTRIBUTE, id, alias };
}

export interface EntityInstance extends Instance {
    type: ENTITY;
    id: PID;

    quantity: Quantity;
}

export function CreateEntityInstance(id: PID, alias: string, quantity: Quantity): EntityInstance {
    return { type: ENTITY, id, alias, quantity };
}

export interface ModifierInstance extends Instance {
    type: MODIFIER;
    id: PID;
}

export function CreateModifierInstance(id: PID, alias: string): ModifierInstance {
    return { type: MODIFIER, id, alias };
}

export interface Quantity {
    value: number;
    text: string;
}

export interface QuantityInstance extends Instance {
    type: QUANTITY;
    value: number;
}

export function CreateQuantityInstance(quantity: Quantity): QuantityInstance {
    return { type: QUANTITY, alias: quantity.text, value: quantity.value };
}

export interface OptionInstance extends Instance {
    type: OPTION;
    id: PID;

    quantity: Quantity;
}

export function CreateOptionInstance(pid: PID, alias: string, quantity: Quantity): OptionInstance {
    return { type: OPTION, id: pid, alias, quantity };
}

export interface WordInstance extends Instance {
    type: WORD;
}

export function CreateWordInstance(text: string): WordInstance {
    return { type: WORD, alias: text };
}

export type  AnyInstance = 
    AttributeInstance |
    EntityInstance |
    ModifierInstance |
    OptionInstance |
    QuantityInstance |
    WordInstance;

export function formatInstanceDebug(instance: AnyInstance): string {
    switch (instance.type) {
        case ATTRIBUTE:
            return `ATTRIBUTE(${instance.alias},${instance.id})`;
        case ENTITY:
            if (instance.quantity.text.length > 0) {
                return `QUANTITY(${instance.quantity.text},${instance.quantity.value}) ENTITY(${instance.alias},${instance.id})`;
            }
            else {
                return `ENTITY(${instance.alias},${instance.id})`;
            }
        case MODIFIER:
            return `MODIFIER(${instance.alias},${instance.id})`;
        case OPTION:
            if (instance.quantity.text.length > 0) {
                return `QUANTITY(${instance.quantity.text},${instance.quantity.value}) OPTION(${instance.alias},${instance.id})`;
            }
            else {
                return `OPTION(${instance.alias},${instance.id})`;
            }
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
        case MODIFIER:
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
        default:
            return 'UNKNOWN';
    }
}
