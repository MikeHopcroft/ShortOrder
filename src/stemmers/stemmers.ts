import * as fs from 'fs';
import * as path from 'path';
import * as pluralize from 'pluralize';
import { newStemmer, Stemmer as SnowballStemmer } from 'snowball-stemmers';
const doubleMetaphone = require('talisman/phonetics/double-metaphone') as (word:string)=>[string, string];
import { StemmerFunction } from 'token-flow';

export interface StemmerDescription {
    name: string;
    description: string;
    create(dataPath: string): StemmerFunction;
}

export class StemmerFactory {
    private readonly dataPath: string;
    private readonly stemmerDescriptions: StemmerDescription[] = [
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
    private readonly nameToStemmer = new Map<string, StemmerDescription>();

    constructor(dataPath: string) {
        this.dataPath = dataPath;

        for (const description of this.stemmerDescriptions) {
            this.register(description);
        }
    }

    register(stemmer: StemmerDescription) {
        this.nameToStemmer.set(stemmer.name, stemmer);
    }

    *stemmers(): IterableIterator<StemmerDescription> {
        return this.nameToStemmer.values();
    }

    create(name?: string): StemmerFunction {
        if (!name) {
            // Use default stemmer.
            name = this.stemmerDescriptions[0].name;
        }

        const stemmer = this.nameToStemmer.get(name);
        if (stemmer) {
            return stemmer.create(this.dataPath);
        }

        const names = [...this.nameToStemmer.keys()].join(',');
        const message = `Unknown stemmer ${name}. Available stemmers: ${names}`;
        throw TypeError(message);
    }
}

function createSnowballStemmer(dataPath: string): StemmerFunction {
    const stemmerFile = path.join(dataPath, 'snowball.csv');
    const snowballStemmer = newStemmer('english');
    return replacer(stemmerFile, snowballStemmer.stem);
}

function createMetaphone(dataPath: string): StemmerFunction {
    const metaphoneFile = path.join(dataPath, 'metaphone.csv');
    return replacer(
        metaphoneFile, 
        (term: string): string => doubleMetaphone(term)[0]
    );
}

function createHybridMetaphone(dataPath: string): StemmerFunction {
    const singularizeFile = path.join(dataPath, 'singularize.csv');
    const singularize = replacer(singularizeFile, pluralize.singular);

    const metaPhoneFile = path.join(dataPath, 'metaphone.csv');

    return replacer(
        metaPhoneFile,
        (term: string): string => doubleMetaphone(singularize(term))[0]
    );
}

function createNop(dataPath: string): StemmerFunction {
    return (term: string): string => term;
}

function createSingularizer(dataPath: string): StemmerFunction {
    const singularizeFile = path.join(dataPath, 'singularize.csv');
    return replacer(singularizeFile, pluralize.singular);
}

function replacer(replaceFile: string, stemmer: StemmerFunction): StemmerFunction {
    // const lines = fs.readFileSync(replaceFile).toString().split(/[\n\r]*/);
    const lines = fs.readFileSync(replaceFile).toString().match(/[^\r\n]+/g);
    const replacements = new Map<string, string>();
    if (lines) {
        let lineNumber = 0;
        for (const line of lines) {
            ++lineNumber;
            const trimmed = line.trim();
            if (line.length > 0 && !line.startsWith('#') && !line.startsWith('//')) {
                const fields = line.split(',');
                if (fields.length === 2) {
                    const left = fields[0].trim();
                    const right = fields[1].trim();
                    if (left.length > 0 && right.length > 0) {
                        if (!replacements.has(left)) {
                            replacements.set(left, right);
                            continue;
                        }
                    }
                }
                const message = `${replaceFile}: ${lineNumber} - expected "original,replacement" fields`;
                throw TypeError(message);
            }
        }
    }

    return (term: string): string => {
        const replacement = replacements.get(term);
        if (replacement) {
            return replacement;
        } else {
            return stemmer(term);
        }
    };
}