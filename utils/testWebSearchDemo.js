/**
 * Web Search Demo and Testing Utility
 * Run this in browser console to test and demonstrate web search functionality
 */

console.log('🌐 Web Search Demo and Testing Utility');
console.log('=====================================');

// Check if web search toggle is visible
function checkWebSearchToggle() {
  const toggle = document.querySelector('.web-search-toggle input[type="checkbox"]');
  const toggleContainer = document.querySelector('.web-search-toggle');
  
  console.log('🔍 Web Search Toggle Status:');
  console.log(`  - Toggle element found: ${!!toggle}`);
  console.log(`  - Toggle container found: ${!!toggleContainer}`);
  
  if (toggle) {
    console.log(`  - Currently enabled: ${toggle.checked}`);
    console.log(`  - Toggle is visible: ${toggleContainer?.offsetParent !== null}`);
    
    if (!toggle.checked) {
      console.log('');
      console.log('💡 To enable web search:');
      console.log('1. Look for the "Search the web" checkbox below the message input');
      console.log('2. Check the checkbox to enable web search');
      console.log('3. Ask a question about current events');
      console.log('');
      console.log('🎯 Try these example queries:');
      console.log('- "What is happening in India today?"');
      console.log('- "Latest news about AI developments"');
      console.log('- "Current weather in New York"');
      console.log('- "Recent stock market updates"');
    } else {
      console.log('✅ Web search is currently enabled!');
    }
  } else {
    console.log('❌ Web search toggle not found. Check if ChatWindow is loaded.');
  }
  
  return { toggle, enabled: toggle?.checked || false };
}

// Auto-enable web search for testing
function enableWebSearch() {
  const toggle = document.querySelector('.web-search-toggle input[type="checkbox"]');
  
  if (toggle && !toggle.checked) {
    console.log('🔄 Enabling web search automatically...');
    toggle.click();
    console.log('✅ Web search enabled!');
    
    // Check provider selection
    setTimeout(() => {
      const providerSelect = document.querySelector('.search-provider-dropdown');
      if (providerSelect) {
        console.log(`🤖 Current search provider: ${providerSelect.value}`);
        if (providerSelect.value === 'gemini') {
          console.log('✅ Using Gemini built-in search (recommended)');
        }
      }
    }, 100);
    
    return true;
  } else if (toggle?.checked) {
    console.log('✅ Web search is already enabled!');
    return true;
  } else {
    console.log('❌ Could not find web search toggle');
    return false;
  }
}

// Test web search with a sample query
function testWebSearchQuery() {
  const enabled = enableWebSearch();
  
  if (!enabled) {
    console.log('❌ Cannot test - web search toggle not found');
    return;
  }
  
  console.log('');
  console.log('🧪 Testing Web Search Query...');
  console.log('');
  console.log('📝 Instructions:');
  console.log('1. Web search has been enabled');
  console.log('2. Type this query in the message box: "What are the latest AI developments?"');
  console.log('3. Send the message');
  console.log('4. Watch the console for web search logs');
  console.log('5. Look for sources in the AI response');
  console.log('');
  console.log('🔍 Expected console logs:');
  console.log('- "🚀 Generating response with web search: true"');
  console.log('- "🛠️ Using googleSearch tool for model: gemini-2.5-flash"');
  console.log('- "📚 Found X web sources"');
  console.log('');
  console.log('📊 Expected response:');
  console.log('- AI should provide current, up-to-date information');
  console.log('- Response should include recent developments');
  console.log('- Sources should be displayed below the response');
}

// Check for web search indicators
function checkWebSearchIndicators() {
  const statusIndicator = document.querySelector('.search-status-indicator');
  const providerSelector = document.querySelector('.search-provider-selector');
  
  console.log('🎯 Web Search UI Indicators:');
  console.log(`  - Status indicator: ${!!statusIndicator}`);
  console.log(`  - Provider selector: ${!!providerSelector}`);
  
  if (statusIndicator) {
    console.log(`  - Status text: "${statusIndicator.textContent?.trim()}"`);
  }
  
  if (providerSelector) {
    const select = providerSelector.querySelector('select');
    console.log(`  - Selected provider: ${select?.value || 'none'}`);
  }
}

// Main demo function
window.demoWebSearch = function() {
  console.clear();
  console.log('🌐 Web Search Demo Starting...');
  console.log('');
  
  // Step 1: Check current status
  const status = checkWebSearchToggle();
  console.log('');
  
  // Step 2: Check UI indicators
  checkWebSearchIndicators();
  console.log('');
  
  // Step 3: Enable and test
  testWebSearchQuery();
  
  console.log('');
  console.log('🔧 Debug Commands:');
  console.log('- demoWebSearch() - Run this demo again');
  console.log('- enableWebSearch() - Auto-enable web search');
  console.log('- checkWebSearchToggle() - Check toggle status');
  console.log('- checkWebSearchIndicators() - Check UI indicators');
};

// Auto-run demo
console.log('');
console.log('🚀 Running Web Search Demo...');
console.log('Type demoWebSearch() to run this demo again');
console.log('');

// Run the demo
window.demoWebSearch();
