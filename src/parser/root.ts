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
import { nop } from './parser_utilities';
import { parseRemove } from './remove';
import { TokenSequence } from './token_sequence';


///////////////////////////////////////////////////////////////////////////
//
// Parsing complete utterances.
//
///////////////////////////////////////////////////////////////////////////
export function parseRoot(
    parser: Parser,
    state: State,
    text: string
): Interpretation {
    // XXX
    if (parser.debugMode) {
        console.log(' ');
        console.log(`Text: "${text}"`);
    }

    const interpretations: Interpretation[] = [];

    // TODO: figure out how to remove the type assertion to any.
    // tslint:disable-next-line:no-any
    const start = (process.hrtime as any).bigint();

    let counter = 0;
    for (const tokenization of parser.lexer.tokenizations2(text)) {
        // XXX
        if (parser.debugMode) {
            const tokens = tokenization.tokens;
            console.log(' ');
            console.log(tokens.map(tokenToString).join(''));
            // console.log(`  interpretation ${counter}`);
        }
        counter++;

        interpretations.push(parseRootStage2(parser, state, tokenization));
    }
    if (interpretations.length > 0) {
        // We found at least one interpretation.
        // Sort interpretations by decreasing score.
        interpretations.sort((a, b) => b.score - a.score);
    }

    // TODO: figure out how to remove the type assertion to any.
    // tslint:disable-next-line:no-any
    const end = (process.hrtime as any).bigint();
    const delta = Number(end - start);
    // XXX
    if (parser.debugMode) {
        console.log(`${counter} interpretations.`);
        console.log(`Time: ${delta/1.0e6}`);
    }

    // TODO: eventually place the following code under debug mode.
    if (delta/1.0e6 > 65) {
    // if (delta/1.0e6 > 1) {
        console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
        console.log(`Time: ${delta/1.0e6}ms`);
        console.log(`  "${text}"`);
        parser.lexer.analyzePaths(text);
    }

    if (interpretations.length > 0) {
        // We found at least one interpretation.
        // Return the highest scoring interpretation.
        // TODO: when there is more than one top-scoring interpretations,
        // probably want to pick the one that associates right.
        return interpretations[0];
    } else {
        // We didn't find any interpretations.
        // Return an empty interpretation.
        return {score: 0, items: [], action: nop}; 
    }
}

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

    const tokenization = parser.lexer.tokenize(text);

    // XXX
    if (parser.debugMode) {
        const tokens = tokenization.tokens;
        console.log(' ');
        console.log(tokens.map(tokenToString).join(''));
    }

    state = processAllActiveRegions(parser, state, tokenization);

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
): State {
    const filtered = filterBadTokens(parser, tokenization.tokens);
    const tokens = new TokenSequence<Token & Span>(filtered);

    let active: Array<Token & Span> = [];
    while (!tokens.atEOS()) {
        if (tokens.startsWith([PROLOGUE])) {
            tokens.take(1);

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
                        state = processOneActiveRegion(
                            parser,
                            state,
                            { graph: tokenization.graph, tokens: active }
                        );
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

    return state;
}

function processOneActiveRegion(
    parser: Parser,
    state: State,
    tokenization: Tokenization
): State {
    const graph = tokenization.graph;
    const tokens = tokenization.tokens;

    const grouped = new TokenSequence<Token>(
        groupProductParts(parser, tokens)
    );

    // TODO: should not return directly from inside this loop.
    // There might be multiple intents in the utterance.
    // DESIGN ISSUE: What if processing the first intent invalidates
    // the interpretation of subsequent intents (e.g. first intent
    // removes item modified by second intent)?
    // Another issue is if the second intent removes an item added
    // by the first intent. Since remove inspects the cart, we must
    // execute the `add` intent before executing the `remove` intent.
    while (!grouped.atEOS()) {
        if (grouped.startsWith([ADD_TO_ORDER, PRODUCT_PARTS])) {
            const parts = (grouped.peek(1) as ProductToken).tokens;
            grouped.take(2);
            state = processAdd(parser, state, { tokens: parts, graph });
        } else if (grouped.startsWith([REMOVE_ITEM, PRODUCT_PARTS])) {
            const parts = (grouped.peek(1) as ProductToken).tokens;
            grouped.take(2);
            state = processRemove(parser, state, { tokens: parts, graph });
        } else {
            grouped.discard(1);
        }
    }

    return state;
}

function processAdd(
    parser: Parser,
    state: State,
    tokenization: Tokenization
): State {
    const graph = tokenization.graph;

    const tokens = tokenization.tokens;
    const start = tokens[0];
    const end = tokens[tokens.length - 1];
    const span: Span = {
        start: start.start,
        length: end.start - start.start + end.length
    };

    let best: Interpretation | null = null;
    for(const version of parser.lexer.tokenizationsFromGraph3(graph, span)) {
        const interpretation =
            parseAdd(parser, version.tokens as SequenceToken[]);
        if (best && best.score < interpretation.score || !best) {
            best = interpretation;
        }
    }

    if (best) {
        // We found at least one interpretation. Run it.
        return best.action(state);
    } else {
        return state;
    }
}

function processRemove(
    parser: Parser,
    state: State,
    tokenization: Tokenization
): State {
    const interpretation = parseRemove(parser, state, tokenization);
    return interpretation.action(state);
}


function parseRootStage2(
    parser: Parser,
    state: State,
    tokenization: Tokenization
): Interpretation {
    const tokens = tokenization.tokens;
    const graph = tokenization.graph;

    const filtered = filterBadTokens(parser, tokens);
    const grouped = new TokenSequence<Token>(
        groupProductParts(parser, filtered)
    );

    // TODO: should not return directly from inside this loop.
    // There might be multiple intents in the utterance.
    // DESIGN ISSUE: What if processing the first intent invalidates
    // the interpretation of subsequent intents (e.g. first intent
    // removes item modified by second intent)?
    // Another issue is if the second intent removes an item added
    // by the first intent. Since remove inspects the cart, we must
    // execute the `add` intent before executing the `remove` intent.
    while (!grouped.atEOS()) {
        if (grouped.startsWith([ADD_TO_ORDER, PRODUCT_PARTS])) {
            const parts = (grouped.peek(1) as ProductToken).tokens;
            grouped.take(2);
            return parseAdd(parser, parts);
        } else if (grouped.startsWith([REMOVE_ITEM, PRODUCT_PARTS])) {
            const parts = (grouped.peek(1) as ProductToken).tokens;
            grouped.take(2);
            return parseRemove(parser, state, { tokens: parts, graph });
        } else {
            grouped.discard(1);
        }
    }

    // We didn't find any interpretations.
    // Return an empty interpretation.
    return {score: 0, items: [], action: nop}; 
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
