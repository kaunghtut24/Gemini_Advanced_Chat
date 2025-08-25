import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for login codes (in production, use Redis or database)
const loginCodes = new Map();

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
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // App password for Gmail
    }
  });
};

// Generate random 6-digit code
const generateLoginCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Route: Request login code
app.post('/auth/request-code', async (req, res) => {
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

    // Store code (with expiration)
    loginCodes.set(normalizedEmail, {
      code,
      expiresAt,
      attempts: 0
    });

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
      message: 'Login code sent to your email'
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
});

// Route: Verify login code
app.post('/auth/verify-code', (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const storedData = loginCodes.get(normalizedEmail);

    if (!storedData) {
      return res.status(404).json({
        success: false,
        message: 'No login code found. Please request a new code.'
      });
    }

    // Check expiration
    if (Date.now() > storedData.expiresAt) {
      loginCodes.delete(normalizedEmail);
      return res.status(410).json({
        success: false,
        message: 'Login code has expired. Please request a new code.'
      });
    }

    // Check attempts
    if (storedData.attempts >= 3) {
      loginCodes.delete(normalizedEmail);
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.'
      });
    }

    // Verify code
    if (storedData.code !== code.trim()) {
      storedData.attempts++;
      return res.status(401).json({
        success: false,
        message: `Invalid code. ${3 - storedData.attempts} attempts remaining.`
      });
    }

    // Success - generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Clean up login code
    loginCodes.delete(normalizedEmail);

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
});

// Route: Verify session token
app.post('/auth/verify-session', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // In a real app, you'd validate the token against a database
    // For this simple implementation, we'll just check if it exists and is properly formatted
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
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    authorizedEmails: getAuthorizedEmails().length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Authentication server running on port ${PORT}`);
  console.log(`📧 Authorized emails: ${getAuthorizedEmails().length}`);
  
  if (!process.env.EMAIL_SERVICE) {
    console.warn('⚠️ Email service not configured. Please check environment variables.');
  }
});

export default app;
