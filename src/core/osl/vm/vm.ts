// ============================================================
// ObsidianOS Bytecode Virtual Machine (OVM) Engine
// Fase 4: Interpretador de Bytecode Puro
// ============================================================

import { Opcode, SyscallId, type BytecodeModule } from './opcodes';
import kernel from '../../kernel';
import { encodePmData } from '../../pm/address-space';

export class VirtualMachine {
  private pid: number;
  private args: string[];

  // Registradores virtuais de propósito geral (R0 - R7)
  private registers: any[] = new Array(8).fill(null);

  // Pilha de execução
  private stack: any[] = [];

  // Variáveis em memória
  private variables: Map<number, any> = new Map();

  // Instruction pointer
  private ip: number = 0;

  // GDI & Eventos
  private gdiCommands: any[] = [];
  private eventQueue: string[] = [];
  private cleanups: (() => void)[] = [];

  constructor(pid: number = 0, args: string[] = []) {
    this.pid = pid;
    this.args = args;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    const offMouse = kernel.on('user32:mouse', (data: { pid: number, type: string, x: number, y: number, button: number }) => {
      if (data.pid === this.pid) {
        if (this.eventQueue.length < 50) {
          this.eventQueue.push(`${data.type},${Math.round(data.x)},${Math.round(data.y)},${data.button}`);
        }
      }
    });
    this.cleanups.push(offMouse);
  }

  public dispose() {
    this.cleanups.forEach(u => u());
    this.cleanups = [];
  }

