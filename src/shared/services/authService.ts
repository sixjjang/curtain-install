import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebase/config';
import { User, UserRole, ApprovalStatus } from '../../types';
import { StorageService } from './storageService';
import { extractPhoneNumbers } from '../utils/phoneFormatter';

// 임시 사용자 데이터 타입
interface TempUserData {
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  password: string;
  profileImage?: File;
  businessLicenseImage?: File;
  idCardImage?: File;
  companyName?: string;
  businessNumber?: string;
  businessAddress?: string;
  businessType?: string;
  businessCategory?: string;
  pickupCompanyName?: string;
  pickupPhone?: string;
  pickupAddress?: string;
  serviceAreas?: string[];
  experience?: string;
  bankAccount?: string;
  bankName?: string;
  accountHolder?: string;
  createdAt: Date;
}

export class AuthService {
  // 회원가입
  static async register(
    email: string, 
    password: string, 
    name: string, 
    phone: string, 
    role: UserRole,
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
  ): Promise<User> {
    try {
      console.log('🚀 회원가입 시작:', { email, name, role });
      console.log('📝 입력된 데이터:', {
        email, name, phone, role,
        companyName, businessNumber, businessAddress,
        pickupCompanyName, pickupPhone, pickupAddress
      });
      console.log('🔐 Firebase Auth 계정 생성 중...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Firebase Auth 계정 생성 완료:', user.uid);

      // 프로필 업데이트
      console.log('👤 프로필 업데이트 중...');
      await updateProfile(user, { displayName: name });
      console.log('✅ 프로필 업데이트 완료');

      // 이미지 업로드 처리 (완전 선택사항 - 실패해도 회원가입 계속)
      console.log('📸 이미지 업로드 처리 중...');
      let profileImageUrl = '';
      let businessLicenseImageUrl = '';
      let idCardImageUrl = '';
      
      const uploadImage = async (file: File, path: string, type: string) => {
        try {
          console.log(`📷 ${type} 업로드 시도:`, file.name);
          const timestamp = Date.now();
          const fileExtension = file.name.split('.').pop() || 'jpg';
          const safeFileName = `${type}_${timestamp}.${fileExtension}`;
          
          // StorageService의 안전한 업로드 메서드 사용
          const downloadUrl = await StorageService.uploadImageSafe(file, `${path}/${user.uid}/${safeFileName}`);
          console.log(`✅ ${type} 업로드 완료:`, downloadUrl);
          return downloadUrl;
        } catch (error) {
          console.warn(`⚠️ ${type} 업로드 실패, 계속 진행:`, error);
          return '';
        }
      };

      // 프로필 이미지 업로드 (실패해도 계속 진행)
      if (profileImage) {
        profileImageUrl = await uploadImage(profileImage, 'profile-images', 'profile');
      }

      // 사업자등록증 업로드 (실패해도 계속 진행)
      if (businessLicenseImage) {
        businessLicenseImageUrl = await uploadImage(businessLicenseImage, 'business-licenses', 'license');
      }

      // 본인 반명함판 사진 업로드 (시공자 필수)
      if (idCardImage) {
        idCardImageUrl = await uploadImage(idCardImage, 'id-cards', 'idCard');
      }

      // 기본 사용자 데이터
      console.log('📋 사용자 데이터 구성 중...');
      const userData: User = {
        id: user.uid,
        email,
        name,
        phone, // 포맷팅된 전화번호 (표시용)
        phoneNumbers: extractPhoneNumbers(phone), // 숫자만 저장 (검색용)
        role,
        approvalStatus: 'pending' as ApprovalStatus,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      console.log('✅ 기본 사용자 데이터 구성 완료');

      // 역할별 추가 데이터 설정
      if (role === 'contractor') {
        console.log('🔧 시공자 데이터 구성 중...');
        // 시공자 사업자등록증 업로드
        let contractorBusinessLicenseImageUrl = '';
        if (contractorBusinessLicenseImage) {
          contractorBusinessLicenseImageUrl = await uploadImage(contractorBusinessLicenseImage, 'contractor-business-licenses', 'contractorLicense');
        }

        const contractorData = {
          ...userData,
          businessName: businessName || '', // 상호명 (User 레벨에 저장)
          businessNumber: contractorBusinessNumber || '', // 사업자등록번호 (User 레벨에 저장)
          businessAddress: contractorBusinessAddress || '', // 사업장주소 (User 레벨에 저장)
          businessType: contractorBusinessType || '', // 업태 (User 레벨에 저장)
          businessCategory: contractorBusinessCategory || '', // 종목 (User 레벨에 저장)
          businessLicenseImage: contractorBusinessLicenseImageUrl, // 사업자등록증 (User 레벨에 저장)
          profileImage: profileImageUrl,
          idCardImage: idCardImageUrl, // 본인 반명함판 사진
          level: 1,
          experience: experience || '',
          totalJobs: 0,
          completedJobs: 0,
          totalEarnings: 0,
          rating: 0,
          points: 0,
          skills: [],
          isAvailable: true,
          location: {
            address: '서울시 강남구',
            coordinates: {
              lat: 37.5665,
              lng: 126.9780
            }
          },
          serviceAreas: serviceAreas || [],
          bankAccount: bankAccount || '',
          bankName: bankName || '',
          accountHolder: accountHolder || name // 예금주 (기본값은 사용자 이름)
        };

        console.log('💾 시공자 데이터 Firestore 저장 중...');
        await setDoc(doc(db, 'users', user.uid), contractorData);
        console.log('✅ 시공자 데이터 저장 완료');
        return contractorData;
      } else if (role === 'seller') {
        console.log('🏪 판매자 데이터 구성 중...');
        const sellerData = {
          ...userData,
          companyName: companyName || '',
          businessNumber: businessNumber || '',
          businessAddress: businessAddress || '',
          businessType: businessType || '',
          businessCategory: businessCategory || '',
          businessLicenseImage: businessLicenseImageUrl,
          rating: 0,
          totalSales: 0,
          ...(pickupCompanyName && pickupCompanyName.trim() ? {
            pickupInfo: {
              companyName: pickupCompanyName,
              phone: (pickupPhone && pickupPhone.trim()) || '', // 포맷팅된 픽업 전화번호 (표시용)
              phoneNumbers: pickupPhone ? extractPhoneNumbers(pickupPhone) : '', // 숫자만 저장 (검색용)
              address: (pickupAddress && pickupAddress.trim()) || ''
            }
          } : {})
        };

        console.log('💾 판매자 데이터 Firestore 저장 중...');
        await setDoc(doc(db, 'users', user.uid), sellerData);
        console.log('✅ 판매자 데이터 저장 완료');
        return sellerData;
      }

      console.log('💾 기본 사용자 데이터 Firestore 저장 중...');
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('✅ 기본 사용자 데이터 저장 완료');
      return userData;
    } catch (error: any) {
      console.error('❌ 회원가입 실패:', error);
      
      // Firebase Auth 오류 코드별 사용자 친화적 메시지
      let userMessage = '회원가입에 실패했습니다. 다시 시도해주세요.';
      
      if (error.code === 'auth/email-already-in-use') {
        userMessage = '이미 사용 중인 이메일 주소입니다. 다른 이메일을 사용하거나 로그인해주세요.';
      } else if (error.code === 'auth/invalid-email') {
        userMessage = '유효하지 않은 이메일 주소입니다.';
      } else if (error.code === 'auth/weak-password') {
        userMessage = '비밀번호가 너무 약합니다. 6자 이상으로 설정해주세요.';
      } else if (error.code === 'auth/network-request-failed') {
        userMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.code === 'auth/too-many-requests') {
        userMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      throw new Error(userMessage);
    }
  }

  // 로그인
  static async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore에서 사용자 정보 가져오기
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      const userData = userDoc.data() as User;
      
      // 승인 상태 확인: pending은 허용, rejected는 차단
      if (userData.approvalStatus === 'rejected') {
        throw new Error('회원가입이 거부되었습니다. 관리자에게 문의하세요.');
      }

      if (userData.approvalStatus === 'pending') {
        userData.warningMessage = '관리자 승인 대기 중입니다. 승인 완료 후 모든 기능을 이용할 수 있습니다.';
      }

      return userData;
    } catch (error: any) {
      console.error('❌ 로그인 실패:', error);
      
      // Firebase Auth 오류 코드별 사용자 친화적 메시지
      let userMessage = '로그인에 실패했습니다. 다시 시도해주세요.';
      
      if (error.code === 'auth/user-not-found') {
        userMessage = '등록되지 않은 이메일 주소입니다.';
      } else if (error.code === 'auth/wrong-password') {
        userMessage = '비밀번호가 올바르지 않습니다.';
      } else if (error.code === 'auth/invalid-email') {
        userMessage = '유효하지 않은 이메일 주소입니다.';
      } else if (error.code === 'auth/network-request-failed') {
        userMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.code === 'auth/too-many-requests') {
        userMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.code === 'auth/user-disabled') {
        userMessage = '비활성화된 계정입니다. 관리자에게 문의하세요.';
      }
      
      throw new Error(userMessage);
    }
  }

