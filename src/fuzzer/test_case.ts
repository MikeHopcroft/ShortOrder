import { AttributeInfo } from '../attributes';
import { Catalog } from '../catalog';
import { TestCase, TestLineItem, TestOrder } from "../test_suite";
import { ENTITY, OPTION } from "../unified";

import { AnyInstance, MODIFIER, formatInstanceAsText } from "./instances";

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
                pid: instance.id,
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

    console.log(order);

    return testCase;
}