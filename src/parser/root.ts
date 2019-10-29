import { OPTION, State } from 'prix-fixe';
import { filterGraph, Graph, Token, UNKNOWNTOKEN } from 'token-flow';

import {
    ADD_TO_ORDER,
    createSpan,
    ENTITY,
    MODIFY_ITEM,
    PROLOGUE,
    REMOVE_ITEM,
    Span,
    tokenToString,
    WEAK_ADD,
    ATTRIBUTE,
    OPTION_RECIPE,
    PRODUCT_RECIPE,
} from '../lexer';

import { processAdd } from './add';

import {
    Interpretation,
    PRODUCT_PARTS_0,
    PRODUCT_PARTS_1,
    PRODUCT_PARTS_N,
    ProductToken,
    Segment,
    SequenceToken,
} from './interfaces';

import { processModify } from './modify';
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
    // // XXX
    // if (parser.debugMode) {
    //     console.log(' ');
    //     console.log(`Text: "${text}"`);
    // }

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

    // TODO: REVIEW: MAGIC NUMBER
    // 0.35 is the score cutoff for the filtered graph.
    const filteredGraph: Graph = filterGraph(rawGraph, 0.35);

    // console.log('Original graph:');
    // for (const [i, edges] of rawGraph.edgeLists.entries()) {
    //     console.log(`  vertex ${i}`);
    //     for (const edge of edges) {
    //         const token = tokenToString(parser.lexer.tokenizer.tokenFromEdge(edge));
    //         console.log(`    length:${edge.length}, score:${edge.score}, token:${token}`);
    //     }
    // }
    // console.log('Filtered graph:');
    // for (const [i, edges] of filteredGraph.edgeLists.entries()) {
    //     console.log(`  vertex ${i}`);
    //     for (const edge of edges) {
    //         const token = edge.token;
    //         console.log(`    length:${edge.length}, score:${edge.score}, token:${tokenToString(token)}`);
    //     }
    // }

    let best: Interpretation | null = null;
    for (const tokenization of parser.lexer.tokenizationsFromGraph2(filteredGraph)) {
        // XXX
        if (parser.debugMode) {
            console.log(' ');
            console.log(tokenization.map(tokenToString).join(''));
        }

        const grouped = groupProductTokens(parser, tokenization);
        // XXX
        if (parser.debugMode) {
            console.log(grouped.map(tokenToString).join(''));
        }

        // Before bringing in the token-flow maximalPaths() graph API
        // the original code took baseGraph, as follows, instead of
        // filtered graph. I suspect this was a bug. Probably want to
        // use the filteredGraph.
        // const interpretation = 
        //     processAllActiveRegions(parser, state, grouped, rawGraph);
        const interpretation = 
            // Following causes stack overflow.
            // processAllActiveRegions(parser, state, grouped, rawGraph);
            processAllActiveRegions(parser, state, grouped, filteredGraph);
        interpretation.missed = tokenization.length - interpretation.score;

        // console.log(`interpretation: score(${interpretation.score}), tokenCount(${interpretation.tokenCount2}), missed(${tokenization.length - interpretation.score})`);
        // for (const token of tokenization) {
        //     console.log(`  ${tokenToString(token)}`);
        // }

        if (!best) {
            // console.log("First interpreation");
            best = interpretation;
        } else if (preferFirstInterpretation(interpretation, best)) {
            // console.log("Better interpreation");
            best = interpretation;
        }
        // console.log('');
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
    tokenization: Array<Token & Span>,
    baseGraph: Graph
): Interpretation {
    const tokens = new TokenSequence<Token & Span>(tokenization);

    let score = 0;
    let tokenCount2 = 0;
    let weakAddAllowed = false;
    while (!tokens.atEOS()) {
        if (
            tokens.startsWith([PROLOGUE, ADD_TO_ORDER]) ||
            tokens.startsWith([ADD_TO_ORDER]) ||
            (weakAddAllowed && tokens.startsWith([WEAK_ADD]))
        ) {
            const interpretation = processAdd(parser, state, baseGraph, tokens);
            score += interpretation.score;
            tokenCount2 += interpretation.tokenCount2;
            state = interpretation.action(state);
            weakAddAllowed = true;
        } else if (
            tokens.startsWith([PROLOGUE, REMOVE_ITEM]) ||
            tokens.startsWith([REMOVE_ITEM])
        ) {
            const interpretation = processRemove(parser, state, tokens, baseGraph);
            score += interpretation.score;
            tokenCount2 += interpretation.tokenCount2;
            state = interpretation.action(state);
            weakAddAllowed = true;
        } else if (
            tokens.startsWith([PROLOGUE, MODIFY_ITEM]) ||
            tokens.startsWith([MODIFY_ITEM])
        ) {
            const interpretation = processModify(parser, state, tokens, baseGraph);
            score += interpretation.score;
            tokenCount2 += interpretation.tokenCount2;
            state = interpretation.action(state);
            weakAddAllowed = true;
        } else {
            // We don't understand this token. Skip over it.
            tokens.take(1);
            weakAddAllowed = false;
        }
    }

    return {
        score,
        tokenCount2,
        items: [],
        action: (s: State):State => state
    };
}

