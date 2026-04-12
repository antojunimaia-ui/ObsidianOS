import { useState, useRef, useEffect } from 'react';
import { useFileSystem } from '../../stores/fileSystem';
import kernel from '../../core/kernel';
import { FiCircle, FiSquare, FiDownload, FiVideo } from 'react-icons/fi';
import './ObsRecord.css';

export default function ObsRecord() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'recording' | 'finished'>('idle');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const { createFile } = useFileSystem();

  useEffect(() => {
    if (isRecording && stream && previewRef.current) {
      previewRef.current.srcObject = stream;
    }
  }, [isRecording, stream]);

  const startRecording = async () => {
    try {
      // Capture the screen/window (preferring current tab)
      const newStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            displaySurface: 'browser',
        } as any,
        audio: true,
        // @ts-ignore - Chrome specific hint
        preferCurrentTab: true,
        selfBrowserSurface: 'include'
      });
      
      setStream(newStream);

      const recorder = new MediaRecorder(newStream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setRecordedChunks(chunks);
        setStatus('finished');
        
        // Stop all tracks
        newStream.getTracks().forEach(track => track.stop());
        setStream(null);
      };

      recorder.start();
      setIsRecording(true);
      setStatus('recording');
      kernel.log('INFO', 'ObsRecord', 'Gravando vídeo da tela...');
    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      kernel.log('ERROR', 'ObsRecord', 'Falha ao acessar dispositivos de gravação.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveToSystem = async () => {
    if (recordedChunks.length === 0) return;
    
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const fileName = `Recording_${new Date().getTime()}.webm`;
      const path = 'C:\\Users\\User\\Videos';
      
      createFile(path, fileName, base64, 'webm');
      kernel.log('INFO', 'ObsRecord', `Vídeo salvo em ${path}\\${fileName}`);
      alert('Vídeo salvo na pasta Vídeos!');
    };
    
    reader.readAsDataURL(blob);
  };

  return (
    <div className="obs-record-container">
      <div className="obs-header">
        <div className="obs-title">
          <FiVideo className="obs-icon" />
          <span>ObS Record</span>
        </div>
        <div className={`status-badge ${status}`}>
          {status === 'recording' && <span className="red-dot"></span>}
          {status === 'idle' ? 'Pronto' : status === 'recording' ? 'Gravando' : 'Finalizado'}
        </div>
      </div>

      <div className="obs-preview">
        {!videoUrl && !isRecording ? (
          <div className="preview-placeholder">
            <FiVideo size={48} />
            <p>Clique em Iniciar para capturar a tela</p>
          </div>
        ) : (
          <video 
            ref={previewRef} 
            src={videoUrl || undefined} 
            autoPlay 
            muted={isRecording} 
            controls={!!videoUrl} 
          />
        )}
      </div>

      <div className="obs-controls">
        {!isRecording ? (
          <button className="obs-btn start" onClick={startRecording}>
            <FiCircle /> Iniciar Gravação
          </button>
        ) : (
          <button className="obs-btn stop" onClick={stopRecording}>
            <FiSquare /> Parar Gravação
          </button>
        )}

        {status === 'finished' && (
          <button className="obs-btn save" onClick={saveToSystem}>
            <FiDownload /> Salvar no Sistema
          </button>
        )}
      </div>
    </div>
  );
}
