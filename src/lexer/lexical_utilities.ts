import {
    DiffResults,
    DownstreamTermPredicate,
    EqualityPredicate,
    exactPrefix,
    generateAliases,
    GenericEquality,
    Hash,
    Item,
    itemMapFromYamlString,
    levenshtein,
    Matcher,
    NumberToken,
    Token,
    TokenPredicate,
    UNKNOWNTOKEN,
    NUMBERTOKEN
} from 'token-flow';

import { ATTRIBUTE, AttributeToken } from './attributes';
import { ENTITY, EntityToken } from './entities';
import { OPTION, OptionToken } from './options';
import { QUANTITY, QuantityToken } from './quantities';
import { Stopwords } from '../stopwords';
import { UNIT, UnitToken } from './units';


export const WORD: unique symbol = Symbol('WORD');
export type WORD = typeof WORD;

export interface WordToken extends Token {
    type: WORD;
    text: string;
}

export type AnyToken =
    AttributeToken |
    EntityToken |
    NumberToken |
    OptionToken |
    QuantityToken |
    UnitToken |
    WordToken;

export function tokenToString(t: Token) {
    const token = t as AnyToken;
    let name: string;
    switch (token.type) {
        case ATTRIBUTE:
            const attribute = token.name.replace(/\s/g, '_').toUpperCase();
            name = `[ATTRIBUTE:${attribute},${token.id}]`;
            break;
        case ENTITY:
            const entity = token.name.replace(/\s/g, '_').toUpperCase();
            name = `[ENTITY:${entity},${token.pid}]`;
            break;
        case NUMBERTOKEN:
            name = `[NUMBER:${token.value}]`;
            break;
            case QUANTITY:
            name = `[QUANTITY:${token.value}]`;
            break;
        case OPTION:
            const option = token.name.replace(/\s/g, '_').toUpperCase();
            name = `[OPTION:${option},${token.id}]`;
            break;
        case UNIT:
            const unit = token.name.replace(/\s/g, '_').toUpperCase();
            name = `[UNIT:${unit},${token.id}]`;
            break;
        case WORD:
            name = `[WORD:${token.text}]`;
            break;
        default:
            {
                const symbol = t.type.toString();
                name = `[${symbol.slice(7, symbol.length - 1)}]`;
            }
    }
    return name;
}

export type TokenFactory = (item: Item) => Token;

// An exact Matcher.
function exact (
    query: Hash[],
    prefix: Hash[],
    isDownstreamTerm: DownstreamTermPredicate<Hash>,
    isToken: TokenPredicate<Hash>,
    predicate: EqualityPredicate<Hash> = GenericEquality
): DiffResults<number> {
    return exactPrefix(query, prefix, false, isDownstreamTerm, isToken, predicate);
}

// A prefix matcher.
function prefix(
    query: Hash[],
    prefix: Hash[],
    isDownstreamTerm: DownstreamTermPredicate<Hash>,
    isToken: TokenPredicate<Hash>,
    predicate: EqualityPredicate<Hash> = GenericEquality
): DiffResults<number> {
    return exactPrefix(query, prefix, true, isDownstreamTerm, isToken, predicate);
}

// Returns the matching function specified by an expression of the form
//   ['exact' | 'prefix' | 'levenshtein' ':'] patten
// If no function is specified, defaults to levenshtein.
export function matcherFromExpression(alias: string): Matcher {
    const index = alias.indexOf(':');
    if (index !== -1) {
        const left = alias.slice(0, index).trim();

        if (left === 'exact') {
            return exact;
        }
        else if (left === 'prefix') {
            return prefix;
        }
        else if (left === 'relaxed') {
            return levenshtein;
        }
        else {
            throw TypeError(`matcherFromAlias: Unknown matcher "${left}"`);
        }
    }

    return levenshtein;
}

// Returns the pattern portion of an expression of the form
//   ['exact' | 'prefix' | 'levenshtein' ':'] patten
export function patternFromExpression(alias: string) {
    const index = alias.indexOf(':');
    if (index !== -1) {
        return alias.slice(index + 1);
    }
    return alias;
}

export function* aliasesFromItems(items: IterableIterator<Item>, factory: TokenFactory) {
    for (const item of items) {
        for (const expression of item.aliases) {
            const matcher = matcherFromExpression(expression);
            const pattern = patternFromExpression(expression);
            for (const text of generateAliases(pattern)) {
                yield {
                    token: factory(item),
                    text,
                    matcher
                };
            }
        }
    }
}

export function* aliasesFromYamlString(yamlText: string, factory: TokenFactory) {
    const items = itemMapFromYamlString(yamlText);
    yield * aliasesFromItems(items.values(), factory);
}

export function* tokensFromStopwords(stopwords: Stopwords) {
    for (const word of stopwords) {
        const text = word.trim();
        yield {
            token: { type: UNKNOWNTOKEN },
            text,
            matcher: exact
        };
    }
}
