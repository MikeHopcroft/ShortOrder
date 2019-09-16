import {
    ICatalog,
    ItemInstance,
    TestCase,
    TestLineItem, 
    TestOrder,
    TestStep
} from 'prix-fixe';

import {
    StepX
} from './fuzzer';

// TODO: perhaps createTestCase should be a class? (instead of side-effecting counter)
let counter = 0;

export function createTestCase(
    catalog: ICatalog,
    steps: StepX[]
): TestCase {
    const testSteps: TestStep[] = [];

    let items: ItemInstance[] = [];
    for (const order of steps) {
        const lines: TestLineItem[] = [];
        items = order.buildItems(items);
        for (const item of items) {
            appendItemLines(0, item, lines, catalog);
        }

        const step: TestStep = {
            rawSTT: order.buildText().join(' '),
            cart: lines
        };
        testSteps.push(step);
    }

    const testCase = new TestCase(
        counter++,
        ['unverified'],
        'synthetic',        // TODO: put info in comment?
        testSteps);

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
