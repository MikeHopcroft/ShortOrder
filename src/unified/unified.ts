import * as fs from 'fs';

import {
    Lexicon,
    Token,
    Tokenizer,
    UNKNOWNTOKEN,
} from 'token-flow';

import { attributesFromYamlString, itemsFromAttributes } from '../attributes/schema';

import { attributeTokenFactory } from './attributes';
import { entityTokenFactory } from './entities';
import { intentTokenFactory } from './intents';
import { quantityTokenFactory } from './quantities';
import { stopwordsFromYamlString } from '../stopwords';
import { unitTokenFactory } from './units';

import {
    aliasesFromItems,
    aliasesFromYamlString,
    tokensFromStopwords,
    WORD,
    WordToken
} from './lexical_utilities';

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
