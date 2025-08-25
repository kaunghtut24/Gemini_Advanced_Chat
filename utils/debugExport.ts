/**
 * Debug utility to help diagnose export issues
 */

export interface ExportDebugInfo {
  activeSessionId: string | null;
  activeSessionMessages: number;
  sessionsArrayLength: number;
  currentSessionExists: boolean;
  currentSessionMessages: number;
  stateConsistency: boolean;
}

export function debugExportState(
  activeSessionId: string | null, 
  sessions: any[], 
  activeSession: any
): ExportDebugInfo {
  const currentSession = sessions.find(s => s.id === activeSessionId);
  
  const debugInfo: ExportDebugInfo = {
    activeSessionId,
    activeSessionMessages: activeSession?.messages?.length || 0,
    sessionsArrayLength: sessions.length,
    currentSessionExists: !!currentSession,
    currentSessionMessages: currentSession?.messages?.length || 0,
    stateConsistency: false
  };
  
  // Check if state is consistent
  debugInfo.stateConsistency = 
    debugInfo.currentSessionExists && 
    debugInfo.activeSessionMessages === debugInfo.currentSessionMessages;
  
  console.log('🔍 Export Debug Info:', debugInfo);
  
  if (!debugInfo.stateConsistency) {
    console.warn('⚠️ State inconsistency detected!');
    console.log('Active session messages:', debugInfo.activeSessionMessages);
    console.log('Current session messages:', debugInfo.currentSessionMessages);
  }
  
  return debugInfo;
}

export function logSessionDetails(session: any) {
  if (!session) {
    console.log('❌ No session provided');
    return;
  }
  
  console.log('📋 Session Details:');
  console.log('- ID:', session.id);
  console.log('- Title:', session.title);
  console.log('- Messages:', session.messages?.length || 0);
  console.log('- Created:', session.createdAt);
  
  if (session.messages && session.messages.length > 0) {
    console.log('- Message roles:', session.messages.map(m => m.role));
    console.log('- First message:', session.messages[0]?.content?.substring(0, 50) + '...');
    console.log('- Last message:', session.messages[session.messages.length - 1]?.content?.substring(0, 50) + '...');
  }
}
