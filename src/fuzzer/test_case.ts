import {
    GenericCase,
    ICatalog,
    ItemInstance,
    logicalCartFromCart,
    TestCase,
    TestLineItem, 
    TestOrder,
    TestStep,
    TextTurn,
    ValidationStep,
} from 'prix-fixe';

import {
    StepX
} from './fuzzer';

// TODO: perhaps createTestCase should be a class? (instead of side-effecting counter)
let counter = 0;

export function createTestCase(
    catalog: ICatalog,
    steps: StepX[]
): GenericCase<ValidationStep<TextTurn>> {
    const testSteps: Array<ValidationStep<TextTurn>> = [];

    let items: ItemInstance[] = [];
    for (const order of steps) {
        items = order.buildItems(items);
        const cart = logicalCartFromCart({ items }, catalog);

        const step: ValidationStep<TextTurn> = {
            turns: [
                {
                    speaker: 'customer',
                    transcription: order.buildText().join(' '),
                }
            ],
            cart,
        };
        testSteps.push(step);
    }

    const testCase: GenericCase<ValidationStep<TextTurn>> = {
        id: counter++,
        suites: 'unverified',
        comment: 'synthetic',
        steps: testSteps
    };

    return testCase;
}

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
        name: catalog.getSpecific(item.key).name
    });

    if (item.children.length > 0) {
        for (const child of item.children) {
            appendItemLines(indent + 1, child, lines, catalog);
        }
    }
}
