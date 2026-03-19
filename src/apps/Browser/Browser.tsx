// ============================================
// Browser App
// ============================================
import { useState, useRef } from 'react';
import { useWindowManager } from '../../stores/windowManager';
import './Browser.css';

export default function BrowserApp({ windowId }: { windowId: string }) {
  const [url, setUrl] = useState('https://www.google.com');
  const [inputUrl, setInputUrl] = useState('https://www.google.com');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(['https://www.google.com']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [tabs, setTabs] = useState([{ id: '1', title: 'Nova Aba', url: 'https://www.google.com' }]);
  const [activeTab, setActiveTab] = useState('1');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const updateWindowTitle = useWindowManager(s => s.updateWindowTitle);

  const navigateTo = (newUrl: string) => {
    let finalUrl = newUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        finalUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(finalUrl)}`;
      }
    }
    setUrl(finalUrl);
    setInputUrl(finalUrl);
    setIsLoading(true);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), finalUrl]);
    setHistoryIndex(prev => prev + 1);
    setTabs(tabs.map(t => t.id === activeTab ? { ...t, url: finalUrl, title: finalUrl.replace('https://', '').replace('http://', '').split('/')[0] } : t));
    updateWindowTitle(windowId, `${finalUrl.replace('https://', '').replace('http://', '').split('/')[0]} - Navegador`);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      const prevUrl = history[historyIndex - 1];
      setUrl(prevUrl);
      setInputUrl(prevUrl);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      const nextUrl = history[historyIndex + 1];
      setUrl(nextUrl);
      setInputUrl(nextUrl);
    }
  };

  return (
    <div className="browser-app">
      {/* Tab Bar */}
      <div className="browser-tabbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`browser-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="browser-tab-title">{tab.title}</span>
          </button>
        ))}
        <button className="browser-new-tab" title="Nova Aba">+</button>
      </div>

      {/* Navigation Bar */}
      <div className="browser-navbar">
        <button className="browser-nav-btn" onClick={goBack} disabled={historyIndex <= 0}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button className="browser-nav-btn" onClick={goForward} disabled={historyIndex >= history.length - 1}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button className="browser-nav-btn" onClick={() => navigateTo(url)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>

        <div className="browser-url-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="browser-url-input"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigateTo(inputUrl);
            }}
            placeholder="Pesquisar ou digitar URL"
          />
          {isLoading && <div className="browser-loading-indicator" />}
        </div>
      </div>

      {/* Content */}
      <div className="browser-content">
        <iframe
          ref={iframeRef}
          src={url}
          className="browser-iframe"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          title="Browser"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
