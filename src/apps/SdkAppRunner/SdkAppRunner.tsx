// ============================================
// SDK App Runner - Executes .exe SDK binaries
// ============================================
import { useEffect, useRef, useState } from 'react';
import { kernel } from '../../core/kernel';
import './SdkAppRunner.css';

interface OutputLine {
  text: string;
  type: 'stdout' | 'stderr' | 'system';
}

interface SdkAppRunnerProps {
  windowId: string;
}

export default function SdkAppRunner({ windowId }: SdkAppRunnerProps) {
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(true);
  const outputRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const win = kernel.getWindow(windowId);
    if (!win) return;

    const pid = win.processId;
    const binaryPath: string | undefined = win.params?.binaryPath;

    if (!binaryPath) {
      setTimeout(() => {
        setLines([{ text: 'Error: No binaryPath provided in window params.', type: 'stderr' }]);
        setRunning(false);
      }, 0);
      return;
    }

    const addLine = (text: string, type: OutputLine['type']) => {
      setLines(prev => [...prev, { text, type }]);
    };

    addLine(`Executing: ${binaryPath}`, 'system');

    const offStdout = kernel.on('process:stdout', ({ pid: p, message }: { pid: number; message: string }) => {
      if (p === pid) addLine(message, 'stdout');
    });

    const offStderr = kernel.on('process:stderr', ({ pid: p, message }: { pid: number; message: string }) => {
      if (p === pid) addLine(message, 'stderr');
    });

    const offTerminated = kernel.on('process:terminated', (terminatedPid: number) => {
      if (terminatedPid === pid) {
        addLine('Process exited.', 'system');
        setRunning(false);
      }
    });

    kernel.executeBinary(pid, binaryPath);

    return () => {
      offStdout();
      offStderr();
      offTerminated();
    };
  }, [windowId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="sdk-runner">
      <div className="sdk-runner__output" ref={outputRef}>
        {lines.map((line, i) => (
          <p key={i} className={`sdk-runner__line sdk-runner__line--${line.type}`}>
            {line.text}
          </p>
        ))}
      </div>
      <div className="sdk-runner__status">
        <span className={`sdk-runner__dot ${!running ? 'sdk-runner__dot--done' : ''}`} />
        {running ? 'Running...' : 'Process exited'}
      </div>
    </div>
  );
}
