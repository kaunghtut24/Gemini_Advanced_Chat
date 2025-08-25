/**
 * Vercel API Route: Request Login Code
 * File: /api/auth/request-code.js
 */

import nodemailer from 'nodemailer';

// Since Vercel functions are stateless, we'll use a simple approach
// For production, you'd want to use Redis, database, or external storage
const tempStorage = new Map();

// Get authorized emails from environment variables
const getAuthorizedEmails = () => {
  const emails = process.env.AUTHORIZED_EMAILS;
  if (!emails) {
    console.warn('⚠️ No AUTHORIZED_EMAILS found in environment variables');
    return [];
  }
  return emails.split(',').map(email => email.trim().toLowerCase());
};

// Configure email transporter
const createEmailTransporter = () => {
  if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email configuration missing in environment variables');
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Generate random 6-digit code
const generateLoginCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const authorizedEmails = getAuthorizedEmails();

    console.log(`📧 Login request for: ${normalizedEmail}`);
    console.log(`🔑 Authorized emails: ${authorizedEmails.join(', ')}`);

    // Check if email is authorized
    if (!authorizedEmails.includes(normalizedEmail)) {
      console.log(`🚫 Unauthorized login attempt: ${normalizedEmail}`);
      return res.status(403).json({
        success: false,
        message: 'Email not authorized. Please contact the administrator.'
      });
    }

    // Create email transporter
    const transporter = createEmailTransporter();
    if (!transporter) {
      console.error('❌ Email transporter creation failed');
      return res.status(500).json({
        success: false,
        message: 'Email service not configured'
      });
    }

    // Test email configuration
    try {
      await transporter.verify();
      console.log('✅ Email service connection verified');
    } catch (verifyError) {
      console.error('❌ Email service verification failed:', verifyError.message);
      return res.status(500).json({
        success: false,
        message: 'Email service configuration error: ' + verifyError.message
      });
    }

    // Generate login code
    const code = generateLoginCode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

    // For Vercel, we'll include the code in the response for development
    // In production, you'd store this in Redis, database, or use JWT
    console.log(`🔢 Generated code for ${normalizedEmail}: ${code}`);

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: 'Gemini Chat - Login Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4285f4;">Gemini Advanced Chat</h2>
          <p>Your login code is:</p>
          <div style="background: #f1f3f4; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;">
            <h1 style="color: #1a73e8; margin: 0; font-size: 32px; letter-spacing: 4px;">${code}</h1>
          </div>
          <p style="color: #666;">This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 Login code sent successfully to: ${normalizedEmail}`);

    res.json({
      success: true,
      message: 'Login code sent to your email',
      // For development on Vercel, include code in response
      // Remove this in production!
      ...(process.env.NODE_ENV === 'development' && { devCode: code })
    });

  } catch (error) {
    console.error('❌ Error sending login code:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    res.status(500).json({
      success: false,
      message: 'Failed to send login code: ' + error.message
    });
  }
}
