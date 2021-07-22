import style from 'ansi-styles';
import Debug from 'debug';
import minimist from 'minimist';

import {
    describeGeneric,
    describeSpecific,
    IRepl,
    IReplExtension,
    IReplExtensionFactory,
    Key,
    OPTION,
    PID,
    printCatalog,
    ReplProcessor,
    rightJustify,
    speechToTextFilter,
    World,
    MENUITEM,
} from 'prix-fixe';

import {
    DownstreamTermPredicate,
    filterGraph,
    Graph,
    levenshtein,
    maximalTokenizations
} from 'token-flow';

import { createShortOrderWorld, loadShortOrderWorld, ShortOrderWorld } from '../integration';

import {
    ENTITY,
    EntityToken,
    ILexicalAnalyzer,
    OptionToken,
    Span,
    tokenToString,
} from '../lexer';

import { Parser, productTargets, HypotheticalItem } from '../parser';

export class ShortOrderReplExtension implements IReplExtension {
    world: World;
    world2: ShortOrderWorld;
    lexer: ILexicalAnalyzer;

    // Prefix for token-flow scoring.
    // Set by .prefix command.
    // Used by .query command.
    prefix = '';

    constructor(world: World, dataPath: string) {
        // TODO: figure out how to merge command-line argument processing
        // across multiple extensions.
        const args = minimist(process.argv.slice());

        this.world = world;
        // this.world2 = createShortOrderWorld(world, dataPath, args.t, false);
        this.world2 = loadShortOrderWorld(world, dataPath, args.t, false);
        this.lexer = this.world2.lexer;

        Debug.enable('tf-interactive,tf:*');
    }

    name() {
        return 'short-order';
    }

