/**
 * Debug utility for testing Vercel API endpoints
 * Run in browser console on your Vercel deployment
 */

console.log('🧪 Testing Vercel API endpoints...');

// Test health check (if available)
const testAPI = async () => {
  const baseURL = window.location.origin;
  console.log('🌐 Testing on:', baseURL);
  
  try {
    // Test request-code endpoint
    console.log('📧 Testing email request...');
    const response = await fetch(`${baseURL}/api/auth/request-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'kaunghtutaung@gmail.com' // Use your authorized email
      })
    });
    
    const data = await response.json();
    console.log('📧 Email request response:', data);
    console.log('📧 Status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Email request failed:', data);
    } else {
      console.log('✅ Email request successful!');
      
      // If dev code is returned, test verification
      if (data.devCode) {
        console.log('🔢 Testing code verification with dev code:', data.devCode);
        
        const verifyResponse = await fetch(`${baseURL}/api/auth/verify-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'kaunghtutaung@gmail.com',
            code: data.devCode
          })
        });
        
        const verifyData = await verifyResponse.json();
        console.log('🔐 Verify response:', verifyData);
        console.log('🔐 Verify status:', verifyResponse.status);
      }
    }
    
  } catch (error) {
    console.error('💥 API test failed:', error);
  }
};

// Run the test
testAPI();
