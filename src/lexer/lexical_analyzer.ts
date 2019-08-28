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
    DynamicGraph,
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
import { generateRecipes } from './cookbook';
import { CreateEntity, EntityToken, ENTITY } from './entities';
import { intentTokenFactory, IntentTokenFactory } from './intents';

import {
    aliasesFromYamlString,
    matcherFromExpression,
    patternFromExpression,
    tokensFromStopwords,
    tokenToString,
} from './lexical_utilities';

import { CreateOption, OptionToken } from './options';
import { quantityTokenFactory } from './quantities';
import { unitTokenFactory } from './units';


export interface Span {
    start: number;
    length: number;
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
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);
        return this.tokenizer.generateGraph(hashed, stemmed);
    }

    // Generator for tokenizations of the input string that are equivanent to
    // the top-scoring tokenization.
    *tokenizationsFromGraph2(graph: Graph): IterableIterator<Array<Token & Span>> {
        yield* equivalentPaths2(this.tokenizer, graph, graph.findPath([], 0));
    }

    *allTokenizations(graph: Graph): IterableIterator<Array<Token & Span>> {
        yield* walk(this.tokenizer, graph, new GraphWalker(graph));
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
            // Fix for confusion between the adjective, "iced", and the
            // noun, "ice".
            return 'iced';
        } else if (term.toLowerCase() === "that's") {
            // Fix for confusion between the pronoun, "that", and the
            // contraction, "that's".
            return "that's";
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
): IterableIterator<Array<Token & Span>> {
    yield* walkRecursion(tokenizer, graph, walker);

    // IMPORTANT: the tokenize() function will talk this graph
    // multiple times. Ensure that discarded edges are restored
    // after walking.
    for (const e of graph.edgeLists[0]) {
        e.discarded = false;
    }
}

function* walkRecursion(
    tokenizer: Tokenizer,
    graph: Graph,
    walker: GraphWalker
): IterableIterator<Array<Token & Span>> {
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
            yield(tokens);
        }
        else {
            // Otherwise, walk further down the path.
            yield* walkRecursion(tokenizer, graph, walker);
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
): IterableIterator<Array<Token & Span>> {
    yield* equivalentPathsRecursion2(tokenizer, graph, 0, 0, path, []);
}

function *equivalentPathsRecursion2(
    tokenizer: Tokenizer,
    graph: Graph,
    e: number,
    v: number,
    path: Edge[],
    prefix: Array<Token & Span>
): IterableIterator<Array<Token & Span>> {
    if (prefix.length === path.length) {
        // Recursive base case. Return the list of edges.
        yield [...prefix];
    }
    else {
        // Recursive case. Enumerate all equivalent edges from this vertex.
        const tokens = new Set<Token>();
        const currentEdge = path[e];
        const vertex = graph.edgeLists[v];
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

///////////////////////////////////////////////////////////////////////////////
//
// Graph filtering - TEMPORARY
// TODO: Remove this code - this should probably move into token-flow.
//
///////////////////////////////////////////////////////////////////////////////
class Map2D<A,B,V> {
    entries = new Map<A, Map<B,V>>();

    get(a:A, b:B): V | undefined {
        const d2 = this.entries.get(a);
        if (d2) {
            return d2.get(b);
        } else {
            return undefined;
        }
    }

    set(a:A, b:B, v:V): void {
        const d2 = this.entries.get(a);
        if (d2) {
            d2.set(b, v);
        } else {
            const d = new Map<B, V>();
            d.set(b, v);
            this.entries.set(a, d);
        }
    }

    *values(): IterableIterator<V> {
        for (const d2 of this.entries.values()) {
            yield* d2.values();
        }
    }
}

export function coalesceGraph(tokenizer: Tokenizer, graph: Graph) {
    const edgeLists: Edge[][] = [];
    // Copy and filter all but the last edgeList, which is added by the
    // DynamicGraph constructor.
    for (let i = 0; i < graph.edgeLists.length - 1; ++i) {
        const edgeList = graph.edgeLists[i];
    // for (const edgeList of graph.edgeLists) {
        const edges = new Map2D<Token,number,Edge>();

        for (const edge of edgeList) {
            // Don't copy default edges.
            if (edge.label !== -1) {
                const token = tokenizer.tokenFromEdge(edge);
                const existing = edges.get(token, edge.length);
                if (existing) {
                    // Keep only the highest scoring edge for each
                    // (token, length) pair.
                    if (existing.score < edge.score) {
                        edges.set(token, edge.length, edge);
                    }
                } else {
                    edges.set(token, edge.length, edge);
                }
            }
        }
        const filtered = [...edges.values()].sort((a,b) => b.score - a.score);
        edgeLists.push(filtered);
    }

    return new DynamicGraph(edgeLists);
}

export function filterGraph(graph: Graph, threshold: number) {
    const edgeLists: Edge[][] = [];

    // Copy and filter all but the last edgeList, which is added by the
    // DynamicGraph constructor.
    for (let i = 0; i < graph.edgeLists.length - 1; ++i) {
        const edgeList = graph.edgeLists[i];
    // for (const edgeList of graph.edgeLists) {
        const edges: Edge[] = [];

        for (const edge of edgeList) {
            if ((edge.score >= threshold) && (edge.label !== -1)) {
                edges.push(edge);
            }
        }

        edgeLists.push(edges);
    }

    const g2 = new DynamicGraph(edgeLists);
    for (const edgeList of g2.edgeLists) {
        edgeList.sort((a,b) => b.score - a.score);
    }
    return g2;
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