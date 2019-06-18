import { AliasGenerator } from './alias_generator';
import { OrderX, SegmentX } from './fuzzer';
import { ProductGenerator } from './product_generator';
import { Random } from './utilities';


export class OrderGenerator {
    prologueGenerator: AliasGenerator;
    productGenerator: ProductGenerator;
    maxSegments: number;
    epilogueGenerator: AliasGenerator;

    constructor(
        prologueGenerator: AliasGenerator,
        productGenerator: ProductGenerator,
        maxSegments: number,
        epilogueGenerator: AliasGenerator
    ) {
        this.prologueGenerator = prologueGenerator;
        this.productGenerator = productGenerator;
        this.maxSegments = maxSegments;
        this.epilogueGenerator = epilogueGenerator;
    }
    
    randomOrder(random: Random): OrderX {
        const segments: SegmentX[] = [];
        const count = random.randomInRange(1, this.maxSegments + 1);
        for (let i = 0; i < count; ++i) {
            const product = this.productGenerator.randomProduct(random);
            const segment = product.randomSegment(random);
            segments.push(segment);
        }

        return new OrderX(
            this.prologueGenerator.randomAlias(random),
            segments,
            this.epilogueGenerator.randomAlias(random)
        );
    }
}