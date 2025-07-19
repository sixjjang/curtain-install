import { useState, useEffect, useCallback } from 'react';

// Check if we're in browser environment
const isBrowser = typeof window !== "undefined";

// Dynamically import authService only in browser
let authService = null;
let USER_ROLES = null;

if (isBrowser) {
  try {
    const authModule = require('../services/authService');
    authService = authModule.default;
    USER_ROLES = authModule.USER_ROLES;
  } catch (error) {
    console.warn('AuthService not available:', error);
  }
}

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only initialize auth in browser environment
    if (!isBrowser) {
      setLoading(false);
      return;
    }

    // Check for admin session first
    const adminUser = sessionStorage.getItem('adminUser');
    if (adminUser) {
      try {
        const adminData = JSON.parse(adminUser);
        setUser(adminData);
        setUserProfile(adminData);
        setLoading(false);
        setError(null);
        return;
      } catch (error) {
        console.error('Admin session parse error:', error);
        sessionStorage.removeItem('adminUser');
      }
    }

    // If no authService, run in demo mode
    if (!authService) {
      setLoading(false);
      return;
    }

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
  const sendEmailLink = useCallback(async (email, role = USER_ROLES?.CUSTOMER) => {
    setError(null);
    if (!authService) {
      throw new Error('Authentication service not available');
    }
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
    if (!authService) {
      throw new Error('Authentication service not available');
    }
    try {
      const result = await authService.completeEmailSignIn();
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Google sign in
  const signInWithGoogle = useCallback(async (role = USER_ROLES?.CUSTOMER) => {
    setError(null);
    if (!authService) {
      throw new Error('Authentication service not available');
    }
    try {
      const result = await authService.signInWithGoogle(role);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Email/password sign up
  const signUpWithEmail = useCallback(async (email, password, userData, role = USER_ROLES?.CUSTOMER) => {
    setError(null);
    if (!authService) {
      throw new Error('Authentication service not available');
    }
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
    if (!authService) {
      throw new Error('Authentication service not available');
    }
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
      // Check if user is admin
      const adminUser = sessionStorage.getItem('adminUser');
      if (adminUser) {
        // Clear admin session
        sessionStorage.removeItem('adminUser');
        setUser(null);
        setUserProfile(null);
        return { success: true };
      }

      // Check if user is demo user
      const demoUser = sessionStorage.getItem('demoUser');
      if (demoUser) {
        // Clear demo session
        sessionStorage.removeItem('demoUser');
        sessionStorage.removeItem('demoLoginTime');
        setUser(null);
        setUserProfile(null);
        return { success: true };
      }
      
      // Normal Firebase sign out
      if (!authService) {
        throw new Error('Authentication service not available');
      }
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
    if (!authService) {
      throw new Error('Authentication service not available');
    }
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
    if (!authService) {
      throw new Error('Authentication service not available');
    }
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
    if (!authService) {
      throw new Error('Authentication service not available');
    }
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
    if (!authService) {
      throw new Error('Authentication service not available');
    }
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
    // Admin 계정 체크
    if (userProfile?.role === 'admin') {
      return role === 'admin';
    }
    
    // userProfile이 있으면 직접 확인
    if (userProfile) {
      return (
        userProfile.primaryRole === role ||
        userProfile.role === role ||
        (userProfile.roles && userProfile.roles.includes(role))
      );
    }
    
    if (!authService) return false;
    return authService.hasRole(role);
  }, [userProfile]);

  const hasAnyRole = useCallback((roles) => {
    // Admin 계정 체크
    if (userProfile?.role === 'admin') {
      return roles.includes('admin');
    }
    
    // userProfile이 있으면 직접 확인
    if (userProfile) {
      const userRoles = [
        userProfile.primaryRole,
        userProfile.role,
        ...(userProfile.roles || [])
      ].filter(Boolean); // null/undefined 제거
      
      return roles.some(role => userRoles.includes(role));
    }
    
    if (!authService) return false;
    return authService.hasAnyRole(roles);
  }, [userProfile]);

  const isAuthenticated = useCallback(() => {
    // Admin 계정 체크
    if (userProfile?.role === 'admin') {
      return true;
    }
    if (!authService) return false;
    return authService.isAuthenticated();
  }, [user, userProfile]);

  const isEmailVerified = useCallback(() => {
    // Admin 계정은 이메일 인증 불필요
    if (userProfile?.role === 'admin') {
      return true;
    }
    if (!authService) return false;
    return authService.isEmailVerified();
  }, [user, userProfile]);

  // 승인 상태 확인
  const isApproved = useCallback(() => {
    // Admin 계정은 항상 승인됨
    if (userProfile?.role === 'admin') {
      return true;
    }
    return userProfile?.isApproved === true;
  }, [userProfile]);

  // 승인 대기 상태 확인
  const isPendingApproval = useCallback(() => {
    return userProfile?.approvalStatus === 'pending';
  }, [userProfile]);

  // 프로필 설정 완료 상태 확인
  const isProfileSetupCompleted = useCallback(() => {
    return userProfile?.profileSetupCompleted === true;
  }, [userProfile]);

  // Update FCM token
  const updateFCMToken = useCallback(async (token) => {
    if (!authService) return;
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
    isApproved,
    isPendingApproval,
    isProfileSetupCompleted,
    
    // FCM token management
    updateFCMToken,
    
    // Error handling
    clearError,
    
    // Constants
    USER_ROLES
  };
}; 