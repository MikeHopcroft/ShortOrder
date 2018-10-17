import { CompositeRecognizer } from '../recognizers';
import { ATTRIBUTE, AttributeToken, CreateAttributeRecognizer } from '../recognizers';
import { ENTITY, CreateEntityRecognizer, EntityToken } from '../recognizers';
import { INTENT, CreateIntentRecognizer, IntentToken } from '../recognizers';
import { QUANTITY, CreateQuantityRecognizer, NumberRecognizer, QuantityToken } from '../recognizers';
import { Recognizer, Token, UnknownToken, UNKNOWN } from '../tokenizer';


type AnyToken = UnknownToken | AttributeToken | EntityToken | IntentToken | QuantityToken;

export function tokenToString(t:Token) {
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
        case INTENT:
            name = `[INTENT:${token.name}]`;
            break;
        case QUANTITY:
            name = `[QUANTITY:${token.value}]`;
            break;
        default:
            name = `[UNKNOWN:${token.text}]`;
    }
    return name;
}

export function printToken(t:Token) {
    const token = t as AnyToken;
    let name: string;
    switch (token.type) {
        case ATTRIBUTE:
            const attribute = token.name.replace(/\s/g, '_').toUpperCase();
            name = `ATTRIBUTE: ${attribute}(${token.id})`;
            break;
        case ENTITY:
            const entity = token.name.replace(/\s/g, '_').toUpperCase();
            name = `ENTITY: ${entity}(${token.pid})`;
            break;
        case INTENT:
            name = `INTENT: ${token.name}`;
            break;
        case QUANTITY:
            name = `QUANTITY: ${token.value}`;
            break;
        default:
            name = 'UNKNOWN';
    }
    console.log(`${name}: "${token.text}"`);
}

export function printTokens(tokens:Token[]) {
    tokens.forEach(printToken);
    console.log();
}

export class Pipeline {
    attributeRecognizer: Recognizer;
    entityRecognizer: Recognizer;
    intentRecognizer: Recognizer;
    numberRecognizer: Recognizer;
    quantityRecognizer: Recognizer;

    compositeRecognizer: CompositeRecognizer;

    constructor(entityFile: string, intentsFile: string, attributesFile: string, quantifierFile: string) {
        this.intentRecognizer = CreateIntentRecognizer(intentsFile, new Set());

        this.quantityRecognizer = CreateQuantityRecognizer(quantifierFile, new Set());

        this.numberRecognizer = new NumberRecognizer();

        const attributeBadWords = new Set([
            ...this.quantityRecognizer.terms(),
            ...this.numberRecognizer.terms()
        ]);

        this.attributeRecognizer = CreateAttributeRecognizer(
            attributesFile,
            attributeBadWords);

        const entityBadWords = new Set([
            ...this.intentRecognizer.terms(),
            ...this.quantityRecognizer.terms(),
            ...this.attributeRecognizer.terms()
        ]);

        this.entityRecognizer = CreateEntityRecognizer(
            entityFile, 
            entityBadWords);

        this.compositeRecognizer = new CompositeRecognizer(
            [
                this.entityRecognizer,
                this.attributeRecognizer,
                this.numberRecognizer,
                this.quantityRecognizer,
                this.intentRecognizer
            ],
            false   // debugMode
        );
    }

    processOneQuery(query:string, debugMode = false) {
        const input = {type: UNKNOWN, text: query};
        const tokens = this.compositeRecognizer.apply(input);
        return tokens;
    }
}
