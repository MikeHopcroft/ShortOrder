import * as fs from 'fs';

import {
    Alias,
    Edge,
    Graph,
    GraphWalker,
    Lexicon,
    Tokenizer,
    TokenizerAlias,
    Token,
    TermModel,
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

import { CreateAttribute, AttributeToken, ATTRIBUTE } from './attributes';
import { CreateEntity, EntityToken, ENTITY } from './entities';
import { intentTokenFactory } from './intents';
import { tokenToString } from './lexical_utilities';
import { CreateOption, OptionToken } from './options';
import { quantityTokenFactory } from './quantities';
import { unitTokenFactory } from './units';

import {
    aliasesFromYamlString,
    matcherFromExpression,
    patternFromExpression,
    tokensFromStopwords,
} from './lexical_utilities';

export interface Span {
    start: number;
    length: number;
}

export interface Tokenization {
    graph: Graph;
    tokens: Array<Token & Span>;
}

export class LexicalAnalyzer {
    lexicon: Lexicon;
    tokenizer: Tokenizer;

    private readonly aidToToken = new Map<AID, AttributeToken>();
    private readonly pidToToken = new Map<PID, Token>();

    constructor(
        world: World,
        debugMode = true,
        intentsFile: string | undefined = undefined,
        quantifiersFile: string | undefined = undefined,
        unitsFile: string | undefined = undefined,
        stopwordsFile: string | undefined = undefined,
    ) {
        this.lexicon = new Lexicon();
        addCustomStemmer(this.lexicon.termModel);
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

    // Generator for tokenizations of the input string that are equivanent to
    // the top-scoring tokenization.
    *tokenizations2(query: string): IterableIterator<Tokenization> {
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        const graph = this.tokenizer.generateGraph(hashed, stemmed);

        yield* equivalentPaths2(this.tokenizer, graph, graph.findPath([], 0));
    }

    // Generator for tokenizations of the input string that are equivanent to
    // the top-scoring tokenization.
    *tokenizationsFromGraph2(graph: Graph): IterableIterator<Tokenization> {
        yield* equivalentPaths2(this.tokenizer, graph, graph.findPath([], 0));
    }

    *allTokenizations(graph: Graph): IterableIterator<Tokenization> {
        yield* walk(this.tokenizer, graph, new GraphWalker(graph));
    }

    analyzePaths(query: string) {
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        const graph = this.tokenizer.generateGraph(hashed, stemmed);

        // XXX
        this.analyzePathsInGraph(
            this.tokenizer,
            graph.edgeLists,
            graph.findPath([], 0)
        );
    }

    private analyzePathsInGraph(
        tokenizer: Tokenizer,
        edgeLists: Edge[][],
        path: Edge[]
    ): void {
        const groups: Token[][] = [];
        let v = 0;
        for (const currentEdge of path) {
            const tokens = new Set<Token>();
            const group: Token[] = [];
            const vertex = edgeLists[v];
            for (const edge of vertex) {
                if (edge.score === currentEdge.score &&
                    edge.length === currentEdge.length)
                {
                    const token: Token = tokenizer.tokenFromEdge(edge);
                    if (!tokens.has(token)) {
                        tokens.add(token);
                        group.push(token);
                    }
                }
            }
            groups.push(group);
            v += currentEdge.length;
        }
    
        let product = 1;
        for (const tokens of groups) {
            if (tokens.length > 1) {
                product *= tokens.length;
                console.log(`${tokens.length}: ${tokens.map(tokenToString).join(', ')}`);
            }
        }

        console.log(`Equivalent path count: ${product}`);
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

///////////////////////////////////////////////////////////////////////////////
//
// Custom stemmer
//
///////////////////////////////////////////////////////////////////////////////
// TODO: This seems like a hack.
// Consider alternative to monkey patch.
// Consider making data-driven.
function addCustomStemmer(model: TermModel) {
    const stem = model.stem;
    model.stem = (term: string): string => {
        if (term.toLowerCase() === 'iced') {
            return 'iced';
        } else {
            return stem(term);
        }
    };
}

///////////////////////////////////////////////////////////////////////////////
//
// Path enumeration
//
///////////////////////////////////////////////////////////////////////////////

// Exercises the GraphWalker API to generates all paths in a graph.
function* walk(
    tokenizer: Tokenizer,
    graph: Graph,
    walker: GraphWalker
): IterableIterator<Tokenization> {
    while (true) {
        // Advance down next edge in current best path.
        walker.advance();

        if (walker.complete()) {
            // If the path is complete, ie it goes from the first vertex to the
            // last vertex, then yield the path.
            const path: Edge[] = [...walker.left, ...walker.right];
            const tokens = new Array<Token & Span>();
            let start = 0;
            for (const edge of path) {
                tokens.push({
                    ...tokenizer.tokenFromEdge(edge),
                    start,
                    length: edge.length
                });
                start += edge.length;
            }
            yield({
                graph,
                tokens
            });
        }
        else {
            // Otherwise, walk further down the path.
            yield* walk(tokenizer, graph, walker);
        }

        // We've now explored all paths down this edge.
        // Retreat back to the previous vertex.
        walker.retreat(true);
    
        // Then, attempt to discard the edge we just explored. If, after
        // discarding, there is no path to the end then break out of the loop.
        // Otherwise go back to the top to explore the new path.
        if (!walker.discard()) {
            break;
        }
    }
}


function *equivalentPaths2(
    tokenizer: Tokenizer,
    graph: Graph,
    path: Edge[]
): IterableIterator<Tokenization> {
    yield* equivalentPathsRecursion2(tokenizer, graph, 0, 0, path, []);
}

function *equivalentPathsRecursion2(
    tokenizer: Tokenizer,
    graph: Graph,
    e: number,
    v: number,
    path: Edge[],
    prefix: Array<Token & Span>
): IterableIterator<Tokenization> {
    if (prefix.length === path.length) {
        // Recursive base case. Return the list of edges.
        yield {
            graph,
            tokens: [...prefix],
        };
    }
    else {
        // Recursive case. Enumerate all equivalent edges from this vertex.
        const tokens = new Set<Token>();
        const currentEdge = path[e];
        const vertex =graph.edgeLists[v];
        for (const edge of vertex) {
            if (edge.score === currentEdge.score &&
                edge.length === currentEdge.length)
            {
                const token: Token = tokenizer.tokenFromEdge(edge);
                if (!tokens.has(token)) {
                    tokens.add(token);
                    prefix.push({
                        ...token,
                        start: v,
                        length: edge.length
                        // TODO: consider storing reference to token here
                        // in case downstream users want to check for object
                        // equality.
                    });
                    yield* equivalentPathsRecursion2(
                        tokenizer,
                        graph,
                        e + 1,
                        v + currentEdge.length,
                        path,
                        prefix
                    );
                    prefix.pop();
                }
            }
        }
    }
}
