# 🖥️ ObsidianOS

> Um sistema operacional completo rodando inteiramente no navegador, construído com React, TypeScript e Vite. Simula fielmente a experiência de um OS moderno — com boot real, kernel, sistema de arquivos virtual, registro, processos, janelas, BSOD e muito mais.

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Screenshots e Funcionalidades](#-screenshots-e-funcionalidades)
3. [Stack Tecnológica](#-stack-tecnológica)
4. [Estrutura do Projeto](#-estrutura-do-projeto)
5. [Como Rodar](#-como-rodar)
6. [Arquitetura do Sistema](#-arquitetura-do-sistema)
   - [Kernel](#kernel)
   - [Sequência de Boot](#sequência-de-boot)
   - [Sistema de Arquivos Virtual](#sistema-de-arquivos-virtual)
   - [Registro do Sistema](#registro-do-sistema)
   - [Gerenciador de Processos](#gerenciador-de-processos)
   - [Gerenciador de Janelas](#gerenciador-de-janelas)
   - [App Registry](#app-registry)
   - [System Store](#system-store)
7. [Componentes da Interface](#-componentes-da-interface)
   - [Boot Screen](#boot-screen)
   - [BSOD (Blue Screen of Death)](#bsod-blue-screen-of-death)
   - [Lock Screen](#lock-screen)
   - [Desktop](#desktop)
   - [Taskbar](#taskbar)
   - [Start Menu](#start-menu)
   - [Window](#window)
   - [Context Menu](#context-menu)
8. [Aplicativos Integrados](#-aplicativos-integrados)
   - [Terminal (cmd.exe)](#terminal-cmdexe)
   - [Explorador de Arquivos (explorer.exe)](#explorador-de-arquivos-explorerexe)
   - [Gerenciador de Tarefas (taskmgr.exe)](#gerenciador-de-tarefas-taskmgrexe)
   - [Bloco de Notas (notepad.exe)](#bloco-de-notas-notepadexe)
   - [Calculadora (calc.exe)](#calculadora-calcexe)
   - [Navegador Web (msedge.exe)](#navegador-web-msedgeexe)
   - [Configurações (control.exe)](#configurações-controlexe)
   - [Editor do Registro (regedit.exe)](#editor-do-registro-regeditexe)
9. [Sistema de Arquivos Virtual — Estrutura de Diretórios](#-sistema-de-arquivos-virtual--estrutura-de-diretórios)
10. [Registro do Sistema — Chaves Padrão](#-registro-do-sistema--chaves-padrão)
11. [Drivers do Sistema](#-drivers-do-sistema)
12. [Serviços do Sistema](#-serviços-do-sistema)
13. [Processos do Sistema (Boot Inicial)](#-processos-do-sistema-boot-inicial)
14. [Mecânicas de Realismo Profundo](#-mecânicas-de-realismo-profundo)
    - [BSOD por Exclusão de Arquivos](#bsod-por-exclusão-de-arquivos)
    - [BSOD por Encerramento de Processos Críticos](#bsod-por-encerramento-de-processos-críticos)
    - [Monitoramento de CPU e RAM em Tempo Real](#monitoramento-de-cpu-e-ram-em-tempo-real)
    - [Memory Dump no BSOD](#memory-dump-no-bsod)
    - [Auto-Repair no Boot](#auto-repair-no-boot)
15. [Atalhos de Teclado](#-atalhos-de-teclado)
16. [Tipos TypeScript do Sistema](#-tipos-typescript-do-sistema)
17. [Contextos React](#-contextos-react)
18. [Persistência de Dados](#-persistência-de-dados)
19. [Fluxo Completo do Boot](#-fluxo-completo-do-boot)
20. [Como Adicionar um Novo Aplicativo](#-como-adicionar-um-novo-aplicativo)
21. [Configuração do Ambiente de Desenvolvimento](#-configuração-do-ambiente-de-desenvolvimento)
22. [Scripts Disponíveis](#-scripts-disponíveis)

---

## 🎯 Visão Geral

**ObsidianOS** é uma simulação completa e hiper-realista de um sistema operacional moderno (inspirado no Windows 11), rodando 100% no navegador. Não é apenas uma casca visual — o sistema possui:

- **Kernel singleton** com sistema de eventos, logging e gerenciamento de recursos
- **Boot real em múltiplas fases** que lê o sistema de arquivos e o registro, com falhas fatais (BSOD) caso arquivos críticos estejam ausentes
- **Sistema de arquivos virtual persistido** no `localStorage` com permissões, atributos e metadados
- **Registro do sistema** completo com hives reais: `HKEY_LOCAL_MACHINE`, `HKEY_CURRENT_USER`, `HKEY_CLASSES_ROOT`
- **Gerenciamento de processos** com PIDs, uso de CPU/RAM, suspensão e encerramento
- **Gerenciador de janelas** com drag-and-drop, resize em 8 direções, minimizar, maximizar e z-index
- **BSOD funcional** com memory dump real escrito no sistema de arquivos virtual
- **8 aplicativos completos** incluindo Terminal com 20+ comandos, Explorador de Arquivos, Gerenciador de Tarefas com gráficos em tempo real, e mais

---

## ✨ Screenshots e Funcionalidades

| Fase | Descrição |
|------|-----------|
| **BIOS POST** | Tela de texto preta com logs de hardware e drivers |
| **Boot Gráfico** | Logo animado + spinner de 5 pontos |
| **Lock Screen** | Relógio + data + campo de senha |
| **Desktop** | Ícones, wallpaper, área de trabalho interativa |
| **Taskbar** | Botão Iniciar, busca, apps abertos, bandeja do sistema, relógio |
| **Start Menu** | Busca em tempo real, apps fixados, seção recomendados |
| **BSOD** | Tela azul completa com stop code, QR code, memory dump progressivo |

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
| Linting | ESLint + typescript-eslint | 9+ / 8+ |

---

## 📁 Estrutura do Projeto

```
ObsidianOS/
├── index.html                    # Entry point HTML
├── vite.config.ts                # Configuração do Vite
├── tsconfig.json                 # TypeScript raiz
├── tsconfig.app.json             # TypeScript para o app (strict mode)
├── tsconfig.node.json            # TypeScript para Node (configs)
├── eslint.config.js              # Configuração ESLint
├── package.json                  # Dependências e scripts
├── public/
│   ├── favicon.svg               # Ícone do ObsidianOS (4 quadrados)
│   └── icons.svg                 # Ícones SVG do sistema
└── src/
    ├── main.tsx                  # Ponto de entrada React
    ├── App.tsx                   # Componente raiz — orquestrador do OS
    ├── index.css                 # CSS global + variáveis + temas
    ├── types/
    │   └── index.ts              # Todas as interfaces TypeScript
    ├── core/
    │   ├── kernel.ts             # Kernel singleton — coração do sistema
    │   ├── bootSequence.ts       # Sequência de boot de 15 fases
    │   └── appRegistry.ts        # Registro dinâmico de aplicativos
    ├── stores/
    │   ├── fileSystem.ts         # Sistema de arquivos virtual (Zustand + persist)
    │   ├── registry.ts           # Registro do sistema (Zustand + persist)
    │   ├── processManager.ts     # Gerenciamento de processos
    │   ├── windowManager.ts      # Gerenciamento de janelas
    │   ├── systemStore.ts        # Estado global do OS (Zustand + persist)
    │   └── contextMenuStore.ts   # Estado do menu de contexto global
    ├── contexts/
    │   └── ProcessContext.tsx    # Contexto de processo por janela
    ├── hooks/                    # (diretório reservado para hooks futuros)
    ├── utils/                    # (diretório reservado para utilidades)
    ├── assets/
    │   └── wallpapers/
    │       └── default.png       # Wallpaper padrão do desktop
    ├── components/
    │   ├── Boot/
    │   │   ├── BootScreen.tsx    # Tela de boot (texto + gráfico)
    │   │   ├── Boot.css          # Estilos do boot e spinner
    │   │   ├── BSOD.tsx          # Blue Screen of Death
    │   │   └── BSOD.css          # Estilos da tela azul
    │   ├── LockScreen/
    │   │   ├── LockScreen.tsx    # Tela de bloqueio / login
    │   │   └── LockScreen.css
    │   ├── Desktop/
    │   │   ├── Desktop.tsx       # Desktop com ícones e wallpaper
    │   │   └── Desktop.css
    │   ├── Taskbar/
    │   │   ├── Taskbar.tsx       # Barra de tarefas completa
    │   │   └── Taskbar.css
    │   ├── StartMenu/
    │   │   ├── StartMenu.tsx     # Menu Iniciar com busca
    │   │   └── StartMenu.css
    │   ├── Window/
    │   │   ├── Window.tsx        # Janela arrastável e redimensionável
    │   │   ├── Window.css
    │   │   └── WindowRenderer.tsx# Renderizador de todas as janelas abertas
    │   ├── ContextMenu/
    │   │   ├── ContextMenu.tsx   # Menu de contexto global
    │   │   └── ContextMenu.css
    │   └── Notifications/        # (diretório reservado)
    └── apps/
        ├── Terminal/
        │   ├── Terminal.tsx      # Terminal com 20+ comandos
        │   └── Terminal.css
        ├── FileExplorer/
        │   ├── FileExplorer.tsx  # Explorador de arquivos completo
        │   └── FileExplorer.css
        ├── TaskManager/
        │   ├── TaskManager.tsx   # Gerenciador de tarefas com gráficos
        │   └── TaskManager.css
        ├── Notepad/
        │   ├── Notepad.tsx       # Editor de texto
        │   └── Notepad.css
        ├── Calculator/
        │   ├── Calculator.tsx    # Calculadora funcional
        │   └── Calculator.css
        ├── Browser/
        │   ├── Browser.tsx       # Navegador web (iframe)
        │   └── Browser.css
        ├── Settings/
        │   ├── Settings.tsx      # Painel de configurações
        │   └── Settings.css
        └── Regedit/
            ├── Regedit.tsx       # Editor do registro
            └── Regedit.css
```

---

## 🚀 Como Rodar

### Pré-requisitos

- **Node.js** 18+ (recomendado 20+)
- **npm** 9+

### Instalação e execução

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd ObsidianOS

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` no navegador. O sistema iniciará automaticamente o processo de boot.

### Build de produção

```bash
npm run build
```

O output estará em `dist/`. Como é uma SPA pura sem backend, pode ser hospedada em qualquer CDN estático (Vercel, Netlify, GitHub Pages).

---

## 🏗️ Arquitetura do Sistema

O ObsidianOS segue uma arquitetura em camadas que espelha a de um sistema operacional real:

```
┌─────────────────────────────────────────┐
│           CAMADA DE APLICATIVOS         │
│  Terminal | Explorer | TaskManager | …  │
├─────────────────────────────────────────┤
│           CAMADA DE COMPONENTES         │
│  Desktop | Taskbar | StartMenu | Window │
├─────────────────────────────────────────┤
│              CAMADA DE STORES (Mirrors) │
│  fileSystem | registry | processManager │
│  windowManager | systemStore            │
├─────────────────────────────────────────┤
│    CAMADA DO KERNEL (Single Source)     │
│  kernel.ts (singleton) + bootSequence   │
└─────────────────────────────────────────┘

**Nova Arquitetura V2 (Kernel Activo):** Todos os Stores do Zustand (`fileSystem`, `registry`, `systemStore`, `windowManager`) operam agora como **Read-Only Mirrors**. A _Fonte da Verdade_ do estado e da lógica de manipulação ocorre inteiramente dentro da classe singleton `Kernel.ts`. O Zustand as reflete através de injetores de eventos persistentes (Ex: `kernel.on('fs:snapshot')`).
```

---

### Kernel

**Arquivo:** `src/core/kernel.ts`

O kernel é implementado como um **Singleton** clássico — existe uma única instância em toda a aplicação, acessível globalmente.

#### Responsabilidades

| Sistema | Função |
|---------|--------|
| **Boot Phase** | Gerencia e emite mudanças de fase do boot (15 fases) |
| **Logging** | Sistema de log com 6 níveis: `DEBUG`, `INFO`, `WARN`, `ERROR`, `CRITICAL`, `FATAL` |
| **Recursos** | Controla uso de CPU, RAM e disco em tempo real |
| **Drivers** | Registra e consulta drivers carregados |
| **Serviços** | Registra e atualiza status de serviços do sistema |
| **BSOD** | Dispara a tela azul com stop code e informações técnicas |
| **Eventos** | Sistema pub/sub interno (`on`, `emit`) |
| **Syscalls** | Interface para chamadas de sistema (loggadas) |
| **Uptime** | Contador de tempo de atividade em segundos |

#### Fases do Boot (tipo `BootPhase`)

```
OFF → BIOS_POST → BIOS_HARDWARE → BOOTLOADER → KERNEL_INIT → HAL_INIT
    → DRIVER_LOAD → REGISTRY_LOAD → SERVICE_INIT → SUBSYSTEM_INIT
    → SESSION_MANAGER → WINLOGON → SHELL_INIT → DESKTOP_READY
    → BOOT_FAILURE | BSOD
```

#### Estrutura de recursos (`SystemResource`)

```typescript
{
  totalMemory: number;   // MB (padrão: 8192)
  usedMemory: number;    // MB (soma dos processos)
  totalDisk: number;     // MB (padrão: 256000)
  usedDisk: number;      // MB (padrão: 42000)
  cpuCores: number;      // navigator.hardwareConcurrency || 8
  cpuUsage: number;      // 0–100%
  uptime: number;        // segundos desde o boot
  networkUp: boolean;    // conectividade
}
```

#### API pública do Kernel

```typescript
kernel.on(event, callback)         // Subscrição de eventos
kernel.emit(event, ...args)        // Emissão de eventos
kernel.log(level, source, message) // Logging (FATAL → BSOD automático)
kernel.allocateMemory(mb, name)    // Alocar RAM
kernel.freeMemory(mb)              // Liberar RAM
kernel.registerDriver(driver)      // Registrar driver
kernel.registerService(service)    // Registrar serviço
kernel.triggerBSOD(info)           // Disparar BSOD
kernel.scanSystemApps(fs, registry)// Descoberta de apps em System32
kernel.startUptimeCounter()        // Iniciar contagem de uptime
kernel.reset()                     // Resetar estado (reboot)
kernel.syscall(call, ...args)      // Chamada de sistema loggada
```

---

### Sequência de Boot

**Arquivo:** `src/core/bootSequence.ts`

A sequência de boot é uma função `async` que executa **15 fases** sequencialmente. Cada fase lê o sistema de arquivos real — se um arquivo crítico estiver ausente, o sistema trava com BSOD.

#### Fase 0 — PRE-BOOT: Auto-Repair

- Detecta se o sistema travou anteriormente (`localStorage.obsidianos_crashed`)
- Detecta arquivos do sistema com formato desatualizado
- Chama `fs.repairSystemFiles()` para restaurar os arquivos padrão

#### Fase 1 — BIOS POST

- Verifica se `totalMemory > 0` → senão BSOD `MEMORY_MANAGEMENT`

#### Fase 2 — BIOS Hardware Detection

- Verifica se o nó `C:` existe no filesystem → senão BSOD `INACCESSIBLE_BOOT_DEVICE`

#### Fase 3 — Bootloader

- Lê `C:\ObsidianOS\System32\boot.ini` → senão BSOD `BOOTMGR_NOT_FOUND`
- Faz parse do `timeout` e entrada de OS

#### Fase 4 — Kernel Init

- Lê `C:\ObsidianOS\System32\ntoskrnl.exe` → senão BSOD `KERNEL_DATA_INPAGE_ERROR`
- Cria processo `System` (PID 0)

#### Fase 5 — HAL Init

- Lê `C:\ObsidianOS\System32\hal.dll` → senão BSOD `HAL_INITIALIZATION_FAILED`

#### Fase 6 — Driver Loading

- Carrega 12 drivers nesta ordem: `ntfs.sys`, `disk.sys`, `acpi.sys`, `pci.sys`, `display.sys`, `hid.sys`, `kbdclass.sys`, `mouclass.sys`, `netio.sys`, `tcpip.sys`, `ndis.sys`, `hdaudio.sys`
- Drivers `filesystem`, `storage` e `kernel` são **críticos** → BSOD se não encontrados
- Verifica dependências entre drivers

#### Fase 7 — Registry Load

- Verifica chaves obrigatórias do registro
- Lê versão do OS e número de build

#### App Discovery (entre fases 7 e 8)

- `kernel.scanSystemApps()` varre `System32` procurando `.exe` com manifesto JSON
- Registra apps no `appRegistry` dinamicamente

#### Fase 8 — Service Initialization

- Inicia 12 serviços: `EventLog`, `PlugPlay`, `Power`, `RpcSs`, `DcomLaunch`, `Schedule`, `Themes`, `AudioSrv`, `Dhcp`, `Dnscache`, `Spooler`, `wuauserv`
- Cada serviço verifica se o executável existe no filesystem e se as dependências estão rodando

#### Fase 9 — Subsystem Init (Win32)

- Lê e inicia `csrss.exe` → senão BSOD `CRITICAL_PROCESS_DIED`

#### Fase 10 — Session Manager

- Lê e inicia `smss.exe` → senão BSOD `SESSION_INITIALIZATION_FAILED`

#### Fase 11 — Winlogon

- Lê e inicia `winlogon.exe` → senão BSOD `LOGON_INITIALIZATION_FAILED`
- Inicia `lsass.exe` (opcional, mas com warning se ausente)
- Inicia o uptime counter do kernel

#### Pós-Login — Shell Init (`loadShell()`)

- Chamado após o usuário fazer login na Lock Screen
- Lê e inicia `explorer.exe` → senão BSOD `SHELL_INITIALIZATION_FAILED`
- Inicia `dwm.exe` (Desktop Window Manager)
- Inicia `SearchHost.exe`
- Fase final: `DESKTOP_READY`

---

### Sistema de Arquivos Virtual

**Arquivo:** `src/stores/fileSystem.ts`

Anteriormente centralizado com Zustand. Na **Versão 2 (Kernel Ativo)**, o estado virtual é gerido internamente pelo `Kernel` e salva o cache no `localStorage` via chave `obsidianos-filesystem-v2`. A store Zustand apenas atua como **Wrapper Reativo** espelhando a snapshot da memória.

#### Estrutura de um nó (`FileSystemNode`)

```typescript
{
  id: string;           // Igual ao path
  name: string;         // Nome do arquivo/pasta
  type: 'file' | 'directory' | 'shortcut';
  path: string;         // Caminho completo (separador \\)
  parentPath: string;   // Caminho do pai
  size: number;         // Bytes
  extension?: string;   // Extensão sem ponto
  content?: string;     // Conteúdo textual
  children?: string[];  // Caminhos dos filhos (não usado atualmente)
  createdAt: number;    // Timestamp
  modifiedAt: number;
  accessedAt: number;
  permissions: FilePermissions;
  attributes: FileAttributes;
  metadata?: Record<string, string>;
}
```

#### Permissões e Atributos

```typescript
// Arquivos de usuário
defaultPermissions = { read: true, write: true, execute: false, hidden: false, system: false }

// Arquivos do sistema
sysPermissions = { read: true, write: false, execute: true, hidden: false, system: true }
sysAttributes  = { isReadOnly: true, isHidden: false, isSystem: true, isArchive: false }
```

#### Tipos de executáveis no filesystem

| Tipo | Função | `content` |
|------|---------|-----------|
| **System Exe** (`makeSysExe`) | Arquivos de sistema (ntoskrnl, dlls, etc.) | String descritiva tipo PE32+ |
| **App Exe** (`makeAppExe`) | Executáveis de apps descobertos pelo kernel | **JSON manifest** com `appId`, `name`, `icon`, `category`, `type: "executable"` |

#### API do FileSystem

```typescript
getNode(path)                               // Busca nó por caminho
getChildren(path)                           // Lista filhos diretos
createFile(parentPath, name, content, ext) // Cria arquivo
createDirectory(parentPath, name)           // Cria pasta
deleteNode(path)                            // Remove nó e filhos recursivamente
renameNode(path, newName)                   // Renomeia (atualiza todos os filhos)
moveNode(fromPath, toPath)                  // Move nó
updateFileContent(path, content)            // Atualiza conteúdo
exists(path)                                // Verifica existência
repairSystemFiles()                         // Restaura arquivos padrão
getPathParts(path)                          // Divide path em partes
```

---

### Registro do Sistema

**Arquivo:** `src/stores/registry.ts`

Semelhante ao File System, **pertence inteiramente ao Kernel através da propriedade `_registry`**. É salvo no `localStorage` sob a chave `obsidianos-registry-v2` e injeta alterações na UI via evento `registry:snapshot`. Suporta todos os tipos reais do registro Windows.

#### Tipos de valor (`RegistryEntry.type`)

- `REG_SZ` — String
- `REG_DWORD` — Número inteiro 32-bit
- `REG_BINARY` — Binário
- `REG_MULTI_SZ` — Array de strings
- `REG_EXPAND_SZ` — String com variáveis de ambiente
- `REG_QWORD` — Número 64-bit

#### API do Registry

```typescript
getValue(path)                    // Ex: "HKLM\\SW\\ObsidianOS\\CurrentVersion\\DisplayVersion"
setValue(path, type, value)       // Cria/atualiza valor
deleteValue(path)                 // Remove valor
getSubKeys(path)                  // Lista sub-chaves
keyExists(path)                   // Verifica existência de chave
```

---

### Gerenciador de Processos

**Arquivo:** `src/stores/processManager.ts`

Gerencia todos os processos do sistema. **Sem persist** — reinicia a cada boot.

#### Estrutura de Processo (`Process`)

```typescript
{
  pid: number;
  name: string;           // Ex: "explorer.exe"
  title: string;          // Nome amigável
  icon: string;           // Emoji
  status: 'running' | 'suspended' | 'terminated';
  memoryUsage: number;    // MB
  cpuUsage: number;       // %
  startTime: number;      // Timestamp
  parentPid?: number;
  windowId?: string;      // Vincula processo a janela
}
```

#### Processos pré-inicializados (PIDs 0–9)

| PID | Nome | RAM |
|-----|------|-----|
| 0 | System | 350.2 MB |
| 1 | smss.exe | 12.1 MB |
| 2 | csrss.exe | 45.8 MB |
| 3 | wininit.exe | 18.5 MB |
| 4 | services.exe | 82.2 MB |
| 5 | lsass.exe | 124.4 MB |
| 6 | svchost.exe | 428.6 MB |
| 7 | dwm.exe | 162.3 MB |
| 8 | explorer.exe | 285.7 MB |
| 9 | SearchHost.exe | 145.2 MB |

Apps do usuário recebem PIDs a partir de **100**.

#### API do ProcessManager

```typescript
createProcess(name, title, icon, windowId?)  // Cria processo (aloca RAM no kernel)
terminateProcess(pid)                         // Encerra e libera RAM
suspendProcess(pid)                           // Suspende
resumeProcess(pid)                            // Retoma
updateProcessCpu(pid, cpu)                    // Atualiza uso de CPU
updateProcessMemory(pid, memory)              // Atualiza uso de RAM
getProcess(pid)                               // Busca por PID
getProcessByWindowId(windowId)                // Busca por janela
getRunningProcesses()                         // Lista processos em execução
```

---

### Gerenciador de Janelas

**Arquivo:** `src/stores/windowManager.ts`

Controla todas as janelas abertas. Usa `uuid` para IDs únicos.

#### Estrutura de Janela (`WindowState`)

```typescript
{
  id: string;             // UUID
  title: string;
  icon: string;
  appId: string;          // Referência ao app no appRegistry
  x, y: number;           // Posição (centralizada + offset aleatório)
  width, height: number;
  minWidth, minHeight: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isActive: boolean;      // Janela em foco
  zIndex: number;         // Controle de empilhamento
  opacity: number;
  isResizable: boolean;
  isDraggable: boolean;
  isClosable: boolean;
  isMinimizable: boolean;
  isMaximizable: boolean;
  processId: number;      // PID vinculado
  prevBounds?: { x, y, width, height }; // Para restaurar de maximizado
}
```

#### Comportamentos

- **Abertura**: Calcula posição central da tela com offset aleatório (±30px)
- **Foco**: Incrementa `topZIndex` global para sempre trazer ao topo
- **Minimizar**: Remove do z-stack visual, foca próxima janela visível
- **Maximizar**: Salva bounds em `prevBounds`, ocupa 100% - 48px (taskbar)
- **Fechar**: Encerra o processo vinculado via `processManager.terminateProcess()`
- **Resize**: 8 handles (n, s, e, w, ne, nw, se, sw) com drag do mouse

---

### App Registry

**Arquivo:** `src/core/appRegistry.ts`

O registry de apps é **dinâmico**: começa vazio e é populado pelo kernel durante o boot via `scanSystemApps()`, que lê os manifestos JSON dos `.exe` em `System32`.

#### Componentes lazy-loaded por appId

| appId | Componente |
|-------|-----------|
| `terminal` | `apps/Terminal/Terminal` |
| `notepad` | `apps/Notepad/Notepad` |
| `calculator` | `apps/Calculator/Calculator` |
| `file-explorer` | `apps/FileExplorer/FileExplorer` |
| `settings` | `apps/Settings/Settings` |
| `task-manager` | `apps/TaskManager/TaskManager` |
| `browser` | `apps/Browser/Browser` |
| `regedit` | `apps/Regedit/Regedit` |

Os componentes são carregados com `React.lazy()` — o `WindowRenderer` usa `<Suspense>` para exibir um spinner enquanto carregam.

---

### System Store

**Arquivo:** `src/stores/systemStore.ts`

Estado global do sistema operacional (**Theme, Auth, Hardware Volume/Bright, Network**). Assim como o File System, o core destas configurações lógicas foi abstraído para o evento `system:snapshot` via Kernel. A `systemStore` retém controles voláteis de Interface (modais abrindo, array efêmero de notificações).

#### Estado gerenciado

| Campo | Tipo | Padrão |
|-------|------|--------|
| `bootPhase` | `'off' \| 'bios' \| 'loading' \| 'login' \| 'desktop'` | `'off'` |
| `isBooting` | boolean | false |
| `bootProgress` | number | 0 |
| `currentUser` | `UserProfile` | `{ username: 'user', isAdmin: true }` |
| `isLocked` | boolean | false |
| `theme` | `SystemTheme` | dark + accent #6366f1 |
| `notifications` | `NotificationData[]` | [] |
| `isStartMenuOpen` | boolean | false |
| `volume` | number | 75 |
| `isMuted` | boolean | false |
| `brightness` | number | 100 |
| `isWifiConnected` | boolean | true |
| `isBluetooth` | boolean | false |
| `batteryLevel` | number | 85 |

> **Nota:** O `bootPhase` do `systemStore` é diferente do `BootPhase` do kernel. O store usa uma versão simplificada (`'off' | 'bios' | 'loading' | 'login' | 'desktop'`) para controlar o que renderizar na UI, enquanto o kernel tem 15 fases internas detalhadas.

---

## 🖼️ Componentes da Interface

### Boot Screen

**Arquivo:** `src/components/Boot/BootScreen.tsx`

Responsável por orquestrar todo o processo de boot da perspectiva da UI.

**Modo texto** (BIOS → Driver Loading):

- Fundo preto, fonte monospace
- Log ao vivo do kernel (`kernel.on('bootLog', ...)`)
- Mantém os últimos 40 logs para evitar scroll excessivo

**Modo gráfico** (Winlogon → Shell Init):

- Logo ObsidianOS com 4 quadrados em gradiente de índigo
- Spinner de 5 pontos animado via CSS
- Texto "Iniciando serviços..."

Ao completar o boot, chama `loadShell()` e transiciona o `bootPhase` para `'login'`.

---

### BSOD (Blue Screen of Death)

**Arquivo:** `src/components/Boot/BSOD.tsx`

Altamente fiel ao BSOD do Windows 11:

- Emoji `:(`
- Barra de progresso do memory dump (calculada com base na RAM real usada pelo kernel)
- Stop code e componente com falha
- Detalhes técnicos: Bug Check Code + parâmetros
- QR code SVG decorativo
- **Ao completar**, cria um arquivo `.DMP` em `C:\ObsidianOS\System32\Minidump\` com hex dump real
- **Reinicia automaticamente** após 3 segundos (`window.location.reload()`)
- **Seta flag** `localStorage.obsidianos_crashed = '1'` para ativar auto-repair no próximo boot

O BSOD é disparado quando:

1. `kernel.triggerBSOD(info)` é chamado diretamente
2. `kernel.log('FATAL', ...)` é chamado (automático)
3. Arquivo crítico é deletado do filesystem
4. Processo crítico é encerrado

---

### Lock Screen

**Arquivo:** `src/components/LockScreen/LockScreen.tsx`

Tela de bloqueio/login em duas fases:

**Fase 1 (bloqueada):** relógio grande (HH:MM), data por extenso, hint "Clique para entrar"

**Fase 2 (login):** avatar do usuário, nome, campo de senha com botão de submit, feedback de erro com animação

- Senha em branco = acesso direto (sem senha)
- `login()` do systemStore atualiza `lastLogin` e transiciona para `'desktop'`

---

### Desktop

**Arquivo:** `src/components/Desktop/Desktop.tsx`

- Exibe wallpaper (PNG importado como asset)
- Ícones padrão dispostos verticalmente com animação de entrada (`--icon-index` CSS var)
- Seleção de ícone com single-click, abertura com double-click
- Menu de contexto do desktop com: Exibir, Classificar, Novo, Configurações de Exibição
- Consome o `appRegistry` para verificar se o app existe antes de abrir
- **Condicionalmente renderizado**: só aparece se `explorer.exe` estiver na lista de processos

---

### Taskbar

**Arquivo:** `src/components/Taskbar/Taskbar.tsx`

```
[Iniciar] [Pesquisa]    [App1] [App2] [App3]    [WiFi] [Volume] [Bateria] [HH:MM | DD/MM/AAAA]
```

- **Esquerda**: botão Iniciar (SVG do logo ObsidianOS), botão de busca
- **Centro**: botões para cada janela aberta (exceto appId 'system'); indicador visual de janela ativa/minimizada
- **Direita**: ícones de WiFi (SVG condicional), volume (SVG condicional), bateria, relógio com data
- Relógio atualizado a cada segundo
- Context menu no clique direito: atalho para Gerenciador de Tarefas

---

### Start Menu

**Arquivo:** `src/components/StartMenu/StartMenu.tsx`

- Abre sobre a taskbar com animação
- **Busca em tempo real** — filtra todos os apps registrados
- **Seção Fixados**: primeiros 6 apps do registry, grid 3x2
- **Seção Recomendados**: arquivos recentes (estáticos no momento)
- **Bottom bar**: avatar + nome do usuário, botão de shutdown (reload)
- Fecha ao: clicar fora, pressionar Escape, clicar em um app
- Context menu por app: Abrir, Executar como admin, Desafixar, Fixar na taskbar, Desinstalar

---

### Window

**Arquivo:** `src/components/Window/Window.tsx`

Componente core para todas as janelas do sistema.

**Title Bar:**

- Ícone + título (com ellipsis overflow)
- Botões: minimizar, maximizar/restaurar (ícone muda), fechar
- Drag da title bar para mover (bloqueado se maximizado)
- Double-click na title bar: toggle maximizar
- Right-click: context menu com Restaurar, Mover, Tamanho, Minimizar, Maximizar, Fechar

**Resize Handles:**

- 8 handles: N, S, E, W, NE, NW, SE, SW
- Drag listeners globais no `document` (captura movimento fora da janela)
- Respeita `minWidth` e `minHeight`
- Desativados quando maximizado

**Content Area:**

- Envolve o app em `ProcessProvider` (injeção de contexto de processo)
- `<Suspense>` com spinner "Carregando executável..." para lazy-loaded components

---

### Context Menu

**Arquivo:** `src/components/ContextMenu/ContextMenu.tsx`

Menu de contexto global único gerenciado pelo `contextMenuStore`.

- Posicionado absolutamente em `(x, y)` do evento de mouse
- Suporta separadores (`separator: true`)
- Suporta items desabilitados
- Suporta sub-menus (children) — hover abre sub-nível
- Fecha ao: clicar em qualquer item, clicar fora (evento global)
- Atalhos de teclado exibidos à direita

---

## 📦 Aplicativos Integrados

### Terminal (cmd.exe)

**Arquivo:** `src/apps/Terminal/Terminal.tsx`

Terminal interativo com 20+ comandos, histórico de comandos (setas ↑↓) e autocompletar por Tab.

#### Comandos disponíveis

| Comando | Descrição |
|---------|-----------|
| `help` | Lista todos os comandos |
| `dir` / `ls` | Lista conteúdo do diretório atual |
| `cd <caminho>` | Muda diretório (absoluto, relativo, `..`, `\`) |
| `cls` / `clear` | Limpa a tela |
| `echo <texto>` | Exibe texto |
| `type` / `cat <arquivo>` | Mostra conteúdo de arquivo |
| `mkdir` / `md <nome>` | Cria diretório |
| `touch <nome>` | Cria arquivo vazio |
| `del` / `rm <nome>` | Deleta arquivo ou pasta |
| `pwd` | Mostra caminho atual |
| `whoami` | `OBSIDIAN\User` |
| `hostname` | `DESKTOP-OBSIDIAN` |
| `date` | Data e hora atual |
| `ver` | Versão do ObsidianOS |
| `tasklist` | Lista processos (PID, RAM, CPU) |
| `systeminfo` | Informações completas do sistema |
| `reg query <chave>` | Consulta chave do registro |
| `tree` | Árvore de diretórios ASCII |
| `ipconfig` | Configuração de rede (simulada) |
| `ping <host>` | Ping simulado (4 respostas aleatórias) |
| `reboot` / `shutdown` | Reinicia o sistema |
| `bsod` | **Força um BSOD** (`MANUALLY_INITIATED_CRASH`) |
| `color <cor>` | Muda cor (listado no help) |

---

### Explorador de Arquivos (explorer.exe)

**Arquivo:** `src/apps/FileExplorer/FileExplorer.tsx`

Explorador de arquivos completo com:

- **Toolbar**: botões Voltar/Avançar/Pasta Pai, barra de caminho (breadcrumbs clicáveis ou modo edição), busca
- **Sidebar**: Acesso Rápido (Desktop, Documentos, Downloads, Imagens, Música, Vídeos), Este Computador (Disco C:)
- **Conteúdo**: modo Detalhes (tabela com Nome/Data/Tipo/Tamanho) ou modo Grade (ícones)
- **Status bar**: contagem de itens, item selecionado, toggle de visualização
- Ícones por extensão: `.txt` 📝, `.js` 📜, `.html` 🌐, `.exe` ⚡, etc.
- Context menu por item: Abrir, Recortar, Copiar, Colar, Renomear, Excluir, Propriedades
- Abre arquivos com app associado: `.txt`→Notepad, `.html`→Browser
- Atualiza título da janela ao navegar (`updateWindowTitle`)

---

### Gerenciador de Tarefas (taskmgr.exe)

**Arquivo:** `src/apps/TaskManager/TaskManager.tsx`

Atalho global: **Ctrl+Shift+Esc**

**Aba Processos:**

- Tabela com todos os processos: ícone, nome, status, CPU%, RAM MB
- Processos com PID < 10 marcados como "Sistema"
- Seleção por clique, encerramento via botão "Finalizar tarefa"
- Warning modal ao tentar encerrar processo de sistema

**Aba Desempenho:**

- Gráfico SVG de CPU (60 pontos históricos, cor índigo)
- Gráfico SVG de RAM (60 pontos históricos, cor verde)
- Métricas: Utilização, Processos, Threads (×4), Velocidade

**Aba Detalhes:**

- Tabela completa: Nome, PID, Status, CPU, Memória

**Dialog "Nova Tarefa":** aceita `explorer.exe` e `regedit.exe`

**Encerrar processo de sistema:**

- Encerrar `csrss.exe`, `wininit.exe`, `lsass.exe`, `smss.exe`, `services.exe`, `dwm.exe` ou `System` dispara BSOD com stop code específico
- Encerrar `gdi32.dll` provoca distorção visual + BSOD `WIN32K_CRITICAL_FAILURE`
- Encerrar `user32.dll` trava inputs + BSOD `CLIENT_SERVER_RUNTIME_ISSUE`

---

### Bloco de Notas (notepad.exe)

**Arquivo:** `src/apps/Notepad/Notepad.tsx`

Editor de texto simples com área editável que preenche toda a janela. Suporta múltiplas instâncias.

---

### Calculadora (calc.exe)

**Arquivo:** `src/apps/Calculator/Calculator.tsx`

Calculadora funcional com operações básicas (+, -, ×, ÷), porcentagem e sinal.

---

### Navegador Web (msedge.exe)

**Arquivo:** `src/apps/Browser/Browser.tsx`

Navegador com barra de endereços, botões de navegação e iframe para carregar URLs reais.

---

### Configurações (control.exe)

**Arquivo:** `src/apps/Settings/Settings.tsx`

Painel de configurações com sidebar de seções:

| Seção | Funcionalidade |
|-------|---------------|
| **Sistema** | Slider de volume (0-100%), slider de brilho (0-100%) |
| **Personalização** | Seletor de tema (Escuro/Claro), paleta de 10 cores de destaque, toggle de transparência |
| **Sobre** | Informações do dispositivo lidas do registro (versão, build, edição, proprietário) |
| Outras | Placeholder "em desenvolvimento" |

As cores de destaque modificam a variável CSS `--accent` em tempo real.

---

### Editor do Registro (regedit.exe)

**Arquivo:** `src/apps/Regedit/Regedit.tsx`

Editor visual do registro com navegação em árvore hierárquica pelas hives e subchaves, visualização de valores por chave, e interface similar ao `regedit.exe` real do Windows.

---

## 🗂️ Sistema de Arquivos Virtual — Estrutura de Diretórios

```
C:\
├── ObsidianOS\
│   ├── System32\
│   │   ├── drivers\        # Arquivos de driver (*.sys)
│   │   ├── config\         # Hives do registro (SYSTEM, SOFTWARE, SAM, SECURITY)
│   │   ├── wbem\
│   │   ├── WindowsPowerShell\
│   │   ├── en-US\
│   │   ├── pt-BR\
│   │   ├── Minidump\       # Criado dinamicamente após BSOD
│   │   ├── ntoskrnl.exe    # CRÍTICO: Kernel
│   │   ├── hal.dll         # CRÍTICO: HAL
│   │   ├── csrss.exe       # CRÍTICO: Win32 Subsystem
│   │   ├── smss.exe        # CRÍTICO: Session Manager
│   │   ├── winlogon.exe    # CRÍTICO: Login
│   │   ├── services.exe    # CRÍTICO: Service Control
│   │   ├── lsass.exe       # CRÍTICO: Security Authority
│   │   ├── svchost.exe     # Service Host
│   │   ├── dwm.exe         # Desktop Window Manager
│   │   ├── kernel32.dll
│   │   ├── user32.dll      # MONITORADO: ausência → BSOD
│   │   ├── gdi32.dll       # MONITORADO: ausência → distorção → BSOD
│   │   ├── ntdll.dll
│   │   ├── [+ 10 outras DLLs]
│   │   ├── boot.ini        # CRÍTICO: configuração de boot
│   │   └── win.ini
│   ├── Fonts\
│   ├── Temp\
│   ├── Logs\
│   ├── INF\
│   └── SysWOW64\
├── Program Files\
│   └── ObsidianOS Apps\
│       ├── explorer.exe    # Shell (app manifest JSON)
│       ├── notepad.exe     # App manifest JSON
│       ├── calc.exe        # App manifest JSON
│       ├── cmd.exe         # App manifest JSON
│       ├── control.exe     # App manifest JSON
│       ├── taskmgr.exe     # App manifest JSON
│       ├── msedge.exe      # App manifest JSON
│       └── regedit.exe     # App manifest JSON
├── Program Files (x86)\
├── Users\
│   ├── User\
│   │   ├── Desktop\
│   │   │   └── readme.txt
│   │   ├── Documents\
│   │   │   ├── notes.txt
│   │   │   ├── project.js
│   │   │   └── report.html
│   │   ├── Downloads\
│   │   ├── Pictures\
│   │   ├── Music\
│   │   ├── Videos\
│   │   └── AppData\
│   │       ├── Local\
│   │       │   └── Temp\
│   │       └── Roaming\
│   └── Public\
├── ProgramData\
└── Recovery\
```

---

## 🔑 Registro do Sistema — Chaves Padrão

| Chave | Valores importantes |
|-------|-------------------|
| `HKCU\Software\ObsidianOS\Desktop` | Wallpaper, WallpaperStyle, IconSize, ShowDesktopIcons |
| `HKCU\Software\ObsidianOS\Themes` | CurrentTheme, AccentColor, TransparencyEnabled, AnimationSpeed |
| `HKCU\Software\ObsidianOS\Taskbar` | Alignment, AutoHide, ShowSearch, ShowWidgets, Size |
| `HKCU\Software\ObsidianOS\Explorer` | ShowHiddenFiles, ShowFileExtensions, DefaultView |
| `HKLM\SOFTWARE\ObsidianOS\CurrentVersion` | ProductName, DisplayVersion(`24H2`), CurrentBuild(`26100`), EditionID(`Professional`) |
| `HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment` | OS, PROCESSOR_ARCHITECTURE, PATH, TEMP |
| `HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management` | PhysicalMemoryMB(`8192`), PagingFileLimit, VirtualMemoryEnabled |
| `HKCR\.txt` | ContentType(`text/plain`), DefaultApp(`notepad`) |
| `HKCR\.html` | ContentType(`text/html`), DefaultApp(`browser`) |
| `HKCR\.js` | ContentType(`application/javascript`), DefaultApp(`notepad`) |

---

## 🔧 Drivers do Sistema

Carregados na fase 6 do boot, na ordem definida por `loadOrder`:

| Driver | Tipo | Dependências | Descrição |
|--------|------|-------------|-----------|
| `ntfs.sys` | filesystem | — | NTFS File System Driver |
| `disk.sys` | storage | — | Disk Driver |
| `acpi.sys` | kernel | — | ACPI Driver |
| `pci.sys` | kernel | acpi.sys | PCI Bus Driver |
| `display.sys` | display | pci.sys | Display Driver |
| `hid.sys` | input | — | Human Interface Device |
| `kbdclass.sys` | input | hid.sys | Keyboard Class Driver |
| `mouclass.sys` | input | hid.sys | Mouse Class Driver |
| `netio.sys` | network | — | Network I/O Subsystem |
| `tcpip.sys` | network | netio.sys | TCP/IP Protocol Driver |
| `ndis.sys` | network | tcpip.sys | NDIS Interface Driver |
| `hdaudio.sys` | audio | pci.sys | HD Audio Driver |

> **Drivers críticos** (filesystem, storage, kernel): ausência → BSOD `DRIVER_IRQL_NOT_LESS_OR_EQUAL`

---

## ⚙️ Serviços do Sistema

Iniciados na fase 8 do boot:

| Serviço | Tipo | Dependências | Executable |
|---------|------|-------------|-----------|
| EventLog | auto | — | svchost.exe |
| PlugPlay | auto | — | svchost.exe |
| Power | auto | — | svchost.exe |
| RpcSs | auto | — | svchost.exe |
| DcomLaunch | auto | RpcSs | svchost.exe |
| Schedule | auto | RpcSs | svchost.exe |
| Themes | auto | — | svchost.exe |
| AudioSrv | auto | PlugPlay | svchost.exe |
| Dhcp | auto | — | svchost.exe |
| Dnscache | auto | Dhcp | svchost.exe |
| Spooler | auto | RpcSs | spoolsv.exe |
| wuauserv | **manual** | RpcSs | svchost.exe |

---

## 🎭 Mecânicas de Realismo Profundo

### BSOD por Exclusão de Arquivos

Monitorado em `App.tsx` via `useFileSystem`:

| Arquivo | Efeito |
|---------|--------|
| `gdi32.dll` | CSS `.gdi-failure` por 4s → BSOD `WIN32K_CRITICAL_FAILURE` (0x0000003B) |
| `user32.dll` | `pointer-events: none` por 5s → BSOD `CLIENT_SERVER_RUNTIME_ISSUE` (0x000000F4) |

### BSOD por Encerramento de Processos Críticos

Monitorado em `App.tsx` via `useProcessManager`:

| Processo | Stop Code |
|---------|-----------|
| System (ntoskrnl) | CRITICAL_PROCESS_DIED |
| smss.exe | CRITICAL_PROCESS_DIED |
| csrss.exe | CRITICAL_PROCESS_DIED |
| wininit.exe | CRITICAL_PROCESS_DIED |
| lsass.exe | CRITICAL_PROCESS_DIED |
| services.exe | CRITICAL_PROCESS_DIED |
| dwm.exe | DESKTOP_WINDOW_MANAGER_DIED |

### Monitoramento de CPU e RAM em Tempo Real

Loop em `App.tsx` a cada 2 segundos:

1. Soma `cpuUsage` de todos os processos
2. Adiciona ruído orgânico aleatório (+0 a 2%)
3. Chama `kernel.updateCpuUsage()`
4. Sincroniza `usedMemory` do kernel com a soma real dos processos

### Memory Dump no BSOD

- Calcula progresso com base em `kernel.resources.usedMemory`
- A cada 50ms, grava uma linha de hex dump no arquivo `.DMP`
- Ao completar 100%, salva o arquivo em `C:\ObsidianOS\System32\Minidump\MEMORY_<timestamp>.DMP`

### Auto-Repair no Boot

Se `localStorage.obsidianos_crashed === '1'` ou se `explorer.exe` estiver ausente/desatualizado:

- Kernel entra em `BIOS_POST` imediatamente
- Chama `fs.repairSystemFiles()` que restaura todos os arquivos do sistema para o estado padrão
- Remove a flag de crash

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| **Ctrl+Shift+Esc** | Abre Gerenciador de Tarefas |
| **Escape** | Fecha o Start Menu |
| **Alt+F4** | Fecha a janela ativa (via context menu) |
| **↑/↓** (Terminal) | Navega no histórico de comandos |
| **Tab** (Terminal) | Autocompletar nome de arquivo/pasta |
| **Enter** | Executa comando (Terminal) / Login (Lock Screen) |

---

## 📐 Tipos TypeScript do Sistema

**Arquivo:** `src/types/index.ts`

Todas as interfaces centrais do sistema:

```typescript
Process          // Processo do sistema operacional
WindowState      // Estado de uma janela
FileSystemNode   // Nó do sistema de arquivos
FilePermissions  // Permissões de arquivo
FileAttributes   // Atributos de arquivo
RegistryKey      // Chave do registro
RegistryHive     // Hive do registro (HKLM, HKCU, etc.)
DesktopIcon      // Ícone na área de trabalho
NotificationData // Notificação do sistema
SystemTheme      // Tema visual do OS
UserProfile      // Perfil do usuário
ContextMenuItem  // Item de menu de contexto
AppDefinition    // Definição de aplicativo no registry
```

---

## 🔌 Contextos React

### ProcessContext

**Arquivo:** `src/contexts/ProcessContext.tsx`

Cada janela envolve seu conteúdo em um `ProcessProvider`, injetando:

```typescript
{
  pid: number;           // PID do processo desta janela
  process: Process;      // Objeto completo do processo
  env: {                 // Variáveis de ambiente simuladas
    OS: 'ObsidianOS_NT',
    USERNAME: 'User',
    APPDATA: 'C:\\Users\\User\\AppData\\Roaming',
    TEMP: 'C:\\Users\\User\\AppData\\Local\\Temp',
  };
  terminate: () => void; // Encerra o processo desta janela
}
```

Usado com `useProcess()` dentro de qualquer componente de app.

---

## 💾 Persistência de Dados

O ObsidianOS persiste dados no `localStorage` do navegador:

| Chave localStorage | Conteúdo | Quando é limpo |
|---------------------|---------|----------------|
| `obsidianos-filesystem` | Todo o sistema de arquivos virtual | `repairSystemFiles()` restaura padrões |
| `obsidianos-registry` | Hives do registro | Nunca (persiste customizações) |
| `obsidianos-system` | Tema, usuário, volume, brilho | Nunca (persiste preferências) |
| `obsidianos_crashed` | Flag de crash | Removida no próximo boot bem-sucedido |

> ⚠️ **Limpar o localStorage** equivale a "formatar o disco" — o sistema reiniciará com os valores padrão na próxima vez.

---

## 🔄 Fluxo Completo do Boot

```
Usuário abre o navegador
        │
        ▼
App.tsx monta → bootPhase = 'off'
        │
        ▼
BootScreen renderiza → chama bootSequence()
        │
        ├─ [BIOS POST] Verifica memória
        ├─ [HARDWARE] Detecta C:
        ├─ [BOOTLOADER] Lê boot.ini
        ├─ [KERNEL INIT] Carrega ntoskrnl.exe → cria processo System
        ├─ [HAL INIT] Carrega hal.dll
        ├─ [DRIVER LOAD] 12 drivers em sequência
        ├─ [REGISTRY LOAD] Verifica chaves obrigatórias
        ├─ [APP DISCOVERY] Escaneia System32 por manifests .exe
        ├─ [SERVICE INIT] 12 serviços (verifica exe + deps)
        ├─ [SUBSYSTEM] csrss.exe
        ├─ [SESSION MGR] smss.exe
        └─ [WINLOGON] winlogon.exe + lsass.exe
                │
                ▼
        bootPhase → 'login'
        LockScreen renderiza
                │
        Usuário faz login
                │
                ▼
        loadShell() → explorer.exe + dwm.exe + SearchHost.exe
                │
                ▼
        bootPhase → 'desktop'
        Desktop + Taskbar + StartMenu + WindowRenderer renderizam
```

---

## ➕ Como Adicionar um Novo Aplicativo

### Passo 1: Criar o componente

```tsx
// src/apps/MeuApp/MeuApp.tsx
export default function MeuApp({ windowId }: { windowId: string }) {
  return <div>Meu Aplicativo — Window: {windowId}</div>;
}
```

### Passo 2: Registrar no appRegistry

```typescript
// src/core/appRegistry.ts
const components: Record<string, any> = {
  // ... apps existentes
  'meu-app': lazy(() => import('../apps/MeuApp/MeuApp')),
};
```

### Passo 3: Criar o executável manifest no fileSystem

```typescript
// src/core/defaultFileSystem.ts — array appExes
const appExes = [
  // ... outros apps
  ['C:\\Program Files\\ObsidianOS Apps\\meuapp.exe', 'meuapp.exe', 'C:\\Program Files\\ObsidianOS Apps',
   'meu-app', '🚀', 'productivity', 'Meu Aplicativo'],
];
```

O manifesto JSON gerado automaticamente pelo `makeAppExe`:

```json
{
  "appId": "meu-app",
  "name": "Meu Aplicativo",
  "icon": "🚀",
  "category": "productivity",
  "type": "executable",
  "launchTarget": "meu-app"
}
```

### Passo 4: O kernel descobre automaticamente

Na próxima inicialização, `kernel.scanSystemApps()` vai ler o manifest direto de `C:\Program Files\ObsidianOS Apps` (e utilitários base do System32), chamar `registry.registerApp()` e o app aparecerá na busca do Start Menu e executará nativamente via double-click do Windows Explorer graças à extensão `.exe`.

---

## ⚙️ Configuração do Ambiente de Desenvolvimento

### TypeScript (tsconfig.app.json)

O projeto usa **strict mode completo**:

- `target`: ES2023
- `strict`: true
- `noUnusedLocals`: true
- `noUnusedParameters`: true
- `noFallthroughCasesInSwitch`: true
- `erasableSyntaxOnly`: true

### Vite (vite.config.ts)

Configuração mínima com `@vitejs/plugin-react` para Fast Refresh.

### ESLint (eslint.config.js)

- `@eslint/js` com regras recomendadas
- `typescript-eslint` com type checking
- `eslint-plugin-react-hooks` com regras de hooks
- `eslint-plugin-react-refresh` para HMR seguro

---

## 📜 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento com HMR (Vite)
npm run build    # Build de produção (tsc + vite build)
npm run lint     # Lint com ESLint
npm run preview  # Preview do build de produção
```

---

<div align="center">

**ObsidianOS** — Um sistema operacional no navegador.

Construído com ❤️ usando React 19 + TypeScript + Vite

</div>
