import { PID } from 'prix-fixe';
import { ItemDescription, ChoiceDescription, ComponentDescription, SubstitutionDescription } from "../src";

export interface ItemDescriptionTemplate {
    pid?: PID;
    name?: string;
    aliases?: string[];
    price?: number;
    standalone?: boolean;
    note?: boolean;
    matrix?: PID;
    key?: string;
    isOption?: boolean;
    isQuantifiable?: boolean;
    composition: {
        defaults: ComponentDescription[];
        choices: ChoiceDescription[];
        substitutions: SubstitutionDescription[];
        options: ComponentDescription[];
    };
}
export interface ComponentDescriptionTemplate {
    pid?: PID;
    defaultQuantity?: number;    // default quantity
    minQuantity?: number;        // minimum legal quantity
    maxQuantity?: number;        // maximum legal quantity
    price?: number;              // Price for each above default quantity.
}

export interface CompositionDescription {
    defaults: ComponentDescription[];
    choices: ChoiceDescription[];
    substitutions: SubstitutionDescription[];
    options: ComponentDescription[];
}

class EntityBuilder {
    nextPID = 1;
    groups = new Map<string, ItemDescription[]>();

    allocatePID(): PID
    {
        throw TypeError;
    }

    createEntities() {

    }

    createComponentDescriptions(
        template: ComponentDescriptionTemplate,
        instances: ComponentDescriptionTemplate[]
    ): ComponentDescription[] {
        const base: ComponentDescription = {
            pid: 0,
            defaultQuantity: 0,
            minQuantity: 0,
            maxQuantity: 0,
            price: 0
        };
        const components: ComponentDescription[] = [];
        for (const instance of instances) {
            components.push({
                ...base,
                ...template,
                ...instance,
                pid: this.allocatePID()
            });
        }

        return components;
    }

    createComposition(defaults: ComponentDescription[], options: ComponentDescription[]): CompositionDescription {
        return { defaults, choices: [], substitutions: [], options };
    }
}



// units
// matrices
// dimensions

// Aliases are 'name [syrup]'
const syrups = {
    id: 'syrups',
    template: {
        defaults: [],
        options: [],
        isOption: true,
        isQuantifiable: true,    
    },
    items: [
        ['blueberry [syrup]'],
        ['raspberry [syrup]'],
        ['strawberry [syrup]'],
        ['vanilla [syrup]'],
        ['cardamom [syrup]'],
        ['whipped cream', 'whip']
    ]
};

const options = {
    id: 'options',
    template: {
        defaults: [],
        options: [],
        isOption: true,
        isQuantifiable: false,    
    },
    items: [
        'dry foam',

    ]
};

const coffeeDrinks = {
    id: 'coffeeDrinks',
    template: {
        matrix: 3,
        defaults: [],
        options: ['syrups'],   
    },
    baseItems: [
        {
            name: 'americano',
            aliases: ['americano'],
        },
        {
            name: 'cappucino',
            aliases: ['cappucino'],
        },
        {
            name: 'latte',
            aliases: ['latte'],
        },
        {
            name: 'cardamom latte',
            aliases: ['cardamom latte'],
            defaults: ['cardamom syrup']
        },
        {
            name: 'mocha',
            aliases: ['[caffe] mocha'],
        },
        {
            name: 'white chocolate mocha',
            aliases: ['white [chocolate] [caffe] mocha'],
        },
    ]
};


const espressos = {
    matrix: 3,
    defaults: [],
    options: ['syrups'],
    baseItems: [
        {
            name: 'espresso',
            aliases: ['espresso'],
        },
        {
            name: 'espresso con panna',
            aliases: ['espresso con panna'],
            defaults: ['whipped cream']
        },
        {
            name: 'macchiato',
            aliases: ['macchiato'],
        },
    ]
};
