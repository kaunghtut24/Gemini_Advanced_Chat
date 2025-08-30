/**
 * Test utility for API key persistence
 * Run this in browser console to test environment variable handling
 */

console.log('🧪 Testing API Key Persistence...');

// Test environment variable detection
console.log('🌍 Environment Variables:');
console.log(`  - VITE_API_KEY: ${import.meta.env.VITE_API_KEY ? '✅ Present' : '❌ Not set'}`);
console.log(`  - VITE_GEMINI_API_KEY: ${import.meta.env.VITE_GEMINI_API_KEY ? '✅ Present' : '❌ Not set'}`);
console.log(`  - VITE_OPENAI_API_KEY: ${import.meta.env.VITE_OPENAI_API_KEY ? '✅ Present' : '❌ Not set'}`);
console.log(`  - Development Mode: ${import.meta.env.DEV ? '✅ Yes' : '❌ No'}`);

// Test localStorage state
const savedProviders = localStorage.getItem('aiProviders');
console.log('💾 localStorage State:');
if (savedProviders) {
  try {
    const parsed = JSON.parse(savedProviders);
    console.log('  - Saved providers found:', parsed.providers?.length || 0);
    parsed.providers?.forEach(provider => {
      console.log(`    - ${provider.provider}: ${provider.apiKey ? 'Has key' : 'No key'}`);
    });
  } catch (error) {
    console.error('  - Error parsing saved providers:', error);
  }
} else {
  console.log('  - No saved providers in localStorage');
}

// Test the priority logic
console.log('🔧 Priority Logic Test:');
const geminiEnvKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
const isDev = import.meta.env.DEV;

if (isDev && geminiEnvKey) {
  console.log('✅ In development mode with environment variable:');
  console.log('   - Environment variable should take priority');
  console.log('   - Settings should show "Using Environment Variable"');
  console.log('   - API calls should work without manual key entry');
} else if (!isDev && geminiEnvKey) {
  console.log('⚠️ In production mode with environment variable:');
  console.log('   - localStorage takes priority over environment variable');
  console.log('   - User can override environment variable in settings');
} else {
  console.log('❌ No environment variable found:');
  console.log('   - User must enter API key in settings');
  console.log('   - Key will be saved to localStorage');
}

// Test function to simulate refresh
window.testRefresh = function() {
  console.log('🔄 Simulating page refresh...');
  console.log('Environment variables persist: ✅');
  console.log('localStorage persists: ✅');
  console.log('API key should be available immediately after refresh');
  
  // Check if API key would be available
  const wouldHaveKey = (isDev && geminiEnvKey) || 
                       (savedProviders && JSON.parse(savedProviders).providers?.find(p => p.provider === 'gemini')?.apiKey);
  
  console.log(`API key available after refresh: ${wouldHaveKey ? '✅' : '❌'}`);
  return wouldHaveKey;
};

// Instructions
console.log('');
console.log('💡 To test API key persistence:');
console.log('1. Check that environment variable is detected above');
console.log('2. Open Settings and verify "Using Environment Variable" is shown');
console.log('3. Refresh the page (F5) and check that API key is still available');
console.log('4. Try sending a message to verify API key works');
console.log('');
console.log('🔧 Debug commands:');
console.log('- testRefresh() - Test refresh simulation');
console.log('- Check console for environment variable status');
console.log('');
console.log('📝 Expected behavior:');
console.log('- Development mode: Environment variables take priority');
console.log('- Production mode: localStorage takes priority');
console.log('- Settings UI shows environment variable status');
console.log('- No need to re-enter API key after refresh');
