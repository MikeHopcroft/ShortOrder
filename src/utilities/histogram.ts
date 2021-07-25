export function createHistogram(
  values: IterableIterator<number>
): Map<number, number> {
  const h = new Map<number, number>();

  for (const value of values) {
    const count = h.get(value);
    if (count !== undefined) {
      h.set(value, count + 1);
    } else {
      h.set(value, 1);
    }
  }

  return h;
}
