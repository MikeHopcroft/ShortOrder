import * as dotenv from 'dotenv';

dotenv.config();

export const YAML_MENU_FILE = checkEnv('YAML_MENU_FILE');
export const YAML_TEST_FILE = checkEnv('YAML_TEST_FILE');

function checkEnv(key:string) {
    const value = process.env[key];
    if (value) {
        return value;
    }
    else {
        throw new Error(`Environment variable ${key} undefined.`);
    }
}
