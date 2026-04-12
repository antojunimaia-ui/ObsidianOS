import { useState, useRef, useEffect } from 'react';
import { useWindowManager } from '../../stores/windowManager';
import { useFileSystem } from '../../stores/fileSystem';
import { useProcess } from '../../contexts/ProcessContext';
import kernel from '../../core/kernel';
import './ObsidianCode.css';

export default function ObsidianCode({ windowId }: { windowId: string }) {
  const { pid } = useProcess();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const { getWindow, updateWindowTitle } = useWindowManager();
  const { getNode, updateFileContent, createFile } = useFileSystem();
  const [content, setContent] = useState(`// Meu script executável
StdIO.print("🚀 Executando no ObsidianOS!");
await Proc.wait(500);
StdIO.print("Tudo certo, finalizando...");
Proc.exit(0);
`);
  const [fileName, setFileName] = useState('script.exe');
  const [filePath, setFilePath] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<{msg: string, type: string}[]>([]);
  const [runnerPid, setRunnerPid] = useState<number | null>(null);

  useEffect(() => {
    updateWindowTitle(windowId, `Obsidian Code - ${fileName}${isModified ? '*' : ''}`);
  }, [fileName, isModified, windowId, updateWindowTitle]);

  // Carrega se aberto via duplo clique num arquivo .exe
  useEffect(() => {
    const win = getWindow(windowId);
    if (win?.params?.filePath) {
      const path = win.params.filePath;
      const node = getNode(path);
      if (node && node.type === 'file') {
        setContent(node.content || '');
        setFileName(node.name);
        setFilePath(path);
        setIsModified(false);
      }
    }
  }, [windowId, getWindow, getNode]);

  // Escuta os eventos de terminal globais e filtra para o app atual!
  useEffect(() => {
    const unsubOut = kernel.on('process:stdout', (data: { pid: number, message: string }) => {
      // Usamos função callback de estado para garantir o listener fresco e com runnerPid de fechamento correto
      setRunnerPid(currentPid => {
        if (currentPid === data.pid) {
          setConsoleOutput(prev => [...prev, { msg: data.message, type: 'out' }]);
        }
        return currentPid;
      });
    });

    const unsubErr = kernel.on('process:stderr', (data: { pid: number, message: string }) => {
      setRunnerPid(currentPid => {
        if (currentPid === data.pid) {
          setConsoleOutput(prev => [...prev, { msg: data.message, type: 'err' }]);
        }
        return currentPid;
      });
    });

    const unsubExit = kernel.on('process:terminated', (terminatedPid: number) => {
      setRunnerPid(currentPid => {
        if (currentPid === terminatedPid) {
          setIsRunning(false);
          setConsoleOutput(prev => [...prev, { msg: `[Processo finalizado]`, type: 'sys' }]);
          return null;
        }
        return currentPid;
      });
    });
    
    return () => {
      unsubOut();
      unsubErr();
      unsubExit();
    };
  }, []); // runnerPid injetado dinamicamente

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsModified(true);
  };

  const handleSave = () => {
    let finalPath = filePath;
    if (filePath) {
      updateFileContent(filePath, content);
    } else {
        finalPath = `C:\\Users\\User\\Documents\\${fileName}`;
      createFile('C:\\Users\\User\\Documents', fileName, content, 'exe');
      setFilePath(finalPath);
    }
    
    // Hackerismo genial: para o Kernel saber que é JS e não um binário corrompido, setamos a string mágica:
    const nd = kernel.fsGetNode(finalPath);
    if(nd) {
      if(!nd.metadata) nd.metadata = {};
      nd.metadata.type = 'binary_executable';
      // Forçamos o trigger do kernel que avisa que o arquivo foi atualizado
      kernel.emit('fs:updated', null);
    }
    
    setIsModified(false);
  };

  const handleRun = () => {
    handleSave();
    const targetPath = filePath || `C:\\Users\\User\\Documents\\${fileName}`;
    if (!kernel.fsGetNode(targetPath)) return;
    
    setConsoleOutput([{ msg: `[Executando ${targetPath}...]`, type: 'sys' }]);
    setIsRunning(true);
    
    // Inicia o processo dentro da VM!!
    const execPid = kernel.createProcess(fileName, `Running ${fileName}`, '⚡', undefined, targetPath, []);
    setRunnerPid(execPid);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="obsidian-code">
      <div className="obsidian-code-toolbar">
        <button className="code-btn" onClick={handleSave}>💾 Salvar</button>
        <button className="code-btn code-run-btn" onClick={handleRun} disabled={isRunning}>
          {isRunning ? '⏳ Rodando...' : '▶️ Executar'}
        </button>
      </div>
      <div className="obsidian-code-editor">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="code-textarea"
        />
      </div>
      <div className="obsidian-code-console" ref={consoleRef}>
        {consoleOutput.length === 0 && <span style={{color: '#666'}}>Aguardando execução...</span>}
        {consoleOutput.map((l, i) => (
           <div key={i} style={{ color: l.type === 'err' ? '#f48771' : l.type === 'sys' ? '#888' : '#fff' }}>
             {l.msg}
           </div>
        ))}
      </div>
      <div className="obsidian-code-statusbar">
        <span>PID: {pid} {runnerPid ? `| Sub-PID: ${runnerPid}` : ''} | {isRunning ? 'Rodando' : 'Pronto'}</span>
        <span>{filePath || 'Não Salvo (C:\\Users\\User\\Documents\\script.exe)'}</span>
      </div>
    </div>
  );
}
