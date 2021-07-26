import { assert } from 'chai';
import 'mocha';

import {
  NopLogger,
  TestProcessors,
  TestRunnerApplication,
  World,
} from 'prix-fixe';

import { loadShortOrderWorld } from '../../src/integration/loader';

// Need some way to pass args to testRunnerMain
// Need a reliable path to the menu, regression, and baseline files.
// Need some way to get return code, instead of exiting.

describe('Integration', () => {
  it('Regression suite', async () => {
    // Define the processor factory.
    const processors = new TestProcessors([
      {
        name: 'so',
        description: 'short-order',
        create: (w: World, d: string) => {
          const shortOrderWorld = loadShortOrderWorld(w, d, undefined, false);
          return shortOrderWorld.processor;
        },
      },
    ]);

    const argv = [
      'node',
      'unit_test',
      '-d=samples/menu',
      '--baseline=samples/tests/baseline.yaml',
      'samples/tests/regression.yaml',
    ];

    // const returnCode = await testRunnerMain('ShortOrder', processors, argv);
    const app = new TestRunnerApplication(
      'short-order unit test',
      processors,
      new NopLogger()
    );
    const returnCode = await app.go(argv);

    assert.equal(returnCode, 0);
  });
});
