import * as dotenv from 'dotenv';

dotenv.config();

export const IMPORT_CONFIG_FILE = checkEnv('IMPORT_CONFIG_FILE');
export const FLAT_MENU_FILE = checkEnv('FLAT_MENU_FILE');
export const HIERARCHICAL_MENU_FILE = checkEnv('HIERARCHICAL_MENU_FILE');
export const SUBSET_MENU_FILE = checkEnv('SUBSET_MENU_FILE');
export const RELEVANCE_TEST_FILE = checkEnv('RELEVANCE_TEST_FILE');
export const INTENT_MENU_FILE = checkEnv('INTENT_MENU_FILE');

function checkEnv(key:string) {
    const value = process.env[key];
    if (value) {
        return value;
    }
    else {
        throw new Error(`Environment variable ${key} undefined.`);
    }
}
