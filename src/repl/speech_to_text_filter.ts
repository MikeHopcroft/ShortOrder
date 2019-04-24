import * as numberToWords from 'number-to-words';

// NOTE: These patterns cannot contain punctuation like periods because 
// punctuation is stripped out before word replacement.
// ISSUE: current code doesn't handle "1/4lb".
// ISSUE: what about an apostrophe like in "Mike's"?
// ISSUE: Copyright (c), TM
const replacements : {[key:string]:string} = {
    'okay': 'ok',
    'dr': 'doctor',
    '1/2': 'half',
    '1/3': 'third',
    '1/4': 'quarter',
    'oz': 'ounce',
    'lb': 'pound',
    'lbs': 'pounds',
};

export function speechToTextFilter(input: string): string {
    const a = input.replace('&', ' and ').replace('%', ' percent ');

    // Remove MS Word quotes.
    const b = a.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

    // Remove punctuation.
    const c = b.replace(/[,\.\?\!"\-\(\)]/g, ' ');

    // Collapse multiple spaces.
    const d = c.replace(/\s+/g, ' ').trim();

    const words = d.split(/\s+/);

    const e = words.map( word => {
        if (/^\d+$/.test(word)) {
            const x = numberToWords.toWords(Number(word));
            const y = x.replace('-', ' ');
            const z = y.replace(',', '');
            return z;
        }
        else {
            return word;
        }
    });

    const f = e.map( word => {
        const replaced = replacements[word.toLowerCase()];
        if (replaced) {
            return replaced;
        }
        else {
            return word;
        }
    });

    return f.join(' ');
}

