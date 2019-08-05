import {
    ProcessorFactory,
    testRunnerMain,
    World } from 'prix-fixe';

import {
    createShortOrderWorld,
} from '../src';

async function go() {

    // Define the processor factory.
    const processorFactory = new ProcessorFactory([
        {
            name: 'so',
            description: 'short-order',
            create: (w: World, d: string) => {
                const shortOrderWorld = createShortOrderWorld(w, d, false);
                return shortOrderWorld.processor;
            },
        },
    ]);

    testRunnerMain('ShortOrder', processorFactory);
}

go();
