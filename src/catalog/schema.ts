import * as AJV from 'ajv';
import { CatalogItems, IndexableItemCollection } from './interfaces';

// Schema generated with typescript-json-schema:
//   typescript-json-schema tsconfig.json IndexableItemCollection --required

const indexableItemCollectionSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": {
        "IndexableItem": {
            "properties": {
                "aliases": {
                    "items": {
                        "type": "string"
                    },
                    "type": "array"
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
        }
    },
    "properties": {
        "items": {
            "items": {
                "$ref": "#/definitions/IndexableItem"
            },
            "type": "array"
        }
    },
    "required": [
        "items"
    ],
    "type": "object"
};

// Schema generated with typescript-json-schema:
//   typescript-json-schema tsconfig.json CatalogItems --required

const catalogItemSchema = {
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
                },
                "standalone": {
                    "type": "boolean"
                },
                "note": {
                    "type": "boolean"
                },
                "matrix": {
                    "type": "number"
                },
                "key": {
                    "type": "string"
                },
            },
            "required": [
                "aliases",
                "composition",
                "standalone",
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
const catalogItemsValidator = ajv.compile(catalogItemSchema);
const indexableItemCollectionValidator = ajv.compile(indexableItemCollectionSchema);

export function validateCatalogItems(catalog: CatalogItems) {
    if (!catalogItemsValidator(catalog)) {
        const message = 'validateCatalogItems: yaml data does not conform to schema.';
        console.log(message);
        console.log(catalogItemsValidator.errors);
        throw TypeError(message);
    }
}

export function validateIndexableItemsCollection(collection: IndexableItemCollection) {
    if (!indexableItemCollectionValidator(collection)) {
        const message = 'validateIndexableItemsCollection: yaml data does not conform to schema.';
        console.log(message);
        console.log(indexableItemCollectionValidator.errors);
        throw TypeError(message);
    }
}

export function ConvertDollarsToPennies(catalog: CatalogItems) {
    for (const item of catalog.items) {
        if (item.price !== undefined) {
            item.price = Math.round(item.price * 100);
        }
    }
}
