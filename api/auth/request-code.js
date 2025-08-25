/**
 * Vercel API Route: Request Login Code
 * File: /api/auth/request-code.js
 */

const nodemailer = require('nodemailer');

// Get authorized emails from environment variables
const getAuthorizedEmails = () => {
  const emails = process.env.AUTHORIZED_EMAILS;
  console.log('🔍 Raw AUTHORIZED_EMAILS:', emails);
  
  if (!emails) {
    console.warn('⚠️ No AUTHORIZED_EMAILS found in environment variables');
    return [];
  }
  
  const emailList = emails.split(',').map(email => email.trim().toLowerCase());
  console.log('📧 Parsed authorized emails:', emailList);
  return emailList;
};

// Configure email transporter
const createEmailTransporter = () => {
  console.log('📧 Email config check:', {
    SERVICE: !!process.env.EMAIL_SERVICE,
    USER: !!process.env.EMAIL_USER,
    PASS: !!process.env.EMAIL_PASS,
    SERVICE_VALUE: process.env.EMAIL_SERVICE
  });

  if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email configuration missing in environment variables');
    console.error('Missing:', {
      EMAIL_SERVICE: !process.env.EMAIL_SERVICE,
      EMAIL_USER: !process.env.EMAIL_USER,
      EMAIL_PASS: !process.env.EMAIL_PASS
    });
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    console.log('✅ Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    return null;
  }
};

// Generate random 6-digit code
const generateLoginCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = async function handler(req, res) {
  // Enhanced CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  console.log('🚀 API request received:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  try {
    const { email } = req.body;

    if (!email) {
      console.log('❌ No email provided');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const authorizedEmails = getAuthorizedEmails();

    console.log(`📧 Login request for: ${normalizedEmail}`);
    console.log(`🔑 Checking against authorized emails: ${authorizedEmails.join(', ')}`);

    // Check if email is authorized
    if (!authorizedEmails.includes(normalizedEmail)) {
      console.log(`🚫 Unauthorized login attempt: ${normalizedEmail}`);
      return res.status(403).json({
        success: false,
        message: 'Email not authorized. Please contact the administrator.',
        debug: {
          requestedEmail: normalizedEmail,
          authorizedEmails: authorizedEmails,
          environment: process.env.NODE_ENV || 'unknown'
        }
      });
    }

    // Create email transporter
    const transporter = createEmailTransporter();
    if (!transporter) {
      console.error('❌ Email transporter creation failed');
      return res.status(500).json({
        success: false,
        message: 'Email service not configured',
        debug: {
          hasEmailService: !!process.env.EMAIL_SERVICE,
          hasEmailUser: !!process.env.EMAIL_USER,
          hasEmailPass: !!process.env.EMAIL_PASS
        }
      });
    }

    // Test email configuration
    try {
      await transporter.verify();
      console.log('✅ Email service connection verified');
    } catch (verifyError) {
      console.error('❌ Email service verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'Email service configuration error: ' + verifyError.message,
        debug: {
          verifyError: verifyError.message,
          emailConfig: {
            service: process.env.EMAIL_SERVICE,
            user: process.env.EMAIL_USER?.substring(0, 5) + '***'
          }
        }
      });
    }

    // Generate login code
    const code = generateLoginCode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

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
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 11px;">Sent from Vercel deployment at ${new Date().toISOString()}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 Login code sent successfully to: ${normalizedEmail}`);

    res.json({
      success: true,
      message: 'Login code sent to your email',
      debug: {
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? 'vercel' : 'local',
        codeLength: code.length
      },
      // For development/testing on Vercel, include code in response
      ...(process.env.NODE_ENV !== 'production' && { devCode: code })
    });

  } catch (error) {
    console.error('❌ Error sending login code:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send login code: ' + error.message,
      debug: {
        error: error.message,
        stack: error.stack?.split('\n')[0],
        timestamp: new Date().toISOString()
      }
    });
  }
}
