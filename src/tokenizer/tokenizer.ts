import { diff } from './diff';
import { Edge, findBestPath } from './best_path';
import { v3 } from 'murmurhash';
import { Token, TokenFactory, UNKNOWN } from './tokens';
import { HASH, ID, PID } from './types';
import { newStemmer, Stemmer as SnowballStemmer } from '../../@types/snowball-stemmers';

export type StemmerFunction = (term: string) => string;

export class Tokenizer {
    debugMode = true;

    static snowballStemmer = newStemmer('english');
    
    // Function that stems a term.
    stemTerm: StemmerFunction;

    // Murmurhash seed.
    seed = 0;

    items: string[] = [];
    pids: PID[] = [];

    hashedItems: number[][] = [];
    stemmedItems: string[] = [];

    hashToText: { [hash: number]: string } = {};
    hashToFrequency: { [hash: number]: number } = {};

    postings: { [hash: number]: ID[] } = {};

    badWords: Set<string> = new Set<string>();

    hashedBadWordsSet = new Set<HASH>();

    constructor(
        badWords: Set<string>,
        stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
        debugMode = false
    ) {
        this.badWords = badWords;
        this.stemTerm = stemmer;
        this.badWords.forEach((term) => {
            const hash = this.hashTerm(this.stemTerm(term));
            this.hashedBadWordsSet.add(hash);
        });

        this.debugMode = debugMode;
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Utility functions
    //
    ///////////////////////////////////////////////////////////////////////////

    // Arrow function to allow use in map.
    static defaultStemTerm = (term: string): string => {
        // if (term.toLowerCase() === 'fries' || term.toLowerCase() === 'fried') {
        //     return term.toLowerCase();
        // }
        return Tokenizer.snowballStemmer.stem(term.toLowerCase());
    }

    // Arrow function to allow use in map.
    hashTerm = (term: string): number => {
        return v3(term, this.seed);
    }

    // Arrow function to allow use in map.
    decodeTerm = (hash: number): string => {
        if (hash in this.hashToText) {
            return this.hashToText[hash];
        }
        else {
            return `###HASH${hash}###`;
        }
    }

    decodeEdge = (edge: Edge) => {
        return `Edge("${this.items[edge.label]}", score=${edge.score}, length=${edge.length})`;
    }

    pidToName = (pid: PID) => {
        return `ITEM_${pid}`;
    }

    markMatches = (terms: string[], path: Edge[]) => {
        let termIndex = 0;
        const rewritten: string[] = [];
        path.forEach((edge) => {
            if (edge.label < 0) {
                rewritten.push(terms[termIndex++]);
            }
            // TODO: EXPERIMENT 1: filter out badwords.
            else {
                const text = `[${terms.slice(termIndex, termIndex + edge.length).join(" ")}]`;
                rewritten.push(text);
                termIndex += edge.length;
            }
        });
        return rewritten.join(' ');
    }

    replaceMatches = (terms: string[], path: Edge[], pidToName: ((pid: PID) => string)) => {
        let termIndex = 0;
        const rewritten: string[] = [];
        path.forEach((edge) => {
            if (edge.label < 0) {
                rewritten.push(terms[termIndex++]);
            }
            // TODO: EXPERIMENT 1: filter out badwords.
            else {
                // TODO: Where does toUpperCase and replacing spaces with underscores go?
                const name = pidToName(this.pids[edge.label]);
                const text = `[${name}]`;
                rewritten.push(text);
                termIndex += edge.length;
            }
        });
        return rewritten.join(' ');
    }

    tokenizeMatches = <T extends Token>(terms: string[], path: Edge[], tokenFactory: TokenFactory<T>) => {
        let termIndex = 0;
        const tokens: Token[] = [];
        path.forEach((edge, index) => {
            if (edge.label < 0) {
                if (tokens.length === 0 || tokens[tokens.length - 1].type !== UNKNOWN) {
                    tokens.push({ type: UNKNOWN, text: terms[termIndex++] });
                }
                else {
                    const text = `${tokens[tokens.length - 1].text} ${terms[termIndex++]}`;
                    tokens[tokens.length - 1] = { type: UNKNOWN, text };
                }
            }
            else {
                const text = terms.slice(termIndex, termIndex + edge.length).join(' ');
                tokens.push(tokenFactory(this.pids[edge.label], text));
                termIndex += edge.length;
            }
        });
        return tokens;
    }

    // TODO: printFrequencies()
    // TODO: printHashedItems()

    ///////////////////////////////////////////////////////////////////////////
    //
    // Indexing a phrase
    //
    ///////////////////////////////////////////////////////////////////////////
    addItem(pid: PID, text: string): void {
        // Internal id for this item. NOTE that the internal id is different
        // from the pid. The items "coke" and "coca cola" share a pid, but have
        // different ids.
        const id = this.items.length;
        this.items.push(text);
        this.pids.push(pid);

        // Split input string into individual terms.
        const terms = text.split(' ');

        const stemmed = terms.map(this.stemTerm);
        this.stemmedItems.push(stemmed.join(' '));

        const hashed = stemmed.map(this.hashTerm);
        this.hashedItems.push(hashed);

        hashed.forEach((hash, index) => {
            // Add this term to hash_to_text so that we can decode hashes later.
            if (!(hash in this.hashToText)) {
                this.hashToText[hash] = stemmed[index];
            }

            // Update term frequency
            // DESIGN ALTERNATIVE: could use lengths of posting lists instead.
            if (hash in this.hashToFrequency) {
                this.hashToFrequency[hash]++;
            }
            else {
                this.hashToFrequency[hash] = 1;
            }

            // Add current item to posting list for this term.
            // This is the inverted index.
            if (hash in this.postings) {
                this.postings[hash].push(id);
            }
            else {
                this.postings[hash] = [id];
            }
        });

        // TODO: Add tuples.
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Indexing all tuples of a phrase.
    //
    ///////////////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////////////
    //
    // Full-text matching and scoring algorithm follows.
    //
    ///////////////////////////////////////////////////////////////////////////
    commonTerms(query: HASH[], prefix: HASH[]) {
        const a = new Set(query);
        const b = new Set(prefix);
        return new Set([...a].filter(x => b.has(x)));
    }

    commonBadWords(commonTerms: Set<HASH>) {
        return new Set([...commonTerms].filter(x => this.hashedBadWordsSet.has(x)));
    }

    score(query: number[], prefix: number[]) {
        const { match, cost, leftmostA, rightmostA, common } = diff(query, prefix);

        // Ratio of match length to match length + edit distance.
        const matchFactor = match.length / (match.length + cost);

        // Ratio of match words common to query and prefix and length of match.
        const commonFactor = common / match.length;
        // EXPERIMENT: replace above line with one of the two following:
        // const commonFactor = common / (rightmostA + 1);
        // const commonFactor = common / rightmostA;

        const positionFactor = Math.max(match.length - leftmostA, 0) / match.length;

        const lengthFactor = rightmostA + 1;

        // This approach doesn't work because the match can contain trailing garbage.
        // Really need to count common terms that are not badwords.
        // TODO: fix matcher to not return trailing garbage. Example:
        //   query: 'large and add a Petaluma Chicken'
        //   prefix: 'large sprite;
        //   match: 'large and' instead of 'large'
        // 
        // const nonBadWordCount = match.reduce((count, term) => {
        //     if (this.hashedBadWordsSet.has(term)) {
        //         return count;
        //     }
        //     else {
        //         return count + 1;
        //     }
        // }, 0);
        // const badWordFactor = nonBadWordCount / match.length;
        const commonTerms = this.commonTerms(query, prefix);
        const commonBadWords = this.commonBadWords(commonTerms);

        let score = matchFactor * commonFactor * positionFactor * lengthFactor;
        // if (nonBadWordCount === 0) {
        //     score = -1;
        // }

        // Exclude matches that are all badwords, except those that match every word in the prefix.
        // As long as "Fried" and "Fries" stem to the same word, this prevents a collision
        // between the entity, "Fries" and the attribute, "Fried". Using a lemmatizer
        // instead of a stemmer could also help here.
        const badWordFactor = (commonTerms.size - commonBadWords.size) / commonTerms.size;
        if (commonTerms.size === commonBadWords.size && commonTerms.size !== prefix.length) {
            score = -1;
        }

        // if (score <= 0.25) {
        //     score = -1;
        // }
        if (score <= 0.01) {
            score = -1;
        }

        if (this.debugMode) {
            const queryText = query.map(this.decodeTerm).join(' ');
            const prefixText = prefix.map(this.decodeTerm).join(' ');
            const matchText = match.map(this.decodeTerm).join(' ');
            console.log(`      score=${score} mf=${matchFactor}, cf=${commonFactor}, pf=${positionFactor}, lf=${lengthFactor}, ff=${badWordFactor}`);
            console.log(`      length=${match.length}, cost=${cost}, left=${leftmostA}, right=${rightmostA}`);
            console.log(`      query="${queryText}"`);
            console.log(`      prefix="${prefixText}"`);
            console.log(`      match="${matchText}"`);
            console.log(`      query="${query}"`);
            console.log(`      prefix="${prefix}"`);
            console.log(`      match="${match}"`);
            console.log();
        }

        return { score, length: rightmostA + 1 };
    }

    // TODO: pass formatters here?
    // TODO: return terms and path, instead of strings?
    processQuery(query: string): Edge[] {
        const terms = query.split(' ');
        const stemmed = terms.map(this.stemTerm);
        const hashed = stemmed.map(this.hashTerm);

        // const edgeLists: Array<Array<{ score: number, length: number }>> = [];
        const edgeLists: Edge[][] = [];
        hashed.forEach((hash, index) => {

            // TODO: exclude starting at hashes that are conjunctions.

            if (hash in this.postings) {
                // This query term is in at least one product term.
                if (this.debugMode) {
                    const stemmedText = stemmed.slice(index).join(' ');
                    console.log(`  "${stemmedText}" SCORING:`);
                }

                // Get all of the items containing this query term.
                // Items not containing this term will match better
                // at other starting positions.
                const items = this.postings[hash];

                // Generate score for all of the items, matched against
                // the tail of the query.
                const tail = hashed.slice(index);
                const scored = items.map((item) =>
                    ({ ...this.score(tail, this.hashedItems[item]), label: item }));

                const sorted = scored.sort((a, b) => b.score - a.score);

                edgeLists.push(sorted);
            }
            else {
                if (this.debugMode) {
                    console.log(`  "${stemmed[index]}" UNKNOWN`);
                }
                edgeLists.push([]);
            }
        });

        const path = findBestPath(edgeLists);

        if (this.debugMode) {
            console.log('edge list:');
            edgeLists.forEach((edges) => {
                const text = edges.map(this.decodeEdge).join(',');
                // const text = edges.map((edge) => `Edge(s=${edge.score}, l=${edge.length})`).join(', ');
                console.log(`    [${text}]`);
            });
            console.log('best path:');
            path.forEach((edge) => {
                console.log(`    ${this.decodeEdge(edge)}`);
            });
        }

        return path;
    }
}
