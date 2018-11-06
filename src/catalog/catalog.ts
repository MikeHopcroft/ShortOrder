import { CatalogItems, ItemDescription, PID } from './interfaces';
// import { Type } from 'js-yaml';

// TODO: No neet to implement CatalogItems.
export class Catalog { 
    // implements CatalogItems {
    // TODO: don't really need to store items - just the map.
    // items: ItemDescription[];
    map = new Map<PID, ItemDescription>();

    constructor(catalogItems: CatalogItems) {
        // this.items = catalogItems.items;

        for (const item of catalogItems.items) {
            if (this.map.has(item.pid)) {
                throw TypeError(`Catalog: encountered duplicate pid ${item.pid}.`);
            }
            this.map.set(item.pid, item);
        }
    }

    has = this.map.has;

    // TODO: modify get to throw if not available.
    get(pid: PID) {
        const item = this.map.get(pid);
        if (!item) {
            throw TypeError(`Catalog.get(): cannot find pid=${pid}`);
        }
        return item;
    }

    static IsDefaultOf(pid: PID, parent: ItemDescription): boolean {
        return parent.composition.defaults.find( component =>
            component.pid === pid
        ) !== undefined;
    }

    static IsChoiceOf(pid: PID, parent: ItemDescription): boolean {
        for (const choice of parent.composition.choices) {
            if (choice.alternatives.find( alternative => pid === alternative)) {
                return true;
            }
        }
        return false;
    }

    static IsOptionOf(pid: PID, parent: ItemDescription): boolean {
        return parent.composition.options.find( option =>
            option.pid === pid
        ) !== undefined;
    }

    static IsSubstitutionOf(pid: PID, parent: ItemDescription): boolean {
        return parent.composition.substitutions.find( substitution =>
            substitution.replaceWith === pid
        ) !== undefined;
    }

    static IsComponentOf(pid: PID, parent: ItemDescription) {
        return Catalog.IsDefaultOf(pid, parent)
            || Catalog.IsChoiceOf(pid, parent)
            || Catalog.IsOptionOf(pid, parent)
            || Catalog.IsSubstitutionOf(pid, parent);
    }

    static isStandalone(item: ItemDescription) {
        return item.isStandalone;
    }
}
