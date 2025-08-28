import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, ModelConfig } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, DownloadIcon, UploadIcon } from './Icons';
import { getAvailableModels } from '../services/aiProviderService';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onExportChat: () => void;
  onImportChat: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDarkModeToggle: () => void;
  onSettingsToggle: () => void;
  isDarkMode: boolean;
  selectedModel?: ModelConfig | null;
  onModelChange?: (model: ModelConfig) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onExportChat,
  onImportChat,
  onDarkModeToggle,
  onSettingsToggle,
  isDarkMode,
  selectedModel,
  onModelChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Load available models on component mount
  useEffect(() => {
    loadModels();
  }, []);

  // Refresh models when component receives focus or when settings might have changed
  useEffect(() => {
    const handleStorageChange = () => {
      loadModels();
    };
    
    window.addEventListener('focus', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('focus', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadModels = async () => {
    try {
      // Load provider configurations from localStorage
      const savedProviders = localStorage.getItem('aiProviders');
      let allConfigs: any[] = [];
      
      if (savedProviders) {
        const parsed = JSON.parse(savedProviders);
        const providers = parsed.providers || [];
        const customProviders = parsed.customProviders || [];
        allConfigs = [...providers, ...customProviders];
      }
      
      const models = getAvailableModels(allConfigs);
      setAvailableModels(models);
      console.log('📋 Loaded models:', models.map(m => m.name));
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  useEffect(() => {
    if (editingSessionId && renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
    }
  }, [editingSessionId]);

  const handleRenameClick = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setRenameValue(session.title);
  };

  const handleRenameSubmit = (sessionId: string) => {
    if (renameValue.trim()) {
      onRenameChat(sessionId, renameValue);
    }
    setEditingSessionId(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, sessionId: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(sessionId);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value;
    const model = availableModels.find(m => m.id === modelId);
    if (model && onModelChange) {
      onModelChange(model);
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
        {isCollapsed ? '>' : '<'}
      </button>
      {!isCollapsed && (
        <>
          <div className="sidebar-header">
            <h2>Gemini Chat</h2>
            <div className="sidebar-controls">
              <button onClick={onDarkModeToggle} className="sidebar-btn small">
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button onClick={onSettingsToggle} className="sidebar-btn small">
                ⚙️
              </button>
            </div>
          </div>

          <div className="model-selection">
            <label htmlFor="model-select">Model:</label>
            <select
              id="model-select"
              value={selectedModel?.id || ''}
              onChange={handleModelChange}
              className="model-select"
            >
              {availableModels.length === 0 ? (
                <option value="" disabled>Loading models...</option>
              ) : (
                availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))
              )}
            </select>
          </div>

          <button className="new-chat-btn" onClick={onNewChat}>
            <PlusIcon />
            New Chat
          </button>

          <ul className="sessions-list">
            {sessions.map((session) => (
              <li
                key={session.id}
                className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
                onClick={() => !editingSessionId && onSelectChat(session.id)}
              >
                {editingSessionId === session.id ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSubmit(session.id)}
                    onKeyDown={(e) => handleKeyDown(e, session.id)}
                    className="session-input"
                  />
                ) : (
                  <>
                    <span className="session-title">{session.title}</span>
                    <div className="session-actions">
                      <button onClick={() => handleRenameClick(session)} aria-label="Rename chat"><PencilIcon /></button>
                      <button onClick={() => onDeleteChat(session.id)} aria-label="Delete chat"><TrashIcon /></button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

          <div className="sidebar-footer">
            <button className="sidebar-btn" onClick={() => importInputRef.current?.click()}>
              <UploadIcon /> Import
            </button>
            <input type="file" ref={importInputRef} onChange={onImportChat} accept=".json" style={{ display: 'none' }} />
            <button className="sidebar-btn" onClick={onExportChat}>
              <DownloadIcon /> Export
            </button>
          </div>
        </>
      )}
    </aside>
  );
};
