// TODO: REVIEW: why doesn't "esModuleInterop": true allow the following:
// import t from 'io-ts';
import * as t from 'io-ts';

const tokenSpecType = t.intersection([
  t.type({
    name: t.string,
    aliases: t.array(t.string),
  }),
  t.partial({
    value: t.number
  }),
]);
export type TokenSpec = t.TypeOf<typeof tokenSpecType>;

const replacerSpecType = t.type({
  name: t.string,
  replacements: t.array(t.tuple([t.string, t.string])),
});
export type ReplacerSpec = t.TypeOf<typeof replacerSpecType>;

export const lexiconSpecType = t.type({
  lexicon: t.array(tokenSpecType),
  replacers: t.array(replacerSpecType),
});
export type LexiconSpec = t.TypeOf<typeof lexiconSpecType>;
