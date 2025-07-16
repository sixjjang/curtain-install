import { useState, useEffect, useCallback } from 'react';
import authService, { USER_ROLES } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize auth state listener
    const unsubscribe = authService.initAuthStateListener();
    
    // Add our listener
    const removeListener = authService.onAuthStateChanged((currentUser, profile) => {
      setUser(currentUser);
      setUserProfile(profile);
      setLoading(false);
      setError(null);
    });

    return () => {
      unsubscribe();
      removeListener();
    };
  }, []);

  // Email link authentication
  const sendEmailLink = useCallback(async (email, role = USER_ROLES.CUSTOMER) => {
    setError(null);
    try {
      const result = await authService.sendEmailLink(email, role);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Complete email sign in
  const completeEmailSignIn = useCallback(async () => {
    setError(null);
    try {
      const result = await authService.completeEmailSignIn();
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Google sign in
  const signInWithGoogle = useCallback(async (role = USER_ROLES.CUSTOMER) => {
    setError(null);
    try {
      const result = await authService.signInWithGoogle(role);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Email/password sign up
  const signUpWithEmail = useCallback(async (email, password, userData, role = USER_ROLES.CUSTOMER) => {
    setError(null);
    try {
      const result = await authService.signUpWithEmail(email, password, userData, role);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Email/password sign in
  const signInWithEmail = useCallback(async (email, password) => {
    setError(null);
    try {
      const result = await authService.signInWithEmail(email, password);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    try {
      const result = await authService.signOut();
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(async (updates) => {
    if (!user) return;
    setError(null);
    try {
      const result = await authService.updateUserProfile(user.uid, updates);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [user]);

  // Send password reset email
  const sendPasswordResetEmail = useCallback(async (email) => {
    setError(null);
    try {
      const result = await authService.sendPasswordResetEmail(email);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword) => {
    setError(null);
    try {
      const result = await authService.updatePassword(newPassword);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Reauthenticate user
  const reauthenticateUser = useCallback(async (password) => {
    setError(null);
    try {
      const result = await authService.reauthenticateUser(password);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Role checking helpers
  const hasRole = useCallback((role) => {
    return authService.hasRole(role);
  }, [userProfile]);

  const hasAnyRole = useCallback((roles) => {
    return authService.hasAnyRole(roles);
  }, [userProfile]);

  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated();
  }, [user]);

  const isEmailVerified = useCallback(() => {
    return authService.isEmailVerified();
  }, [user]);

  // Update FCM token
  const updateFCMToken = useCallback(async (token) => {
    try {
      await authService.updateFCMToken(token);
    } catch (err) {
      console.error('Failed to update FCM token:', err);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    user,
    userProfile,
    loading,
    error,
    
    // Authentication methods
    sendEmailLink,
    completeEmailSignIn,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    
    // Profile management
    updateUserProfile,
    
    // Password management
    sendPasswordResetEmail,
    updatePassword,
    reauthenticateUser,
    
    // Role checking
    hasRole,
    hasAnyRole,
    isAuthenticated,
    isEmailVerified,
    
    // FCM token management
    updateFCMToken,
    
    // Error handling
    clearError,
    
    // Constants
    USER_ROLES
  };
}; 