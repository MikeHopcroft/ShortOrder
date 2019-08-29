import {
    AID,
    AttributeDescription,
    DimensionAndTensorDescription,
    Catalog,
    Cookbook,
    CID,
    DID,
    Dimension,
    DimensionDescription,
    GenericTypedEntity,
    Key,
    TensorDescription,
    MENUITEM,
    OPTION,
    PID,
    RecipeList,
    RuleChecker,
    RuleConfig,
    SpecificTypedEntity,
} from 'prix-fixe';

// A PID that is not indexed in any data structure in this file. For testing
// error cases.
export const unknownPID: PID = 9999;

// A key that is not indexed in any data structure in this file. For testing
// error cases.
export const unknownKey: Key = '9999:9:9:9';

///////////////////////////////////////////////////////////////////////////////
//
//  Generic product entities for Cones and Coffees
//
///////////////////////////////////////////////////////////////////////////////
export const genericConePID: PID = 8000;
export const coneCID: CID = 100;
export const genericCone: GenericTypedEntity = {
    pid: genericConePID,
    cid: coneCID,
    name: 'cone',
    aliases: ['cone', 'ice cream [cone]'],
    defaultKey: '8000:0:0',
    tensor: 1,
    kind: MENUITEM,
};

export const genericCoffeePID: PID = 9000;
export const coffeeCID: CID = 200;
export const genericCoffee: GenericTypedEntity = {
    pid: genericCoffeePID,
    cid: coffeeCID,
    name: 'coffee',
    aliases: ['coffee'],
    defaultKey: '9000:0:0:0',
    tensor: 2,
    kind: MENUITEM,
};

export const genericMilkPID = 5000;
export const milkCID: CID = 500;
export const genericMilk: GenericTypedEntity = {
    pid: genericMilkPID,
    cid: milkCID,
    name: 'milk',
    aliases: ['milk'],
    defaultKey: '5000:1',
    tensor: 3,
    kind: MENUITEM,
};

export const genericItems: GenericTypedEntity[] = [
    genericCone,
    genericCoffee,
    genericMilk,
];

///////////////////////////////////////////////////////////////////////////////
//
//  Attributes for Sizes, Flavors, Temperatures, and Caffeines
//
///////////////////////////////////////////////////////////////////////////////
export const sizeSmall: AID = 0;
export const sizeMedium: AID = 1;

export const sizes: AttributeDescription[] = [
    {
        aid: sizeSmall,
        name: 'small',
        aliases: ['small'],
    },
    {
        aid: sizeMedium,
        name: 'medium',
        aliases: ['medium'],
    },
];

export const flavorVanilla: AID = 2;
export const flavorChocolate: AID = 3;

export const flavors: AttributeDescription[] = [
    {
        aid: flavorVanilla,
        name: 'vanilla',
        aliases: ['vanilla'],
    },
    {
        aid: flavorChocolate,
        name: 'chocolate',
        aliases: ['chocolate'],
    },
];

export const temperatureHot: AID = 4;
export const temperatureCold: AID = 5;

export const temperatures: AttributeDescription[] = [
    {
        aid: temperatureHot,
        name: 'hot',
        aliases: ['hot'],
    },
    {
        aid: temperatureCold,
        name: 'cold',
        aliases: ['colr', ' iced'],
    },
];

export const caffeineRegular: AID = 6;
export const caffeineDecaf: AID = 7;

export const caffeines: AttributeDescription[] = [
    {
        aid: caffeineRegular,
        name: 'regular',
        aliases: ['regular'],
    },
    {
        aid: caffeineDecaf,
        name: 'decaf',
        aliases: ['decaf', 'unleaded'],
    },
];

export const milkWhole: AID = 8;
export const milkTwo: AID = 9;
export const milkZero: AID = 10;
export const milkSoy: AID = 11;

export const milks: AttributeDescription[] = [
    {
        aid: milkWhole,
        name: 'whole',
        aliases: ['whole'],
    },
    {
        aid: milkTwo,
        name: 'two percent',
        aliases: ['two percent'],
    },
    {
        aid: milkZero,
        name: 'fat free',
        aliases: ['fat free', 'nonfat'],
    },
    {
        aid: milkSoy,
        name: 'soy',
        aliases: ['soy'],
    },
];

