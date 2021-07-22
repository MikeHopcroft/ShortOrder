import AJV from 'ajv';
import Debug from 'debug';
import yaml from 'js-yaml';

const debug = Debug('so:stopwordsFromYamlString');

export type Stopwords = string[];

// Schema generated with typescript-json-schema:
//   typescript-json-schema tsconfig.json Stopwords --required

const stopwordsSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "items": {
        "type": "string"
    },
    "type": "array"
};

const ajv = new AJV();
const stopwordsValidator = ajv.compile(stopwordsSchema);

export function validateStopwords(stopwords: Stopwords) {
    if (!stopwordsValidator(stopwords)) {
        const message = 'validateStopwords: yaml data does not conform to schema.';
        console.log(message);
        console.log(stopwordsValidator.errors);
        throw TypeError(message);
    }
}

export function stopwordsFromYamlString(yamlText: string) {
    const yamlRoot = yaml.safeLoad(yamlText) as Stopwords;

    if (!stopwordsValidator(yamlRoot)) {
        const message = 'stopwordsFromYamlString: yaml data does not conform to schema.';
        debug(message);
        debug(stopwordsValidator.errors);
        throw TypeError(message);
    }

    return yamlRoot;
}
