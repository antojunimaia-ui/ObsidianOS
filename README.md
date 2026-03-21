# 🖥️ ObsidianOS

> Um sistema operacional completo rodando inteiramente no navegador, construído com React, TypeScript e Vite. Simula fielmente a experiência de um OS moderno — com BIOS nativa, kernel executável, sistema de arquivos em disco (OPFS), registro, processos, janelas, BSOD e muito mais.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Como Rodar](#como-rodar)
5. [Arquitetura do Sistema](#arquitetura-do-sistema)
6. [Fluxo de Boot](#fluxo-de-boot)
7. [Componentes da Interface](#componentes-da-interface)
8. [Aplicativos Integrados](#aplicativos-integrados)
9. [Mecânicas de Realismo](#mecânicas-de-realismo)
10. [Como Adicionar um Novo Aplicativo](#como-adicionar-um-novo-aplicativo)

---

## 🎯 Visão Geral

**ObsidianOS** é uma simulação completa de um sistema operacional moderno (inspirado no Windows 11), rodando 100% no navegador. Não é apenas uma casca visual, mas um sistema com arquitetura em camadas:

- **BIOS + Boot Manager nativos** — o kernel real executa `bootmgr.exe` como um binário JavaScript sandboxado.
- **Kernel Singleton robusto** — gerencia processos, memória, drivers, serviços, system calls e um execution engine real.
- **Sistema de Arquivos persistente (OPFS)** — utiliza a **Origin Private File System API** para I/O de disco de alto desempenho e persistência real (fallback para `localStorage`).
- **Registro do Sistema (Registry)** — suporte completo a hives (`HKLM`, `HKCU`) e tipos de dados reais (`REG_SZ`, `REG_DWORD`, `REG_BINARY`).
- **Gerenciamento de Processos** — PIDs, estados (running, suspended, defunct) e limites de recursos (CPU/RAM).
- **Gerenciador de Janelas (DWM)** — suporte a drag-and-drop, resize em 8 direções, snap layout e z-index dinâmico.
- **BSOD (Tela Azul da Morte)** — disparada por falhas reais de sistema, falta de recursos ou corrupção de arquivos críticos.
- **Ecossistema de Apps** — 9 aplicativos completos e funcionais, incluindo Terminal com 20+ comandos e SDK App Runner.

---

## 🛠️ Stack Tecnológica

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
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

```text
ObsidianOS/
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── Wallpapers/
└── src/
    ├── main.tsx                  # Ponto de entrada React
    ├── App.tsx                   # Orquestrador do OS (BSOD, atalhos, monitoramento)
    ├── index.css                 # CSS global + variáveis + temas
    ├── types/index.ts            # Todas as interfaces TypeScript
    ├── core/
    │   ├── kernel.ts             # Kernel singleton — coração do sistema
    │   ├── appRegistry.ts        # Registro dinâmico de aplicativos
    │   ├── defaultFileSystem.ts  # Filesystem padrão + binários executáveis
    │   ├── defaultRegistry.ts    # Registro padrão do sistema
    │   └── opfsDriver.ts         # Driver de baixo nível para persistência em disco (OPFS)
    ├── stores/
    │   ├── fileSystem.ts         # Mirror reativo do FS do kernel
    │   ├── registry.ts           # Mirror reativo do registry do kernel
    │   ├── processManager.ts     # Mirror reativo dos processos do kernel
    │   ├── windowManager.ts      # Mirror reativo das janelas do kernel
    │   ├── systemStore.ts        # Estado de UI (bootPhase, tema, notificações)
    │   └── contextMenuStore.ts   # Estado do menu de contexto global
    ├── contexts/
    │   └── ProcessContext.tsx    # Contexto de processo por janela
    ├── components/
    │   ├── Boot/                 # BootScreen + BSOD + RecoveryMode
    │   ├── LockScreen/           # Tela de bloqueio / login
    │   ├── Desktop/              # Desktop com ícones e wallpaper
    │   ├── Taskbar/              # Barra de tarefas
    │   ├── StartMenu/            # Menu Iniciar com busca
    │   ├── Window/               # Janela arrastável + WindowRenderer
    │   ├── ContextMenu/          # Menu de contexto global
    │   └── Notifications/        # Sistema de notificações
    └── apps/
        ├── Terminal/
        ├── FileExplorer/
        ├── TaskManager/
        ├── Notepad/
        ├── Calculator/
        ├── Browser/
        ├── Settings/
        ├── Regedit/
        └── SdkAppRunner/
```

---

## 🚀 Como Rodar

```bash
# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173`. O sistema inicia o boot automaticamente.

```bash
# Build de produção
npm run build
```

SPA pura sem backend — pode ser hospedada em qualquer CDN estático (Vercel, Netlify, GitHub Pages).

---

## 🏗️ Arquitetura do Sistema

```text
┌─────────────────────────────────────────┐
│           CAMADA DE APLICATIVOS         │
│  Terminal | Explorer | TaskManager | …  │
├─────────────────────────────────────────┤
│           CAMADA DE COMPONENTES         │
│  Desktop | Taskbar | StartMenu | Window │
├─────────────────────────────────────────┤
│         CAMADA DE STORES (Mirrors)      │
│  fileSystem | registry | processManager │
│  windowManager | systemStore            │
├─────────────────────────────────────────┤
│         CAMADA DO KERNEL (Singleton)    │
│  kernel.ts — fonte da verdade de tudo   │
└─────────────────────────────────────────┘
```

Todos os Zustand stores operam como **mirrors reativos** do kernel. A fonte da verdade do estado e da lógica vive inteiramente no `Kernel` singleton. Os stores refletem o estado via eventos (`kernel.on('reset', ...)`, `kernel.on('system:snapshot', ...)`). Isso garante que o estado do SO não dependa do ciclo de vida dos componentes React.

---

### Kernel (`src/core/kernel.ts`)

Singleton clássico — uma única instância em toda a aplicação.

#### Responsabilidades

| Sistema | Função |
|---------|--------|
| **BIOS / Boot** | Executa `powerOn()`, roda `bootmgr.exe` como binário real |
| **Execution Engine** | Executa arquivos `.exe` do filesystem como scripts JS em sandbox |
| **Logging** | 6 níveis: `DEBUG`, `INFO`, `WARN`, `ERROR`, `CRITICAL`, `FATAL` |
| **Recursos** | CPU, RAM e disco gerenciados em tempo real |
| **Drivers** | Registra e consulta drivers carregados (ex: `ntfs.sys`, `disk.sys`) |
| **Serviços** | Gerencia processos de segundo plano (ex: `svchost.exe`, `spoolsv.exe`) |
| **BSOD** | Dispara tela azul com stop code e informações técnicas |
| **Eventos** | Sistema pub/sub interno (`on`, `once`, `emit`, `off`) |
| **Filesystem** | CRUD do VFS com persistencia via OPFS ou LocalStorage |
| **Registry** | CRUD do registro do sistema com suporte a hives reais |
| **Processos** | Criação, encerramento e monitoramento de PIDs |
| **Janelas** | Orquestração do z-pos, foco e geometria das janelas |
| **App Discovery** | Varre `System32` por manifestos JSON e auto-registra os apps |

#### Fases do Boot (`BootPhase`)

```text
OFF → BIOS_POST → BIOS_HARDWARE → BOOTLOADER → KERNEL_INIT → DRIVER_LOAD
    → SERVICE_INIT → SHELL_INIT → DESKTOP_READY
    → BOOT_FAILURE | BSOD
```

#### API pública principal

```typescript
kernel.powerOn()                   // Inicia o boot (BIOS → bootmgr.exe)
kernel.finalizeBoot()              // Chamado pelo bootmgr.exe ao terminar
kernel.loadShell()                 // Carrega explorer.exe + descobre apps
kernel.on(event, callback)         // Subscrição de eventos
kernel.log(level, source, message) // Logging (FATAL → BSOD automático)
kernel.triggerBSOD(info)           // Dispara BSOD manually
kernel.allocateMemory(mb, name)    // Aloca RAM virtual
kernel.createProcess(...)          // Cria processo na tabela do kernel
kernel.openWindow(config)          // Abre instância de app
kernel.fsGetNode(path)             // Lê nó do filesystem (VFS)
kernel.regGetValue(path)           // Lê valor do registro
kernel.reset()                     // Reseta estado (reboot)
```

---

### Execution Engine

O kernel possui um **execution engine** que executa arquivos `.exe` do filesystem como scripts JavaScript reais dentro de um sandbox (`new Function`).

Cada binário recebe o objeto `OS` com a API do sistema:

```javascript
OS.addBootLog(msg)       // Escreve no log de boot (BIOS mode)
OS.setBootPhase(phase)   // Muda fase do boot
OS.finalizeBoot()        // Sinaliza fim do boot ao kernel
OS.readFile(path)        // Lê arquivo do VFS
OS.writeFile(path, c)    // Escreve arquivo no VFS
OS.createProcess(...)    // Cria processo paralelo
OS.allocateMemory(mb, n) // Aloca RAM virtual
OS.wait(ms)              // Aguarda (async sleep)
```

O SDK em `C:\ObsidianOS\SDK\lib\obsidian.js` é automaticamente injetado antes de cada execução.

---

### Fluxo de Boot

O boot é inteiramente orquestrado pelo kernel via handoff de baixo nível.

```text
1. Power ON: BootScreen monta e chama kernel.powerOn().
2. BIOS POST:
   - Validação de hardware e memória.
   - Montagem do disco via opfsDriver (se disponível).
   - fsRepairSystemFiles() garante que os binários críticos estão íntegros.
3. BOOTLOADER:
   - Kernel localiza e executa C:\ObsidianOS\System32\bootmgr.exe.
   - bootmgr.exe roda em um thread simulado (via code execution engine).
4. KERNEL HANDOVER:
   - bootmgr.exe carrega drivers críticos (ntfs.sys, display.sys).
   - Registra serviços base e chama OS.finalizeBoot().
5. SHELL LOADING:
   - kernel.loadShell() executa o processo explorer.exe.
   - App Discovery (scanSystemApps) varre o disco por manifestos JSON.
6. LOGIN UI:
   - Transição para LockScreen -> Login do usuário.
7. DESKTOP READY:
   - Desktop UI renderizado após sysLogin().
```

**Auto-Repair:** Se `bootmgr.exe` for corrompido ou deletado, o Kernel detecta a falha e dispara o **Sistema de Auto-Reparo**, que tenta restaurar os binários do sistema a partir de uma "shadow copy" íntegra.

---

### Sistema de Arquivos Virtual (VFS)

O `Kernel` gerencia o VFS internamente com suporte a escrita direta em disco via **OPFS (Origin Private File System)**. Isso permite que arquivos criados ou modificados persistam mesmo se o cache do navegador for limpo.

O Zustand store (`fileSystem.ts`) é apenas uma "vista" reativa que ouve os snapshots do Kernel.

#### Tipos de executáveis

| Tipo | `content` | Uso |
|------|-----------|-----|
| `makeSysExe` | String PE32+ | DLLs e arquivos internos de sistema |
| `makeAppExe` | JSON Manifest | Apps React descobertos dinamicamente |
| `makeBinaryExe` | Código JS | Scripts executáveis reais (ex: `ping.exe`) |

---

### Registro do Sistema

Gerido pelo kernel, persistido em `obsidianos-registry-v2`. Suporta todos os tipos reais do Windows:

`REG_SZ` · `REG_DWORD` · `REG_BINARY` · `REG_MULTI_SZ` · `REG_EXPAND_SZ` · `REG_QWORD`

Hives: `HKEY_LOCAL_MACHINE` · `HKEY_CURRENT_USER` · `HKEY_CLASSES_ROOT` · `HKEY_USERS` · `HKEY_CURRENT_CONFIG`

---

## 🖼️ Componentes da Interface

### Boot Screen
Exibe logs de hardware em modo BIOS e o spinner gráfico clássico durante o carregamento do Shell.

### BSOD
Fiel ao Windows 11. Barra de progresso do memory dump baseada na RAM real alocada pelo kernel. Gera arquivos `.DMP` em `C:\ObsidianOS\System32\Minidump\`.

### Lock Screen
Interface moderna com relógio dinâmico e transição fluida para login.

### Desktop & Taskbar
Ambiente multitarefa completo. Suporte a atalhos de teclado (ex: `Ctrl+Shift+Esc`), wallpapers dinâmicos e área de notificações.

---

## 📦 Aplicativos Integrados

| App | appId | Descrição |
|-----|-------|-----------|
| Terminal | `terminal` | 20+ comandos, histórico (↑↓), autocompletar (Tab) |
| Explorador de Arquivos | `file-explorer` | Gerenciamento de arquivos e navegação real no VFS |
| Gerenciador de Tarefas | `task-manager` | Gráficos de CPU/RAM e kills de processos reais |
| Bloco de Notas | `notepad` | Editor de texto simples com integração ao VFS |
| Calculadora | `calculator` | Aplicação matemática completa |
| Navegador | `browser` | Navegador interno com suporte a sandbox |
| Configurações | `settings` | Personalização de sistema, temas e hardware |
| Editor do Registro | `regedit` | Interface visual para manipulação das Hives do SO |
| SDK App Runner | `sdk-runner` | Ambiente para executar apps experimentais do SDK |

---

## 🔥 Mecânicas de Realismo

### Corrupção de Sistema
Deletar arquivos críticos como `gdi32.dll` ou `user32.dll` causa instabilidade visual e BSOD progressiva após alguns segundos.

### Gestão de Memória
A RAM é alocada dinamicamente pelos processos. Se a alocação exceder o limite (8GB por padrão), o sistema dispara uma BSOD de `MEMORY_MANAGEMENT`.

### Recovery Mode
Se o sistema falhar consecutivamente por 3 vezes durante o boot, ele entra automaticamente em **Modo de Recuperação**, permitindo um `Format Disk` completo.

---

## 🔧 Como Adicionar um Novo Aplicativo

1. **Crie o componente React** em `src/apps/MeuApp/`.
2. **Registre o lazy import** em `appRegistry.ts`.
3. **Adicione o executável** (Manifest JSON) em `defaultFileSystem.ts`.
4. O Kernel fará o **App Discovery** automaticamente no próximo boot.

---

## 📦 Scripts

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção (tsc + vite)
npm run lint     # ESLint
npm run preview  # Preview do build local
```
