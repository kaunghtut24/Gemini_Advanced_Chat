/**
 * Login component with email verification
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Icons } from './Icons';

interface LoginProps {
  onLogin?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { isLoading, error, requestLoginCode, verifyLoginCode, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [codeSent, setCodeSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }

    const success = await requestLoginCode(email.trim());
    if (success) {
      setStep('code');
      setCodeSent(true);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      return;
    }

    const success = await verifyLoginCode(email, code.trim());
    if (success) {
      onLogin?.();
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
    setCodeSent(false);
    clearError();
  };

  const handleResendCode = async () => {
    const success = await requestLoginCode(email);
    if (success) {
      setCode('');
      clearError();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Icons.Lock />
          </div>
          <h1>Gemini Advanced Chat</h1>
          <p>Secure email-based authentication</p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your authorized email"
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="error-message">
                <Icons.AlertTriangle />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="login-button primary"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Sending Code...
                </>
              ) : (
                <>
                  <Icons.Mail />
                  Send Login Code
                </>
              )}
            </button>

            <div className="login-info">
              <Icons.Info />
              <span>A 6-digit login code will be sent to your email</span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                disabled={isLoading}
                required
                autoFocus
                maxLength={6}
                className="code-input"
              />
              <div className="code-info">
                Code sent to: <strong>{email}</strong>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <Icons.AlertTriangle />
                <span>{error}</span>
              </div>
            )}

            {codeSent && (
              <div className="success-message">
                <Icons.CheckCircle />
                <span>Login code sent successfully!</span>
              </div>
            )}

            <div className="login-actions">
              <button 
                type="submit" 
                className="login-button primary"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Icons.Key />
                    Verify & Login
                  </>
                )}
              </button>

              <div className="secondary-actions">
                <button 
                  type="button" 
                  onClick={handleBackToEmail}
                  className="login-button secondary"
                  disabled={isLoading}
                >
                  <Icons.ArrowLeft />
                  Change Email
                </button>

                <button 
                  type="button" 
                  onClick={handleResendCode}
                  className="login-button secondary"
                  disabled={isLoading}
                >
                  <Icons.RotateCcw />
                  Resend Code
                </button>
              </div>
            </div>

            <div className="login-info">
              <Icons.Clock />
              <span>Code expires in 10 minutes</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
