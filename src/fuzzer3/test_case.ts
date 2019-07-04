import {
    ICatalog,
    ItemInstance,
    TestCase,
    TestLineItem, 
    TestOrder
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
    const inputs: string[] = [];
    const results: TestOrder[] = [];

    for (const order of steps) {
        const lines: TestLineItem[] = [];
        const items = order.buildItems();
        for (const item of items) {
            appendItemLines(0, item, lines, catalog);
        }

        inputs.push(order.buildText().join(' '));
        results.push({lines});
    }

    const testCase = new TestCase(
        counter++,
        '1',
        ['unverified'],
        'synthetic',        // TODO: put info in comment?
        inputs,
        results);

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
