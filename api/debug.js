/**
 * Debug API route to check Vercel environment variables
 * File: /api/debug.js
 */

module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel' : 'local',
    nodeEnv: process.env.NODE_ENV,
    hasAuthorizedEmails: !!process.env.AUTHORIZED_EMAILS,
    hasEmailService: !!process.env.EMAIL_SERVICE,
    hasEmailUser: !!process.env.EMAIL_USER,
    hasEmailPass: !!process.env.EMAIL_PASS,
    hasViteApiKey: !!process.env.VITE_API_KEY,
    
    // Safe debugging (don't expose actual values)
    authorizedEmailsCount: process.env.AUTHORIZED_EMAILS ? 
      process.env.AUTHORIZED_EMAILS.split(',').length : 0,
    emailService: process.env.EMAIL_SERVICE,
    emailUserDomain: process.env.EMAIL_USER ? 
      '@' + process.env.EMAIL_USER.split('@')[1] : 'not-set'
  };

  console.log('🔍 Environment check:', envCheck);

  res.json({
    success: true,
    message: 'Environment check complete',
    data: envCheck
  });
}
