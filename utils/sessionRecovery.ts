/**
 * Session Recovery Utility for Gemini Advanced Chat
 * 
 * Provides backup and recovery mechanisms for chat sessions
 */

import { ChatSession, Message } from '../types';

const BACKUP_STORAGE_KEY = 'gemini-chat-sessions-backup';
const RECOVERY_STORAGE_KEY = 'gemini-chat-recovery';

/**
 * Create a backup of current sessions
 */
export function backupSessions(sessions: ChatSession[]): void {
  try {
    const backup = {
      timestamp: Date.now(),
      sessions: sessions,
      count: sessions.length
    };
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backup));
    console.log(`💾 Backed up ${sessions.length} sessions`);
  } catch (error) {
    console.error('Failed to backup sessions:', error);
  }
}

/**
 * Restore sessions from backup
 */
export function restoreSessionsFromBackup(): ChatSession[] | null {
  try {
    const backupData = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!backupData) {
      console.log('No backup found');
      return null;
    }
    
    const backup = JSON.parse(backupData);
    const backupAge = Date.now() - backup.timestamp;
    const backupAgeMinutes = Math.floor(backupAge / (1000 * 60));
    
    console.log(`📁 Found backup with ${backup.count} sessions (${backupAgeMinutes} minutes old)`);
    
    if (backup.sessions && Array.isArray(backup.sessions)) {
      return backup.sessions;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return null;
  }
}

/**
 * Save current session for recovery
 */
export function saveSessionForRecovery(session: ChatSession): void {
  try {
    const recovery = {
      timestamp: Date.now(),
      session: session,
      messageCount: session.messages.length
    };
    localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(recovery));
    console.log(`🔄 Saved session for recovery: "${session.title}" (${session.messages.length} messages)`);
  } catch (error) {
    console.error('Failed to save session for recovery:', error);
  }
}

/**
 * Recover last saved session
 */
export function recoverLastSession(): ChatSession | null {
  try {
    const recoveryData = localStorage.getItem(RECOVERY_STORAGE_KEY);
    if (!recoveryData) {
      console.log('No recovery session found');
      return null;
    }
    
    const recovery = JSON.parse(recoveryData);
    const recoveryAge = Date.now() - recovery.timestamp;
    const recoveryAgeMinutes = Math.floor(recoveryAge / (1000 * 60));
    
    console.log(`🔄 Found recovery session: "${recovery.session.title}" with ${recovery.messageCount} messages (${recoveryAgeMinutes} minutes old)`);
    
    if (recovery.session && recovery.session.messages) {
      return recovery.session;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to recover session:', error);
    return null;
  }
}

/**
 * Clear recovery data
 */
export function clearRecoveryData(): void {
  try {
    localStorage.removeItem(RECOVERY_STORAGE_KEY);
    console.log('🧹 Cleared recovery data');
  } catch (error) {
    console.error('Failed to clear recovery data:', error);
  }
}

/**
 * Get session stats for debugging
 */
export function getSessionStats(): {
  totalSessions: number;
  hasBackup: boolean;
  hasRecovery: boolean;
  backupAge?: number;
  recoveryAge?: number;
} {
  const mainSessions = localStorage.getItem('gemini-chat-sessions');
  const backup = localStorage.getItem(BACKUP_STORAGE_KEY);
  const recovery = localStorage.getItem(RECOVERY_STORAGE_KEY);
  
  let totalSessions = 0;
  if (mainSessions) {
    try {
      const sessions = JSON.parse(mainSessions);
      totalSessions = Array.isArray(sessions) ? sessions.length : 0;
    } catch (e) {
      totalSessions = 0;
    }
  }
  
  let backupAge: number | undefined;
  if (backup) {
    try {
      const backupData = JSON.parse(backup);
      backupAge = Date.now() - backupData.timestamp;
    } catch (e) {
      // ignore
    }
  }
  
  let recoveryAge: number | undefined;
  if (recovery) {
    try {
      const recoveryData = JSON.parse(recovery);
      recoveryAge = Date.now() - recoveryData.timestamp;
    } catch (e) {
      // ignore
    }
  }
  
  return {
    totalSessions,
    hasBackup: !!backup,
    hasRecovery: !!recovery,
    backupAge,
    recoveryAge
  };
}

/**
 * Emergency session recovery function
 */
export function emergencyRecovery(): {
  recovered: ChatSession[];
  source: 'main' | 'backup' | 'recovery' | 'none';
} {
  console.log('🚨 Starting emergency session recovery...');
  
  // Try main storage first
  try {
    const mainSessions = localStorage.getItem('gemini-chat-sessions');
    if (mainSessions) {
      const sessions = JSON.parse(mainSessions);
      if (Array.isArray(sessions) && sessions.length > 0) {
        console.log(`✅ Recovered ${sessions.length} sessions from main storage`);
        return { recovered: sessions, source: 'main' };
      }
    }
  } catch (e) {
    console.warn('Main storage recovery failed:', e);
  }
  
  // Try backup storage
  const backupSessions = restoreSessionsFromBackup();
  if (backupSessions && backupSessions.length > 0) {
    console.log(`✅ Recovered ${backupSessions.length} sessions from backup`);
    return { recovered: backupSessions, source: 'backup' };
  }
  
  // Try recovery storage
  const recoverySession = recoverLastSession();
  if (recoverySession) {
    console.log(`✅ Recovered 1 session from recovery storage`);
    return { recovered: [recoverySession], source: 'recovery' };
  }
  
  console.log('❌ No sessions could be recovered');
  return { recovered: [], source: 'none' };
}

// Make functions available globally for console access
(window as any).backupSessions = backupSessions;
(window as any).restoreSessionsFromBackup = restoreSessionsFromBackup;
(window as any).saveSessionForRecovery = saveSessionForRecovery;
(window as any).recoverLastSession = recoverLastSession;
(window as any).getSessionStats = getSessionStats;
(window as any).emergencyRecovery = emergencyRecovery;
