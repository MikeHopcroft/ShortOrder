import pluralize from 'pluralize';

import { AliasGenerator } from './alias_generator';
import { OrderX, RemoveX, SegmentX, StepX, WordX } from './fuzzer';
import { OrderGenerator } from './order_generator';
import { ProductGenerator } from './product_generator';
import { Random } from './utilities';

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
    // Use one segment per OrderX to allow product removal to correspond to
    // OrderX removal.
    this.orderGenerator = new OrderGenerator(
      addPrologueGenerator,
      productGenerator,
      [1, 1],
      addEpilogueGenerator
    );

    this.maxItemCount = maxItemCount;
    this.removePrologues = removePrologues;
    this.removeEpilogues = removeEpilogues;
  }

  randomGenericEntityRemoval(random: Random): StepX[] {
    // First create a cart to remove something from.
    const before: OrderX[] = [];
    // const itemCount = random.randomInRange(1, this.maxItemCount + 1);
    const itemCount = 2;
    for (let i = 0; i < itemCount; ++i) {
      before.push(this.orderGenerator.randomOrder(random));
    }

    // Then select one item to remove.
    const target = random.randomChoice(before);

    // Figure out what remains in the cart after item removal.
    const after = before.filter((x) => x !== target);

    const prologue = this.removePrologues.randomAlias(random);

    const targetText: WordX = this.textFromGeneric(target);

    const epilogue = this.removeEpilogues.randomAlias(random);

    const remove = new RemoveX(prologue, targetText, epilogue, after);

    return [...before, remove];
  }

  private textFromGeneric(target: OrderX): WordX {
    for (const part of target.parts) {
      if (part instanceof SegmentX) {
        const text = pluralize(part.entity.text, part.quantity.value);
        return new WordX(text);
      }
    }

    const message = 'textFromGeneric: expect at least one SegmentX';
    throw TypeError(message);
  }
}
