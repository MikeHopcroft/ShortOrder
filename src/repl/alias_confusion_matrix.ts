import { IIngestor, Token, TokenizerAlias } from 'token-flow';

import { tokenToString } from '../lexer';
import { createHistogram } from '../utilities';

// const confusionMatrix = new AliasConfusionMatrix();
// lexer.lexicon.ingest(confusionMatrix);

// confusionMatrix.print();

class AliasConfusionMatrix implements IIngestor {
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
