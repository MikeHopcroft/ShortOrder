import * as AJV from 'ajv';
import { CatalogItems } from './interfaces';

// Schema generated with typescript-json-schema:
//   typescript-json-schema tsconfig.json CatalogItems --required

const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": {
        "ChoiceDescription": {
            "properties": {
                "alternatives": {
                    "items": {
                        "type": "number"
                    },
                    "type": "array"
                },
                "className": {
                    "type": "string"
                },
                "pid": {
                    "type": "number"
                }
            },
            "required": [
                "alternatives",
                "className",
                "pid"
            ],
            "type": "object"
        },
        "ComponentDescription": {
            "properties": {
                "defaultQuantity": {
                    "type": "number"
                },
                "pid": {
                    "type": "number"
                },
                "maxQuantity": {
                    "type": "number"
                },
                "minQuantity": {
                    "type": "number"
                },
                "price": {
                    "type": "number"
                }
            },
            "required": [
                "defaultQuantity",
                "pid",
                "maxQuantity",
                "minQuantity",
                "price"
            ],
            "type": "object"
        },
        "ItemDescription": {
            "properties": {
                "aliases": {
                    "items": {
                        "type": "string"
                    },
                    "type": "array"
                },
                "composition": {
                    "properties": {
                        "choices": {
                            "items": {
                                "$ref": "#/definitions/ChoiceDescription"
                            },
                            "type": "array"
                        },
                        "defaults": {
                            "items": {
                                "$ref": "#/definitions/ComponentDescription"
                            },
                            "type": "array"
                        },
                        "options": {
                            "items": {
                                "$ref": "#/definitions/ComponentDescription"
                            },
                            "type": "array"
                        },
                        "substitutions": {
                            "items": {
                                "$ref": "#/definitions/SubstitutionDescription"
                            },
                            "type": "array"
                        }
                    },
                    "required": [
                        "choices",
                        "defaults",
                        "options",
                        "substitutions"
                    ],
                    "type": "object"
                },
                "name": {
                    "type": "string"
                },
                "pid": {
                    "type": "number"
                },
                "price": {
                    "type": "number"
                }
            },
            "required": [
                "aliases",
                "composition",
                "name",
                "pid",
                "price"
            ],
            "type": "object"
        },
        "SubstitutionDescription": {
            "properties": {
                "canReplace": {
                    "type": "number"
                },
                "price": {
                    "type": "number"
                },
                "replaceWith": {
                    "type": "number"
                }
            },
            "required": [
                "canReplace",
                "price",
                "replaceWith"
            ],
            "type": "object"
        }
    },
    "properties": {
        "items": {
            "items": {
                "$ref": "#/definitions/ItemDescription"
            },
            "type": "array"
        }
    },
    "required": [
        "items"
    ],
    "type": "object"
};

const ajv = new AJV();
const validator = ajv.compile(schema);

export function validateCatalogItemsSchema(catalog: CatalogItems) {
    if (!validator(catalog)) {
        const message = 'catalogFromYamlText: yaml data does not conform to schema.';
        console.log(message);
        console.log(validator.errors);
        throw TypeError(message);
    }
}
