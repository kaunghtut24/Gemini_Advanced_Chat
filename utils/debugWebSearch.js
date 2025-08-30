/**
 * Debug utility to test web search functionality
 * Run this in browser console to debug web search issues
 */

console.log('🔍 Debugging Web Search Functionality...');

// Check web search provider configurations
const searchProviders = localStorage.getItem('webSearchProviders');
console.log('📦 Raw localStorage webSearchProviders:', searchProviders);

if (searchProviders) {
  try {
    const parsed = JSON.parse(searchProviders);
    console.log('📋 Parsed search providers:', parsed);
    
    parsed.forEach((provider, index) => {
      console.log(`Search Provider ${index + 1}: ${provider.provider}`);
      console.log(`  - Is Default: ${provider.isDefault}`);
      console.log(`  - API Key present: ${!!provider.apiKey}`);
      if (provider.apiKey) {
        console.log(`  - API Key length: ${provider.apiKey.length}`);
      }
    });
    
    const defaultProvider = parsed.find(p => p.isDefault);
    if (defaultProvider) {
      console.log(`🎯 Default search provider: ${defaultProvider.provider}`);
    }
  } catch (error) {
    console.error('❌ Error parsing search providers:', error);
  }
} else {
  console.log('❌ No search providers found in localStorage');
}

// Check if web search toggle is working
console.log('');
console.log('🔧 Web Search Toggle Test:');
console.log('1. Look for the "Search the web" checkbox in the chat interface');
console.log('2. Toggle it on and check browser console for logs');
console.log('3. Send a query like "What is the latest news about AI?"');
console.log('4. Check for web search logs in console');

// Test function to simulate web search
window.testWebSearch = async function(query = "latest AI news") {
  console.log(`🧪 Testing web search with query: "${query}"`);
  
  try {
    // This would normally be called from the chat interface
    console.log('⚠️ This is a simulation - actual web search happens through the chat interface');
    console.log('To test properly:');
    console.log('1. Enable "Search the web" toggle');
    console.log('2. Send a message asking about current events');
    console.log('3. Watch console for web search logs');
    
    return 'Test function - use the actual chat interface to test web search';
  } catch (error) {
    console.error('❌ Web search test error:', error);
    return error.message;
  }
};

// Instructions
console.log('');
console.log('💡 To test web search functionality:');
console.log('1. Enable the "Search the web" toggle in the chat interface');
console.log('2. Ask a question about current events, e.g.:');
console.log('   - "What are the latest developments in AI?"');
console.log('   - "What happened in the news today?"');
console.log('   - "Current weather in New York"');
console.log('3. Check browser console for web search logs');
console.log('4. Look for sources in the response');
console.log('');
console.log('🔧 Debug commands:');
console.log('- testWebSearch() - Run basic test');
console.log('- Check console logs for "🔍" and "📚" emojis');
console.log('');
console.log('🌐 Search Provider Setup:');
console.log('- Gemini: Built-in (no API key needed)');
console.log('- Tavily: Requires API key from https://tavily.com/');
console.log('- SerpAPI: Requires API key from https://serpapi.com/');
