import { AttributeInfo } from '../attributes';
import { Catalog } from '../catalog';
import { TestCase, TestLineItem, TestOrder } from "../test_suite";
import { ENTITY, OPTION } from "../unified";

import { AnyInstance, MODIFIER, formatInstanceAsText } from "./instances";
import { Result } from 'token-flow/build/src/relevance_suite/relevance_suite';

// TODO: perhaps createTestCase should be a class?
let counter = 0;

export function createTestCase(catalog: Catalog, attributeInfo: AttributeInfo, instances: AnyInstance[]): TestCase {
    const lines: TestLineItem[] = [];

    // Get top-level entity and quantity
    for (const instance of instances) {
        if (instance.type === ENTITY) {
            lines.push({
                indent: 0,
                quantity: instance.quantity.value,
                pid: instance.id,
                name: catalog.get(instance.id).name
            });
            break;
        }
    }

    // Get modifiers and options
    for (const instance of instances) {
        if (instance.type === MODIFIER) {
            const sku = attributeInfo.getAttributeSKU(instance.id);
            lines.push({
                indent: 1,
                quantity: 1,
                pid: sku as number,
                name: catalog.get(sku as number).name
            });
        }
        else if ( instance.type === OPTION) {
            lines.push({
                indent: 1,
                quantity: instance.quantity.value,
                pid: instance.id,
                name: catalog.get(instance.id).name
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
    return `${prefix} / ${line.indent}:${line.quantity}:${line.name}:${line.pid}`;
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