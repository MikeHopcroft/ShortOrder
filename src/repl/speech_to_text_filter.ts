import * as numberToWords from 'number-to-words';

// NOTE: These patterns cannot contain punctuation like periods because 
// punctuation is stripped out before word replacement.
// ISSUE: current code doesn't handle "1/4lb".
// ISSUE: what about an apostrophe like in "Mike's"?
// ISSUE: Copyright (c), TM
const patterns: Array<[RegExp, string]> = [
    // Partial-word replacements (e.g. 'm&ms' ==> 'm and ms', '5lbs' => '5 lbs')
    [/&/g, ' and '],
    [/%/g, ' percent '],
    [/oz/g, ' ounce '],
    [/#s/g, ' pounds '], // '#s' must come before '#' to avoid partial match.
    [/#/g, ' pound '],
    [/lbs/g, ' pounds'], // 'lbs' must come before 'lb' to avoid partial match.
    [/lb/g, ' pound'],
    [/w\//g, ' with '],
    [/[\u2018\u2019]/g, "'"],   // MS Word single quotes.
    [/[\u201C\u201D]/g, '"'],   // MS Word double quotes.

    // NOTE: cannot break on '/' here because patterns below (e.g. '1/2' use '/').
    // NOTE: do want to run punctuation-to-space replacements before whole-word
    // replacements to ensure that newly broken words can be updated by the
    // whole-word patterns, below.
    // TODO: BUGBUG: Don't want to split numbers when removing commas.
    [/[,\.\?\!"\-\(\)]/g, ' '],

    // // Whole-word replacements.
    [/\bokay\b/g, 'ok'],
    [/\bdr\b/g, 'doctor'],
    [/\b1\/2\b/g, 'one half'],
    [/\b1\/3\b/g, 'one third'],
    [/\b1\/4\b/g, 'one quarter'],
    [/\bblt\b/g, 'b l t'],
    [/\bpbj\b/g, 'p b j'],      // 'pbj' must come before 'pb' to avoid partial match.
    [/\bpb\b/g, 'p b']
];

export function speechToTextFilter(input: string): string {
    // Convert everything to lowercase.
    const a = input.toLowerCase();

    // Replace word-breaking sequences, e.g. '5lbs' ==> '5 lbs '
    let b = a;
    for (const [pattern, replacement] of patterns) {
        b = b.replace(pattern, replacement);
    }

    const words = b.trim().split(/\s+/);

    const e = words.map( word => {
        if (/^\d+$/.test(word)) {
            const x = numberToWords.toWords(Number(word));

            // Remove dashes from numbers, e.g. twenty-three
            const y = x.replace('-', ' ');

            // Remove commas from numbers.
            const z = y.replace(',', '');
            return z;
        }
        else {
            return word;
        }
    });

    return e.join(' ');
}
