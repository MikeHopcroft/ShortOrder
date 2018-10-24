import * as path from 'path';
import { repl } from '../src/repl';

function replDemo() {
    repl(
        path.join(__dirname, './data/menu.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'));
}

replDemo();

