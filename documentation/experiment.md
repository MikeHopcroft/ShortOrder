# Experiment

## Annotation tool
Evaluate [doccano](https://github.com/chakki-works/doccano). 

Pros/Cons
* CON: `doccano` can't do graphs because it doesn't allow overlapping entities.
* CON: `doccano` annotates with the class of entity, not the specific entity.

Do we really need graphs? Technically speaking we might not need graphs for annotation if we are willing to annotate the same utterance multiple times (one for each complete path).

## englishToPhonetic()
A function that returns the phonetic representations of an English word. The phonetic representation of a word is an array of `phoneme` strings.

~~~
AA      vowel
AE      vowel
AH      vowel
AO      vowel
AW      vowel
AY      vowel
B       stop
CH      affricate
D       stop
DH      fricative
EH      vowel
ER      vowel
EY      vowel
F       fricative
G       stop
HH      aspirate
IH      vowel
IY      vowel
JH      affricate
K       stop
L       liquid
M       nasal
N       nasal
NG      nasal
OW      vowel
OY      vowel
P       stop
R       liquid
S       fricative
SH      fricative
T       stop
TH      fricative
UH      vowel
UW      vowel
V       fricative
W       semivowel
Y       semivowel
Z       fricative
ZH      fricative
~~~

The function prototype might look like
~~~
function englishToPhonetic(word: string): string[][]
~~~

A call to englishToPhonetic(‘island’) might return
~~~
[
    [‘AY1’, ‘L’, ‘EH0’, ‘N’, ‘D’, ‘Z’], 
    [‘AY1’, ‘L’, ‘AH0’, ‘N’, ‘D’, ‘Z’]
]
~~~

Notes
* Initial implementation will likely make use of the [CMU pronunciation dictionary](http://www.speech.cs.cmu.edu/cgi-bin/cmudict). Will need code to parse and load the pronunciation dictionary into a map. 
* May need a fallback pronunciation strategy for words not in the dictionary.
* May want to consider other pronunciation sources.
* Will need to decide whether to retain or drop the lexical stress markers.

## Lexicon Preparation

The lexicon will draw words and phrases from two sources.
The first source is the set of English text aliases for intents, products, options, attributes, quantifiers, and units defined in a menu. The second source is the set of the top-n most common terms in the user transcripts.

**Work items:**
* Convert aliases in each configuration file from English text to phonetic representation. Files include `products.yaml`, `options.yaml`, `attributes.yaml`, `quantifiers.yaml`, `units.yaml`, and `intents.yaml`.
* Generate a word-frequency table from the transcripts.
* Construct a `words.yaml` file that defines a word-token for each of the top-n most common words in transcripts. The aliases for each token will be its phonetic representations.
* Write a token-flow ingestor for `words.yaml`.

## Test case preparation

A test case will be an utterance, paired with an expected tokenization. The case is said to pass if one of the maximally scoring tokenizations is the same as the expected tokenization.

**Work items:**
* Select a set of utterances with STT errors. Would like examples of homonym errors and word segmentation errors. Our hope is that the phonetic graph will improve accuracy for these utterances.
* Select a set of utterances without STT errors. Our hope is that the phonetic graph will not degrage accuracy for these utterances.
* Pair each utterance with its expected tokenization. We will need some tool to assist in labelling utterances with tokenizations.
* Define a file format for the test suite.
* Construct a validating reader for the test suite.

## token-flow Configuration

**Work items:**
* Suppress stemmer. We don't stem phonemes.
* Suppress cross-domain terms. We don't need this concept for phonems.
* Verify that hash function works on phonemes. If it does not generate unique hashes, consider using a `Map<string, number>` instead.

## Experiment Workflow

**Startup**
* Create instance of token-flow.
* Ingest phonetic configuration files into token-flow.

**For each utterance**
* Split on white space
* Convert each word to its first phonetic representation. Might be able to do this with a custom stemmer.
* Join with spaces
* Pass this string to token-flow to get graph
* Enumerate maximally scoring paths in graph
* Test passes if one of these paths is equal to expected pass.

**Work items:**
* Validating test file reader
* Main loop
* Results aggregator
* Results reporting
* Extend token-flow graph algorithm to enumerate all maximally scoring paths. Right now it enumerates a maximally scoring path and its variants where some edges are replaced by identically scoring edges.
