import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  updateProfile,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";

// Verify imports are working
console.log('Firebase auth imports:', {
  signInWithEmailAndPassword: typeof signInWithEmailAndPassword,
  createUserWithEmailAndPassword: typeof createUserWithEmailAndPassword,
  signOut: typeof signOut,
  onAuthStateChanged: typeof onAuthStateChanged
});
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

// User roles
export const USER_ROLES = {
  SELLER: 'seller',
  CONTRACTOR: 'contractor',
  ADMIN: 'admin'
};

// Authentication service class
class AuthService {
  constructor() {
    this.auth = auth;
    this.currentUser = null;
    this.userProfile = null;
    this.authStateListeners = [];
    
    // Log auth initialization status
    console.log('AuthService initialized with auth:', this.auth ? 'valid' : 'null');
    if (this.auth) {
      console.log('Auth instance methods:', Object.keys(this.auth).filter(key => typeof this.auth[key] === 'function'));
    } else {
      console.warn('Firebase auth not available - running in demo mode');
    }
  }

  // Initialize auth state listener
  initAuthStateListener() {
    if (!this.auth) {
      console.warn('Firebase auth not initialized, running in demo mode');
      // Return a no-op function for demo mode
      return () => {};
    }

    // Check if auth has onAuthStateChanged method
    if (typeof this.auth.onAuthStateChanged !== 'function') {
      console.warn('Firebase auth not properly configured, running in demo mode');
      return () => {};
    }

    try {
      return onAuthStateChanged(this.auth, async (user) => {
        this.currentUser = user;
        
        if (user) {
          try {
            // Get user profile from Firestore
            this.userProfile = await this.getUserProfile(user.uid);
            
            // Update last login
            await this.updateLastLogin(user.uid);
          } catch (error) {
            console.error('Get user profile error:', error);
            this.userProfile = null;
          }
        } else {
          this.userProfile = null;
        }

        // Notify listeners
        this.authStateListeners.forEach(listener => {
          try {
            listener(user, this.userProfile);
          } catch (error) {
            console.error('Auth state listener error:', error);
          }
        });
      });
    } catch (error) {
      console.error('Auth state listener initialization error:', error);
      return () => {};
    }
  }

