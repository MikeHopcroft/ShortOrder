import * as path from 'path';
import { Pipeline } from '../src/pipeline';
import { stemmerConfusionMatrix } from 'token-flow';
import { Tokenizer } from 'token-flow';

function stemmerConfusionDemo() {
    const pipeline = new Pipeline(
        path.join(__dirname, './data/restaurant-en/menu.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        undefined);

    stemmerConfusionMatrix(pipeline.compositeRecognizer, Tokenizer.defaultStemTerm);
}

stemmerConfusionDemo();
