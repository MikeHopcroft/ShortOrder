import { AggregatedResults, ICatalog, Processor } from 'prix-fixe';

import { createTestCase } from './test_case';
import { OrderX } from './fuzzer';

export async function runTests(
    orders: IterableIterator<OrderX>,
    catalog: ICatalog,
    processor: Processor
): Promise<AggregatedResults> {
    const results = new AggregatedResults();

    for (const order of orders) {
        const testCase = createTestCase(catalog, order);
        const result = await testCase.run(processor, catalog);
        results.recordResult(result);
    }

    return results;
}