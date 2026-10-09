# 🖥️ ObsidianOS

> Um sistema operacional completo rodando inteiramente no navegador, construído com React 19, TypeScript e Vite. Simula com alta fidelidade a arquitetura e a experiência de um OS moderno (inspirado no Windows 11) — incluindo BIOS, kernel preemptivo, escalonador de CPU com sinais POSIX, subsistema de memória persistente (PMEM), janelas Win32/GDI virtuais, disco virtual OPFS, registro multinível, terminal com shell OSL interativo, jogos clássicos (DOOM), simulador de falhas em cascata no BSOD e muito mais.

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Stack Tecnológica](#-stack-tecnológica)
3. [Estrutura do Projeto](#-estrutura-do-projeto)
4. [Como Rodar](#-como-rodar)
5. [Arquitetura do Kernel](#-arquitetura-do-kernel)
6. [Subsistema de Memória Persistente (PM / PMEM)](#-subsistema-de-memória-persistente-pm--pmem)
7. [CPU Scheduler, Processos e Sinais](#-cpu-scheduler-processos-e-sinais)
8. [Fluxo de Boot e Inicialização](#-fluxo-de-boot-e-inicialização)
9. [Sistema de Arquivos e Registro](#-sistema-de-arquivos-e-registro)
10. [Motor Gráfico e HwndRenderer](#-motor-gráfico-e-hwndrenderer)
11. [Aplicativos Integrados](#-aplicativos-integrados)
12. [OSL — ObsidianOS Scripting Language](#-osl--obsidianos-scripting-language)
13. [SDK de Aplicativos (.obx)](#-sdk-de-aplicativos-obx)
14. [Mecânicas de Realismo e Falhas em Cascata (BSOD)](#-mecânicas-de-realismo-e-falhas-em-cascata-bsod)
15. [Como Adicionar um Novo Aplicativo](#-como-adicionar-um-novo-aplicativo)

---

## 🎯 Visão Geral

**ObsidianOS** não é apenas uma casca estética: ele simula internamente subsistemas reais de engenharia de sistemas operacionais:

- **BIOS & Boot Manager Reais**: O kernel inicializa tabelas de partição (MBR/GPT), resolve caminhos ARC e executa o carregador `bootmgr.obx` no sandbox JS.
- **Kernel Modularizado**: Dividido em barramento de eventos pub/sub, logger de 6 níveis, monitor de recursos em tempo real, detector de falhas e gerenciador PM.
- **Escalonador Preemptivo de Processos**: Suporte a prioridades (`REALTIME` a `IDLE`), quantums de CPU, estados de processo (`READY`, `RUNNING`, `BLOCKED`, `ZOMBIE`) e despacho de sinais (`SIGTERM`, `SIGKILL`, `SIGSEGV`, etc.).
- **Subsistema PMEM (Persistent Memory)**: Espaços de endereçamento virtualizados por processo com blocos esparsos, proteção de acesso (`R/W/X`), labels, fotos de memória em `.pmem` e mailbox de stdin no Bloco 0.
- **Motor Gráfico Win32/GDI (`HwndRenderer`)**: Binários puros podem desenhar primitivas 2D (GDI Canvas) ou injetar interfaces DOM dinâmicas sem precisar de componentes React fixos.
- **VFS Modular com Drivers OPFS / LocalStorage**: Sistema de arquivos hierárquico com permissões, atributos e carregamento sob demanda.
- **14 Aplicativos Nativos**: Incluindo DOOM clássico (WebAssembly / js-dos), IDE Obsidian Code com syntax highlighting, Gravador de Tela/Câmera, App Store com runtime sandbox e Shell interativo OSL.

---

## 🛠️ Stack Tecnológica

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Framework UI | React | 19.2+ |
| Linguagem | TypeScript | 5.9+ |
| Build Tool | Vite | 8.0+ |
| Estado Global | Zustand | 5.0+ |
| Animações | Framer Motion | 12.38+ |
| Ícones | React Icons | 5.6+ |
| IDs únicos | uuid | 13.0+ |
| Datas | date-fns | 4.1+ |
| Emulação / Jogos | js-dos / DOOM WASM | Shareware 1.9 |
| Linting | ESLint + typescript-eslint | 9+ / 8+ |

---

## 📁 Estrutura do Projeto

```
ObsidianOS/
├── public/
│   ├── doom.html                 # Player standalone js-dos DOOM
│   ├── favicon.svg
│   ├── icons.svg
│   └── Wallpapers/
├── src/
│   ├── main.tsx                  # Ponto de entrada React
│   ├── App.tsx                   # Orquestrador do OS (BSOD, atalhos, eventos globais)
│   ├── index.css                 # CSS global + variáveis de tema (dark/light/mica)
│   ├── types/index.ts            # Interfaces centrais (Processos, FS, Registro, Sinais, etc.)
│   ├── core/
│   │   ├── kernel.ts             # Kernel Singleton principal
│   │   ├── appRegistry.ts        # Registro e descoberta dinâmica de apps
│   │   ├── opfsDriver.ts         # Driver de persistência OPFS com fallback localStorage
│   │   ├── kernel/               # Submódulos desacoplados do Kernel
│   │   │   ├── types.ts          # Tipos e estruturas de dados do kernel
│   │   │   ├── event-bus.ts      # Barramento Pub/Sub de eventos do SO
│   │   │   ├── logger.ts         # Logger do sistema (DEBUG a FATAL)
│   │   │   ├── resources.ts      # Rastreamento de RAM, CPU e Disco
│   │   │   ├── faults.ts         # Cadeias de dependência e falhas em cascata
│   │   │   ├── pmem.ts           # PmMemoryManager (gerenciador de spaces PM)
│   │   │   └── system-state.ts   # Estado de boot, drivers e serviços
│   │   ├── pm/                   # Subsistema de Memória Persistente (SPEC v0.1)
│   │   │   ├── address-space.ts  # Endereçamento por blocos, permissões e paginação esparsa
│   │   │   ├── codec.ts          # Codificadores de tipos e Base64
│   │   │   ├── system-image.ts   # Imagem canônica compilada do SO (Base64)
│   │   │   ├── system.pm         # Código-fonte montador de memória
│   │   │   └── system.pmem       # Snapshot binário de memória persistente
│   │   ├── fs/                   # Filesystem Virtual Modular
│   │   │   ├── apps.ts           # Definições de executáveis de apps (.obx)
│   │   │   ├── binaries.ts       # Binários executáveis JS (bootmgr, ping, sysinfo, etc.)
│   │   │   ├── dirs.ts           # Estrutura de diretórios padrão (System32, Program Files...)
│   │   │   ├── drivers.ts        # Drivers de dispositivo carregados na inicialização
│   │   │   ├── helpers.ts        # Utilitários de manipulação do VFS
│   │   │   ├── osl.ts            # Scripts de automação OSL de fábrica
│   │   │   ├── sdk.ts            # Arquivos do SDK de desenvolvimento
│   │   │   ├── system.ts         # DLLs, bibliotecas e arquivos de configuração
│   │   │   └── user.ts           # Perfil padrão de usuário (Desktop, Documents, Wallpapers)
│   │   └── osl/                  # Engine OSL (ObsidianOS Scripting Language)
│   │       ├── lexer.ts          # Tokenizador léxico
│   │       ├── parser.ts         # Analisador sintático (gerador de AST)
│   │       ├── interpreter.ts    # Interpretador com suporte a syscalls e PM
│   │       ├── environment.ts    # Gerenciador de escopos e tabelas de símbolos
│   │       └── types.ts          # Tipos do AST
│   ├── stores/                   # Zustand Stores (Espelhos Reativos do Kernel)
│   │   ├── fileSystem.ts         # Mirror reativo do VFS
│   │   ├── registry.ts           # Mirror reativo do Registry
│   │   ├── processManager.ts     # Mirror reativo do gerenciador de processos
│   │   ├── windowManager.ts      # Mirror reativo do gerenciador de janelas
│   │   ├── systemStore.ts        # UI State (Fase de boot, tema, volume, rede)
│   │   └── contextMenuStore.ts   # Menu de contexto global
│   ├── components/
│   │   ├── Boot/                 # BootScreen, BSOD (Canvas GDI) e RecoveryMode
│   │   ├── LockScreen/           # Tela de bloqueio e autenticação de usuários
│   │   ├── Desktop/              # Desktop com ícones, grid e wallpaper
│   │   ├── Taskbar/              # Barra de tarefas (posições dinâmicas via registro)
│   │   ├── StartMenu/            # Menu Iniciar com pesquisa instantânea
│   │   ├── Window/               # Janelas arrastáveis, redimensionáveis e HwndRenderer
│   │   ├── ContextMenu/          # Menu de contexto flutuante global
│   │   ├── Notifications/        # Centro de notificações e toasts
│   │   └── Setup/                # Assistente OOBE de primeiro uso
│   └── apps/                     # Aplicativos Integrados
│       ├── Terminal/             # Terminal de comandos e console do SO
│       ├── FileExplorer/         # Gerenciador de arquivos e pastas
│       ├── TaskManager/          # Monitor de processos, CPU e memória
│       ├── Notepad/              # Editor de texto com suporte ao VFS
│       ├── Calculator/           # Calculadora com modos padrão e científico
│       ├── Browser/              # Navegador Web com abas e favoritos
│       ├── Settings/             # Painel de configurações do sistema
│       ├── Regedit/              # Editor gráfico do Registro
│       ├── ObsidianCode/         # IDE completa para OSL e OBX
│       ├── ObsidianStore/        # Loja de aplicativos com catálogo
│       ├── ObsRecord/            # Gravador de tela e webcam
│       ├── MediaPlayer/          # Player de vídeo e mídia
│       ├── Doom/                 # DOOM clássico integrado
│       └── SdkAppRunner/         # Sandbox de execução de apps da loja
```

---

## 🚀 Como Rodar

### Pré-requisitos
- Node.js (v18+)
- npm ou pnpm

### Passos

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse no navegador: `http://localhost:5173`. O processo de inicialização da BIOS e do bootmgr iniciará automaticamente.

```bash
# Para gerar o pacote de produção:
npm run build

# Para testar o pacote gerado localmente:
npm run preview
```

---

## 🧠 Arquitetura do Kernel

O Kernel (`src/core/kernel.ts`) opera como um **Singleton** de autoridade máxima sobre todo o ciclo de vida do sistema operacional:

```
┌────────────────────────────────────────────────────────┐
│                   APLICAÇÕES & UI                      │
│        (Terminal, Explorer, DOOM, WindowManager)        │
├────────────────────────────────────────────────────────┤
│                 REACT / ZUSTAND STORES                 │
│      (fileSystem, processManager, windowManager)       │
│           ▲ (eventos de sincronização pub/sub)         │
├───────────┴────────────────────────────────────────────┤
│                    OBSIDIAN KERNEL                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ CPU Scheduler (Preemptivo, Quantums, Sinais)      │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Persistent Memory Manager (Address Spaces, PMEM) │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Fault Detector (Dependências de Serviços, BSOD)   │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Execution Engine (Sandbox JS para arquivos .obx) │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Virtual File System (Hierarquia, Permissões, OPFS)│  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Registry Manager (Hives do Windows, Tipos REG_*) │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Principais APIs do Kernel

```typescript
// Ciclo de Vida e Boot
kernel.powerOn()                      // Dispara POST da BIOS e bootmgr.obx
kernel.finalizeBoot()                 // Conclui sequência de boot
kernel.loadShell()                    // Carrega explorer.obx e descobre apps

// Processos e Escalonamento
kernel.createProcess(spec)            // Cria PCB, aloca PM space e adiciona à fila READY
kernel.terminateProcess(pid, code)    // Encerra processo, desaloca PM e limpa janelas
kernel.sendSignal(pid, signal)        // Dispara sinal (SIGTERM, SIGKILL, SIGSEGV...)
kernel.scheduleNext()                 // Avança quantum do escalonador

// Memória Persistente (PM)
kernel.pmem.getSpace(pid)             // Retorna o PmAddressSpace associado ao processo
kernel.pmem.snapshotSpace(pid)        // Exporta snapshot binário Base64 do espaço
kernel.pmem.resumeSpace(pid, b64)     // Restaura o espaço a partir de dados salvos

// Manipulação do VFS e Registro
kernel.fsGetNode(path)                // Busca nó do sistema de arquivos
kernel.fsCreateFile(parent, name, c)  // Cria arquivo no disco
kernel.regGetValue(path)              // Obtém valor de chave do Registro
kernel.regSetValue(path, val, type)   // Escreve chave no Registro
```

---

## 💾 Subsistema de Memória Persistente (PM / PMEM)

O ObsidianOS conta com uma implementação completa de **Persistent Memory** (`src/core/pm/`), projetada segundo a especificação SPEC v0.1:

- **Espaço de Endereçamento Dedicado por Processo (`PmAddressSpace`)**:
  - Memória segmentada em blocos de tamanho fixo (padrão: 64 KB).
  - Alocação **esparsa**: blocos só consomem memória real na primeira escrita (`on-demand`).
  - **Permissões Granulares por Bloco**: `R` (Read = 1), `W` (Write = 2), `X` (Execute = 4).
  - Violações de limites ou escrita em blocos somente-leitura disparam exceções tipadas `PmFault` (`PERM_FAULT`, `BOUNDS_FAULT`, `OOM_FAULT`).
- **Mailbox de Stdin no Bloco 0**:
  - O Bloco 0 do espaço do processo é reservado como mailbox seguro do Kernel.
  - A comunicação assíncrona de I/O é gerenciada sem poluir filas de eventos globais do JavaScript.
- **Labels e Mapeamento de Símbolos**:
  - Processos podem nomear endereços e blocos com labels simbólicos (`mem_label`).
- **Hibernação e Snapshots (`.pmem`)**:
  - O estado completo do address space pode ser serializado para Base64/binário e gravado no disco virtual.
  - Na retomada (`system::mem_resume`), todo o estado de variáveis e blocos é reconstituído fielmente.

---

## ⚙️ CPU Scheduler, Processos e Sinais

O kernel implementa um escalonador de processos com múltiplos estados:

### Estados de Processo (`ProcessState`)
- `NEW`: Criado, aguardando alocação de recursos.
- `READY`: Na fila de execução, aguardando quantum de CPU.
- `RUNNING`: Em execução no momento.
- `BLOCKED`: Bloqueado aguardando I/O ou evento assíncrono.
- `SLEEPING`: Aguardando expiração de timer (`OS.wait`).
- `ZOMBIE`: Processo finalizado aguardando reap pelo processo pai.
- `TERMINATED`: Totalmente limpo do sistema.

### Prioridades de CPU (`ProcessPriority`)
1. `REALTIME` (Nível 0 - Reservado para componentes críticos do kernel)
2. `HIGH` (Nível 1)
3. `ABOVE_NORMAL` (Nível 2)
4. `NORMAL` (Nível 3 - Padrão para processos de usuário)
5. `BELOW_NORMAL` (Nível 4)
6. `IDLE` (Nível 5 - Executado apenas quando o sistema está ocioso)

### Sinais Suportados
O kernel despacha sinais clássicos de controle:
`SIGTERM` · `SIGKILL` · `SIGINT` · `SIGSEGV` · `SIGFPE` · `SIGILL` · `SIGABRT` · `SIGALRM` · `SIGCHLD` · `SIGUSR1` · `SIGUSR2`

---

## 🔌 Fluxo de Boot e Inicialização

```
1. BootScreen monta
   └─► kernel.powerOn()
       ├─ Carrega tabela de partições e BootConfig (MBR / GPT)
       ├─ Valida integridade do disco e arquivos críticos (fsRepairSystemFiles)
       └─ Dispara 'bootmgr.obx' dentro da Sandbox

2. bootmgr.obx (Execução JavaScript Real)
   ├─ Lê C:\ObsidianOS\System32\boot.ini e valida o ARC path (partition(1))
   ├─ Carrega e aloca memória para bibliotecas fundamentais:
   │  ├── kernel32.dll
   │  ├── gdi32.dll
   │  ├── user32.dll
   │  └── hal.dll
   ├─ Inicializa drivers essenciais:
   │  └── ntfs.sys, disk.sys, display.sys, hid.sys, netio.sys
   └─ Invoca OS.finalizeBoot()

3. kernel.loadShell()
   ├─ Descobre manifestos em C:\Program Files\ObsidianOS Apps\
   ├─ Inicia serviços em background:
   │  ├── smss.obx (Session Manager)
   │  ├── csrss.obx (Client Server Runtime)
   │  ├── wininit.obx & services.obx (Service Control Manager)
   │  ├── lsass.obx (Autenticação e segurança)
   │  ├── svchost.obx (Host de serviços)
   │  ├── dwm.obx (Desktop Window Manager)
   │  └── explorer.obx (Shell e interface gráfica)
   └─ Define BootPhase como 'DESKTOP_READY'
```

---

## 📂 Sistema de Arquivos e Registro

### VFS (Virtual File System)
- **Persistência Dupla**: Origin Private File System (OPFS) para alta performance com fallback transparente para `localStorage`.
- **Nós de Arquivo Completos**:
  - Metadados de criação, modificação e último acesso.
  - Atributos reais (`readonly`, `hidden`, `system`, `archive`).
  - Permissões no formato Unix/Windows (`rwx`).
- **Suporte a Executáveis Modernos**:
  - Arquivos `.obx`: Binários executáveis JS do ecossistema ObsidianOS.
  - Arquivos `.osl`: Scripts interpretados pelo engine OSL.
  - Arquivos `.pmem`: Snapshots de memória persistente.

### Registro do Sistema (Registry)
Totalmente aderente à hierarquia Windows:
- **Hives**: `HKEY_LOCAL_MACHINE`, `HKEY_CURRENT_USER`, `HKEY_CLASSES_ROOT`, `HKEY_USERS`, `HKEY_CURRENT_CONFIG`.
- **Tipos de Dados**: `REG_SZ`, `REG_DWORD`, `REG_BINARY`, `REG_MULTI_SZ`, `REG_EXPAND_SZ`, `REG_QWORD`.

---

## 🎨 Motor Gráfico e HwndRenderer

Para permitir que binários puramente em JavaScript (sem componentes React) criem interfaces gráficas completas, o sistema inclui o **`HwndRenderer`**:

- **GDI Canvas (`gdi:draw`)**: O executável emite comandos de desenho vetorizado (`fillStyle`, `fillRect`, `fillText`, `clearRect`) diretamente para o canvas 2D da janela associada ao seu PID.
- **Injeção de DOM Dinâmico (`user32:dom_update`)**: Permite que scripts gerem marcação HTML e recebam eventos de clique através do barramento IPC do kernel.

---

## 📦 Aplicativos Integrados

| Aplicativo | ID (`appId`) | Categoria | Descrição |
|------------|--------------|-----------|-----------|
| **DOOM** | `doom` | Games | O clássico jogo de tiro em primeira pessoa rodando via WebAssembly e js-dos |
| **Obsidian Code** | `obsidian-code` | Produtividade | IDE avançada com coloração de sintaxe para OSL e OBX, árvore de arquivos e console interativo |
| **Terminal** | `terminal` | Sistema | Console interativo com suporte a comandos nativos e shell `cmd.osl` |
| **Explorador de Arquivos** | `file-explorer` | Sistema | Navegação por pastas, criação, renomeação, visualização e exclusão de arquivos |
| **Gerenciador de Tarefas** | `task-manager` | Sistema | Visualização de CPU/RAM em tempo real e gerenciamento de processos ativos |
| **Bloco de Notas** | `notepad` | Produtividade | Editor de texto integrado para arquivos `.txt`, `.log`, `.osl` |
| **Calculadora** | `calculator` | Utilitários | Modos padrão e cálculo com histórico |
| **Navegador Web** | `browser` | Produtividade | Navegador com barra de navegação e histórico |
| **Configurações** | `settings` | Sistema | Personalização de wallpaper, tema, volume, rede e alinhamento da barra de tarefas |
| **Editor do Registro** | `regedit` | Sistema | Visualizador e editor em árvore para as hives do sistema |
| **ObS Record** | `obs-record` | Multimídia | Gravador de tela e webcam com download e salvamento direto no VFS |
| **Media Player** | `media-player` | Multimídia | Reprodutor de áudio e vídeo com suporte a Blob URLs e Base64 |
| **Obsidian Store** | `obsidian-store` | Sistema | Loja de aplicativos para descoberta e instalação de novos pacotes |
| **SDK App Runner** | `sdk-app-runner` | Sistema | Ambiente isolado de execução para aplicativos baixados pela loja |

---

## 🔷 OSL — ObsidianOS Scripting Language

O OSL é a linguagem de script oficial interpretada do ObsidianOS. Os arquivos possuem extensão `.osl` e rodam dentro da thread do SO com total segurança.

### Exemplo de Código OSL
```osl
// Variáveis e tipos
let versao = "1.0.0";
let usuario = "Developer";

// Declaração de funções
fn saudacao(nome) {
    system::log("Bem-vindo ao ObsidianOS, " + nome + "!");
}

saudacao(usuario);

// Manipulação de Memória Persistente (PMEM)
let stats = system::mem_stats();
system::log("PM Stats: " + stats);

// Escrita direta em memória
system::mem_write(1, 0, "Dado persistente na PM");
let lido = system::mem_read(1, 0, 22);
system::log("Lido da PM: " + lido);

// Hibernação da memória
system::mem_snap();
```

### Syscalls Disponíveis (`system::*`)

| Syscall | Descrição |
|---------|-----------|
| `system::log(msg)` | Escreve na saída padrão do processo |
| `system::stdin()` | Lê entrada do usuário (assíncrono) |
| `system::fs_read(caminho)` | Lê conteúdo de arquivo no VFS |
| `system::fs_write(caminho, dado)` | Escreve arquivo no VFS |
| `system::fs_list(caminho)` | Retorna array de arquivos de um diretório |
| `system::fs_exists(caminho)` | Checa existência de arquivo ou pasta |
| `system::fs_delete(caminho)` | Remove arquivo ou diretório |
| `system::fs_getcwd()` | Retorna diretório corrente de trabalho |
| `system::fs_chdir(caminho)` | Altera diretório corrente |
| `system::reg_get(chave)` | Lê valor do registro |
| `system::mem_stats()` | Retorna estatísticas de blocos e memória PM do processo |
| `system::mem_write(bloco, offset, valor)` | Escreve texto ou número no bloco PM |
| `system::mem_read(bloco, offset, tamanho)` | Lê dados da memória PM |
| `system::mem_label(nome, bloco, offset)` | Cria um label simbólico na memória PM |
| `system::mem_snap()` | Exporta snapshot da memória PM para `.pmem` |
| `system::mem_resume()` | Restaura memória do arquivo de snapshot `.pmem` |
| `system::mem_audit()` | Compara razão de memória PM vs. RAM física do navegador |
| `system::panic(stopCode, mensagem)` | Dispara Blue Screen of Death (BSOD) controlado |

---

## 🔧 SDK de Aplicativos (.obx)

Os programas escritos para o ObsidianOS (`.obx`) rodam via motor de execução com acesso à API global `OS`:

```javascript
// Exemplo de binário .obx
OS.print("Inicializando aplicativo...");

// Alocação de memória e recursos
OS.allocateMemory(16, "MeuApp");
const resources = OS.getResources();
OS.print(`RAM em uso: ${resources.usedMemory} MB`);

// Leitura e escrita no sistema de arquivos
if (OS.fileExists("C:\\config.json")) {
  const cfg = OS.readFile("C:\\config.json");
  OS.print("Configuração carregada.");
}

// Comunicação interprocessos (IPC)
OS.ipcSend(1, "evento:ping", { timestamp: Date.now() });

// Finalização
OS.terminate(0);
```

---

## 🔥 Mecânicas de Realismo e Falhas em Cascata (BSOD)

O ObsidianOS simula o comportamento de falhas reais com alta fidelidade:

### Falhas em Cascata (Cascade Failure)
Quando um processo ou serviço crítico encerra inesperadamente (ex: `csrss.obx`, `lsass.obx`, `dwm.obx`), o subsistema de falhas (`faults.ts`) propaga a quebra para todos os processos dependentes:
1. `cascade:start`: Identificação da causa raiz e início da desestabilização.
2. `cascade:step`: Notificação progressiva de processos que falharam na cadeia.
3. Degradação Visual Dinâmica no BSOD via Canvas GDI:
   - **Fase 1 (Flicker)**: Oscilações leves de cor na tela.
   - **Fase 2 (Distorção)**: Entradas avermelhadas e linhas de glitch.
   - **Fase 3 (Colapso Total)**: Tremores de tela (*screen shake*), linhas de ruído e travamento.

### Geração de Minidump
- Um arquivo de despejo de memória real (`MEMORY_<data>.DMP`) é gerado e gravado em `C:\ObsidianOS\System32\Minidump\`.
- Inclui Stop Code, Componente Falho, BugCheck Code e a cadeia exata da cascata (`CASCADE_CHAIN`).

### Modo de Recuperação (Recovery Mode)
- Após 3 crashes consecutivos sem sucesso de inicialização (rastreados por contador persistente), o sistema entra automaticamente no **Obsidian Recovery Environment**, permitindo restauração de ponto anterior, reparo de inicialização ou restauração de fábrica.

---

## ➕ Como Adicionar um Novo Aplicativo

Adicionar um novo app ao sistema é um processo modular e padronizado:

### 1. Crie o Componente do App
Crie a pasta em `src/apps/MeuApp/`:
```tsx
// src/apps/MeuApp/MeuApp.tsx
import './MeuApp.css';

export default function MeuApp({ windowId }: { windowId: string }) {
  return (
    <div className="meu-app-container">
      <h2>Olá, ObsidianOS!</h2>
    </div>
  );
}
```

### 2. Registre o Componente no `appRegistry.ts`
Adicione o import lazy em [`src/core/appRegistry.ts`](src/core/appRegistry.ts):
```typescript
const components: Record<string, ReturnType<typeof lazy>> = {
  // ...
  'meu-app': lazy(() => import('../apps/MeuApp/MeuApp')),
};
```

### 3. Registre o Executável em `src/core/fs/apps.ts`
Adicione o executável à lista `appExes`:
```typescript
export const appExes: [string, string, string, string, string, string, string][] = [
  // ...
  [
    'C:\\Program Files\\ObsidianOS Apps\\meuapp.obx',
    'meuapp.obx',
    'C:\\Program Files\\ObsidianOS Apps',
    'meu-app',        // appId
    '🚀',             // ícone
    'utilities',      // categoria
    'Meu Aplicativo'  // Nome de exibição
  ],
];
```

O kernel detectará o executável automaticamente durante a inicialização do shell (`scanSystemApps`) e ele aparecerá no Menu Iniciar, na busca e no Explorador de Arquivos!

---

## 📜 Licença

Distribuído sob a licença MIT. Sinta-se livre para usar, estudar e expandir o projeto!
