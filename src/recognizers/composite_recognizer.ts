import { Token, UNKNOWN } from '../tokenizer';

export type TokenStreamProcessor = (token: Token) => Token[];

export function applyProcessor(processor: TokenStreamProcessor, tokens:Token[]) {
    const unflattened = tokens.map( (token) => {
        if (token.type === UNKNOWN) {
            return processor(token);
        }
        else {
            return [token];
        }
    });
    const flattened = ([] as Token[]).concat(...unflattened);
    return flattened;
}

export class CompositeRecognizer {
    recognizers: TokenStreamProcessor[] = [];
    debugMode: boolean;

    constructor(recognizers: TokenStreamProcessor[], debugMode = false) {
        this.recognizers = recognizers;
        this.debugMode = debugMode;
    }

    apply = (token: Token) => {
        let result = [token];

        if (this.debugMode) {
            console.log('Input:');
            console.log(token);
            console.log();
        }

        this.recognizers.forEach((processor, index) => {
            result = applyProcessor(processor, result);

            if (this.debugMode) {
                console.log(`=== PASS ${index} ===`);
                console.log(result);
                console.log();
            }
        });

        return result;
    }
}
