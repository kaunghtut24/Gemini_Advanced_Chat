import React, { useState, useRef, useEffect } from 'react';
import { ChatSession } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, DownloadIcon, UploadIcon } from './Icons';

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
  onModelChange?: (model: string) => void;
}

const models = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite' },
];

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
  onModelChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const importInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

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
    const newModel = e.target.value;
    setSelectedModel(newModel);
    onModelChange?.(newModel);
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
              value={selectedModel}
              onChange={handleModelChange}
              className="model-select"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
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
