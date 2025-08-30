/**
 * Debug utility to check API key configuration
 * Run this in browser console to debug API key issues
 */

console.log('🔍 Debugging API Key Configuration...');

// Check localStorage for saved providers
const savedProviders = localStorage.getItem('aiProviders');
console.log('📦 Raw localStorage aiProviders:', savedProviders);

if (savedProviders) {
  try {
    const parsed = JSON.parse(savedProviders);
    console.log('📋 Parsed providers:', parsed);
    
    if (parsed.providers) {
      parsed.providers.forEach((provider, index) => {
        console.log(`Provider ${index + 1}: ${provider.provider}`);
        console.log(`  - API Key present: ${!!provider.apiKey}`);
        console.log(`  - API Key length: ${provider.apiKey ? provider.apiKey.length : 0}`);
        if (provider.apiKey) {
          console.log(`  - API Key preview: ${provider.apiKey.substring(0, 10)}...`);
        }
      });
    }
    
    if (parsed.customProviders && parsed.customProviders.length > 0) {
      console.log('🔧 Custom providers:', parsed.customProviders.length);
      parsed.customProviders.forEach((provider, index) => {
        console.log(`Custom Provider ${index + 1}: ${provider.provider}`);
        console.log(`  - API Key present: ${!!provider.apiKey}`);
      });
    }
  } catch (error) {
    console.error('❌ Error parsing saved providers:', error);
  }
} else {
  console.log('❌ No saved providers found in localStorage');
}

// Check environment variables
console.log('🌍 Environment variables:');
console.log(`  - VITE_API_KEY: ${import.meta.env.VITE_API_KEY ? 'Present' : 'Not set'}`);
console.log(`  - VITE_GEMINI_API_KEY: ${import.meta.env.VITE_GEMINI_API_KEY ? 'Present' : 'Not set'}`);
console.log(`  - VITE_OPENAI_API_KEY: ${import.meta.env.VITE_OPENAI_API_KEY ? 'Present' : 'Not set'}`);

// Instructions
console.log('');
console.log('💡 To fix API key issues:');
console.log('1. Open Settings (gear icon in sidebar)');
console.log('2. Enter your Gemini API key in the "Provider API Keys" section');
console.log('3. Click "Save Settings"');
console.log('4. Try sending a message again');
console.log('');
console.log('🔗 Get Gemini API key: https://ai.google.dev/gemini-api/docs/api-key');
