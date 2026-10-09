// PmAddressSpace — um espaço de endereçamento PM (SPEC v0.1).
//
// Puro e sem dependências: não importa o Kernel. Cada processo do
// ObsidianOS ganha um destes no createProcess e perde no terminate.
// Blocos são esparsos (alocados no primeiro write) para não estourar
// a RAM do navegador; a tabela (estado + perm) é densa e barata.

export type PmFaultCode = 'PERM_FAULT' | 'BOUNDS_FAULT' | 'OOM_FAULT' | 'NO_SPACE' | 'FORMAT_FAULT';

export class PmFault extends Error {
  readonly code: PmFaultCode;
  readonly block: number;

  constructor(code: PmFaultCode, block: number, message: string) {
    super(`[${code}] block ${block}: ${message}`);
    this.name = 'PmFault';
    this.code = code;
    this.block = block;
  }
}

export const PM_PERM_R = 1;
export const PM_PERM_W = 2;
export const PM_PERM_X = 4;

/**
 * Codificação canônica de valores PM (mesma do montador):
 * número → u32 little-endian, texto → UTF-8 + NUL.
 */
export function encodePmData(data: string | number | Uint8Array | number[]): Uint8Array {
  if (typeof data === 'number') {
    if (!Number.isInteger(data) || data < 0 || data > 0xFFFFFFFF) {
      throw new PmFault('BOUNDS_FAULT', -1, `Number out of range: ${data}.`);
    }
    const out = new Uint8Array(4);
    new DataView(out.buffer).setUint32(0, data, true);
    return out;
  }
  if (typeof data === 'string') {
    const text = new TextEncoder().encode(data);
    const out = new Uint8Array(text.length + 1);
    out.set(text, 0);
    out[text.length] = 0;
    return out;
  }
  return data instanceof Uint8Array ? data.slice() : new Uint8Array(data);
}

interface PmTableEntry {
  state: 0 | 1; // 0 = livre, 1 = ocupado (SPEC §4.2)
  perm: number;
}

export interface PmSpaceStats {
  blockSize: number;
  blockCount: number;
  reservedBytes: number;
  committedBytes: number;
  usedBlocks: number;
  labelCount: number;
}

export class PmAddressSpace {
  readonly blockSize: number;
  readonly blockCount: number;

  private table: PmTableEntry[] = [];
  private data: (Uint8Array | null)[] = [];
  private labels = new Map<string, { block: number; offset: number }>();

  constructor(blockSize: number, blockCount: number) {
    if (blockSize <= 0 || blockCount <= 0) {
      throw new PmFault('OOM_FAULT', -1, 'Address space needs blockSize > 0 and blockCount > 0.');
    }
    this.blockSize = blockSize;
    this.blockCount = blockCount;
    for (let i = 0; i < blockCount; i++) {
      this.table.push({ state: 0, perm: PM_PERM_R | PM_PERM_W });
      this.data.push(null);
    }
  }

  /** Reserva todos os blocos de uma vez (espaço virtual; bytes só no write). */
  reserveAll(perm: number = PM_PERM_R | PM_PERM_W): void {
    for (let i = 0; i < this.blockCount; i++) {
      this.table[i] = { state: 1, perm };
    }
  }

  /** Reserva um bloco livre com a permissão dada. Retorna o índice. */
  alloc(perm: number = PM_PERM_R | PM_PERM_W): number {
    const idx = this.table.findIndex((e) => e.state === 0);
    if (idx === -1) {
      throw new PmFault('OOM_FAULT', -1, 'Address space exhausted: no free blocks.');
    }
    this.table[idx] = { state: 1, perm };
    return idx;
  }

  /** Libera um bloco: zera bytes e marca livre (SPEC §4.3). */
  free(block: number): void {
    this.checkBlock(block);
    this.table[block] = { state: 0, perm: PM_PERM_R | PM_PERM_W };
    this.data[block] = null;
    for (const [name, loc] of this.labels) {
      if (loc.block === block) this.labels.delete(name);
    }
  }

  defineLabel(name: string, block: number, offset: number): void {
    this.checkBlock(block);
    this.checkOffset(offset, 1);
    this.labels.set(name, { block, offset });
  }

  resolveLabel(name: string): { block: number; offset: number } {
    const loc = this.labels.get(name);
    if (!loc) throw new PmFault('BOUNDS_FAULT', -1, `Unknown label '${name}'.`);
    return { ...loc };
  }