  /**
   * Executa um módulo de bytecode compilado (.obx)
   */
  async run(module: BytecodeModule): Promise<any> {
    const { constantPool, instructions } = module;
    this.ip = 0;
    this.stack = [];
    this.variables.clear();
    this.registers.fill(null);

    const len = instructions.length;

    while (this.ip < len) {
      if (!kernel.getProcess(this.pid)) {
        throw new Error("Process terminated");
      }

      const op = instructions[this.ip++];

      switch (op) {
        case Opcode.HALT:
          return this.registers[0];

        case Opcode.NOP:
          break;

        case Opcode.LOAD_CONST: {
          const reg = instructions[this.ip++];
          const constIdx = instructions[this.ip++];
          this.registers[reg] = constantPool[constIdx];
          break;
        }

        case Opcode.LOAD_VAR: {
          const reg = instructions[this.ip++];
          const varIdx = instructions[this.ip++];
          this.registers[reg] = this.variables.get(varIdx) ?? null;
          break;
        }

        case Opcode.STORE_VAR: {
          const varIdx = instructions[this.ip++];
          const reg = instructions[this.ip++];
          this.variables.set(varIdx, this.registers[reg]);
          break;
        }

        case Opcode.MOV: {
          const dst = instructions[this.ip++];
          const src = instructions[this.ip++];
          this.registers[dst] = this.registers[src];
          break;
        }

        case Opcode.PUSH: {
          const reg = instructions[this.ip++];
          this.stack.push(this.registers[reg]);
          break;
        }

        case Opcode.POP: {
          const reg = instructions[this.ip++];
          this.registers[reg] = this.stack.pop();
          break;
        }

        // Operações Aritméticas
        case Opcode.ADD: {
          const dst = instructions[this.ip++];
          const s1 = instructions[this.ip++];
          const s2 = instructions[this.ip++];
          this.registers[dst] = this.registers[s1] + this.registers[s2];
          break;
        }

        case Opcode.SUB: {
          const dst = instructions[this.ip++];
          const s1 = instructions[this.ip++];
          const s2 = instructions[this.ip++];
          this.registers[dst] = this.registers[s1] - this.registers[s2];
          break;
        }

        case Opcode.MUL: {
          const dst = instructions[this.ip++];
          const s1 = instructions[this.ip++];
          const s2 = instructions[this.ip++];
          this.registers[dst] = this.registers[s1] * this.registers[s2];
          break;
        }

        case Opcode.DIV: {
          const dst = instructions[this.ip++];
          const s1 = instructions[this.ip++];
          const s2 = instructions[this.ip++];
          this.registers[dst] = this.registers[s1] / this.registers[s2];
          break;
        }

        case Opcode.MOD: {
          const dst = instructions[this.ip++];
          const s1 = instructions[this.ip++];
          const s2 = instructions[this.ip++];
          this.registers[dst] = this.registers[s1] % this.registers[s2];
          break;
        }

        // Comparações e Lógica
        case Opcode.CMP_EQ: {
          const dst = instructions[this.ip++];
          const s1 = instructions[this.ip++];
          const s2 = instructions[this.ip++];
          this.registers[dst] = (this.registers[s1] == this.registers[s2]) ? 1 : 0;
          break;
        }

        case Opcode.CMP_NE: {
          const dst = instructions[this.ip++];
          const s1 = instructions[this.ip++];
          const s2 = instructions[this.ip++];
          this.registers[dst] = (this.registers[s1] != this.registers[s2]) ? 1 : 0;
          break;
        }

        case Opcode.CMP_LT: {
          const dst = instructions[this.ip++];
          const s1 = instructions[this.ip++];
          const s2 = instructions[this.ip++];
          this.registers[dst] = (this.registers[s1] < this.registers[s2]) ? 1 : 0;
          break;
        }

        case Opcode.CMP_LE: {
          const dst = instructions[this.ip++];
          const s1 = instructions[this.ip++];
          const s2 = instructions[this.ip++];
          this.registers[dst] = (this.registers[s1] <= this.registers[s2]) ? 1 : 0;
          break;
        }

        case Opcode.CMP_GT: {
          const dst = instructions[this.ip++];
          const s1 = instructions[this.ip++];
          const s2 = instructions[this.ip++];
          this.registers[dst] = (this.registers[s1] > this.registers[s2]) ? 1 : 0;
          break;
        }

        case Opcode.CMP_GE: {
          const dst = instructions[this.ip++];
          const s1 = instructions[this.ip++];
          const s2 = instructions[this.ip++];
          this.registers[dst] = (this.registers[s1] >= this.registers[s2]) ? 1 : 0;
          break;
        }

        case Opcode.LOGICAL_NOT: {
          const dst = instructions[this.ip++];
          const src = instructions[this.ip++];
          this.registers[dst] = !this.registers[src] ? 1 : 0;
          break;
        }

        // Saltos e Controle de Fluxo
        case Opcode.JMP: {
          const target = instructions[this.ip++];
          this.ip = target;
          break;
        }

        case Opcode.JZ: {
          const reg = instructions[this.ip++];
          const target = instructions[this.ip++];
          if (!this.registers[reg] || this.registers[reg] === 0) {
            this.ip = target;
          }
          break;
        }

        case Opcode.JNZ: {
          const reg = instructions[this.ip++];
          const target = instructions[this.ip++];
          if (this.registers[reg] && this.registers[reg] !== 0) {
            this.ip = target;
          }
          break;
        }

        case Opcode.RET: {
          const reg = instructions[this.ip++];
          return this.registers[reg];
        }

        // Chamada de Sistema
        case Opcode.SYSCALL: {
          const sysId = instructions[this.ip++];
          const argCount = instructions[this.ip++];
          const dstReg = instructions[this.ip++];

          const args: any[] = [];
          for (let i = 0; i < argCount; i++) {
            args.push(this.stack.pop());
          }
          args.reverse(); // Restaura ordem natural de passagem

          const result = await this.handleSyscall(sysId, args);
          this.registers[dstReg] = result;
          break;
        }

        default:
          throw new Error(`OVM: Instrução inválida 0x${op.toString(16)} em IP=${this.ip - 1}`);
      }
    }

    return this.registers[0];
  }

