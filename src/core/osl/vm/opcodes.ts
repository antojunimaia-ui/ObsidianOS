// ============================================================
// ObsidianOS Bytecode Virtual Machine (OVM) - Opcode Definitions
// Fase 4: Conjunto de Instruções Virtuais (ISA)
// ============================================================

export enum Opcode {
  // Controle de Execução
  HALT          = 0x00, // Encerra execução
  NOP           = 0x01, // Nenhuma operação

  // Constantes e Registradores
  LOAD_CONST    = 0x10, // LOAD_CONST reg, const_idx (Carrega constante para registrador)
  LOAD_VAR      = 0x11, // LOAD_VAR reg, var_idx    (Lê variável de ambiente)
  STORE_VAR     = 0x12, // STORE_VAR var_idx, reg   (Grava no ambiente)
  MOV           = 0x13, // MOV dst_reg, src_reg     (Copia registrador)

  // Pilha
  PUSH          = 0x20, // PUSH reg                 (Empilha valor)
  POP           = 0x21, // POP reg                  (Desempilha valor)

  // Aritmética e Operações Binárias (R_dst = R_src1 op R_src2)
  ADD           = 0x30, // ADD dst, src1, src2
  SUB           = 0x31, // SUB dst, src1, src2
  MUL           = 0x32, // MUL dst, src1, src2
  DIV           = 0x33, // DIV dst, src1, src2
  MOD           = 0x34, // MOD dst, src1, src2

  // Comparações e Lógica
  CMP_EQ        = 0x40, // CMP_EQ dst, src1, src2   (dst = src1 == src2 ? 1 : 0)
  CMP_NE        = 0x41, // CMP_NE dst, src1, src2   (dst = src1 != src2 ? 1 : 0)
  CMP_LT        = 0x42, // CMP_LT dst, src1, src2   (dst = src1 < src2 ? 1 : 0)
  CMP_LE        = 0x43, // CMP_LE dst, src1, src2   (dst = src1 <= src2 ? 1 : 0)
  CMP_GT        = 0x44, // CMP_GT dst, src1, src2   (dst = src1 > src2 ? 1 : 0)
  CMP_GE        = 0x45, // CMP_GE dst, src1, src2   (dst = src1 >= src2 ? 1 : 0)
  LOGICAL_NOT   = 0x46, // LOGICAL_NOT dst, src     (dst = !src ? 1 : 0)

  // Desvios e Saltos
  JMP           = 0x50, // JMP target_address
  JZ            = 0x51, // JZ test_reg, target_address (Salta se zero / false)
  JNZ           = 0x52, // JNZ test_reg, target_address (Salta se não-zero / true)

  // Funções
  CALL          = 0x60, // CALL func_idx, arg_count, dst_reg
  RET           = 0x61, // RET reg                  (Retorna com valor do reg)

  // Chamadas de Sistema (Syscalls Nativas)
  SYSCALL       = 0x70, // SYSCALL syscall_id, arg_count, dst_reg
}

// Mapeamento numérico de chamadas de sistema para a VM
export enum SyscallId {
  LOG           = 0x01, // log(...)
  PRINT         = 0x02, // print(...)
  WAIT          = 0x03, // wait(ms)
  RAND          = 0x04, // rand(max)
  EXIT          = 0x05, // exit(code)
  ARGS          = 0x06, // args()
  ARGS_GET      = 0x07, // args_get(index)
  ARGS_LEN      = 0x08, // args_len()

  // Sistema de Arquivos
  FS_EXISTS     = 0x10, // fs_exists(path)
  FS_READ       = 0x11, // fs_read(path)
  FS_WRITE      = 0x12, // fs_write(path, content)
  FS_DELETE     = 0x13, // fs_delete(path)
  FS_LIST       = 0x14, // fs_list(path)
  FS_GETCWD     = 0x15, // fs_getcwd()
  FS_CHDIR      = 0x16, // fs_chdir(path)
  FS_MKDIR      = 0x17, // fs_mkdir(path)

  // Processos & Ring-0
  PROC_LIST     = 0x20, // proc_list()
  PROC_KILL     = 0x21, // proc_kill(pid)
  SPAWN         = 0x22, // spawn(binPath, argStr)
  REGISTER_CRITICAL = 0x23, // register_critical(stopCode, desc, comp, bugCheck)
  DECLARE_DEPENDENCY = 0x24, // declare_dependency(parentComp)
  BOOT_LOG      = 0x25, // boot_log(msg)

  // Memória Persistente (PM)
  MEM_STATS     = 0x30, // mem_stats()
  MEM_WRITE     = 0x31, // mem_write(...)
  MEM_READ      = 0x32, // mem_read(...)
  MEM_LABEL     = 0x33, // mem_label(...)
  MEM_SNAP      = 0x34, // mem_snap()
  MEM_RESUME    = 0x35, // mem_resume()
  MEM_AUDIT     = 0x36, // mem_audit()

  // Janelas e Gráficos (GDI)
  WIN_CREATE    = 0x40, // win_create(title, w, h)
  WIN_CLOSE     = 0x41, // win_close()
  GDI_CLEAR     = 0x42, // gdi_clear(hex)
  GDI_RECT      = 0x43, // gdi_rect(x, y, w, h, hex)
  GDI_STROKE_RECT = 0x44,// gdi_stroke_rect(x, y, w, h, hex, width)
  GDI_TEXT      = 0x45, // gdi_text(x, y, text, font, hex)
  GDI_LINE      = 0x46, // gdi_line(x1, y1, x2, y2, hex, width)
  GDI_CIRCLE    = 0x47, // gdi_circle(x, y, r, hex, fill)
  GDI_FLUSH     = 0x48, // gdi_flush()
  POLL_EVENT    = 0x49, // poll_event()

  // Strings
  STR_INDEX     = 0x50, // str_index(str, sep)
  STR_SLICE     = 0x51, // str_slice(str, start, end)
  STR_LEN       = 0x52, // str_len(str)
  STR_TRIM      = 0x53, // str_trim(str)
  STR_SPLIT     = 0x54, // str_split(str, sep)
  STR_REPLACE   = 0x55, // str_replace(str, a, b)

  // Sistema
  GET_RESOURCE  = 0x60, // get_resource(type)
  STDIN         = 0x61, // stdin()
  REG_GET       = 0x62, // reg_get(key)
  RESET_SYSTEM  = 0x63, // reset_system()
  SET_BOOT_PHASE = 0x64,// set_boot_phase(phase)
  IS_AUTHENTICATED = 0x65, // is_authenticated()
}

// Estrutura de um Módulo Binário Compilado (.obx bytecode)
export interface BytecodeModule {
  magic: string;            // 'OBX\x02'
  version: number;          // 2
  constantPool: any[];      // Tabela de constantes (strings, números, literais)
  variableNames: string[];  // Nomes de variáveis globais
  instructions: number[];   // Array compacto de bytes/instruções
}
