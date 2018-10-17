import { Recognizer, StemmerFunction } from '../tokenizer';


export function stemmerConfusionMatrix(recognizer: Recognizer, stemmer: StemmerFunction) {
    const matrix: {[term:string]:Set<string>} = {};

    recognizer.terms().forEach( term => {
        const lower = term.toLowerCase();
        const stemmed = stemmer(lower);
        if (matrix[stemmed] === undefined) {
            matrix[stemmed] = new Set<string>();
        }
        matrix[stemmed].add(lower);
    });

    Object.entries(matrix).forEach(([key, value]) => {
        if (value.size > 1) {
            const values = [...value].join(',');
            console.log(`"${key}": [${values}]`);
        }
    });
}