  read(block: number, offset: number, length: number): Uint8Array {
    this.checkBlock(block);
    this.checkOffset(offset, length);
    const entry = this.table[block]!;
    if ((entry.perm & PM_PERM_R) === 0) {
      throw new PmFault('PERM_FAULT', block, 'Read denied: block has no read permission.');
    }
    const bytes = this.data[block];
    if (!bytes) return new Uint8Array(length); // nunca escrito = zeros
    return bytes.slice(offset, offset + length);
  }

  write(block: number, offset: number, src: Uint8Array): void {
    this.checkBlock(block);
    this.checkOffset(offset, src.length);
    const entry = this.table[block]!;
    if (entry.state === 0) {
      throw new PmFault('BOUNDS_FAULT', block, 'Write to a free block. Alloc it first.');
    }
    if ((entry.perm & PM_PERM_W) === 0) {
      throw new PmFault('PERM_FAULT', block, 'Write denied: block has no write permission.');
    }
    let bytes = this.data[block];
    if (!bytes) {
      bytes = new Uint8Array(this.blockSize);
      this.data[block] = bytes;
    }
    bytes.set(src, offset);
  }

  setPerm(block: number, perm: number): void {
    this.checkBlock(block);
    this.table[block]!.perm = perm;
  }

  /**
   * Acesso cru do kernel (sem checar perm): usado pelo mailbox e afins.
   * Bounds continuam fiscalizados.
   */
  readRaw(block: number, offset: number, length: number): Uint8Array {
    this.checkBlock(block);
    this.checkOffset(offset, length);
    const bytes = this.data[block];
    if (!bytes) return new Uint8Array(length);
    return bytes.slice(offset, offset + length);
  }

  writeRaw(block: number, offset: number, src: Uint8Array): void {
    this.checkBlock(block);
    this.checkOffset(offset, src.length);
    let bytes = this.data[block];
    if (!bytes) {
      bytes = new Uint8Array(this.blockSize);
      this.data[block] = bytes;
    }
    bytes.set(src, offset);
  }

  // ── Mailbox do kernel (bloco 0) ────────────────────────────────────
  // Fila stdin do processo em bytes PM: [count u32][len u32 + utf8]*.
  // É isto que torna a PM load-bearing: todo input do shell passa aqui.

  mboxPush(text: string): void {
    const messages = this.mboxReadAll();
    messages.push(text);
    // Compacta descartando as mais antigas até caber.
    while (this.mboxEncodedSize(messages) > this.blockSize - 4 && messages.length > 1) {
      messages.shift();
    }
    if (this.mboxEncodedSize(messages) > this.blockSize) {
      throw new PmFault('OOM_FAULT', 0, 'Stdin message larger than the kernel mailbox.');
    }
    this.writeRaw(0, 0, this.mboxEncode(messages));
  }

  mboxShift(): string | null {
    const messages = this.mboxReadAll();
    if (messages.length === 0) return null;
    const first = messages.shift()!;
    this.writeRaw(0, 0, this.mboxEncode(messages));
    return first;
  }

  mboxCount(): number {
    return this.mboxReadAll().length;
  }

  private mboxReadAll(): string[] {
    const raw = this.readRaw(0, 0, this.blockSize);
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    const count = view.getUint32(0, true);
    if (count > 100000) return []; // mailbox corrompido: trata como vazio
    const out: string[] = [];
    let off = 4;
    for (let i = 0; i < count; i++) {
      if (off + 4 > raw.length) break;
      const len = view.getUint32(off, true);
      off += 4;
      if (len > this.blockSize || off + len > raw.length) break;
      out.push(new TextDecoder().decode(raw.slice(off, off + len)));
      off += len;
    }
    return out;
  }

  private mboxEncodedSize(messages: string[]): number {
    let size = 4;
    const enc = new TextEncoder();
    for (const m of messages) size += 4 + enc.encode(m).length;
    return size;
  }

  private mboxEncode(messages: string[]): Uint8Array {
    const out = new Uint8Array(this.blockSize); // zeros no resto
    const view = new DataView(out.buffer);
    view.setUint32(0, messages.length, true);
    let off = 4;
    const enc = new TextEncoder();
    for (const m of messages) {
      const payload = enc.encode(m);
      view.setUint32(off, payload.length, true);
      off += 4;
      out.set(payload, off);
      off += payload.length;
    }
    return out.slice(0, off);
  }

