import * as style from 'ansi-styles';

import {
    describeGeneric,
    describeSpecific,
    IReplExtension,
    IReplExtensionFactory,
    printCatalog,
    ReplProcessor,
    rightJustify,
} from 'prix-fixe';

import {
    IRepl,
    OPTION,
    PID,
    speechToTextFilter,
    World,
} from 'prix-fixe';

import { DownstreamTermPredicate, Graph, levenshtein } from 'token-flow';

import { createShortOrderWorld, ShortOrderWorld } from '../integration';

import {
    coalesceGraph,
    ENTITY,
    EntityToken,
    filterGraph,
    tokenToString,
    OptionToken,
    LexicalAnalyzer
} from '../lexer';

export class ShortOrderReplExtension implements IReplExtension {
    world: World;
    world2: ShortOrderWorld;
    lexer: LexicalAnalyzer;

    // Prefix for token-flow scoring.
    // Set by .prefix command.
    // Used by .score command.
    prefix = '';

    constructor(world: World, dataPath: string) {
        this.world = world;
        this.world2 = createShortOrderWorld(world, dataPath, false);
        this.lexer = this.world2.lexer;
    }

    name() {
        return 'short-order';
    }

    registerCommands(repl: IRepl): void {
        repl.server().defineCommand('prefix', {
            help: 'Sets the prefix for subsequent token-flow .score command',
            action: (text: string) => {
                this.prefix = text;
                console.log(`token-flow prefix = ${this.prefix}`);
                repl.server().displayPrompt();
            }
        });

        repl.server().defineCommand('query', {
            help: 'Uses token-flow to score match against prefix.',
            action:(query: string) => {
                if (this.prefix.length < 1) {
                    console.log('No prefix set. First set a prefix string with the .prefix command.');
                } else {
                    console.log(`token-flow query = ${query}`);

                    const termsPrefix = this.prefix.split(/\s+/);
                    const stemmedPrefix = termsPrefix.map(this.world2.lexer.lexicon.termModel.stem);
                    const hashedPrefix = stemmedPrefix.map(this.world2.lexer.lexicon.termModel.hashTerm);

                    const termsQuery = query.split(/\s+/);
                    const stemmedQuery = termsQuery.map(this.world2.lexer.lexicon.termModel.stem);
                    const hashedQuery = stemmedQuery.map(this.world2.lexer.lexicon.termModel.hashTerm);
                    
                    const isDownstreamTerm: DownstreamTermPredicate<number> = (n: number) => false;

                    const match = levenshtein(
                        hashedQuery,
                        hashedPrefix,
                        isDownstreamTerm,
                        this.lexer.lexicon.termModel.isTokenHash
                    );

                    const tokenizer = this.world2.lexer.tokenizer;
                    const debugMode = tokenizer['debugMode'];
                    tokenizer['debugMode'] = true;
                    const results = this.world2.lexer.tokenizer.score(
                        hashedQuery,
                        hashedPrefix,
                        isDownstreamTerm,
                        match
                    );
                    tokenizer['debugMode'] = debugMode;
                }

                repl.server().displayPrompt();
            }
        });

        repl.server().defineCommand('match', {
            help: 'List fuzzy matches in order of decreasing score.',
            action: (text: string) => {
                const graph = this.lexer.createGraph(text);
                const tokenization = this.lexer.tokenizationsFromGraph2(graph).next().value;

                interface Match {
                    token: EntityToken | OptionToken;
                    score: number;
                }

                const tokens = new Array<[EntityToken | OptionToken, number]>();
                for (const edge of graph.edgeLists[0]) {
                    const token = this.lexer.tokenizer.tokenFromEdge(edge) as EntityToken | OptionToken;
                    if (token.type === ENTITY || token.type === OPTION) {
                        tokens.push([token, edge.score]);
                    }
                }

                const sorted = [...tokens.values()].sort((a,b) => {
                    const delta = b[1] - a[1];
                    if (isFinite(delta)) {
                        return delta;
                    } else {
                        return isFinite(a[1]) ? -1: 1;
                    }
                });

                if (sorted.length === 0) {
                    console.log(`No items matching "${text}".`);
                } else {
                    for (const [token, score] of sorted) {
                        const scoreText = rightJustify(score.toFixed(3), 6);
                        if (token.type === ENTITY) {
                            console.log(`${scoreText}: ${token.name} (${token.pid})`);
                        } else if (token.type === OPTION) {
                            console.log(`${scoreText}: ${token.name} (${token.id})`);
                        }
                    }
                }
                console.log(' ');

                repl.server().displayPrompt();
            }
        });

        repl.server().defineCommand('tokenize', {
            help: "Tokenize, but don't parse, text that follows.",
            action: (line: string) => {

                const text = speechToTextFilter(line);
                if (text !== line) {
                    console.log(`${style.red.open}`);
                    console.log('********************************************************');
                    console.log('PLEASE NOTE: your input has been modified to be more');
                    console.log('like the output of a speech-to-text system.');
                    console.log(`your input: "${line}"`);
                    console.log(`modified:   "${text}"`);
                    console.log('********************************************************');
                    console.log(`${style.red.close}`);
                }
        
                const rawGraph = this.lexer.createGraph(text);
                const baseGraph: Graph = coalesceGraph(this.lexer.tokenizer, rawGraph);
            
                // TODO: REVIEW: MAGIC NUMBER
                // 0.35 is the score cutoff for the filtered graph.
                const filteredGraph: Graph = filterGraph(baseGraph, 0.35);
                const tokenizations = this.lexer.tokenizationsFromGraph2(filteredGraph);

                let counter = 0;
                // for (const tokenization of tokenizations) {
                //     console.log(`${counter}: ${tokenization.map(tokenToString).join(' ')}`);
                //     counter++;
                // }

                const terms = line.split(/\s+/);
                counter = 0;
                for (const tokenization of tokenizations) {
                    console.log(`Tokenization ${counter}:`);
                    counter++;
                    for (const token of tokenization) {
                        const tokenText = tokenToString(token);
                        const spanText = terms.slice(token.start, token.start + token.length).join(' ');
                        console.log(`  ${tokenText}: "${spanText}"`);
                    }
                }
                
                repl.server().displayPrompt();
            }
        });

        repl.server().defineCommand('menu', {
            help: "Display menu",
            action: (line: string) => {
                const catalog = this.world.catalog;
                const world = this.world;

                if (line.length === 0) {
                    // No Key or PID was specified. Print out name of all of the
                    // MENUITEM generics.
                    printCatalog(catalog);
                }
                else if (line.indexOf(':') !== -1) {
                    // This is a specific entity. Just print out its options.
                    const key = line.trim();
                    describeSpecific(world, key);
                } else if (!isNaN(Number(line))) {
                    // This is a generic entity. Print out its attributes and options.
                    const pid: PID = Number(line);
                    describeGeneric(world, pid);
                }
                else {
                    // Parameter doesn't seem to be a Key or PID.
                    // Try using the tokenizer to identify it.
                    printMatchingGenerics(this.lexer, line);
                }
                repl.server().displayPrompt();
            }
        });
    }

