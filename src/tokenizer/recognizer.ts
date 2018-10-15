import { Token } from '.';

export interface Recognizer {
    apply: (token: Token) => Token[];
    stemmer: (term: string) => string;
    terms: () => Set<string>;
}

