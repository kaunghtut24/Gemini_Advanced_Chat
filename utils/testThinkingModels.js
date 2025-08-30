/**
 * Thinking Models Test Utility
 * Run this in browser console to test thinking model response formatting
 */

console.log('🧠 Thinking Models Test Utility');
console.log('===============================');

// Test thinking content parser
function testThinkingParser() {
  console.log('🧪 Testing Thinking Content Parser...');
  
  // Sample thinking model responses for testing
  const testResponses = [
    {
      name: "Explicit Thinking Pattern",
      content: `Let me think about this step by step. First, I need to understand what you're asking. The question involves analyzing the relationship between two concepts. I should consider multiple perspectives and examine the evidence.

Based on this analysis, here's my answer: The relationship is complex and multifaceted, involving several key factors that interact in interesting ways.`
    },
    {
      name: "Question Analysis Pattern", 
      content: `The question you're asking touches on a fundamental concept in computer science. To understand this properly, I need to break down the components and examine how they work together. Let me analyze each part systematically.

To answer this: The concept works by utilizing a combination of algorithms and data structures that optimize for both speed and memory efficiency.`
    },
    {
      name: "Step-by-Step Pattern",
      content: `Step 1: First, I need to identify the core problem you're trying to solve.
Step 2: Then I should consider the various approaches available.
Step 3: Next, I'll evaluate the pros and cons of each approach.

Final answer: Based on this systematic analysis, the best approach would be to use a hybrid solution that combines the strengths of multiple methods.`
    },
    {
      name: "Reasoning Pattern",
      content: `Given that this is a complex topic, I should consider multiple factors. Because the situation involves several variables, I need to analyze how they interact. Since there are different perspectives on this issue, let me examine each one carefully.

Therefore, my conclusion is that the most effective solution requires a balanced approach that takes into account all these different factors.`
    },
    {
      name: "Short Response (Should NOT be parsed)",
      content: `This is a simple, direct answer without any thinking process shown.`
    },
    {
      name: "Regular Response (Should NOT be parsed)",
      content: `Here's a straightforward explanation of the concept. It works by following these principles and applying them in a systematic way. The key benefits include improved efficiency and better results.`
    }
  ];

  // Test each response
  testResponses.forEach((test, index) => {
    console.log(`\n📝 Test ${index + 1}: ${test.name}`);
    console.log(`Content length: ${test.content.length} characters`);
    
    // Simulate the parsing function (simplified version)
    const result = parseThinkingContent(test.content);
    
    console.log(`✅ Has thinking: ${result.hasThinking}`);
    if (result.hasThinking) {
      console.log(`🧠 Thinking length: ${result.thinking.length} characters`);
      console.log(`💡 Answer length: ${result.finalAnswer.length} characters`);
      console.log(`🧠 Thinking preview: "${result.thinking.substring(0, 100)}..."`);
      console.log(`💡 Answer preview: "${result.finalAnswer.substring(0, 100)}..."`);
    } else {
      console.log(`📄 Full content treated as final answer`);
    }
  });
}

