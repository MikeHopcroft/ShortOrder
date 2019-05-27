import { AttributeInfo, MatrixEntityBuilder, PID } from 'prix-fixe';
import { NumberToken } from 'token-flow';

import { OptionToken, QuantityToken } from "../unified";

export type QuantifierToken = NumberToken | QuantityToken;

export class Builder extends MatrixEntityBuilder {
    private readonly options = new Map<PID, number>();
    private readonly quantifiers: QuantifierToken[] = [];

    constructor(info: AttributeInfo) {
        super(info);
    }

    addQuantifier(token: QuantifierToken) {
        this.quantifiers.push(token);
    }

    getQuantity(): number {
        if (this.quantifiers.length === 0) {
            // Default is 1.
            return 1;
        }
        else if (this.quantifiers.length === 1) {
            // If there is one quantifier, just return it.
            return this.quantifiers[0].value;
        }
        else if (this.quantifiers.find(x => x.value === 0)) {
            // If there are multiple quantifiers and at least one is zero,
            // return zero. This handles cases like "with no", where "with"
            // becomes 1 and "no" becomes 0.
            // TODO: should this be solved here or in intents.yaml?
            return 0;
        }
        else {
            // Otherwise, return the maximum quantifer. This handles cases
            // like "with five", where "with" becomes 1 and "five" becomes 5.
            // TODO: should this be solved here or in intents.yaml?
            return Math.max(...this.quantifiers.map(x => x.value));
        }
    }

    // TODO: this should add a quantified option
    addOption(option: OptionToken, quantity: number): boolean {
        if (this.options.has(option.id)) {
            return false;
        }
        else {
            this.options.set(option.id, quantity);
            return true;
        }
    }

    getOptions(): IterableIterator<[PID, number]> {
        return this.options.entries();
    }
}
