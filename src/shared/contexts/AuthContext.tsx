import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { AuthService } from '../services/authService';
import { User } from '../../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthContext - Firebase 인증 상태 변경:', firebaseUser?.email);
      
      if (firebaseUser) {
        try {
          const userData = await AuthService.getCurrentUser();
          console.log('AuthContext - 사용자 정보 가져오기 성공:', userData);
          setUser(userData);
        } catch (error) {
          console.error('AuthContext - 사용자 정보 가져오기 실패:', error);
          setUser(null);
        }
      } else {
        console.log('AuthContext - Firebase 사용자 없음');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext - 로그인 시도:', email);
      const userData = await AuthService.login(email, password);
      console.log('AuthContext - 로그인 성공:', userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('AuthContext - 로그인 실패:', error);
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
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
