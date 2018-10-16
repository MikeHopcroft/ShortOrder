import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Recognizer, UNKNOWN } from '../tokenizer';
import { copyScalar } from '../utilities';
import { Pipeline, tokenToString } from '../pipeline';

export class Result {
    test: TestCase;
    observed: string;
    passed: boolean;

    constructor(test: TestCase, observed: string, passed: boolean) {
        this.test = test;
        this.observed = observed;
        this.passed = passed;
    }
}

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

    print() {
        console.log('Failing tests:');

        this.results.forEach((result => {
            if (!result.passed) {
                const suites = result.test.suites.join(' ');
                const passFail = result.passed ? "PASSED" : "FAILED";
                console.log(`${result.test.id} ${suites} - ${passFail}`);
                console.log(`   input "${result.test.input}"`);
                console.log(`  output "${result.observed}"`);
                console.log(`expected "${result.test.expected}"`);
                console.log();
            }
        }));

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

    rebase() {
        const baseline = this.results.map(result => {
            return {
                'priority': result.test.priority,
                'suites': result.test.suites.join(' '),
                'input': result.test.input,
                'expected': result.observed
            };
        });
        return baseline;
    }
}

export class TestCase {
    id: number;
    priority: string;
    suites: string[];
    input: string;
    expected: string;

    constructor(
        id: number,
        priority: string,
        suites: string[],
        input: string,
        expected: string
    ) {
        this.id = id;
        this.priority = priority;
        this.suites = suites;
        this.input = input;
        this.expected = expected;
    }

    run(recognizer: Recognizer) {
        const input = { type: UNKNOWN, text: this.input };
        const tokens = recognizer.apply(input);

        const observed = tokens.map(tokenToString).join(' ');

        const passed = (this.expected === observed);

        if (!passed) {
            console.log('Failed:');
            console.log(`  "${this.input}"`);
            console.log(`  "${observed}"`);
            console.log(`  "${this.expected}"`);
            console.log('');
        }

        return new Result(this, observed, passed);
    }
}

export class RelevanceSuite {
    private tests: TestCase[] = [];

    static fromYamlFilename(filename: string) {
        // tslint:disable-next-line:no-any
        const yamlTests = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));

        if (!Array.isArray(yamlTests)) {
            throw TypeError('RelevanceTest: expected an array of tests.');
        }

        const tests = yamlTests.map((test, index) => {
            return new TestCase(
                index,
                copyScalar<number>(test, 'priority', 'number').toString(),
                copyScalar<string>(test, 'suites', 'string').split(' '),
                copyScalar<string>(test, 'input', 'string'),
                copyScalar<string>(test, 'expected', 'string')
            );
        });

        return new RelevanceSuite(tests);
    }

    constructor(tests: TestCase[]) {
        this.tests = tests;
    }

    run(recognizer: Recognizer) {
        const aggregator = new AggregatedResults();

        this.tests.forEach((test) => {
            aggregator.recordResult(test.run(recognizer));
        });

        aggregator.print();

        return aggregator;
    }
}

export function runRelevanceTest(
    entityFile: string,
    intentsFile: string,
    attributesFile: string,
    quantifierFile: string,
    testFile: string
): AggregatedResults {
    const pipeline = new Pipeline(
        entityFile,
        intentsFile,
        attributesFile,
        quantifierFile
    );

    const suite = RelevanceSuite.fromYamlFilename(testFile);
    return suite.run(pipeline.compositeRecognizer);
}
