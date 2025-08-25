# Email Authentication Setup Guide

This guide will help you set up email-based authentication for the Gemini Advanced Chat application.

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install the new authentication dependencies:
- `express` - Backend server
- `nodemailer` - Email sending
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `concurrently` - Run frontend and backend together

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:

```env
# Gemini API Key (existing)
VITE_API_KEY=your_gemini_api_key_here

# Authentication Configuration
AUTHORIZED_EMAILS=user1@example.com,user2@domain.com,admin@company.com

# Email Service Configuration (choose one option below)

# Option A: Gmail (Recommended)
EMAIL_SERVICE=gmail
EMAIL_USER=your-app-email@gmail.com
EMAIL_PASS=your-app-password

# Option B: Outlook
EMAIL_SERVICE=outlook
EMAIL_USER=your-app-email@outlook.com
EMAIL_PASS=your-app-password

# Option C: Custom SMTP
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
EMAIL_SECURE=false

# Server Configuration
PORT=3001
```

### 3. Email Service Setup

#### For Gmail (Recommended):
1. Enable 2-factor authentication on your Google account
2. Generate an "App Password":
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate a password
   - Use this app password in `EMAIL_PASS` (not your regular password)

#### For Outlook:
1. Enable 2-factor authentication
2. Generate an app password in your Microsoft account security settings
3. Use the app password in `EMAIL_PASS`

#### For Other Providers:
- Update the email configuration with your SMTP settings
- Some providers require app passwords or OAuth setup

### 4. Configure Authorized Users

In your `.env` file, list all authorized email addresses:

```env
AUTHORIZED_EMAILS=john@company.com,jane@company.com,admin@domain.org
```

**Important Notes:**
- Separate multiple emails with commas
- Emails are case-insensitive
- Only these emails will be able to request login codes
- Add or remove emails as needed for your team

### 5. Start the Application

```bash
npm run dev
```

This will start both:
- Frontend (Vite): `http://localhost:5173`
- Backend (Express): `http://localhost:3001`

## 🔒 How Authentication Works

### Login Flow:
1. **Email Entry**: User enters their email address
2. **Authorization Check**: System verifies email is in `AUTHORIZED_EMAILS`
3. **Code Generation**: 6-digit code generated and sent via email
4. **Code Verification**: User enters code to complete login
5. **Session Creation**: Authentication token stored locally

### Security Features:
- ✅ **Email Whitelist**: Only authorized emails can request codes
- ✅ **Code Expiration**: Login codes expire after 10 minutes
- ✅ **Rate Limiting**: Maximum 3 verification attempts per code
- ✅ **Session Management**: 24-hour session duration
- ✅ **Secure Storage**: Authentication state in localStorage

### Error Handling:
- **Unauthorized Email**: Clear error message for non-authorized emails
- **Email Service Issues**: Graceful fallback with helpful error messages
- **Expired Codes**: Automatic cleanup with resend option
- **Invalid Codes**: Attempt tracking with lockout protection

## 🛠️ Troubleshooting

### Common Issues:

#### 1. Email Not Sending
**Problem**: "Email service not configured" error
**Solution**: 
- Verify email credentials in `.env`
- Check if 2FA is enabled and app password is used
- Test with a simple email provider first

#### 2. Authentication Denied
**Problem**: "Email not authorized" message
**Solution**:
- Verify email is listed in `AUTHORIZED_EMAILS`
- Check for typos in the email list
- Ensure no extra spaces around email addresses

#### 3. Backend Connection Issues
**Problem**: Network errors during authentication
**Solution**:
- Verify backend is running on port 3001
- Check for firewall blocking local connections
- Ensure CORS is properly configured

#### 4. Session Persistence
**Problem**: Users logged out unexpectedly
**Solution**:
- Check browser localStorage for auth data
- Verify session expiration settings
- Look for token validation errors in console

### Debug Tools:

The application includes built-in debugging:

```javascript
// In browser console
debugCurrentSessionState()  // Check authentication state
testExportComplete()       // Test export functionality
```

### Log Analysis:

Check browser console for detailed logs:
- `🔒` Authentication events
- `📧` Email sending status
- `✅` Successful operations
- `❌` Error conditions

## 🔧 Configuration Options

### Email Templates
The login email includes:
- Professional styling with company branding
- Large, readable 6-digit code
- Expiration notice
- Security disclaimer

### Session Management
- **Duration**: 24 hours (configurable)
- **Storage**: Browser localStorage
- **Validation**: Server-side token verification
- **Cleanup**: Automatic expired session removal

### Rate Limiting
- **Login Requests**: No limit (authorized emails only)
- **Code Verification**: 3 attempts per code
- **Session Duration**: 24 hours maximum

## 🚀 Production Deployment

### Environment Setup:
1. Use production email service credentials
2. Configure proper SMTP settings
3. Set up database for session storage (recommended)
4. Enable HTTPS for secure authentication
5. Configure proper CORS origins

### Security Considerations:
- Use environment-specific email lists
- Implement proper session storage (Redis/Database)
- Add audit logging for authentication events
- Consider OAuth integration for enterprise use
- Set up monitoring for failed authentication attempts

### Scaling:
- Move from in-memory storage to Redis/Database
- Implement proper session management
- Add webhook support for team management
- Consider SSO integration for large organizations

## 📝 API Endpoints

The authentication server provides these endpoints:

- `POST /auth/request-code` - Request login code
- `POST /auth/verify-code` - Verify login code
- `POST /auth/verify-session` - Validate session
- `GET /health` - Server health check

## 🎯 Next Steps

1. Test the authentication flow with your email
2. Add team members to authorized emails list
3. Customize email templates if needed
4. Monitor authentication logs
5. Plan for production deployment

For additional support or custom configuration, refer to the source code documentation or create an issue in the repository.
