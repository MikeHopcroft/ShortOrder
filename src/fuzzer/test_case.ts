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
    const inputs: string[] = [];
    const results: TestOrder[] = [];

    let items: ItemInstance[] = [];
    for (const order of steps) {
        const lines: TestLineItem[] = [];
        items = order.buildItems(items);
        for (const item of items) {
            appendItemLines(0, item, lines, catalog);
        }

        inputs.push(order.buildText().join(' '));
        // TODO: Review this fix.
        results.push({cart: lines});
        // results.push({lines});
    }

    // TODO: review this fix.
    const s2: TestStep[] = [];
    for (const [i, observed] of results.entries()) {
        s2.push({
            rawSTT: inputs[i],
            cart: observed.cart
        });
    }

    const testCase = new TestCase(
        counter++,
        // '1',
        ['unverified'],
        'synthetic',        // TODO: put info in comment?
        s2,
    );

    // const testCase = new TestCase(
    //     counter++,
    //     '1',
    //     ['unverified'],
    //     'synthetic',        // TODO: put info in comment?
    //     inputs,
    //     results);

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
