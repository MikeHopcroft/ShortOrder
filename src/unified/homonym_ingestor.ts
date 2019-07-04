import { IIngestor, Token, Tokenizer, TokenizerAlias } from 'token-flow';

export class HomonymIngestor implements IIngestor {
    tokens = new Map<string, TokenizerAlias[]>();

    constructor() {

    }

    // TODO: most fields of the TokenizerAlias are the same for homonyms.
    // Investigate whether this is true for isDownstreamTerm.

    addItem(alias: TokenizerAlias): void {
        throw new Error("Method not implemented.");
    }

    ingest(ingestor: IIngestor): void {
        throw new Error("Method not implemented.");
    }
}