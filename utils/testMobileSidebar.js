/**
 * Mobile Sidebar Scrolling Test Utility
 * Run this in browser console to test mobile sidebar functionality
 */

console.log('📱 Mobile Sidebar Scrolling Test Utility');
console.log('========================================');

// Test mobile sidebar visibility and scrolling
function testMobileSidebarScrolling() {
  console.log('🔍 Testing Mobile Sidebar Scrolling...');
  
  const sidebar = document.querySelector('.sidebar');
  const sessionsList = document.querySelector('.sessions-list');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  
  if (!sidebar) {
    console.error('❌ Sidebar not found');
    return;
  }
  
  console.log('✅ Sidebar found');
  console.log(`   - Width: ${sidebar.offsetWidth}px`);
  console.log(`   - Height: ${sidebar.offsetHeight}px`);
  console.log(`   - Position: ${getComputedStyle(sidebar).position}`);
  console.log(`   - Display: ${getComputedStyle(sidebar).display}`);
  console.log(`   - Flex Direction: ${getComputedStyle(sidebar).flexDirection}`);
  
  if (sessionsList) {
    console.log('✅ Sessions list found');
    console.log(`   - Height: ${sessionsList.offsetHeight}px`);
    console.log(`   - Scroll Height: ${sessionsList.scrollHeight}px`);
    console.log(`   - Overflow Y: ${getComputedStyle(sessionsList).overflowY}`);
    console.log(`   - Flex: ${getComputedStyle(sessionsList).flex}`);
    console.log(`   - Scrollable: ${sessionsList.scrollHeight > sessionsList.offsetHeight ? '✅' : '❌'}`);
    
    if (sessionsList.scrollHeight > sessionsList.offsetHeight) {
      console.log('📊 Sessions list is scrollable');
      console.log(`   - Scrollable area: ${sessionsList.scrollHeight - sessionsList.offsetHeight}px`);
    } else {
      console.log('ℹ️ Sessions list content fits without scrolling');
    }
  } else {
    console.error('❌ Sessions list not found');
  }
  
  if (mobileMenuBtn) {
    console.log('✅ Mobile menu button found');
    console.log(`   - Display: ${getComputedStyle(mobileMenuBtn).display}`);
    console.log(`   - Visibility: ${getComputedStyle(mobileMenuBtn).visibility}`);
    console.log(`   - Z-index: ${getComputedStyle(mobileMenuBtn).zIndex}`);
  } else {
    console.log('ℹ️ Mobile menu button not found (may be hidden on desktop)');
  }
}

// Test mobile viewport and responsive behavior
function testMobileViewport() {
  console.log('\n📐 Testing Mobile Viewport...');
  
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    orientation: window.screen.orientation?.type || 'unknown'
  };
  
  console.log(`📱 Viewport: ${viewport.width}x${viewport.height}`);
  console.log(`📱 Device Pixel Ratio: ${viewport.devicePixelRatio}`);
  console.log(`📱 Orientation: ${viewport.orientation}`);
  
  // Determine mobile breakpoints
  const isMobile = viewport.width <= 768;
  const isSmallMobile = viewport.width <= 480;
  const isExtraSmallMobile = viewport.width <= 360;
  const isLandscape = viewport.width > viewport.height;
  
  console.log(`📱 Mobile: ${isMobile ? '✅' : '❌'}`);
  console.log(`📱 Small Mobile: ${isSmallMobile ? '✅' : '❌'}`);
  console.log(`📱 Extra Small Mobile: ${isExtraSmallMobile ? '✅' : '❌'}`);
  console.log(`📱 Landscape: ${isLandscape ? '✅' : '❌'}`);
  
  return { isMobile, isSmallMobile, isExtraSmallMobile, isLandscape, viewport };
}

// Test sidebar toggle functionality
function testSidebarToggle() {
  console.log('\n🔄 Testing Sidebar Toggle...');
  
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const body = document.body;
  const sidebar = document.querySelector('.sidebar');
  
  if (!mobileMenuBtn) {
    console.log('ℹ️ Mobile menu button not visible (desktop mode)');
    return;
  }
  
  console.log('🖱️ Testing sidebar toggle...');
  
  // Check initial state
  const initiallyOpen = body.classList.contains('sidebar-open');
  console.log(`   Initial state: ${initiallyOpen ? 'Open' : 'Closed'}`);
  
  // Test toggle
  mobileMenuBtn.click();
  
  setTimeout(() => {
    const afterToggle = body.classList.contains('sidebar-open');
    console.log(`   After toggle: ${afterToggle ? 'Open' : 'Closed'}`);
    console.log(`   Toggle working: ${initiallyOpen !== afterToggle ? '✅' : '❌'}`);
    
    if (sidebar) {
      const transform = getComputedStyle(sidebar).transform;
      console.log(`   Sidebar transform: ${transform}`);
    }
    
    // Toggle back to original state
    setTimeout(() => {
      mobileMenuBtn.click();
      console.log('🔄 Toggled back to original state');
    }, 1000);
  }, 300);
}

