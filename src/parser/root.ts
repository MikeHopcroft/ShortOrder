import { State } from 'prix-fixe';
import { Graph, Token } from 'token-flow';

import {
    ADD_TO_ORDER,
    createSpan,
    EPILOGUE,
    PROLOGUE,
    REMOVE_ITEM,
    Span,
    Tokenization,
    tokenToString,
    WEAK_ADD,
    coalesceGraph,
    filterGraph
} from '../lexer';

import { parseAdd, processAdd } from './add';

import {
    Interpretation,
    ProductToken,
    Segment,
    SequenceToken,
    PRODUCT_PARTS
} from './interfaces';

import { Parser } from './parser';
import { parseRemove, processRemove } from './remove';
import { TokenSequence } from './token_sequence';


///////////////////////////////////////////////////////////////////////////
//
// Parsing complete utterances.
//
///////////////////////////////////////////////////////////////////////////
export function processRoot(
    parser: Parser,
    state: State,
    text: string
): State {
    // XXX
    if (parser.debugMode) {
        console.log(' ');
        console.log(`Text: "${text}"`);
    }

    // TODO: figure out how to remove the type assertion to any.
    // tslint:disable-next-line:no-any
    const start = (process.hrtime as any).bigint();

    const rawGraph: Graph = parser.lexer.createGraph(text);
    // console.log('Raw Graph:');
    // for (const [i, edges] of rawGraph.edgeLists.entries()) {
    //     console.log(`  vertex ${i}`);
    //     for (const edge of edges) {
    //         const token = tokenToString(parser.lexer.tokenizer.tokenFromEdge(edge));
    //         console.log(`    length:${edge.length}, score:${edge.score}, token:${token}`);
    //     }
    // }

    const baseGraph: Graph = coalesceGraph(parser.lexer.tokenizer, rawGraph);
    // console.log('Base Graph:');
    // for (const [i, edges] of baseGraph.edgeLists.entries()) {
    //     console.log(`  vertex ${i}`);
    //     for (const edge of edges) {
    //         const token = tokenToString(parser.lexer.tokenizer.tokenFromEdge(edge));
    //         console.log(`    length:${edge.length}, score:${edge.score}, token:${token}`);
    //     }
    // }

    // TODO: REVIEW: MAGIC NUMBER
    // 0.35 is the score cutoff for the filtered graph.
    const filteredGraph: Graph = filterGraph(baseGraph, 0.35);
    // console.log('Filtered Graph:');
    // for (const [i, edges] of filteredGraph.edgeLists.entries()) {
    //     console.log(`  vertex ${i}`);
    //     for (const edge of edges) {
    //         const token = tokenToString(parser.lexer.tokenizer.tokenFromEdge(edge));
    //         console.log(`    length:${edge.length}, score:${edge.score}, token:${token}`);
    //     }
    // }

    let best: Interpretation | null = null;
    for (const tokenization of parser.lexer.tokenizationsFromGraph2(filteredGraph)) {
        // console.log('Graph:');
        // const graph = tokenization.graph;
        // for (const [i, edges] of graph.edgeLists.entries()) {
        //     console.log(`  vertex ${i}`);
        //     for (const edge of edges) {
        //         const token = tokenToString(parser.lexer.tokenizer.tokenFromEdge(edge));
        //         console.log(`    length:${edge.length}, score:${edge.score}, token:${token}`);
        //     }
        // }

        // XXX
        if (parser.debugMode) {
            const tokens = tokenization.tokens;
            console.log(' ');
            console.log(tokens.map(tokenToString).join(''));
        }

        const interpretation = 
            processAllActiveRegions(parser, state, tokenization, baseGraph);

        if (best && best.score < interpretation.score || !best) {
            best = interpretation;
        }
    }

    if (best) {
        state = best.action(state);
    }

    // TODO: figure out how to remove the type assertion to any.
    // tslint:disable-next-line:no-any
    const end = (process.hrtime as any).bigint();
    const delta = Number(end - start);
    // XXX
    if (parser.debugMode) {
        // console.log(`${counter} interpretations.`);
        console.log(`Time: ${delta/1.0e6}`);
    }

    // TODO: eventually place the following code under debug mode.
    if (delta/1.0e6 > 65) {
    // if (delta/1.0e6 > 1) {
        console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
        console.log(`Time: ${delta/1.0e6}ms`);
        console.log(`  "${text}"`);
        // parser.lexer.analyzePaths(text);
    }

    return state;
}

// [PROLOGUE] ADD_TO_ORDER PRODUCT_PARTS [EPILOGUE]
// PROLOGUE WEAK_ORDER PRODUCT_PARTS [EPILOGUE]
// [PROLOGUE] REMOVE_ITEM PRODUCT_PARTS [EPILOGUE]
function processAllActiveRegions(
    parser: Parser,
    state: State,
    tokenization: Tokenization,
    baseGraph: Graph
): Interpretation {
    // const filtered = filterBadTokens(parser, tokenization.tokens);
    const tokens = new TokenSequence<Token & Span>(tokenization.tokens);

    let score = 0;
    while (!tokens.atEOS()) {
        if (
            tokens.startsWith([PROLOGUE, WEAK_ADD]) ||
            tokens.startsWith([PROLOGUE, ADD_TO_ORDER]) ||
            tokens.startsWith([ADD_TO_ORDER])
        ) {
            const interpretation = processAdd(parser, tokens);
            score += interpretation.score;
            state = interpretation.action(state);
        } else if (
            tokens.startsWith([PROLOGUE, REMOVE_ITEM]) ||
            tokens.startsWith([REMOVE_ITEM])
        ) {
            const interpretation = processRemove(parser, state, tokens, baseGraph);
            score += interpretation.score;
            state = interpretation.action(state);
        } else {
            // We don't understand this token. Skip over it.
            tokens.take(1);
        }
    }

    return {
        score,
        items: [],
        action: (s: State):State => state
    };
}


