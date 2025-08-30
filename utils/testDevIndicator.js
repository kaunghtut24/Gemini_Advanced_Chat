/**
 * Development Mode Indicator Test Utility
 * Run this in browser console to test DEV indicator visibility
 */

console.log('🔧 Development Mode Indicator Test');
console.log('==================================');

function testDevIndicator() {
  console.log('🔍 Testing DEV Indicator Visibility...');
  
  const devIndicator = document.querySelector('.dev-mode-indicator');
  const header = document.querySelector('.app-header h1');
  
  if (!devIndicator) {
    console.log('❌ DEV indicator not found');
    console.log('💡 This could mean:');
    console.log('   - Not in development mode');
    console.log('   - Not on localhost/local network');
    console.log('   - Authentication not bypassed');
    
    // Check if we're in development mode
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname.includes('192.168.') ||
                  window.location.hostname.includes('10.0.') ||
                  window.location.hostname.includes('172.');
    
    console.log(`🌐 Current hostname: ${window.location.hostname}`);
    console.log(`🔧 Development environment: ${isDev ? 'Yes' : 'No'}`);
    
    if (isDev) {
      console.log('⚠️ DEV indicator should be visible but is not found');
      console.log('💡 Try refreshing the page to trigger auth bypass');
    }
    
    return false;
  }
  
  console.log('✅ DEV indicator found');
  
  // Test visibility
  const styles = getComputedStyle(devIndicator);
  const rect = devIndicator.getBoundingClientRect();
  
  console.log('📊 DEV Indicator Analysis:');
  console.log(`   Text content: "${devIndicator.textContent}"`);
  console.log(`   Display: ${styles.display}`);
  console.log(`   Visibility: ${styles.visibility}`);
  console.log(`   Opacity: ${styles.opacity}`);
  console.log(`   Color: ${styles.color}`);
  console.log(`   Background: ${styles.backgroundColor}`);
  console.log(`   Border: ${styles.border}`);
  console.log(`   Font size: ${styles.fontSize}`);
  console.log(`   Font weight: ${styles.fontWeight}`);
  console.log(`   Position: ${rect.x}, ${rect.y}`);
  console.log(`   Size: ${rect.width}x${rect.height}`);
  
  // Check if it's actually visible
  const isVisible = rect.width > 0 && rect.height > 0 && 
                   styles.display !== 'none' && 
                   styles.visibility !== 'hidden' && 
                   parseFloat(styles.opacity) > 0;
  
  console.log(`   Actually visible: ${isVisible ? '✅' : '❌'}`);
  
  if (!isVisible) {
    console.log('⚠️ DEV indicator exists but is not visible');
    console.log('🔧 Attempting to fix visibility...');
    
    // Force visibility
    devIndicator.style.display = 'inline-block';
    devIndicator.style.visibility = 'visible';
    devIndicator.style.opacity = '1';
    devIndicator.style.color = '#ff6b35';
    devIndicator.style.backgroundColor = 'rgba(255, 107, 53, 0.15)';
    devIndicator.style.border = '2px solid #ff6b35';
    devIndicator.style.padding = '0.3rem 0.6rem';
    devIndicator.style.borderRadius = '4px';
    devIndicator.style.fontSize = '0.75rem';
    devIndicator.style.fontWeight = '700';
    devIndicator.style.textTransform = 'uppercase';
    devIndicator.style.letterSpacing = '0.5px';
    
    console.log('✅ Applied visibility fixes');
  }
  
  return true;
}

function testAuthBypass() {
  console.log('\n🔐 Testing Authentication Bypass...');
  
  // Check if we're authenticated
  const authState = localStorage.getItem('authState');
  
  if (authState) {
    try {
      const parsed = JSON.parse(authState);
      console.log('✅ Auth state found:');
      console.log(`   Email: ${parsed.email}`);
      console.log(`   Authenticated: ${parsed.isAuthenticated}`);
      console.log(`   Token: ${parsed.token ? 'Present' : 'Missing'}`);
      
      if (parsed.email === 'dev@localhost') {
        console.log('✅ Development authentication active');
        return true;
      } else {
        console.log('ℹ️ Regular authentication (not dev mode)');
        return false;
      }
    } catch (e) {
      console.log('❌ Error parsing auth state:', e);
      return false;
    }
  } else {
    console.log('❌ No auth state found');
    return false;
  }
}

function forceDevMode() {
  console.log('\n🔧 Forcing Development Mode...');
  
  // Create development auth state
  const devAuthState = {
    isAuthenticated: true,
    email: 'dev@localhost',
    token: 'dev-token-' + Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
  };
  
  localStorage.setItem('authState', JSON.stringify(devAuthState));
  console.log('✅ Development auth state created');
  console.log('🔄 Refreshing page to apply changes...');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

function highlightDevIndicator() {
  console.log('\n✨ Highlighting DEV Indicator...');
  
  const devIndicator = document.querySelector('.dev-mode-indicator');
  
  if (devIndicator) {
    // Add a temporary highlight effect
    const originalStyle = devIndicator.style.cssText;
    
    devIndicator.style.cssText += `
      animation: highlight-dev 3s ease-in-out;
      transform: scale(1.1);
      box-shadow: 0 0 20px rgba(255, 107, 53, 0.8);
      z-index: 9999;
      position: relative;
    `;
    
    // Add highlight animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes highlight-dev {
        0%, 100% { 
          background: rgba(255, 107, 53, 0.15);
          border-color: #ff6b35;
        }
        25% { 
          background: rgba(255, 107, 53, 0.4);
          border-color: #ff4500;
        }
        50% { 
          background: rgba(255, 107, 53, 0.6);
          border-color: #ff6b35;
        }
        75% { 
          background: rgba(255, 107, 53, 0.4);
          border-color: #ff4500;
        }
      }
    `;
    document.head.appendChild(style);
    
    console.log('✅ DEV indicator highlighted for 3 seconds');
    
    setTimeout(() => {
      devIndicator.style.cssText = originalStyle;
      document.head.removeChild(style);
      console.log('🔄 Highlight effect removed');
    }, 3000);
  } else {
    console.log('❌ DEV indicator not found to highlight');
  }
}

// Main test function
window.testDevIndicator = function() {
  console.clear();
  console.log('🔧 Development Mode Indicator Test Suite');
  console.log('========================================');
  console.log('');
  
  const hasDevIndicator = testDevIndicator();
  const hasAuthBypass = testAuthBypass();
  
  console.log('');
  console.log('📊 Test Results:');
  console.log(`   DEV Indicator: ${hasDevIndicator ? '✅' : '❌'}`);
  console.log(`   Auth Bypass: ${hasAuthBypass ? '✅' : '❌'}`);
  
  if (hasDevIndicator) {
    console.log('');
    console.log('🎯 DEV indicator is working correctly!');
    highlightDevIndicator();
  } else if (hasAuthBypass) {
    console.log('');
    console.log('⚠️ Auth bypass active but DEV indicator not visible');
    console.log('🔄 Try refreshing the page');
  } else {
    console.log('');
    console.log('💡 Development mode not active');
    console.log('🔧 Run forceDevMode() to enable it');
  }
  
  console.log('');
  console.log('🔧 Available Commands:');
  console.log('- testDevIndicator() - Run this test again');
  console.log('- forceDevMode() - Force enable development mode');
  console.log('- highlightDevIndicator() - Highlight the DEV badge');
};

// Auto-run
console.log('🚀 Loading DEV Indicator Test Utility...');
console.log('Type testDevIndicator() to run the test');
console.log('');
