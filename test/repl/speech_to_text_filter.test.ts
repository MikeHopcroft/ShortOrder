import { assert } from 'chai';
import 'mocha';

import { speechToTextFilter } from '../../src';

describe('REPL', () => {

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  speechToTextFilter
    //
    ///////////////////////////////////////////////////////////////////////////////
    it('speechToTextFilter', () => {
        const allTestCases = [
            // Lower case
            ['UPPER CASE', 'upper case'],

            // Numbers
            ['1003', 'one thousand three'],

            // Punctuation with special meaning
            ['m&ms 5% 1oz 2#s 3# 4lbs 5lb w/more', 'm and ms five percent one ounce two pounds three pound four pounds five pound with more'],

            // MS Word quotes
            ['‘hello’', "'hello'"],
            ['“hello”', 'hello'],       // NOTE: double quotes are filtered out.

            // Remove other punctuation
            ['a,b.c?d!e"f-g(h)i', 'a b c d e f g h i'],

            // Whole word replacements
            ['okay dr 1/2 1/3 1/4 blt pbj pb pb&j', 'ok doctor one half one third one quarter b l t p b j p b p b and j'],
        ];

        for (const [input, expected] of allTestCases) {
            const observed = speechToTextFilter(input);
            assert.equal(observed, expected);
        }
    });
});

