import { Decoder, Encoder, type Model, newModel } from './coder'
import { FIELDS, FIRST_TOKEN, type Packed } from './compact'
import { COMMON } from './dictionary'
import { LIKELY } from './labels'

/**
 * A packed report (compact.ts) as bytes, without JSON framing: four bytes of capture time, then
 * the note, the values and the extras as counted items. A number is one tag byte; text is one
 * byte per character: ASCII as is, a token character as one byte from 0x80 up, anything else as
 * ESC + its UTF-16 code unit. The coded form (toCoded) sends those bytes through the arithmetic
 * coder of coder.ts, each under the model of its kind: lengths, characters, and for a value's
 * tag the model of its field, primed with what LIKELY (labels.ts) expects there. The plain form
 * (toWire) writes the bytes as they are. Bytes from an untrusted link: a read past the end or a
 * byte left over rejects the whole link, and unpackReport checks what comes out.
 */
type Put = (byte: number, context: number) => void
type Get = (context: number) => number

const NOT_A_REPORT = 'Not a device report'
const ESC = 0x1b
const TOKEN = 0x80
const TOKEN_COUNT = 128
// A number value n travels as n + 1: 0 is absent (-1), 1 is null, then the COMMON positions.
// Text shorter than TEXT - SHORT characters has its length in the tag byte.
const SHORT = 0xc0
const TEXT = 0xfe
const VERBATIM = 0xff
if (COMMON.length + 1 >= SHORT) throw new Error('wire.ts is out of common value slots')

// Contexts: the model a byte is coded under. RAW has none (the capture time and escaped code
// units); a value's tag is coded under FIELD + its position. Every prior below is part of the
// coded format: change one and links already sent decode to nonsense.
const LEN = 0
const TAG = 1
const CHAR = 2
const RAW = 3
const FIELD = 4
const PRIOR_WEIGHT = 4

// What value text looks like before a report says otherwise: digits, dots and spaces first, then
// letters, and any of the 128 tokens about as often as a capital.
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'
const SEED = `${'0123456789'.repeat(5)}${'.'.repeat(10)}${' '.repeat(5)},,,-:+()%#${LETTERS}${LETTERS.toUpperCase()}`
const CHAR_PRIOR = [
  ...[...SEED.repeat(3)].map((ch) => ch.charCodeAt(0)),
  ...Array.from({ length: TOKEN_COUNT }, (_, i) => TOKEN + i),
]

// LIKELY as tags: a COMMON value is its position + 2, null is 1, a length is a text tag.
function toTag(likely: string | number | null): number {
  if (likely === null) return 1
  if (typeof likely === 'number') return likely < TEXT - SHORT ? SHORT + likely : TEXT
  const common = COMMON.indexOf(likely)
  if (common === -1) throw new Error(`labels.ts: '${likely}' is not a common value`)
  return common + 2
}
const LABELS = new Set(FIELDS.map(([, label]) => label))
for (const label of Object.keys(LIKELY)) {
  if (!LABELS.has(label))
    throw new Error(`labels.ts: LIKELY names a row that is not in GROUPS: '${label}'`)
}
const FIELD_PRIORS = FIELDS.map(([, label]) => (LIKELY[label] ?? []).map(toTag))

const models = (): (Model | undefined)[] => [
  newModel(),
  newModel(),
  newModel(CHAR_PRIOR),
  undefined,
  ...FIELD_PRIORS.map((prior) => newModel(prior, PRIOR_WEIGHT)),
]

export function toWire(packed: Packed): Uint8Array<ArrayBuffer> {
  const out: number[] = []
  write(packed, (byte) => out.push(byte))
  return Uint8Array.from(out)
}

// A coded link cut short decodes to plausible nonsense, so a sum of the bytes ends it. Seeded, so
// that a link of nothing is not the empty report.
const SUM_SEED = 0x5bd1
const sum = (check: number, byte: number) => (check * 31 + byte) & 0xffff

export function toCoded(packed: Packed): Uint8Array<ArrayBuffer> {
  const encoder = new Encoder(models())
  let check = SUM_SEED
  write(packed, (byte, context) => {
    check = sum(check, byte)
    encoder.put(byte, context)
  })
  encoder.put(check >>> 8, RAW)
  encoder.put(check & 255, RAW)
  return encoder.finish()
}

