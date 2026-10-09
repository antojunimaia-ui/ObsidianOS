// PmMemoryManager — address spaces PM por processo.
//
// Segue o padrão dos managers do kernel: estado e lógica aqui,
// ciclo de vida dirigido pelo Kernel (createSpace no createProcess,
// destroySpace no terminate). Não importa o Kernel (sem ciclo).

import { PmAddressSpace, PmFault } from '../pm/address-space';
import type { PmSpaceStats } from '../pm/address-space';
import { base64ToBytes, bytesToBase64 } from '../pm/codec';

export interface PmGlobalStats {
  spaces: number;
  blockSize: number;
  reservedBytes: number;
  committedBytes: number;
}

const DEFAULT_BLOCK_SIZE = 65536; // 64 KB por bloco no nível do SO

export class PmMemoryManager {
  private spaces = new Map<number, PmAddressSpace>();
  private blockSize: number;

  constructor(blockSize: number = DEFAULT_BLOCK_SIZE) {
    this.blockSize = blockSize;
  }

  /**
   * Aplica a geometria vinda do system.pmem. Idempotente para o mesmo
   * tamanho; tamanho conflitante com spaces vivos é erro (dois boots
   * concorrentes ou corrupção de estado).
   */
  configure(blockSize: number): void {
    if (!Number.isInteger(blockSize) || blockSize <= 0 || blockSize > 1 << 24) {
      throw new PmFault('FORMAT_FAULT', -1, `Invalid block size in system image: ${blockSize}.`);
    }
    if (blockSize === this.blockSize) return;
    if (this.spaces.size > 0) {
      throw new PmFault('NO_SPACE', -1, 'Cannot reconfigure PM geometry with live spaces.');
    }
    this.blockSize = blockSize;
  }

  configuredBlockSize(): number {
    return this.blockSize;
  }

  /** Cria o address space: N blocos virtuais reservados, bytes sob demanda. */
  createSpace(pid: number, virtualMB = 64): void {
    if (this.spaces.has(pid)) this.destroySpace(pid);
    const blocks = Math.max(2, Math.ceil((virtualMB * 1024 * 1024) / this.blockSize));
    const space = new PmAddressSpace(this.blockSize, blocks);
    space.reserveAll();
    // Bloco 0 = mailbox do kernel (stdin): programa de usuário não toca.
    space.setPerm(0, 0);
    this.spaces.set(pid, space);
  }

  destroySpace(pid: number): void {
    this.spaces.delete(pid);
  }

  hasSpace(pid: number): boolean {
    return this.spaces.has(pid);
  }

  read(pid: number, block: number, offset: number, length: number): Uint8Array {
    return this.require(pid).read(block, offset, length);
  }

  write(pid: number, block: number, offset: number, data: Uint8Array): void {
    this.require(pid).write(block, offset, data);
  }

  defineLabel(pid: number, name: string, block: number, offset: number): void {
    this.require(pid).defineLabel(name, block, offset);
  }

  spaceStats(pid: number): PmSpaceStats {
    return this.require(pid).stats();
  }

  /** Snapshot: space -> imagem .pmem -> base64 (pronto p/ VFS). */
  snapshot(pid: number): string {
    return bytesToBase64(this.require(pid).exportImage());
  }

  /** Fila stdin vive em bytes PM (mailbox, bloco 0). */
  stdinPush(pid: number, text: string): void {
    this.require(pid).mboxPush(text);
  }

  stdinShift(pid: number): string | null {
    return this.require(pid).mboxShift();
  }

  /** Restore: base64 -> imagem validada -> space substituto. */
  restore(pid: number, b64: string): void {
    const space = PmAddressSpace.importImage(base64ToBytes(b64));
    this.spaces.set(pid, space);
  }

  stats(): PmGlobalStats {
    let reserved = 0;
    let committed = 0;
    for (const space of this.spaces.values()) {
      const s = space.stats();
      reserved += s.reservedBytes;
      committed += s.committedBytes;
    }
    return { spaces: this.spaces.size, blockSize: this.blockSize, reservedBytes: reserved, committedBytes: committed };
  }

  reset(): void {
    this.spaces.clear();
  }

  private require(pid: number): PmAddressSpace {
    const space = this.spaces.get(pid);
    if (!space) throw new PmFault('NO_SPACE', -1, `Process ${pid} has no PM address space.`);
    return space;
  }
}
