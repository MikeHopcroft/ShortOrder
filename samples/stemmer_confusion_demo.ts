import * as path from 'path';
import { Pipeline } from './pipeline';
import { stemmerConfusionMatrix } from 'token-flow';
import { Tokenizer } from 'token-flow';

function stemmerConfusionDemo() {
    const pipeline = new Pipeline(
        path.join(__dirname, './data/menu.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        undefined);

    stemmerConfusionMatrix(pipeline.compositeRecognizer, Tokenizer.defaultStemTerm);
}

stemmerConfusionDemo();
