import * as AJV from 'ajv';
import * as Debug from 'debug';
import * as yaml from 'js-yaml';

import { PID } from 'token-flow';
import { AnyToken, Cart, Catalog, ItemInstance, State, World } from '..';

const debug = Debug('tf:itemMapFromYamlString');

///////////////////////////////////////////////////////////////////////////////
//
// AggregatedResults
//
// Holds the Result objects produced by a test suite run.
// Maintains aggregate pass/fail counts by priority and suite.
// Formats and prints test results.
//
///////////////////////////////////////////////////////////////////////////////

// Holds a single line of an TestOrder.
export interface TestLineItem {
    readonly indent: number;
    readonly quantity: number;
    readonly pid: PID;
    readonly name: string;
}

// A simplified view of the Cart, suitable for test verification.
export interface TestOrder {
    readonly lines: TestLineItem[];
}

// Holds the results of one TestCase run.
export class Result {
    readonly test: TestCase;         // TestCase that generated this Result.
    readonly observed: TestOrder[];     // The sequence of Order2s produced by the run.
    readonly passed: boolean;        // Determination of the success of the test case.

    constructor(test: TestCase, observed: TestOrder[], passed: boolean) {
        this.test = test;
        this.observed = observed;
        this.passed = passed;
    }
}

// Stores aggregations related to test runs by suite or priority.
export interface TestCounts {
    passCount: number;
    runCount: number;
}

export class AggregatedResults {
    priorities: { [priority: string]: TestCounts } = {};
    suites: { [suite: string]: TestCounts } = {};
    results: Result[] = [];
    passCount = 0;

    recordResult(result: Result): void {
        const test = result.test;
        const passed = result.passed;

        // Update pass/run counts for each suite associated with this test.
        test.suites.forEach((suite) => {
            if (!(suite in this.suites)) {
                this.suites[suite] = { passCount: 0, runCount: 0 };
            }
            const counts = this.suites[suite];
            counts.runCount++;
            if (passed) {
                counts.passCount++;
            }
        });

        // Update pass/run counts for this test's priority.
        if (!(test.priority in this.priorities)) {
            this.priorities[test.priority] = { passCount: 0, runCount: 0 };
        }
        const counts = this.priorities[test.priority];
        counts.runCount++;
        if (passed) {
            counts.passCount++;
        }

        this.results.push(result);

        if (passed) {
            this.passCount++;
        }
    }

    print(showPassedCases = false) {
        if (this.results.find(result => !result.passed)) {
            console.log('Failing tests:');
        }
        else {
            console.log('All tests passed.');
            console.log();
        }

        for (const result of this.results) {
            if (!result.passed || showPassedCases) {
                const suites = result.test.suites.join(' ');
                const passFail = result.passed ? "PASSED" : "FAILED";
                console.log(`${result.test.id} - ${passFail}`);
                console.log(`  Comment: ${result.test.comment}`);
                console.log(`  Suites: ${suites}`);

                for (const [i, input] of result.test.inputs.entries()) {
                    const observed = result.observed[i];
                    const expected = result.test.expected[i];

                    console.log(`  Utterance ${i}: "${result.test.inputs[i]}"`);

                    explainDifferences(observed, expected);
                }
                console.log();
            }
        }

        console.log('Suites:');
        for (const [suite, counts] of Object.entries(this.suites)) {
            console.log(`  ${suite}: ${counts.passCount}/${counts.runCount}`);
        }
        console.log();

        console.log('Priorities:');
        for (const [priority, counts] of Object.entries(this.priorities)) {
            console.log(`  ${priority}: ${counts.passCount}/${counts.runCount}`);
        }
        console.log();

        console.log(`Overall: ${this.passCount}/${this.results.length}`);
    }

    // rebase() {
    //     const baseline = this.results.map(result => {
    //         return {
    //             'priority': result.test.priority,
    //             'suites': result.test.suites.join(' '),
    //             'input': result.test.input,
    //             'expected': result.observed
    //         };
    //     });
    //     return baseline;
    // }
}

function explainDifferences(observed: TestOrder, expected: TestOrder) {
    const o = observed.lines;
    const e = expected.lines;
    const n = Math.max(o.length, e.length);

    for (let i = 0; i < n; ++i) {
        const ovalue = i < o.length ? formatLine(o[i]) : 'BLANK';
        const evalue = i < e.length ? formatLine(e[i]) : 'BLANK';
        const equality = (ovalue === evalue) ? "===" : "!==";
        const ok = (ovalue === evalue) ? "OK" : "<=== ERROR";
        console.log(`    "${evalue}" ${equality} "${ovalue}" - ${ok}`);
    }
}

function formatLine(line: TestLineItem) {
    return `${line.indent}:${line.quantity}:${line.name}:${line.pid}`;
}


///////////////////////////////////////////////////////////////////////////////
//
// TestCase
//
// Describes inputs and expected outputs for a single test.
// Runs a test, producting a Results object.
//
///////////////////////////////////////////////////////////////////////////////

export class TestCase {
    id: number;
    priority: string;
    suites: string[];
    comment: string;
    inputs: string[];
    expected: TestOrder[];

    constructor(
        id: number,
        priority: string,
        suites: string[],
        comment: string,
        inputs: string[],
        expected: TestOrder[]
    ) {
        this.id = id;
        this.priority = priority;
        this.suites = suites;
        this.comment = comment;
        this.inputs = inputs;
        this.expected = expected;
    }

