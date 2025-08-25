import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { AuthService } from '../services/authService';
import { BiometricService } from '../services/biometricService';
import { 
  saveAutoLoginInfo, 
  getAutoLoginInfo, 
  removeAutoLoginInfo, 
  saveLastLoginTime,
  getLastLoginTime 
} from '../utils/storageUtils';
import { User } from '../../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  autoLoginLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  loginWithBiometric: () => Promise<User>;
  register: (
    email: string, 
    password: string, 
    name: string, 
    phone: string, 
    role: string,
    profileImage?: File | null,
    idCardImage?: File | null,
    serviceAreas?: string[],
    experience?: string,
    bankAccount?: string,
    bankName?: string,
    accountHolder?: string,
    // 시공자 사업 정보 (선택사항)
    businessName?: string,
    contractorBusinessNumber?: string,
    contractorBusinessAddress?: string,
    contractorBusinessType?: string,
    contractorBusinessCategory?: string,
    contractorBusinessLicenseImage?: File | null,
    // 판매자 추가 정보
    companyName?: string,
    businessNumber?: string,
    businessAddress?: string,
    businessType?: string,
    businessCategory?: string,
    businessLicenseImage?: File | null,
    // 픽업 정보
    pickupCompanyName?: string,
    pickupPhone?: string,
    pickupAddress?: string
  ) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  enableBiometric: (email: string, password: string) => Promise<boolean>;
  disableBiometric: () => Promise<boolean>;
  isBiometricEnabled: () => boolean;
  isBiometricAvailable: () => Promise<boolean>;
  getAutoLoginInfo: () => { email: string; password: string; rememberMe: boolean } | null;
  removeAutoLoginInfo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoLoginLoading, setAutoLoginLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔍 AuthContext - Firebase 인증 상태 변경:', firebaseUser?.email);
      
      if (firebaseUser) {
        try {
          console.log('📄 AuthContext - Firestore에서 사용자 정보 조회 중...');
          const userData = await AuthService.getCurrentUser();
          console.log('✅ AuthContext - 사용자 정보 가져오기 성공');
          console.log('👤 AuthContext - 사용자 ID:', userData?.id);
          console.log('📧 AuthContext - 사용자 이메일:', userData?.email);
          console.log('👨‍💼 AuthContext - 사용자 역할:', userData?.role);
          console.log('✅ AuthContext - 승인 상태:', userData?.approvalStatus);
          console.log('📋 AuthContext - 전체 사용자 데이터:', JSON.stringify(userData, null, 2));
          
          setUser(userData);
        } catch (error) {
          console.error('❌ AuthContext - 사용자 정보 가져오기 실패:', error);
          setUser(null);
        }
      } else {
        console.log('❌ AuthContext - Firebase 사용자 없음');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 자동 로그인 시도
  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (loading || user) return;

      const savedInfo = getAutoLoginInfo();
      if (!savedInfo) return;

      setAutoLoginLoading(true);
      try {
        console.log('🔄 자동 로그인 시도 중...');
        const userData = await AuthService.login(savedInfo.email, savedInfo.password);
        setUser(userData);
        saveLastLoginTime();
        console.log('✅ 자동 로그인 성공');
      } catch (error) {
        console.error('❌ 자동 로그인 실패:', error);
        // 자동 로그인 실패 시 저장된 정보 삭제
        removeAutoLoginInfo();
      } finally {
        setAutoLoginLoading(false);
      }
    };

    attemptAutoLogin();
  }, [loading, user]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      console.log('AuthContext - 로그인 시도:', email);
      const userData = await AuthService.login(email, password);
      console.log('AuthContext - 로그인 성공:', userData);
      setUser(userData);
      
      // 로그인 정보 저장
      if (rememberMe) {
        saveAutoLoginInfo(email, password, true);
      }
      saveLastLoginTime();
      
      return userData;
    } catch (error) {
      console.error('AuthContext - 로그인 실패:', error);
      throw error;
    }
  };

  const loginWithBiometric = async () => {
    try {
      console.log('AuthContext - 생체인증 로그인 시도');
      const result = await BiometricService.authenticateWithBiometric();
      
      if (!result.success) {
        throw new Error(result.error || '생체인증에 실패했습니다.');
      }

      const savedInfo = getAutoLoginInfo();
      if (!savedInfo) {
        throw new Error('저장된 로그인 정보가 없습니다.');
      }

      const userData = await AuthService.login(savedInfo.email, savedInfo.password);
      setUser(userData);
      saveLastLoginTime();
      
      return userData;
    } catch (error) {
      console.error('AuthContext - 생체인증 로그인 실패:', error);
      throw error;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    phone: string, 
    role: string,
    profileImage?: File | null,
    idCardImage?: File | null,
    serviceAreas?: string[],
    experience?: string,
    bankAccount?: string,
    bankName?: string,
    accountHolder?: string,
    // 시공자 사업 정보 (선택사항)
    businessName?: string,
    contractorBusinessNumber?: string,
    contractorBusinessAddress?: string,
    contractorBusinessType?: string,
    contractorBusinessCategory?: string,
    contractorBusinessLicenseImage?: File | null,
    // 판매자 추가 정보
    companyName?: string,
    businessNumber?: string,
    businessAddress?: string,
    businessType?: string,
    businessCategory?: string,
    businessLicenseImage?: File | null,
    // 픽업 정보
    pickupCompanyName?: string,
    pickupPhone?: string,
    pickupAddress?: string
  ) => {
    try {
      const userData = await AuthService.register(
        email, 
        password, 
        name, 
        phone, 
        role as any,
        profileImage,
        idCardImage,
        serviceAreas,
        experience,
        bankAccount,
        bankName,
        accountHolder,
        businessName,
        contractorBusinessNumber,
        contractorBusinessAddress,
        contractorBusinessType,
        contractorBusinessCategory,
        contractorBusinessLicenseImage,
        companyName,
        businessNumber,
        businessAddress,
        businessType,
        businessCategory,
        businessLicenseImage,
        pickupCompanyName,
        pickupPhone,
        pickupAddress
      );
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      // 로그아웃 시 자동 로그인 정보 삭제 (선택사항)
      // removeAutoLoginInfo();
    } catch (error) {
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user?.id) {
        throw new Error('사용자 정보가 없습니다.');
      }
      
      // 사용자 정보 업데이트
      if (userData.profileImage) {
        await AuthService.updateProfileImage(user.id, userData.profileImage);
      }
      
      // Firestore에서 최신 사용자 정보를 다시 불러와서 로컬 상태 업데이트
      const updatedUserData = await AuthService.getCurrentUser();
      if (updatedUserData) {
        setUser(updatedUserData);
        console.log('사용자 정보 업데이트 완료:', updatedUserData);
      } else {
        // 최신 정보를 불러올 수 없는 경우 로컬 상태만 업데이트
        setUser(prev => prev ? { ...prev, ...userData } : null);
      }
    } catch (error) {
      console.error('사용자 정보 업데이트 실패:', error);
      throw error;
    }
  };

  // 생체인증 관련 메서드들
  const enableBiometric = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await BiometricService.enableBiometric(email, password);
      return result.success;
    } catch (error) {
      console.error('생체인증 활성화 실패:', error);
      return false;
    }
  };

  const disableBiometric = async (): Promise<boolean> => {
    try {
      const result = await BiometricService.disableBiometric();
      return result.success;
    } catch (error) {
      console.error('생체인증 비활성화 실패:', error);
      return false;
    }
  };

  const isBiometricEnabled = (): boolean => {
    return BiometricService.isBiometricEnabled();
  };

  const isBiometricAvailable = async (): Promise<boolean> => {
    return await BiometricService.isBiometricAvailable();
  };

  const value = {
    user,
    loading,
    autoLoginLoading,
    login,
    loginWithBiometric,
    register,
    logout,
    updateUser,
    enableBiometric,
    disableBiometric,
    isBiometricEnabled,
    isBiometricAvailable,
    getAutoLoginInfo,
    removeAutoLoginInfo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
