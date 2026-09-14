import { FIRST_TOKEN, type Packed } from './compact'
import { COMMON } from './dictionary'

/**
 * A packed report (compact.ts) as bytes, without JSON framing: four bytes of capture time, then
 * the note, the values and the extras as counted items. A number is one tag byte; text is one
 * byte per character: ASCII as is, a token character as one byte from 0x80 up, anything else as
 * ESC + its UTF-16 code unit. Bytes from an untrusted link: a read past the end or a byte left
 * over rejects the whole link, and unpackReport checks what comes out.
 */
type Read = (count: number) => Uint8Array

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

export function toWire(packed: Packed): Uint8Array<ArrayBuffer> {
  const [at, note, values, extras = []] = packed
  const seconds = Number.parseInt(at, 36)
  const out = [seconds >>> 24, (seconds >>> 16) & 255, (seconds >>> 8) & 255, seconds & 255]
  writeText(out, note)
  writeVarint(out, values.length)
  for (const value of values) writeValue(out, value)
  writeVarint(out, extras.length)
  for (const [section, label, value] of extras) {
    writeText(out, section)
    writeText(out, label)
    writeValue(out, value ?? 0)
  }
  return Uint8Array.from(out)
}

function writeValue(out: number[], value: Packed[2][number]) {
  if (typeof value === 'number') out.push(value + 1)
  else if (typeof value !== 'string') {
    out.push(VERBATIM)
    writeText(out, value[0])
  } else if (value.length < TEXT - SHORT) {
    out.push(SHORT + value.length)
    writeChars(out, value)
  } else {
    out.push(TEXT)
    writeText(out, value)
  }
}

function writeText(out: number[], text: string) {
  writeVarint(out, text.length)
  writeChars(out, text)
}

function writeChars(out: number[], text: string) {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= FIRST_TOKEN && code < FIRST_TOKEN + TOKEN_COUNT)
      out.push(code - FIRST_TOKEN + TOKEN)
    else if (code < TOKEN && code !== ESC) out.push(code)
    else out.push(ESC, code >>> 8, code & 255)
  }
}

function writeVarint(out: number[], n: number) {
  for (; n >= 128; n >>>= 7) out.push((n & 127) | 128)
  out.push(n)
}

/** The Packed shape, or a throw; the values themselves are checked by unpackReport. */
export function fromWire(bytes: Uint8Array): unknown {
  let at = 0
  const read: Read = (count) => {
    if (at + count > bytes.length) throw new Error(NOT_A_REPORT)
    at += count
    return bytes.subarray(at - count, at)
  }
  const seconds = read(4).reduce((n, byte) => n * 256 + byte, 0)
  const note = readText(read)
  const values: unknown[] = []
  for (let n = readVarint(read); n > 0; n--) values.push(readValue(read))
  const extras: unknown[] = []
  for (let n = readVarint(read); n > 0; n--) {
    const [section, label, value] = [readText(read), readText(read), readValue(read)]
    // Extras spell a missing value out as null; compact.ts's values use 0.
    extras.push([section, label, value === 0 ? null : value])
  }
  if (at !== bytes.length) throw new Error(NOT_A_REPORT)
  const packed = [seconds.toString(36), note, values]
  return extras.length > 0 ? [...packed, extras] : packed
}

function readValue(read: Read): unknown {
  const tag = read(1)[0]
  if (tag === TEXT) return readText(read)
  if (tag === VERBATIM) return [readText(read)]
  if (tag >= SHORT) return readChars(read, tag - SHORT)
  return tag - 1
}

const readText = (read: Read): string => readChars(read, readVarint(read))

function readChars(read: Read, count: number): string {
  let text = ''
  for (let n = count; n > 0; n--) {
    const byte = read(1)[0]
    if (byte === ESC) text += String.fromCharCode(read(2).reduce((c, b) => c * 256 + b, 0))
    else text += String.fromCharCode(byte >= TOKEN ? byte - TOKEN + FIRST_TOKEN : byte)
  }
  return text
}

function readVarint(read: Read): number {
  let n = 0
  for (let shift = 0; ; shift += 7) {
    const byte = read(1)[0]
    n += (byte & 127) * 2 ** shift
    if (byte < 128) return n
  }
}
