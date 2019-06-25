import * as pluralize from 'pluralize';

import { ICatalog, ItemInstance } from 'prix-fixe';

import { AliasGenerator } from './alias_generator';
import { OrderX, WordX, SegmentX } from './fuzzer';
import { OrderGenerator } from './order_generator';
import { ProductGenerator } from './product_generator';
import { Random } from './utilities';

export class RemoveX {
    prologue: WordX;
    before: OrderX[];
    remove: WordX;
    epilogue: WordX;

    after: OrderX[];

    constructor(
        prologue: WordX,
        before: OrderX[],
        remove: WordX,
        epilogue: WordX,
        after: OrderX[],
    ) {
        this.prologue = prologue;
        this.before = before;
        this.remove = remove;
        this.after = after;
        this.epilogue = epilogue;
    }

    buildText = (): string[] => {
        const parts = [
            this.prologue,
            ...this.before,
            this.remove,
            ...this.after,
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

export class RemovalGenerator {
    // catalog: ICatalog;

    private readonly orderGenerator: OrderGenerator;
    private readonly maxItemCount: number;

    removePrologues: AliasGenerator;
    removeEpilogues: AliasGenerator;


    constructor(
        // catalog: ICatalog,
        addPrologueGenerator: AliasGenerator,
        productGenerator: ProductGenerator,
        addEpilogueGenerator: AliasGenerator,
        maxItemCount: number,
        removePrologues: AliasGenerator,
        removeEpilogues: AliasGenerator
    ) {
        // this.catalog = catalog;

        this.orderGenerator = new OrderGenerator(
            addPrologueGenerator,
            productGenerator,
            1,
            addEpilogueGenerator
        );

        this.maxItemCount = maxItemCount;
        this.removePrologues = removePrologues;
        this.removeEpilogues = removeEpilogues;
    }

    randomGenericEntityRemoval(random: Random): RemoveX {
        // First create a cart to remove something from.
        const before: OrderX[] = [];
        const itemCount = random.randomInRange(1, this.maxItemCount + 1);
        for (let i = 0; i < itemCount; ++i) {
            before.push(this.orderGenerator.randomOrder(random));
        }

        // Then select one item to remove.
        const target = random.randomChoice(before);

        // Figure out what remains in the cart after item removal.
        const after = before.filter(x => x !== target);

        const prologue = this.removePrologues.randomAlias(random);

        const remove: WordX = this.textFromGeneric(target);

        const epilogue = this.removeEpilogues.randomAlias(random);

        return new RemoveX(
            prologue,
            before,
            remove,
            epilogue,
            after
        );
    }

    private textFromGeneric(target: OrderX): WordX {
        const segment = target.parts[1] as SegmentX;
        const text = pluralize(segment.entity.text, segment.quantity.value);
        return new WordX(text);
    }
}