import { AnyAction, CHOICE, COMPLETE, CONFUSED, DONE, OK, WAIT, WELCOME } from '../actions';
import { Order } from '../order';
import { Catalog } from '../catalog';

// DESIGN INTENT: data driven rendering of responses to facilitate
// multiple languages (e.g. English, Spanish, etc.)

// Special processing
//   CONFUSED before DONE invalidates DONE
//   CHOICE after DONE invalidates DONE
//   Successful additions after DONE invalidates DONE?
//   Probably always want to run ACKNOWLEDGE, followed by another.
//   Probably always want to run at least one CHOICE.

// Pattern driven rendering.
// Select random pattern from set.

// Perhaps run token-flow on pattern of Actions.

function lastSpecialAction(actions: AnyAction[]) {
    const reversed = actions.slice().reverse();

    let last: AnyAction = { type: COMPLETE };
    for (const action of actions) {
        if (action.type === CHOICE || action.type === DONE || action.type === WAIT || action.type === WELCOME) {
            last = action;
            break;
        }
    }
    return last;
}

const prompts = [
    'Can I get you anything else?',
    'Is that everything?',
    'What else would you like?',
    'What else?',
    'Anything else?',
    'Is that all?',
    'What else can I get you?'
];

let promptCounter = 0;

function getPrompt() {
    return prompts[promptCounter++ % prompts.length];
}

export function responses(
    actions: AnyAction[],
    order: Order,
    catalog: Catalog
): string[] {
    const results: string[] = [];

    const confusedCount = actions.filter( (x:AnyAction) => x.type === CONFUSED).length;
    const okCount = actions.filter( (x:AnyAction) => x.type === OK).length;

    if (okCount === 0 && confusedCount > 0) {
        results.push("I didn't understand that.");
    }
    else if (okCount > 0) {
        if (confusedCount === 0) {
            results.push('Got it.');
        }
        else if (confusedCount > okCount || confusedCount > 2) {
            results.push('Not sure I got all that.');
        }
        else {
            results.push('Ok.');
        }
    }

    const action: AnyAction = lastSpecialAction(actions);
    switch (action.type) {
        case DONE:
            const total = 
                (order.lines[order.lines.length - 1].price as number / 100).toFixed(2);
            results.push(`Thank you. Your total is $${total}. Please pull forward.`);
            break;
        case WAIT:
            results.push('Take your time.');
            break;
        case WELCOME:
            results.push("Welcome to Mike's American Grill. What can I get started for you?");
            break;
        case CHOICE:
            const className = action.choice.className;
            const productName = catalog.get(action.item.pid).name;
            results.push(`What ${className} would you like with your ${productName}?`);
            break;
        case COMPLETE:
            // TODO: if the user answers no, need to end order.
            results.push(getPrompt());
            break;
        default:
    }

    return results;
}
