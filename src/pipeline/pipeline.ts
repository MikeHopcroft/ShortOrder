import { CompositeRecognizer } from '../recognizers';
import { ATTRIBUTE, CreateAttributeRecognizer, AttributeToken } from '../recognizers';
import { ENTITY, EntityRecognizer, EntityToken } from '../recognizers';
import { INTENT, CreateIntentRecognizer, IntentToken } from '../recognizers';
import { PatternRecognizer } from '../recognizers';
import { QUANTITY, NumberRecognizer, CreateQuantityRecognizer, QuantityToken } from '../recognizers';
import { Token, UnknownToken, UNKNOWN } from '../tokenizer';


type AnyToken = UnknownToken | AttributeToken | EntityToken | IntentToken | QuantityToken;

export function tokenToString(t:Token) {
    const token = t as AnyToken;
    let name: string;
    switch (token.type) {
        case ATTRIBUTE:
            const attribute = token.name.replace(/\s/g, '_').toUpperCase();
            name = `ATTRIBUTE:${attribute}(${token.id})`;
            break;
        case ENTITY:
            const entity = token.name.replace(/\s/g, '_').toUpperCase();
            name = `ENTITY:${entity}(${token.pid})`;
            break;
        case INTENT:
            name = `INTENT:${token.name}`;
            break;
        case QUANTITY:
            name = `QUANTITY(${token.value})`;
            break;
        default:
            name = 'UNKNOWN';
    }
    return `[${name}]`;
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

function printTokens(tokens:Token[]) {
    tokens.forEach(printToken);
    console.log();
}

export class Pipeline {
    attributeRecognizer: PatternRecognizer;
    entityRecognizer: EntityRecognizer;
    intentRecognizer: PatternRecognizer;
    numberRecognizer: NumberRecognizer;
    quantityRecognizer: PatternRecognizer;

    compositeRecognizer: CompositeRecognizer;

    constructor(entityFile: string, intentsFile: string, attributesFile: string, quantifierFile: string) {
        this.attributeRecognizer = CreateAttributeRecognizer(attributesFile);
        this.entityRecognizer = new EntityRecognizer(entityFile);
        this.intentRecognizer = CreateIntentRecognizer(intentsFile);   
        this.numberRecognizer = new NumberRecognizer();
        this.quantityRecognizer = CreateQuantityRecognizer(quantifierFile);

        this.compositeRecognizer = new CompositeRecognizer(
            [
                this.entityRecognizer.apply,
                this.attributeRecognizer.apply,
                this.numberRecognizer.apply,
                this.quantityRecognizer.apply,
                this.intentRecognizer.apply
            ],
            false   // debugMode
        );
    }

    processOneQuery(query:string, debugMode = false) {
        const input = {type: UNKNOWN, text: query};
        // console.log(`"${query}"`);
        // console.log();
        const tokens = this.compositeRecognizer.apply(input);
        // printTokens(tokens);
        return tokens;
    }
}
