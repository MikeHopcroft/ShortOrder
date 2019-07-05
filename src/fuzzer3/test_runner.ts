import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as yaml from 'js-yaml';

import { createProcessor } from '../unified';

import {
    AggregatedResults,
    ICatalog,
    Processor,
    Result,
    setup,
    TestCase,
    World
} from 'prix-fixe';


// TODO: consider renaming file fuzzer_main.ts.
export async function fuzzerMain(
    testCaseGeneratorFactory: TestCaseGeneratorFactory,
    processorFactory: ProcessorFactory
) {
    dotenv.config();
    const args = minimist(process.argv);

    const outFile = args['o'] ? path.resolve(__dirname, args['o']) : undefined;
    const generator = args['t'];
    const verify = args['v'];
    const showOnlyFailingCases =
        (args['f'] === true) ||
        (args['failed'] === true);

    const defaultCount = 10;
    const count = (args['n'] || defaultCount);

    const help = 
        (args['h'] === true) || 
        (args['help'] === true) ||
        (args['?'] === true);

    let dataPath = process.env.PRIX_FIXE_DATA;
    if (args.d) {
        dataPath = args.d;
    }
    if (dataPath === undefined) {
        console.log('Use -d flag or PRIX_FIXE_DATA environment variable to specify data path');
        return;
    }
   

    if (help) {
        showUsage(processorFactory, testCaseGeneratorFactory);
    }
    else {
        runFuzzer(
            testCaseGeneratorFactory,
            processorFactory,
            dataPath,
            generator,
            count,
            verify,
            showOnlyFailingCases,
            outFile);
    }
}

function showUsage(
    processorFactory: ProcessorFactory,
    testCaseGeneratorFactory: TestCaseGeneratorFactory
) {
    const program = path.basename(process.argv[1]);

    console.log('Test case generator');
    console.log('');
    console.log(`Usage: node ${program} [-d datapath] [-n count] [-o outfile] [-v] [-h|help|?]`);
    console.log('');
    console.log('-d datapath     Path to prix-fixe data files.');
    console.log('                    attributes.yaml');
    console.log('                    options.yaml');
    console.log('                    products.yaml');
    console.log('                    rules.yaml');
    console.log('                The -d flag overrides the value specified');
    console.log('                in the PRIX_FIXE_DATA environment variable.');
    console.log('-n count        Number of test cases to generate.');
    console.log('-o outfile      Write cases to YAML file.');
    console.log('                Without -o, cases will be printed to the console.');
    console.log('-t [generator]  Use the named test case generator.');
    console.log('                (defaults to ???).');
    console.log('-v [processor]  Run the generated cases with the specified processor.');
    console.log('                or the domain-specific-entity processor (dse).');
    console.log('-f|failed       When verifying, show only failing cases.');
    console.log('-h|help|?       Show this message.');
    console.log(' ');

    console.log('Available test case generators:');
    for (const generator of testCaseGeneratorFactory.generators.values()) {
        console.log(`  "-t=${generator.name}": ${generator.description}`);
    }
    console.log(' ');

    console.log('Available processors:');
    for (const processor of processorFactory.processors.values()) {
        console.log(`  "-v=${processor.name}": ${processor.description}`);
    }
}