function write(packed: Packed, put: Put) {
  const [at, note, values, extras = []] = packed
  const seconds = Number.parseInt(at, 36)
  for (const shift of [24, 16, 8, 0]) put((seconds >>> shift) & 255, RAW)
  writeText(put, note)
  writeVarint(put, values.length)
  for (const [index, value] of values.entries()) writeValue(put, value, FIELD + index)
  writeVarint(put, extras.length)
  for (const [section, label, value] of extras) {
    writeText(put, section)
    writeText(put, label)
    writeValue(put, value ?? 0, TAG)
  }
}

function writeValue(put: Put, value: Packed[2][number], context: number) {
  if (typeof value === 'number') put(value + 1, context)
  else if (typeof value !== 'string') {
    put(VERBATIM, context)
    writeText(put, value[0])
  } else if (value.length < TEXT - SHORT) {
    put(SHORT + value.length, context)
    writeChars(put, value)
  } else {
    put(TEXT, context)
    writeText(put, value)
  }
}

function writeText(put: Put, text: string) {
  writeVarint(put, text.length)
  writeChars(put, text)
}

function writeChars(put: Put, text: string) {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= FIRST_TOKEN && code < FIRST_TOKEN + TOKEN_COUNT)
      put(code - FIRST_TOKEN + TOKEN, CHAR)
    else if (code < TOKEN && code !== ESC) put(code, CHAR)
    else {
      put(ESC, CHAR)
      put(code >>> 8, RAW)
      put(code & 255, RAW)
    }
  }
}

function writeVarint(put: Put, n: number) {
  for (; n >= 128; n >>>= 7) put((n & 127) | 128, LEN)
  put(n, LEN)
}

/** The Packed shape, or a throw; the values themselves are checked by unpackReport. */
export function fromWire(bytes: Uint8Array): unknown {
  let at = 0
  const packed = read(() => {
    if (at >= bytes.length) throw new Error(NOT_A_REPORT)
    return bytes[at++]
  })
  if (at !== bytes.length) throw new Error(NOT_A_REPORT)
  return packed
}

export function fromCoded(bytes: Uint8Array): unknown {
  const decoder = new Decoder(bytes, models())
  let check = SUM_SEED
  const packed = read((context) => {
    const byte = decoder.get(context)
    check = sum(check, byte)
    return byte
  })
  if (decoder.get(RAW) * 256 + decoder.get(RAW) !== check) throw new Error(NOT_A_REPORT)
  decoder.finish()
  return packed
}

function read(get: Get): unknown {
  let seconds = 0
  for (let i = 0; i < 4; i++) seconds = seconds * 256 + get(RAW)
  const note = readText(get)
  const values: unknown[] = []
  for (let n = readVarint(get), index = 0; index < n; index++) {
    values.push(readValue(get, FIELD + index))
  }
  const extras: unknown[] = []
  for (let n = readVarint(get); n > 0; n--) {
    const [section, label, value] = [readText(get), readText(get), readValue(get, TAG)]
    // Extras spell a missing value out as null; compact.ts's values use 0.
    extras.push([section, label, value === 0 ? null : value])
  }
  const packed = [seconds.toString(36), note, values]
  return extras.length > 0 ? [...packed, extras] : packed
}

function readValue(get: Get, context: number): unknown {
  const tag = get(context)
  if (tag === TEXT) return readText(get)
  if (tag === VERBATIM) return [readText(get)]
  if (tag >= SHORT) return readChars(get, tag - SHORT)
  return tag - 1
}

const readText = (get: Get): string => readChars(get, readVarint(get))

function readChars(get: Get, count: number): string {
  let text = ''
  for (let n = count; n > 0; n--) {
    const byte = get(CHAR)
    if (byte === ESC) text += String.fromCharCode(get(RAW) * 256 + get(RAW))
    else text += String.fromCharCode(byte >= TOKEN ? byte - TOKEN + FIRST_TOKEN : byte)
  }
  return text
}

function readVarint(get: Get): number {
  let n = 0
  for (let shift = 0; ; shift += 7) {
    const byte = get(LEN)
    n += (byte & 127) * 2 ** shift
    if (byte < 128) return n
  }
}
