import {
    replMain,
    prixFixeReplExtensionFactory,
} from 'prix-fixe';

import {
    shortOrderReplExtensionFactory
} from '../src';

replMain([
    prixFixeReplExtensionFactory,
    shortOrderReplExtensionFactory
]);
