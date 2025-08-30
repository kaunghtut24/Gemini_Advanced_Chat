/**
 * Debug Web Search Response Structure
 * Run this in browser console to debug web search response issues
 */

console.log('🔍 Web Search Response Debugger');
console.log('================================');

// Monitor console logs for web search activity
function monitorWebSearchLogs() {
  console.log('👀 Monitoring web search logs...');
  console.log('Enable web search and ask: "What is happening in India today?"');
  console.log('');
  
  // Store original console methods
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const webSearchActivity = {
    logs: [],
    errors: [],
    warnings: [],
    chunks: [],
    groundingMetadata: []
  };
  
  // Intercept console.log
  console.log = function(...args) {
    const message = args.join(' ');
    
    // Capture web search related logs
    if (message.includes('🚀 Generating response with web search') ||
        message.includes('🛠️ Using googleSearch tool') ||
        message.includes('📋 Tools config') ||
        message.includes('📦 Raw chunk received') ||
        message.includes('🔍 Grounding metadata found') ||
        message.includes('📚 Found') ||
        message.includes('🔍 Web search queries') ||
        message.includes('🏁 Stream completed') ||
        message.includes('⚠️ Grounding metadata present')) {
      
      webSearchActivity.logs.push({
        timestamp: new Date().toISOString(),
        message: message,
        args: args
      });
      
      // Special handling for chunk data
      if (message.includes('📦 Raw chunk received') && args[1]) {
        webSearchActivity.chunks.push(args[1]);
      }
      
      // Special handling for grounding metadata
      if (message.includes('🔍 Grounding metadata found') && args[1]) {
        webSearchActivity.groundingMetadata.push(args[1]);
      }
      
      originalLog.call(console, '🎯 WEB SEARCH:', ...args);
    } else {
      originalLog.call(console, ...args);
    }
  };
  
  // Intercept console.error
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('web search') || message.includes('grounding') || message.includes('googleSearch')) {
      webSearchActivity.errors.push({
        timestamp: new Date().toISOString(),
        message: message,
        args: args
      });
      originalError.call(console, '❌ WEB SEARCH ERROR:', ...args);
    } else {
      originalError.call(console, ...args);
    }
  };
  
  // Intercept console.warn
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('web search') || message.includes('grounding') || message.includes('googleSearch')) {
      webSearchActivity.warnings.push({
        timestamp: new Date().toISOString(),
        message: message,
        args: args
      });
      originalWarn.call(console, '⚠️ WEB SEARCH WARNING:', ...args);
    } else {
      originalWarn.call(console, ...args);
    }
  };
  
  // Restore original console methods after 45 seconds and show summary
  setTimeout(() => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    
    console.log('');
    console.log('📊 Web Search Debug Summary');
    console.log('============================');
    
    console.log(`📝 Total logs captured: ${webSearchActivity.logs.length}`);
    console.log(`❌ Errors: ${webSearchActivity.errors.length}`);
    console.log(`⚠️ Warnings: ${webSearchActivity.warnings.length}`);
    console.log(`📦 Chunks received: ${webSearchActivity.chunks.length}`);
    console.log(`🔍 Grounding metadata instances: ${webSearchActivity.groundingMetadata.length}`);
    
    console.log('');
    console.log('🔍 Key Findings:');
    
    // Check if web search was enabled
    const webSearchEnabled = webSearchActivity.logs.some(log => 
      log.message.includes('🚀 Generating response with web search: true'));
    console.log(`   - Web search enabled: ${webSearchEnabled ? '✅' : '❌'}`);
    
    // Check if correct tool was used
    const correctTool = webSearchActivity.logs.some(log => 
      log.message.includes('🛠️ Using googleSearch tool'));
    console.log(`   - Correct tool used: ${correctTool ? '✅' : '❌'}`);
    
    // Check if chunks were received
    console.log(`   - Response chunks received: ${webSearchActivity.chunks.length > 0 ? '✅' : '❌'}`);
    
    // Check if grounding metadata was found
    console.log(`   - Grounding metadata found: ${webSearchActivity.groundingMetadata.length > 0 ? '✅' : '❌'}`);
    
    // Analyze chunk structure
    if (webSearchActivity.chunks.length > 0) {
      console.log('');
      console.log('📦 Chunk Analysis:');
      webSearchActivity.chunks.forEach((chunk, index) => {
        console.log(`   Chunk ${index + 1}:`, {
          hasText: !!chunk.text,
          hasCandidates: !!chunk.candidates,
          candidatesLength: chunk.candidates?.length || 0,
          hasGroundingMetadata: !!(chunk.candidates?.[0]?.groundingMetadata || chunk.groundingMetadata)
        });
      });
    }
    
    // Analyze grounding metadata
    if (webSearchActivity.groundingMetadata.length > 0) {
      console.log('');
      console.log('🔍 Grounding Metadata Analysis:');
      webSearchActivity.groundingMetadata.forEach((metadata, index) => {
        console.log(`   Metadata ${index + 1}:`, {
          hasWebSearchQueries: !!metadata.webSearchQueries,
          hasGroundingChunks: !!metadata.groundingChunks,
          hasSearchEntryPoint: !!metadata.searchEntryPoint,
          groundingChunksCount: metadata.groundingChunks?.length || 0,
          webSearchQueriesCount: metadata.webSearchQueries?.length || 0
        });
        
        if (metadata.groundingChunks) {
          console.log(`   Grounding chunks:`, metadata.groundingChunks);
        }
      });
    }
    
    // Provide recommendations
    console.log('');
    console.log('💡 Recommendations:');
    if (!webSearchEnabled) {
      console.log('   ❌ Enable the "Search the web" checkbox first');
    } else if (!correctTool) {
      console.log('   ❌ Tool configuration issue - check aiProviderService.ts');
    } else if (webSearchActivity.chunks.length === 0) {
      console.log('   ❌ No response chunks received - check API connection');
    } else if (webSearchActivity.groundingMetadata.length === 0) {
      console.log('   ⚠️ No grounding metadata found - web search may not have been triggered');
      console.log('   💡 Try asking more specific current events questions');
    } else {
      console.log('   ✅ Web search appears to be working correctly');
    }
    
    // Store results for further inspection
    window.webSearchDebugResults = webSearchActivity;
    console.log('');
    console.log('🔧 Debug data stored in: window.webSearchDebugResults');
    
  }, 45000);
  
  console.log('⏱️ Monitoring for 45 seconds...');
  console.log('💡 Now ask a current events question with web search enabled');
}

// Main debug function
window.debugWebSearchResponse = function() {
  console.clear();
  console.log('🔍 Web Search Response Debugger');
  console.log('================================');
  console.log('');
  
  // Check if web search is enabled
  const toggle = document.querySelector('.web-search-toggle input[type="checkbox"]');
  if (!toggle?.checked) {
    console.log('⚠️ Web search is not enabled. Enabling it now...');
    if (toggle) {
      toggle.click();
      console.log('✅ Web search enabled');
    } else {
      console.log('❌ Could not find web search toggle');
      return;
    }
  } else {
    console.log('✅ Web search is already enabled');
  }
  
  console.log('');
  console.log('📝 Instructions:');
  console.log('1. Ask a current events question like: "What is happening in India today?"');
  console.log('2. Watch the console for detailed web search activity');
  console.log('3. Wait for the debug summary after 45 seconds');
  console.log('');
  
  monitorWebSearchLogs();
};

// Auto-run
console.log('🚀 Starting Web Search Response Debugger...');
console.log('Type debugWebSearchResponse() to run this again');
console.log('');
window.debugWebSearchResponse();
