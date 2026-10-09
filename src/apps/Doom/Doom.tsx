import './Doom.css';

export default function DoomApp(_props: { windowId: string }) {
  // Player local garantido (carrega js-dos via CDN)
  const doomUrl = "/doom.html";
  
  return (
    <div className="doom-app">
      <div className="doom-container">
        <iframe
          src={doomUrl}
          className="doom-iframe"
          title="Doom"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; keyboard-attach"
        />
      </div>
      <div className="doom-statusbar">
        <span className="doom-status-text">DOOM Shareware v1.9 - Rodando via js-dos</span>
      </div>
    </div>
  );
}
