// ============================================
// Blue Screen of Death (BSOD)
// ============================================
import { useEffect, useState } from 'react';
import { useFileSystem } from '../../stores/fileSystem';
import kernel, { type BSODInfo } from '../../core/kernel';
import './BSOD.css';

interface BSODProps {
  info: BSODInfo;
}

export default function BSOD({ info }: BSODProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let dumped = 0;
    
    // The amount of memory to "dump" based on real kernel usage (MB)
    // We limit max dump size artificially to avoid blocking the browser forever,
    // but the progress will represent the real kernel memory proportion
    const totalMemoryMB = Math.max(1, kernel.resources.usedMemory);
    
    // Chunk size (MB per step)
    const chunkMB = Math.max(0.5, totalMemoryMB / 50); // Will take ~50 steps or fewer

    const fs = useFileSystem.getState();

    // Prepare dump directory
    const dumpDir = 'C:\\ObsidianOS\\System32\\Minidump';
    if (!fs.exists(dumpDir)) {
      fs.createDirectory('C:\\ObsidianOS\\System32', 'Minidump');
    }

    // Create dump file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpFile = `MEMORY_${timestamp}.DMP`;
    let dumpContent = `=== ObsidianOS Kernel Dump ===\nSTOP_CODE: ${info.stopCode}\nFAILED_COMPONENT: ${info.failedComponent}\n\n`;

    const iterateDump = () => {
      if (!isMounted) return;

      dumped += chunkMB;
      
      // Accumulate some "binary" garbage to the dump file
      // Emulating a real memory dump writing process
      const hexLine = Array.from({ length: 8 }, () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')).join(' ');
      dumpContent += `${Math.floor(dumped * 1024).toString(16).padStart(8, '0')}  ${hexLine}\n`;

      if (dumped >= totalMemoryMB) {
        dumped = totalMemoryMB;
        setProgress(100);
        
        // Finalize the file save to the real virtual filesystem
        fs.createFile(dumpDir, dumpFile, dumpContent, 'DMP');
        
        setTimeout(() => {
          localStorage.setItem('obsidianos_crashed', '1');
          if (isMounted) window.location.reload();
        }, 3000);
      } else {
        setProgress(Math.floor((dumped / totalMemoryMB) * 100));
        // Continue dumping next frame/timeout to not block UI thread
        setTimeout(iterateDump, 50); // Faster/Slower dump depending on chunk
      }
    };

    // Start dumping
    setTimeout(iterateDump, 500);

    return () => {
      isMounted = false;
    };
  }, [info]);

  return (
    <div className="bsod-container">
      <div className="bsod-content">
        <div className="bsod-face">:(</div>
        <h1>Seu componente ObsidianOS encontrou um problema e precisa ser reiniciado.</h1>
        <p className="bsod-collecting">
          Estamos coletando algumas informações sobre o erro e, em seguida, reiniciaremos para você.
        </p>
        <p className="bsod-progress">{progress}% concluído</p>
        
        <div className="bsod-details-box">
          <div className="bsod-qr">
            <svg viewBox="0 0 100 100" fill="white">
              <rect width="100" height="100" fill="transparent" stroke="white" strokeWidth="1" />
              <path d="M10 10 h30 v30 h-30 z M20 20 h10 v10 h-10 z M60 10 h30 v30 h-30 z M70 20 h10 v10 h-10 z M10 60 h30 v30 h-30 z M20 70 h10 v10 h-10 z" />
              <path d="M50 10 h10 v10 h-10 z M50 30 h10 v10 h-10 z M10 50 h10 v10 h-10 z M30 50 h10 v10 h-10 z M50 50 h10 v10 h-10 z M70 50 h10 v10 h-10 z M90 50 h10 v10 h-10 z M50 70 h10 v10 h-10 z M70 70 h10 v10 h-10 z M90 70 h20 v20 h-20 z" />
            </svg>
          </div>
          <div className="bsod-text-details">
            <p>Para obter mais informações sobre esse problema e correções possíveis, visite<br/>https://www.obsidianos.org/stopcode</p>
            <br/>
            <p>Se você ligar para o suporte, forneça as seguintes informações:</p>
            <p className="bsod-stopcode">Código de parada: {info.stopCode}</p>
            <p className="bsod-failed">O que falhou: {info.failedComponent}</p>
          </div>
        </div>
        
        <div className="bsod-tech-inner">
          <p>*** TECHNICAL INFORMATION ***</p>
          <p>BUG CHECK CODE: {info.bugCheckCode}</p>
          <p>PARAMETERS: {info.parameters.join(', ')}</p>
          <p>INFO: {info.technicalInfo}</p>
        </div>
      </div>
    </div>
  );
}
