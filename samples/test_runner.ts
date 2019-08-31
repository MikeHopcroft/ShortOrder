const doubleMetaphone = require('double-metaphone');
// import * as doubleMetaphone from 'double-metaphone';

import {
    TestProcessors,
    testRunnerMain,
    World
} from 'prix-fixe';

import { DefaultTermModel, Lexicon } from 'token-flow';

import {
    createShortOrderWorld,
} from '../src';

async function go() {

    // Define the processor factory.
    const processors = new TestProcessors([
        {
            name: 'so',
            description: 'short-order',
            create: (w: World, d: string) => {
                // const stemmer = (word: string): string => {
                //     return doubleMetaphone(word)[0];
                // };
                // const termModel = new DefaultTermModel(stemmer);
                // const lexicon = new Lexicon(termModel);
                // const shortOrderWorld = createShortOrderWorld(w, d, lexicon, false);

                const shortOrderWorld = createShortOrderWorld(w, d, undefined, false);
                return shortOrderWorld.processor;
            },
        },
    ]);

    testRunnerMain('ShortOrder', processors);
}

go();
