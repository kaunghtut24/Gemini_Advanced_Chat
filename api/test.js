/**
 * Simple test API route for Vercel
 * File: /api/test.js
 */

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    success: true,
    message: 'Test API route is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasAuthorizedEmails: !!process.env.AUTHORIZED_EMAILS,
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPass: !!process.env.EMAIL_PASS,
      nodeEnv: process.env.NODE_ENV
    }
  });
};
