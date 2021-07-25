export interface LineItem {
  indent: number;

  left: string;
  middle: string;

  // Price is a number to facilitate computing subtotal.
  price?: number;
  right?: string;
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
    const leftFieldWidth = 4 + item.indent * 2;
    const left = rightJustify(item.left + ' ', leftFieldWidth);

    const rightFieldWidth = 6; // Prices up to 999.99
    let right = '';
    if (item.right !== undefined) {
      right = rightJustify(item.right, rightFieldWidth);
    } else if (item.price !== undefined && item.price > 0) {
      // DESIGN NOTE: All prices are in lowest denomination units
      // (e.g. pennies in the US, nickels in Canada).
      right = rightJustify((item.price / 100).toFixed(2), rightFieldWidth);
    }

    const totalWidth = 50;
    const middleWidth = Math.max(0, totalWidth - left.length - right.length);
    const middle = leftJustify(item.middle + ' ', middleWidth);

    return `${left}${middle}${right}`;
  }
}

function leftJustify(text: string, width: number) {
  if (text.length >= width) {
    return text;
  } else {
    const paddingWidth = width - text.length;
    const padding = new Array(paddingWidth + 1).join(' ');
    return text + padding;
  }
}

function rightJustify(text: string, width: number) {
  if (text.length >= width) {
    return text;
  } else {
    const paddingWidth = width - text.length;
    const padding = new Array(paddingWidth + 1).join(' ');
    return padding + text;
  }
}