  stats(): PmSpaceStats {
    let used = 0;
    let committed = 0;
    for (let i = 0; i < this.blockCount; i++) {
      if (this.table[i]!.state === 1) {
        used++;
        if (this.data[i]) committed += this.blockSize;
      }
    }
    return {
      blockSize: this.blockSize,
      blockCount: this.blockCount,
      reservedBytes: used * this.blockSize,
      committedBytes: committed,
      usedBlocks: used,
      labelCount: this.labels.size,
    };
  }

  /**
   * Exporta o space como imagem .pmem (SPEC §4):
   * header 64B + entradas 8B/bloco + dados. Bloco nunca escrito = zeros.
   */
  exportImage(): Uint8Array {
    const headerSize = 64;
    const entriesSize = this.blockCount * 8;
    const out = new Uint8Array(headerSize + entriesSize + this.blockCount * this.blockSize);
    const view = new DataView(out.buffer);

    out[0] = 0x50; out[1] = 0x4d; out[2] = 0x45; out[3] = 0x4d; // "PMEM"
    out[4] = 1; out[5] = 0; // v1.0
    view.setUint16(6, this.blockSize, true);
    view.setUint32(8, 1, true); // uma tabela por space
    view.setUint32(12, this.blockCount, true);

    for (let i = 0; i < this.blockCount; i++) {
      const base = headerSize + i * 8;
      const dataOffset = headerSize + entriesSize + i * this.blockSize;
      const entry = this.table[i]!;
      out[base] = entry.state;
      out[base + 1] = entry.perm;
      view.setUint32(base + 4, dataOffset, true);
      const bytes = this.data[i];
      if (bytes) out.set(bytes, dataOffset);
    }
    return out;
  }

  /** Importa imagem .pmem validada (magic, versão, tamanhos coerentes). */
  static importImage(bytes: Uint8Array): PmAddressSpace {
    const fail = (msg: string): never => {
      throw new PmFault('FORMAT_FAULT', -1, msg);
    };
    if (bytes.length < 64) fail('Image too small for a PM header.');
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4d || bytes[2] !== 0x45 || bytes[3] !== 0x4d) {
      fail('Bad magic: not a PMEM image.');
    }
    if (bytes[4] !== 1 || bytes[5] !== 0) {
      fail(`Unsupported version ${bytes[4]}.${bytes[5]} (expected 1.0).`);
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const blockSize = view.getUint16(6, true);
    const blockCount = view.getUint32(12, true);
    if (blockSize <= 0 || blockCount <= 0) fail('Invalid geometry in header.');
    if (blockCount > 1 << 20) fail('Block count absurdly large; refusing to allocate.');
    const expected = 64 + blockCount * 8 + blockCount * blockSize;
    if (bytes.length !== expected) {
      fail(`Truncated image: has ${bytes.length} bytes, header declares ${expected}.`);
    }

    const space = new PmAddressSpace(blockSize, blockCount);
    for (let i = 0; i < blockCount; i++) {
      const base = 64 + i * 8;
      const state = bytes[base]!;
      const perm = bytes[base + 1]!;
      const dataOffset = view.getUint32(base + 4, true);
      const expectOff = 64 + blockCount * 8 + i * blockSize;
      if (dataOffset !== expectOff) fail(`Table entry ${i} points outside its block.`);
      if (state !== 0 && state !== 1) fail(`Table entry ${i} has invalid state.`);
      space.table[i] = { state: state === 1 ? 1 : 0, perm };
      // Só materializa blocos com byte não-zero (esparso de volta).
      const slice = bytes.slice(dataOffset, dataOffset + blockSize);
      let touched = false;
      for (let j = 0; j < slice.length; j++) {
        if (slice[j] !== 0) { touched = true; break; }
      }
      if (touched) space.data[i] = slice;
    }
    return space;
  }

  private checkBlock(block: number): void {
    if (!Number.isInteger(block) || block < 0 || block >= this.blockCount) {
      throw new PmFault('BOUNDS_FAULT', block, `Block out of range (0..${this.blockCount - 1}).`);
    }
  }

  private checkOffset(offset: number, length: number): void {
    if (!Number.isInteger(offset) || offset < 0 || offset + length > this.blockSize) {
      throw new PmFault('BOUNDS_FAULT', -1, `Offset out of range (block holds ${this.blockSize} bytes).`);
    }
  }
}