  // 로그아웃
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(`로그아웃 실패: ${error}`);
    }
  }

  // 현재 사용자 정보 가져오기
  static async getCurrentUser(): Promise<User | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return null;

      return userDoc.data() as User;
    } catch (error) {
      console.error('현재 사용자 정보 가져오기 실패:', error);
      return null;
    }
  }

  // 사용자 ID로 사용자 정보 가져오기
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      return {
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date()
      } as User;
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
      return null;
    }
  }

  // 테스트 계정 역할 설정
  static async setTestAccountRole(email: string, role: UserRole): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인된 사용자가 없습니다.');
      }

      console.log(`setTestAccountRole - 사용자 ID: ${user.uid}, 설정할 역할: ${role}`);

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        // 기존 사용자 정보 업데이트
        const userData = userDoc.data() as User;
        const updatedUserData: User = {
          ...userData,
          role,
          approvalStatus: 'approved' as ApprovalStatus, // 테스트 계정은 자동 승인
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'users', user.uid), updatedUserData);
        console.log(`사용자 역할이 ${role}로 업데이트되었습니다. 기존 역할: ${userData.role}`);
      } else {
        // 새 사용자 정보 생성
        const newUserData: User = {
          id: user.uid,
          email: user.email || email,
          name: user.displayName || '테스트 사용자',
          phone: '010-0000-0000',
          role,
          approvalStatus: 'approved' as ApprovalStatus, // 테스트 계정은 자동 승인
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'users', user.uid), newUserData);
        console.log(`새 사용자 정보가 ${role} 역할로 생성되었습니다.`);
      }
    } catch (error) {
      console.error('setTestAccountRole 오류:', error);
      throw new Error(`역할 설정 실패: ${error}`);
    }
  }

  // 현재 로그인된 사용자의 역할 수정 (디버깅용)
  static async updateCurrentUserRole(role: UserRole): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인된 사용자가 없습니다.');
      }

      console.log(`updateCurrentUserRole - 사용자 ID: ${user.uid}, 새 역할: ${role}`);

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        const updatedUserData: User = {
          ...userData,
          role,
          approvalStatus: 'approved' as ApprovalStatus, // 테스트 계정은 자동 승인
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'users', user.uid), updatedUserData);
        console.log(`현재 사용자 역할이 ${role}로 업데이트되었습니다. 기존 역할: ${userData.role}`);
      } else {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('updateCurrentUserRole 오류:', error);
      throw new Error(`역할 수정 실패: ${error}`);
    }
  }

  // 임시 사용자 데이터 저장
  static async saveTempUserData(tempData: TempUserData): Promise<string> {
    try {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempDocRef = doc(db, 'temp_users', tempId);
      
      await setDoc(tempDocRef, {
        ...tempData,
        tempId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30분 후 만료
      });
      
      return tempId;
    } catch (error) {
      console.error('임시 사용자 데이터 저장 실패:', error);
      throw new Error('임시 데이터 저장에 실패했습니다.');
    }
  }

  // 임시 사용자 데이터 가져오기
  static async getTempUserData(tempId: string): Promise<TempUserData | null> {
    try {
      const tempDocRef = doc(db, 'temp_users', tempId);
      const tempDoc = await getDoc(tempDocRef);
      
      if (!tempDoc.exists()) {
        return null;
      }
      
      const data = tempDoc.data();
      const expiresAt = data.expiresAt?.toDate();
      
      if (expiresAt && expiresAt < new Date()) {
        // 만료된 데이터 삭제
        await deleteDoc(tempDocRef);
        return null;
      }
      
      return data as TempUserData;
    } catch (error) {
      console.error('임시 사용자 데이터 가져오기 실패:', error);
      return null;
    }
  }

  // 임시 사용자 데이터 삭제
  static async deleteTempUserData(tempId: string): Promise<void> {
    try {
      const tempDocRef = doc(db, 'temp_users', tempId);
      await deleteDoc(tempDocRef);
    } catch (error) {
      console.error('임시 사용자 데이터 삭제 실패:', error);
    }
  }

  // 1단계: 기본 정보만 저장 (Firebase Auth 등록 안함)
  static async registerStep1(
    email: string,
    password: string,
    name: string,
    phone: string,
    role: UserRole
  ): Promise<string> {
    try {
      console.log('📝 1단계 회원가입 시작:', { email, name, role });
      
      // 이메일 중복 확인
      const existingUser = await this.checkEmailExists(email);
      if (existingUser) {
        throw new Error('이미 사용 중인 이메일 주소입니다.');
      }
      
      // 전화번호 중복 확인
      const existingPhone = await this.checkPhoneExists(phone);
      if (existingPhone) {
        throw new Error('이미 사용 중인 전화번호입니다.');
      }
      
      // 임시 데이터 저장
      const tempData: TempUserData = {
        email,
        password,
        name,
        phone,
        role,
        createdAt: new Date()
      };
      
      const tempId = await this.saveTempUserData(tempData);
      console.log('✅ 1단계 완료, 임시 ID:', tempId);
      
      return tempId;
    } catch (error: any) {
      console.error('❌ 1단계 회원가입 실패:', error);
      throw error;
    }
  }

  // 2단계: 추가 정보 저장
  static async registerStep2(
    tempId: string,
    additionalData: {
      profileImage?: File;
      businessLicenseImage?: File;
      idCardImage?: File;
      companyName?: string;
      businessNumber?: string;
      businessAddress?: string;
      businessType?: string;
      businessCategory?: string;
      pickupCompanyName?: string;
      pickupPhone?: string;
      pickupAddress?: string;
      serviceAreas?: string[];
      experience?: string;
      bankAccount?: string;
      bankName?: string;
      accountHolder?: string;
    }
  ): Promise<void> {
    try {
      console.log('📝 2단계 회원가입 시작:', tempId);
      
      // 임시 데이터 가져오기
      const tempData = await this.getTempUserData(tempId);
      if (!tempData) {
        throw new Error('임시 데이터를 찾을 수 없습니다. 다시 시도해주세요.');
      }
      
      // 임시 데이터 업데이트
      const updatedTempData: TempUserData = {
        ...tempData,
        ...additionalData
      };
      
      await this.saveTempUserData(updatedTempData);
      console.log('✅ 2단계 완료');
    } catch (error: any) {
      console.error('❌ 2단계 회원가입 실패:', error);
      throw error;
    }
  }

  // 최종 회원가입 완료 (Firebase Auth 등록)
  static async completeRegistration(tempId: string): Promise<User> {
    try {
      console.log('📝 최종 회원가입 완료 시작:', tempId);
      
      // 임시 데이터 가져오기
      const tempData = await this.getTempUserData(tempId);
      if (!tempData) {
        throw new Error('임시 데이터를 찾을 수 없습니다. 다시 시도해주세요.');
      }
      
      // Firebase Auth 계정 생성
      console.log('🔐 Firebase Auth 계정 생성 중...');
      const userCredential = await createUserWithEmailAndPassword(auth, tempData.email, tempData.password);
      const user = userCredential.user;
      console.log('✅ Firebase Auth 계정 생성 완료:', user.uid);

      // 프로필 업데이트
      await updateProfile(user, { displayName: tempData.name });

      // 이미지 업로드 처리
      let profileImageUrl = '';
      let businessLicenseImageUrl = '';
      let idCardImageUrl = '';
      
      const uploadImage = async (file: File, path: string, type: string) => {
        try {
          const timestamp = Date.now();
          const fileExtension = file.name.split('.').pop() || 'jpg';
          const safeFileName = `${type}_${timestamp}.${fileExtension}`;
          
          // StorageService의 안전한 업로드 메서드 사용
          const downloadUrl = await StorageService.uploadImageSafe(file, `${path}/${user.uid}/${safeFileName}`);
          console.log(`✅ ${type} 업로드 완료:`, downloadUrl);
          return downloadUrl;
        } catch (error) {
          console.warn(`⚠️ ${type} 업로드 실패, 계속 진행:`, error);
          return '';
        }
      };

      if (tempData.profileImage) {
        profileImageUrl = await uploadImage(tempData.profileImage, 'profile-images', 'profile');
      }
      if (tempData.businessLicenseImage) {
        businessLicenseImageUrl = await uploadImage(tempData.businessLicenseImage, 'business-licenses', 'license');
      }
      if (tempData.idCardImage) {
        idCardImageUrl = await uploadImage(tempData.idCardImage, 'id-cards', 'idCard');
      }

      // 사용자 데이터 구성
      const userData: User = {
        id: user.uid,
        email: tempData.email,
        name: tempData.name,
        phone: tempData.phone,
        role: tempData.role,
        approvalStatus: 'pending' as ApprovalStatus,
        createdAt: tempData.createdAt,
        updatedAt: new Date()
      };

      // 역할별 데이터 저장
      if (tempData.role === 'contractor') {
        const contractorData = {
          ...userData,
          profileImage: profileImageUrl,
          idCardImage: idCardImageUrl,
          level: 1,
          experience: tempData.experience || '',
          totalJobs: 0,
          completedJobs: 0,
          totalEarnings: 0,
          rating: 0,
          points: 0,
          skills: [],
          isAvailable: true,
          location: {
            address: '서울시 강남구',
            coordinates: {
              lat: 37.5665,
              lng: 126.9780
            }
          },
          serviceAreas: tempData.serviceAreas || [],
          bankAccount: tempData.bankAccount || '',
          bankName: tempData.bankName || '',
          accountHolder: tempData.accountHolder || tempData.name
        };

        await setDoc(doc(db, 'users', user.uid), contractorData);
        console.log('✅ 시공자 데이터 저장 완료');
        return contractorData;
      } else if (tempData.role === 'seller') {
        const sellerData = {
          ...userData,
          companyName: tempData.companyName || '',
          businessNumber: tempData.businessNumber || '',
          businessAddress: tempData.businessAddress || '',
          businessType: tempData.businessType || '',
          businessCategory: tempData.businessCategory || '',
          businessLicenseImage: businessLicenseImageUrl,
          rating: 0,
          completedJobs: 0,
          totalSales: 0,
          points: 0,
          ...(tempData.pickupCompanyName && tempData.pickupCompanyName.trim() ? {
            pickupInfo: {
              companyName: tempData.pickupCompanyName,
              phone: (tempData.pickupPhone && tempData.pickupPhone.trim()) || '',
              address: (tempData.pickupAddress && tempData.pickupAddress.trim()) || ''
            }
          } : {})
        };

        await setDoc(doc(db, 'users', user.uid), sellerData);
        console.log('✅ 판매자 데이터 저장 완료');
        return sellerData;
      }

      // 기본 사용자 데이터 저장
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('✅ 기본 사용자 데이터 저장 완료');

      // 임시 데이터 삭제
      await this.deleteTempUserData(tempId);
      
      return userData;
    } catch (error: any) {
      console.error('❌ 최종 회원가입 실패:', error);
      
      let userMessage = '회원가입에 실패했습니다. 다시 시도해주세요.';
      
      if (error.code === 'auth/email-already-in-use') {
        userMessage = '이미 사용 중인 이메일 주소입니다.';
      } else if (error.code === 'auth/invalid-email') {
        userMessage = '유효하지 않은 이메일 주소입니다.';
      } else if (error.code === 'auth/weak-password') {
        userMessage = '비밀번호가 너무 약합니다. 6자 이상으로 설정해주세요.';
      }
      
      throw new Error(userMessage);
    }
  }

  // 이메일 중복 확인
  static async checkEmailExists(email: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('이메일 중복 확인 실패:', error);
      return false;
    }
  }

  // 전화번호 중복 확인
  static async checkPhoneExists(phone: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phone));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('전화번호 중복 확인 실패:', error);
      return false;
    }
  }
}
