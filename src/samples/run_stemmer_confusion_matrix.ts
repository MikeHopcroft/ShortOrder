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
    './src/samples/data/menu.yaml',
    './src/samples/data/intents.yaml',
    './src/samples/data/attributes.yaml',
    './src/samples/data/quantifiers.yaml');
