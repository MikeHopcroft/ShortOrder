import { Recognizer, Token, UNKNOWN } from '../tokenizer';

function applyProcessor(processor: (token: Token) => Token[], tokens:Token[]) {
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

export class CompositeRecognizer implements Recognizer {
    recognizers: Recognizer[] = [];
    debugMode: boolean;

    constructor(recognizers: Recognizer[], debugMode = false) {
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
            result = applyProcessor(processor.apply, result);

            if (this.debugMode) {
                console.log(`=== PASS ${index} ===`);
                console.log(result);
                console.log();
            }
        });

        return result;
    }

    terms = () => {
        const terms = new Set<string>();
        this.recognizers.forEach(recognizer => {
            recognizer.terms().forEach(term => {
                terms.add(term);
            });
        });
        return terms;
    }

    stemmer = (word:string):string => {
        throw TypeError('CompositeRecognizer: stemmer not implemented.');
    }
}
