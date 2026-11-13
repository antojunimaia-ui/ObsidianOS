// ============================================================
// ObsidianOS OSL Bytecode Compiler
// Fase 4: Compilador de AST para Bytecode (OBX v2)
// ============================================================

import type { Program, Statement, Expression } from './types';
import { Opcode, SyscallId, type BytecodeModule } from './vm/opcodes';
import { Lexer } from './lexer';
import { Parser } from './parser';

export class BytecodeCompiler {
  private constants: any[] = [];
  private variableMap: Map<string, number> = new Map();
  private instructions: number[] = [];

  // Mapeamento de nome de syscall para SyscallId numérico
  private syscallMap: Record<string, SyscallId> = {
    'log': SyscallId.LOG,
    'print': SyscallId.PRINT,
    'wait': SyscallId.WAIT,
    'rand': SyscallId.RAND,
    'exit': SyscallId.EXIT,
    'args': SyscallId.ARGS,
    'args_get': SyscallId.ARGS_GET,
    'args_len': SyscallId.ARGS_LEN,
    'fs_exists': SyscallId.FS_EXISTS,
    'fs_read': SyscallId.FS_READ,
    'fs_write': SyscallId.FS_WRITE,
    'fs_delete': SyscallId.FS_DELETE,
    'fs_list': SyscallId.FS_LIST,
    'fs_getcwd': SyscallId.FS_GETCWD,
    'fs_chdir': SyscallId.FS_CHDIR,
    'fs_mkdir': SyscallId.FS_MKDIR,
    'proc_list': SyscallId.PROC_LIST,
    'proc_kill': SyscallId.PROC_KILL,
    'spawn': SyscallId.SPAWN,
    'register_critical': SyscallId.REGISTER_CRITICAL,
    'declare_dependency': SyscallId.DECLARE_DEPENDENCY,
    'boot_log': SyscallId.BOOT_LOG,
    'mem_stats': SyscallId.MEM_STATS,
    'mem_write': SyscallId.MEM_WRITE,
    'mem_read': SyscallId.MEM_READ,
    'mem_label': SyscallId.MEM_LABEL,
    'mem_snap': SyscallId.MEM_SNAP,
    'mem_resume': SyscallId.MEM_RESUME,
    'mem_audit': SyscallId.MEM_AUDIT,
    'win_create': SyscallId.WIN_CREATE,
    'win_close': SyscallId.WIN_CLOSE,
    'gdi_clear': SyscallId.GDI_CLEAR,
    'gdi_rect': SyscallId.GDI_RECT,
    'gdi_stroke_rect': SyscallId.GDI_STROKE_RECT,
    'gdi_text': SyscallId.GDI_TEXT,
    'gdi_line': SyscallId.GDI_LINE,
    'gdi_circle': SyscallId.GDI_CIRCLE,
    'gdi_flush': SyscallId.GDI_FLUSH,
    'poll_event': SyscallId.POLL_EVENT,
    'str_index': SyscallId.STR_INDEX,
    'str_slice': SyscallId.STR_SLICE,
    'str_len': SyscallId.STR_LEN,
    'str_trim': SyscallId.STR_TRIM,
    'str_split': SyscallId.STR_SPLIT,
    'str_replace': SyscallId.STR_REPLACE,
    'get_resource': SyscallId.GET_RESOURCE,
    'stdin': SyscallId.STDIN,
    'reg_get': SyscallId.REG_GET,
    'reset_system': SyscallId.RESET_SYSTEM,
    'set_boot_phase': SyscallId.SET_BOOT_PHASE,
    'is_authenticated': SyscallId.IS_AUTHENTICATED,
  };

  /**
   * Compila código-fonte OSL direto em BytecodeModule
   */
  static compileSource(source: string): BytecodeModule {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new BytecodeCompiler();
    return compiler.compile(ast);
  }

  compile(program: Program): BytecodeModule {
    this.constants = [];
    this.variableMap.clear();
    this.instructions = [];

    for (const stmt of program.body) {
      this.compileStatement(stmt);
    }

    this.emit(Opcode.HALT);

    return {
      magic: 'OBX\x02',
      version: 2,
      constantPool: this.constants,
      variableNames: Array.from(this.variableMap.keys()),
      instructions: this.instructions,
    };
  }

  private addConstant(value: any): number {
    const idx = this.constants.indexOf(value);
    if (idx !== -1) return idx;
    this.constants.push(value);
    return this.constants.length - 1;
  }

  private getVariableIndex(name: string): number {
    if (!this.variableMap.has(name)) {
      this.variableMap.set(name, this.variableMap.size);
    }
    return this.variableMap.get(name)!;
  }

  private emit(...bytes: number[]) {
    this.instructions.push(...bytes);
  }

