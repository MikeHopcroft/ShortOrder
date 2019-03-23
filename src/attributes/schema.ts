import * as AJV from 'ajv';
import * as Debug from 'debug';
import * as yaml from 'js-yaml';

import { Attributes, AttributeItem } from './interfaces';

const debug = Debug('tf:itemMapFromYamlString');

// Schema generated with typescript-json-schema:
//   typescript-json-schema tsconfig.json Attributes --required
const attributeSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": {
        "AttributeItem": {
            "properties": {
                "aliases": {
                    "items": {
                        "type": "string"
                    },
                    "type": "array"
                },
                "hidden": {
                    "type": "boolean"
                },
                "isDefault": {
                    "type": "boolean"
                },
                "name": {
                    "type": "string"
                },
                "pid": {
                    "type": "number"
                }
            },
            "required": [
                "aliases",
                "name",
                "pid"
            ],
            "type": "object"
        },
        "DimensionDescription": {
            "properties": {
                "did": {
                    "type": "number"
                },
                "items": {
                    "items": {
                        "$ref": "#/definitions/AttributeItem"
                    },
                    "type": "array"
                },
                "name": {
                    "type": "string"
                }
            },
            "required": [
                "did",
                "items",
                "name"
            ],
            "type": "object"
        },
        "MatrixDescription": {
            "properties": {
                "dimensions": {
                    "items": {
                        "type": "number"
                    },
                    "type": "array"
                },
                "mid": {
                    "type": "number"
                },
                "name": {
                    "type": "string"
                }
            },
            "required": [
                "dimensions",
                "mid",
                "name"
            ],
            "type": "object"
        }
    },
    "properties": {
        "dimensions": {
            "items": {
                "$ref": "#/definitions/DimensionDescription"
            },
            "type": "array"
        },
        "matrices": {
            "items": {
                "$ref": "#/definitions/MatrixDescription"
            },
            "type": "array"
        }
    },
    "required": [
        "dimensions",
        "matrices"
    ],
    "type": "object"
};

const ajv = new AJV();
const attributesValidator = ajv.compile(attributeSchema);

export function validateAttributes(attributes: Attributes) {
    if (!attributesValidator(attributes)) {
        const message = 'attributesValidator: yaml data does not conform to schema.';
        console.log(message);
        console.log(attributesValidator.errors);
        throw TypeError(message);
    }
}

export function* itemsFromAttributes(attributes: Attributes): IterableIterator<AttributeItem> {
    for (const dimension of attributes.dimensions) {
        for (const item of dimension.items) {
            yield item;
        }
    }
}

export function attributesFromYamlString(yamlText: string) {
    const yamlRoot = yaml.safeLoad(yamlText) as Attributes;

    if (!attributesValidator(yamlRoot)) {
        const message = 'attributesFromYamlString: yaml data does not conform to schema.';
        debug(message);
        debug(attributesValidator.errors);
        throw TypeError(message);
    }

    return yamlRoot;
}
