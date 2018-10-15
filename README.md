# ShortOrder

ShortOrder is an exerimental natural language conversational agent intended for domains with a fixed vocabulary of entities and a small number of intents. Uses might include ordering food from a restaurant or organizing your song collection.

The first stage of development is a set of tokenizers that detect entities, intents, and quantities. As an example, consider the following utterance, which would typically come from a speech-to-text system:

~~~
I would like a Dakota burger with no onions extra pickles fries and a coke
~~~

In this example, the utterance has no commas, since they were not provided by the speech-to-text process.

Using ShortOrder, this text might be tokenized as

~~~
[ADD_TO_ORDER] [QUANTITY(1)] [DAKOTA_BURGER(pid=4)] [QUANTITY(0)]
[SLICED_RED_ONION(pid=5201)] [QUANTITY(1)] [PICKLES(pid=5200)]
[MEDIUM_FRENCH_FRIES(pid=401)] [CONJUNCTION] [QUANTITY(1)]
[MEDIUM_COKE(1001)]
~~~

After tokenization, a parser might be able to group the tokens into a tree that reflects the speaker's intent:
~~~
[ADD_TO_ORDER]
    [QUANTITY(1)] [DAKOTA_BURGER(pid=4)]            // Burger, standalone menu item.
        [QUANTITY(0)] [SLICED_RED_ONION(pid=5201)]  //   Remove onion modification
        [QUANTITY(1)] [PICKLES(pid=5200)]           //   Add pickles modification
    [QUANTITY(1)] [MEDIUM_FRENCH_FRIES(pid=401)]    // French Fries, standalone menu item
    [QUANTITY(1)] [MEDIUM_COKE(1001)]               // Coke, standalone
~~~

## Try It Out

ShortOrder is currently in the earliest stages of development, so documentation is
sparse or nonexistant, and the code stability is uneven.

If you are interested in taking a look, you can fork the repo on GitHub or install
ShortOrder with npm.

~~~
npm install shortorder
~~~

As of commit XXXXXX, there are two working samples, based on a ficticious restaurant. You can find the definition files for the menu, intents, attributes, and quantifiers at
* `src\samples\data\menu.yaml`
* `src\samples\data\intents.yaml`
* `src\samples\data\attributes.yaml`
* `src\samples\data\quantifiers.yaml`

### Relevance Test Sample

This sample runs a suite of test utterances through the tokenization pipeline. The test utterances can be found at `src\samples\data\tests.yaml`.

If you've cloned the repo, you can build and run the sample as follows:

~~~
npm install
npm run compile
node build/src/samples/run_relevance_test.js
~~~

### REPL Sample

This sample provides a Read-Eval-Print-Loop that runs the tokenizer on each line entered.

If you've cloned the repo, you can build and run the sample as follows:

~~~
npm run compile
node build/src/samples/repl.js
~~~

~~~
node build/src/samples/repl.js
Welcome to the ShortOrder REPL.
Type your order below.
A blank line exits.

60 items contributed 160 aliases.

% i'd like a dakota burger fries and a coke

INTENT: ADD_TO_ORDER: "i'd like"
QUANTITY: 1: "1"
ENTITY: DAKOTA_BURGER(4): "dakota burger"
ENTITY: MEDIUM_FRENCH_FRIES(401): "fries"
INTENT: CONJUNCTION: "and"
QUANTITY: 1: "1"
ENTITY: MEDIUM_COKE(1001): "coke"

% actually make that a pet chicken with extra pickles

INTENT: CANCEL_LAST_ITEM: "actually"
INTENT: RESTATE: "make that"
QUANTITY: 1: "1"
ENTITY: GRILLED_PETALUMA_CHICKEN_SANDWICH(100): "pet chicken"
QUANTITY: 1: "with"
ATTRIBUTE: SIZE(EXTRA_LARGE)(103): "extra"
ENTITY: PICKLES(5200): "pickles"

%
bye
~~~

## Tokenizer Design Notes

