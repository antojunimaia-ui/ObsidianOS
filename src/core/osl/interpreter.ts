import type {
  Program, Statement, Expression, SystemCallExpression
} from './types';
import { Environment } from './environment';
import { encodePmData } from '../pm/address-space';
import kernel from '../kernel';
import { BytecodeCompiler } from './compiler';

export class ReturnValue {
  value: any;
  constructor(value: any) {
    this.value = value;
  }
}

export class Interpreter {
  private globals: Environment = new Environment();
  private environment: Environment = this.globals;
  private pid: number = 0;
  private args: string[] = [];
  private gdiCommands: any[] = [];
  private eventQueue: string[] = [];
  private cleanups: (() => void)[] = [];

  constructor(pid: number = 0, args: string[] = []) {
    this.pid = pid;
    this.args = args;
    this.setupGlobals();
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

  private setupGlobals() {
    this.globals.define('print', (args: any[]) => {
      console.log(...args);
      kernel.log('INFO', 'OSL', args.join(' '));
      return null;
    });

    this.globals.define('wait', async (args: any[]) => {
      const ms = args[0] || 0;
      return new Promise(resolve => setTimeout(resolve, ms));
    });

    this.globals.define('rand', (args: any[]) => {
      const max = args[0] || 1;
      return Math.random() * max;
    });
  }

  async interpret(program: Program) {
    try {
      for (const statement of program.body) {
        await this.execute(statement);
      }
    } catch (error) {
      if (error instanceof ReturnValue) return error.value;
      throw error;
    }
  }

  // ── Execution ──────────────────────────────────────────────────────────────

  private async execute(statement: Statement): Promise<any> {
    if (!kernel.getProcess(this.pid)) throw new Error("Process terminated");
    
    switch (statement.type) {
      case 'ExpressionStatement':
        return await this.evaluate(statement.expression);
      case 'VariableDeclaration':
        let value = null;
        if (statement.init) {
          value = await this.evaluate(statement.init);
        }
        this.environment.define(statement.id.name, value);
        return null;
      case 'BlockStatement':
        await this.executeBlock(statement.body, new Environment(this.environment));
        return null;
      case 'IfStatement':
        if (await this.evaluate(statement.test)) {
          await this.execute(statement.consequent);
        } else if (statement.alternate) {
          await this.execute(statement.alternate);
        }
        return null;
      case 'WhileStatement':
        while (await this.evaluate(statement.test)) {
          await this.execute(statement.body);
        }
        return null;
      case 'ReturnStatement':
        let result = null;
        if (statement.argument) {
          result = await this.evaluate(statement.argument);
        }
        throw new ReturnValue(result);
      case 'FunctionDeclaration':
        const fn = async (args: any[]) => {
          const closure = new Environment(this.environment);
          for (let i = 0; i < statement.params.length; i++) {
            closure.define(statement.params[i].name, args[i]);
          }
          try {
            await this.executeBlock(statement.body.body, closure);
          } catch (e) {
            if (e instanceof ReturnValue) return e.value;
            throw e;
          }
          return null;
        };
        this.environment.define(statement.id.name, fn);
        return null;
    }
  }

  private async executeBlock(statements: Statement[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;
      for (const statement of statements) {
        await this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  // ── Evaluation ─────────────────────────────────────────────────────────────

  private async evaluate(expr: Expression): Promise<any> {
    switch (expr.type) {
      case 'NumericLiteral':
      case 'StringLiteral':
      case 'BooleanLiteral':
        return expr.value;
      case 'NullLiteral':
        return null;
      case 'Identifier':
        return this.environment.get(expr.name);
      case 'UnaryExpression':
        const right = await this.evaluate(expr.argument);
        switch (expr.operator) {
          case '!': return !right;
          case '-': return -right;
        }
        break;
      case 'BinaryExpression':
        const left = await this.evaluate(expr.left);
        const rightSide = await this.evaluate(expr.right);
        switch (expr.operator) {
          case '+': return left + rightSide;
          case '-': return left - rightSide;
          case '*': return left * rightSide;
          case '/': return left / rightSide;
          case '%': return left % rightSide;
          case '==': return left === rightSide;
          case '!=': return left !== rightSide;
          case '>': return left > rightSide;
          case '<': return left < rightSide;
          case '>=': return left >= rightSide;
          case '<=': return left <= rightSide;
          case '&&': return left && rightSide;
          case '||': return left || rightSide;
          case '=':
            if (expr.left.type === 'Identifier') {
              this.environment.assign(expr.left.name, rightSide);
              return rightSide;
            }
            throw new Error("Invalid assignment.");
        }
        break;
      case 'CallExpression':
        const callee = await this.evaluate(expr.callee);
        const args = [];
        for (const arg of expr.arguments) {
          args.push(await this.evaluate(arg));
        }
        if (typeof callee !== 'function') {
          throw new Error("Can only call functions.");
        }
        return await callee(args);
      case 'SystemCallExpression':
        return await this.handleSystemCall(expr);
    }
  }

  private async handleSystemCall(expr: SystemCallExpression): Promise<any> {
    const args = [];
    for (const arg of expr.arguments) {
      args.push(await this.evaluate(arg));
    }

    // Mapeamento de system::method() para kernel calls
    switch (expr.method) {
      case 'log':
        kernel.emit('process:stdout', { pid: this.pid, message: args.join(' ') });
        return true;
      case 'fs_exists':
        return !!kernel.fsGetNode(args[0]);
      case 'fs_read':
        const node = kernel.fsGetNode(args[0]);
        return node?.content || "";
      case 'fs_write': {
        const fullPath = args[0] as string;
        const parts = fullPath.split('\\');
        const fileName = parts.pop() || "";
        const parentPath = parts.join('\\');
        return kernel.fsCreateFile(parentPath, fileName, args[1] || "", fileName.split('.').pop() || "txt");
      }
      case 'fs_delete':
        return kernel.fsDeleteNode(args[0]);
      case 'reg_get':
        return kernel.regGetValue(args[0]);
      case 'panic':
        kernel.triggerBSOD({
            stopCode: args[0] || "OSL_TRAPPED_EXCEPTION",
            technicalInfo: args[1] || "A system panic was triggered by an OSL script.",
            failedComponent: "osl.exe",
            bugCheckCode: "0x000000C2",
            parameters: args.slice(2)
        });
        return null;
      case 'get_resource':
        const resources = kernel.resources;
        if (args[0] === 'ram') return resources.usedMemory;
        if (args[0] === 'cpu') return resources.cpuUsage;
        return resources;
      case 'stdin':
        return await kernel.readStdin(this.pid);
      case 'fs_getcwd':
        return kernel.getProcess(this.pid)?.currentDirectory || "C:\\";
      case 'fs_chdir': {
        const proc = kernel.getProcess(this.pid);
        if (proc) {
          const target = args[0] as string;
          const node = kernel.fsGetNode(target);
          if (node && node.type === 'directory') {
            proc.currentDirectory = target;
            return true;
          }
        }
        return false;
      }
      case 'fs_list': {
        const path = args[0] || kernel.getProcess(this.pid)?.currentDirectory || "C:\\";
        return kernel.fsGetChildren(path).map((n: any) => n.name).join(", ");
      }
      case 'mem_stats': {
        const s = kernel.pmSpaceStats(this.pid);
        return `blocks:${s.blockCount} reserved:${s.reservedBytes}B committed:${s.committedBytes}B labels:${s.labelCount}`;
      }
      case 'mem_write': {
        // mem::write(block, offset, value) — value: texto ou número
        kernel.pmWrite(this.pid, args[0], args[1], encodePmData(args[2] ?? ''));
        return true;
      }
      case 'mem_read': {
        // mem::read(block, offset, length) → texto (até o NUL)
        const bytes = kernel.pmRead(this.pid, args[0], args[1], args[2] ?? 64);
        let end = bytes.indexOf(0);
        if (end === -1) end = bytes.length;
        return new TextDecoder().decode(bytes.slice(0, end));
      }
      case 'mem_label': {
        // mem::label(nome, block, offset)
        kernel.pmDefineLabel(this.pid, args[0], args[1], args[2]);
        return true;
      }
      case 'mem_snap': {
        // mem::snap() — hiberna o próprio space em *.pmem
        const dir = 'C:\\System Volume Information\\MemSnap';
        if (!kernel.fsExists(dir)) {
          kernel.fsCreateDirectory('C:\\System Volume Information', 'MemSnap');
        }
        const b64 = kernel.pmSnapshot(this.pid);
        kernel.fsCreateFile(dir, `${this.pid}.pmem`, b64, 'pmem');
        return `${dir}\\${this.pid}.pmem (${b64.length} chars)`;
      }
      case 'mem_resume': {
        // mem::resume() — recarrega o próprio space do *.pmem
        const path = `C:\\System Volume Information\\MemSnap\\${this.pid}.pmem`;
        const node = kernel.fsGetNode(path);
        if (!node?.content) throw new Error(`No snapshot at ${path} (run mem::snap() first).`);
        kernel.pmRestore(this.pid, node.content);
        return true;
      }
      case 'mem_audit': {
        const a = kernel.pmAudit();
        return `ledger:${a.ledgerMB.toFixed(2)}MB backed:${a.backedMB.toFixed(2)}MB match:${a.match}`;
      }
      case 'reset_system': {
        await kernel.resetSystem(false);
        return true;
      }
      case 'fs_mkdir': {
        // system::fs_mkdir(path) — cria diretório (parent + nome)
        const fullDir = String(args[0] ?? '');
        const parts   = fullDir.replace(/\\/g, '\\').split('\\');
        const dirName = parts.pop() ?? '';
        const parent  = parts.join('\\');
        kernel.fsCreateDirectory(parent, dirName);
        return true;
      }
      case 'proc_list': {
        // system::proc_list() — retorna lista de processos como string
        const procs = kernel.getProcesses();
        let out = 'PID   NAME\n';
        out += '----  ----\n';
        for (const p of procs) {
          const pidStr = String(p.pid).padEnd(6);
          out += pidStr + p.name + '\n';
        }
        return out.trimEnd();
      }
      case 'proc_kill': {
        // system::proc_kill(pid) — encerra processo
        const killPid = Number(args[0]);
        if (isNaN(killPid)) return false;
        kernel.terminateProcess(killPid);
        return true;
      }
      case 'register_critical': {
        const proc = kernel.getProcess(this.pid);
        const procName = proc?.name || 'unknown';
        const stopCode = String(args[0] ?? 'CRITICAL_PROCESS_DIED');
        const technical = String(args[1] ?? 'A critical system process terminated.');
        const component = String(args[2] ?? procName);
        const bugCheck = String(args[3] ?? '0x000000EF');
        (kernel as any)._faults?.registerCritical(procName, { stopCode, technical, component, bugCheck });
        return true;
      }
      case 'declare_dependency': {
        const proc = kernel.getProcess(this.pid);
        const procName = proc?.name || 'unknown';
        const provider = String(args[0] ?? '');
        (kernel as any)._faults?.declareDependency(procName, provider);
        return true;
      }
      case 'boot_log': {
        kernel.addBootLog(String(args[0] ?? ''));
        return true;
      }
      case 'args': {
        return this.args;
      }
      case 'args_get': {
        // system::args_get(index) — retorna arg[index] ou ""
        const idx = args[0] as number;
        return this.args[idx] ?? '';
      }
      case 'args_len': {
        return this.args.length;
      }
      case 'str_split': {
        // system::str_split(str, sep) — retorna string com partes separadas por \n
        const s   = String(args[0] ?? '');
        const sep = String(args[1] ?? ' ');
        return s.split(sep).join('\n');
      }
      case 'str_len': {
        return String(args[0] ?? '').length;
      }
      case 'str_trim': {
        return String(args[0] ?? '').trim();
      }
      case 'str_index': {
        // system::str_index(str, sep) — retorna índice da primeira ocorrência de sep, ou -1
        return String(args[0] ?? '').indexOf(String(args[1] ?? ''));
      }
      case 'str_slice': {
        // system::str_slice(str, start, end?)
        const st = String(args[0] ?? '');
        return st.slice(args[1] as number, args[2] as number ?? undefined);
      }
      case 'str_replace': {
        return String(args[0] ?? '').replace(String(args[1] ?? ''), String(args[2] ?? ''));
      }
      case 'exit': {
        throw new ReturnValue(args[0] ?? 0);
      }
      case 'spawn': {
        // system::spawn(path, argStr) — executa binário OSL como subprocesso e aguarda
        const binPath   = String(args[0] ?? '');
        const argStr    = String(args[1] ?? '');
        const spawnArgs = argStr !== '' ? [argStr] : [];
        const parentProc = kernel.getProcess(this.pid);
        const spawnPid  = kernel.createProcess(binPath, binPath, '⚙️', parentProc?.windowId);
        if (spawnPid === -1) throw new Error(`spawn: failed to create process for '${binPath}'`);
        await kernel.executeBinaryWithArgs(spawnPid, binPath, spawnArgs, this.pid);
        return spawnPid;
      }
      case 'win_create': {
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
      case 'win_close': {
        const proc = kernel.getProcess(this.pid);
        if (proc?.windowId) {
          kernel.closeWindow(proc.windowId);
          return true;
        }
        return false;
      }
      case 'gdi_clear': {
        const color = String(args[0] ?? '#ffffff');
        const w = Number(args[1] ?? 1920);
        const h = Number(args[2] ?? 1080);
        this.gdiCommands.push({ op: 'fillStyle', color });
        this.gdiCommands.push({ op: 'fillRect', x: 0, y: 0, w, h });
        return true;
      }
      case 'gdi_rect': {
        const x = Number(args[0] ?? 0);
        const y = Number(args[1] ?? 0);
        const w = Number(args[2] ?? 10);
        const h = Number(args[3] ?? 10);
        const color = String(args[4] ?? '#000000');
        this.gdiCommands.push({ op: 'fillStyle', color });
        this.gdiCommands.push({ op: 'fillRect', x, y, w, h });
        return true;
      }
      case 'gdi_stroke_rect': {
        const x = Number(args[0] ?? 0);
        const y = Number(args[1] ?? 0);
        const w = Number(args[2] ?? 10);
        const h = Number(args[3] ?? 10);
        const color = String(args[4] ?? '#000000');
        const width = Number(args[5] ?? 1);
        this.gdiCommands.push({ op: 'strokeStyle', color });
        this.gdiCommands.push({ op: 'lineWidth', width });
        this.gdiCommands.push({ op: 'strokeRect', x, y, w, h });
        return true;
      }
      case 'gdi_text': {
        const x = Number(args[0] ?? 0);
        const y = Number(args[1] ?? 0);
        const text = String(args[2] ?? '');
        const font = String(args[3] ?? '14px Segoe UI, sans-serif');
        const color = String(args[4] ?? '#000000');
        this.gdiCommands.push({ op: 'font', font });
        this.gdiCommands.push({ op: 'fillStyle', color });
        this.gdiCommands.push({ op: 'fillText', text, x, y });
        return true;
      }
      case 'gdi_line': {
        const x1 = Number(args[0] ?? 0);
        const y1 = Number(args[1] ?? 0);
        const x2 = Number(args[2] ?? 0);
        const y2 = Number(args[3] ?? 0);
        const color = String(args[4] ?? '#000000');
        const width = Number(args[5] ?? 1);
        this.gdiCommands.push({ op: 'line', x1, y1, x2, y2, color, width });
        return true;
      }
      case 'gdi_circle': {
        const x = Number(args[0] ?? 0);
        const y = Number(args[1] ?? 0);
        const r = Number(args[2] ?? 5);
        const color = String(args[3] ?? '#000000');
        const fill = args[4] !== false && args[4] !== 0;
        this.gdiCommands.push({ op: 'circle', x, y, r, color, fill });
        return true;
      }
      case 'gdi_flush': {
        if (this.gdiCommands.length > 0) {
          kernel.emit('gdi:draw', { pid: this.pid, commands: [...this.gdiCommands] });
          this.gdiCommands = [];
        }
        return true;
      }
      case 'poll_event': {
        if (this.eventQueue.length > 0) {
          return this.eventQueue.shift();
        }
        return '';
      }
      case 'compile': {
        const sourceCode = String(args[0] ?? '');
        const compiled = BytecodeCompiler.compileSource(sourceCode);
        return JSON.stringify(compiled);
      }
      case 'set_boot_phase': {
        kernel.bootPhase = String(args[0] ?? 'WINLOGON') as any;
        return true;
      }
      case 'is_authenticated': {
        return !kernel.sysIsLocked();
      }
      default:
        throw new Error(`Unknown system call: system::${expr.method}`);
    }
  }
}