// Test scrolling performance
function testScrollingPerformance() {
  console.log('\n⚡ Testing Scrolling Performance...');
  
  const sessionsList = document.querySelector('.sessions-list');
  
  if (!sessionsList || sessionsList.scrollHeight <= sessionsList.offsetHeight) {
    console.log('ℹ️ No scrollable content to test');
    return;
  }
  
  console.log('📊 Testing scroll performance...');
  
  let scrollEvents = 0;
  let startTime = Date.now();
  
  const scrollHandler = () => {
    scrollEvents++;
  };
  
  sessionsList.addEventListener('scroll', scrollHandler);
  
  // Simulate scroll
  sessionsList.scrollTop = 0;
  setTimeout(() => {
    sessionsList.scrollTop = sessionsList.scrollHeight / 2;
    setTimeout(() => {
      sessionsList.scrollTop = sessionsList.scrollHeight;
      setTimeout(() => {
        sessionsList.scrollTop = 0;
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`   Scroll events: ${scrollEvents}`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Performance: ${scrollEvents / (duration / 1000)} events/sec`);
        
        sessionsList.removeEventListener('scroll', scrollHandler);
      }, 500);
    }, 500);
  }, 500);
}

// Check for mobile-specific CSS features
function checkMobileCSSFeatures() {
  console.log('\n🎨 Checking Mobile CSS Features...');
  
  const sidebar = document.querySelector('.sidebar');
  const sessionsList = document.querySelector('.sessions-list');
  
  if (sidebar) {
    const sidebarStyles = getComputedStyle(sidebar);
    console.log('📱 Sidebar Mobile Features:');
    console.log(`   - Dynamic Viewport Height: ${sidebarStyles.height.includes('dvh') ? '✅' : '❌'}`);
    console.log(`   - Flex Layout: ${sidebarStyles.display === 'flex' ? '✅' : '❌'}`);
    console.log(`   - Proper Z-index: ${parseInt(sidebarStyles.zIndex) >= 100 ? '✅' : '❌'}`);
  }
  
  if (sessionsList) {
    const listStyles = getComputedStyle(sessionsList);
    console.log('📱 Sessions List Mobile Features:');
    console.log(`   - Touch Scrolling: ${listStyles.webkitOverflowScrolling === 'touch' ? '✅' : '❌'}`);
    console.log(`   - Overscroll Behavior: ${listStyles.overscrollBehavior === 'contain' ? '✅' : '❌'}`);
    console.log(`   - Flex Grow: ${listStyles.flex.includes('1') ? '✅' : '❌'}`);
  }
}

// Main test function
window.testMobileSidebar = function() {
  console.clear();
  console.log('📱 Mobile Sidebar Test Suite');
  console.log('============================');
  console.log('');
  
  // Run all tests
  const viewportInfo = testMobileViewport();
  testMobileSidebarScrolling();
  
  if (viewportInfo.isMobile) {
    testSidebarToggle();
    testScrollingPerformance();
  } else {
    console.log('\nℹ️ Desktop mode detected. Some mobile tests skipped.');
    console.log('💡 Resize window to mobile width (≤768px) for full mobile testing');
  }
  
  checkMobileCSSFeatures();
  
  console.log('');
  console.log('🔧 Available Commands:');
  console.log('- testMobileSidebar() - Run full test suite');
  console.log('- testMobileViewport() - Check viewport info');
  console.log('- testSidebarToggle() - Test toggle functionality');
  console.log('- testScrollingPerformance() - Test scroll performance');
  console.log('');
  console.log('📝 Mobile Testing Tips:');
  console.log('1. Resize browser to mobile width (≤768px)');
  console.log('2. Use browser dev tools device emulation');
  console.log('3. Test on actual mobile devices');
  console.log('4. Check both portrait and landscape orientations');
  console.log('5. Test with many chat sessions for scrolling');
};

// Auto-run
console.log('🚀 Loading Mobile Sidebar Test Utility...');
console.log('Type testMobileSidebar() to run the test suite');
console.log('');
