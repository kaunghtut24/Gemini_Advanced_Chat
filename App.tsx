import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { Sidebar } from './components/Sidebar';
import { useChatHistory } from './hooks/useChatHistory';
import { generateTitle, setSelectedModel } from './services/geminiService';
import { testAllModels, runComprehensiveTest } from './utils/modelTester';
import { Message } from './types';
import './src/styles.css';
import Settings from './components/Settings';

const App: React.FC = () => {
  const { 
    sessions, 
    createNewSession, 
    deleteSession, 
    renameSession, 
    updateSessionMessages,
    importSession,
  } = useChatHistory();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_API_KEY || '');
  const [showSettings, setShowSettings] = useState(false);
  const [currentModel, setCurrentModel] = useState('gemini-2.5-flash');

  useEffect(() => {
    // Make model testing functions available globally for console access
    (window as any).testAllModels = testAllModels;
    (window as any).runComprehensiveTest = runComprehensiveTest;
    
    console.log('🔬 Model testing functions are now available in the console:');
    console.log('  • testAllModels() - Test all models with minimal queries');
    console.log('  • runComprehensiveTest() - Run comprehensive tests including streaming');
    
    if (sessions.length > 0 && (!activeSessionId || !sessions.some(s => s.id === activeSessionId))) {
      setActiveSessionId(sessions[0].id);
    } else if (sessions.length === 0) {
      const newId = createNewSession();
      setActiveSessionId(newId);
    }
  }, [sessions, activeSessionId, createNewSession]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  const handleNewChat = () => {
    const newId = createNewSession();
    setActiveSessionId(newId);
  };
  
  const handleDeleteChat = (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
      const sessionsBeforeDelete = [...sessions];
      deleteSession(sessionId);
      if (activeSessionId === sessionId) {
        const remainingSessions = sessionsBeforeDelete.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setActiveSessionId(remainingSessions[0].id);
        } else {
          const newId = createNewSession();
          setActiveSessionId(newId);
        }
      }
    }
  };
  
  const handleRenameChat = (sessionId: string, newTitle: string) => {
    const trimmedTitle = newTitle.trim();
    if (trimmedTitle) {
      renameSession(sessionId, trimmedTitle);
    }
  };
  
  const handleUpdateMessages = useCallback(async (newMessages: Message[]) => {
      if (!activeSession) return;

      updateSessionMessages(activeSession.id, newMessages);

      if (activeSession.title === 'New Chat' && newMessages.length === 2 && newMessages[1].role === 'user') {
          const userPrompt = newMessages[1].content;
          try {
              const title = await generateTitle(userPrompt);
              renameSession(activeSession.id, title);
          } catch(error) {
              console.error("Failed to generate title:", error);
              renameSession(activeSession.id, userPrompt.substring(0, 40) + '...');
          }
      }
  }, [activeSession, renameSession, updateSessionMessages]);

  const handleExportChat = () => {
    if (!activeSession) return;
    const dataStr = JSON.stringify({ title: activeSession.title, messages: activeSession.messages }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `gemini-chat-${activeSession.id}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleImportChat = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const result = e.target?.result as string;
              const data = JSON.parse(result);
              if (data && Array.isArray(data.messages)) {
                  const newId = importSession(data);
                  setActiveSessionId(newId);
              } else {
                  alert('Invalid chat history file. It must be a JSON file with a "messages" array.');
              }
          } catch (error) {
              console.error('Failed to import chat:', error);
              alert('Failed to read or parse the file.');
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.body.classList.toggle('dark-mode', !isDarkMode);
  };

  const toggleSettings = () => {
    setShowSettings((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    document.body.classList.toggle('sidebar-open');
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setCurrentModel(model);
    console.log(`Model changed to: ${model}`);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (document.body.classList.contains('sidebar-open') && 
          !target.closest('.sidebar') && 
          !target.closest('.mobile-menu-btn')) {
        document.body.classList.remove('sidebar-open');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="app-container">
      {showSettings ? (
        <Settings apiKey={apiKey} onApiKeyChange={setApiKey} onClose={() => setShowSettings(false)} />
      ) : (
        <>
          <Sidebar 
            sessions={sessions}
            activeSessionId={activeSessionId}
            onNewChat={handleNewChat}
            onSelectChat={(id) => {
              setActiveSessionId(id);
              document.body.classList.remove('sidebar-open');
            }}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
            onExportChat={handleExportChat}
            onImportChat={handleImportChat}
            onDarkModeToggle={toggleDarkMode}
            onSettingsToggle={toggleSettings}
            isDarkMode={isDarkMode}
            onModelChange={handleModelChange}
          />
          <div className="main-content">
            <header className="app-header">
              <div className="header-left">
                <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
                  ☰
                </button>
                <h1>🚀 Gemini Advanced Chat</h1>
              </div>
              <p className="subtitle">
                Powered by <a href="https://ai.google.dev/gemini-api" target="_blank" rel="noopener noreferrer">Google Gemini API</a>
              </p>
            </header>
            <main>
              {activeSession ? (
                <ChatWindow 
                  key={activeSession.id}
                  sessionMessages={activeSession.messages}
                  onMessagesUpdate={handleUpdateMessages}
                  currentModel={currentModel}
                />
              ) : (
                 <div className="no-chat-selected">
                    <h2>Welcome to Gemini Chat</h2>
                    <p>Select a chat from the sidebar to continue your conversation, or start a new one.</p>
                 </div>
              )}
            </main>
            <footer className="app-footer">
              <small>
                © {new Date().getFullYear()} <a href="https://github.com/google/generative-ai-docs" target="_blank" rel="noopener noreferrer">
                  Open-Source Chat Demo
                </a>
              </small>
            </footer>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
