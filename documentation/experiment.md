# Experiment

## Experiment A: WER
* Data consists of STT output text with corresponding vendor transcriptions.
* Lexicon consists of phonetic representation of phrases from the menu, and top frequency terms from transcripts.
* Input text should be converted to sequence of phonemes. ISSUE: some words have multiple pronunciations, so the input may, in some cases be a graph. Should we modify token-flow to consume graphs?
* Enumerate maximally scoring paths in token-flow graph.
* Convert each path back into its text representation.
* Compute WER for each path.
* Return the lowest WER found.

## Experiment B: Entity Detection
* Data consists of STT output text and corresponding expected entity sequences.
* May need some sort of data labeling tool.
* Lexicon and graph generation process the same as for Experiment A.
* Compute Token Error Rate (TER) for each (path, expected) pair.
* Return the lowest TER found.

## Experiment C: End-to-end
* Data consists of STT output text and corresponding input cart and expected output cart.
* Will need to author expected carts.
* Lexicon same as for Experiment A.
* Will need to decide whether to use single-stage phonetic tokenizer, or two-stage tokenizer that generates a phonetic graph, followed by an entity graph.

## Visualizer
* Create graph-visualizer React component.

## Annotation/Test Authoring Tool
* Create tool that uses token-flow and menu to suggest annotations.

## Token-flow Challenges

* Token-flow performs matching at the word level. Its ingestor currently breaks text on white space. If we simply replace words with phoneme sequences, token-flow will break on phonemes. This behavior may be reasonable in that it performs fuzzy matching over phonemes.
* The match scoring is currently based on words. It it likely that matching on phonemes will change the performance of the scoring system, but it is unclear whether the effect will be positive or negative.
* The matching algorithm makes use of the concept of cross-domain terms. This concept has no phoneme equivalent. If we match entities directly with against phonemes, we will have to disable the cross-domain concept. We could use one instance token-flow to generate a graph of words, and another to generate a graph of entities. In this case, we could retain the cross-domain concept for the second token-flow. It is unclear whether the cross-domain concept is useful in the context of graphs.
* Token-flow currently takes a linear sequence of terms as input. To get the full benefit of the graph approach, we would need to modify token-flow to match against a graph.
* Will have to figure out how to handle the `EnglishNumberParser` used by `Lexicon`. One possibility is to just include numbers from 1 to 20 in the quantities.yaml file.


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

**Notes:**
* Initial implementation will likely make use of the [CMU pronunciation dictionary](http://www.speech.cs.cmu.edu/cgi-bin/cmudict). Will need code to parse and load the pronunciation dictionary into a map. 
* May need a fallback pronunciation strategy for words not in the dictionary.
* May want to consider other pronunciation sources.
* Will need to decide whether to retain or drop the lexical stress markers.

## Lexicon Preparation

The lexicon will draw words and phrases from two sources.
The first source is the set of English text aliases for intents, products, options, attributes, quantifiers, and units defined in a menu. The second source is the set of the top-n most common terms in the user transcripts.

**Work items:**
* Convert aliases in each configuration file from English text to phonetic representation. Files include `products.yaml`, `options.yaml`, `attributes.yaml`, `quantifiers.yaml`, `units.yaml`, and `intents.yaml`. In certain circumstances, we could do this conversion at ingestion time, perhaps with a custom stemmer. To do this we may need to modify the stemmer API to allow concatenation of phonemes from different words. Might also consider introducing a pluggable term mapping concept into the term treatment.
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
* Suppress cross-domain terms. We don't need this concept for phonems. Actually, might want something more subtle. 
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
