/**
 * Context Management Test for Gemini Advanced Chat
 * 
 * This test demonstrates how the application handles conversation context,
 * including context window management and follow-up question handling.
 */

import { generateResponseStream } from '../services/geminiService';
import { Message, Role } from '../types';

/**
 * Test context retention through multiple follow-up questions
 */
export async function testContextRetention(): Promise<boolean> {
  console.log('🧪 Testing context retention through follow-up questions...');
  
  const testConversation: Message[] = [
    { role: Role.USER, content: "My name is Alice and I'm a software engineer." },
    { role: Role.ASSISTANT, content: "Hello Alice! It's nice to meet you. As a software engineer, you must work with various technologies. What kind of projects do you enjoy working on?" },
    { role: Role.USER, content: "I love working on web applications using React." },
    { role: Role.ASSISTANT, content: "That's great! React is such a powerful library for building user interfaces. Are you working with any specific React frameworks or do you prefer vanilla React?" }
  ];

  try {
    // Test follow-up question that requires context
    const stream = generateResponseStream(
      testConversation, 
      "What programming language did I mention I work with?", // Should reference React from context
      [], 
      false
    );

    let fullResponse = '';
    for await (const chunk of stream) {
      if (chunk.text) {
        fullResponse += chunk.text;
      }
    }

    // Check if the response demonstrates understanding of context
    const contextAware = fullResponse.toLowerCase().includes('react') || 
                        fullResponse.toLowerCase().includes('javascript') ||
                        fullResponse.toLowerCase().includes('web');
    
    console.log('Response:', fullResponse);
    console.log('Context awareness:', contextAware ? '✅ PASS' : '❌ FAIL');
    
    return contextAware;
  } catch (error) {
    console.error('Context retention test failed:', error);
    return false;
  }
}

/**
 * Test context window management with long conversations
 */
export async function testLongConversationHandling(): Promise<boolean> {
  console.log('🧪 Testing long conversation context management...');
  
  // Create a long conversation (60+ messages)
  const longConversation: Message[] = [];
  
  // Add many messages to simulate a long conversation
  for (let i = 0; i < 30; i++) {
    longConversation.push({
      role: Role.USER,
      content: `This is user message number ${i + 1}. Let's discuss topic ${i + 1}.`
    });
    longConversation.push({
      role: Role.ASSISTANT,
      content: `Thank you for message ${i + 1}. I understand you want to discuss topic ${i + 1}. Let me provide some thoughts on that.`
    });
  }

  try {
    console.log(`Testing with ${longConversation.length} messages in history`);
    
    const stream = generateResponseStream(
      longConversation,
      "Can you summarize our conversation so far?",
      [],
      false
    );

    let fullResponse = '';
    for await (const chunk of stream) {
      if (chunk.text) {
        fullResponse += chunk.text;
      }
    }

    // The response should be generated successfully despite the long context
    const successful = fullResponse.length > 0 && !fullResponse.includes('⚠️');
    
    console.log('Response length:', fullResponse.length);
    console.log('Long conversation handling:', successful ? '✅ PASS' : '❌ FAIL');
    
    return successful;
  } catch (error) {
    console.error('Long conversation test failed:', error);
    return false;
  }
}

/**
 * Test context with reference to previous messages
 */
export async function testPreviousMessageReference(): Promise<boolean> {
  console.log('🧪 Testing reference to previous messages...');
  
  const testConversation: Message[] = [
    { role: Role.USER, content: "I have a dog named Max who loves playing fetch." },
    { role: Role.ASSISTANT, content: "That's wonderful! Max sounds like an energetic dog. Dogs that love fetch are usually very intelligent and active." },
    { role: Role.USER, content: "Yes, he's very smart. He can sit, stay, and roll over." },
    { role: Role.ASSISTANT, content: "Those are great commands! It sounds like you've done an excellent job training Max. Teaching dogs tricks like rolling over shows dedication to their training." }
  ];

  try {
    const stream = generateResponseStream(
      testConversation,
      "What's my dog's name again?", // Should reference Max from earlier context
      [],
      false
    );

    let fullResponse = '';
    for await (const chunk of stream) {
      if (chunk.text) {
        fullResponse += chunk.text;
      }
    }

    // Check if the response correctly identifies the dog's name
    const correctName = fullResponse.toLowerCase().includes('max');
    
    console.log('Response:', fullResponse);
    console.log('Previous message reference:', correctName ? '✅ PASS' : '❌ FAIL');
    
    return correctName;
  } catch (error) {
    console.error('Previous message reference test failed:', error);
    return false;
  }
}

/**
 * Run all context management tests
 */
export async function runContextTests(): Promise<void> {
  console.log('🚀 Starting Context Management Tests\n');
  
  const tests = [
    { name: 'Context Retention', test: testContextRetention },
    { name: 'Long Conversation Handling', test: testLongConversationHandling },
    { name: 'Previous Message Reference', test: testPreviousMessageReference }
  ];
  
  const results: { name: string; passed: boolean; }[] = [];
  
  for (const { name, test } of tests) {
    try {
      const passed = await test();
      results.push({ name, passed });
      console.log(`\n${name}: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
    } catch (error) {
      console.error(`\n${name}: ❌ FAILED (${error})\n`);
      results.push({ name, passed: false });
    }
  }
  
  // Summary
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log('\n📊 Context Management Test Summary:');
  console.log(`${passedCount}/${totalCount} tests passed`);
  
  results.forEach(({ name, passed }) => {
    console.log(`  ${passed ? '✅' : '❌'} ${name}`);
  });
  
  if (passedCount === totalCount) {
    console.log('\n🎉 All context management tests passed!');
  } else {
    console.log('\n⚠️ Some context management tests failed. Check the implementation.');
  }
}

// Make the test function available globally
(window as any).runContextTests = runContextTests;
(window as any).testContextRetention = testContextRetention;
(window as any).testLongConversationHandling = testLongConversationHandling;
(window as any).testPreviousMessageReference = testPreviousMessageReference;
