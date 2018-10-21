import { NumberRecognizer } from '../../src/recognizers';
import { QUANTITY, QuantityToken } from './quantity_recognizer';

export function CreateNumberRecognizer(): NumberRecognizer {
    const tokenFactory = (value: number, text: string): QuantityToken => {
        return { type: QUANTITY, text, value };
    };

    return new NumberRecognizer(tokenFactory);
}

