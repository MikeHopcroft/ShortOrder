import minimist from 'minimist';

import { TestProcessors, testRunnerMain, World } from 'prix-fixe';

import { loadShortOrderWorld } from '../src/integration/loader';

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
        const shortOrderWorld = loadShortOrderWorld(w, d, args.t, false);
        return shortOrderWorld.processor;
      },
    },
  ]);

  testRunnerMain('ShortOrder', processors);
}

go();