  private compileStatement(stmt: Statement) {
    switch (stmt.type) {
      case 'ExpressionStatement':
        this.compileExpression(stmt.expression, 0);
        break;

      case 'VariableDeclaration': {
        const varIdx = this.getVariableIndex(stmt.id.name);
        if (stmt.init) {
          this.compileExpression(stmt.init, 0);
        } else {
          const constNull = this.addConstant(null);
          this.emit(Opcode.LOAD_CONST, 0, constNull);
        }
        this.emit(Opcode.STORE_VAR, varIdx, 0);
        break;
      }

      case 'BlockStatement':
        for (const s of stmt.body) {
          this.compileStatement(s);
        }
        break;

      case 'IfStatement': {
        // Avalia condição para R0
        this.compileExpression(stmt.test, 0);

        // JZ R0, target_else
        const jzPos = this.instructions.length;
        this.emit(Opcode.JZ, 0, 0); // Placeholder do endereço

        // Consequent
        this.compileStatement(stmt.consequent);

        if (stmt.alternate) {
          const jmpPos = this.instructions.length;
          this.emit(Opcode.JMP, 0); // Pula o else

          // Patch do JZ para o início do alternate
          this.instructions[jzPos + 2] = this.instructions.length;

          this.compileStatement(stmt.alternate);

          // Patch do JMP para após o alternate
          this.instructions[jmpPos + 1] = this.instructions.length;
        } else {
          // Patch do JZ para após o consequent
          this.instructions[jzPos + 2] = this.instructions.length;
        }
        break;
      }

      case 'WhileStatement': {
        const loopStart = this.instructions.length;

        // Avalia teste para R0
        this.compileExpression(stmt.test, 0);

        const jzPos = this.instructions.length;
        this.emit(Opcode.JZ, 0, 0); // Placeholder

        // Corpo
        this.compileStatement(stmt.body);

        // Volta para teste
        this.emit(Opcode.JMP, loopStart);

        // Patch do JZ de saída
        this.instructions[jzPos + 2] = this.instructions.length;
        break;
      }

      case 'ReturnStatement': {
        if (stmt.argument) {
          this.compileExpression(stmt.argument, 0);
        } else {
          const constNull = this.addConstant(null);
          this.emit(Opcode.LOAD_CONST, 0, constNull);
        }
        this.emit(Opcode.RET, 0);
        break;
      }

      case 'FunctionDeclaration':
        // Funções de usuário avançadas (reservado para próxima expansão)
        break;
    }
  }

  private compileExpression(expr: Expression, targetReg: number) {
    switch (expr.type) {
      case 'NumericLiteral':
      case 'StringLiteral':
      case 'BooleanLiteral': {
        const cIdx = this.addConstant(expr.value);
        this.emit(Opcode.LOAD_CONST, targetReg, cIdx);
        break;
      }

      case 'NullLiteral': {
        const cIdx = this.addConstant(null);
        this.emit(Opcode.LOAD_CONST, targetReg, cIdx);
        break;
      }

      case 'Identifier': {
        const varIdx = this.getVariableIndex(expr.name);
        this.emit(Opcode.LOAD_VAR, targetReg, varIdx);
        break;
      }

      case 'UnaryExpression': {
        this.compileExpression(expr.argument, targetReg);
        if (expr.operator === '!') {
          this.emit(Opcode.LOGICAL_NOT, targetReg, targetReg);
        } else if (expr.operator === '-') {
          // 0 - targetReg
          const zeroIdx = this.addConstant(0);
          this.emit(Opcode.LOAD_CONST, 7, zeroIdx); // R7 temporário
          this.emit(Opcode.SUB, targetReg, 7, targetReg);
        }
        break;
      }

      case 'BinaryExpression': {
        if (expr.operator === '=') {
          if (expr.left.type === 'Identifier') {
            const varIdx = this.getVariableIndex(expr.left.name);
            this.compileExpression(expr.right, targetReg);
            this.emit(Opcode.STORE_VAR, varIdx, targetReg);
            return;
          }
          throw new Error("Compilador: Atribuição inválida");
        }

        // Avalia left para targetReg (ex: R0)
        this.compileExpression(expr.left, targetReg);
        this.emit(Opcode.PUSH, targetReg);

        // Avalia right para registrador auxiliar R1
        this.compileExpression(expr.right, 1);
        this.emit(Opcode.POP, targetReg);

        switch (expr.operator) {
          case '+': this.emit(Opcode.ADD, targetReg, targetReg, 1); break;
          case '-': this.emit(Opcode.SUB, targetReg, targetReg, 1); break;
          case '*': this.emit(Opcode.MUL, targetReg, targetReg, 1); break;
          case '/': this.emit(Opcode.DIV, targetReg, targetReg, 1); break;
          case '%': this.emit(Opcode.MOD, targetReg, targetReg, 1); break;
          case '==': this.emit(Opcode.CMP_EQ, targetReg, targetReg, 1); break;
          case '!=': this.emit(Opcode.CMP_NE, targetReg, targetReg, 1); break;
          case '<':  this.emit(Opcode.CMP_LT, targetReg, targetReg, 1); break;
          case '<=': this.emit(Opcode.CMP_LE, targetReg, targetReg, 1); break;
          case '>':  this.emit(Opcode.CMP_GT, targetReg, targetReg, 1); break;
          case '>=': this.emit(Opcode.CMP_GE, targetReg, targetReg, 1); break;
        }
        break;
      }

      case 'CallExpression': {
        // Empilha os argumentos
        for (const arg of expr.arguments) {
          this.compileExpression(arg, 0);
          this.emit(Opcode.PUSH, 0);
        }

        // Se for chamada de print, wait, rand globais:
        if (expr.callee.type === 'Identifier') {
          const fnName = expr.callee.name;
          if (fnName === 'print') {
            this.emit(Opcode.SYSCALL, SyscallId.PRINT, expr.arguments.length, targetReg);
            return;
          }
          if (fnName === 'wait') {
            this.emit(Opcode.SYSCALL, SyscallId.WAIT, expr.arguments.length, targetReg);
            return;
          }
          if (fnName === 'rand') {
            this.emit(Opcode.SYSCALL, SyscallId.RAND, expr.arguments.length, targetReg);
            return;
          }
        }
        break;
      }

      case 'SystemCallExpression': {
        // Empilha os argumentos
        for (const arg of expr.arguments) {
          this.compileExpression(arg, 0);
          this.emit(Opcode.PUSH, 0);
        }

        const sysId = this.syscallMap[expr.method];
        if (sysId === undefined) {
          throw new Error(`Compilador: Syscall desconhecida system::${expr.method}`);
        }

        this.emit(Opcode.SYSCALL, sysId, expr.arguments.length, targetReg);
        break;
      }
    }
  }
}
