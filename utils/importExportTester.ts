/**
 * Import/Export Test Functions for Gemini Advanced Chat
 * 
 * Test the import/export functionality and context preservation
 */

import { Message, Role, ChatSession } from '../types';

/**
 * Create test chat data for export testing
 */
function createTestChatData(): ChatSession {
  return {
    id: `test_session_${Date.now()}`,
    title: 'Test Conversation',
    createdAt: Date.now(),
    messages: [
      { role: Role.ASSISTANT, content: "Hello! How can I help you today?" },
      { role: Role.USER, content: "My name is John and I'm learning React. Can you help me understand hooks?" },
      { role: Role.ASSISTANT, content: "Hi John! I'd be happy to help you learn React hooks. Hooks are functions that let you use state and other React features in functional components. The most common ones are useState and useEffect. Would you like me to explain a specific hook?" },
      { role: Role.USER, content: "Yes, can you explain useState with an example?" },
      { role: Role.ASSISTANT, content: "Absolutely! useState is a Hook that lets you add state to functional components. Here's a simple example:\n\n```jsx\nimport React, { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```\n\nThe useState hook returns an array with two elements: the current state value and a function to update it." },
      { role: Role.USER, content: "That's very helpful! What about useEffect?" },
      { role: Role.ASSISTANT, content: "Great question! useEffect is used for side effects in functional components. It's like componentDidMount, componentDidUpdate, and componentWillUnmount combined. Here's an example:\n\n```jsx\nimport React, { useState, useEffect } from 'react';\n\nfunction Example() {\n  const [count, setCount] = useState(0);\n\n  useEffect(() => {\n    document.title = `You clicked ${count} times`;\n  }, [count]); // Only re-run if count changes\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```\n\nThe second parameter is a dependency array that controls when the effect runs." }
    ]
  };
}

/**
 * Test export functionality
 */
export function testExportFunction(): string {
  console.log('🧪 Testing export functionality...');
  
  const testData = createTestChatData();
  
  // Simulate export format
  const exportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    title: testData.title,
    id: testData.id,
    createdAt: testData.createdAt,
    messages: testData.messages,
    totalMessages: testData.messages.length,
    contextInfo: {
      hasUserMessages: testData.messages.some(m => m.role === Role.USER),
      hasAssistantMessages: testData.messages.some(m => m.role === Role.ASSISTANT),
      conversationStarted: testData.messages.length > 1
    }
  };
  
  const exportString = JSON.stringify(exportData, null, 2);
  console.log('✅ Export data created successfully');
  console.log(`   Messages: ${exportData.totalMessages}`);
  console.log(`   Has context: ${exportData.contextInfo.conversationStarted}`);
  
  return exportString;
}

/**
 * Test import functionality and context validation
 */
export function testImportFunction(importData: string): { success: boolean; messages: Message[]; contextValid: boolean } {
  console.log('🧪 Testing import functionality...');
  
  try {
    const data = JSON.parse(importData);
    
    // Validate the imported data
    if (!data || (!Array.isArray(data.messages) && !data.messages)) {
      throw new Error('Invalid data structure');
    }
    
    const importedMessages = data.messages || [];
    
    // Validate message structure and fix if needed
    const validatedMessages = importedMessages.map((msg: any, index: number) => {
      let role = msg.role;
      if (role === 'user') role = Role.USER;
      else if (role === 'assistant' || role === 'model') role = Role.ASSISTANT;
      else if (role !== Role.USER && role !== Role.ASSISTANT) {
        role = index % 2 === 0 ? Role.USER : Role.ASSISTANT;
        console.warn(`Unknown role "${msg.role}" in message ${index}, defaulting to ${role}`);
      }
      
      return {
        role: role as Role,
        content: msg.content || msg.text || '',
        sources: msg.sources || []
      };
    }).filter(msg => msg.content.trim() !== '');
    
    // Check context validity
    const hasUserMessages = validatedMessages.some(m => m.role === Role.USER);
    const hasAssistantMessages = validatedMessages.some(m => m.role === Role.ASSISTANT);
    const hasConversation = validatedMessages.length > 1;
    const contextValid = hasUserMessages && hasAssistantMessages && hasConversation;
    
    console.log('✅ Import validation completed');
    console.log(`   Messages imported: ${validatedMessages.length}`);
    console.log(`   Context valid: ${contextValid}`);
    console.log(`   User messages: ${hasUserMessages}`);
    console.log(`   Assistant messages: ${hasAssistantMessages}`);
    
    return {
      success: true,
      messages: validatedMessages,
      contextValid
    };
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    return {
      success: false,
      messages: [],
      contextValid: false
    };
  }
}

