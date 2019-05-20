import * as fs from 'fs';

import { Item } from 'prix-fixe';
import {
    DiffResults,
    DownstreamTermPredicate,
    EqualityPredicate,
    exactPrefix,
    generateAliases,
    GenericEquality,
    Hash,
    itemMapFromYamlString,
    levenshtein,
    Lexicon,
    Matcher,
    NumberToken,
    Token,
    Tokenizer,
    TokenPredicate,
    UNKNOWNTOKEN,
    NUMBERTOKEN
} from 'token-flow';

import { attributesFromYamlString, itemsFromAttributes } from '../attributes/schema';

import { ATTRIBUTE, AttributeToken, attributeTokenFactory } from './attributes';
import { ENTITY, EntityToken, entityTokenFactory } from './entities';
import { intentTokenFactory } from './intents';
import { OPTION, OptionToken } from './options';
import { QUANTITY, QuantityToken, quantityTokenFactory } from './quantities';
import { stopwordsFromYamlString, Stopwords } from '../stopwords';
import { UNIT, UnitToken, unitTokenFactory } from './units';

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

function* aliasesFromYamlString(yamlText: string, factory: TokenFactory) {
    const items = itemMapFromYamlString(yamlText);
    yield * aliasesFromItems(items.values(), factory);
}

function* tokensFromStopwords(stopwords: Stopwords) {
    for (const word of stopwords) {
        const text = word.trim();
        yield {
            token: { type: UNKNOWNTOKEN },
            text,
            matcher: exact
        };
    }
}

export class Unified {
    lexicon: Lexicon;
    tokenizer: Tokenizer;

    constructor(
        entityFile: string,
        intentsFile: string,
        attributesFile: string,
        quantifiersFile: string,
        unitsFile: string,
        stopwordsFile: string,
        debugMode = false
    ) {
        this.lexicon = new Lexicon();
        this.tokenizer = new Tokenizer(
            this.lexicon.termModel,
            this.lexicon.numberParser,
            debugMode
        );

        // Attributes
        const attributes =
            attributesFromYamlString(fs.readFileSync(attributesFile, 'utf8'));
        const attributeItems = itemsFromAttributes(attributes);
        const attributeAliases = aliasesFromItems(attributeItems, attributeTokenFactory);
        this.lexicon.addDomain(attributeAliases);

        // Entities
        const entities = aliasesFromYamlString(
            fs.readFileSync(entityFile, 'utf8'),
            entityTokenFactory);
        this.lexicon.addDomain(entities);

        // Quantifiers
        const quantifiers = aliasesFromYamlString(
            fs.readFileSync(quantifiersFile, 'utf8'),
            quantityTokenFactory);
        this.lexicon.addDomain(quantifiers);

        // Units
        const units = aliasesFromYamlString(
            fs.readFileSync(unitsFile, 'utf8'),
            unitTokenFactory);
        this.lexicon.addDomain(units);

        // Intents
        const intents = aliasesFromYamlString(
            fs.readFileSync(intentsFile, 'utf8'),
            intentTokenFactory);
        this.lexicon.addDomain(intents);
        
        // Stopwords
        const stopwords = stopwordsFromYamlString(
            fs.readFileSync(stopwordsFile, 'utf8'));
        const stopwordTokens = tokensFromStopwords(stopwords);
        this.lexicon.addDomain(stopwordTokens, false);

        this.lexicon.ingest(this.tokenizer);
    }

    processOneQuery(query: string): Token[] {
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        // TODO: terms should be stemmed and hashed by TermModel in Lexicon.
        const graph = this.tokenizer.generateGraph(hashed, stemmed);
        const path = graph.findPath([], 0);

        const tokens: Token[] = [];
        for (const [index, edge] of path.entries()) {
            let token = this.tokenizer.tokenFromEdge(edge);
            if (token.type === UNKNOWNTOKEN) {
                const end = index + 1;
                const start = end - edge.length;
                token = ({
                    type: WORD,
                    text: terms.slice(start, end).join('_').toUpperCase()
                } as WordToken);
            }
            tokens.push(token);
        }

        return tokens;
    }
}