  // ── Dispatch Numérico de Syscalls ─────────────────────────
  private async handleSyscall(id: SyscallId, args: any[]): Promise<any> {
    switch (id) {
      case SyscallId.LOG:
        kernel.emit('process:stdout', { pid: this.pid, message: args.join(' ') });
        return true;

      case SyscallId.PRINT:
        console.log(...args);
        kernel.log('INFO', 'OVM', args.join(' '));
        return null;

      case SyscallId.WAIT:
        await new Promise(r => setTimeout(r, Number(args[0] ?? 0)));
        return null;

      case SyscallId.RAND:
        return Math.random() * (Number(args[0]) || 1);

      case SyscallId.EXIT:
        return args[0] ?? 0;

      case SyscallId.ARGS:
        return this.args;

      case SyscallId.ARGS_GET:
        return this.args[Number(args[0])] ?? '';

      case SyscallId.ARGS_LEN:
        return this.args.length;

      case SyscallId.FS_EXISTS:
        return !!kernel.fsGetNode(String(args[0]));

      case SyscallId.FS_READ:
        return kernel.fsGetNode(String(args[0]))?.content || '';

      case SyscallId.FS_WRITE: {
        const fullPath = String(args[0]);
        const parts = fullPath.split('\\');
        const fileName = parts.pop() || '';
        const parentPath = parts.join('\\');
        return kernel.fsCreateFile(parentPath, fileName, String(args[1] ?? ''), fileName.split('.').pop() || 'txt');
      }

      case SyscallId.FS_DELETE:
        return kernel.fsDeleteNode(String(args[0]));

      case SyscallId.FS_LIST: {
        const path = String(args[0] || kernel.getProcess(this.pid)?.currentDirectory || 'C:\\');
        return kernel.fsGetChildren(path).map((n: any) => n.name).join(', ');
      }

      case SyscallId.FS_GETCWD:
        return kernel.getProcess(this.pid)?.currentDirectory || 'C:\\';

      case SyscallId.FS_CHDIR: {
        const proc = kernel.getProcess(this.pid);
        if (proc) {
          const target = String(args[0]);
          const node = kernel.fsGetNode(target);
          if (node && node.type === 'directory') {
            proc.currentDirectory = target;
            return true;
          }
        }
        return false;
      }

      case SyscallId.FS_MKDIR: {
        const fullDir = String(args[0] ?? '');
        const parts = fullDir.split('\\');
        const dirName = parts.pop() ?? '';
        const parent = parts.join('\\');
        kernel.fsCreateDirectory(parent, dirName);
        return true;
      }

      case SyscallId.PROC_LIST: {
        const procs = kernel.getProcesses();
        let out = 'PID   NAME\n';
        out += '----  ----\n';
        for (const p of procs) {
          out += String(p.pid).padEnd(6) + p.name + '\n';
        }
        return out.trimEnd();
      }

      case SyscallId.PROC_KILL: {
        const killPid = Number(args[0]);
        if (isNaN(killPid)) return false;
        kernel.terminateProcess(killPid);
        return true;
      }

      case SyscallId.REGISTER_CRITICAL: {
        const proc = kernel.getProcess(this.pid);
        const procName = proc?.name || 'unknown';
        const stopCode = String(args[0] ?? 'CRITICAL_PROCESS_DIED');
        const technical = String(args[1] ?? 'A critical system process terminated.');
        const component = String(args[2] ?? procName);
        const bugCheck = String(args[3] ?? '0x000000EF');
        (kernel as any)._faults?.registerCritical(procName, { stopCode, technical, component, bugCheck });
        return true;
      }

      case SyscallId.DECLARE_DEPENDENCY: {
        const proc = kernel.getProcess(this.pid);
        const procName = proc?.name || 'unknown';
        const provider = String(args[0] ?? '');
        (kernel as any)._faults?.declareDependency(procName, provider);
        return true;
      }

      case SyscallId.BOOT_LOG: {
        kernel.addBootLog(String(args[0] ?? ''));
        return true;
      }

      case SyscallId.SPAWN: {
        const binPath = String(args[0] ?? '');
        const argStr = String(args[1] ?? '');
        const spawnArgs = argStr !== '' ? [argStr] : [];
        const parentProc = kernel.getProcess(this.pid);
        const spawnPid = kernel.createProcess(binPath, binPath, '⚙️', parentProc?.windowId);
        if (spawnPid === -1) throw new Error(`spawn: failed to create process for '${binPath}'`);
        await kernel.executeBinaryWithArgs(spawnPid, binPath, spawnArgs, this.pid);
        return spawnPid;
      }

      // Memória Persistente (PM)
      case SyscallId.MEM_STATS: {
        const s = kernel.pmSpaceStats(this.pid);
        return `blocks:${s.blockCount} reserved:${s.reservedBytes}B committed:${s.committedBytes}B labels:${s.labelCount}`;
      }

      case SyscallId.MEM_WRITE:
        kernel.pmWrite(this.pid, args[0], args[1], encodePmData(args[2] ?? ''));
        return true;

      case SyscallId.MEM_READ: {
        const bytes = kernel.pmRead(this.pid, args[0], args[1], args[2] ?? 64);
        let end = bytes.indexOf(0);
        if (end === -1) end = bytes.length;
        return new TextDecoder().decode(bytes.slice(0, end));
      }

      case SyscallId.MEM_LABEL:
        kernel.pmDefineLabel(this.pid, args[0], args[1], args[2]);
        return true;

      case SyscallId.MEM_SNAP: {
        const dir = 'C:\\System Volume Information\\MemSnap';
        if (!kernel.fsExists(dir)) {
          kernel.fsCreateDirectory('C:\\System Volume Information', 'MemSnap');
        }
        const b64 = kernel.pmSnapshot(this.pid);
        kernel.fsCreateFile(dir, `${this.pid}.pmem`, b64, 'pmem');
        return `${dir}\\${this.pid}.pmem (${b64.length} chars)`;
      }

      case SyscallId.MEM_RESUME: {
        const path = `C:\\System Volume Information\\MemSnap\\${this.pid}.pmem`;
        const node = kernel.fsGetNode(path);
        if (!node?.content) throw new Error(`No snapshot at ${path}`);
        kernel.pmRestore(this.pid, node.content);
        return true;
      }

      case SyscallId.MEM_AUDIT: {
        const a = kernel.pmAudit();
        return `ledger:${a.ledgerMB.toFixed(2)}MB backed:${a.backedMB.toFixed(2)}MB match:${a.match}`;
      }

      // Janelas e GDI
      case SyscallId.WIN_CREATE: {
        const title = String(args[0] ?? 'ObsidianOS Window');
        const width = Number(args[1] ?? 600);
        const height = Number(args[2] ?? 400);
        const winId = kernel.openWindow({
          title,
          icon: '🎨',
          appId: `osl_gdi:${this.pid}`,
          width,
          height,
          processId: this.pid,
        });
        const proc = kernel.getProcess(this.pid);
        if (proc) proc.windowId = winId;
        return winId;
      }

      case SyscallId.WIN_CLOSE: {
        const proc = kernel.getProcess(this.pid);
        if (proc?.windowId) {
          kernel.closeWindow(proc.windowId);
          return true;
        }
        return false;
      }

      case SyscallId.GDI_CLEAR: {
        const color = String(args[0] ?? '#ffffff');
        const w = Number(args[1] ?? 1920);
        const h = Number(args[2] ?? 1080);
        this.gdiCommands.push({ op: 'fillStyle', color });
        this.gdiCommands.push({ op: 'fillRect', x: 0, y: 0, w, h });
        return true;
      }

      case SyscallId.GDI_RECT: {
        this.gdiCommands.push({
          op: 'fillStyle',
          color: String(args[4] ?? '#000000')
        });
        this.gdiCommands.push({
          op: 'fillRect',
          x: Number(args[0] ?? 0),
          y: Number(args[1] ?? 0),
          w: Number(args[2] ?? 10),
          h: Number(args[3] ?? 10)
        });
        return true;
      }

      case SyscallId.GDI_STROKE_RECT: {
        this.gdiCommands.push({ op: 'strokeStyle', color: String(args[4] ?? '#000000') });
        this.gdiCommands.push({ op: 'lineWidth', width: Number(args[5] ?? 1) });
        this.gdiCommands.push({
          op: 'strokeRect',
          x: Number(args[0] ?? 0),
          y: Number(args[1] ?? 0),
          w: Number(args[2] ?? 10),
          h: Number(args[3] ?? 10)
        });
        return true;
      }

      case SyscallId.GDI_TEXT: {
        this.gdiCommands.push({ op: 'font', font: String(args[3] ?? '14px Segoe UI, sans-serif') });
        this.gdiCommands.push({ op: 'fillStyle', color: String(args[4] ?? '#000000') });
        this.gdiCommands.push({ op: 'fillText', text: String(args[2] ?? ''), x: Number(args[0] ?? 0), y: Number(args[1] ?? 0) });
        return true;
      }

      case SyscallId.GDI_LINE: {
        this.gdiCommands.push({
          op: 'line',
          x1: Number(args[0] ?? 0),
          y1: Number(args[1] ?? 0),
          x2: Number(args[2] ?? 0),
          y2: Number(args[3] ?? 0),
          color: String(args[4] ?? '#000000'),
          width: Number(args[5] ?? 1)
        });
        return true;
      }

      case SyscallId.GDI_CIRCLE: {
        this.gdiCommands.push({
          op: 'circle',
          x: Number(args[0] ?? 0),
          y: Number(args[1] ?? 0),
          r: Number(args[2] ?? 5),
          color: String(args[3] ?? '#000000'),
          fill: args[4] !== false && args[4] !== 0
        });
        return true;
      }

      case SyscallId.GDI_FLUSH: {
        if (this.gdiCommands.length > 0) {
          kernel.emit('gdi:draw', { pid: this.pid, commands: [...this.gdiCommands] });
          this.gdiCommands = [];
        }
        return true;
      }

      case SyscallId.POLL_EVENT:
        return this.eventQueue.length > 0 ? this.eventQueue.shift() : '';

      case SyscallId.STR_INDEX:
        return String(args[0] ?? '').indexOf(String(args[1] ?? ''));

      case SyscallId.STR_SLICE:
        return String(args[0] ?? '').slice(Number(args[1]), args[2] !== undefined ? Number(args[2]) : undefined);

      case SyscallId.STR_LEN:
        return String(args[0] ?? '').length;

      case SyscallId.STR_TRIM:
        return String(args[0] ?? '').trim();

      case SyscallId.STR_SPLIT:
        return String(args[0] ?? '').split(String(args[1] ?? ' ')).join('\n');

      case SyscallId.STR_REPLACE:
        return String(args[0] ?? '').replace(String(args[1] ?? ''), String(args[2] ?? ''));

      case SyscallId.GET_RESOURCE:
        if (args[0] === 'ram') return kernel.resources.usedMemory;
        if (args[0] === 'cpu') return kernel.resources.cpuUsage;
        return kernel.resources;

      case SyscallId.STDIN:
        return await kernel.readStdin(this.pid);

      case SyscallId.REG_GET:
        return kernel.regGetValue(String(args[0]));

      case SyscallId.RESET_SYSTEM:
        await kernel.resetSystem(false);
        return true;

      case SyscallId.SET_BOOT_PHASE:
        kernel.bootPhase = String(args[0] ?? 'WINLOGON') as any;
        return true;

      case SyscallId.IS_AUTHENTICATED:
        return !kernel.sysIsLocked();

      default:
        throw new Error(`OVM Syscall desconhecida: 0x${(id as number).toString(16)}`);
    }
  }
}