    createProcessor(): ReplProcessor {
        return {
            name: 'so',
            description: 'short-order',
            processor: this.world2.processor
        };
    }
}

export const shortOrderReplExtensionFactory: IReplExtensionFactory = {
    create: (world: World, dataPath: string) => {
        return new ShortOrderReplExtension(world, dataPath);
    }
};

export function printMatchingGenerics(lexer: LexicalAnalyzer, text: string) {
    const graph = lexer.createGraph(text);
    // const tokenization = lexer.tokenizationsFromGraph2(graph).next().value;

    const tokens = new Set<EntityToken | OptionToken>();
    for (const edge of graph.edgeLists[0]) {
        const token = lexer.tokenizer.tokenFromEdge(edge) as EntityToken | OptionToken;
        if (token.type === ENTITY || token.type === OPTION) {
            tokens.add(token);
        }
    }

    const sorted = [...tokens.values()].sort((a,b) => a.name.localeCompare(b.name));

    if (sorted.length === 0) {
        console.log(`No items matching "${text}".`);
    } else {
        for (const token of sorted) {
            if (token.type === ENTITY) {
                console.log(`${token.name} (${token.pid})`);
            } else if (token.type === OPTION) {
                console.log(`${token.name} (${token.id})`);
            }
        }
    }
    console.log(' ');
}
