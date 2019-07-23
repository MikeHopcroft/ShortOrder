import { State } from 'prix-fixe';

import { Token } from 'token-flow';

import {
    ADD_TO_ORDER,
    tokenToString,
    REMOVE_ITEM,
    Span,
    Tokenization
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
    while (!grouped.atEOS()) {
        if (grouped.startsWith([ADD_TO_ORDER, PRODUCT_PARTS])) {
            const parts = (grouped.peek(1) as ProductToken).tokens;
            grouped.take(2);
            return parseAdd(parser, parts);
        } else if (grouped.startsWith([REMOVE_ITEM, PRODUCT_PARTS])) {
            console.log('REMOVE_ITEM not implemented');
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
