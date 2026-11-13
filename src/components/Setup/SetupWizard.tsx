// ============================================
// SetupWizard (Instalador e Configuração Básica do OS)
// Interface clássica, limpa e utilitária de instalador
// ============================================
import { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useSystem } from '../../stores/systemStore';
import kernel from '../../core/kernel';
import './SetupWizard.css';

const STEPS = [
  { id: 'welcome', title: 'Bem-vindo à Instalação do ObsidianOS' },
  { id: 'user', title: 'Configuração de Usuário' },
  { id: 'theme', title: 'Aparência do Sistema' },
  { id: 'installing', title: 'Instalando Arquivos do Sistema' },
];

export default function SetupWizard() {
  const [step, setStep] = useState(0);
  const { createProfile } = useUserStore();
  const { setTheme } = useSystem();

  // Dados básicos
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState('#2563eb');

  // Progresso da etapa de instalação
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Iniciando...');

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);

      if (nextStep === 3) {
        runInstallation();
      }
    }
  };

  const handleBack = () => {
    if (step > 0 && step < 3) {
      setStep(step - 1);
    }
  };

  const runInstallation = async () => {
    const finalUsername = username.trim() || 'Admin';
    const finalDisplayName = displayName.trim() || finalUsername;
    const userHome = `C:\\Users\\${finalUsername}`;

    // Lista de operações reais do Kernel e VFS
    const realOperations: Array<{
      desc: string;
      action: () => void | Promise<void>;
    }> = [
      {
        desc: `Criando diretório base: C:\\Users\\${finalUsername}`,
        action: () => kernel.fsCreateDirectory('C:\\Users', finalUsername),
      },
      {
        desc: `Criando pasta de trabalho: ${userHome}\\Desktop`,
        action: () => kernel.fsCreateDirectory(userHome, 'Desktop'),
      },
      {
        desc: `Criando pasta: ${userHome}\\Documents`,
        action: () => kernel.fsCreateDirectory(userHome, 'Documents'),
      },
      {
        desc: `Criando pasta: ${userHome}\\Downloads`,
        action: () => kernel.fsCreateDirectory(userHome, 'Downloads'),
      },
      {
        desc: `Criando pasta: ${userHome}\\Pictures`,
        action: () => kernel.fsCreateDirectory(userHome, 'Pictures'),
      },
      {
        desc: `Criando pasta: ${userHome}\\Music`,
        action: () => kernel.fsCreateDirectory(userHome, 'Music'),
      },
      {
        desc: `Criando pasta: ${userHome}\\Videos`,
        action: () => kernel.fsCreateDirectory(userHome, 'Videos'),
      },
      {
        desc: `Criando pasta do sistema: ${userHome}\\AppData`,
        action: () => kernel.fsCreateDirectory(userHome, 'AppData'),
      },
      {
        desc: `Criando pasta: ${userHome}\\AppData\\Local`,
        action: () => kernel.fsCreateDirectory(`${userHome}\\AppData`, 'Local'),
      },
      {
        desc: `Criando pasta: ${userHome}\\AppData\\Roaming`,
        action: () => kernel.fsCreateDirectory(`${userHome}\\AppData`, 'Roaming'),
      },
      {
        desc: `Gravando arquivo: ${userHome}\\Desktop\\readme.txt`,
        action: () =>
          kernel.fsCreateFile(
            `${userHome}\\Desktop`,
            'readme.txt',
            'Bem-vindo ao ObsidianOS!\n\nEste é o seu sistema operacional rodando com persistência de dados no navegador.\nExplore os aplicativos, crie arquivos e use o terminal para administrar o sistema.\n',
            'txt'
          ),
      },
      {
        desc: `Gravando arquivo: ${userHome}\\Documents\\notes.txt`,
        action: () =>
          kernel.fsCreateFile(
            `${userHome}\\Documents`,
            'notes.txt',
            'Notas Iniciais\n==============\n- Sistema instalado com sucesso.\n- Explore o Terminal para comandos nativos e OSL.\n',
            'txt'
          ),
      },
      {
        desc: `Gravando chave de registro: HKEY_CURRENT_USER\\Software\\ObsidianOS\\Theme`,
        action: () => {
          kernel.regSetValue(
            'HKEY_CURRENT_USER\\Software\\ObsidianOS\\Theme\\Mode',
            'REG_SZ',
            themeMode
          );
          kernel.regSetValue(
            'HKEY_CURRENT_USER\\Software\\ObsidianOS\\Theme\\AccentColor',
            'REG_SZ',
            accentColor
          );
        },
      },
      {
        desc: `Gravando registro: HKEY_LOCAL_MACHINE\\SOFTWARE\\RegisteredOwner`,
        action: () =>
          kernel.regSetValue(
            'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\RegisteredOwner',
            'REG_SZ',
            finalDisplayName
          ),
      },
      {
        desc: `Atualizando permissões e usuário no subsistema de segurança (lsass)...`,
        action: () => {
          const newProfile = {
            username: finalUsername,
            displayName: finalDisplayName,
            password: password,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${finalUsername}`,
            isAdmin: true,
            lastLogin: Date.now(),
          };
          createProfile(newProfile);
          useUserStore.setState({ currentUser: newProfile, isAuthenticated: false });
          kernel.setCurrentUser(newProfile);
        },
      },
      {
        desc: `Aplicando configurações de tema no sistema...`,
        action: () =>
          setTheme({
            mode: themeMode,
            accentColor: accentColor,
          }),
      },
      {
        desc: `Finalizando assistente de instalação (SetupInProgress = 0)...`,
        action: () => {
          kernel.regSetValue('HKEY_LOCAL_MACHINE\\SYSTEM\\Setup\\SetupInProgress', 'REG_DWORD', 0);
          kernel.regSetValue('HKEY_LOCAL_MACHINE\\SYSTEM\\Setup\\OOBEInProgress', 'REG_DWORD', 0);
          localStorage.setItem('obsidianos-setup-completed', 'true');
        },
      },
      {
        desc: `Persistindo estado do sistema e gravando no disco virtual...`,
        action: () => kernel.persistSystemState(),
      },
    ];

    // Executa as operações reais sequencialmente e atualiza o progresso ao vivo
    const totalOps = realOperations.length;
    for (let i = 0; i < totalOps; i++) {
      const op = realOperations[i];
      setStatusText(op.desc);
      const pct = Math.round(((i + 1) / totalOps) * 100);
      setProgress(pct);

      await op.action();
      // Pequeno intervalo para permitir renderização fluida e legibilidade dos arquivos reais sendo criados
      await new Promise((r) => setTimeout(r, 120));
    }

    setStatusText('Instalação concluída com sucesso! Iniciando logon...');
    await new Promise((r) => setTimeout(r, 600));

    kernel.bootPhase = 'WINLOGON';
  };

  return (
    <div className="setup-classic-screen">
      <div className="setup-classic-window">
        {/* Barra de Título da Janela de Instalação */}
        <div className="setup-titlebar">
          <div className="setup-titlebar-title">
            <span className="setup-titlebar-icon">🪟</span>
            <span>Instalação do ObsidianOS — Versão 24H2</span>
          </div>
        </div>

        {/* Cabeçalho do Assistente */}
        <div className="setup-header">
          <div className="setup-header-text">
            <h2>{STEPS[step].title}</h2>
            <p>
              {step === 0 && 'O assistente irá configurar o sistema operacional no seu navegador.'}
              {step === 1 && 'Especifique o nome de usuário e a senha para a conta principal.'}
              {step === 2 && 'Selecione as preferências visuais padrão da área de trabalho.'}
              {step === 3 && 'Aguarde enquanto o sistema instala os componentes necessários.'}
            </p>
          </div>
        </div>

        {/* Área Central / Conteúdo dos Passos */}
        <div className="setup-body">
          {step === 0 && (
            <div className="setup-pane">
              <p className="setup-text">
                Bem-vindo ao <strong>ObsidianOS</strong>.
              </p>
              <p className="setup-text">
                Este assistente instalará e preparará os arquivos de sistema, o registro e a conta de usuário padrão.
              </p>

              <div className="setup-groupbox">
                <legend>Configurações Regionais</legend>
                <div className="setup-form-row">
                  <label>Idioma do sistema:</label>
                  <select className="setup-classic-select" defaultValue="pt-BR" disabled>
                    <option value="pt-BR">Português (Brasil)</option>
                  </select>
                </div>
                <div className="setup-form-row">
                  <label>Teclado ou método de entrada:</label>
                  <select className="setup-classic-select" defaultValue="ABNT2">
                    <option value="ABNT2">Português (Brasil - ABNT2)</option>
                    <option value="US">Estados Unidos (Internacional)</option>
                  </select>
                </div>
              </div>

              <p className="setup-note">
                Clique em <strong>Avançar</strong> para prosseguir com a instalação.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="setup-pane">
              <p className="setup-text">
                Informe as credenciais da conta de administrador:
              </p>

              <div className="setup-groupbox">
                <legend>Informações da Conta</legend>
                <div className="setup-form-row">
                  <label>Nome do usuário:</label>
                  <input
                    type="text"
                    className="setup-classic-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Admin"
                    autoFocus
                  />
                </div>
                <div className="setup-form-row">
                  <label>Nome completo:</label>
                  <input
                    type="text"
                    className="setup-classic-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Administrador"
                  />
                </div>
                <div className="setup-form-row">
                  <label>Senha:</label>
                  <input
                    type="password"
                    className="setup-classic-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="setup-pane">
              <p className="setup-text">
                Escolha o tema básico da interface:
              </p>

              <div className="setup-groupbox">
                <legend>Modo de Exibição</legend>
                <div className="setup-radio-row">
                  <label>
                    <input
                      type="radio"
                      name="themeMode"
                      checked={themeMode === 'dark'}
                      onChange={() => setThemeMode('dark')}
                    />
                    <span>Tema Escuro (Padrão)</span>
                  </label>
                  <label style={{ marginLeft: '24px' }}>
                    <input
                      type="radio"
                      name="themeMode"
                      checked={themeMode === 'light'}
                      onChange={() => setThemeMode('light')}
                    />
                    <span>Tema Claro</span>
                  </label>
                </div>
              </div>

              <div className="setup-groupbox" style={{ marginTop: '16px' }}>
                <legend>Cor de Destaque</legend>
                <div className="setup-form-row">
                  <label>Cor do sistema:</label>
                  <select
                    className="setup-classic-select"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                  >
                    <option value="#2563eb">Azul Padrão (#2563eb)</option>
                    <option value="#4f46e5">Índigo (#4f46e5)</option>
                    <option value="#06b6d4">Ciano (#06b6d4)</option>
                    <option value="#10b981">Verde (#10b981)</option>
                    <option value="#f59e0b">Âmbar (#f59e0b)</option>
                    <option value="#ef4444">Vermelho (#ef4444)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="setup-pane">
              <p className="setup-text" style={{ marginBottom: '16px' }}>
                Aguarde enquanto os componentes do ObsidianOS são instalados:
              </p>

              <div className="setup-progress-container">
                <div
                  className="setup-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="setup-progress-label">
                {statusText} ({progress}%)
              </p>
            </div>
          )}
        </div>

        {/* Rodapé Clássico com Divisória e Botões */}
        <div className="setup-footer-bar">
          <div className="setup-buttons-group">
            {step > 0 && step < 3 && (
              <button className="setup-classic-btn" onClick={handleBack}>
                &lt; Voltar
              </button>
            )}

            {step < 3 && (
              <button
                className="setup-classic-btn primary"
                onClick={handleNext}
                disabled={step === 1 && !username.trim()}
              >
                Avançar &gt;
              </button>
            )}

            {step === 3 && (
              <button className="setup-classic-btn" disabled>
                Aguarde...
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