function groupProductTokens(
    parser: Parser,
    tokens: Array<Token & Span>
): Array<Token & Span> {
    let productParts = new Array<SequenceToken & Span>();
    
    const grouped = new Array<Token & Span>();
    const input = new TokenSequence(tokens);

    while (true) {
        // if (input.atEOS() || parser.intentTokens.has(input.peek(0).type)) {
        if (input.atEOS() || !parser.productTokens.has(input.peek(0).type)) {
            // When we reach the end of stream or encounter an intent token,
            // dump and product parts we have been collecting.
            if (productParts.length > 0) {
                copyProductTokens(productParts, grouped);
                productParts = [];
            }

            if (input.atEOS()) {
                // If we're at the end of the stream, break out of the while loop.
                break;
            } else {
                // Otherwise copy over the intent token and continue scanning.
                grouped.push(input.peek(0));
                input.take(1);
            }
        } else {
            // Assuming anything not in parser.intentTokens must be a
            // SequenceToken. Gather SeqeuenceTokens in productParts.
            const token = input.peek(0);
            if (token.type === UNKNOWNTOKEN &&
                productParts.length > 0 && 
                productParts[productParts.length - 1].type === UNKNOWNTOKEN
            ) {
                copyProductTokens(productParts, grouped);
                productParts = [];
                grouped.push(input.peek(0));
            } else {
                productParts.push(input.peek(0) as SequenceToken & Span);
            }
            input.take(1);
        }
    }
    return grouped;
}

function copyProductTokens(
    productParts: Array<SequenceToken & Span>,
    grouped: Array<Token & Span>
): void {
    let entityCount = 0;
    let optionAttributeCount = 0;
    for (const token of productParts) {
        if (token.type === ENTITY // ||
            //  token.type === PRODUCT_RECIPE
        ) {
            ++entityCount;
        } else if (
            token.type === OPTION ||
            token.type === OPTION_RECIPE ||
            token.type === ATTRIBUTE
        ) {
            ++optionAttributeCount;
        }
    }

    const span = createSpan(productParts);

    if (entityCount === 0 && optionAttributeCount > 0) {
        const product: ProductToken & Span = {
            type: PRODUCT_PARTS_0,
            tokens: productParts,
            ...span
        };
        grouped.push(product);
    } else if (entityCount === 1) {
        const product: ProductToken & Span = {
            type: PRODUCT_PARTS_1,
            tokens: productParts,
            ...span
        };
        grouped.push(product);
    } else if (entityCount > 1) {
        const product: ProductToken & Span = {
            type: PRODUCT_PARTS_N,
            tokens: productParts,
            ...span
        };
        grouped.push(product);
    } else {
        // This is not a sequence of product tokens.
        for (const token of productParts) {
            grouped.push(token);
        }
    }
}

function printSegment(segment: Segment) {
    const left = segment.left.map(tokenToString).join('');
    const entity = `[Entity: pid=${segment.entity}]`;
    const right = segment.right.map(tokenToString).join('');

    console.log('  Segment');
    console.log(`    left: ${left}`);
    console.log(`    entity: ${entity}`);
    console.log(`    right: ${right}`);
}

function preferFirstInterpretation(a: Interpretation, b: Interpretation): boolean {
    if (a.missed! === b.missed!) {
        const ra = a.score / a.tokenCount2;
        const rb = b.score / b.tokenCount2;
    
        if (ra === rb) {
            // Prefer shorter token sequences
            return a.tokenCount2 < b.tokenCount2;
        } else {
            // Prefer higher match ratios
            return ra > rb;
        }
    } else {
        return a.missed! < b.missed!;
    }
}