///////////////////////////////////////////////////////////////////////////////
//
//  Dimension descriptions
//
///////////////////////////////////////////////////////////////////////////////
export const size: DID = 0;
export const flavor: DID = 1;
export const temperature: DID = 2;
export const caffeine: DID = 3;
export const milk: DID = 4;

export const sizeDimensionDescription: DimensionDescription = {
    did: size,
    name: 'sizes',
    attributes: sizes,
};

export const flavorDimensionDescription: DimensionDescription = {
    did: flavor,
    name: 'flavors',
    attributes: flavors,
};

export const temperatureDimensionDescription: DimensionDescription = {
    did: temperature,
    name: 'temperatures',
    attributes: temperatures,
};

export const caffieneDimensionDescription: DimensionDescription = {
    did: caffeine,
    name: 'caffiene',
    attributes: caffeines,
};

export const milkDimensionDescription: DimensionDescription = {
    did: milk,
    name: 'milk',
    attributes: milks,
};

///////////////////////////////////////////////////////////////////////////////
//
//  Tensor descriptions
//
///////////////////////////////////////////////////////////////////////////////
export const softServeTensorDescription: TensorDescription = {
    tid: 1,
    name: 'soft serve',
    dimensions: [size, flavor],
};

export const coffeeTensorDescription: TensorDescription = {
    tid: 2,
    name: 'coffee',
    dimensions: [size, temperature, caffeine],
};

export const milkTensorDescription: TensorDescription = {
    tid: 3,
    name: 'milk',
    dimensions: [milk],
};

///////////////////////////////////////////////////////////////////////////////
//
//  Dimensions
//
///////////////////////////////////////////////////////////////////////////////
export const sizeDimension = new Dimension(size, 'sizes', sizes.values());

export const flavorDimension = new Dimension(
    flavor,
    'flavors',
    flavors.values()
);

export const temperatureDimension = new Dimension(
    temperature,
    'temeperatures',
    temperatures.values()
);

export const caffeineDimension = new Dimension(
    caffeine,
    'caffeines',
    caffeines.values()
);

export const milkDimension = new Dimension(
    milk,
    'milks',
    milks.values()
);

export const softServeDimensions = [sizeDimension, flavorDimension];

export const milkDimensions = [milkDimension];

export const coffeeDimensions = [
    sizeDimension,
    temperatureDimension,
    caffeineDimension,
];

///////////////////////////////////////////////////////////////////////////////
//
//  AttributesYaml
//
///////////////////////////////////////////////////////////////////////////////
export const emptyAttributes: DimensionAndTensorDescription = {
    dimensions: [],
    tensors: [],
};

export const smallWorldAttributes: DimensionAndTensorDescription = {
    dimensions: [
        sizeDimensionDescription,
        flavorDimensionDescription,
        temperatureDimensionDescription,
        caffieneDimensionDescription,
        milkDimensionDescription
    ],
    tensors: [
        softServeTensorDescription,
        coffeeTensorDescription,
        milkTensorDescription
    ],
};

///////////////////////////////////////////////////////////////////////////////
//
//  Specific Cones (size, flavor)
//
///////////////////////////////////////////////////////////////////////////////
export const smallVanillaCone: SpecificTypedEntity = {
    sku: 8001,
    name: 'small vanilla cone',
    key: '8000:0:0',
    kind: MENUITEM,
};

export const smallChocolateCone: SpecificTypedEntity = {
    sku: 8002,
    name: 'small chocolate cone',
    key: '8000:0:1',
    kind: MENUITEM,
};

export const mediumVanillaCone: SpecificTypedEntity = {
    sku: 8003,
    name: 'medium vanilla cone',
    key: '8000:1:0',
    kind: MENUITEM,
};

export const mediumChocolateCone: SpecificTypedEntity = {
    sku: 8004,
    name: 'medium chocolate cone',
    key: '8000:1:1',
    kind: MENUITEM,
};

