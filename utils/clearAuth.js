/**
 * Debug utility to clear authentication state
 * Run this in browser console if you're stuck at the main app without login
 */

// Clear authentication data
localStorage.removeItem('gemini-auth-state');

// Also clear any session data that might interfere
const keysToCheck = [
  'gemini-auth-state',
  'gemini-chat-sessions',
  'gemini-api-key'
];

console.log('🧹 Clearing authentication and session data...');

keysToCheck.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    console.log(`🗑️ Removing ${key}:`, value.substring(0, 50) + '...');
    localStorage.removeItem(key);
  } else {
    console.log(`✅ ${key}: not found`);
  }
});

console.log('🔄 Reload the page to see login screen');
console.log('💡 If still not working, check:');
console.log('   1. Backend server running on port 3001');
console.log('   2. Browser console for authentication logs');
console.log('   3. .env file configuration');

// Auto-reload the page
setTimeout(() => {
  window.location.reload();
}, 1000);
