import * as pluralize from 'pluralize';
import { newStemmer, Stemmer as SnowballStemmer } from 'snowball-stemmers';
const metaphone = require('talisman/phonetics/metaphone') as (word: string) => string;
const doubleMetaphone = require('talisman/phonetics/double-metaphone') as (word: string) => [string, string];
import { StemmerFunction } from 'token-flow';

import { ReplacerSpec } from './types';

interface StemmerDescription2 {
  name: string;
  description: string;
  create(factory: StemmerFactory2): StemmerFunction;
}

export class StemmerFactory2 {
  private readonly nameToReplacer = new Map<string, Map<string, string>>();

  private readonly stemmerDescriptions: StemmerDescription2[] = [
    {
      name: 'snowball',
      description: 'snowball v2 stemmer',
      create: createSnowballStemmer
    },
    {
      name: 'metaphone',
      description: 'double metaphone',
      create: createMetaphone
    },
    {
      name: 'hybrid',
      description: 'double metaphone with singularization',
      create: createHybridMetaphone
    },
    {
      name: 'nop',
      description: 'nop stemmer - does nothing',
      create: createNop
    },
    {
      name: 'singularizer',
      description: 'singularize only',
      create: createSingularizer
    }
  ];

  private readonly nameToStemmer = new Map<string, StemmerDescription2>();

  constructor(specs: ReplacerSpec[]) {
    for (const spec of specs) {
      if (this.nameToReplacer.has(spec.name)) {
        const message = `Duplicate replacer specification "${spec.name}"`;
        throw new TypeError(message);
      }
      this.nameToReplacer.set(
        spec.name,
        new Map<string, string>(spec.replacements)
      );
    }

    for (const description of this.stemmerDescriptions) {
      this.register(description);
    }
  }

  register(stemmer: StemmerDescription2) {
    if (this.nameToStemmer.has(stemmer.name)) {
      const message = `Duplicate stemmer description "${
        stemmer.name
        }"`;
      throw new TypeError(message);
    }
    this.nameToStemmer.set(stemmer.name, stemmer);
  }

  *stemmers(): IterableIterator<StemmerDescription2> {
    return this.nameToStemmer.values();
  }

  getReplacements(name: string) {
    const replacements = this.nameToReplacer.get(name);
    if (!replacements) {
      const message = `Unknown stemmer specification "${name}"`;
      throw new TypeError(message);
    }
    return replacements;
  }

  create(name?: string): StemmerFunction {
    if (!name) {
      // Use default stemmer.
      name = this.stemmerDescriptions[0].name;
    }

    const stemmer = this.nameToStemmer.get(name);
    if (stemmer) {
      return stemmer.create(this);
    }

    const names = [...this.nameToStemmer.keys()].join(',');
    const message = `Unknown stemmer ${name}. Available stemmers: ${names}`;
    throw TypeError(message);
  }
}

function createSnowballStemmer(factory: StemmerFactory2): StemmerFunction {
  const replacements = factory.getReplacements('snowball');
  const snowballStemmer = newStemmer('english');
  return replacer(replacements, snowballStemmer.stem);
}

function createMetaphone(factory: StemmerFactory2): StemmerFunction {
  const replacements = factory.getReplacements('metaphone');
  return replacer(
    replacements,
    (term: string): string => metaphone(term)
    // (term: string): string => doubleMetaphone(term)[0]
  );
}

function createHybridMetaphone(factory: StemmerFactory2): StemmerFunction {
  const sReplacements = factory.getReplacements('singularize');
  const singularize = replacer(sReplacements, pluralize.singular);

  const mReplacements = factory.getReplacements('metaphone');

  return replacer(
    mReplacements,
    (term: string): string => metaphone(singularize(term))
    // (term: string): string => doubleMetaphone(singularize(term))[0]
  );
}

function createNop(factory: StemmerFactory2): StemmerFunction {
  return (term: string): string => term;
}

function createSingularizer(factory: StemmerFactory2): StemmerFunction {
  const replacements = factory.getReplacements('singularize');
  return replacer(replacements, pluralize.singular);
}

function replacer(
  replacements: Map<string, string>,
  stemmer: StemmerFunction
): StemmerFunction {
  return (term: string): string => {
    const replacement = replacements.get(term);
    if (replacement) {
      return replacement;
    } else {
      return stemmer(term);
    }
  };
}
