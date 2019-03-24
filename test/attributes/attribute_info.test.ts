import { assert } from 'chai';
import 'mocha';

import { PID } from 'token-flow';

import { ENTITY, EntityToken, ATTRIBUTE, AttributeToken } from '../../src';
import { AttributeInfo } from '../../src/attributes/attribute_info';
import { Dimension } from '../../src/attributes/dimension';
import { AttributeItem } from '../../src/attributes/interfaces';
import { Matrix } from '../../src/attributes/matrix';
import { MatrixEntityBuilder } from '../../src/attributes/matrix_entity_builder';

// A PID that is not indexed in any data structure in this file.
// For testing error cases.
const unknownPID = 9999;

// A key that is not indexed in any data structure in this file.
// For testing error cases.
const unknownKey = '9999';

const attributes: AttributeItem[] = [
    {
        pid: 0,
        name: 'zero',
        aliases: ['zero', 'z']
    },
    {
        pid: 1,
        name: 'one',
        aliases: ['one', 'first'],
        isDefault: true
    },
    {
        pid: 2,
        name: 'two',
        aliases: ['two', 'second']
    },
];

const sizeSmall = 0;
const sizeMedium = 1;
const sizeLarge = 2;
const sizes: AttributeItem[] = [
    {
        pid: sizeSmall,
        name: 'small',
        aliases: ['small']
    },
    {
        pid: sizeMedium,
        name: 'medium',
        aliases: ['medium'],
        isDefault: true
    },
    {
        pid: sizeLarge,
        name: 'large',
        aliases: ['large']
    },
];

const flavorVanilla = 3;
const flavorChocolate = 4;
const flavorStrawberry = 5;
const flavors: AttributeItem[] = [
    {
        pid: flavorVanilla,
        name: 'vanilla',
        aliases: ['vanilla'],
        isDefault: true
    },
    {
        pid: flavorChocolate,
        name: 'chocolate',
        aliases: ['chocolate']
    },
    {
        pid: flavorStrawberry,
        name: 'strawberry',
        aliases: ['strawberry']
    },
];

const styleRegular = 6;
const styleOriginal = 7;
const styles: AttributeItem[] = [
    {
        pid: styleRegular,
        name: 'regular',
        aliases: ['regular'],
        isDefault: true
    },
    {
        pid: styleOriginal,
        name: 'original',
        aliases: ['original']
    },
];

const temperatureHot = 8;
const temperatureCold = 9;
const temperatures: AttributeItem[] = [
    {
        pid: temperatureHot,
        name: 'hot',
        aliases: ['hot'],
        isDefault: true
    },
    {
        pid: temperatureCold,
        name: 'cold',
        aliases: ['colr', ' iced']
    },
];

const caffeineRegular = 10;
const caffeineDecaf = 11;
const caffeineHalfCaf = 12;
const caffeines: AttributeItem[] = [
    {
        pid: caffeineRegular,
        name: 'regular',
        aliases: ['regular'],
        isDefault: true
    },
    {
        pid: caffeineDecaf,
        name: 'decaf',
        aliases: ['decaf', 'unleaded']
    },
    {
        pid: caffeineHalfCaf,
        name: 'half caf',
        aliases: ['half caf', 'split shot']
    },
];



const size: PID = 0;
const flavor: PID = 1;
const style: PID = 2;
const sizeDimension = new Dimension(size, sizes.values());
const flavorDimension = new Dimension(flavor, flavors.values());
const styleDimension = new Dimension(style, styles.values());
const softServeDimensions = [
    sizeDimension,
    flavorDimension,
    styleDimension
];

const temperature: PID = 3;
const caffeine: PID = 4;
const temperatureDimension = new Dimension(temperature, temperatures.values());
const caffeineDimension = new Dimension(caffeine, caffeines.values());
const coffeeDimensions = [
    sizeDimension,
    temperatureDimension,
    caffeineDimension
];


function makeAttributeToken(id: PID): AttributeToken {
    return {
        type: ATTRIBUTE,
        id,
        name: `attribute(${id})`
    };
}


function makeEntityToken(pid: PID): EntityToken {
    return {
        type: ENTITY,
        pid,
        name: `entity(${pid})`
    };
}


