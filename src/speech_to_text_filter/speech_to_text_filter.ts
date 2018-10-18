import * as numberToWords from 'number-to-words';

const replacements : {[key:string]:string} = {
    'okay': 'ok',
    'dr.': 'doctor',
    '1/2': 'half',
    '1/4': 'quarter',
    'oz': 'ounce',
    'lb': 'pound'
};

// Sample run.
// import { speechToTextFilter } from './speech_to_text_filter';
// speechToTextFilter('Can I get 23 burgers? (hi) Okay! 2% milk. 1/2 lb');


export function speechToTextFilter(input: string): string {
    // Does this run on individual words or whole lines?
    // Replace punctuation with spaces, except for ' adjacent to nonwhite (e.g. I'll of 'n)
    //   Especially [,.?!"-]
    // Replace arabic numerals with text
    // Convert ampersands to 'and'
    // Canonicalize 'ok' and 'dr.'
    // Replace MSWord quotes
    // Remove all but one space between words
    // What about apostrophe in "Reese's Peanut Butter Cups" vs "I'll"?

    console.log(`input: "${input}"`);

    const a = input.replace('&', ' and ').replace('%', ' percent ');
    console.log(`removed punctuation: "${a}"`);

    // Remove MS Word quotes.
    const b = a.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    console.log('removed MS Word quotes.');

    // Remove punctuation.
    const c = b.replace(/[,\.\?\!"-\(\)]/g, ' ');
    console.log('replaced "&" with "and".');

    // Collapse multiple spaces.
    const d = c.replace(/\s+/g, ' ').trim();

    const words = d.split(' ');

    const e = words.map( word => {
        if (/^\d+$/.test(word)) {
            return numberToWords.toWords(Number(word)).replace('-', ' ');
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

    console.log(`Replaced numbers: "${f.join(" ")}"`);

    return input;
}