// Simplified version of the parsing function for testing
function parseThinkingContent(text) {
  if (text.length < 100) {
    return { hasThinking: false, thinking: '', finalAnswer: text };
  }

  const patterns = [
    /^(.*?(?:let me think|i need to|first, i|let me consider|i should|let me analyze).*?)\n\n(?:here's|let me provide|i'll give you|based on this|to answer|the answer is|in summary|so,|therefore,)(.*)/si,
    /^(.*?(?:step 1|first step|initially|to start|beginning with).*?)\n\n(?:final answer|conclusion|result|summary|in summary|therefore|so the answer)(.*)/si,
    /^(.*?(?:because|since|given that|considering|analyzing).*?)\n\n(?:therefore|thus|so|in conclusion|finally|as a result)(.*)/si,
    /^(.*?(?:the question|this asks|you're asking|to understand|breaking this down).*?)\n\n(?:the answer|my response|here's what|to answer this)(.*)/si,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const thinking = match[1]?.trim();
      const finalAnswer = match[2]?.trim();
      
      if (thinking && finalAnswer && thinking.length > 50 && finalAnswer.length > 20) {
        const thinkingIndicators = /\b(let me|i need to|first|then|because|since|if|when|how|why|what|should|could|would|consider|analyze|think|reason|step|approach|method)\b/i;
        
        if (thinkingIndicators.test(thinking)) {
          return { hasThinking: true, thinking, finalAnswer };
        }
      }
    }
  }

  // Implicit pattern detection
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  if (paragraphs.length >= 4 && text.length > 300) {
    const splitPoints = [
      Math.floor(paragraphs.length * 0.4),
      Math.floor(paragraphs.length * 0.5),
      Math.floor(paragraphs.length * 0.6)
    ];
    
    for (const splitPoint of splitPoints) {
      const firstPart = paragraphs.slice(0, splitPoint).join('\n\n');
      const secondPart = paragraphs.slice(splitPoint).join('\n\n');
      
      const reasoningPattern = /\b(let me|i need to|first|consider|analyze|think about|step|approach|because|since|given|assuming|if we|when we|to understand|breaking down|looking at|examining)\b/i;
      const conclusionPattern = /\b(so|therefore|thus|in conclusion|finally|to summarize|the answer is|here's|based on this|as a result|consequently|this means|we can conclude)\b/i;
      
      const hasReasoning = reasoningPattern.test(firstPart);
      const hasConclusion = conclusionPattern.test(secondPart);
      const goodLength = firstPart.length > 150 && secondPart.length > 50;
      
      const questionCount = (firstPart.match(/\?/g) || []).length;
      const analysisWords = (firstPart.match(/\b(analyze|consider|examine|evaluate|assess|determine|identify|understand)\b/gi) || []).length;
      const hasAnalyticalContent = questionCount > 0 || analysisWords > 1;
      
      if (hasReasoning && hasConclusion && goodLength && hasAnalyticalContent) {
        return { hasThinking: true, thinking: firstPart, finalAnswer: secondPart };
      }
    }
  }

  return { hasThinking: false, thinking: '', finalAnswer: text };
}

// Test thinking model UI
function testThinkingUI() {
  console.log('\n🎨 Testing Thinking Model UI...');
  
  // Check if thinking toggle buttons exist
  const thinkingToggles = document.querySelectorAll('.thinking-toggle-btn');
  console.log(`📊 Found ${thinkingToggles.length} thinking toggle buttons`);
  
  if (thinkingToggles.length > 0) {
    console.log('✅ Thinking model UI is present');
    thinkingToggles.forEach((toggle, index) => {
      console.log(`   Toggle ${index + 1}: "${toggle.textContent?.trim()}"`);
    });
    
    // Test clicking the first toggle
    if (thinkingToggles[0]) {
      console.log('\n🖱️ Testing toggle functionality...');
      const originalText = thinkingToggles[0].textContent;
      thinkingToggles[0].click();
      
      setTimeout(() => {
        const newText = thinkingToggles[0].textContent;
        console.log(`   Before click: "${originalText}"`);
        console.log(`   After click: "${newText}"`);
        console.log(`   Toggle working: ${originalText !== newText ? '✅' : '❌'}`);
        
        // Check if thinking content is visible
        const thinkingContent = document.querySelector('.thinking-content');
        console.log(`   Thinking content visible: ${thinkingContent ? '✅' : '❌'}`);
        
        if (thinkingContent) {
          const thinkingBody = thinkingContent.querySelector('.thinking-body');
          const thinkingSeparator = thinkingContent.querySelector('.thinking-separator');
          console.log(`   Thinking body present: ${thinkingBody ? '✅' : '❌'}`);
          console.log(`   Thinking separator present: ${thinkingSeparator ? '✅' : '❌'}`);
        }
      }, 100);
    }
  } else {
    console.log('ℹ️ No thinking model responses found in current conversation');
    console.log('💡 Try asking a complex question to a Gemini 2.5 model to see thinking responses');
  }
}

// Check current model for thinking capability
function checkThinkingModelSupport() {
  console.log('\n🤖 Checking Current Model for Thinking Support...');
  
  const modelIndicator = document.querySelector('.model-name');
  if (modelIndicator) {
    const modelName = modelIndicator.textContent?.toLowerCase() || '';
    console.log(`📋 Current model: ${modelIndicator.textContent}`);
    
    const isThinkingModel = modelName.includes('2.5') || modelName.includes('thinking');
    console.log(`🧠 Supports thinking: ${isThinkingModel ? '✅' : '❌'}`);
    
    if (isThinkingModel) {
      console.log('💡 This model supports thinking! Try asking complex questions like:');
      console.log('   - "Explain the pros and cons of different sorting algorithms"');
      console.log('   - "How would you design a scalable web application?"');
      console.log('   - "What are the ethical implications of AI in healthcare?"');
    } else {
      console.log('💡 Switch to a Gemini 2.5 model to see thinking responses');
    }
  } else {
    console.log('❌ Could not determine current model');
  }
}

// Main test function
window.testThinkingModels = function() {
  console.clear();
  console.log('🧠 Thinking Models Test Suite');
  console.log('============================');
  console.log('');
  
  // Run all tests
  testThinkingParser();
  testThinkingUI();
  checkThinkingModelSupport();
  
  console.log('');
  console.log('🔧 Available Commands:');
  console.log('- testThinkingModels() - Run full test suite');
  console.log('- testThinkingParser() - Test content parsing only');
  console.log('- testThinkingUI() - Test UI components only');
  console.log('- checkThinkingModelSupport() - Check current model');
  console.log('');
  console.log('📝 To test thinking responses:');
  console.log('1. Switch to a Gemini 2.5 model');
  console.log('2. Ask a complex analytical question');
  console.log('3. Look for the "🧠 Show Thinking" button in the response');
};

// Auto-run
console.log('🚀 Loading Thinking Models Test Utility...');
console.log('Type testThinkingModels() to run the test suite');
console.log('');
