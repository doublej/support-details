/**
 * An adaptive binary arithmetic coder, the compression behind coded links (wire.ts). Each byte is
 * eight yes/no decisions down a tree of counters, one tree per context, so a byte that keeps
 * coming back (Yes, a digit after a digit) costs a fraction of a bit where deflate spends eight
 * per literal on input this short. Every step is integer math on a 32-bit interval held in
 * doubles, so every browser writes the same bytes and reads them back. Bytes from an untrusted
 * link: a decoder that runs more than SLACK bits past the end throws.
 */
export type Model = Uint16Array

const NOT_A_REPORT = 'Not a device report'
const SCALE = 4096
const QUARTER = 2 ** 30
const HALF = 2 ** 31
const TOP = 2 ** 32
// A decoder reads 30 bits past the last bit written, plus the zero tail finish() trims; a link
// claiming more than that is cut short or made up.
const SLACK = 64

/** A model, with the bytes to expect before seeing any, each counted `weight` times. */
export function newModel(prior: number[] = [], weight = 1): Model {
  const model = new Uint16Array(512)
  for (const byte of prior) {
    for (let node = 1, shift = 7; shift >= 0; shift--) {
      const bit = (byte >> shift) & 1
      for (let n = 0; n < weight; n++) learn(model, node, bit)
      node = node * 2 + bit
    }
  }
  return model
}

// Krichevsky–Trofimov estimate of the next bit being one, in 1/SCALE, from the counts so far.
function odds(model: Model, node: number): number {
  const zeros = model[node * 2]
  const ones = model[node * 2 + 1]
  return Math.floor(((2 * ones + 1) * (SCALE / 2)) / (zeros + ones + 1))
}

function learn(model: Model, node: number, bit: number) {
  model[node * 2 + bit]++
  if (model[node * 2] + model[node * 2 + 1] > 255) {
    model[node * 2] = (model[node * 2] + 1) >> 1
    model[node * 2 + 1] = (model[node * 2 + 1] + 1) >> 1
  }
}

// Once the interval fits a half (its top bit is settled) or the middle half (the bit after the
// next is), it is shifted up by this much and doubled; -1 while it is still wide.
function settled(low: number, high: number): number {
  if (high < HALF) return 0
  if (low >= HALF) return HALF
  if (low >= QUARTER && high < 3 * QUARTER) return QUARTER
  return -1
}

export class Encoder {
  private low = 0
  private high = TOP - 1
  private pending = 0
  private byte = 0
  private filled = 0
  private out: number[] = []

  constructor(private models: (Model | undefined)[]) {}

  /** A byte under the model of its context; no model codes it as eight plain bits. */
  put(byte: number, context: number) {
    const model = this.models[context]
    for (let node = 1, shift = 7; shift >= 0; shift--) {
      const bit = (byte >> shift) & 1
      this.encode(bit, model ? odds(model, node) : SCALE / 2)
      if (model) learn(model, node, bit)
      node = node * 2 + bit
    }
  }

  private encode(bit: number, oneOdds: number) {
    const split = this.low + Math.floor(((this.high - this.low + 1) * (SCALE - oneOdds)) / SCALE)
    if (bit) this.low = split
    else this.high = split - 1
    for (
      let shift = settled(this.low, this.high);
      shift >= 0;
      shift = settled(this.low, this.high)
    ) {
      // A settled top bit goes out; a settled second bit waits for the top bit that decides it.
      if (shift === QUARTER) this.pending++
      else this.emit(shift === 0 ? 0 : 1)
      this.low = (this.low - shift) * 2
      this.high = (this.high - shift) * 2 + 1
    }
  }

  private emit(bit: number) {
    this.push(bit)
    for (; this.pending > 0; this.pending--) this.push(1 - bit)
  }

  private push(bit: number) {
    this.byte = this.byte * 2 + bit
    if (++this.filled === 8) {
      this.out.push(this.byte)
      this.byte = 0
      this.filled = 0
    }
  }

  finish(): Uint8Array<ArrayBuffer> {
    this.pending++
    this.emit(this.low < QUARTER ? 0 : 1)
    while (this.filled > 0) this.push(0)
    // The decoder reads zeros past the end, so a zero tail travels for free.
    while (this.out[this.out.length - 1] === 0) this.out.pop()
    return Uint8Array.from(this.out)
  }
}

export class Decoder {
  private low = 0
  private high = TOP - 1
  private value = 0
  private at = 0

  constructor(
    private bytes: Uint8Array,
    private models: (Model | undefined)[],
  ) {
    for (let i = 0; i < 32; i++) this.value = this.value * 2 + this.bit()
  }

  get(context: number): number {
    const model = this.models[context]
    let node = 1
    while (node < 256) {
      const bit = this.decode(model ? odds(model, node) : SCALE / 2)
      if (model) learn(model, node, bit)
      node = node * 2 + bit
    }
    return node - 256
  }

  private decode(oneOdds: number): number {
    const split = this.low + Math.floor(((this.high - this.low + 1) * (SCALE - oneOdds)) / SCALE)
    const bit = this.value >= split ? 1 : 0
    if (bit) this.low = split
    else this.high = split - 1
    for (
      let shift = settled(this.low, this.high);
      shift >= 0;
      shift = settled(this.low, this.high)
    ) {
      this.low = (this.low - shift) * 2
      this.high = (this.high - shift) * 2 + 1
      this.value = (this.value - shift) * 2 + this.bit()
    }
    return bit
  }

  private bit(): number {
    const i = this.at++
    if (i < this.bytes.length * 8) return (this.bytes[i >> 3] >> (7 - (i & 7))) & 1
    if (i >= this.bytes.length * 8 + SLACK) throw new Error(NOT_A_REPORT)
    return 0
  }

  /** Every byte was read: a decoder ends 23 to 30 bits past the last bit written, plus the tail. */
  finish() {
    if (this.at < this.bytes.length * 8 + 23) throw new Error(NOT_A_REPORT)
  }
}
