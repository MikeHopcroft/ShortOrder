import { State } from 'prix-fixe';
import { Token } from 'token-flow';

import {
    ADD_TO_ORDER,
    EPILOGUE,
    PROLOGUE,
    REMOVE_ITEM,
    Span,
    Tokenization,
    tokenToString,
    WEAK_ADD
} from '../lexer';

import { parseAdd } from './add';

import {
    Interpretation,
    ProductToken,
    Segment,
    SequenceToken,
    PRODUCT_PARTS
} from './interfaces';

import { Parser } from './parser';
import { parseRemove } from './remove';
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

    let best: Interpretation | null = null;
    for (const tokenization of parser.lexer.tokenizations2(text)) {
        console.log('Graph:');
        const graph = tokenization.graph;
        for (const [i, edges] of graph.edgeLists.entries()) {
            console.log(`  vertex ${i}`);
            for (const edge of edges) {
                const token = tokenToString(parser.lexer.tokenizer.tokenFromEdge(edge));
                console.log(`    length:${edge.length}, score:${edge.score}, token:${token}`);
            }
        }


        // XXX
        if (parser.debugMode) {
            const tokens = tokenization.tokens;
            console.log(' ');
            console.log(tokens.map(tokenToString).join(''));
        }

        const interpretation = 
            processAllActiveRegions(parser, state, tokenization);

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

function processAllActiveRegions(
    parser: Parser,
    state: State,
    tokenization: Tokenization
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
        // if (tokens.startsWith([PROLOGUE])) {
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
                            { graph: tokenization.graph, tokens: active }
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
    tokenization: Tokenization
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
                parseRemove(parser, state, { tokens: parts, graph });
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