export async function runFuzzer(
    testCaseGeneratorFactory: TestCaseGeneratorFactory,
    processorFactory: ProcessorFactory,
    dataPath: string,
    generatorName: string | undefined,
    count: number,
    verify: string | undefined,
    showOnlyFailingCases: boolean,
    outFile: string | undefined
) {
    const name = (generatorName === undefined) ? testCaseGeneratorFactory.getDefaultName() : generatorName;

    console.log(`Using generator ${name}.`);
    console.log(`Generating ${count} test case${count === 1 ? "":"s"}.`);
    if (verify) {
        console.log(`Performing test verification with "${verify}".`);
    }
    if (outFile) {
        console.log(`Cases will be written to ${outFile}.`);
    }
    console.log('');

    const world = createWorld(dataPath);

    const tests: IterableIterator<TestCase> = testCaseGeneratorFactory.get(name, world, count);

    ///////////////////////////////////////////////////////////////////////////
    //
    // Run tests as they are generated.
    //
    ///////////////////////////////////////////////////////////////////////////
    let results: AggregatedResults;
    if (verify !== undefined) {
        const processor = processorFactory.get(verify, world, dataPath);

        results = await runTests(tests, world.catalog, processor);
        results.print(!showOnlyFailingCases);
    } else {
        results = makeTests(tests, world.catalog);
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Output generated cases
    //
    ///////////////////////////////////////////////////////////////////////////
    if (outFile !== undefined) {
        console.log(`Writing ${results.results.length} test cases to ${outFile}.`);
        const yamlCases = results.rebase();
        for (const yamlCase of yamlCases) {
            yamlCase.suites = 'synthetic';
        }
        const yamlText = yaml.safeDump(yamlCases, { noRefs: true });
        fs.writeFileSync(outFile, yamlText, 'utf-8');
        console.log(`Test cases written successfully.`);
    }

    if (verify === undefined && outFile === undefined) {
        console.log(' ');
        console.log("*** Performing dry run of test case generation. ***");
        console.log('Use the "-v" option to run the generated tests.');
        console.log('Use the "-o" option to write the generated tests to a file.');
        console.log('');

        let counter = 0;
        for (const result of results.results) {
            for (let i = 0; i < result.test.inputs.length; ++i) {
                console.log(`${counter}: "${result.test.inputs[i]}"`);
            }
            if (result.test.inputs.length > 1) {
                console.log(' ');
            }
            counter++;
        }
    }
}

export async function runTests(
    tests: IterableIterator<TestCase>,
    catalog: ICatalog,
    processor: Processor
): Promise<AggregatedResults> {
    const results = new AggregatedResults();

    for (const test of tests) {
        const result = await test.run(processor, catalog);
        results.recordResult(result);
    }

    return results;
}

export function makeTests(
    tests: IterableIterator<TestCase>,
    catalog: ICatalog
): AggregatedResults {
    const results = new AggregatedResults();

    for (const test of tests) {
        const result = new Result(test, test.expected, true, undefined, 0);
        results.recordResult(result);
    }

    return results;
}


///////////////////////////////////////////////////////////////////////////////
//
// TestCaseGeneratorFactory
//
///////////////////////////////////////////////////////////////////////////////
export type TestCaseGenerator = 
    (world: World, count: number) => IterableIterator<TestCase>;

export interface TestCaseGeneratorDescription
{
    name: string;
    description: string;
    factory: TestCaseGenerator;
}

export class TestCaseGeneratorFactory {
    generators = new Map<string, TestCaseGeneratorDescription>();

    constructor(generators: TestCaseGeneratorDescription[]) {
        if (generators.length < 1) {
            const message = "TestCaseGeneratorFactory: expect at least one generator.";
            throw TypeError(message);
        }

        for (const generator of generators) {
            this.generators.set(generator.name, generator);
        }
    }

    get(name: string, world: World, count: number): IterableIterator<TestCase> {
        if (this.generators.has(name)) {
            return this.generators.get(name)!.factory(world, count);
        } else {
            const message = `Unknown test case generator "${name}".`;
            throw TypeError(message);
        }
    }

    getDefaultName(): string {
        return [...this.generators.values()][0].name;
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// ProcessorFactory
//
///////////////////////////////////////////////////////////////////////////////
export interface ProcessorDescription {
    name: string;
    description: string;
    factory: (world: World, dataPath: string) => Processor;
}

export class ProcessorFactory {
    processors = new Map<string, ProcessorDescription>();

    constructor(processors: ProcessorDescription[]) {
        // Add ProcessorDescription for short-order by default.
        const shortOrder: ProcessorDescription =         {
            name: 'so',
            description: 'short-order processor',
            factory: createShortOrderProcessor,
        };

        for (const processor of [shortOrder, ...processors]) {
            this.processors.set(processor.name, processor);
        }
    }

    get(name: string, world: World, dataPath: string): Processor {
        if (this.processors.has(name)) {
            return this.processors.get(name)!.factory(world, dataPath);
        } else {
            const message = `Unknown processor "${name}".`;
            throw TypeError(message);
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// Utility functions
//
// TODO: should these move to the utilities directory?
//
///////////////////////////////////////////////////////////////////////////////
export function createWorld(dataPath: string): World {
    const productsFile = path.join(dataPath, 'products.yaml');
    const optionsFile = path.join(dataPath, 'options.yaml');
    const attributesFile = path.join(dataPath, 'attributes.yaml');
    const rulesFile = path.join(dataPath, 'rules.yaml');

    const world = setup(productsFile, optionsFile, attributesFile, rulesFile);

    return world;
}

export function createShortOrderProcessor(world: World, dataPath: string): Processor {
    const intentsFile = path.join(dataPath, 'intents.yaml');
    const quantifiersFile = path.join(dataPath, 'quantifiers.yaml');
    const unitsFile = path.join(dataPath, 'units.yaml');
    const stopwordsFile = path.join(dataPath, 'stopwords.yaml');

    const processor = createProcessor(
        world,
        intentsFile,
        quantifiersFile,
        unitsFile,
        stopwordsFile,
    );

    return processor;
}
