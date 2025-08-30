/**
 * Updated Web Search Test - Based on Official Gemini API Documentation
 * Run this in browser console to test the fixed web search functionality
 */

console.log('🔧 Testing Fixed Web Search Functionality');
console.log('==========================================');

// Test the web search toggle and configuration
function testWebSearchConfiguration() {
  console.log('🔍 Testing Web Search Configuration...');
  
  const toggle = document.querySelector('.web-search-toggle input[type="checkbox"]');
  const providerSelect = document.querySelector('.search-provider-dropdown');
  
  if (!toggle) {
    console.error('❌ Web search toggle not found');
    return false;
  }
  
  // Enable web search if not already enabled
  if (!toggle.checked) {
    console.log('🔄 Enabling web search...');
    toggle.click();
  }
  
  // Verify Gemini provider is selected
  if (providerSelect && providerSelect.value !== 'gemini') {
    console.log('🔄 Switching to Gemini provider...');
    providerSelect.value = 'gemini';
    providerSelect.dispatchEvent(new Event('change'));
  }
  
  console.log('✅ Web search configuration complete');
  console.log(`   - Web search enabled: ${toggle.checked}`);
  console.log(`   - Provider: ${providerSelect?.value || 'unknown'}`);
  
  return true;
}

// Test with a specific query that should trigger web search
function testWebSearchQuery() {
  console.log('');
  console.log('🧪 Testing Web Search Query...');
  console.log('');
  
  const configured = testWebSearchConfiguration();
  if (!configured) {
    console.error('❌ Cannot test - web search not configured properly');
    return;
  }
  
  console.log('📝 Test Instructions:');
  console.log('1. Web search has been enabled with Gemini provider');
  console.log('2. Copy and paste this query: "What are the latest news headlines today?"');
  console.log('3. Send the message');
  console.log('4. Watch console for these expected logs:');
  console.log('');
  console.log('🔍 Expected Console Output:');
  console.log('✅ "🚀 Generating response with web search: true"');
  console.log('✅ "🛠️ Using googleSearch tool for model: gemini-2.5-flash"');
  console.log('✅ "📋 Tools config: [{"googleSearch": {}}]"');
  console.log('✅ "🔍 Grounding metadata found"');
  console.log('✅ "📚 Found X web sources from grounding metadata"');
  console.log('');
  console.log('📊 Expected Response:');
  console.log('✅ AI should provide current news information');
  console.log('✅ Response should NOT say "I cannot access real-time information"');
  console.log('✅ Sources should be displayed below the response');
  console.log('✅ Response should be current and up-to-date');
}

// Check for proper API configuration
function checkApiConfiguration() {
  console.log('🔧 Checking API Configuration...');
  
  // Check if API key is available
  const hasApiKey = localStorage.getItem('aiProviders');
  let apiKeyStatus = false;
  
  if (hasApiKey) {
    try {
      const parsed = JSON.parse(hasApiKey);
      const geminiProvider = parsed.providers?.find(p => p.provider === 'gemini');
      apiKeyStatus = !!geminiProvider?.apiKey;
    } catch (e) {
      console.error('Error parsing API configuration:', e);
    }
  }
  
  console.log(`   - API Key configured: ${apiKeyStatus ? '✅' : '❌'}`);
  console.log(`   - Environment variable: ${import.meta.env.VITE_API_KEY ? '✅' : '❌'}`);
  console.log(`   - Development mode: ${import.meta.env.DEV ? '✅' : '❌'}`);
  
  if (!apiKeyStatus && !import.meta.env.VITE_API_KEY) {
    console.error('❌ No API key found. Please configure API key in Settings or environment variables.');
    return false;
  }
  
  return true;
}

// Monitor console for web search activity
function monitorWebSearchActivity() {
  console.log('');
  console.log('👀 Monitoring Web Search Activity...');
  console.log('Send a message about current events and watch for these logs:');
  console.log('');
  
  // Store original console.log to intercept logs
  const originalLog = console.log;
  const webSearchLogs = [];
  
  console.log = function(...args) {
    const message = args.join(' ');
    
    // Capture web search related logs
    if (message.includes('🚀 Generating response with web search') ||
        message.includes('🛠️ Using googleSearch tool') ||
        message.includes('🔍 Grounding metadata found') ||
        message.includes('📚 Found') ||
        message.includes('🔍 Web search queries')) {
      webSearchLogs.push(message);
      originalLog.call(console, '🎯 WEB SEARCH LOG:', ...args);
    } else {
      originalLog.call(console, ...args);
    }
  };
  
  // Restore original console.log after 30 seconds
  setTimeout(() => {
    console.log = originalLog;
    console.log('');
    console.log('📊 Web Search Activity Summary:');
    if (webSearchLogs.length > 0) {
      webSearchLogs.forEach(log => console.log(`   ✅ ${log}`));
      console.log('');
      console.log('🎉 Web search appears to be working!');
    } else {
      console.log('   ❌ No web search activity detected');
      console.log('   💡 Make sure to enable web search and ask about current events');
    }
  }, 30000);
  
  console.log('⏱️ Monitoring for 30 seconds...');
}

// Main test function
window.testFixedWebSearch = function() {
  console.clear();
  console.log('🔧 Testing Fixed Web Search Functionality');
  console.log('Based on Official Gemini API Documentation');
  console.log('==========================================');
  console.log('');
  
  // Step 1: Check API configuration
  const apiConfigured = checkApiConfiguration();
  if (!apiConfigured) {
    console.log('');
    console.log('💡 Fix API configuration first, then run testFixedWebSearch() again');
    return;
  }
  
  console.log('');
  
  // Step 2: Test web search query
  testWebSearchQuery();
  
  console.log('');
  
  // Step 3: Start monitoring
  monitorWebSearchActivity();
  
  console.log('');
  console.log('🔧 Debug Commands:');
  console.log('- testFixedWebSearch() - Run this test again');
  console.log('- testWebSearchConfiguration() - Check web search setup');
  console.log('- checkApiConfiguration() - Verify API key setup');
};

// Auto-run the test
console.log('🚀 Running Fixed Web Search Test...');
console.log('Type testFixedWebSearch() to run this test again');
console.log('');

// Run the test
window.testFixedWebSearch();
