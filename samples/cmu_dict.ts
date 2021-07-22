import fs from 'fs';
const metaphone = require('talisman/phonetics/metaphone') as (word:string)=>string;

import { createHistogram, Random } from '../src';

class CMUDict {
    metaphoneToWords = new Map<string, string[]>();
    phoneticToWords = new Map<string, string[]>();
    wordToPhonetic = new Map<string, string[]>();
    words: string[];

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

                // Update phonetic => { word } map.
                const words = this.phoneticToWords.get(phonetic);
                if (words) {
                    words.push(word);
                } else {
                    this.phoneticToWords.set(phonetic, [word]);
                }

                // Update metaphone => { Word } map.
                const meta = metaphone(word);
                const mwords = this.metaphoneToWords.get(meta);
                if (mwords) {
                    mwords.push(word);
                } else {
                    this.metaphoneToWords.set(meta, [word]);
                }

                // Update word => { pronounciation } map
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
        this.words = [...this.wordToPhonetic.keys()];
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

        for (let i=0; i<1000; ++i) {
            console.log(`${p[i][1].join(" ")}`);
        }

        // let counter = 0;
        // for (const word of this.wordToPhonetic.keys()) {
        //     ++counter;
        //     if (counter > 135000) {
        //         break;
        //     }
        //     const segments = [...this.segment(word)];
        //     if (segments.length > 0) {
        //         const text = segments.map(x => `(${x.join(",")})`).join(' ');
        //         console.log(`${word}: ${text}`);
        //     }
        // }

        const random = new Random('XYZ1234567');
        for (let count = 0; count < 10000000; ++count) {
            const word1 = random.randomChoice(this.words);
            const word2 = random.randomChoice(this.words);

            const segments = [...this.segment2(word1, word2)];
            if (segments.length > 0) {
                const text = segments.map(x => `(${x.join(",")})`).join(' ');
                console.log(`${word1} ${word2}: ${text}`);
            }
        }

        // let counter1 = 0;
        // for (const word1 of this.wordToPhonetic.keys()) {
        //     ++counter1;
        //     if (counter1 > 1000) {
        //         let counter2 = 0;
        //         for (const word2 of this.wordToPhonetic.keys()) {
        //             ++counter2;
        //             if (counter2 > 135000) {
        //                 break;
        //             } else if (counter2 > 1000) {
        //                 const segments = [...this.segment2(word1, word2)];
        //                 if (segments.length > 0) {
        //                     const text = segments.map(x => `(${x.join(",")})`).join(' ');
        //                     console.log(`${word1} ${word2}: ${text}`);
        //                 }
        //             }
        //         }
        //     }
        // }


        // const segments = [...this.segment('ISLAND')];
        // console.log(segments);
    }

