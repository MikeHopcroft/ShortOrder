import { CatalogItems, ItemDescription, ComponentDescription } from './interfaces';
import { PID } from 'token-flow';

// TODO: No need to implement CatalogItems.
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

    // DESGIN NOTE: can't just assign `this.map.has` to `has` because `this` won't
    // be bound correctly.
    has(pid: PID) {
        return this.map.has(pid);
    }

    // TODO: modify get to throw if not available.
    get(pid: PID) {
        const item = this.map.get(pid);
        if (!item) {
            throw TypeError(`Catalog.get(): cannot find pid=${pid}`);
        }
        return item;
    }

    isDefaultOf(child: PID, parent: PID): boolean {
        const p = this.get(parent);
        return p.composition.defaults.find(
            component => component.pid === child
        ) !== undefined;
    }

    getDefaultInfo(child: PID, parent: PID): ComponentDescription | undefined {
        const p = this.get(parent);
        return p.composition.defaults.find(
            component => component.pid === child
        );
    }

    isChoiceOf(child: PID, parent: PID): boolean {
        const p = this.get(parent);
        for (const choice of p.composition.choices) {
            if (choice.alternatives.find( alternative => child === alternative)) {
                return true;
            }
        }
        return false;
    }

    isOptionOf(child: PID, parent: PID): boolean {
        const p = this.get(parent);
        return p.composition.options.find( option =>
            option.pid === child
        ) !== undefined;
    }

    isSubstitutionOf(child: PID, parent: PID): boolean {
        const p = this.get(parent);
        return p.composition.substitutions.find(
            substitution => substitution.replaceWith === child
        ) !== undefined;
    }

    isComponentOf(child: PID, parent: PID) {
        return this.isDefaultOf(child, parent)
            || this.isChoiceOf(child, parent)
            || this.isOptionOf(child, parent)
            || this.isSubstitutionOf(child, parent);
    }

    isStandalone(pid: PID) {
        const item = this.get(pid);
        return item.standalone;
    }

    isNote(pid: PID) {
        const item = this.get(pid);
        return item.note === true;
    }

    defaultQuantity(child: PID, parent: PID) {
        const p = this.get(parent);
        const component = p.composition.defaults.find(
            component => component.pid === child
        );
        if (component) {
            return component.defaultQuantity;
        }
        else {
            return 0;
        }
    }
}
