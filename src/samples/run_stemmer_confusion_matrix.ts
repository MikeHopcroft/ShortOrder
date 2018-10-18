import * as path from 'path';
import { Pipeline, printTokens } from '../pipeline';
import { stemmerConfusionMatrix } from '../stemmer_confusion_matrix';
import { Tokenizer } from '../tokenizer';

export function stemmerConfusionDemo(
    menuFile: string,
    intentFile: string,
    attributesFile: string,
    quantifierFile: string) {
    const pipeline = new Pipeline(
        menuFile,
        intentFile,
        attributesFile,
        quantifierFile,
        undefined);

    stemmerConfusionMatrix(pipeline.compositeRecognizer, Tokenizer.defaultStemTerm);
}

stemmerConfusionDemo(
    path.join(__dirname, './data/menu.yaml'),
    path.join(__dirname, './data/intents.yaml'),
    path.join(__dirname, './data/attributes.yaml'),
    path.join(__dirname, './data/quantifiers.yaml'));
