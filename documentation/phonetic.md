# Mitigating Errors in Speech-to-Text Systems

A common architecture for speech-based conversational agents is a three stage pipeline, where speech is first converted to text, which is then passed to an NLP algorithm that extracts entities, intents, and sentiments, which are then passed to a rules-based system which performs actions.

1. Speech to Text
1. Entity and Intent Extraction
1. Rule-based Business Logic

This pipelined approach has a fundamental weakness that 
limits the effectiveness of the system as a whole.
The problem is that each stage must commit to an interpretation of its input in isolation and without context from the other stages. Once a stage commits, all subsequent stages must live with the interpretation, even if there were other plausible interpretations.

This might not seem like a serious limitation, but consider a system with three stages, each of which gets the correct interpretation 90% of the time. If the errors in the stages are uncorrelated, then the second stage will be right 81% of the time and the third stage will succeed 73% of the time.

In domains with low error rates, this sort of compounding might be tolerable, but the domain of human speech is notoriously difficult. Even if you factor out the impact of differences in voice, accent, culture and speaking style, you are still faced with understanding a language that is inherently ambiguous.

### Sources of Ambiguity in Speech-to-Text Systems
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

### Sources of Errors in NLP Systems

The world of natural language understanding has its own set of ambiguities.

Name inside name

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

Segmentation

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

Segmentation

~~~
"I'd like a grande latte iced tea and a muffin""

grande iced latte
tea
muffin

grande latte
iced tea
muffin
~~~

Segmentation

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