  // Add auth state listener
  onAuthStateChanged(listener) {
    this.authStateListeners.push(listener);
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Email link authentication
  async sendEmailLink(email, role = USER_ROLES.SELLER) {
    if (!this.auth || typeof this.auth.onAuthStateChanged !== 'function') {
      throw new Error('Firebase가 초기화되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
    }

    const actionCodeSettings = {
      url: `${window.location.origin}/auth/verify-email`,
      handleCodeInApp: true,
      iOS: {
        bundleId: 'com.curtaininstall.app'
      },
      android: {
        packageName: 'com.curtaininstall.app',
        installApp: true,
        minimumVersion: '12'
      },
      dynamicLinkDomain: 'your-app.page.link' // Replace with your dynamic link domain
    };

    try {
      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      
      return { success: true, message: '인증 메일이 발송되었습니다. 이메일을 확인해주세요.' };
    } catch (error) {
      console.error('Email link error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Complete email link sign in
  async completeEmailSignIn() {
    if (!this.auth || typeof this.auth.onAuthStateChanged !== 'function') {
      throw new Error('Firebase가 초기화되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
    }

    if (this.auth.isSignInWithEmailLink(window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      const role = window.localStorage.getItem('roleForSignIn');
      
      if (!email) {
        // Prompt user for email if not found in localStorage
        email = window.prompt('로그인을 완료하려면 이메일을 입력해주세요:');
      }

      try {
        const result = await signInWithEmailLink(this.auth, email, window.location.href);
        
        // Clear stored email
        window.localStorage.removeItem('emailForSignIn');
        window.localStorage.removeItem('roleForSignIn');

        // Create or update user profile
        await this.createOrUpdateUserProfile(result.user, role);
        
        return { success: true, user: result.user };
      } catch (error) {
        console.error('Complete email sign in error:', error);
        throw this.handleAuthError(error);
      }
    }
  }

  // Google sign in
  async signInWithGoogle(role = USER_ROLES.SELLER, additionalData = {}) {
    if (!this.auth || typeof this.auth.onAuthStateChanged !== 'function') {
      throw new Error('Firebase가 초기화되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
    }

    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(this.auth, provider);
      
      // Check if user already exists
      const userProfile = await this.getUserProfile(result.user.uid);
      const isNewUser = !userProfile;
      
      if (isNewUser) {
        // New user - create profile with selected roles
        await this.createOrUpdateUserProfile(result.user, role, additionalData);
      } else {
        // Existing user - update role if different
        if (userProfile.role !== role) {
          await this.updateUserProfile(result.user.uid, { role, roles: [role], primaryRole: role });
        }
      }
      
      return { success: true, user: result.user, isNewUser };
    } catch (error) {
      console.error('Google sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Email/password sign up
  async signUpWithEmail(email, password, userData, role = USER_ROLES.SELLER) {
    if (!this.auth || typeof this.auth.onAuthStateChanged !== 'function') {
      throw new Error('Firebase가 초기화되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
    }

    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Update display name if provided
      if (userData.displayName) {
        await updateProfile(result.user, {
          displayName: userData.displayName
        });
      }

      // Create user profile
      await this.createOrUpdateUserProfile(result.user, role, userData);
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Email/password sign in
  async signInWithEmail(email, password) {
    if (!this.auth || typeof this.auth.onAuthStateChanged !== 'function') {
      throw new Error('Firebase가 초기화되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
    }

    try {
      // Additional check to ensure auth is a valid Firebase Auth instance
      if (!this.auth || typeof this.auth.signInWithEmailAndPassword !== 'function') {
        console.error('Firebase auth is not properly initialized');
        console.error('Auth object:', this.auth);
        console.error('Auth type:', typeof this.auth);
        throw new Error('Firebase 인증이 제대로 초기화되지 않았습니다. 환경 변수를 확인해주세요.');
      }

      console.log('About to call signInWithEmailAndPassword with:', { email, auth: this.auth });
      
      // Try to call the function with proper error handling
      let result;
      try {
        result = await signInWithEmailAndPassword(this.auth, email, password);
        console.log('signInWithEmailAndPassword succeeded:', result);
      } catch (funcError) {
        console.error('signInWithEmailAndPassword function error:', funcError);
        console.error('Function details:', {
          functionType: typeof signInWithEmailAndPassword,
          authType: typeof this.auth,
          authMethods: this.auth ? Object.getOwnPropertyNames(Object.getPrototypeOf(this.auth)) : 'null'
        });
        throw funcError;
      }
      
      // Update last login time only (don't create profile if it doesn't exist)
      Promise.resolve().then(async () => {
        try {
          await this.updateLastLogin(result.user.uid);
        } catch (profileError) {
          console.error('Update last login error:', profileError);
          // Update error shouldn't prevent login
        }
      });
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email sign in error:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('등록되지 않은 이메일입니다.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('비밀번호가 올바르지 않습니다.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('올바르지 않은 이메일 형식입니다.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.');
      } else {
        throw this.handleAuthError(error);
      }
    }
  }

  // Sign out
  async signOut() {
    if (!this.auth || typeof this.auth.onAuthStateChanged !== 'function') {
      this.currentUser = null;
      this.userProfile = null;
      return { success: true };
    }

    try {
      await signOut(this.auth);
      this.currentUser = null;
      this.userProfile = null;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Create or update user profile
  async createOrUpdateUserProfile(user, role, additionalData = {}) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    // 기존 사용자 데이터 가져오기
    const existingData = userSnap.exists() ? userSnap.data() : {};
    
    // 기존 사용자인 경우 역할 변경 방지
    if (existingData.role && existingData.role !== role) {
      console.warn(`Role change prevented: existing role ${existingData.role} cannot be changed to ${role}`);
      // 기존 역할 유지
      role = existingData.role;
    }
    
    // 역할 처리: 단일 역할 또는 다중 역할
    let roles = [];
    let primaryRole = role;
    
    if (Array.isArray(role)) {
      roles = role;
      primaryRole = additionalData.primaryRole || role[0];
    } else {
      roles = [role];
      primaryRole = role;
    }

    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || additionalData.displayName || existingData.displayName || '',
      photoURL: user.photoURL || additionalData.photoURL || existingData.photoURL || '',
      role: primaryRole, // 주요 역할 (기존 호환성)
      roles: roles, // 모든 역할 목록
      primaryRole: primaryRole, // 주요 역할
      emailVerified: user.emailVerified,
      createdAt: existingData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
      ...additionalData
    };

    // Role-specific data
    if (role === USER_ROLES.SELLER) {
      userData.sellerProfile = {
        businessName: additionalData.businessName || '',
        businessNumber: additionalData.businessNumber || '',
        address: additionalData.address || '',
        phone: additionalData.phone || '',
        specialties: additionalData.specialties || [],
        pricingSettings: additionalData.pricingSettings || {
          basePrice: 0,
          pricePerMeter: 0,
          additionalFees: []
        }
      };
    } else if (role === USER_ROLES.CONTRACTOR) {
      userData.contractorProfile = {
        skills: additionalData.skills || [],
        experience: additionalData.experience || '',
        availability: additionalData.availability || {
          weekdays: true,
          weekends: false,
          hours: '09:00-18:00'
        },
        location: additionalData.location || '',
        hourlyRate: additionalData.hourlyRate || 0,
        grade: 'D', // Default grade
        ratings: [],
        completedProjects: 0
      };
    }

    await setDoc(userRef, userData, { merge: true });
    return userData;
  }

  // Get user profile
  async getUserProfile(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(uid, updates) {
    try {
      const userRef = doc(db, 'users', uid);
      
      // 역할 변경을 방지하기 위해 role, roles, primaryRole 필드 제거
      const { role, roles, primaryRole, ...safeUpdates } = updates;
      
      await updateDoc(userRef, {
        ...safeUpdates,
        updatedAt: serverTimestamp()
      });
      
      // Update local profile (역할 필드 제외)
      if (this.userProfile && this.userProfile.uid === uid) {
        this.userProfile = { ...this.userProfile, ...safeUpdates };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  // Update last login
  async updateLastLogin(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // 문서가 존재하면 업데이트만
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp()
        });
      }
      // 문서가 존재하지 않으면 아무것도 하지 않음 (프로필 생성하지 않음)
    } catch (error) {
      console.error('Update last login error:', error);
      // 오류가 발생해도 로그인은 계속 진행
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email) {
    if (!this.auth || typeof this.auth.onAuthStateChanged !== 'function') {
      throw new Error('Firebase가 초기화되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
    }

    try {
      await sendPasswordResetEmail(this.auth, email, {
        url: `${window.location.origin}/auth/reset-password`
      });
      return { success: true, message: '비밀번호 재설정 메일이 발송되었습니다.' };
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Update password
  async updatePassword(newPassword) {
    if (!this.auth || typeof this.auth.onAuthStateChanged !== 'function') {
      throw new Error('Firebase가 초기화되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
    }

    try {
      await updatePassword(this.currentUser, newPassword);
      return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
    } catch (error) {
      console.error('Update password error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Reauthenticate user (required for sensitive operations)
  async reauthenticateUser(password) {
    if (!this.auth || typeof this.auth.onAuthStateChanged !== 'function') {
      throw new Error('Firebase가 초기화되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
    }

    try {
      const credential = EmailAuthProvider.credential(this.currentUser.email, password);
      await reauthenticateWithCredential(this.currentUser, credential);
      return { success: true };
    } catch (error) {
      console.error('Reauthentication error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Check if user has specific role
  hasRole(role) {
    if (!this.userProfile) return false;
    
    // primaryRole, role, roles 배열 모두 확인
    return (
      this.userProfile.primaryRole === role ||
      this.userProfile.role === role ||
      (this.userProfile.roles && this.userProfile.roles.includes(role))
    );
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    if (!this.userProfile) return false;
    
    // primaryRole, role, roles 배열 모두 확인
    const userRoles = [
      this.userProfile.primaryRole,
      this.userProfile.role,
      ...(this.userProfile.roles || [])
    ].filter(Boolean); // null/undefined 제거
    
    return roles.some(role => userRoles.includes(role));
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get current user profile
  getCurrentUserProfile() {
    return this.userProfile;
  }

  // Handle authentication errors
  handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': '등록되지 않은 사용자입니다.',
      'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
      'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
      'auth/weak-password': '비밀번호가 너무 약합니다. (최소 6자)',
      'auth/invalid-email': '유효하지 않은 이메일 주소입니다.',
      'auth/too-many-requests': '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
      'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
      'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
      'auth/cancelled-popup-request': '로그인이 취소되었습니다.',
      'auth/account-exists-with-different-credential': '다른 방법으로 가입된 계정입니다.',
      'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.',
      'auth/invalid-credential': '유효하지 않은 인증 정보입니다.',
      'auth/operation-not-allowed': '이 로그인 방법은 현재 허용되지 않습니다.',
      'auth/user-disabled': '비활성화된 계정입니다.',
      'auth/invalid-verification-code': '유효하지 않은 인증 코드입니다.',
      'auth/invalid-verification-id': '유효하지 않은 인증 ID입니다.',
      'auth/missing-verification-code': '인증 코드가 누락되었습니다.',
      'auth/missing-verification-id': '인증 ID가 누락되었습니다.',
      'auth/quota-exceeded': '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
    };

    const message = errorMessages[error.code] || '인증 중 오류가 발생했습니다.';
    
    return {
      code: error.code,
      message: message,
      originalError: error
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Check if user email is verified
  isEmailVerified() {
    return this.currentUser && this.currentUser.emailVerified;
  }

  // Get user's FCM token (for notifications)
  async getFCMToken() {
    // This would integrate with your FCM token manager
    // For now, return null - implement based on your FCM setup
    return null;
  }

  // Update FCM token
  async updateFCMToken(token) {
    if (this.currentUser) {
      await this.updateUserProfile(this.currentUser.uid, {
        fcmToken: token,
        fcmTokenUpdatedAt: serverTimestamp()
      });
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService; 