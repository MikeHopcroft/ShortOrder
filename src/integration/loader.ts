import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { validate, World } from 'prix-fixe';

import { LexiconSpec, lexiconSpecType } from '../lexer';
import { ShortOrderWorld } from './short-order-world';
import { createShortOrderWorld2 } from './short-order-world2';

export function loadLexiconSpec(filename: string): LexiconSpec {
  const text = fs.readFileSync(filename, 'utf8');
  const root = yaml.safeLoad(text);
  const spec = validate(lexiconSpecType, root);
  return spec;
}

export function loadShortOrderWorld(
  world: World,
  dataPath: string,
  stemmerName?: string,
  debugMode = false
): ShortOrderWorld {
  const filename = path.join(dataPath, 'lexicon.yaml');
  console.log(`loadShortOrderWorld(${filename})`);
  const spec = loadLexiconSpec(filename);
  return createShortOrderWorld2(world, spec, stemmerName, debugMode);
}
