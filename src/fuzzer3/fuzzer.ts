import * as pluralize from 'pluralize';
import { AID, CartOps, CID, ICatalog, ItemInstance, Key } from 'prix-fixe';

import { permutation, Random } from './utilities';

export const LEFT: unique symbol = Symbol('LEFT');
export type LEFT = typeof LEFT;

export const RIGHT: unique symbol = Symbol('RIGHT');
export type RIGHT = typeof RIGHT;

export const EITHER: unique symbol = Symbol('EITHER');
export type EITHER = typeof EITHER;

export type Position = LEFT | RIGHT | EITHER;

export class QuantityX {
    value: number;
    text: string;
    position: Position;

    constructor(value: number, text: string, position: Position) {
        this.value = value;
        this.text = text;
        this.position = position;
    }
}

export interface ModifierX {
    text: string;
    position: Position;

    buildItem(): ItemInstance | null;
    isOption(): boolean;
}
 
export class AttributeX implements ModifierX {
    aid: AID;
    text: string;
    position: Position;

    constructor(aid: AID, text: string, position: Position) {
        this.aid = aid;
        this.text = text;
        this.position = position;
    }

    buildItem(): null {
        return null;
    }

    isOption(): boolean {
        return false;
    }
}

export interface OptionX extends ModifierX {
}

export class QuantifiedOptionX implements OptionX {
    quantity: QuantityX;
    key: Key;
    text: string;
    position: Position;

    constructor(quantity: QuantityX, key: Key, text: string) {
        this.quantity = quantity;
        this.key = key;

        if (quantity.text === 'a' && startsWithEnglishVowel(text)) {
            this.text = `an ${text}`;
        } else {
            this.text = `${quantity.text} ${text}`;
        }

        this.position = quantity.position;
    }

    buildItem(): ItemInstance {
        return {
            uid: 0,
            quantity: this.quantity.value,
            key: this.key,
            children: []
        };
    }

    isOption(): boolean {
        return true;
    }
}

export class AttributedOptionX implements OptionX {
    attribute: AttributeX;
    key: Key;
    text: string;
    position: Position;

    constructor(attribute: AttributeX, key: Key, text: string) {
        this.attribute = attribute;
        this.key = key;
        this.text = `${attribute.text} ${text}`;
        this.position = EITHER;
    }

    buildItem(): ItemInstance {
        return {
            uid: 0,
            quantity: 1,
            key: this.key,
            children: []
        };
    }

    isOption(): boolean {
        return true;
    }
}

export class EntityX {
    quantity: QuantityX;
    attributes: AttributeX[];
    options: OptionX[];
    key: Key;
    text: string;

    constructor(
        quantity: QuantityX,
        attributes: AttributeX[],
        options: OptionX[],
        key: Key,
        text: string
    ) {
        this.quantity = quantity;
        this.attributes = attributes;
        this.options = options;
        this.key = key;
        this.text = pluralize(text, quantity.value);
    }

    randomSegment(random: Random): SegmentX {
        const left: ModifierX[] = [];
        const right: ModifierX[] = [];

        for (const attribute of this.attributes) {
            if (attribute.position === LEFT) {
                left.push(attribute);
            } else if (attribute.position === RIGHT) {
                right.push(attribute);
            } else if (random.randomBoolean()) {
                left.push(attribute);
            } else {
                right.push(attribute);
            }
        }

        for (const option of this.options) {
            if (option.position === LEFT) {
                left.push(option);
            } else if (option.position === RIGHT) {
                right.push(option);
            } else if (random.randomBoolean()) {
                left.push(option);
            } else {
                right.push(option);
            }
        }

        const permutedLeft =
            permutation<ModifierX>(left, random.randomInRange(0, left.length));
        const permutedRight =
            permutation<ModifierX>(right, random.randomInRange(0, right.length));

        return new SegmentX(this.quantity, permutedLeft, this, permutedRight);
    }
}

export class SegmentX {
    quantity: QuantityX;
    left: ModifierX[];
    entity: EntityX;
    right: ModifierX[];

    constructor(
        quantity: QuantityX,
        left: ModifierX[],
        entity: EntityX,
        right: ModifierX[]
    ) {
        this.quantity = quantity;
        this.left = left;
        this.entity = entity;
        this.right = right;
    }

    buildText(): string[] {
        const words: string[] = [];

        // Leading quantifier.
        words.push(this.quantity.text);

        // Left modifiers don't have seperators.
        for (const modifier of this.left) {
            words.push(modifier.text);
        }

        words.push(this.entity.text);

        // First right modifiers are prefaced by 'with'.
        // Last right modifier in a sequence of two or more is preceded by 'and'.
        let beforeWith = true;
        for (const [index, modifier] of this.right.entries()) {
            if (beforeWith && 
                modifier.isOption()
            ) {
                beforeWith = false;
                words.push('with');
            }
            else if (
                index === this.right.length - 1 &&
                modifier.isOption()
            ) {
                words.push('and');
            }
            words.push(modifier.text);
        }

        if (words.length >= 2 && words[0] === 'a' && startsWithEnglishVowel(words[1])) {
            words[0] = 'an';
        }

        return words;
    }

    buildItem(cartOps: CartOps): ItemInstance {
        const children: ItemInstance[] = [];
        for (const modifier of this.left) {
            const item = modifier.buildItem();
            if (item !== null) {
                children.push(item);
            }
        }

        const aids: AID[] = this.entity.attributes.map(x => x.aid);

        return {
            uid: 0,
            quantity: this.quantity.value,
            key: this.entity.key,
            children
        };
    }
}

interface WordX {
    text: string;
}

function startsWithEnglishVowel(text: string): boolean {
    return (
        text.length > 0 &&
        ['a', 'e', 'i', 'o', 'u'].indexOf(text[0].toLowerCase()) !== -1
    );
}


// class RandomOption {
//     constructor(categories: CID[], catalog: ICatalog) {
//     }
// }
