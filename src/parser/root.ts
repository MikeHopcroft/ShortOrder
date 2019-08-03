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

import { processAdd } from './add';

import {
    Interpretation,
    ProductToken,
    Segment,
    SequenceToken,
    PRODUCT_PARTS
} from './interfaces';

import { Parser } from './parser';
import { processRemove } from './remove';
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

    state = processRootInternal(parser, state, text);

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

function processRootInternal(
    parser: Parser,
    state: State,
    text: string
): State {
    const rawGraph: Graph = parser.lexer.createGraph(text);
    const baseGraph: Graph = coalesceGraph(parser.lexer.tokenizer, rawGraph);

    // TODO: REVIEW: MAGIC NUMBER
    // 0.35 is the score cutoff for the filtered graph.
    const filteredGraph: Graph = filterGraph(baseGraph, 0.35);

    let best: Interpretation | null = null;
    for (const tokenization of parser.lexer.tokenizationsFromGraph2(filteredGraph)) {
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
