import { State } from 'prix-fixe';
import { Graph, Token } from 'token-flow';

import {
    createSpan,
    MODIFY_ITEM,
    PROLOGUE,
    Span,
    tokenToString,
    PREPOSITION
} from '../lexer';

import {
    Interpretation,
    nop,
    PRODUCT_PARTS_0,
    PRODUCT_PARTS_1,
    PRODUCT_PARTS_N,
    ProductToken,
    ProductToken0,
    ProductToken1,
} from './interfaces';

import { Parser } from "./parser";
import { TokenSequence } from './token_sequence';

// Attempts to pull off and process a squence of tokens corresponding
// to a product modification operation.
//
// Assumes that `tokens` starts with:
//     [PROLOGUE] MODIFY_ITEM (PRODUCT_PARTS_1|PRODUCT_PARTS_N) [EPILOGUE]
export function processModify(
    parser: Parser,
    state: State,
    tokens: TokenSequence<Token & Span>,
    graph: Graph,
): Interpretation {
    if (tokens.peek(0).type === PROLOGUE) {
        tokens.take(1);
    }
    if (tokens.peek(0).type === MODIFY_ITEM) {
        tokens.take(1);
    }

    if (!tokens.atEOS()) {
        if (tokens.startsWith([PRODUCT_PARTS_1, PREPOSITION, PRODUCT_PARTS_0])) {
            const target = tokens.peek(0) as ProductToken1 & Span;
            const modification = tokens.peek(2) as ProductToken0 & Span;
            tokens.take(3);
            console.log('CASE I: modifying');
            console.log(`  ${target.tokens.map(tokenToString).join('')}`);
            console.log(`with`);
            console.log(`  ${modification.tokens.map(tokenToString).join('')}`);
        } else if (tokens.startsWith([PRODUCT_PARTS_1])) {
            const parts = tokens.peek(0) as ProductToken1 & Span;
            tokens.take(1);
            console.log('CASE II: target and modifications adjacent');
            console.log(`  ${parts.tokens.map(tokenToString).join('')}`);
        } else {
            console.log('CASE III: error: multiple targets');
            tokens.take(1);
        }
    }

    return nop;
}


export function parseAddToExplicitItem(
    parser: Parser,
    modification: Array<Token & Span>,
    target: Array<Token & Span>
) {
    console.log(`Modifying`);
    console.log(`  ${target.map(tokenToString).join('')}`);
    console.log(`with`);
    console.log(`  ${modification.map(tokenToString).join('')}`);

    // For each target
    //   Get target's pid from it's key
    //   Create segment
    //     left: empty
    //     entity: pid instead of token
    //     right: modifications
    //   Build item
    //   Copy options from builder
    //   Change attributes from builder
}

export function parseAddToImplicitItem(
    parser: Parser,
    modification: Array<Token & Span>,
) {
    console.log(`Modifying implicit item with`);
    console.log(`  ${modification.map(tokenToString).join('')}`);
}