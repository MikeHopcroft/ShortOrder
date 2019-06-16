import {
    AttributeX,
    AttributedOptionX,
    EITHER,
    EntityX,
    LEFT,
    OptionX,
    QuantifiedOptionX,
    QuantityX,
    RIGHT,
    SegmentX,
    Random
} from '../src/fuzzer2';

function go() {
    const quantity = new QuantityX(1, 'a', LEFT);

    const attributes: AttributeX[] = [
        new AttributeX(1, 'grande', LEFT),
        new AttributeX(2, 'decaf', EITHER),
        new AttributeX(2, 'iced', EITHER),
    ];

    const fivePumps = new QuantityX(5, 'five pump', LEFT);
    const aPump = new QuantityX(1, 'a pump of', RIGHT);

    const extra = new AttributeX(5, 'extra', LEFT);

    const options: OptionX[] = [
        new QuantifiedOptionX(fivePumps, '12:1', 'cinnamon dolce syrup'),
        new AttributedOptionX(extra, '14:2', 'vanilla syrup'),
    ];

    const entity = new EntityX(
        quantity,
        attributes,
        options,
        '9000:0:0:1',
        'latte'
    );

    const random = new Random("1234");

    for (let i = 0; i < 10; ++i) {
        const segment = entity.randomSegment(random);
        const text = segment.buildText().join(' ');
        console.log(text);
    } 
}

go();
