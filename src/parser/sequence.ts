///////////////////////////////////////////////////////////////////////////////
//
// ISequence and Sequence
//
///////////////////////////////////////////////////////////////////////////////
export interface ISequence<T> {
  mark(): void;
  restore(): void;
  peek(): T;
  take(): void;
  discard(): void;
  atEOS(): boolean;
  itemsUsed(): number;
}

export class Sequence<T> implements ISequence<T> {
  private readonly values: T[];
  private cursor = 0;
  private used = 0;
  private readonly checkpoints: Array<[number, number]> = [];

  constructor(values: T[]) {
    this.values = values;
  }

  mark() {
    this.checkpoints.push([this.cursor, this.used]);
  }

  restore() {
    const checkpoint = this.checkpoints.pop();
    if (checkpoint) {
      [this.cursor, this.used] = checkpoint;
    } else {
      const message = 'Checkpoint stack underflow.';
      throw new TypeError(message);
    }
  }

  peek(): T {
    if (this.atEOS()) {
      const message = 'Attempted peek() at end of stream.';
      throw new TypeError(message);
    }
    return this.values[this.cursor];
  }

  take(): void {
    if (this.atEOS()) {
      const message = 'Attempted take() at end of stream.';
      throw new TypeError(message);
    }
    ++this.cursor;
    ++this.used;
  }

  discard(): void {
    if (this.atEOS()) {
      const message = 'Attempted discard() at end of stream.';
      throw new TypeError(message);
    }
    ++this.cursor;
  }

  atEOS(): boolean {
    return this.cursor >= this.values.length;
  }

  itemsUsed(): number {
    return this.used;
  }
}
