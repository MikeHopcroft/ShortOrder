import * as Debug from 'debug';
import * as path from 'path';

import { tokenToString, Unified } from '../src/unified';


function go(query: string) {
    // unified_demo is intended to be a debugging tool invoked by a human
    // from the console. Therefore use human-readable console logging to stdout.
    // Also enable tf:* to see all alerts.
    Debug.enable('tf-interactive,tf:*');

    console.log(`QUERY: "${query}"`);
    console.log();

    const unified = new Unified(
        path.join(__dirname, './data/restaurant-en/menu.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        true);

    const tokens = unified.processOneQuery(query);
    console.log(tokens.map(tokenToString).join(' '));
}

go('convertible');

// const a = 'i want a chicken sandwich and some fries i want a big apple burger fried chicken breast and salmon';
// const a = 'fried chicken breast';
// const a = "bbq that'll do it";
// const a = "fries"
// const a = "I'll have two six piece wings";
// const a = "I want a small chocolate cone";
const a = "I want an ice cream cone";

go(a);
// pipelineDemo('can I have two hamburgers');
