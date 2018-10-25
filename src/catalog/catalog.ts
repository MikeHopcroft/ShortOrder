import { CatalogItems, ItemDescription, PID } from './interfaces';

export class Catalog implements CatalogItems {
    items: ItemDescription[];
    map = new Map<PID, ItemDescription>();

    constructor(catalogItems: CatalogItems) {
        this.items = catalogItems.items;

        for (const item of this.items) {
            if (this.map.has(item.pid)) {
                throw TypeError(`Catalog: encountered duplicate pid ${item.pid}.`);
            }
            this.map.set(item.pid, item);
        }
    }

    has = this.map.has;
    get = this.map.get;
}

export function IsDefaultOf(child: ItemDescription, parent: ItemDescription): boolean {
    return parent.composition.defaults.find( component =>
        component.pid === child.pid
    ) !== undefined;
}

export function IsChoiceOf(child: ItemDescription, parent: ItemDescription): boolean {
    for (const choice of parent.composition.choices) {
        if (choice.alternatives.find( alternative => child.pid === alternative)) {
            return true;
        }
    }
    return false;
}

export function IsOptionOf(child: ItemDescription, parent: ItemDescription): boolean {
    return parent.composition.options.find( option =>
        option.pid === child.pid
    ) !== undefined;
}

export function IsSubstitutionOf(child: ItemDescription, parent: ItemDescription): boolean {
    return parent.composition.substitutions.find( substitution =>
        substitution.replaceWith === child.pid
    ) !== undefined;
}

export function IsComponentOf(child: ItemDescription, parent: ItemDescription) {
    return IsDefaultOf(child, parent)
        || IsChoiceOf(child, parent)
        || IsOptionOf(child, parent)
        || IsSubstitutionOf(child, parent);
}

