/**
 * Vercel API Route: Verify Session
 * File: /api/auth/verify-session.js
 */

export default async function handler(req, res) {
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
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Simple token validation for Vercel
    // In production, validate against database/Redis
    if (token.length === 64 && /^[a-f0-9]+$/i.test(token)) {
      return res.json({
        success: true,
        message: 'Session valid'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Invalid session'
    });

  } catch (error) {
    console.error('❌ Error verifying session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify session'
    });
  }
}