function processAllActiveRegionsOld(
    parser: Parser,
    state: State,
    tokenization: Tokenization,
    baseGraph: Graph
): Interpretation {
    const filtered = filterBadTokens(parser, tokenization.tokens);
    const tokens = new TokenSequence<Token & Span>(filtered);

    let score = 0;
    let active: Array<Token & Span> = [];
    while (!tokens.atEOS()) {
        const head = tokens.peek(0);
        if (
            [PROLOGUE, ADD_TO_ORDER, REMOVE_ITEM].includes(head.type) ||
            tokens.startsWith([PROLOGUE, WEAK_ADD])
        ) {
            if (head.type === PROLOGUE) {
                tokens.take(1);
            }

            while (true) {
                if (!tokens.atEOS() && !tokens.startsWith([EPILOGUE])) {
                    // There is a next token and it is not an EPILOGUE.
                    // Append this token to the currenct active region.
                    active.push(tokens.peek(0));
                    tokens.take(1);
                } else {
                    if (!tokens.atEOS()) {
                        // We're not at the end of the stream, so the next
                        // token must be EPILOGUE.
                        tokens.take(1);
                    }
                    // Either way, we're going to process the active region
                    // we've been collecting.
                    if (active.length > 0) {
                        const interpretation = processOneActiveRegion(
                            parser,
                            state,
                            { graph: tokenization.graph, tokens: active },
                            baseGraph
                        );
                        score += interpretation.score;
                        state = interpretation.action(state);
                    }

                    // Break out of the loop to start collecting the next
                    // active region.
                    active = [];
                    break;
                }
            }
        }
        else {
            // Skip over this token.
            tokens.take(1);
        }
    }

    return {
        score,
        items: [],
        action: (s: State):State => state
    };
}

function processOneActiveRegion(
    parser: Parser,
    state: State,
    tokenization: Tokenization,
    baseGraph: Graph
): Interpretation {
    const graph = tokenization.graph;
    const tokens = tokenization.tokens;

    const grouped = new TokenSequence<Token>(
        groupProductParts(parser, tokens)
    );

    let score = 0;
    while (!grouped.atEOS()) {
        if (
            grouped.startsWith([ADD_TO_ORDER, PRODUCT_PARTS]) ||
            grouped.startsWith([WEAK_ADD, PRODUCT_PARTS])
        ) {
            const parts = (grouped.peek(1) as ProductToken).tokens;
            grouped.take(2);
            const interpretation = parseAdd(parser, parts);
            score += interpretation.score;
            state = interpretation.action(state);
        } else if (grouped.startsWith([REMOVE_ITEM, PRODUCT_PARTS])) {
            const parts = (grouped.peek(1) as ProductToken).tokens;
            grouped.take(2);
            const interpretation = 
                parseRemove(parser, state, baseGraph, createSpan(parts));
            score += interpretation.score;
            state = interpretation.action(state);
        } else {
            grouped.discard(1);
        }
    }

    return {
        score,
        items: [],
        action: (s: State) => state
    };
}

export function takeActiveTokens(
    parser: Parser,
    tokens: TokenSequence<Token & Span>
): Array<SequenceToken & Span> {
    const active: Array<SequenceToken & Span> = [];
    while (!tokens.atEOS()) {
        const token = tokens.peek(0);
        if (parser.intentTokens.has(token.type)) {
            // If we reach an intent token, we're done with this active region.
            // Don't take the intent token because it belongs to the next
            // region.
            break;
        } else if (token.type === EPILOGUE) {
            // If we reach the epilogue we're done with this active region.
            // Take the epilogue token because it belongs to this region.
            tokens.take(1);
            break;
        } else if (parser.productTokens.has(token.type)){
            // Collect product tokens in active.
            active.push(token as SequenceToken & Span);
            tokens.take(1);
        } else {
            // Skip over unknown token.
            tokens.take(1);
        }
    }

    return active;
}

function filterBadTokens(
    parser: Parser,
    tokens: Array<Token & Span>
): Array<Token & Span> {
    return tokens.filter(token => parser.validTokens.has(token.type));
}

// TODO: get type system right here
function groupProductParts(
    parser: Parser,
    tokens: Array<Token & Span>
): Array<Token & Span> {
    const grouped = new Array<Token & Span>();
    let productParts = new Array<SequenceToken & Span>();

    const tryCreateProductParts = () => {
        if (productParts.length > 0) {
            const start = productParts[0].start;
            const length =
                productParts.reduce((sum, x) => sum + x.length, 0);
            grouped.push({
                type: PRODUCT_PARTS,
                tokens: productParts,
                start,
                length
            } as ProductToken & Span);
            productParts = [];
        }
    };

    for (const token of tokens) {
        if (!parser.intentTokens.has(token.type)) {
            // Code assumes that anything not in intentTokens is a
            // SequenceToken. Gather SeqeuenceTokens in productParts.
            productParts.push(token as SequenceToken & Span);
        } else {
            // We've reached an intent token.
            tryCreateProductParts();
            grouped.push(token);
        }
    }
    if (productParts.length > 0) {
        tryCreateProductParts();
    }
    return grouped;
}

function printSegment(segment: Segment) {
    const left = segment.left.map(tokenToString).join('');
    const entity = tokenToString(segment.entity);
    const right = segment.right.map(tokenToString).join('');

    console.log('  Segment');
    console.log(`    left: ${left}`);
    console.log(`    entity: ${entity}`);
    console.log(`    right: ${right}`);
}
