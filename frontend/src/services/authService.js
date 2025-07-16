import { 
  getAuth, 
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
import { db } from "../firebase/firebase";

const auth = getAuth();

// User roles
export const USER_ROLES = {
  SELLER: 'seller',
  CONTRACTOR: 'contractor',
  ADMIN: 'admin',
  CUSTOMER: 'customer'
};

// Authentication service class
class AuthService {
  constructor() {
    this.auth = auth;
    this.currentUser = null;
    this.userProfile = null;
    this.authStateListeners = [];
  }

  // Initialize auth state listener
  initAuthStateListener() {
    return onAuthStateChanged(this.auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        // Get user profile from Firestore
        this.userProfile = await this.getUserProfile(user.uid);
        
        // Update last login
        await this.updateLastLogin(user.uid);
      } else {
        this.userProfile = null;
      }

      // Notify listeners
      this.authStateListeners.forEach(listener => listener(user, this.userProfile));
    });
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
  async sendEmailLink(email, role = USER_ROLES.CUSTOMER) {
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
      window.localStorage.setItem('emailForSignIn', email);
      window.localStorage.setItem('roleForSignIn', role);
      
      return { success: true, message: '인증 메일이 발송되었습니다. 이메일을 확인해주세요.' };
    } catch (error) {
      console.error('Email link error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Complete email link sign in
  async completeEmailSignIn() {
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
  async signInWithGoogle(role = USER_ROLES.CUSTOMER) {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(this.auth, provider);
      
      // Create or update user profile
      await this.createOrUpdateUserProfile(result.user, role);
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Google sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Email/password sign up
  async signUpWithEmail(email, password, userData, role = USER_ROLES.CUSTOMER) {
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
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign out
  async signOut() {
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

    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || additionalData.displayName || '',
      photoURL: user.photoURL || additionalData.photoURL || '',
      role: role,
      emailVerified: user.emailVerified,
      createdAt: userSnap.exists() ? userSnap.data().createdAt : serverTimestamp(),
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
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // Update local profile
      if (this.userProfile && this.userProfile.uid === uid) {
        this.userProfile = { ...this.userProfile, ...updates };
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
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Update last login error:', error);
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email) {
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
    return this.userProfile && this.userProfile.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    return this.userProfile && roles.includes(this.userProfile.role);
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