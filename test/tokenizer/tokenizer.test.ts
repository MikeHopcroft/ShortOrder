import { assert } from 'chai';
import 'mocha';

import { PID, Tokenizer } from '../../src/tokenizer';

describe('Tokenizer', () => {
    describe('#addItem', () => {
        it('should add item text to `this.items` and PIDs to `this.pids`', () => {
            const badWords: string[] = [];
            const tokenizer = new Tokenizer(badWords);
            const items:Array<[PID, string]> = [
                [1, 'one'],
                [2, 'two'],
                [3, 'three']];

            items.forEach((item, index) => {
                const pid = item[0];
                const text = item[1];
                tokenizer.addItem(pid, text);
                assert.equal(tokenizer.items.length, index + 1);
                assert.equal(tokenizer.items[index], text);
                assert.equal(tokenizer.pids[index], pid);
            });
        });

        it('should apply MurmurHash3 with seed value of 0.', () => {
            const badWords: string[] = [];
            const tokenizer = new Tokenizer(badWords);
            const input = 'small unsweeten ice tea';
            tokenizer.addItem(1, input);
            const observed = tokenizer.hashedItems[0];
            const expected:number[] = [2557986934, 1506511588, 4077993285, 1955911164];
            assert.deepEqual(observed, expected);
        });

        it('should build posting lists.', () => {
            const badWords: string[] = [];
            const tokenizer = new Tokenizer(badWords);

            // DESIGN NOTE: the terms 'a'..'f' are known to stem to themselves.
            const items = ['a b c', 'b c d', 'd e f'];

            items.forEach((item, index) => {
                tokenizer.addItem(index, item);
            });
    
            // Verify that item text and stemmed item text are recorded.
            items.forEach((item, index) => {
                assert.equal(tokenizer.items[index], items[index]);
                assert.equal(tokenizer.stemmedItems[index], items[index]);
            });

            // Verify that posting lists are correct.
            const terms = ['a', 'b', 'c', 'd', 'e', 'f'];
            const expectedPostings = [
                [0],        // a
                [0, 1],     // b
                [0, 1],     // c
                [1, 2],     // d
                [2],        // e
                [2]         // f
            ];

            const observedPostings = terms.map((term) =>
                tokenizer.postings[tokenizer.hashTerm(term)]);
            assert.deepEqual(observedPostings, expectedPostings);

            // Verify that term frequencies are correct.
            const expectedFrequencies = [
                1,  // a
                2,  // b
                2,  // c
                2,  // d
                1,  // e
                1   // f
            ];
            const observedFrequencies = terms.map((term) =>
                tokenizer.hashToFrequency[tokenizer.hashTerm(term)]);
            assert.deepEqual(observedFrequencies, expectedFrequencies);
        });
    });

    describe('#stemTerm', () => {
        it('should apply the Snowball English Stemmer', () => {
            const badWords: string[] = [];
            const tokenizer = new Tokenizer(badWords);
            const input = 'sauce chocolate milkshake hamburger value cheese creamy';
            const terms = input.split(' ');
            const stemmed = terms.map((term) => tokenizer.stemTerm(term));
            const observed = stemmed.join(' ');
            const expected = 'sauc chocol milkshak hamburg valu chees creami';
            assert.equal(observed, expected);
        });
    });


});
