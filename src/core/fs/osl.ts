// ============================================================
// ObsidianOS — OSL Scripts (VFS real files)
// Fase 2: utilitários System32 como arquivos .osl no disco virtual
// ============================================================
// Formato: [path, name, parent, content]
// Estes arquivos são gravados como makeFile(ext='osl') e podem
// ser lidos, editados e executados como qualquer arquivo do VFS.
// ============================================================

export const oslScripts: [string, string, string, string][] = [

  // ── Shell principal ──────────────────────────────────────────────────────
  [
    'C:\\ObsidianOS\\System32\\cmd.osl',
    'cmd.osl',
    'C:\\ObsidianOS\\System32',
    `system::log("ObsidianOS Shell [Version 1.1.0]");
system::log("(c) Obsidian Corporation. All rights reserved.");
system::log("Digite 'help' para lista de comandos.");

while (true) {
  let cwd = system::fs_getcwd();
  system::log("");
  system::log(cwd + "> ");

  let input = system::stdin();

  if (input == "") {
  } else if (input == "help") {
    system::log("Comandos disponiveis:");
    system::log("  ls [dir]          - Listar arquivos");
    system::log("  cd <dir>          - Mudar diretorio");
    system::log("  echo <texto>      - Exibir texto");
    system::log("  cat <arquivo>     - Exibir conteudo de arquivo");
    system::log("  touch <arquivo>   - Criar arquivo vazio");
    system::log("  rm <caminho>      - Remover arquivo/pasta");
    system::log("  mkdir <nome>      - Criar diretorio");
    system::log("  ping <host>       - Testar conectividade");
    system::log("  sysinfo           - Informacoes do sistema");
    system::log("  tasklist          - Listar processos ativos");
    system::log("  taskkill <pid>    - Encerrar processo");
    system::log("  paint             - Aplicativo grafico Obsidian Paint (OSL GDI)");
    system::log("  oslc <arq.osl>    - Compilar script OSL para bytecode OVM (.obx)");
    system::log("  memdump [pid]     - Inspecionar memoria PM");
    system::log("  mem               - Memoria PM do shell");
    system::log("  pmsnap            - Salvar memoria em .pmem");
    system::log("  pmresume          - Restaurar memoria do .pmem");
    system::log("  pmaudit           - Razao vs lastro da RAM");
    system::log("  user -reset --sys - Formatar e reinstalar o sistema");
    system::log("  exit              - Sair do shell");
  } else if (input == "mem") {
    system::log(system::mem_stats());
  } else if (input == "pmsnap") {
    system::log(system::mem_snap());
  } else if (input == "pmresume") {
    system::log(system::mem_resume());
  } else if (input == "pmaudit") {
    system::log(system::mem_audit());
  } else if (input == "user -reset --sys") {
    system::log("");
    system::log(">>> ATENCAO: Formatacao do sistema ObsidianOS iniciada <<<");
    system::log("Limpando disco virtual OPFS, registro e redefinindo arquivos de fabrica...");
    system::reset_system();
  } else if (input == "exit") {
    system::exit(0);
  } else {
    let spaceIdx = system::str_index(input, " ");
    let cmd = input;
    let argStr = "";
    if (spaceIdx != -1) {
      cmd = system::str_slice(input, 0, spaceIdx);
      argStr = system::str_trim(system::str_slice(input, spaceIdx + 1, system::str_len(input)));
    }

    let obxPath = "C:\\ObsidianOS\\System32\\" + cmd + ".obx";
    let oslPath = "C:\\ObsidianOS\\System32\\" + cmd + ".osl";

    if (system::fs_exists(obxPath)) {
      system::spawn(obxPath, argStr);
    } else if (system::fs_exists(oslPath)) {
      system::spawn(oslPath, argStr);
    } else {
      system::log("'" + cmd + "' nao e reconhecido como comando interno ou externo.");
      system::log("Digite 'help' para a lista de comandos.");
    }
  }
}`
  ],

  // ── Rede & Diagnóstico ────────────────────────────────────────────────────
  [
    'C:\\ObsidianOS\\System32\\ping.osl',
    'ping.osl',
    'C:\\ObsidianOS\\System32',
    `let host = system::args_get(0);
if (host == "") {
  host = "127.0.0.1";
}
system::log("Pinging " + host + " com 32 bytes de dados:");
let i = 0;
while (i < 4) {
  wait(1000);
  let ms = rand(50);
  system::log("Resposta de " + host + ": bytes=32 tempo=" + ms + "ms TTL=128");
  i = i + 1;
}
system::log("");
system::log("Estatisticas de Ping para " + host + ":");
system::log("    Pacotes: Enviados = 4, Recebidos = 4, Perdidos = 0 (0% de perda)");
system::exit(0);`
  ],
  [
    'C:\\ObsidianOS\\System32\\sysinfo.osl',
    'sysinfo.osl',
    'C:\\ObsidianOS\\System32',
    `let ram = system::get_resource("ram");
let cpu = system::get_resource("cpu");
let mem = system::mem_stats();
system::log("=== ObsidianOS System Information ===");
system::log("");
system::log("OS Name:        ObsidianOS 1.0.0 (Kernel r1)");
system::log("OS Version:     1.0 Build 9600");
system::log("System Type:    x64-based Virtual Machine");
system::log("Shell:          ObsidianOS Shell 1.1.0 (cmd.osl)");
system::log("");
system::log("RAM em uso:     " + ram + " MB");
system::log("CPU em uso:     " + cpu + "%");
system::log("");
system::log("PM Address Space: " + mem);
system::log("");
system::exit(0);`
  ],

  // ── Manipulação de Arquivos ───────────────────────────────────────────────
  [
    'C:\\ObsidianOS\\System32\\ls.osl',
    'ls.osl',
    'C:\\ObsidianOS\\System32',
    `let dir = system::args_get(0);
if (dir == "") {
  dir = system::fs_getcwd();
}
system::log("Diretorio de " + dir + ":");
system::log("");
let files = system::fs_list(dir);
system::log(files);
system::log("");
system::exit(0);`
  ],
  [
    'C:\\ObsidianOS\\System32\\echo.osl',
    'echo.osl',
    'C:\\ObsidianOS\\System32',
    `let text = system::args_get(0);
system::log(text);
system::exit(0);`
  ],
  [
    'C:\\ObsidianOS\\System32\\cat.osl',
    'cat.osl',
    'C:\\ObsidianOS\\System32',
    `let path = system::args_get(0);
if (path == "") {
  system::log("Uso: cat <caminho>");
  system::exit(1);
}
if (!system::fs_exists(path)) {
  system::log("cat: " + path + ": Arquivo nao encontrado");
  system::exit(1);
}
let content = system::fs_read(path);
system::log(content);
system::exit(0);`
  ],
  [
    'C:\\ObsidianOS\\System32\\touch.osl',
    'touch.osl',
    'C:\\ObsidianOS\\System32',
    `let path = system::args_get(0);
if (path == "") {
  system::log("Uso: touch <caminho>");
  system::exit(1);
}
system::fs_write(path, "");
system::log("Arquivo criado: " + path);
system::exit(0);`
  ],
  [
    'C:\\ObsidianOS\\System32\\rm.osl',
    'rm.osl',
    'C:\\ObsidianOS\\System32',
    `let path = system::args_get(0);
if (path == "") {
  system::log("Uso: rm <caminho>");
  system::exit(1);
}
if (!system::fs_exists(path)) {
  system::log("rm: " + path + ": Nao encontrado");
  system::exit(1);
}
system::fs_delete(path);
system::log("Removido: " + path);
system::exit(0);`
  ],
  [
    'C:\\ObsidianOS\\System32\\mkdir.osl',
    'mkdir.osl',
    'C:\\ObsidianOS\\System32',
    `let name = system::args_get(0);
if (name == "") {
  system::log("Uso: mkdir <nome>");
  system::exit(1);
}
let cwd = system::fs_getcwd();
let fullPath = cwd + "\\" + name;
system::fs_mkdir(fullPath);
system::log("Diretorio criado: " + fullPath);
system::exit(0);`
  ],

  // ── Processos & Memória ───────────────────────────────────────────────────
  [
    'C:\\ObsidianOS\\System32\\tasklist.osl',
    'tasklist.osl',
    'C:\\ObsidianOS\\System32',
    `system::log("Lista de processos ativos:");
system::log("");
let list = system::proc_list();
system::log(list);
system::log("");
system::exit(0);`
  ],
  [
    'C:\\ObsidianOS\\System32\\taskkill.osl',
    'taskkill.osl',
    'C:\\ObsidianOS\\System32',
    `let pid = system::args_get(0);
if (pid == "") {
  system::log("Uso: taskkill <pid>");
  system::exit(1);
}
let ok = system::proc_kill(pid);
if (ok) {
  system::log("Processo " + pid + " encerrado.");
} else {
  system::log("taskkill: PID invalido ou nao encontrado: " + pid);
}
system::exit(0);`
  ],
  [
    'C:\\ObsidianOS\\System32\\memdump.osl',
    'memdump.osl',
    'C:\\ObsidianOS\\System32',
    `system::log("=== ObsidianOS Memory Dump ===");
system::log("");

let stats = system::mem_stats();
system::log("PM Address Space (processo atual):");
system::log("  " + stats);
system::log("");

let audit = system::mem_audit();
system::log("PM Audit (ledger vs lastro):");
system::log("  " + audit);
system::log("");

let ram = system::get_resource("ram");
let cpu = system::get_resource("cpu");
system::log("Recursos do sistema:");
system::log("  RAM em uso : " + ram + " MB");
system::log("  CPU em uso : " + cpu + "%");
system::log("");
system::log("Use 'pmsnap' para persistir memoria em disco.");
system::log("Use 'pmaudit' para verificar integridade.");
system::exit(0);`
  ],

  // ── Scripts de usuário ────────────────────────────────────────────────────
  [
    'C:\\Users\\user\\Documents\\welcome.osl',
    'welcome.osl',
    'C:\\Users\\user\\Documents',
    `// Welcome to Obsidian Script Language (OSL)
// Este arquivo e um script OSL real gravado no VFS do ObsidianOS.
// Execute-o no terminal com: cat C:\\Users\\user\\Documents\\welcome.osl

let name = "Developer";
system::log("Iniciando script de boas-vindas...");

fn say_hello(user) {
    system::log("Ola, " + user + "! Bem-vindo ao ObsidianOS nativo.");
}

say_hello(name);

let ram = system::get_resource("ram");
system::log("RAM atual em uso: " + ram + "MB");

if (ram > 500) {
    system::log("O sistema esta rodando processos pesados.");
} else {
    system::log("O sistema esta saudavel.");
}
system::exit(0);`
  ],
  [
    'C:\\ObsidianOS\\System32\\paint.osl',
    'paint.osl',
    'C:\\ObsidianOS\\System32',
    `// ============================================
// Obsidian Paint — Aplicativo Grafico Nativo OSL
// 100% Escrito em Obsidian Script Language (Fase 3)
// ============================================

system::log("Iniciando Obsidian Paint nativo...");
let win = system::win_create("Obsidian Paint [OSL Native GDI]", 640, 480);
wait(350);

fn draw_toolbar() {
  // Barra de Ferramentas Superior
  system::gdi_rect(0, 0, 640, 48, "#181825");
  system::gdi_text(16, 30, "Obsidian Paint", "bold 15px Segoe UI, sans-serif", "#cdd6f4");
  system::gdi_text(130, 29, "v1.0 (OSL Pure)", "11px Segoe UI, sans-serif", "#6c7086");

  // Paleta de Cores
  // Preto
  system::gdi_rect(270, 12, 22, 22, "#000000");
  system::gdi_stroke_rect(270, 12, 22, 22, "#cdd6f4", 2);

  // Vermelho
  system::gdi_rect(300, 12, 22, 22, "#f38ba8");
  system::gdi_stroke_rect(300, 12, 22, 22, "#45475a", 1);

  // Verde
  system::gdi_rect(330, 12, 22, 22, "#a6e3a1");
  system::gdi_stroke_rect(330, 12, 22, 22, "#45475a", 1);

  // Azul
  system::gdi_rect(360, 12, 22, 22, "#89b4fa");
  system::gdi_stroke_rect(360, 12, 22, 22, "#45475a", 1);

  // Amarelo
  system::gdi_rect(390, 12, 22, 22, "#f9e2af");
  system::gdi_stroke_rect(390, 12, 22, 22, "#45475a", 1);

  // Roxo
  system::gdi_rect(420, 12, 22, 22, "#cba6f7");
  system::gdi_stroke_rect(420, 12, 22, 22, "#45475a", 1);

  // Borracha (Branco)
  system::gdi_rect(450, 12, 22, 22, "#ffffff");
  system::gdi_stroke_rect(450, 12, 22, 22, "#bac2de", 1);

  // Botao Limpar
  system::gdi_rect(490, 11, 75, 26, "#313244");
  system::gdi_stroke_rect(490, 11, 75, 26, "#585b70", 1);
  system::gdi_text(505, 28, "Limpar", "bold 12px Segoe UI, sans-serif", "#cdd6f4");

  // Linha divisoria da barra de ferramentas
  system::gdi_line(0, 48, 640, 48, "#313244", 2);
  system::gdi_flush();
}

// Inicializa o fundo da area de desenho e a barra
system::gdi_rect(0, 48, 640, 432, "#ffffff");
system::gdi_flush();
draw_toolbar();

let currentColor = "#000000";
let isDrawing = 0;
let initialPaints = 0;

// Loop de eventos grafico (~50 FPS)
while (true) {
  // Redesenha a barra nos primeiros 3 ciclos para garantir fixacao no canvas apos animacao
  if (initialPaints < 3) {
    draw_toolbar();
    initialPaints = initialPaints + 1;
  }

  let ev = system::poll_event();
  if (ev != "") {
    // Parse do evento: tipo,x,y,button
    let firstComma = system::str_index(ev, ",");
    if (firstComma != -1) {
      let type = system::str_slice(ev, 0, firstComma);
      let rest = system::str_slice(ev, firstComma + 1, system::str_len(ev));
      let secondComma = system::str_index(rest, ",");
      if (secondComma != -1) {
        let xStr = system::str_slice(rest, 0, secondComma);
        let rest2 = system::str_slice(rest, secondComma + 1, system::str_len(rest));
        let thirdComma = system::str_index(rest2, ",");
        let yStr = rest2;
        if (thirdComma != -1) {
          yStr = system::str_slice(rest2, 0, thirdComma);
        }
        let x = xStr * 1;
        let y = yStr * 1;

        if (type == "mousedown") {
          isDrawing = 1;
        }
        if (type == "mouseup") {
          isDrawing = 0;
        }

        // Se clicou na barra de cores (y entre 5 e 48)
        if (type == "mousedown" || type == "click") {
          if (y >= 5 && y <= 48) {
            if (x >= 270 && x <= 295) { currentColor = "#000000"; }
            if (x >= 300 && x <= 325) { currentColor = "#f38ba8"; }
            if (x >= 330 && x <= 355) { currentColor = "#a6e3a1"; }
            if (x >= 360 && x <= 385) { currentColor = "#89b4fa"; }
            if (x >= 390 && x <= 415) { currentColor = "#f9e2af"; }
            if (x >= 420 && x <= 445) { currentColor = "#cba6f7"; }
            if (x >= 450 && x <= 475) { currentColor = "#ffffff"; }
            // Botao limpar
            if (x >= 490 && x <= 570) {
              system::gdi_rect(0, 49, 640, 431, "#ffffff");
              system::gdi_flush();
              draw_toolbar();
            }
          }
        }

        // Se desenhando na area livre do canvas (y > 50)
        if (y > 50) {
          if (isDrawing == 1 || type == "click") {
            let radius = 4;
            if (currentColor == "#ffffff") {
              radius = 16;
            }
            system::gdi_circle(x, y, radius, currentColor, true);
            system::gdi_flush();
          }
        }
      }
    }
  }

  wait(20);
}
`
  ],
  [
    'C:\\ObsidianOS\\System32\\oslc.osl',
    'oslc.osl',
    'C:\\ObsidianOS\\System32',
    `// ============================================
// Obsidian Script Compiler (oslc)
// Fase 4: Compilador de OSL para Bytecode OVM (.obx)
// ============================================

let inputPath = system::args_get(0);
if (inputPath == "") {
  system::log("Obsidian Script Compiler (oslc) v1.0");
  system::log("Uso: oslc <arquivo.osl> [arquivo_saida.obx]");
  system::log("");
  system::log("Exemplo:");
  system::log("  oslc C:\\\\ObsidianOS\\\\System32\\\\ping.osl");
  system::exit(1);
}

if (!system::fs_exists(inputPath)) {
  system::log("oslc: Erro: Arquivo de entrada nao encontrado: " + inputPath);
  system::exit(1);
}

// Determina nome de saida
let outputPath = system::args_get(1);
if (outputPath == "") {
  let oslIdx = system::str_index(inputPath, ".osl");
  if (oslIdx != -1) {
    outputPath = system::str_slice(inputPath, 0, oslIdx) + ".obx";
  } else {
    outputPath = inputPath + ".obx";
  }
}

system::log("Obsidian Script Compiler (oslc) [Target: OVM Bytecode v2]");
system::log("Compilando: " + inputPath);

let source = system::fs_read(inputPath);
let srcLen = system::str_len(source);

let compiled = system::compile(source);
let binLen = system::str_len(compiled);

system::fs_write(outputPath, compiled);

system::log("Gerado    : " + outputPath);
system::log("Tamanho   : " + srcLen + " bytes (fonte) -> " + binLen + " bytes (binario OBX)");
system::log("Status    : Compilacao concluida com sucesso!");
system::exit(0);
`
  ],

  // ── Ring-0 Core Subsystems (Fase 4: Migração para OSL Puro) ───────────────
  [
    'C:\\ObsidianOS\\System32\\smss.osl',
    'smss.osl',
    'C:\\ObsidianOS\\System32',
    `system::log("[smss] Session Manager Subsystem starting...");
system::register_critical("SUBSYSTEM_INIT_FAILURE", "Session Manager Subsystem failed. All subsystems collapsing.", "smss.osl", "0x0000006E");
system::boot_log("smss: Registering as critical process... OK");
system::boot_log("smss: Spawning csrss.osl (Client Server Runtime)...");
system::spawn("C:\\\\ObsidianOS\\\\System32\\\\csrss.osl", "");
wait(100);
system::boot_log("smss: Spawning wininit.osl (Start-Up Application)...");
system::spawn("C:\\\\ObsidianOS\\\\System32\\\\wininit.osl", "");
wait(100);
system::boot_log("smss: Spawning lsass.obx (Security Authority)...");
system::spawn("C:\\\\ObsidianOS\\\\System32\\\\lsass.obx", "");
wait(100);
system::boot_log("smss: All subsystems spawned. Session manager ready.");
system::log("[smss] All subsystems spawned. Ready.");
while (true) { wait(5000); }
`
  ],
  [
    'C:\\ObsidianOS\\System32\\csrss.osl',
    'csrss.osl',
    'C:\\ObsidianOS\\System32',
    `system::log("[csrss] Client Server Runtime Process starting...");
system::register_critical("WIN32K_SUBSYSTEM_FATAL", "Client Server Runtime Process terminated. Win32 subsystem non-functional.", "csrss.osl", "0x0000007E");
system::declare_dependency("smss.osl");
system::boot_log("csrss: Registered as critical, depends on smss.");
system::log("[csrss] Win32 subsystem ready.");
while (true) { wait(5000); }
`
  ],
  [
    'C:\\ObsidianOS\\System32\\wininit.osl',
    'wininit.osl',
    'C:\\ObsidianOS\\System32',
    `system::log("[wininit] Start-Up Application starting...");
system::register_critical("STARTUP_INIT_FAILED", "Windows Start-Up Application failed during initialization.", "wininit.osl", "0x0000005F");
system::declare_dependency("smss.osl");
system::boot_log("wininit: Registered as critical, depends on smss.");
system::boot_log("wininit: Spawning services.osl (Service Control Manager)...");
system::spawn("C:\\\\ObsidianOS\\\\System32\\\\services.osl", "");
wait(100);
system::boot_log("wininit: services.osl started.");
while (true) { wait(5000); }
`
  ],
  [
    'C:\\ObsidianOS\\System32\\services.osl',
    'services.osl',
    'C:\\ObsidianOS\\System32',
    `system::log("[services] Service Control Manager starting...");
system::register_critical("SERVICE_CONTROLLER_FAILED", "Services and Controller App terminated. No services can run.", "services.osl", "0x000000BE");
system::declare_dependency("wininit.osl");
system::boot_log("services: Registered as critical, depends on wininit.");
system::boot_log("services: Spawning svchost.osl (Service Host)...");
system::spawn("C:\\\\ObsidianOS\\\\System32\\\\svchost.osl", "");
wait(100);
system::boot_log("services: svchost.osl started. Service Control Manager ready.");
while (true) { wait(5000); }
`
  ],
  [
    'C:\\ObsidianOS\\System32\\svchost.osl',
    'svchost.osl',
    'C:\\ObsidianOS\\System32',
    `system::log("[svchost] Service Host: Local System starting...");
system::register_critical("SERVICE_HOST_DIED", "Service Host process terminated unexpectedly.", "svchost.osl", "0x000000D1");
system::declare_dependency("services.osl");
system::boot_log("svchost: Registered as critical, depends on services.");
system::boot_log("svchost: Hosting system services...");
while (true) { wait(5000); }
`
  ],
  [
    'C:\\ObsidianOS\\System32\\dwm.osl',
    'dwm.osl',
    'C:\\ObsidianOS\\System32',
    `system::log("[dwm] Desktop Window Manager starting...");
system::register_critical("GRAPHICS_SUBSYSTEM_FAILED", "Desktop Window Manager crashed. Display composition unavailable.", "dwm.osl", "0x000000EA");
system::declare_dependency("csrss.osl");
system::boot_log("dwm: Registered as critical, depends on csrss.");
system::boot_log("dwm: Desktop composition ready.");
while (true) { wait(5000); }
`
  ],
  [
    'C:\\ObsidianOS\\System32\\explorer.osl',
    'explorer.osl',
    'C:\\ObsidianOS\\System32',
    `system::log("[explorer] ObsidianOS Explorer starting...");
system::register_critical("SHELL_FAILED", "Windows Shell (explorer) terminated. User interface is gone.", "explorer.osl", "0x000000F4");
system::declare_dependency("dwm.osl");
system::boot_log("explorer: Registered as critical, depends on dwm.");
system::boot_log("explorer: Desktop shell ready.");
while (true) { wait(5000); }
`
  ],
  [
    'C:\\ObsidianOS\\System32\\obslogon.osl',
    'obslogon.osl',
    'C:\\ObsidianOS\\System32',
    `system::log("[obslogon] Iniciando subsistema de seguranca...");
system::register_critical("LOGON_PROCESS_TERMINATED", "Obsidian Logon Application terminated.", "obslogon.osl", "0x000000C2");
system::boot_log("obslogon: Registering as critical process... OK");

let setupRun = system::reg_get("HKEY_LOCAL_MACHINE\\\\SYSTEM\\\\Setup\\\\SetupInProgress");

if (setupRun == 1) {
  system::log("[obslogon] OOBE detectado. Iniciando Setup Wizard...");
  system::set_boot_phase("OOBE");
} else {
  system::log("[obslogon] Sistema configurado. Aguardando autenticacao...");
  system::set_boot_phase("WINLOGON");
}

while (true) {
  let auth = system::is_authenticated();
  if (auth == 1) {
    system::log("[obslogon] Usuario autenticado. Carregando Shell...");
    system::set_boot_phase("DESKTOP_READY");
    break;
  }
  wait(800);
}
`
  ],
];