///////////////////////////////////////////////////////////////////////////////
//
//  Specific Coffees (size, temperature, caffeine)
//
///////////////////////////////////////////////////////////////////////////////
export const smallCoffee: SpecificTypedEntity = {
    sku: 9001,
    name: 'small coffee',
    key: '9000:0:0:0',
    kind: MENUITEM,
};

export const smallDecafCoffee: SpecificTypedEntity = {
    sku: 9002,
    name: 'small coffee',
    key: '9000:0:0:1',
    kind: MENUITEM,
};

export const smallIcedCoffee: SpecificTypedEntity = {
    sku: 9003,
    name: 'small coffee',
    key: '9000:0:1:0',
    kind: MENUITEM,
};

export const smallIcedDecafCoffee: SpecificTypedEntity = {
    sku: 9004,
    name: 'small coffee',
    key: '9000:0:1:1',
    kind: MENUITEM,
};

export const mediumCoffee: SpecificTypedEntity = {
    sku: 9005,
    name: 'medium coffee',
    key: '9000:1:0:0',
    kind: MENUITEM,
};

export const mediumDecafCoffee: SpecificTypedEntity = {
    sku: 9006,
    name: 'medium decaf coffee',
    key: '9000:1:0:1',
    kind: MENUITEM,
};

export const mediumIcedCoffee: SpecificTypedEntity = {
    sku: 9007,
    name: 'medium iced coffee',
    key: '9000:1:1:0',
    kind: MENUITEM,
};

export const mediumIcedDecafCoffee: SpecificTypedEntity = {
    sku: 9008,
    name: 'medium iced decaf coffee',
    key: '9000:1:1:1',
    kind: MENUITEM,
};

export const wholeMilk: SpecificTypedEntity = {
    sku: 5000,
    name: 'whole milk',
    key: '5000:0',
    kind: OPTION,
};

export const twoMilk: SpecificTypedEntity = {
    sku: 5001,
    name: 'two percent milk',
    key: '5000:1',
    kind: OPTION,
};

export const zeroMilk: SpecificTypedEntity = {
    sku: 5002,
    name: 'fat free milk',
    key: '5000:2',
    kind: OPTION,
};

export const soyMilk: SpecificTypedEntity = {
    sku: 5003,
    name: 'soy milk',
    key: '5000:3',
    kind: OPTION,
};

export const specificItems: SpecificTypedEntity[] = [
    smallVanillaCone,
    smallChocolateCone,
    mediumVanillaCone,
    mediumChocolateCone,
    smallCoffee,
    smallDecafCoffee,
    smallIcedCoffee,
    smallIcedDecafCoffee,
    mediumCoffee,
    mediumDecafCoffee,
    mediumIcedCoffee,
    mediumIcedDecafCoffee,
    wholeMilk,
    twoMilk,
    zeroMilk,
    soyMilk,
];

///////////////////////////////////////////////////////////////////////////////
//
//  smallWorldCatalog
//
///////////////////////////////////////////////////////////////////////////////
export const smallWorldCatalog = Catalog.fromEntities(
    genericItems.values(),
    specificItems.values()
);

///////////////////////////////////////////////////////////////////////////////
//
//  smallWorldCookbook
//
///////////////////////////////////////////////////////////////////////////////
// TODO: make a better cookbook
const recipeList: RecipeList = { 
    products: [],
    options: []
};
export const smallWorldCookbook = new Cookbook(recipeList);

///////////////////////////////////////////////////////////////////////////////
//
//  Rules
//
///////////////////////////////////////////////////////////////////////////////
export const smallWorldRules: RuleConfig = {
    rules: [
        {
            partialKey: '9000', // All coffees
            validCategoryMap: {
                '500': {
                    validOptions: [5000],
                    qtyInfo: {
                        '': { defaultQty: 1, minQty: 1, maxQty: 1 },
                    },
                },
            },
            exclusionZones: { 500: [5000] }, // Milk is exclusive
            specificExceptions: [],
        },
    ],
};

export const smallWorldRuleChecker = new RuleChecker(
    smallWorldRules,
    smallWorldCatalog.getGenericMap()
);
