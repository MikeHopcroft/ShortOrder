import * as pluralize from 'pluralize';
import { AID, ItemInstance, Key } from 'prix-fixe';

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

    constructor(value: number, text: string) {
        this.value = value;
        this.text = text;
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

    constructor(quantity: QuantityX, key: Key, text: string, position: Position) {
        this.quantity = quantity;
        this.key = key;

        if (quantity.text === 'a' && startsWithEnglishVowel(text)) {
            this.text = `an ${text}`;
        } else if (quantity.text.length > 0) {
            this.text = `${quantity.text} ${text}`;
        } else {
            this.text = text;
        }


        this.position = position;
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
    key: Key;
    text: string;
    position: Position;

    constructor(attributes: AttributeX[], key: Key, text: string, position: Position) {
        this.key = key;

        // TODO: HACK: BUGBUG.
        // This class is designed to have zero or one attributes,
        // but API allows arbitrary number.
        // Should either change the API to allow zero or one (e.g AttributeX?)
        // or change the functionality, below, to support multiple attributes.
        // TODO: HACK: BUGBUG. Remove special handling for 'modifier' and 'quantity'
        // if (attributes.length > 0 && attributes[0].text !== 'modifier' && attributes[0].text !== 'quantity') {
        if (attributes.length > 0) {
            this.text = `${attributes[0].text} ${text}`;
        } else {
            this.text = text;
        }
        this.position = position;
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
    key: Key;
    text: string;

    constructor(
        quantity: QuantityX,
        attributes: AttributeX[],
        key: Key,
        text: string
    ) {
        this.quantity = quantity;
        this.attributes = attributes;
        this.key = key;
        this.text = pluralize(text, quantity.value);
    }
}

export class ProductX {
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
    entity: ProductX;
    right: ModifierX[];

    constructor(
        quantity: QuantityX,
        left: ModifierX[],
        entity: ProductX,
        right: ModifierX[]
    ) {
        this.quantity = quantity;
        this.left = left;
        this.entity = entity;
        this.right = right;
    }

    buildText = ():string[] => {
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
                // TODO: use instanceof
                modifier.isOption()
            ) {
                beforeWith = false;
                words.push('with');
            }
            else if (
                index === this.right.length - 1 &&
                // TODO: use instanceOf
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

    buildItem(): ItemInstance {
        const children: ItemInstance[] = [];
        for (const modifier of this.left) {
            const item = modifier.buildItem();
            if (item !== null) {
                children.push(item);
            }
        }
        for (const modifier of this.right) {
            const item = modifier.buildItem();
            if (item !== null) {
                children.push(item);
            }
        }

        return {
            uid: 0,
            quantity: this.quantity.value,
            key: this.entity.key,
            children
        };
    }
}

export class WordX {
    text: string;

    constructor(text: string) {
        this.text = text;
    }

    buildText = ():string[] => [this.text];
}

export interface StepX {
    buildText():string[];
    buildItems(): ItemInstance[];
}

export class OrderX implements StepX {
    parts: Array<SegmentX | WordX> = [];

    constructor(
        prologue: WordX,
        segments: SegmentX[],
        epilogue: WordX,
    ) {
        this.parts.push(prologue);

        for (const [index, segment] of segments.entries()) {
            if (segments.length > 1 && index === segments.length - 1) {
                this.parts.push(new WordX('and'));
            }
            this.parts.push(segment);
        }

        this.parts.push(epilogue);
    }

    buildText = ():string[] => {
        const words: string[] = [];
        for (const part of this.parts) {
            for (const word of part.buildText()) {
                // // TODO: HACK: BUGBUG: remove this hack!!!
                // if (word.indexOf('modifier') !== -1 || word.startsWith('quantity')) {
                //     // continue;
                //     words.push(word.toUpperCase());
                //     continue;
                // }

                if (word.length > 0) {
                    words.push(word);
                }
            }
        }
        return words;
    }

    buildItems(): ItemInstance[] {
        const items: ItemInstance[] = [];
        for (const part of this.parts) {
            if (part instanceof SegmentX) {
                items.push(part.buildItem());
            }
        }
        return items;
    }
}

export class RemoveX implements StepX {
    prologue: WordX;
    // before: OrderX[];
    target: WordX;
    epilogue: WordX;

    after: OrderX[];

    constructor(
        prologue: WordX,
        // before: OrderX[],
        remove: WordX,
        epilogue: WordX,
        after: OrderX[],
    ) {
        this.prologue = prologue;
        // this.before = before;
        this.target = remove;
        this.epilogue = epilogue;
        this.after = after;
    }

    buildText = (): string[] => {
        const parts = [
            // ...this.before,
            this.prologue,
            this.target,
            // ...this.after,
            this.epilogue
        ];

        const words: string[] = [];
        for (const part of parts) {
            for (const word of part.buildText()) {
                if (word.length > 0) {
                    words.push(word);
                }
            }
        }
        return words;
    }

    buildItems(): ItemInstance[] {
        const items: ItemInstance[] = [];
        for (const part of this.after) {
            items.concat(part.buildItems());
        }
        return items;
    }
}

function startsWithEnglishVowel(text: string): boolean {
    return (
        text.length > 0 &&
        ['a', 'e', 'i', 'o', 'u'].indexOf(text[0].toLowerCase()) !== -1
    );
}