    run(world: World, tokenizer: TokenizerFunction | undefined = undefined): Result {
        const orders = [];
        let succeeded = true;

        const { parser } = world;
        let state: State = { cart: { items: [] }, actions: [] };
        for (const [i, input] of this.inputs.entries()) {
            // Run the parser
            if (tokenizer) {
                state = world.parser.parseTokens(tokenizer(input), state);
            }
            else {
                state = world.parser.parseText(input, state);
            }

            // Convert the Cart to an Order2
            const observed = formatCart(state.cart, world.catalog);
            orders.push(observed);

            // Compare observed Order2s
            const expected = this.expected[i];
            succeeded = ordersAreEqual(observed, expected);
        }

        return new Result(this, orders, succeeded);
    }
}

function formatCart(cart: Cart, catalog: Catalog): TestOrder {
    const lines: TestLineItem[] = [];

    for (const item of cart.items) {
        formatItem(catalog, lines, item, 0);
    }

    return { lines };
}

function formatItem(
    catalog: Catalog,
    order: TestLineItem[],
    item: ItemInstance,
    indent: number): void {
    for (const mod of item.modifications) {
        formatItem(catalog, order, mod, indent + 1);
    }

    const name = catalog.get(item.pid).name;
    const quantity = item.quantity;
    const pid = item.pid;

    order.unshift({ indent, quantity, pid, name });
}

function ordersAreEqual(observed: TestOrder, expected: TestOrder): boolean {
    if (observed.lines.length !== expected.lines.length) {
        return false;
    }

    for (let i = 0; i < expected.lines.length; ++i) {
        const o = observed.lines[i];    // Skip header
        const e = expected.lines[i];

        if (o.indent !== e.indent ||
            o.quantity !== e.quantity ||
            o.pid !== e.pid ||
            o.name !== e.name
        ) {
            return false;
        }
    }

    return true;
}

///////////////////////////////////////////////////////////////////////////////
//
// TestSuite
//
// Reads a set of TestCase descriptions from a YAML string.
// Runs the set of TestCases and returns an AggregatedResults object with
// information about the run.
//
///////////////////////////////////////////////////////////////////////////////

interface YamlTestCase {
    priority: number;
    suites: string;
    comment: string;
    inputs: string[];
    expected: TestOrder[];
}

// Type definition for use by typescript-json-schema.
type YamlTestCases = YamlTestCase[];

export type TokenizerFunction = (utterance: string) => IterableIterator<AnyToken>;

export class TestSuite {
    private tests: TestCase[] = [];

    // typescript-json-schema tsconfig.json YamlTestCases --required
    static fromYamlString(yamlText: string) {
        const schemaForTestCases = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "definitions": {
                "LineItem2": {
                    "properties": {
                        "indent": {
                            "type": "number"
                        },
                        "name": {
                            "type": "string"
                        },
                        "pid": {
                            "type": "number"
                        },
                        "quantity": {
                            "type": "number"
                        }
                    },
                    "required": [
                        "indent",
                        "name",
                        "pid",
                        "quantity"
                    ],
                    "type": "object"
                },
                "Order2": {
                    "properties": {
                        "lines": {
                            "items": {
                                "$ref": "#/definitions/LineItem2"
                            },
                            "type": "array"
                        }
                    },
                    "required": [
                        "lines"
                    ],
                    "type": "object"
                },
                "YamlTestCase": {
                    "properties": {
                        "comment": {
                            "type": "string"
                        },
                        "expected": {
                            "items": {
                                "$ref": "#/definitions/Order2"
                            },
                            "type": "array"
                        },
                        "inputs": {
                            "items": {
                                "type": "string"
                            },
                            "type": "array"
                        },
                        "priority": {
                            "type": "number"
                        },
                        "suites": {
                            "type": "string"
                        }
                    },
                    "required": [
                        "comment",
                        "expected",
                        "inputs",
                        "priority",
                        "suites"
                    ],
                    "type": "object"
                }
            },
            "items": {
                "$ref": "#/definitions/YamlTestCase"
            },
            "type": "array"
        };
        
        const ajv = new AJV();
        const validator = ajv.compile(schemaForTestCases);
        const yamlRoot = yaml.safeLoad(yamlText) as YamlTestCase[];

        if (!validator(yamlRoot)) {
            const message = 'itemMapFromYamlString: yaml data does not conform to schema.';
            debug(message);
            debug(validator.errors);
            throw TypeError(message);
        }

        const tests = yamlRoot.map((test, index) => {
            return new TestCase(
                index,
                test.priority.toString(),
                test.suites.split(/\s+/),
                test.comment,
                test.inputs,
                test.expected);
        });

        return new TestSuite(tests);
    }

    constructor(tests: TestCase[]) {
        this.tests = tests;
    }

    run(world: World,
        showPassedCases = false,
        suite: string|undefined = undefined,
        tokenizer: TokenizerFunction|undefined = undefined
    ): AggregatedResults {
        const aggregator = new AggregatedResults();

        for (const test of this.tests) {
            if (suite && test.suites.indexOf(suite) > -1 || !suite) {
                aggregator.recordResult(test.run(world, tokenizer));
            }
        }

        aggregator.print(showPassedCases);

        return aggregator;
    }
}
