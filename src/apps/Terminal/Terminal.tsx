// ============================================
// Terminal App
// ============================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { useFileSystem } from '../../stores/fileSystem';
import { useRegistry } from '../../stores/registry';
import { useWindowManager } from '../../stores/windowManager';
import { useProcessManager } from '../../stores/processManager';
import type { Process } from '../../types';
import kernel from '../../core/kernel';
import './Terminal.css';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
}

export default function TerminalApp({ windowId }: { windowId: string }) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', content: 'ObsidianOS [Version 24H2 Build 26100]' },
    { type: 'system', content: '(c) Obsidian Corporation. Todos os direitos reservados.' },
    { type: 'system', content: '' },
  ]);
  const [input, setInput] = useState('');
  const [currentPath, setCurrentPath] = useState('C:\\Users\\User');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { getNode, getChildren, createFile, createDirectory, deleteNode } = useFileSystem();
  const { hives } = useRegistry();
  const processes = useProcessManager(s => s.processes);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  const addOutput = useCallback((content: string, type: TerminalLine['type'] = 'output') => {
    setLines(prev => [...prev, { type, content }]);
  }, []);

  // Listen for real binary output
  useEffect(() => {
    const unsubOut = kernel.on('process:stdout', (data: { pid: number, message: string }) => {
      addOutput(data.message, 'output');
    });
    const unsubErr = kernel.on('process:stderr', (data: { pid: number, message: string }) => {
      addOutput(data.message, 'error');
    });

    return () => {
      unsubOut();
      unsubErr();
    };
  }, [addOutput]);

  const { getWindow } = useWindowManager();
  const executeCommandRef = useRef<((c: string) => void) | null>(null);

  // Handle initial command from window params
  useEffect(() => {
    const win = getWindow(windowId);
    if (win?.params?.command && executeCommandRef.current) {
       executeCommandRef.current(win.params.command);
    }
  }, [windowId, getWindow]);

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    setLines(prev => [...prev, { type: 'input', content: `${currentPath}> ${trimmed}` }]);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        addOutput('Comandos disponíveis:');
        addOutput('  dir / ls          - Listar conteúdo do diretório');
        addOutput('  cd <caminho>      - Mudar diretório');
        addOutput('  cls / clear       - Limpar tela');
        addOutput('  echo <texto>      - Exibir texto');
        addOutput('  type <arquivo>    - Mostrar conteúdo de arquivo');
        addOutput('  mkdir <nome>      - Criar diretório');
        addOutput('  touch <nome>      - Criar arquivo');
        addOutput('  del <nome>        - Deletar arquivo/pasta');
        addOutput('  pwd               - Mostra diretório atual');
        addOutput('  whoami            - Mostra usuário atual');
        addOutput('  hostname          - Mostra nome do computador');
        addOutput('  date              - Mostra data e hora');
        addOutput('  tasklist          - Listar processos');
        addOutput('  systeminfo        - Informações do sistema');
        addOutput('  ver               - Versão do sistema');
        addOutput('  reg query <chave> - Consultar registro');
        addOutput('  color <cor>       - Mudar cor do terminal');
        addOutput('  tree              - Árvore de diretórios');
        addOutput('  ipconfig          - Configuração de rede');
        addOutput('  ping <host>       - Ping');
        addOutput('  neofetch          - Exibir informações do sistema com logo');
        break;

      case 'dir':
      case 'ls': {
        const children = getChildren(currentPath);
        if (children.length === 0) {
          addOutput('  O diretório está vazio.');
        } else {
          addOutput(` Diretório de ${currentPath}`);
          addOutput('');
          children.forEach(c => {
            const date = new Date(c.modifiedAt).toLocaleDateString('pt-BR');
            const time = new Date(c.modifiedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const sizeStr = c.type === 'directory' ? '<DIR>    ' : c.size.toString().padStart(9);
            addOutput(`${date}  ${time}    ${sizeStr}  ${c.name}`);
          });
          const files = children.filter(c => c.type === 'file');
          const dirs = children.filter(c => c.type === 'directory');
          addOutput(`               ${files.length} arquivo(s)   ${dirs.length} pasta(s)`);
        }
        break;
      }

      case 'cd': {
        // Allow spaces in path if unquoted, though normally args[0] might be split. Wait, args is split by space. Let's just use args[0] for now since they typed \ObsidianOS\System32
        if (!args[0] || args[0] === '.') break;
        if (args[0] === '..') {
          const parent = currentPath.split('\\').slice(0, -1).join('\\');
          if (parent) setCurrentPath(parent);
          break;
        }
        if (args[0] === '\\' || args[0] === '/') { setCurrentPath('C:'); break; }
        
        let newPath = '';
        let targetPath = args[0].replace(/\//g, '\\');
        if (targetPath.endsWith('\\') && targetPath.length > 1) {
          targetPath = targetPath.slice(0, -1);
        }

        // Absolute path with drive letter
        if (targetPath.includes(':')) {
          newPath = targetPath;
        } 
        // Absolute path from root
        else if (targetPath.startsWith('\\')) {
          newPath = `C:${targetPath}`;
        }
        // Relative path
        else {
          newPath = currentPath === 'C:' ? `C:\\${targetPath}` : `${currentPath}\\${targetPath}`;
        }
        
        const node = getNode(newPath);
        if (node && node.type === 'directory') {
          setCurrentPath(newPath);
        } else {
          addOutput(`O sistema não pode encontrar o caminho especificado: ${args[0]}`, 'error');
        }
        break;
      }

      case 'cls':
      case 'clear':
        setLines([]);
        break;

      case 'echo':
        addOutput(args.join(' '));
        break;

      case 'type':
      case 'cat': {
        if (!args[0]) { addOutput('Uso: type <arquivo>', 'error'); break; }
        const filePath = args[0].includes(':') ? args[0] : `${currentPath}\\${args[0]}`;
        const file = getNode(filePath);
        if (!file) {
          addOutput(`O sistema não pode encontrar o arquivo: ${args[0]}`, 'error');
        } else if (file.type === 'directory') {
          addOutput('Acesso negado: é um diretório.', 'error');
        } else {
          addOutput(file.content || '(arquivo vazio)');
        }
        break;
      }

      case 'mkdir':
      case 'md': {
        if (!args[0]) { addOutput('Uso: mkdir <nome>', 'error'); break; }
        createDirectory(currentPath, args[0]);
        addOutput(`Diretório criado: ${args[0]}`);
        break;
      }

      case 'touch': {
        if (!args[0]) { addOutput('Uso: touch <nome>', 'error'); break; }
        createFile(currentPath, args[0], '', args[0].split('.').pop() || 'txt');
        addOutput(`Arquivo criado: ${args[0]}`);
        break;
      }

      case 'del':
      case 'rm': {
        if (!args[0]) { addOutput('Uso: del <nome>', 'error'); break; }
        const delPath = `${currentPath}\\${args[0]}`;
        const node = getNode(delPath);
        if (!node) {
          addOutput(`Não foi possível encontrar: ${args[0]}`, 'error');
        } else {
          deleteNode(delPath);
          addOutput(`Deletado: ${args[0]}`);
        }
        break;
      }

      case 'pwd':
        addOutput(currentPath);
        break;

      case 'whoami':
        addOutput('OBSIDIAN\\User');
        break;

      case 'hostname':
        addOutput('DESKTOP-OBSIDIAN');
        break;

      case 'date':
        addOutput(new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'medium' }));
        break;

      case 'ver':
        addOutput('');
        addOutput('ObsidianOS [Version 24H2 Build 26100.1.amd64fre.ge_release]');
        break;

      case 'tasklist': {
        addOutput('');
        addOutput('Nome da Imagem                   PID   Mem. (MB)  CPU %');
        addOutput('================================ ===== ========== =====');
        processes.forEach((p: Process) => {
          const name = p.name.padEnd(33);
          const pid = p.pid.toString().padStart(5);
          const mem = p.memoryUsage.toFixed(1).padStart(10);
          const cpu = p.cpuUsage.toFixed(1).padStart(5);
          addOutput(`${name}${pid}${mem}${cpu}`);
        });
        break;
      }

      case 'systeminfo':
        addOutput('Nome do Host:              DESKTOP-OBSIDIAN');
        addOutput('Nome do SO:                ObsidianOS Professional');
        addOutput('Versão do SO:              24H2 Build 26100');
        addOutput('Fabricante do SO:          Obsidian Corporation');
        addOutput('Tipo do sistema:           x64-based PC');
        addOutput(`Processadores:             ${navigator.hardwareConcurrency || 8} Processador(es) Instalado(s)`);
        addOutput(`Memória Física Total:      ${((navigator as any).deviceMemory || 8)} GB`);
        addOutput(`Data de Instalação:        ${new Date().toLocaleDateString('pt-BR')}`);
        addOutput(`Hora da Inicialização:     ${new Date().toLocaleTimeString('pt-BR')}`);
        addOutput(`Diretório do Sistema:      C:\\ObsidianOS\\System32`);
        addOutput(`Idioma do Sistema:         pt-BR`);
        break;

      case 'reg': {
        if (args[0] === 'query' && args[1]) {
          const keyPath = args[1];
          const entries = hives[keyPath];
          if (entries) {
            addOutput(`HKEY: ${keyPath}`);
            addOutput('');
            Object.entries(entries).forEach(([name, entry]) => {
              addOutput(`    ${name}    ${entry.type}    ${entry.value}`);
            });
          } else {
            addOutput(`ERRO: O sistema não pôde encontrar a chave de registro especificada.`, 'error');
            addOutput(`Dica: Use reg query HKEY_LOCAL_MACHINE\\SOFTWARE\\ObsidianOS\\CurrentVersion`, 'system');
          }
        } else {
          addOutput('Uso: reg query <caminho_chave>', 'error');
        }
        break;
      }

      case 'tree': {
        const printTree = (path: string, prefix: string) => {
          const children = getChildren(path);
          children.forEach((child, i) => {
            const isLast = i === children.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            addOutput(`${prefix}${connector}${child.name}${child.type === 'directory' ? '/' : ''}`);
            if (child.type === 'directory') {
              printTree(child.path, prefix + (isLast ? '    ' : '│   '));
            }
          });
        };
        addOutput(currentPath);
        printTree(currentPath, '');
        break;
      }

      case 'ipconfig':
        addOutput('');
        addOutput('Configuração de IP do ObsidianOS');
        addOutput('');
        addOutput('Adaptador Ethernet:');
        addOutput('');
        addOutput('   Status da Mídia. . . . . . . : Mídia conectada');
        addOutput('   Endereço IPv4. . . . . . . . : 192.168.1.100');
        addOutput('   Máscara de Sub-rede . . . .  : 255.255.255.0');
        addOutput('   Gateway Padrão. . . . . . .  : 192.168.1.1');
        addOutput('   Servidor DNS. . . . . . . .  : 8.8.8.8');
        break;

      case 'ping': {
        if (!args[0]) { addOutput('Uso: ping <host>', 'error'); break; }
        addOutput(`Disparando ${args[0]} com 32 bytes de dados:`);
        for (let i = 0; i < 4; i++) {
          const time = Math.floor(Math.random() * 20) + 5;
          addOutput(`Resposta de ${args[0]}: bytes=32 tempo=${time}ms TTL=128`);
        }
        addOutput('');
        addOutput(`Estatísticas do Ping para ${args[0]}:`);
        addOutput('    Pacotes: Enviados = 4, Recebidos = 4, Perdidos = 0 (0% de perda)');
        break;
      }

      case 'neofetch': {
        const res = kernel.resources;
        const snapshot = kernel.sysGetSnapshot();
        const uptime = res.uptime;
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = uptime % 60;
        const uptimeStr = `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
        
        const logo = [
          "       .       ",
          "      / \\      ",
          "     /   \\     ",
          "    /     \\    ",
          "   /       \\   ",
          "  /_________\\  ",
          "  \\         /  ",
          "   \\       /   ",
          "    \\     /    ",
          "     \\   /     ",
          "      \\ /      ",
          "       '       "
        ];
        
        const info = [
          `user@obsidianos`,
          "---------------",
          `OS: ObsidianOS Professional 24H2`,
          `Kernel: ObsidianOS-NT v2.4.0`,
          `Uptime: ${uptimeStr}`,
          `Packages: 9 (System32)`,
          `Shell: cmd.obx`,
          `Resolution: ${window.innerWidth}x${window.innerHeight}`,
          `Theme: ${snapshot.theme.mode}`,
          `CPU: ${res.cpuCores} Cores @ 3.2GHz`,
          `Memory: ${Math.round(res.usedMemory)}MB / ${res.totalMemory}MB`
        ];
        
        const maxLen = Math.max(logo.length, info.length);
        addOutput("");
        for (let i = 0; i < maxLen; i++) {
          const l = logo[i] || "               ";
          const infoLine = info[i] || "";
          addOutput(`${l}  ${infoLine}`);
        }
        addOutput("");
        break;
      }

      case 'reboot':
      case 'shutdown':
        addOutput('Sistema reiniciando...', 'system');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        break;

      case 'bsod':
        kernel.triggerBSOD({
          stopCode: 'MANUALLY_INITIATED_CRASH',
          technicalInfo: 'O usuário forçou um travamento do sistema usando o comando bsod.',
          failedComponent: 'Terminal.obx',
          bugCheckCode: '0x000000E2',
          parameters: ['0x00000001']
        });
        break;

      default: {
        // Try to find a real binary in System32 or current path
        const binaryName = command.endsWith('.obx') ? command : `${command}.obx`;
        
        const isAbsolutePath = binaryName.startsWith('C:');
        const paths = isAbsolutePath ? [binaryName] : [`${currentPath}\\${binaryName}`, `C:\\ObsidianOS\\System32\\${binaryName}`];
        
        let foundNode = null;
        let foundPath = '';
        
        for (const p of paths) {
          const node = getNode(p);
          if (node && node.type === 'file') {
            foundNode = node;
            foundPath = p;
            break;
          }
        }

        if (foundNode) {
          addOutput(`Running ${foundPath}...`, 'system');
          kernel.createProcess(command, foundNode.metadata?.description || command, '⚙️', undefined, foundPath, args);
        } else {
          addOutput(`'${command}' não é reconhecido como um comando interno ou externo.`, 'error');
          addOutput(`Digite 'help' para ver os comandos disponíveis.`, 'system');
        }
        break;
      }
    }
  }, [currentPath, addOutput, getNode, getChildren, createFile, createDirectory, deleteNode, processes, hives, kernel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab completion
      if (input) {
        const children = getChildren(currentPath);
        const match = children.find(c => c.name.toLowerCase().startsWith(input.toLowerCase()));
        if (match) setInput(match.name);
      }
    }
  };

  executeCommandRef.current = executeCommand;

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-output" ref={scrollRef}>
        {lines.map((line, i) => (
          <div key={i} className={`terminal-line ${line.type}`}>
            {line.content}
          </div>
        ))}
        <div className="terminal-input-line">
          <span className="terminal-prompt">{currentPath}&gt; </span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
