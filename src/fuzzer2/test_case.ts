import { AttributeInfo, ICatalog, TestCase, TestLineItem, TestOrder } from "prix-fixe";

import { ENTITY, OPTION } from "../unified";

import {
    BasicInstance,
    formatInstanceAsText,
    WordOrProductInstance,
    PRODUCT
} from "./instances";

// TODO: perhaps createTestCase should be a class? (instead of side-effecting counter)
let counter = 0;

export function createTestCase(
    catalog: ICatalog,
    attributeInfo: AttributeInfo,
    instances: WordOrProductInstance[]
): TestCase {
    const lines: TestLineItem[] = [];

    for (const instance of instances) {
        if (instance.type === PRODUCT) {
            appendProductLines(catalog, attributeInfo, lines, instance.instances);
        }
    }

    const order: TestOrder = {
        lines
    };

    const testCase = new TestCase(
        counter++,
        '1',
        ['unverified'],
        'synthetic',        // TODO: put info in comment?
        [instances.map(formatInstanceAsText).join(' ')],
        [order]);

    return testCase;
}

export function appendProductLines(
    catalog: ICatalog,
    attributeInfo: AttributeInfo,
    lines: TestLineItem[],
    instances: BasicInstance[]
): TestCase {
    // Get top-level entity and quantity
    for (const instance of instances) {
        if (instance.type === ENTITY) {
            lines.push({
                indent: 0,
                quantity: instance.quantity.value,
                key: instance.key,
                name: catalog.getSpecific(instance.key).name
            });
            break;
        }
    }

    // Add options
    for (const instance of instances) {
        if (instance.type === OPTION) {
            lines.push({
                indent: 1,
                quantity: instance.quantity.value,
                key: instance.key,
                name: catalog.getSpecific(instance.key).name
            });
        }
    }

    const order: TestOrder = {
        lines
    };

    const testCase = new TestCase(
        counter++,
        '1',
        ['unverified'],
        'synthetic',        // TODO: put info in comment?
        [instances.map(formatInstanceAsText).join(' ')],
        [order]);

    return testCase;
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