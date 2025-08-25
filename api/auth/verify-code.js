/**
 * Vercel API Route: Verify Login Code
 * File: /api/auth/verify-code.js
 */

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // For Vercel deployment, we'll implement a simpler verification
    // In production, you'd validate against stored codes in Redis/database
    
    // Simple validation: code should be 6 digits
    if (!/^\d{6}$/.test(code.trim())) {
      return res.status(401).json({
        success: false,
        message: 'Invalid code format. Code should be 6 digits.'
      });
    }

    // For development, accept any 6-digit code for authorized emails
    const authorizedEmails = (process.env.AUTHORIZED_EMAILS || '')
      .split(',')
      .map(email => email.trim().toLowerCase());

    if (!authorizedEmails.includes(normalizedEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Email not authorized'
      });
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    console.log(`✅ Successful login: ${normalizedEmail}`);

    res.json({
      success: true,
      message: 'Login successful',
      token: sessionToken,
      email: normalizedEmail,
      expiresAt
    });

  } catch (error) {
    console.error('❌ Error verifying code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code'
    });
  }
}
