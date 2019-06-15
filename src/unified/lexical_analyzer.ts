import * as fs from 'fs';

import {
    Alias,
    levenshtein,
    Lexicon,
    Tokenizer,
    Token,
    UNKNOWNTOKEN,
} from 'token-flow';


// import {
//     DiffResults,
//     DownstreamTermPredicate,
//     EqualityPredicate,
//     exactPrefix,
//     generateAliases,
//     GenericEquality,
//     Hash,
//     Item,
//     itemMapFromYamlString,
//     levenshtein,
//     Lexicon,
//     Matcher,
//     NumberToken,
//     Token,
//     Tokenizer,
//     TokenPredicate,
//     UNKNOWNTOKEN,
//     NUMBERTOKEN
// } from 'token-flow';

// import { attributesFromYamlString, itemsFromAttributes } from '../attributes/schema';

// import { ATTRIBUTE, AttributeToken, attributeTokenFactory } from './attributes';
// import { ENTITY, EntityToken, entityTokenFactory } from './entities';
import { intentTokenFactory } from './intents';
// import { OPTION, OptionToken } from './options';
import { QUANTITY, QuantityToken, quantityTokenFactory } from './quantities';
import { stopwordsFromYamlString, Stopwords } from '../stopwords';
import { UNIT, UnitToken, unitTokenFactory } from './units';

import {
    aliasesFromPattern,
    DID,
    MENUITEM,
    OPTION,
    setup,
    World,
    DimensionAndTensorDescription,
} from 'prix-fixe';

import { CreateAttribute } from './attributes';
import { CreateEntity } from './entities';
import { CreateOption } from './options';

import {
    aliasesFromYamlString,
    matcherFromExpression,
    patternFromExpression,
    tokensFromStopwords
} from './unified';


export const WORD: unique symbol = Symbol('WORD');
export type WORD = typeof WORD;

export interface WordToken extends Token {
    type: WORD;
    text: string;
}


// function attributeAliases(world: World, dimensions: Set<DID>) {
//     for (const did of dimensions.values()) {
//         const d = world.attributeInfo.getDimension(did);
//         console.log(`  Dimension(${d.did}): ${d.name}`);
//         for (const attribute of d.attributes) {
//             console.log(`    Attribute(${attribute.aid})`);
//             for (const alias of attribute.aliases) {
//                 const pattern = patternFromExpression(alias);
//                 for (const text of aliasesFromPattern(pattern)) {
//                     console.log(`      ${text}`);
//                 }
//             }
//         }
//     }
// }

// Prints out information about dimensions associated with a set of DIDs.
function* generateAttributes(world: World): IterableIterator<Alias> {
    for (const dimension of world.attributes.dimensions) {
        console.log(`  Dimension(${dimension.did}): ${dimension.name}`);
        for (const attribute of dimension.attributes) {
            console.log(`    Attribute(${attribute.aid})`);
            const token = CreateAttribute(attribute.aid, attribute.name);
            for (const alias of attribute.aliases) {
                const matcher = matcherFromExpression(alias);
                const pattern = patternFromExpression(alias);
                for (const text of aliasesFromPattern(pattern)) {
                    console.log(`      ${text}`);
                    yield { token, text, matcher };
                }
            }
        }
    }
}

function* generateProducts(world: World): IterableIterator<Alias> {
    console.log();
    console.log('=== Products ===');
    for (const item of world.catalog.genericEntities()) {
        if (item.kind === MENUITEM) {
            const token = CreateEntity(item.pid, item.name);
            for (const alias of item.aliases) {
                const matcher = matcherFromExpression(alias);
                const pattern = patternFromExpression(alias);
                for (const text of aliasesFromPattern(pattern)) {
                    console.log(`  ${text}`);
                    yield { token, text, matcher };
                }
            }
        }
    }
}

function* generateOptions(world: World): IterableIterator<Alias> {
    console.log();
    console.log('=== Options ===');
    for (const item of world.catalog.genericEntities()) {
        if (item.kind === OPTION) {
            const token = CreateOption(item.pid, item.name);
            for (const alias of item.aliases) {
                const matcher = matcherFromExpression(alias);
                const pattern = patternFromExpression(alias);
                for (const text of aliasesFromPattern(pattern)) {
                    console.log(`  ${text}`);
                    yield { token, text, matcher };
                }
            }
        }
    }
}



class LexicalAnalyzer {
    lexicon: Lexicon;
    tokenizer: Tokenizer;

    constructor(
        productsFile: string,
        optionsFile: string,
        attributesFile: string,
        rulesFile: string,
        intentsFile: string,
        quantifiersFile: string,
        unitsFile: string,
        stopwordsFile: string,
        debugMode = false
    ) {
        const world = setup(productsFile, optionsFile, attributesFile, rulesFile);

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
        const quantifiers = aliasesFromYamlString(
            fs.readFileSync(quantifiersFile, 'utf8'),
            quantityTokenFactory);
        this.lexicon.addDomain(quantifiers);

        // Units
        const units = aliasesFromYamlString(
            fs.readFileSync(unitsFile, 'utf8'),
            unitTokenFactory);
        this.lexicon.addDomain(units);

        // Intents
        const intents = aliasesFromYamlString(
            fs.readFileSync(intentsFile, 'utf8'),
            intentTokenFactory);
        this.lexicon.addDomain(intents);
        
        // Stopwords
        const stopwords = stopwordsFromYamlString(
            fs.readFileSync(stopwordsFile, 'utf8'));
        const stopwordTokens = tokensFromStopwords(stopwords);
        this.lexicon.addDomain(stopwordTokens, false);

        this.lexicon.ingest(this.tokenizer);
    }

    processOneQuery(query: string): Token[] {
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        // TODO: terms should be stemmed and hashed by TermModel in Lexicon.
        const graph = this.tokenizer.generateGraph(hashed, stemmed);
        const path = graph.findPath([], 0);

        const tokens: Token[] = [];
        for (const [index, edge] of path.entries()) {
            let token = this.tokenizer.tokenFromEdge(edge);
            if (token.type === UNKNOWNTOKEN) {
                const end = index + 1;
                const start = end - edge.length;
                token = ({
                    type: WORD,
                    text: terms.slice(start, end).join('_').toUpperCase()
                } as WordToken);
            }
            tokens.push(token);
        }

        return tokens;
    }
}
