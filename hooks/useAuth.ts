/**
 * React hook for authentication management
 */

import { useState, useEffect } from 'react';
import { AuthState } from '../types';
import { authService } from '../services/authService';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((newState) => {
      setAuthState(newState);
    });

    // Verify session on mount
    if (authState.isAuthenticated) {
      authService.verifySession().catch(() => {
        // Session verification failed, auth service will handle cleanup
      });
    }

    return unsubscribe;
  }, []);

  const requestLoginCode = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.requestLoginCode(email);
      
      if (!result.success) {
        setError(result.message);
        return false;
      }

      return true;
    } catch (error) {
      setError('An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyLoginCode = async (email: string, code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.verifyLoginCode(email, code);
      
      if (!result.success) {
        setError(result.message);
        return false;
      }

      return true;
    } catch (error) {
      setError('An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // State
    authState,
    isLoading,
    error,
    
    // Computed
    isAuthenticated: authState.isAuthenticated,
    userEmail: authState.email,
    
    // Actions
    requestLoginCode,
    verifyLoginCode,
    logout,
    clearError
  };
}
