import { useState, useEffect, useCallback } from 'react';
import { ChatSession, Message, Role } from '../types';

const STORAGE_KEY = 'gemini-chat-sessions';

export const useChatHistory = () => {  
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    
    useEffect(() => {
        try {
            const storedSessions = localStorage.getItem(STORAGE_KEY);
            if (storedSessions) {
                const parsedSessions = JSON.parse(storedSessions);
                // Sort by createdAt descending to show newest first
                parsedSessions.sort((a: ChatSession, b: ChatSession) => b.createdAt - a.createdAt);
                setSessions(parsedSessions);
                console.log(`💾 Loaded ${parsedSessions.length} sessions from localStorage`);
            } else {
                console.log('💾 No sessions found in localStorage');
            }
        } catch (error) {
            console.error("Failed to load chat sessions from local storage", error);
            setSessions([]);
        }
    }, []);
    
    const saveSessions = useCallback((updatedSessions: ChatSession[]) => {
        // Ensure newest is always first
        updatedSessions.sort((a, b) => b.createdAt - a.createdAt);
        setSessions(updatedSessions);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
            console.log(`💾 Saved ${updatedSessions.length} sessions to localStorage`);
        } catch (error) {
            console.error("Failed to save chat sessions to local storage", error);
        }
    }, []);

    const createNewSession = useCallback(() => {
        const newSession: ChatSession = {
            id: `session_${Date.now()}`,
            title: 'New Chat',
            messages: [{ role: Role.ASSISTANT, content: "Hello! How can I help you today? You can attach files or enable web search." }],
            createdAt: Date.now(),
        };
        const updatedSessions = [newSession, ...sessions];
        saveSessions(updatedSessions);
        console.log(`✨ Created new chat session: ${newSession.id} (total sessions: ${updatedSessions.length})`);
        return newSession.id;
    }, [sessions, saveSessions]);

    const deleteSession = useCallback((sessionId: string) => {
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        saveSessions(updatedSessions);
    }, [sessions, saveSessions]);

    const renameSession = useCallback((sessionId: string, newTitle: string) => {
        const updatedSessions = sessions.map(s => 
            s.id === sessionId ? { ...s, title: newTitle } : s
        );
        saveSessions(updatedSessions);
    }, [sessions, saveSessions]);

    const updateSessionMessages = useCallback((sessionId: string, messages: Message[]) => {
        const updatedSessions = sessions.map(s =>
            s.id === sessionId ? { ...s, messages } : s
        );
        saveSessions(updatedSessions);
    }, [sessions, saveSessions]);
    
    const importSession = useCallback((sessionData: { messages: Message[], title?: string }) => {
        const newSession: ChatSession = {
            id: `session_${Date.now()}`,
            title: sessionData.title || 'Imported Chat',
            messages: sessionData.messages,
            createdAt: Date.now(),
        };
        const updatedSessions = [newSession, ...sessions];
        saveSessions(updatedSessions);
        console.log(`📥 Imported session: "${newSession.title}" with ${newSession.messages.length} messages`);
        return newSession.id;
    }, [sessions, saveSessions]);

    return { 
        sessions, 
        createNewSession, 
        deleteSession, 
        renameSession, 
        updateSessionMessages,
        importSession,
    };
};
