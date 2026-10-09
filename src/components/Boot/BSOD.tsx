import { useEffect, useRef, useState } from 'react';
import { useFileSystem } from '../../stores/fileSystem';
import kernel, { type BSODInfo } from '../../core/kernel';
import './BSOD.css';

interface BSODProps {
  info: BSODInfo;
}

interface CascadeEvent {
  processName: string;
  pid: number;
  stopCode: string;
  technical: string;
  current: number;
  total: number;
}

interface CascadeStartEvent {
  rootCause: string;
  totalSteps: number;
  stopCode: string;
}

export default function BSOD({ info }: BSODProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  // Cascade state
  const [cascadeActive, setCascadeActive] = useState(false);
  const [cascadePhase, setCascadePhase] = useState(0); // 0=none, 1=flicker, 2=distort, 3=full
  const [failedProcesses, setFailedProcesses] = useState<string[]>([]);
  const [totalCascadeSteps, setTotalCascadeSteps] = useState(0);
  const [glitchLines, setGlitchLines] = useState<number[]>([]);
  const [screenShake, setScreenShake] = useState(false);

  // Listen to cascade events
  useEffect(() => {
    const unsubStart = kernel.on('cascade:start', (evt: CascadeStartEvent) => {
      setCascadeActive(true);
      setTotalCascadeSteps(evt.totalSteps);
      setFailedProcesses([]);
      setCascadePhase(1);
    });

    const unsubStep = kernel.on('cascade:step', (evt: CascadeEvent) => {
      setFailedProcesses(prev => [...prev, evt.processName]);
      const newCount = evt.current;
      const total = evt.total;

      // Progressive degradation
      if (newCount >= Math.ceil(total * 0.7)) {
        setCascadePhase(3); // full distortion
        setScreenShake(true);
      } else if (newCount >= Math.ceil(total * 0.3)) {
        setCascadePhase(2); // medium distortion
      }

      // Generate random glitch lines
      const newLines = Array.from({ length: Math.min(newCount * 2, 15) }, () =>
        Math.random() * window.innerHeight
      );
      setGlitchLines(newLines);
    });

    const unsubComplete = kernel.on('cascade:complete', () => {
      setCascadePhase(3);
      setScreenShake(false);
    });

    return () => {
      unsubStart();
      unsubStep();
      unsubComplete();
    };
  }, []);

  // Memory dump logic
  useEffect(() => {
    let isMounted = true;
    let dumped = 0;
    const totalMemoryMB = Math.max(1, kernel.resources.usedMemory);
    const chunkMB = Math.max(0.5, totalMemoryMB / 50);
    const fs = useFileSystem.getState();

    const dumpDir = 'C:\\ObsidianOS\\System32\\Minidump';
    if (!fs.exists(dumpDir)) fs.createDirectory('C:\\ObsidianOS\\System32', 'Minidump');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpFile = `MEMORY_${timestamp}.DMP`;
    let dumpContent = `=== ObsidianOS Kernel Dump ===\n`;
    dumpContent += `STOP_CODE: ${info.stopCode}\n`;
    dumpContent += `FAILED_COMPONENT: ${info.failedComponent}\n`;
    dumpContent += `BUG_CHECK: ${info.bugCheckCode}\n`;
    dumpContent += `DETAIL: ${info.technicalInfo || ''}\n`;
    if (failedProcesses.length > 0) {
      dumpContent += `CASCADE_CHAIN: ${failedProcesses.join(' → ')}\n`;
    }
    dumpContent += `\n`;

    const iterateDump = () => {
      if (!isMounted) return;
      dumped += chunkMB;
      const hexLine = Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')
      ).join(' ');
      dumpContent += `${Math.floor(dumped * 1024).toString(16).padStart(8, '0')}  ${hexLine}\n`;

      if (dumped >= totalMemoryMB) {
        setProgress(100);
        fs.createFile(dumpDir, dumpFile, dumpContent, 'DMP');
        const prev = parseInt(localStorage.getItem('obsidianos_crash_count') ?? '0', 10);
        localStorage.setItem('obsidianos_crash_count', String(prev + 1));
        if (isMounted) {
          setTimeout(() => window.location.reload(), 3000);
        }
      } else {
        setProgress(Math.floor((dumped / totalMemoryMB) * 100));
        setTimeout(iterateDump, 50);
      }
    };

    setTimeout(iterateDump, 500);
    return () => { isMounted = false; };
  }, [info, failedProcesses]);

  // GDI Canvas Renderer loop with cascade visual effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const resize = () => {
       canvas.width = window.innerWidth;
       canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const draw = () => {
       frameCount++;
       const w = canvas.width;
       const h = canvas.height;

       // ── Base blue screen ──
       // Color shifts with cascade phase
       let r = 0, g = 120, b = 215; // #0078D7
       if (cascadePhase === 1) {
         // Subtle flicker
         const flicker = Math.sin(frameCount * 0.3) * 15;
         r = Math.max(0, Math.min(255, r + flicker));
         g = Math.max(0, Math.min(255, g + flicker));
         b = Math.max(0, Math.min(255, b + flicker));
       } else if (cascadePhase === 2) {
         // Red tint creeping in
         const tint = Math.sin(frameCount * 0.05) * 30;
         r = Math.min(255, r + tint + 40);
         g = Math.max(0, g - tint - 20);
         b = Math.max(0, b - tint);
       } else if (cascadePhase === 3) {
         // Deep error red-blue
         r = Math.min(255, 80 + Math.sin(frameCount * 0.08) * 30);
         g = Math.max(0, 40 + Math.sin(frameCount * 0.12) * 20);
         b = Math.max(0, 150 + Math.sin(frameCount * 0.06) * 30);
       }

       ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
       ctx.fillRect(0, 0, w, h);

       // ── Screen shake ──
       if (screenShake) {
         const shakeX = (Math.random() - 0.5) * 6;
         const shakeY = (Math.random() - 0.5) * 6;
         ctx.save();
         ctx.translate(shakeX, shakeY);
       }

       // ── Glitch lines (horizontal scan lines) ──
       if (cascadePhase >= 2) {
         for (const lineY of glitchLines) {
           const lineH = 1 + Math.random() * 3;
           const shift = (Math.random() - 0.5) * 40;
           ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.06})`;
           ctx.fillRect(shift, lineY, w, lineH);
         }
       }

       // ── Random pixel corruption (phase 3 only) ──
       if (cascadePhase === 3 && frameCount % 3 === 0) {
         const blockCount = 3 + Math.floor(Math.random() * 5);
         for (let i = 0; i < blockCount; i++) {
           const bx = Math.random() * w;
           const by = Math.random() * h;
           const bw = 20 + Math.random() * 100;
           const bh = 2 + Math.random() * 8;
           ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.1})`;
           ctx.fillRect(bx, by, bw, bh);
         }
       }

       // ── Scan lines overlay ──
       if (cascadePhase >= 1) {
         for (let y = 0; y < h; y += 3) {
           ctx.fillStyle = 'rgba(0,0,0,0.04)';
           ctx.fillRect(0, y, w, 1);
         }
       }

       // ── Flicker overlay (phase 1) ──
       if (cascadePhase === 1 && frameCount % 8 < 2) {
         ctx.fillStyle = 'rgba(255,255,255,0.02)';
         ctx.fillRect(0, 0, w, h);
       }

       // ── Face ──
       ctx.fillStyle = '#ffffff';
       ctx.font = '120px "Segoe UI", Arial, sans-serif';
       ctx.fillText(':(', w * 0.15, h * 0.3);

       // ── Main text ──
       ctx.font = '32px "Segoe UI", Arial, sans-serif';
       ctx.fillText('Seu componente ObsidianOS encontrou um problema e', w * 0.15, h * 0.45);
       ctx.fillText('precisa ser reiniciado.', w * 0.15, h * 0.5);

       ctx.font = '24px "Segoe UI", Arial, sans-serif';
       ctx.fillText('Estamos coletando algumas informações sobre o erro e, em seguida,', w * 0.15, h * 0.6);
       ctx.fillText('reiniciaremos para você.', w * 0.15, h * 0.64);

       // ── Cascade progress display ──
       if (cascadeActive && failedProcesses.length < totalCascadeSteps) {
         ctx.font = '22px "Segoe UI", Arial, sans-serif';
         ctx.fillStyle = '#ffcccc';
         ctx.fillText(`⚠ Cascade failure: ${failedProcesses.length}/${totalCascadeSteps} dependents failed`, w * 0.15, h * 0.69);
         if (failedProcesses.length > 0) {
           ctx.font = '16px "Consolas", monospace';
           ctx.fillStyle = 'rgba(255,200,200,0.8)';
           ctx.fillText(`Last: ${failedProcesses[failedProcesses.length - 1]}`, w * 0.15, h * 0.72);
         }
         ctx.fillStyle = '#ffffff';
       }

       // ── Progress ──
       ctx.font = '28px "Segoe UI", Arial, sans-serif';
       ctx.fillStyle = '#ffffff';
       ctx.fillText(`${progress}% concluído`, w * 0.15, h * 0.72);

       // ── Technical box ──
       ctx.font = '16px "Segoe UI", Consolas, monospace';
       const startY = h * 0.82;
       ctx.fillText('*** TECHNICAL INFORMATION ***', w * 0.15, startY);
       ctx.fillText(`STOP_CODE: ${info.stopCode || 'CRITICAL_PROCESS_DIED'}`, w * 0.15, startY + 25);
       ctx.fillText(`FAILED_COMPONENT: ${info.failedComponent || 'Unknown'}`, w * 0.15, startY + 50);
       ctx.fillText(`BUG CHECK CODE: ${info.bugCheckCode || '0x00000000'}`, w * 0.15, startY + 75);
        ctx.fillText(`PARAMETERS: ${info.parameters?.join(', ') || '0x0, 0x0, 0x0, 0x0'}`, w * 0.15, startY + 100);
        if (info.technicalInfo) {
          ctx.font = '14px "Consolas", monospace';
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          const detail = String(info.technicalInfo).slice(0, 160);
          ctx.fillText(`DETAIL: ${detail}`, w * 0.15, startY + 122);
          ctx.fillStyle = '#ffffff';
        }

       // ── Cascade chain display ──
       if (failedProcesses.length > 0) {
         ctx.font = '14px "Consolas", monospace';
         ctx.fillStyle = 'rgba(255,200,200,0.9)';
         ctx.fillText(`CASCADE: ${failedProcesses.join(' → ')}`, w * 0.15, startY + 130);
         ctx.fillStyle = '#ffffff';
       }

       // ── QR code ──
       const qrRootX = w * 0.15 + 600;
       const qrRootY = startY;
       ctx.fillStyle = '#ffffff';
       ctx.fillRect(qrRootX, qrRootY, 110, 110);
       ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
       ctx.fillRect(qrRootX + 10, qrRootY + 10, 30, 30);
       ctx.fillRect(qrRootX + 70, qrRootY + 10, 30, 30);
       ctx.fillRect(qrRootX + 10, qrRootY + 70, 30, 30);

       ctx.fillStyle = '#ffffff';
       ctx.font = '14px "Segoe UI", Arial, sans-serif';
       ctx.fillText('Para obter mais informações,', qrRootX + 140, qrRootY + 20);
       ctx.fillText('visite: obsidianos.org/stopcode', qrRootX + 140, qrRootY + 40);

       if (screenShake) ctx.restore();
    };

    const interval = setInterval(draw, 1000 / 30); // 30fps for smoother glitches
    draw();

    return () => {
       window.removeEventListener('resize', resize);
       clearInterval(interval);
    };
  }, [info, progress, cascadeActive, cascadePhase, failedProcesses, totalCascadeSteps, glitchLines, screenShake]);

  return (
    <div className="bsod-container" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100vw', height: '100vh', cursor: 'none' }} />
    </div>
  );
}
