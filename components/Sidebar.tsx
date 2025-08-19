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
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <aside className="sidebar">
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
        <input type="file" ref={importInputRef} onChange={onImportChat} accept=".json" style={{display: 'none'}} />
        <button className="sidebar-btn" onClick={onExportChat}>
            <DownloadIcon /> Export
        </button>
      </div>
    </aside>
  );
};
