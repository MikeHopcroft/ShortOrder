import * as dotenv from 'dotenv';
import * as minimist from 'minimist';
import * as path from 'path';
import { IIngestor, Token, TokenizerAlias } from 'token-flow';

import {
    createHistogram,
    createWorld,
    LexicalAnalyzer,
    tokenToString,
} from '../src';

function showUsage() {
    const program = path.basename(process.argv[1]);

    console.log('Detect alias collisions in lexicon');
    console.log('');
    console.log("NOTE: collisions are detected after stemming with token-flow's");
    console.log('default stemmer (currently English snowball).');
    console.log('');
    console.log(`Usage: node ${program} [-d datapath] [-h|help|?]`);
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
    console.log(' ');
}

// TODO: command line argument for stemming
// TODO: print out stemmed versions
async function go() {
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
        console.log('Use -d flag or PRIX_FIXE_DATA environment variable to specify data path');
        return;
    }

    const debugMode = false;

    // We always look for collisions between aliases in the word,
    // i.e. products.yaml, options.yaml, attributes.yaml.
    const world = createWorld(dataPath);

    // We have the option of including other yaml files in the analysis.
    // Note that these files are not required.
    const intentsFile = path.join(dataPath, 'intents.yaml');
    const quantifiersFile = path.join(dataPath, 'quantifiers.yaml');
    const unitsFile = path.join(dataPath, 'units.yaml');
    const stopwordsFile = path.join(dataPath, 'stopwords.yaml');

    const lexer = new LexicalAnalyzer(
        world,
        debugMode,
        // DESIGN NOTE: the following four parameters are optional.
        intentsFile,
        quantifiersFile,
        unitsFile,
        stopwordsFile,
    );

    const confusionMatrix = new ConfusionMatrix();
    lexer.lexicon.ingest(confusionMatrix);

    confusionMatrix.print();
}

class ConfusionMatrix implements IIngestor {
    textToTokens = new Map<string, Set<Token>>();

    addItem(alias: TokenizerAlias): void {
        const set = this.textToTokens.get(alias.text);
        if (set) {
            set.add(alias.token);
        } else {
            this.textToTokens.set(alias.text, new Set([alias.token]));
        }
    }

    print() {
        const collisions: Array<{ text: string, set: Set<Token>}> = [];
        for (const [text, set] of this.textToTokens.entries()) {
            if (set.size > 1) {
                collisions.push({text, set});
            }
        }

        collisions.sort( (a,b) => {
            const delta = b.set.size - a.set.size;
            if (delta === 0) {
                return a.text.localeCompare(b.text);
            }
            else {
                return delta;
            }
        });

        console.log('Collisions:');
        let previousSize = Infinity;
        for (const {text, set} of collisions) {
            if (set.size < previousSize) {
                console.log();
                console.log(`=== Aliases with ${set.size} collisions ===`);
                previousSize = set.size;
            }
            console.log(`"${text}":`);
            for (const token of set) {
                console.log(`    ${tokenToString(token)}`);
            }
        }

        console.log('');
        console.log('Histogram of collision set sizes:');
        const histogram = createHistogram(collisions.map(x => x.set.size).values());
        for (const [size, count] of histogram) {
            console.log(`    ${size}: ${count}`);
        }
    }
}

go();
