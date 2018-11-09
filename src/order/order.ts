export interface LineItem {
    indent: number;
    operation?: string;
    // DESIGN NOTE: All prices are in lowest denomination units
    // (e.g. pennies in the US, nickels in Canada).
    price?: number;
    product: string;
    quantity: number;      // TODO: ADD vs SUB vs NO vs x
}

export interface Order {
    lines: LineItem[];
}

export class OrderOps {
    // TODO: does this convenience method really belong here?
    static printOrder(order: Order) {
        console.log(OrderOps.formatOrder(order));
    }

    static formatOrder(order: Order) {
        return order.lines.map(OrderOps.formatLineItem).join('\n');
    }

    static formatLineItem(item: LineItem) {
        const indent = new Array(item.indent + 1).join('  ');
        const quantity = item.operation === undefined ? `${item.quantity} ` : '';

        // TODO: operation quantity when > 1.
        let operation = '';
        if (item.operation) {
            if (item.operation === 'NOTE') {
                operation = '  ';
            }
            else {
                operation = `  ${item.operation} `;
            }
        }
        // const operation = item.operation ? `  ${item.operation} ` : '';
        const product = item.product;

        const left = `${indent}${quantity}${operation}${product}`;

        // DESIGN NOTE: All prices are in lowest denomination units
        // (e.g. pennies in the US, nickels in Canada).
        const right = (item.price && item.price > 0) ? (item.price / 100).toFixed(2) : '';

        const width = 50;
        const padding = new Array(Math.max(0, width - left.length - right.length)).join(' ');

        return `${left}${padding}${right}`;
    }
}