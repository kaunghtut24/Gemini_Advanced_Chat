import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { useChatHistory } from './hooks/useChatHistory';
import { useAuth } from './hooks/useAuth';
import { generateTitle, getAvailableModels, setCurrentModel } from './services/aiProviderService';
import { testAllModels, runComprehensiveTest } from './utils/modelTester';
import { runContextTests } from './utils/contextTester';
import { runImportExportTests, testImportCompatibility } from './utils/importExportTester';
import { backupSessions, saveSessionForRecovery, getSessionStats } from './utils/sessionRecovery';
import { debugExportState, logSessionDetails } from './utils/debugExport';
import { Message, Role, ChatSession, ModelConfig, AIProvider, ProviderConfig } from './types';
import { Icons } from './components/Icons';
import './src/styles.css';
import Settings from './components/Settings';

const App: React.FC = () => {
  const { isAuthenticated, userEmail, logout } = useAuth();

  // Check if we're in development mode
  const isDevelopmentMode = import.meta.env.DEV && userEmail === 'dev@localhost';
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
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Set default model when component mounts
  useEffect(() => {
    if (!selectedModel) {
      // Get properly configured models from aiProviderService
      const availableModels = getAvailableModels();
      if (availableModels.length > 0) {
        // Select the first available model (should be Gemini with proper API key)
        const defaultModel = availableModels[0];
        console.log(`🎯 Setting default model: ${defaultModel.name} with API key: ${!!defaultModel.providerConfig.apiKey}`);
        setSelectedModel(defaultModel);
        setCurrentModel(defaultModel); // Also set it in the aiProviderService
      } else {
        console.warn('⚠️ No available models found. Check API key configuration.');
      }
    }
  }, [selectedModel]);

  // Helper function to check if a session has meaningful conversation
  const hasMeaningfulConversation = (session: ChatSession | null): boolean => {
    if (!session || session.messages.length <= 1) return false;
    
    const userMessages = session.messages.filter(m => m.role === Role.USER);
    const assistantMessages = session.messages.filter(m => m.role === Role.ASSISTANT && m.content.trim() !== '');
    
    return userMessages.length > 0 && assistantMessages.length > 0;
  };

  useEffect(() => {
    // Make model testing functions available globally for console access
    (window as any).testAllModels = testAllModels;
    (window as any).runComprehensiveTest = runComprehensiveTest;
    (window as any).runContextTests = runContextTests;
    (window as any).runImportExportTests = runImportExportTests;
    (window as any).testImportCompatibility = testImportCompatibility;
    (window as any).getSessionStats = getSessionStats;
    
    console.log('🔬 Testing functions are now available in the console:');
    console.log('  • testAllModels() - Test all models with minimal queries');
    console.log('  • runComprehensiveTest() - Run comprehensive tests including streaming');
    console.log('  • runContextTests() - Test context management and follow-up questions');
    console.log('  • runImportExportTests() - Test import/export functionality and context preservation');
    console.log('  • testImportCompatibility() - Test compatibility with various import formats');
    console.log('  • getSessionStats() - Get session backup/recovery statistics');
    console.log('  • emergencyRecovery() - Recover sessions if they get lost');
    
    // Only initialize session if we don't have an active session
    // This prevents clearing sessions when navigating to/from settings
    if (sessions.length > 0) {
      // If we have sessions but no active session, or the active session doesn't exist anymore
      if (!activeSessionId || !sessions.some(s => s.id === activeSessionId)) {
        console.log('🔄 No valid active session, selecting first available session');
        setActiveSessionId(sessions[0].id);
      }
    } else if (sessions.length === 0 && !activeSessionId) {
      // Only create new session if we have no sessions AND no active session ID
      console.log('✨ No sessions found, creating initial session');
      const newId = createNewSession();
      setActiveSessionId(newId);
    }
  }, [sessions, activeSessionId]); // Removed createNewSession from dependencies

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  // Add cleanup effect to preserve session state
  useEffect(() => {
    return () => {
      // Log current state when component unmounts or updates
      if (activeSession && activeSession.messages.length > 1) {
        console.log(`🔒 Preserving session: "${activeSession.title}" with ${activeSession.messages.length} messages`);
      }
    };
  }, [activeSession]);

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

      console.log(`💾 Updating session "${activeSession.title}" with ${newMessages.length} messages`);
      console.log(`📝 Messages being saved:`, newMessages.map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' })));

      updateSessionMessages(activeSession.id, newMessages);
  }, [activeSession, updateSessionMessages]);

  const handleExportChat = () => {
    if (!activeSession) return;
    
    // Debug current state before export
    console.log('🔍 Pre-export state check:');
    const debugInfo = debugExportState(activeSessionId, sessions, activeSession);
    
    // Use a timeout to ensure we get the latest session state after any pending updates
    setTimeout(() => {
      // Get the most up-to-date session from the sessions array
      const currentSession = sessions.find(s => s.id === activeSessionId);
      if (!currentSession) {
        console.error('No current session found for export');
        return;
      }
      
      console.log(`📤 Exporting session "${currentSession.title}" with ${currentSession.messages.length} messages`);
      logSessionDetails(currentSession);
      
      // Enhanced export format with metadata for better import compatibility
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        title: currentSession.title,
        id: currentSession.id,
        createdAt: currentSession.createdAt,
        messages: currentSession.messages,
        totalMessages: currentSession.messages.length,
        // Add context validation
        contextInfo: {
          hasUserMessages: currentSession.messages.some(m => m.role === Role.USER),
          hasAssistantMessages: currentSession.messages.some(m => m.role === Role.ASSISTANT),
          conversationStarted: currentSession.messages.length > 1
        },
        // Add debug info to export for troubleshooting
        debugInfo: {
          exportTime: new Date().toISOString(),
          stateConsistency: debugInfo.stateConsistency,
          sessionsCount: sessions.length
        }
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      
      // Better filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      link.download = `gemini-chat-${currentSession.title.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`📤 Exported chat: "${currentSession.title}" with ${currentSession.messages.length} messages`);
    }, 100); // Small delay to ensure state is synchronized
  };
  
  const handleImportChat = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const result = e.target?.result as string;
              const data = JSON.parse(result);
              
              // Validate the imported data
              if (!data || (!Array.isArray(data.messages) && !data.messages)) {
                  alert('Invalid chat history file. It must be a JSON file with a "messages" array.');
                  return;
              }
              
              // Support both old and new export formats
              const importedMessages = data.messages || [];
              const importedTitle = data.title || 'Imported Chat';
              
              // Validate message structure and fix if needed
              const validatedMessages = importedMessages.map((msg: any, index: number) => {
                  // Ensure proper role mapping
                  let role = msg.role;
                  if (role === 'user') role = Role.USER;
                  else if (role === 'assistant' || role === 'model') role = Role.ASSISTANT;
                  else if (role !== Role.USER && role !== Role.ASSISTANT) {
                      // Default to user for odd indices, assistant for even
                      role = index % 2 === 0 ? Role.USER : Role.ASSISTANT;
                      console.warn(`Unknown role "${msg.role}" in message ${index}, defaulting to ${role}`);
                  }
                  
                  return {
                      role: role as Role,
                      content: msg.content || msg.text || '',
                      sources: msg.sources || []
                  };
              }).filter(msg => msg.content.trim() !== ''); // Remove empty messages
              
              if (validatedMessages.length === 0) {
                  alert('The imported file contains no valid messages.');
                  return;
              }
              
              // Check if current session has meaningful conversation that should be preserved
              const currentSession = activeSession;
              const hasUnsavedChanges = currentSession && 
                  currentSession.messages.length > 1 && // More than just the greeting
                  hasMeaningfulConversation(currentSession); // Has actual conversation content
              
              if (hasUnsavedChanges) {
                  const sessionTitle = currentSession.title === 'New Chat' ? 'Untitled conversation' : currentSession.title;
                  const shouldProceed = confirm(
                      `You have an active chat session "${sessionTitle}" with ${currentSession.messages.length} messages. ` +
                      'Importing will switch to the new chat session. The current session will remain saved. Continue?'
                  );
                  if (!shouldProceed) {
                      return;
                  }
              }
              
              // Import the session with validated messages
              const importData = {
                  title: importedTitle,
                  messages: validatedMessages
              };
              
              const newId = importSession(importData);
              setActiveSessionId(newId);
              
              console.log(`📥 Imported chat: "${importedTitle}" with ${validatedMessages.length} messages`);
              console.log('🧠 Context will be available for follow-up questions');
              
              // Show success message with context info
              const hasContext = validatedMessages.length > 1;
              const contextMessage = hasContext 
                  ? ' The conversation context is now available for follow-up questions.' 
                  : '';
              alert(`Successfully imported "${importedTitle}" with ${validatedMessages.length} messages.${contextMessage}`);
              
          } catch (error) {
              console.error('Failed to import chat:', error);
              alert('Failed to read or parse the file. Please ensure it\'s a valid JSON file exported from Gemini Advanced Chat.');
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
    console.log(`🔧 Settings toggle: ${showSettings ? 'closing' : 'opening'} settings`);
    console.log(`📊 Current session state: ${sessions.length} sessions, active: ${activeSessionId}`);
    
    // Backup sessions before opening settings
    if (!showSettings && sessions.length > 0) {
      backupSessions(sessions);
      if (activeSession && activeSession.messages.length > 1) {
        saveSessionForRecovery(activeSession);
      }
    }
    
    setShowSettings((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    document.body.classList.toggle('sidebar-open');
  };

  const handleModelChange = (model: ModelConfig) => {
    setSelectedModel(model);
    setCurrentModel(model); // Ensure aiProviderService uses the correct model
    console.log(`Model changed to: ${model.name} (${model.provider}) with API key: ${!!model.providerConfig.apiKey}`);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);

    // Refresh models with updated API keys
    const availableModels = getAvailableModels();
    if (availableModels.length > 0 && (!selectedModel || !selectedModel.providerConfig.apiKey)) {
      // If current model doesn't have API key, switch to first available model
      const modelWithKey = availableModels[0];
      console.log(`🔄 Switching to model with API key: ${modelWithKey.name}`);
      setSelectedModel(modelWithKey);
      setCurrentModel(modelWithKey);
    }

    // Trigger a storage event to refresh the sidebar models
    window.dispatchEvent(new Event('storage'));
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
      {!isAuthenticated ? (
        <Login />
      ) : showSettings ? (
        <Settings 
          onClose={handleSettingsClose}
          onModelChange={handleModelChange}
        />
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
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
          />
          <div className="main-content">
            <header className="app-header">
              <div className="header-left">
                <button className="mobile-menu-btn" onClick={toggleMobileMenu} title="Toggle sidebar">
                  <Icons.MenuIcon />
                </button>
                <h1>
                  🚀 Gemini Advanced Chat
                  {isDevelopmentMode && (
                    <span className="dev-mode-indicator" title="Development Mode - Authentication Bypassed for Local Testing">
                      🔧 DEV
                    </span>
                  )}
                </h1>
              </div>
              <div className="header-right">
                <div className="user-menu">
                  <button 
                    className="user-button" 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <span className="user-email">{userEmail}</span>
                    <Icons.LogOut />
                  </button>
                  {showUserMenu && (
                    <div className="user-dropdown">
                      <button 
                        className="dropdown-item danger" 
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                      >
                        <Icons.LogOut />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>
            <main>
              {activeSession ? (
                <ChatWindow 
                  key={activeSession.id}
                  sessionMessages={activeSession.messages}
                  onMessagesUpdate={handleUpdateMessages}
                  selectedModel={selectedModel}
                  sessionTitle={activeSession.title}
                  onTitleUpdate={(title) => renameSession(activeSession.id, title)}
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
                Powered by <a href="https://ai.google.dev/gemini-api" target="_blank" rel="noopener noreferrer">Google Gemini API</a>
                {" • "}
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
