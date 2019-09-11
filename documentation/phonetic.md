# Mitigating Errors in Speech-to-Text Systems

A common architecture for speech-based conversational agents is a three stage pipeline, where speech is first converted to text, which is then passed to an NLP algorithm that extracts entities, intents, and sentiments, which are then passed to a rules-based system that performs actions.

<img src="common-architecture.png"/>

This pipelined approach has two fundamental weaknesses that 
limit the effectiveness of the system as a whole.
The first problem is that **_each stage must commit to an interpretation of its input in isolation and without context from the other stages_**. The second problem is that once a stage commits to an interpretation, **_all subsequent stages must live with this interpretation_**, even if there were other plausible interpretations.

These might not seem like serious limitations, but consider a system with three stages, each of which gets the correct interpretation 90% of the time. If the errors in the stages are uncorrelated, then the second stage will be right 81% of the time and the third stage will succeed 73% of the time.

<img src="error-compounding.png"/>

In domains with low error rates, this sort of compounding might be tolerable, but the domain of human speech is notoriously difficult. Even if you factor out the impact of differences in voice, accent, culture and speaking style, you are still faced with understanding a language that is inherently ambiguous.

In a highly ambiguous environment, stages that lack access to global system context will have higher error rates. 

## A Better Way

The challenge with the pipeline approach is that each stage must _commit to a single interpretation of its input_, and it must do this in a _highly ambiguous environment_ without access to _context from subsequent stages_.

### Deferring Decisions about Speech
One solution is to avoid making decisions until the end of the pipeline.
Instead of settling on _one interpretration_, each stage can forward _the set of all possible interpretations_. The approach maintains multiple, alternative views of world through the life of the computation.

Consider, for example, the speech-to-text module. Suppose its input sounds like the phrase,
~~~
"too videotape's kits a boot aisle ends"
~~~
In the traditional pipeline, the speech stage could forward this interpretation along, when the following might be more correct:
~~~
"two videotape skits about islands"
~~~

A stage can avoid committing to a single interpretation by generating a graph the represents all possible interpretations. The following diagram shows all the words in a hypothetical lexicon that sound like portions of the input phrase. Paths from left to right represent possible interpretations. In this case, the blue path represents one of the better interpretations.

<img src="graph1.png"/>

Other paths through the graph represent less likely interpretations, such as
~~~
to videotape's kits about aisle ends
two videotape skit's a boot I land's
too video tapes kit's about aisle and's
~~~

If the speech-to-text stage forwarded only the blue path, subsequent stages would not have access to these less likely, but potentially valid, interpretations.

In generating this graph of words, the speech-to-text module still commits to decisions about the sounds of words in the lexicon and their segmentation. It could avoid these decisions, altogether, by forwarding a graph of phonemes, instead of a graph of words. Here's a graph of phonemes that sound like `"two videotape skits about islands"`:

<img src="phonemes.png"/>

Note that this graph incorporates two pronounciations for `"video"`, `"about"`, and `"islands"`.

This graph-based approach _requires a completely different type of Natural Language Processor_ because it must accept a graph as input, instead of a string of characters. The graph might be composed of words from the lexicon, or it might be made up of phonemes or other sound-based encodings.

### Deferring Decisions about Entities

In a similar manner, the natural lauguage processor can generate a graph of compound entities. Suppose the input text was `"burger with cheese fries ketchup and an orange"`. Does this refer to a `cheeseburger` with `fries` or a `plain hamburger` with `cheesy fries`? We can let the business logic sort this out by forwarding a graph of potential compound entities. In the following graph, the blue path represents one potential interpretation. 

<!-- Because we have a graph, the business logic will be able to consider other interpretations, like a `plain hamburger` with order of `cheesy fries` and a `navel orange`. -->

<img src="entities2.png"/>

In this graph, the term `cheese` might be part of the `hamburger` compound entity or it might be part of the name of the `cheesy fries` product. The term `ketchup` might refer to a `packet of ketchup`, or a squirt of the `ketchup ingredient`. The word, `orange` might refer to the fruit or the soda.

