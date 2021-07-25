import dotenv from 'dotenv';
import minimist from 'minimist';
import path from 'path';
import { createWorld } from 'prix-fixe';
import { stemmerConfusionMatrix } from 'token-flow';

import { loadShortOrderWorld } from '../src';

function showUsage() {
  const program = path.basename(process.argv[1]);

  console.log('Detect alias collisions in the lexicon');
  console.log('');
  console.log("NOTE: collisions are detected after stemming with token-flow's");
  console.log('default stemmer (currently English snowball).');
  console.log('');
  console.log(
    `Usage: node ${program} [-d datapath] [-h|help|?] [-t termModel]`
  );
  console.log('');
  console.log('-d datapath     Path to prix-fixe data files.');
  console.log('                    attributes.yaml');
  console.log('                    intents.yaml (optional file)');
  console.log('                    options.yaml');
  console.log('                    products.yaml');
  console.log('                    quantifiers.yaml (optional file)');
  console.log('                    rules.yaml');
  console.log('                    stopwords.yaml (optional file)');
  console.log('                    units.yaml (optional file)');
  console.log('                The -d flag overrides the value specified');
  console.log('                in the PRIX_FIXE_DATA environment variable.');
  console.log('-h|help|?       Show this message.');
  console.log('-t <termModel>  One of snowball, metaphone, or hybrid.');
  console.log(' ');
}

function go() {
  dotenv.config();
  const args = minimist(process.argv.slice());

  let dataPath = process.env.PRIX_FIXE_DATA;
  if (args.d) {
    dataPath = args.d;
  }

  if (args.h || args.help || args['?']) {
    showUsage();
    return;
  }

  if (dataPath === undefined) {
    console.log(
      'Use -d flag or PRIX_FIXE_DATA environment variable to specify data path'
    );
    return;
  }

  const world = createWorld(dataPath);
  const world2 = loadShortOrderWorld(world, dataPath, args.t, false);
  const lexicon = world2.lexer.lexicon;

  const matrix = stemmerConfusionMatrix(lexicon);

  const entries = [...Object.entries(matrix)];
  entries.sort((a, b) => {
    const delta = b[1].size - a[1].size;
    if (delta !== 0) {
      return delta;
    } else {
      return a[0].localeCompare(b[0]);
    }
  });

  console.log('Stemmer Confusion Matrix');
  console.log();

  let entryCount = 0;
  let collisionCount = 0;
  for (const [key, value] of entries) {
    ++entryCount;
    if (value.size > 1) {
      ++collisionCount;
      const values = [...value].join(',');
      console.log(`"${key}": [${values}]`);
    }
  }

  console.log();
  console.log(`${entryCount} unique stemmed terms`);
  console.log(`${collisionCount} collisions`);
}

go();