/**
 * Test context preservation after import
 */
export function testContextPreservation(messages: Message[]): boolean {
  console.log('🧪 Testing context preservation...');
  
  if (messages.length < 2) {
    console.log('❌ Not enough messages for context testing');
    return false;
  }
  
  // Check if conversation has a logical flow
  const userMessages = messages.filter(m => m.role === Role.USER);
  const assistantMessages = messages.filter(m => m.role === Role.ASSISTANT);
  
  // Basic context checks
  const hasNameReference = messages.some(m => m.content.toLowerCase().includes('john'));
  const hasTopicContinuity = messages.some(m => m.content.toLowerCase().includes('react') || m.content.toLowerCase().includes('hooks'));
  const hasFollowUpQuestions = userMessages.length > 1;
  
  const contextPreserved = hasNameReference && hasTopicContinuity && hasFollowUpQuestions;
  
  console.log('📊 Context preservation analysis:');
  console.log(`   Name reference: ${hasNameReference ? '✅' : '❌'}`);
  console.log(`   Topic continuity: ${hasTopicContinuity ? '✅' : '❌'}`);
  console.log(`   Follow-up questions: ${hasFollowUpQuestions ? '✅' : '❌'}`);
  console.log(`   Overall context preserved: ${contextPreserved ? '✅' : '❌'}`);
  
  return contextPreserved;
}

/**
 * Run complete import/export test cycle
 */
export function runImportExportTests(): void {
  console.log('🚀 Starting Import/Export Tests\n');
  
  // Test 1: Export
  console.log('1️⃣ Testing Export...');
  const exportedData = testExportFunction();
  
  // Test 2: Import
  console.log('\n2️⃣ Testing Import...');
  const importResult = testImportFunction(exportedData);
  
  if (!importResult.success) {
    console.log('❌ Import/Export test failed - Import step failed');
    return;
  }
  
  // Test 3: Context Preservation
  console.log('\n3️⃣ Testing Context Preservation...');
  const contextPreserved = testContextPreservation(importResult.messages);
  
  // Summary
  console.log('\n📊 Import/Export Test Summary:');
  console.log(`   Export: ✅ Success`);
  console.log(`   Import: ${importResult.success ? '✅' : '❌'} ${importResult.success ? 'Success' : 'Failed'}`);
  console.log(`   Context Valid: ${importResult.contextValid ? '✅' : '❌'} ${importResult.contextValid ? 'Valid' : 'Invalid'}`);
  console.log(`   Context Preserved: ${contextPreserved ? '✅' : '❌'} ${contextPreserved ? 'Preserved' : 'Lost'}`);
  
  const allTestsPassed = importResult.success && importResult.contextValid && contextPreserved;
  
  if (allTestsPassed) {
    console.log('\n🎉 All import/export tests passed! Context is properly preserved.');
  } else {
    console.log('\n⚠️ Some import/export tests failed. Check the implementation.');
  }
}

/**
 * Test import with various formats (compatibility test)
 */
export function testImportCompatibility(): void {
  console.log('🧪 Testing import compatibility with various formats...');
  
  // Test old format (simple)
  const oldFormat = {
    title: "Old Format Chat",
    messages: [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" }
    ]
  };
  
  // Test with wrong roles
  const wrongRoles = {
    title: "Wrong Roles Chat",
    messages: [
      { role: "human", content: "Hello" },
      { role: "ai", content: "Hi there!" },
      { role: "model", content: "How can I help?" }
    ]
  };
  
  // Test with missing fields
  const missingFields = {
    messages: [
      { role: "user", text: "Hello" },  // 'text' instead of 'content'
      { role: "assistant", content: "Hi there!" }
    ]
  };
  
  const tests = [
    { name: 'Old Format', data: oldFormat },
    { name: 'Wrong Roles', data: wrongRoles },
    { name: 'Missing Fields', data: missingFields }
  ];
  
  tests.forEach(({ name, data }) => {
    console.log(`\n🔍 Testing ${name}...`);
    const result = testImportFunction(JSON.stringify(data));
    console.log(`   Result: ${result.success ? '✅ Compatible' : '❌ Incompatible'}`);
    if (result.success) {
      console.log(`   Messages: ${result.messages.length}`);
      console.log(`   Context: ${result.contextValid ? 'Valid' : 'Invalid'}`);
    }
  });
}

// Make functions available globally
(window as any).testExportFunction = testExportFunction;
(window as any).testImportFunction = testImportFunction;
(window as any).testContextPreservation = testContextPreservation;
(window as any).runImportExportTests = runImportExportTests;
(window as any).testImportCompatibility = testImportCompatibility;
