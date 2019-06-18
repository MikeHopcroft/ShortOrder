import {
    AttributeInfo,
    ICatalog,
    ItemInstance,
    TestCase,
    TestLineItem, 
    TestOrder
} from 'prix-fixe';

import { OrderX } from './fuzzer';

// TODO: perhaps createTestCase should be a class? (instead of side-effecting counter)
let counter = 0;

export function createTestCase(
    catalog: ICatalog,
    order: OrderX
): TestCase {
    const lines: TestLineItem[] = [];
    const items = order.buildItems();
    for (const item of items) {
        appendItemLines(0, item, lines, catalog);
    }

    const testOrder: TestOrder = {
        lines
    };

    const testCase = new TestCase(
        counter++,
        '1',
        ['unverified'],
        'synthetic',        // TODO: put info in comment?
        [order.buildText().join(' ')],
        [testOrder]);

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

function formatLine(prefix: string, line: TestLineItem) {
    return `${prefix} / ${line.indent}:${line.quantity}:${line.name}:${line.key}`;
}

function canonicalize(order: TestOrder): string[] {
    let topLevelCounter = 0;
    let lastTopLevel = '';
    const canonical: string[] = [];

    for (const line of order.lines) {
        if (line.indent === 0) {
            lastTopLevel = formatLine(String(topLevelCounter), line);
            ++topLevelCounter;
            canonical.push(lastTopLevel);
        }
        else {
            const text = formatLine(lastTopLevel, line);
            canonical.push(text);
        }
    }

    canonical.sort();

    return canonical;
}

export function testOrdersIdentical(expected: TestOrder, observed: TestOrder) {
    const e = canonicalize(expected);
    const o = canonicalize(observed);

    let allok = true;

    for (let i = 0; i < o.length; ++i) {
        const ovalue = i < o.length ? o[i] : 'BLANK';
        const evalue = i < e.length ? e[i] : 'BLANK';
        const equality = (ovalue === evalue) ? "===" : "!==";
        const ok = (ovalue === evalue) ? "OK" : "<=== ERROR";
        allok = allok && (ovalue === evalue);
        console.log(`    "${evalue}" ${equality} "${ovalue}" - ${ok}`);
    }

    return allok;
}
