import * as minimist from 'minimist';

import {
    TestProcessors,
    testRunnerMain,
    testRunnerMain2,
    World
} from 'prix-fixe';

import { createShortOrderWorld } from '../src';

async function go() {
    // TODO: figure out how to merge command-line argument processing
    // across multiple extensions.
    const args = minimist(process.argv.slice());

    // Define the processor factory.
    const processors = new TestProcessors([
        {
            name: 'so',
            description: 'short-order',
            create: (w: World, d: string) => {
                const shortOrderWorld = createShortOrderWorld(w, d, args.t, false);
                return shortOrderWorld.processor;
            },
        },
    ]);

    testRunnerMain2('ShortOrder', processors);
}

go();
