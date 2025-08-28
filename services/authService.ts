/**
 * Authentication service for email-based login
 */

import { AuthState, LoginCodeRequest, LoginCodeVerification, AuthResponse } from '../types';

// Determine API base URL based on environment
const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : '/api'; // Vercel API routes

const AUTH_STORAGE_KEY = 'gemini-auth-state';

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    email: null,
    token: null,
    expiresAt: null
  };

  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    this.loadAuthState();
  }

  // Load authentication state from localStorage
  private loadAuthState(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        
        // Check if token is expired
        if (state.expiresAt && Date.now() > state.expiresAt) {
          console.log('🔒 Auth token expired, clearing session');
          this.clearAuth();
          return;
        }
        
        this.authState = state;
        console.log('✅ Auth state loaded:', this.authState.email);
        console.log('🔍 Auth state details:', {
          isAuthenticated: this.authState.isAuthenticated,
          hasToken: !!this.authState.token,
          expiresAt: this.authState.expiresAt ? new Date(this.authState.expiresAt).toLocaleString() : null
        });
      } else {
        console.log('🔒 No stored auth state found, user needs to login');
      }
    } catch (error) {
      console.error('❌ Error loading auth state:', error);
      this.clearAuth();
    }
  }

  // Save authentication state to localStorage
  private saveAuthState(): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.authState));
    } catch (error) {
      console.error('❌ Error saving auth state:', error);
    }
  }

  // Notify listeners of auth state changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get current auth state
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  // Request login code
  async requestLoginCode(email: string): Promise<AuthResponse> {
    // In development without backend, simulate login code request
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('⚡ Simulating login code request in development mode');
      return {
        success: true,
        message: 'Development mode: Login code simulation. Use any code to login.'
      };
    }

    try {
      console.log('📧 Requesting login code for:', email);
      
      const response = await fetch(`${API_BASE}/auth/request-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email } as LoginCodeRequest),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Login code request failed:', result.message);
      } else {
        console.log('✅ Login code requested successfully');
      }

      return result;
    } catch (error) {
      console.error('❌ Network error requesting login code:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Verify login code
  async verifyLoginCode(email: string, code: string): Promise<AuthResponse> {
    // In development without backend, simulate login code verification
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('⚡ Simulating login code verification in development mode');
      
      // Create a mock token for development
      const mockToken = `dev-token-${Date.now()}`;
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
      
      // Update auth state
      this.authState = {
        isAuthenticated: true,
        email: email,
        token: mockToken,
        expiresAt: expiresAt
      };
      
      this.saveAuthState();
      this.notifyListeners();
      
      console.log('✅ Development login successful:', this.authState.email);
      
      return {
        success: true,
        message: 'Development login successful',
        email: email,
        token: mockToken,
        expiresAt: expiresAt
      };
    }

    try {
      console.log('🔐 Verifying login code for:', email);
      
      const response = await fetch(`${API_BASE}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code } as LoginCodeVerification),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update auth state
        this.authState = {
          isAuthenticated: true,
          email: result.email || email,
          token: result.token || null,
          expiresAt: result.expiresAt || null
        };
        
        this.saveAuthState();
        this.notifyListeners();
        
        console.log('✅ Login successful:', this.authState.email);
      } else {
        console.error('❌ Login verification failed:', result.message);
      }

      return result;
    } catch (error) {
      console.error('❌ Network error verifying code:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Verify current session
  async verifySession(): Promise<boolean> {
    if (!this.authState.token) {
      return false;
    }

    // In development without backend, skip verification and trust local auth state
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('⚡ Skipping session verification in development mode');
      return true;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/verify-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: this.authState.token }),
      });

      const result = await response.json();
      
      if (!result.success) {
        console.log('🔒 Session invalid, clearing auth');
        this.clearAuth();
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error verifying session:', error);
      // In case of network error, trust local auth state for better UX
      return true;
    }
  }

  // Clear authentication
  clearAuth(): void {
    this.authState = {
      isAuthenticated: false,
      email: null,
      token: null,
      expiresAt: null
    };
    
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notifyListeners();
    
    console.log('🔓 Authentication cleared');
  }

  // Logout
  logout(): void {
    console.log('👋 Logging out:', this.authState.email);
    this.clearAuth();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  // Get current user email
  getUserEmail(): string | null {
    return this.authState.email;
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export default
export default authService;
