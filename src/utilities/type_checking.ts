// tslint:disable-next-line:no-any
export function copyScalar<T>(item: { [name: string]: any }, property: string, type: string): T {
    const value = item[property] as T;
    if (value === undefined) {
        throw TypeError(`MenuItem: expects "${property}" property.`);
    }
    if (typeof (value) !== type) {
        throw TypeError(`MenuItem: "${property}" property should be type "${type}"`);
    }

    return value;
}

// tslint:disable-next-line:no-any
export function copyArray<T>(item: { [name: string]: any }, property: string, type: string): T[] {
    const value = item[property] as T[];
    if (value === undefined) {
        throw TypeError(`MenuItem: expects "${property}" property.`);
    }
    if (typeof (value) !== 'object') {
        throw TypeError(`MenuItem: "${property}" property should be type "${type}[]"`);
    }
    value.forEach(element => {
        if (typeof (element) !== type) {
            throw TypeError(`MenuItem: "${property}" property should contain items of type "${type}"`);
        }
    });

    return value;
}
