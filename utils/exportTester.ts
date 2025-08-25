/**
 * Comprehensive export functionality test
 * Tests the complete flow from conversation to export with debugging
 */

export async function testExportComplete() {
  console.log('🧪 Starting comprehensive export test...');
  
  // Test scenario: Create a conversation and verify export captures all messages
  const testSteps = [
    '1. Create new session',
    '2. Add multiple user/assistant message pairs', 
    '3. Trigger auto-titling',
    '4. Export session',
    '5. Verify exported data contains all messages'
  ];
  
  console.log('📋 Test Steps:', testSteps);
  
  // This test should be run in the browser console after:
  // 1. Starting a new chat session
  // 2. Having a multi-turn conversation (4+ messages)
  // 3. Running this function before export
  
  return {
    instructions: [
      '1. Open browser dev tools (F12)',
      '2. Go to Console tab',
      '3. Start a new chat and have a conversation with 4+ messages',
      '4. Run: testExportComplete() in console',
      '5. Click Export button',
      '6. Check console logs for state consistency',
      '7. Open downloaded JSON file to verify message count'
    ],
    expectedResults: {
      autoTitling: 'Session should auto-title after first user message',
      stateConsistency: 'debugExportState should show consistent state',
      exportData: 'Exported JSON should contain all conversation messages',
      fileNaming: 'Export file should have descriptive name with timestamp'
    }
  };
}

export function debugCurrentSessionState() {
  // This function can be called from browser console to inspect current state
  console.log('🔍 Debugging current session state...');
  
  // Try to access the React component state (if available in dev tools)
  if (typeof window !== 'undefined' && (window as any).React) {
    console.log('✅ React dev tools detected');
    console.log('💡 Use React DevTools to inspect App component state');
    console.log('📍 Look for: sessions[], activeSessionId, activeSession');
  }
  
  // Check localStorage
  const sessionsData = localStorage.getItem('gemini-chat-sessions');
  if (sessionsData) {
    try {
      const sessions = JSON.parse(sessionsData);
      console.log('💾 localStorage sessions:', sessions.length);
      sessions.forEach((session: any, index: number) => {
        console.log(`Session ${index + 1}: "${session.title}" (${session.messages?.length || 0} messages)`);
      });
    } catch (e) {
      console.error('❌ Error parsing localStorage sessions:', e);
    }
  } else {
    console.log('❌ No sessions found in localStorage');
  }
  
  return {
    tip: 'Open React DevTools and inspect App component state for real-time debugging',
    localStorage: !!sessionsData
  };
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).testExportComplete = testExportComplete;
  (window as any).debugCurrentSessionState = debugCurrentSessionState;
}
