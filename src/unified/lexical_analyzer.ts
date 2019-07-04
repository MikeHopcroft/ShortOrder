import * as fs from 'fs';

import {
    Alias,
    equivalentPaths,
    Lexicon,
    Tokenizer,
    Token,
    UNKNOWNTOKEN,
} from 'token-flow';

import {
    aliasesFromPattern,
    MENUITEM,
    OPTION,
    setup,
    World,
} from 'prix-fixe';

import { stopwordsFromYamlString } from '../stopwords';

import { CreateAttribute } from './attributes';
import { CreateEntity } from './entities';
import { intentTokenFactory } from './intents';
import { CreateOption } from './options';
import { quantityTokenFactory } from './quantities';
import { unitTokenFactory } from './units';

import {
    aliasesFromYamlString,
    matcherFromExpression,
    patternFromExpression,
    tokensFromStopwords,
    WORD,
    WordToken
} from './lexical_utilities';


// Prints out information about dimensions associated with a set of DIDs.
function* generateAttributes(world: World): IterableIterator<Alias> {
    for (const dimension of world.attributes.dimensions) {
        // console.log(`  Dimension(${dimension.did}): ${dimension.name}`);
        for (const attribute of dimension.attributes) {
            // console.log(`    Attribute(${attribute.aid})`);
            const token = CreateAttribute(attribute.aid, attribute.name);
            for (const alias of attribute.aliases) {
                const matcher = matcherFromExpression(alias);
                const pattern = patternFromExpression(alias);
                for (const text of aliasesFromPattern(pattern)) {
                    // console.log(`      ${text}`);
                    yield { token, text, matcher };
                }
            }
        }
    }
}

function* generateProducts(world: World): IterableIterator<Alias> {
    // console.log();
    // console.log('=== Products ===');
    for (const item of world.catalog.genericEntities()) {
        if (item.kind === MENUITEM) {
            const token = CreateEntity(item.pid, item.name);
            for (const alias of item.aliases) {
                const matcher = matcherFromExpression(alias);
                const pattern = patternFromExpression(alias);
                for (const text of aliasesFromPattern(pattern)) {
                    // console.log(`  ${text}`);
                    yield { token, text, matcher };
                }
            }
        }
    }
}

function* generateOptions(world: World): IterableIterator<Alias> {
    // console.log();
    // console.log('=== Options ===');
    for (const item of world.catalog.genericEntities()) {
        if (item.kind === OPTION) {
            const token = CreateOption(item.pid, item.name);
            for (const alias of item.aliases) {
                const matcher = matcherFromExpression(alias);
                const pattern = patternFromExpression(alias);
                for (const text of aliasesFromPattern(pattern)) {
                    // console.log(`  ${text}`);
                    yield { token, text, matcher };
                }
            }
        }
    }
}

export class LexicalAnalyzer {
    lexicon: Lexicon;
    tokenizer: Tokenizer;

    constructor(
        world: World,
        debugMode = false,
        intentsFile: string | undefined = undefined,
        quantifiersFile: string | undefined = undefined,
        unitsFile: string | undefined = undefined,
        stopwordsFile: string | undefined = undefined,
    ) {
        this.lexicon = new Lexicon();
        this.tokenizer = new Tokenizer(
            this.lexicon.termModel,
            this.lexicon.numberParser,
            debugMode
        );

        // Attributes
        this.lexicon.addDomain(generateAttributes(world));

        // Products
        this.lexicon.addDomain(generateProducts(world));

        // Options
        this.lexicon.addDomain(generateOptions(world));

        // Quantifiers
        if (quantifiersFile) {
            const quantifiers = aliasesFromYamlString(
                fs.readFileSync(quantifiersFile, 'utf8'),
                quantityTokenFactory);
            this.lexicon.addDomain(quantifiers);
        }

        // Units
        if (unitsFile) {
            const units = aliasesFromYamlString(
                fs.readFileSync(unitsFile, 'utf8'),
                unitTokenFactory);
            this.lexicon.addDomain(units);
        }

        // Intents
        if (intentsFile) {
            const intents = aliasesFromYamlString(
                fs.readFileSync(intentsFile, 'utf8'),
                intentTokenFactory);
            this.lexicon.addDomain(intents);
        }
        
        // Stopwords
        if (stopwordsFile) {
            const stopwords = stopwordsFromYamlString(
                fs.readFileSync(stopwordsFile, 'utf8'));
            const stopwordTokens = tokensFromStopwords(stopwords);
            this.lexicon.addDomain(stopwordTokens, false);
        }

        this.lexicon.ingest(this.tokenizer);
    }

    // Generator for tokenizations of the input string that are equivanent to
    // the top-scoring tokenization.
    *tokenizations(query: string): IterableIterator<Token[]> {
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        // TODO: terms should be stemmed and hashed by TermModel in Lexicon.
        const graph = this.tokenizer.generateGraph(hashed, stemmed);
        const paths = equivalentPaths(graph.edgeLists, graph.findPath([], 0));

        for (const path of paths) {
            const tokens: Token[] = [];
            let termIndex = 0;
            for (const [index, edge] of path.entries()) {
                let token = this.tokenizer.tokenFromEdge(edge);
                if (token.type === UNKNOWNTOKEN) {
                    const start = termIndex;
                    const end = termIndex + edge.length;
                    token = ({
                        type: WORD,
                        text: terms.slice(start, end).join('_').toUpperCase()
                    } as WordToken);
                }
                termIndex += edge.length;
                tokens.push(token);
            }
            yield tokens;
        }
    }
}
