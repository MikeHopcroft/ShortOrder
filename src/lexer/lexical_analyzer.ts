import * as fs from 'fs';

import {
    Alias,
    Edge,
    Lexicon,
    Tokenizer,
    Token,
    TermModel,
    Graph,
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

import { CreateAttribute, AttributeToken } from './attributes';
import { CreateEntity, EntityToken } from './entities';
import { intentTokenFactory } from './intents';
import { tokenToString } from './lexical_utilities';
import { CreateOption } from './options';
import { quantityTokenFactory } from './quantities';
import { unitTokenFactory } from './units';

import {
    aliasesFromYamlString,
    matcherFromExpression,
    patternFromExpression,
    tokensFromStopwords,
} from './lexical_utilities';

interface TokenX {
    start: number;
    length: number;
    token: Token;
}

interface Tokenization {
    graph: Graph;
    tokens: TokenX[];
}

export class LexicalAnalyzer {
    lexicon: Lexicon;
    tokenizer: Tokenizer;

    private readonly aidToToken = new Map<AID, AttributeToken>();
    private readonly pidToToken = new Map<PID, EntityToken>();

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

        this.lexicon.ingest(this.tokenizer);
    }

    private *indexEntityTokens(
        entries: IterableIterator<[EntityToken, string]>
    ): IterableIterator<[Token, string]> {
        for (const entry of entries) {
            const token = entry[0];
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
            yield entry;
        }
    }

    private *indexAttributeTokens(
        entries: IterableIterator<[AttributeToken, string]>
    ): IterableIterator<[Token, string]> {
        for (const entry of entries) {
            const token = entry[0];
            // TODO: rename AttributeToken.id to aid.
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
            yield entry;
        }
    }

    getEntityToken(pid: PID): EntityToken {
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
    *tokenizations(query: string): IterableIterator<Token[]> {
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        const graph = this.tokenizer.generateGraph(hashed, stemmed);

        yield* equivalentPaths2(this.tokenizer, graph.edgeLists, graph.findPath([], 0));
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
export function *equivalentPaths2(
    tokenizer: Tokenizer,
    edgeLists: Edge[][],
    path: Edge[]
): IterableIterator<Token[]> {
    yield* equivalentPathsRecursion2(tokenizer, edgeLists, 0, 0, path, []);
}

function *equivalentPathsRecursion2(
    tokenizer: Tokenizer,
    edgeLists: Edge[][],
    e: number,
    v: number,
    path: Edge[],
    prefix: Token[]
): IterableIterator<Token[]> {
    if (prefix.length === path.length) {
        // Recursive base case. Return the list of edges.
        yield [...prefix];
    }
    else {
        // Recursive case. Enumerate all equivalent edges from this vertex.
        const tokens = new Set<Token>();
        const currentEdge = path[e];
        const vertex = edgeLists[v];
        for (const edge of vertex) {
            if (edge.score === currentEdge.score &&
                edge.length === currentEdge.length)
            {
                const token: Token = tokenizer.tokenFromEdge(edge);
                if (!tokens.has(token)) {
                    tokens.add(token);
                    prefix.push(token);
                    yield* equivalentPathsRecursion2(
                        tokenizer,
                        edgeLists,
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
