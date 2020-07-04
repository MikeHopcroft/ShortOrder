import * as fs from 'fs';

import {
    Alias,
    allTokenizations,
    Edge,
    Graph,
    Lexicon,
    maximalPaths,
    maximalTokenizations,
    Tokenizer,
    TokenizerAlias,
    Token,
    coalesceGraph,
} from 'token-flow';

import {
    AID,
    aliasesFromPattern,
    MENUITEM,
    OPTION,
    PID,
    World,
} from 'prix-fixe';

import { stopwordsFromYamlString } from '../stopwords';

import { createAttribute, AttributeToken, ATTRIBUTE } from './attributes';
import { generateRecipes } from './cookbook';
import { createEntity, EntityToken, ENTITY } from './entities';
import { IntentTokenFactory } from './intents';
import { ILexicalAnalyzer, Span } from './interfaces';

import {
    aliasesFromYamlString,
    matcherFromExpression,
    patternFromExpression,
    tokensFromStopwords,
} from './lexical_utilities';

import { createOption, OptionToken } from './options';
import { quantityTokenFactory } from './quantities';
import { unitTokenFactory } from './units';

export class LexicalAnalyzer implements ILexicalAnalyzer {
    lexicon: Lexicon;
    tokenizer: Tokenizer;

    private readonly aidToToken = new Map<AID, AttributeToken>();
    private readonly pidToToken = new Map<PID, Token>();

    constructor(
        world: World,
        lexicon?: Lexicon,
        debugMode = true,
        intentsFile?: string,
        quantifiersFile?: string,
        unitsFile?: string,
        stopwordsFile?: string,
    ) {
        if (lexicon) {
            this.lexicon = lexicon;
        } else {
            this.lexicon = new Lexicon();
        }

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

        // Cookbook
        this.lexicon.addDomain(generateRecipes(world));

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
            const factory = new IntentTokenFactory();
            const intents = aliasesFromYamlString(
                fs.readFileSync(intentsFile, 'utf8'),
                factory.createToken);
            this.lexicon.addDomain(intents);
        }
        
        // Stopwords
        if (stopwordsFile) {
            const stopwords = stopwordsFromYamlString(
                fs.readFileSync(stopwordsFile, 'utf8'));
            const stopwordTokens = tokensFromStopwords(stopwords);
            this.lexicon.addDomain(stopwordTokens, false);
        }

        // Ingest the lexicon into the tokenizer.
        this.lexicon.ingest(this.tokenizer);

        // Use ingest method to index attribute and entity tokens.
        const addItem = (alias: TokenizerAlias):void => {
            const token = alias.token as AttributeToken | EntityToken | OptionToken;
            if (token.type === ENTITY) {
                const existing = this.pidToToken.get(token.pid);
                if (existing) {
                    if (token !== existing) {
                        const message =
                            `indexEntityTokens: tokens must be unique  (pid=${token.pid}).`;
                        throw TypeError(message);
                    }
                } else {
                    this.pidToToken.set(token.pid, token);
                }
            } else if (token.type === OPTION) {
                const existing = this.pidToToken.get(token.id);
                if (existing) {
                    if (token !== existing) {
                        const message =
                            `indexEntityTokens: tokens must be unique  (pid=${token.id}).`;
                        throw TypeError(message);
                    }
                } else {
                    this.pidToToken.set(token.id, token);
                }
            } else if (token.type === ATTRIBUTE) {
                const existing = this.aidToToken.get(token.id);
                if (existing) {
                    if (token !== existing) {
                        const message =
                            `indexAttributeTokens: tokens must be unique  (aid=${token.id}).`;
                        throw TypeError(message);
                    }
                } else {
                    this.aidToToken.set(token.id, token);
                }
            }
        };

        this.lexicon.ingest({addItem});
    }

    getEntityToken(pid: PID): Token {
        const token = this.pidToToken.get(pid);
        if (!token) {
            const message = `getEntityToken(): unknown PID ${pid}.`;
            throw TypeError(message);
        }
        return token;
    }

    getAttributeToken(aid: AID): AttributeToken {
        const token = this.aidToToken.get(aid);
        if (!token) {
            const message = `getAttributeToken(): unknown AID ${aid}.`;
            throw TypeError(message);
        }
        return token;
    }

    createGraph(query: string): Graph {
        const terms = this.lexicon.termModel.breakWords(query);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);
        const rawGraph = this.tokenizer.generateGraph(hashed, stemmed);
        return rawGraph;

        // DESIGN NOTE: coalesced graph is not needed because maximalPaths()
        // calls addTopScoringBackLink() which coalesces paths on the fly.
        //
        // const coalesced = coalesceGraph(this.tokenizer, rawGraph);
        // return coalesced;

        // return this.tokenizer.generateGraph(hashed, stemmed);
    }

    // Generator for tokenizations of the input string that are equivanent to
    // the top-scoring tokenization.
    *tokenizationsFromGraph2(graph: Graph): IterableIterator<Array<Token & Span>> {
        yield* maximalTokenizations(graph.edgeLists);
    }

    *pathsFromGraph2(graph: Graph): IterableIterator<Edge[]> {
        yield* maximalPaths(graph.edgeLists);
    }

    *allTokenizations(graph: Graph): IterableIterator<Array<Token & Span>> {
        yield* allTokenizations(graph.edgeLists);
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// Catalog items and aliases
//
///////////////////////////////////////////////////////////////////////////////
function* generateAliases(
    entries: IterableIterator<[Token, string]>
): IterableIterator<Alias> {
    for (const [token, aliases] of entries) {
        for (const alias of aliases) {
            const matcher = matcherFromExpression(alias);
            const pattern = patternFromExpression(alias);
            for (const text of aliasesFromPattern(pattern)) {
                yield { token, text, matcher };
            }
        }
    }
}

// Prints out information about dimensions associated with a set of DIDs.
export function* generateAttributes(world: World): IterableIterator<Alias> {
    for (const dimension of world.attributes.dimensions) {
        // console.log(`  Dimension(${dimension.did}): ${dimension.name}`);
        for (const attribute of dimension.attributes) {
            // console.log(`    Attribute(${attribute.aid})`);
            const token = createAttribute(attribute.aid, attribute.name);
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

export function* generateProducts(world: World): IterableIterator<Alias> {
    // console.log();
    // console.log('=== Products ===');
    for (const item of world.catalog.genericEntities()) {
        if (item.kind === MENUITEM) {
            const token = createEntity(item.pid, item.name);
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

export function* generateOptions(world: World): IterableIterator<Alias> {
    // console.log();
    // console.log('=== Options ===');
    for (const item of world.catalog.genericEntities()) {
        if (item.kind === OPTION) {
            const token = createOption(item.pid, item.name);
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

export function createSpan(spans: Span[]): Span {
    if (spans.length === 0) {
        return { start:0, length: 0 };
    } else {
        const first = spans[0];
        const last = spans[spans.length - 1];
        return {
            start: first.start,
            length: last.start + last.length - first.start
        };
    }
}