Given this graph, the business logic may be able to prune some paths. As an example, the ketchup ingredient, `squirt of ketchup` might only be allowed on the `hamburger`, while the `ketchup packet` may be the only form allowed with `french fries`. Likewise, `slice of cheese` may not be allowed on the hamburger, meaning that the term, `cheese` must be part of `cheesy fries`.

Again, the graph-based approach requires a completely different type of Business Logic that can accept a graph as input and reason about the legality and value of each of the paths.

## Retrofitting Legacy Systems

Ideally, one would like each stage to output a graph of all possible interpretations. One challenge is that common, off-the-shelf speech and NLP systems are not designed to work with, and produce, graphs of interpretations. These systems typically target the waterfall/pipeline architecture, and consequently take in a single interpretation in one domain and produce a single interpretation in another domain.

In some cases we can retrofit these systems to work with graphs. 
Let's consider a speech-to-text system that outputs a single interpretation, consisting of a sequence of words. We can map this phrase from the space of words to a space of phonetic encodings and back to get a broader set of word interpretations.

Mappings between the space of words and their phonetic encodings are many-to-many.
To see why, let's look at
[heteronyms](https://en.wikipedia.org/wiki/Heteronym_(linguistics))
and
[homophones](https://en.wikipedia.org/wiki/Homophone).
[Heteronyms](https://en.wikipedia.org/wiki/Heteronym_(linguistics)) are words with the same spelling that have different meanings and sounds. Here are some examples of heteronym words, mapped to their phonetic representations:
~~~
bow => B AW1 (front of a ship)
    => B OW1 (used in archery)

lead => L EH1 D (element Pb)
     => L IY1 D (to guide)

tear => T EH1 R (to rip)
     => T IH1 R (tear drop)
~~~
[Homophones](https://en.wikipedia.org/wiki/Homophone) are words with the same sound that have different meanings and spellings. Here are some examples of phonetic encodings mapping to their homophone words:
~~~
S IY1 => sea (body of water)
      => see (looking)
      => c (the letter)

DH E1 R => there (over there)
        => their (possessive)
        => they're (contraction)

T UW1 => to (preposition)
      => too (also)
      => two (the number)
~~~

Now let's look at the phonetic expansion of the phrase, `"their bow to the sea"`:

<img src="expansion1.png"/>

When mapping to a phonetic representation, the word, `bow`, has two pronounciations and the word, `the` has three:

<img src="expansion2.png"/>

When we map back to words, the phoneme sequence `DH EH1 R` maps to `{their, there, they're}`, and `T UW1` maps to `{to, too, two, tue}` and `S IY1` maps to `{sea, see}`:

<img src="expansion3.png"/>

The approach, shown above, retains the word-segmentation originally produced by the speech-to-text system. But what if the segmentation is wrong? Consider the phrase, `"I scream of ice cream"`. This could also have been segmented as
* `"ice cream for ice scream"`
* `"ice cream for I scream"`
* `"I scream for I scream"`

We can produce all of the possible segmentations of a phrase by converting to a phonetic representation that doesn't group phonemes into words. We can then match the phonetic representation of every word in the lexicon with every path fragment in the graph. The combinatorics may seem expensive, but in practice the transformation can be performed in milliseconds on commodity hardware.

Let's walk through the transformation with the phrase, `"I scream for ice scream"`. Here's one possible output from the speech to text:

<img src="ice-cream1.png"/>

Here it is after converting each word to a sequence phonemes. In this case, each word only had one pronounciation, so the graph is still linear:
<img src="ice-cream2.png"/>

The next step is to ungroup the phonemes so that we can consider other segmentations:
<img src="ice-cream3.png"/>

Then we add an edge everywhere a word in the lexicon matches the phonemes. The blue path corresponds to the likely interpretation, but all paths are available for inspection by the next stage.
<img src="ice-cream4.png"/>

### Choice of Phonetic Encodings and Distance Metrics

Goal is to group words into equivalence classes based on how they sound.
Want groups to balance between being broad enough to capture differences in speakers and narrow enough to distinguish words with different meanings.

Encodings produce some level of clustering on their own. 

Can use an encoding, in conjunction with a distance metric to create broader clusters.

Can use a distance metric on its own to cluster a lexicon, without transforming to a phonetic encoding.

Potential Encodings
* **metaphone** - originally designed for finding European surnames, given a potentially misspelled string. Tends to form clusters that are too large, especially for one-syllable words. Structure prevents concetenation necessary to produce new segmentations.
* **double metaphone** - poor performance on short words, discards distinguishing characteristics towards the ends of words.
* **metaphone 3** - not open source
* **CMU pronounciation dictionary** - Open source. Forms very tight, precise clusters. Must be used in conjunction with a distance metric that allows phoneme substitution.
* **Wiktionary** - Open source. Has pronounciation for words in many languages. Not all words have pronounciations.

Potential Phonetic Distance Metrics
* [Microsoft Phonetic Matching](https://github.com/microsoft/PhoneticMatching)
* **Speech-to-text Confusion Matrix** - given a large set of labeled speech-to-text outputs, one can form equivalence classes based on words the speech-to-text has trouble disambiguating. The distance is the observed probability of confusion.

Normalizing Singular/Plural, Past/Present/Future, Contractions
* It may be desirable to treat the singular and plural forms of nouns as being the same, even though they have different pronounciations. Because this normalization can change the sound, it must be done after the word to phonetic to word transformation.
* It may be desirable to treat the past, present, and future tenses of verbs as being the same.
* It may be desirable to expand contractions


## Sources of Ambiguity in Speech-to-Text Systems
Let's look at a few of the sources of ambiguity in speech-to-text systems. Probably the most common source of ambiguity is from [homonyms](https://en.wikipedia.org/wiki/Homonym). These are words that sound the same, but have different meanings. For example,
~~~
for, four
two, to, too
why's, wise, y's
fare, fair
caught, cot
know, no
knight, night
knot, not
sail, sale
vale, vail
none, nun
~~~
One common form of homonym ambiguity is distinguishing the plural from the possessive:
~~~
lands, land's
~~~

Speech-to-text systems also struggle with word-segmentation. Where does one word end and the next begin?
The following example shows alternative segementations of three phrases:
~~~
videotape skits
video tapes kits

island
aisle and
i land

engineering
engine earring
~~~

Speech-to-text systems often use machine learning to reduce ambiguity by considering each interpretation in the context of its surrounding words. This approach has a number of limitations.

The first is that it relies on the surrounding text to provide sufficient context to disambiguate competing interpretations. In many real-world scenarios, the phrases are too short to provide this context.
In some cases, one may have context from earlier in the conversation, but in practice, many speech-to-text systems are stateless, RESTful systems that only consider the current utterance.

The second problem is that the system must be trained for the context in which it will be used. Many organizations are unable to provide sufficient training data and don't possess the skills to perform the training and evaluate its effectiveness. 

In some scenarios, the training data changes over time, as new products are introduced and the system is rolled out in new environments. These system require continuous training along with the rigor and processes to ensure that successive versions of the system don't regress working functionality.

### Sources of Errors and Ambiguity in NLP Systems

The world of natural language understanding has its own set of ambiguities.

**Name inside name**

~~~
"I'd like a coffee with a half and half"

INTENT(ORDER)         : I'd like
QUANTITY(1)           : a
ENTITY(COFFEE)        : coffee
CONJUNCTION           : with
QUANTITY(1)           : a
ENTITY(HALF AND HALF) : half and half


INTENT(ORDER)         : I'd like
QUANTITY(1)           : a
ENTITY(COFFEE)        : coffee
CONJUNCTION           : with
QUANTITY(1/2)         : a half
CONJUNCTION           : and
UNKNOWN               : half
~~~

**Segmentation**

~~~
"I'd like a burger with cheese fries and a coke"

burger
  add cheese
fries
coke

burger
cheese fries
coke
~~~

**Segmentation into Compound Entities**

~~~
"I'd like a grande latte iced tea and a muffin""

grande iced latte
tea
muffin

grande latte
iced tea
muffin
~~~

**Segmentation into Compound Entities**

~~~
"I'd like an iced tea latte and a muffin"

iced tea latte
muffin

iced tea
latte
muffin
~~~

~~~
"i'd like a burger with ketchup and fries with ketchup"

burger
  add ketchup
fries
ketchup packet
~~~

## A Better Approach
given that STT systems are error-prone

-----

~~~
troops troop's troupes troupe's
knows no's nose noes
~~~


 and that is that 
overall effectiveness of the system.
forced to commit to an interpretation without context
errors compund
The very structure of the pipelined architecture 
One approach to speech-based conversational agents


### Homonyms, Homophones, Homographs


Plural vs possessive
~~~
lands land's
~~~

bow bow

### Segmentation Errors

~~~
videotape skits
video tapes kits

engineering
engine earring

island
aisle and
i land

i found the miscount surprising
i found the mis counts uprising
~~~

## Phonetic Algorithms

### Soundex
### Metaphone and Double Metaphone
### Pronunciation Dictionaries
CMU
Wiktionary


### Random Stuff
without access to context from successive stages. In a highly ambiguous environment, it is easy to pick an interpretation which will ultimately turn out to be incorrect.
~~~
two videotape skits about islands

T UW1   V IH1 D IY0 OW0 T EY1 P   S K IH1 T S   AH0 B AW1 T   AY1 L AH0 N D Z
tu  ˈvɪdɪˌoʊteɪ̯p ˈskɪts əˈbaʊt ˈaɪ̯lənds
~~~



We're extracting a weak signal from a noisy environment and 


burger with cheese fries and ketchup and a coke



~~~
Oronyms 
their bow to the sea
i scream for ice cream
~~~

As an example, we might map the text to the
[metaphone encoding](https://en.wikipedia.org/wiki/Metaphone)
and then back to words in our lexicon. In this case, our sentence would initially be transformed to `LT W0 WT FN`

~~~
latte => LT => { lad, lada, ladd, lade, ladow, ladue, lady, lahti, ... }
with => W0 => { weith, with, with, with, with, withe, withee, withey }
white => { wad, wada, waddie, waddy, wade, waid, waide, wait, ... }
phone => FN => { fain, fan, fane, fann, fannie, fanny, faughn, fauna, ... }
~~~

While the metaphone encoding is useful for explaining the concept, it is 

With the lexicon from the CMU pronounciation dictionary, this approach yields a graph with roughly four million interpretations. One can dramatically reduce the size of the graph by using a domain specific lexicon, combined with a set of common conversational terms.
It turns out that metaphone (and its successors double metaphone and metaphone 3) are not


Ideally, one would like the complete graph
Equivalence classes of words

~~~
la
tay

latte L AA1 T EY2
with W IH1 DH / W IH1 TH / W IH0 TH / 
light L AY1 T
white W AY1 T
height HH AY1 T
right R AY1 T
foam F OW1 M
phone F OW1 N

L AA1 T EY2   W IH1 DH   W AY1 T   F OW1 N
~~~

One challenge with this approach is that commercial speech recognition systems tend to return a single interpretation instead of a graph of possibilities. One idea for retrofitting:
1. Speech recognition system generates one interpretation
1. Convert interpretation into graph of phonemes. Graph will have multiple paths because some words have multiple pronounciations (e.g. `"bow"`).
1. Use fuzzy matcher against phoneme graph to generate graph of words from the lexicon, or just return the phoneme graph.

Commerial NLU systems do a bit better. Are often feature detectors. Features can sometimes be arranged into a graph.

i - AY1
scream - S K R IY1 M
for - F AO1 R
ice - AY1 S
cream - K R IY1 M

AY1 S K R IY1 M F AO1 R AY1 S K R IY1 M