describe('Matrix', () => {

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Dimension
    //
    ///////////////////////////////////////////////////////////////////////////////
    describe('Dimension', () => {
        it('Constructor', () => {
            const idOfDefault = 1;
            const anyDimensionId = 123;
            const dimension = new Dimension(anyDimensionId, attributes.values());

            assert.equal(dimension.id, anyDimensionId);
            assert.deepEqual(dimension.attributes, attributes);
            assert.equal(dimension.defaultAttribute, idOfDefault);
        });

        it('No attributes', () => {
            const anyDimensionId = 123;
            const f = () => new Dimension(anyDimensionId, [].values());

            assert.throws(f, `expect at least one attribute`);
        });

        it('Second default', () => {
            const anyDimensionId = 123;
            const f = () => new Dimension(anyDimensionId, [...attributes, ...attributes].values());

            assert.throws(f, `found second default attribute 1`);
        });

        it('No defaults', () => {
            const anyDimensionId = 123;
            const attributes2 = [attributes[0], attributes[2]];
            const f = () => new Dimension(anyDimensionId, attributes2.values());

            assert.throws(f, `expected at least one default attribute`);
        });
    });

    
    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Matrix
    //
    ///////////////////////////////////////////////////////////////////////////////
    describe('Matrix', () => {
        it('Constructor', () => {
            const anyMatrixId = 123;
            const matrix = new Matrix(anyMatrixId, softServeDimensions);

            assert.equal(matrix.id, anyMatrixId);
            assert.deepEqual(matrix.dimensions, softServeDimensions);
        });

        it('getKey()', () => {
            const anyMatrixId = 123;
            const matrix = new Matrix(anyMatrixId, softServeDimensions);

            const info = new AttributeInfo();
            for (const dimension of softServeDimensions) {
                info.addDimension(dimension);
            }

            const dimensionIdToAttribute = new Map<PID, PID>();
            dimensionIdToAttribute.set(size, sizeMedium);
            dimensionIdToAttribute.set(flavor, flavorStrawberry);
            dimensionIdToAttribute.set(style, styleRegular);

            const anyEntityId = 456;

            // anyEntityId: 456
            //      medium:   1
            //  strawberry:   2
            //     regular:   0
            //         key: 456:1:2:0
            assert.equal(matrix.getKey(anyEntityId, dimensionIdToAttribute, info), "456:1:2:0");
        });
    });

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  AttributeInfo
    //
    ///////////////////////////////////////////////////////////////////////////////
    describe('AttributeInfo', () => {
        it('addDimension()', () => {
            const info = new AttributeInfo();

            info.addDimension(softServeDimensions[0]);
            info.addDimension(softServeDimensions[1]);
            info.addDimension(softServeDimensions[2]);

            const cases = [
                // Sizes
                { pid: sizeSmall, coordinate: { dimension: sizeDimension, position: 0 }},
                { pid: sizeMedium, coordinate: { dimension: sizeDimension, position: 1 }},
                { pid: sizeLarge, coordinate: { dimension: sizeDimension, position: 2 }},

                // Flavors
                { pid: flavorVanilla, coordinate: { dimension: flavorDimension, position: 0 }},
                { pid: flavorChocolate, coordinate: { dimension: flavorDimension, position: 1 }},
                { pid: flavorStrawberry, coordinate: { dimension: flavorDimension, position: 2 }},

                // Styles
                { pid: styleRegular, coordinate: { dimension: styleDimension, position: 0 }},
                { pid: styleOriginal, coordinate: { dimension: styleDimension, position: 1 }},

                // Unknown attribute
                { pid: unknownPID, coordinate: undefined }
            ];

            for (const test of cases) {
                const observed = info.getAttributeCoordinates(test.pid);
                const expected = test.coordinate;
                assert.deepEqual(observed, expected);   
            }
        });

        it('addDimension() - exceptions', () => {
            const info = new AttributeInfo();
            info.addDimension(softServeDimensions[0]);

            // Attempt adding a dimension with the same id.
            const f1 = () => info.addDimension(softServeDimensions[0]);
            assert.throws(f1, `found duplicate dimension id 0.`);

            // Attempt adding an attribute with a duplicate pid.
            const uniqueId = softServeDimensions[0].id + 1;
            const sizesDimension = new Dimension(uniqueId, sizes.values());
            const f2 = () => info.addDimension(sizesDimension);
            assert.throws(f2, `found duplicate attribute pid 0.`);
        });

        it('addMatrix()', () => {
            const info = new AttributeInfo();

            const anyMatrixId = 123;
            const matrix = new Matrix(anyMatrixId, softServeDimensions);

            info.addMatrix(matrix);

            const f = () => info.addMatrix(matrix);
            assert.throws(f, 'found duplicate matrix id 123.');
        });

        it('addGenericEntity()', () => {
            const info = new AttributeInfo();

            const softServeMatrixId = 123;
            const softServeMatrix = new Matrix(softServeMatrixId, softServeDimensions);
            info.addMatrix(softServeMatrix);

            const coffeeMatrixId = 456;
            const coffeeMatrix = new Matrix(coffeeMatrixId, coffeeDimensions);
            info.addMatrix(coffeeMatrix);

            // Attempt to reference a non-existant maxtrix.
            const f1 = () => info.addGenericEntity(1, unknownPID);
            assert.throws(f1, 'unknown matrix id 9999.');

            info.addGenericEntity(1, softServeMatrixId);

            // Attempt to add a duplicate entity.
            const f2 = () => info.addGenericEntity(1, unknownPID);
            assert.throws(f2, 'found duplicate entity id 1.');

            info.addGenericEntity(2, coffeeMatrixId);

            // Lookup entities with ids 1 and 2.
            assert.equal(softServeMatrix, info.getMatrixForEntity(1));
            assert.equal(coffeeMatrix, info.getMatrixForEntity(2));

            // Attempt to lookup non-existant entity.
            assert.equal(undefined, info.getMatrixForEntity(unknownPID));
        });

        it('addSpecificEntity()', () => {
            const info = new AttributeInfo();

            info.addSpecificEntity(1, '123');

            // Attempt to add entity with key="123" again.
            const f = () => info.addSpecificEntity(1, '123');
            assert.throws(f, 'found duplicate entity key 123.');

            info.addSpecificEntity(2, '456');

            assert.equal(1, info.getPID('123'));
            assert.equal(2, info.getPID('456'));
            assert.equal(undefined, info.getPID(unknownKey));
        });
    });

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  MaxtrixEntityBuilder
    //
    ///////////////////////////////////////////////////////////////////////////////
    describe('MaxtrixEntityBuilder', () => {
        it('Constructor', () => {
        });
        
        it('hasEntity()/setEntity()', () => {
            const info = new AttributeInfo();
            const builder = new MatrixEntityBuilder(info);

            // Haven't added an entity yet.
            assert.isFalse(builder.hasEntity());

            const entity: EntityToken = {
                type: ENTITY,
                pid: 123,
                name: 'something'
            };
            builder.setEntity(entity);

            assert.isTrue(builder.hasEntity());

            const f = () => builder.setEntity(entity);
            assert.throws(f, 'attempting to overwrite entity 123 with 123');
        });


        it('addAttribute()', () => {
            const info = new AttributeInfo();
            info.addDimension(softServeDimensions[0]);
            info.addDimension(softServeDimensions[1]);
            info.addDimension(softServeDimensions[2]);

            const builder = new MatrixEntityBuilder(info);

            const f = () => builder.addAttribute(makeAttributeToken(unknownPID));
            assert.throws(f, 'unknown attribute 9999.');

            // First time adding a size should succeed.
            assert.isTrue(builder.addAttribute(makeAttributeToken(sizeSmall)));

            // Second size addition should fail.
            assert.isFalse(builder.addAttribute(makeAttributeToken(sizeLarge)));

            // First time adding a flavor should succeed.
            assert.isTrue(builder.addAttribute(makeAttributeToken(flavorChocolate)));
        });

        
        it('getPID()', () => {
            const info = new AttributeInfo();
            info.addDimension(softServeDimensions[0]);
            info.addDimension(softServeDimensions[1]);
            info.addDimension(softServeDimensions[2]);

            const softServeMatrixId = 123;
            const softServeMatrix = new Matrix(softServeMatrixId, softServeDimensions);
            info.addMatrix(softServeMatrix);

            // Configure with a generic ice cream cone item.
            const cone = 456;
            info.addGenericEntity(cone, softServeMatrixId);

            // Configure with a specific `medium vanilla regular cone`.
            // Key is (size:1)*1 + (flavor:0)*3 + (style:0)*9 = 1
            const mediumVanillaRegularCone = 500;
            info.addSpecificEntity(mediumVanillaRegularCone, '456:1:0:0');

            // Configure with a specific `medium chocolate regular cone`.
            // Key is (size:1)*1 + (flavor:1)*3 + (style:0)*9 = 4
            const mediumChocolateRegularCone = 501;
            info.addSpecificEntity(mediumChocolateRegularCone, '456:1:1:0');

            // Configure with a specific `large chocolate regular cone`.
            // Key is (size:2)*1 + (flavor:1)*3 + (style:0)*9 = 5
            const largeChocolateRegularCone = 502;
            info.addSpecificEntity(largeChocolateRegularCone, '456:2:1:0');

            const builder = new MatrixEntityBuilder(info);

            // getPID() before adding entity should throw.
            const f = () => builder.getPID();
            assert.throws(f, 'no entity set');

            // Add a cone entity.
            builder.setEntity(makeEntityToken(cone));

            // All attributes are default.
            assert.equal(builder.getPID(), mediumVanillaRegularCone);

            // Add flavor=chocolate, style=regular, allow size to default.
            builder.addAttribute(makeAttributeToken(flavorChocolate));
            builder.addAttribute(makeAttributeToken(styleRegular));

            assert.equal(builder.getPID(), mediumChocolateRegularCone);

            // Now specify large size, which is not a default.
            builder.addAttribute(makeAttributeToken(sizeLarge));
            assert.equal(builder.getPID(), largeChocolateRegularCone);

            // Now create another builder and set the entity to something that
            // is not generic.
            const builder2 = new MatrixEntityBuilder(info,);
            builder2.setEntity(makeEntityToken(unknownPID));
            assert.equal(builder2.getPID(), unknownPID);
        });
    });

});