    registerCommands(repl: IRepl): void {
        repl.getReplServer().defineCommand('prefix', {
            help: 'Sets the prefix for subsequent token-flow .query command',
            action: (text: string) => {
                this.prefix = text;
                console.log(`token-flow prefix = ${this.prefix}`);
                repl.getReplServer().displayPrompt();
            }
        });

        repl.getReplServer().defineCommand('query', {
            help: 'Uses token-flow to score match against prefix.',
            action:(query: string) => {
                if (this.prefix.length < 1) {
                    console.log('No prefix set. First set a prefix string with the .prefix command.');
                } else {
                    console.log(`token-flow query = ${query}`);

                    const termsPrefix = this.lexer.lexicon.termModel.breakWords(query);
                    const stemmedPrefix = termsPrefix.map(this.world2.lexer.lexicon.termModel.stem);
                    const hashedPrefix = stemmedPrefix.map(this.world2.lexer.lexicon.termModel.hashTerm);

                    const termsQuery = this.lexer.lexicon.termModel.breakWords(query);
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
                    console.log(`score=${results.score}, length=${results.length}`);
                    tokenizer['debugMode'] = debugMode;
                }

                repl.getReplServer().displayPrompt();
            }
        });

        repl.getReplServer().defineCommand('match', {
            help: 'List fuzzy matches in order of decreasing score.',
            action: (text: string) => {
                const graph = this.lexer.createGraph(text);

                const tokens = new Map<EntityToken | OptionToken, number>();
                for (const edge of graph.edgeLists[0]) {
                    const token = edge.token as EntityToken | OptionToken;
                    if (token.type === ENTITY || token.type === OPTION) {
                        const score = tokens.get(token);
                        if (score === undefined || edge.score > score) {
                            tokens.set(token, edge.score);
                        }
                    }
                }

                const sorted = [...tokens.entries()].sort((a,b) => {
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

                repl.getReplServer().displayPrompt();
            }
        });

        repl.getReplServer().defineCommand('tokenize', {
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

                // TODO: REVIEW: MAGIC NUMBER
                // 0.35 is the score cutoff for the filtered graph.
                const filteredGraph: Graph = filterGraph(rawGraph, 0.35);

                // console.log('Original graph:');
                // for (const [i, edges] of rawGraph.edgeLists.entries()) {
                //     console.log(`  vertex ${i}`);
                //     for (const edge of edges) {
                //         const token = tokenToString(this.lexer.tokenizer.tokenFromEdge(edge));
                //         console.log(`    length:${edge.length}, score:${edge.score}, token:${token}`);
                //     }
                // }
                // console.log('Filtered graph:');
                // for (const [i, edges] of baseGraph.edgeLists.entries()) {
                //     console.log(`  vertex ${i}`);
                //     for (const edge of edges) {
                //         const token = tokenToString(this.lexer.tokenizer.tokenFromEdge(edge));
                //         console.log(`    length:${edge.length}, score:${edge.score}, token:${token}`);
                //     }
                // }

                const tokenizations = maximalTokenizations(filteredGraph.edgeLists);

                const terms = this.lexer.lexicon.termModel.breakWords(line);
                let counter = 0;
                for (const tokenization of tokenizations) {
                    console.log(`Tokenization ${counter}:`);
                    counter++;
                    for (const token of tokenization) {
                        const tokenText = tokenToString(token);
                        const spanText = terms.slice(token.start, token.start + token.length).join(' ');
                        console.log(`  ${tokenText}: "${spanText}"`);
                    }
                }

                console.log(' ');
                
                repl.getReplServer().displayPrompt();
            }
        });

        repl.getReplServer().defineCommand('menu', {
            help: "Display menu",
            action: (line: string) => {
                const world = this.world;

                if (line.length === 0) {
                    // No Key or PID was specified. Print out name of all of the
                    // MENUITEM generics.
                    printCatalog(world, MENUITEM);
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
                repl.getReplServer().displayPrompt();
            }
        });

        repl.getReplServer().defineCommand('stem', {
            help: "Stem, but don't parse, text that follows",
            action: (line: string) => {
                const text = line;
                const terms = this.lexer.lexicon.termModel.breakWords(text);
                const stemmed = terms.map(this.lexer.lexicon.termModel.stem);
                console.log(stemmed.join(' '));
                repl.getReplServer().displayPrompt();
            }
        });

        repl.getReplServer().defineCommand('graph', {
            help: "Display graph for text that follows",
            action: (line: string) => {
                const text = line;

                const terms = this.lexer.lexicon.termModel.breakWords(text);

                const rawGraph: Graph = this.lexer.createGraph(text);

                // TODO: REVIEW: MAGIC NUMBER
                // 0.35 is the score cutoff for the filtered graph.
                const filteredGraph: Graph = filterGraph(rawGraph, 0.35);

                for (const [i, edges] of filteredGraph.edgeLists.entries()) {
                    console.log(`  vertex ${i}: "${terms[i]}"`);
                    for (const edge of edges) {
                        const token = tokenToString(edge.token);
                        console.log(`    length:${edge.length}, score:${edge.score.toFixed(2)}, token:${token}`);
                    }
                }

                repl.getReplServer().displayPrompt();
            }
        });

        repl.getReplServer().defineCommand('targets', {
            help: "Display targets for text that follows",
            action: (line: string) => {
                const text = line;

                const terms = this.lexer.lexicon.termModel.breakWords(text);

                const rawGraph: Graph = this.lexer.createGraph(text);

                // TODO: REVIEW: MAGIC NUMBER
                // 0.35 is the score cutoff for the filtered graph.
                // const filteredGraph: Graph = filterGraph(rawGraph, 0.35);
                // Don't filter graph for targets because they are often
                // abbreviated entity names that have poor scores.
                const filteredGraph = rawGraph;

                const state = repl.getState();
                const parser = new Parser(
                    this.world.cartOps,
                    this.world.catalog,
                    this.world.cookbook,
                    this.world.attributeInfo,
                    this.lexer,
                    this.world.ruleChecker,
                    false
                );
                const span: Span = {
                    start: 0,
                    length: terms.length
                };

                const results = new Map<Key, HypotheticalItem>();
                for (const hypothetical of productTargets(parser, state, filteredGraph, span)) {
                    if (hypothetical.item) {
                        const key = hypothetical.item.key;
                        const existing = results.get(key);
                        if (existing) {
                            if (existing.score < hypothetical.score) {
                                results.set(key, hypothetical);
                            }
                        } else {
                            results.set(key, hypothetical);
                        }
                    }
                }

                const sorted = [...results.values()].sort( (a,b) => {
                    return b.score - a.score;
                });

                for (const hypothetical of sorted) {
                    const item = hypothetical.item!;
                    const name = this.world.catalog.getSpecific(item.key).name;
                    const score = hypothetical.score.toFixed(2);
                    console.log(`${score}: ${name} (${item.key})`);
                }
                console.log();

                // for (const [i, edges] of filteredGraph.edgeLists.entries()) {
                //     console.log(`  vertex ${i}: "${terms[i]}"`);
                //     for (const edge of edges) {
                //         const token = tokenToString(edge.token);
                //         console.log(`    length:${edge.length}, score:${edge.score.toFixed(2)}, token:${token}`);
                //     }
                // }

                repl.getReplServer().displayPrompt();
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

export function printMatchingGenerics(lexer: ILexicalAnalyzer, text: string) {
    const graph = lexer.createGraph(text);

    const tokens = new Set<EntityToken | OptionToken>();
    for (const edge of graph.edgeLists[0]) {
        const token = edge.token as EntityToken | OptionToken;
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
