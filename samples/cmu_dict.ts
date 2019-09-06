import * as fs from 'fs';

import { createHistogram } from '../src';

class CMUDict {
    phoneticToWords = new Map<string, string[]>();
    wordToPhonetic = new Map<string, string[]>();

    constructor(infile: string) {
        const inputText = fs.readFileSync(infile, 'utf-8');
        const lines = inputText.split(/\r?\n/);

        const re = /(.*)\(\d+\)$/;

        let lineNumber = 0;
        for (const line of lines) {
            lineNumber++;
            if (line.startsWith(';;;')) {
                // Skip over comments
                continue;
            }
            const parts = line.split('  ');
            if (parts.length === 2) {
                let word = parts[0];
                const match = word.match(re);
                if (match) {
                    word = match[1];
                }
                const phonetic = parts[1];

                const words = this.phoneticToWords.get(phonetic);
                if (words) {
                    words.push(word);
                } else {
                    this.phoneticToWords.set(phonetic, [word]);
                }

                const phonetics = this.wordToPhonetic.get(word);
                if (phonetics) {
                    phonetics.push(phonetic);
                } else {
                    this.wordToPhonetic.set(word, [phonetic]);
                }
                // if (this.wordToPhonetic.has(word)) {
                //     console.log(`Duplicate word "${word}" on line ${lineNumber}`);
                // } else {
                //     this.wordToPhonetic.set(word, phonetic);
                // }
            } else {
                console.log(`Skipping line ${lineNumber}: "${line}"`);
            }
        }
    }

    summarize() {
        console.log(`Words: ${this.wordToPhonetic.size}`);
        console.log(`Phonetics: ${this.phoneticToWords.size}`);

        const p = [...this.phoneticToWords.entries()].sort((a,b): number => {
            return b[1].length - a[1].length;
        });
        console.log('Histogram of phonetic set sizes:');
        const histogram = createHistogram(p.map(x => x[1].length).values());
        for (const [size, count] of histogram) {
            console.log(`    ${size}: ${count}`);
        }

        // for (let i = 0; i < 1000; ++i) {
        //     const phonetic = p[i][0];
        //     const words = p[i][1].join(' ');
        //     console.log(`${phonetic}: [${words}]`);
        // }

        let counter = 0;
        for (const word of this.wordToPhonetic.keys()) {
            ++counter;
            if (counter > 135000) {
                break;
            }
            const segments = [...this.segment(word)];
            if (segments.length > 0) {
                const text = segments.map(x => `(${x.join(",")})`).join(' ');
                console.log(`${word}: ${text}`);
            }
        }

        // for (let i = 1000; i < 2000; ++i) {
        //     // const w = 
        // }
    }

/*
CONCEALED: (CAN,SEALED)
CONCEALING: (CAN,CEILING)
DEEPENED: (DEEP,AND)
DESERVING: (DOES,IRVING)
DISEASES: (DOES,EASES)
EIGHTEEN: (A,TEEN)
EMOTION: (HIM,OCEAN)
ENGINEERS: (ENGINE,EARS)
EXITS: (EGGS,IT'S)
FADED: (FAY,DID)
FAILURES: (FAIL,YOURS)
FATTENED: (FAT,AND)
FEUDED: (FEW,DID)
FIELDED: (FEEL,DID)
FIGURES: (FIG,YOURS)
FLINTSTONE: (FLINT,STONE) (FLINT'S,TONE)
FRESHENED: (FRESH,AND)
GOODWILL: (GOOD,WE'LL)
HEIGHTENED: (HEIGHT,AND)
HERDED: (HER,DID)
ISLAND: (AISLE,AND)
LAWYERS: (LAW,YOURS)
LEGEND: (LEDGE,AND)
LENGTHENED: (LENGTH,AND) (LENGTH,AND)
LISBON: (LIZ,BEEN)
NEW_YORK: (GNU,YORK)
NODDED: (NA,DID)
OCCULT: (A,CULT)
OCCURRED: (A,CURD)
PACKETS: (PAC,IT'S)
POISONED: (POISE,AND)
PUPPETS: (PUP,IT'S)
SEASONED: (C'S,AND)
SHADED: (CHEZ,DID)
SPIRITS: (SPEAR,IT'S)
SUMMITS: (SOME,IT'S)
SUMMONED: (SOME,AND)
TIBET: (TO,BET)
TONIGHT: (TO,KNIGHT)
TOPPINS: (TOP,IN'S)
TRADED: (TRAY,DID)
TRAINEES: (TRAY,KNEES)
UPHOLSTER: (A,POLLSTER)
WADED: (WAY,DID)
WARRIORS: (WAR,YOURS)
WEAKENED: (WEAK,AND)
WELDED: (WELL,DID)
WORDED: (WE'RE,DID)
WORKIN': (WE'RE,CAN)

be four the tray knees way did to the aisle and they left the some it
what waded the engine ears
welded the engine ears 
can sealed eggs its
*/

    // Find segmentations of one word into two
    *segment(word: string): IterableIterator<[string, string]> {
        const pronunciations = this.wordToPhonetic.get(word);
        if (pronunciations) {
            for (const pronunciation of pronunciations) {
                const phonemes = pronunciation.split(' ');
                if (phonemes.length > 1) {
                    for (let i = 0; i < phonemes.length - 2; ++i) {
                        const left = phonemes.slice(0,i).join(' ');
                        const right = phonemes.slice(i).join(' ');

                        const leftWord = this.phoneticToWords.get(left);
                        const rightWord = this.phoneticToWords.get(right);

                        if (leftWord && rightWord) {
                            // TODO: look at all words, not just first
                            yield [leftWord[0],rightWord[0]];
                        }
                    }
                }
            }
        }
    }
    // Find segmentations of two adjacent words into one
}


function go() {
    // const line = 'AARDVARKS  AA1 R D V AA2 R K S';
    // const parts = line.split('  ');
    // console.log(`word: "${parts[0]}"`);
    // console.log(`phonetic: "${parts[1]}"`);

    // const line = "a(1)";
    // const re = /(.*)\(\d+\)$/;
    // const m = line.match(re);

    // const line2 = "a";
    // const m2 = line2.match(re);

    const d = new CMUDict("d:\\git\\menubot\\cmudict\\cmudict-0.7b.txt");
    d.summarize();
}

go();