/*
MOLDED MICHIE: (MOHL,DID,MICHIE)
UNWILLING COMPARABLY: ('N,WILLING,COMPARABLY) ('N,WILLING,COMPARABLY)
AGGRIEVE VALENSUELA: (A,GREAVE,VALENSUELA)
UNPLACED HUGE: ('N,PLACED,HUGE) ('N,PLACED,HUGE)
NON-JETS JONATHAN: (NON,JET'S,JOHNATHAN)
DAMONE MARKE: (DE,MOAN,MARC)
UNJUST BIGNELL: ('N,JUST,BIGNELL)
OPPOSING HOOTER: (A,POSING,HOOTER)
LONG-WINDED DELOATCH: (LONG,WINDED,DELOACH)
SHARP-SIGN REPOSITIONED: (SCHARP,SEIN,REPOSITIONED)
SYBASE'S AFFLICTED: (CY,BASES,AFFLICTED) (CYB,ACES,AFFLICTED)
UNSEALED BANGERT: ('N,SEALED,BANGERT)
KUIKEN BUGAY: (COO,CAN,BUGAY)
URBAIN WASKIEWICZ: (ARE,BAIN,WASKIEWICZ)
AMID HEADLINERS: (A,MID,HEADLINERS)
ABRIDGES CARNIVAL: (A,BRIDGES,CARNIVAL)
SHORTSIGHTED LOUT: (SHORT,CITED,LOUT)
NON-BINDING BIG-ASS: (NON,BINDING,BIG-ASS)
ENGROSSING ESTHETICS: (IN,GROSSING,AESTHETICS)
FORGET WRONGDOERS: (FOR,GET,WRONGDOERS)
LEFEBER ERIKA: (LE,FABER,ERICA)
AVERTS KUSIAK: (A,VERTZ,KUSIAK) (OF,ERTZ,KUSIAK)
DICLEMENTE ADMINISTRATION: (DES,CLEMENTE,ADMINISTRATION)
UNRATED TOUPEE: ('N,RATED,TOUPEE)

ADDLEMAN ETCETERA: (ADDLE,CETERA,MANETTE)
ADDLEMAN RECHRISTEN: (ADDLE,RISON,MANRIQUE)
ADDLEMAN ROEMMICH: (ADDLE,MC,MONROE)
ADDLEMAN ROWAND: (ADDLE,AND,MONROE)
ADDLEMAN ROWELL: (ADDLE,WILL,MONROE)
ADDLEMAN SO-CALLED: (ADDLE,CALLED,MANSEAU)
ADDLEMAN SOBIN: (ADDLE,BEEN,MANSEAU)
ADDLEMAN SOCO'S: (ADDLE,COSE,MANSEAU)
ADDRESSED ADDITIVE: (A,ADDITIVE,DRESSED)
ADDRESSED ADDITIVES: (A,ADDITIVES,DRESSED)
ADDRESSED ADDLE: (A,ADDLE,DRESSED)
ADDRESSED ADDLED: (A,ADDLED,DRESSED)
ADDRESSED ADDLEMAN: (A,ADDLEMAN,DRESSED)
ADDRESSED ADDRESS: (A,ADDRESS,DRESSED) (A,ADDRESS,DRESSED)
ADDRESSED ADDRESSABLE: (A,ADDRESSABLE,DRESSED)
*/

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
    *segment2(word1: string, word2: string): IterableIterator<[string, string, string]> {
        const pronunciations1 = this.wordToPhonetic.get(word1);
        const pronunciations2 = this.wordToPhonetic.get(word2);
        if (pronunciations1 && pronunciations2) {
            for (const pronunciation1 of pronunciations1) {
                for (const pronunciation2 of pronunciations2) {
                    const phonemes1 = pronunciation1.split(' ');
                    const phonemes2 = pronunciation2.split(' ');
                    if (phonemes1.length > 1 && phonemes2.length > 1) {
                        for (let i = 1; i < phonemes1.length - 2; ++i) {
                            for (let j = 1; j < phonemes2.length - 2; ++j) {
                                const left = phonemes1.slice(0,i).join(' ');
                                const middle = [
                                    ...phonemes1.slice(i),
                                    ...phonemes2.slice(0,j)
                                ].join(' ');
                                const right = phonemes2.slice(j).join(' ');

                                const leftWord = this.phoneticToWords.get(left);
                                const middleWord = this.phoneticToWords.get(middle);
                                const rightWord = this.phoneticToWords.get(right);

                                if (leftWord && rightWord && middleWord) {
                                    // TODO: look at all words, not just first
                                    yield [leftWord[0],middleWord[0],rightWord[0]];
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    metaphoneProject(text: string) {
        const words = text.split(/\s+/);
        for (const word of words) {
            console.log(`${word}`);
            const m = metaphone(word);
            console.log(`  ${m}`);
            const w = this.metaphoneToWords.get(m);
            if (w) {
                console.log(`  ${w.length}: ${w.join(', ').toLowerCase()}`);
            } else {
                console.log('  ---');
            }
        }
    }

    phoneticExpand(word: string): string {
        const phonetics = this.wordToPhonetic.get(word.toUpperCase());
        if (phonetics) {
            const words = [];
            for (const phonetic of phonetics) {
                const w = this.phoneticToWords.get(phonetic);
                if (w) {
                    words.push(...w);
                }
            }
            return words.join(', ');
        } else {
            return word;
        }
    }
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
    // d.summarize();

    // d.metaphoneProject('latte with light foam');
    // d.metaphoneProject('latte with white phone');

    console.log(d.phoneticExpand('their'));
    console.log(d.phoneticExpand('bow'));
    console.log(d.phoneticExpand('two'));
    console.log(d.phoneticExpand('the'));
    console.log(d.phoneticExpand('sea'));

    console.log(d.phoneticExpand('i'));
    console.log(d.phoneticExpand('scream'));
    console.log(d.phoneticExpand('for'));
    console.log(d.phoneticExpand('ice'));
    console.log(d.phoneticExpand('cream'));


    // console.log(d.phoneticExpand('tear'));
    // console.log(d.phoneticExpand('lead'));
    // console.log(d.phoneticExpand('fair'));
}

go();

/*
ASLEEP SMOTHER: (A,SLEEPS,MOTHER)
RECHECK SPAM: (RE,CHECKS,PAM)
EMBARK ALONE: (HIM,BARCA,LOAN)
RECHECK SCURRYING: (RE,CHECKS,CURRYING)
DEBATE AMUSES: (DE,BETA,MUSES)
CONFORM UNBEARABLY: (CAN,FOREMAN,BEARABLY)
DATAPOINT SWAPPING: (DATE,APPOINTS,WAPPING) (DATA,POINT'S,WAPPING) (DAT,APPOINTS,WAPPING) (DATA,POINT'S,WAPPING)

MIDDLE-CLASS PRESERVES: (MIDDLE,CLASP,RESERVE'S) (MIDDLE,CLASP,RESERVE'S)

AGREE TACKS: (A,GREET,ACTS)
INFLAME DAIRY: (IN,FLAMED,AERIE)
ABATE SOAKS: (A,BAITS,OAK'S)
PART-TIME EXCHANGES': (PART,TIMEX,CHANGES)
REFINANCE TRAVELED: (RE,FINANCED,RAVELED)
WORSENED REFINANCINGS: (WORSE,ANDREE,FINANCINGS)
CONCEIT SWITCH: (CAN,SEAT'S,WHICH)
FOURSQUARE DRAFTING: (FAURE,SQUARED,RAFTING)
CONTENT SLAPPED: (CAN,TENTS,LAPPED)
CONTRACT CENTRAL'S: (CAN,TRACTS,ENTRAILS)
CONFIRM ADDICTION: (CAN,FIRMA,DICTION)
ATTESTS OFFENDING: (A,TESSA,FENDING)
HANDPICK SABLE: (HAND,PICKS,ABEL)
ENCRYPT STICKING: (IN,CRYPTS,TICKING)
APPOINT SUBJECT: (A,POINT'S,OBJECT)
ASCENDANT EYEWITNESS: (ASCEND,UNTIE,WITNESS)
MISCOUNT SURPRISING: (MIS,COUNTS,UPRISING)
MULTIMARKET SWEATING: (MULTI,MARKETS,WETTING)
SELF-HELP SCANDAL'S: (SELF,HELPS,CANDLES)
NONFAT UNRECONCILED: (NON,FATTEN,RECONCILED)
O'CLOCK SLOWLY: (A,CLOCK'S,LOWLY)
EYEWITNESS TENDERS: (AI,WITNESSED,ENDERS)
DRIVE-THRU PEAKS: (DR,THROOP,EAKES)
OFFBEAT UNCOMFORTABLE: (OFF,BEATEN,COMFORTABLE)
CONDENSE AURORA: (CAN,DENSER,AURA)

VIDEOTAPE SKITS: (VIDEO,TAPE'S,KITS)
AFLOAT SCOUR: (A,FLOATS,COWER)
ENGINEERING ZEITZ: (ENGINE,EARRINGS,EATS)

*/
