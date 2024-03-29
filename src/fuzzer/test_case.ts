import {
  GenericCase,
  ICatalog,
  ItemInstance,
  logicalCartFromCart,
  TestLineItem,
  TextTurn,
  ValidationStep,
} from 'prix-fixe';

import { StepX } from './fuzzer';

export type PostProcessor = (text: string) => string;

// TODO: perhaps createTestCase should be a class? (instead of side-effecting counter)
// let counter = 0;

export function createTestCase(
  catalog: ICatalog,
  steps: StepX[],
  seed: number,
  postProcessor: PostProcessor
): GenericCase<ValidationStep<TextTurn>> {
  const testSteps: Array<ValidationStep<TextTurn>> = [];

  let items: ItemInstance[] = [];
  for (const order of steps) {
    items = order.buildItems(items);
    const cart = logicalCartFromCart({ items }, catalog);

    const transcription = postProcessor(order.buildText().join(' '));
    const step: ValidationStep<TextTurn> = {
      turns: [
        {
          speaker: 'customer',
          transcription,
        },
      ],
      cart,
    };
    testSteps.push(step);
  }

  const testCase: GenericCase<ValidationStep<TextTurn>> = {
    id: seed, // counter++,
    suites: 'unverified',
    comment: 'synthetic',
    steps: testSteps,
  };

  return testCase;
}

// TODO: REVIEW: consider removing this dead code.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function appendItemLines(
  indent: number,
  item: ItemInstance,
  lines: TestLineItem[],
  catalog: ICatalog
) {
  lines.push({
    indent,
    quantity: item.quantity,
    key: item.key,
    name: catalog.getSpecific(item.key).name,
  });

  if (item.children.length > 0) {
    for (const child of item.children) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      appendItemLines(indent + 1, child, lines, catalog);
    }
  }
}
