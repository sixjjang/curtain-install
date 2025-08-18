import { 
  signInWithCredential, 
  OAuthProvider, 
  UserCredential,
  updateProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { User, UserRole, ApprovalStatus, ContractorInfo, SellerInfo } from '../../types';

// 카카오 로그인 설정
const KAKAO_CONFIG = {
  API_KEY: process.env.REACT_APP_KAKAO_API_KEY || 'YOUR_KAKAO_API_KEY_HERE',
  REDIRECT_URI: process.env.REACT_APP_KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/kakao/callback',
  AUTH_URL: 'https://kauth.kakao.com/oauth/authorize',
  TOKEN_URL: 'https://kauth.kakao.com/oauth/token',
  USER_INFO_URL: 'https://kapi.kakao.com/v2/user/me'
};

export class KakaoAuthService {
  // 카카오 로그인 시작
  static initiateKakaoLogin(): void {
    const params = new URLSearchParams({
      client_id: KAKAO_CONFIG.API_KEY,
      redirect_uri: KAKAO_CONFIG.REDIRECT_URI,
      response_type: 'code',
      scope: 'profile_nickname,profile_image,account_email'
    });

    const authUrl = `${KAKAO_CONFIG.AUTH_URL}?${params.toString()}`;
    window.location.href = authUrl;
  }

  // 카카오 인증 코드로 액세스 토큰 얻기
  static async getKakaoAccessToken(code: string): Promise<string> {
    const response = await fetch(KAKAO_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_CONFIG.API_KEY,
        redirect_uri: KAKAO_CONFIG.REDIRECT_URI,
        code: code
      })
    });

    if (!response.ok) {
      throw new Error('카카오 액세스 토큰을 가져올 수 없습니다.');
    }

    const data = await response.json();
    return data.access_token;
  }

  // 카카오 사용자 정보 가져오기
  static async getKakaoUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    nickname: string;
    profileImage?: string;
  }> {
    const response = await fetch(KAKAO_CONFIG.USER_INFO_URL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    if (!response.ok) {
      throw new Error('카카오 사용자 정보를 가져올 수 없습니다.');
    }

    const data = await response.json();
    
    return {
      id: data.id.toString(),
      email: data.kakao_account?.email || `${data.id}@kakao.com`,
      nickname: data.properties?.nickname || '카카오 사용자',
      profileImage: data.properties?.profile_image
    };
  }

  // Firebase와 카카오 계정 연결
  static async signInWithKakao(accessToken: string): Promise<UserCredential> {
    const provider = new OAuthProvider('oidc.kakao');
    const credential = provider.credential({
      accessToken: accessToken
    });

    return signInWithCredential(auth, credential);
  }

  // 카카오 로그인 처리 (전체 플로우)
  static async handleKakaoLogin(code: string): Promise<User> {
    try {
      console.log('🔐 카카오 로그인 시작...');
      
      // 1. 액세스 토큰 얻기
      const accessToken = await this.getKakaoAccessToken(code);
      console.log('✅ 카카오 액세스 토큰 획득');

      // 2. 카카오 사용자 정보 가져오기
      const kakaoUserInfo = await this.getKakaoUserInfo(accessToken);
      console.log('✅ 카카오 사용자 정보 획득:', kakaoUserInfo);

      // 3. Firebase와 연결
      const userCredential = await this.signInWithKakao(accessToken);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase 인증 완료:', firebaseUser.uid);

      // 4. 프로필 업데이트
      await updateProfile(firebaseUser, {
        displayName: kakaoUserInfo.nickname,
        photoURL: kakaoUserInfo.profileImage
      });

      // 5. 기존 사용자 정보 확인
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // 기존 사용자 - 로그인 완료
        console.log('✅ 기존 사용자 로그인 완료');
        return userDoc.data() as User;
      } else {
        // 새 사용자 - 회원가입 필요
        console.log('🆕 새 사용자 - 회원가입 정보 입력 필요');
        throw new Error('KAKAO_NEW_USER');
      }

    } catch (error) {
      console.error('❌ 카카오 로그인 실패:', error);
      throw error;
    }
  }

  // 카카오 계정으로 회원가입 완료
  static async completeKakaoRegistration(
    firebaseUser: FirebaseUser,
    kakaoUserInfo: any,
    additionalInfo: {
      phone: string;
      role: UserRole;
      serviceAreas?: string[];
      experience?: string;
      bankAccount?: string;
      bankName?: string;
      accountHolder?: string;
      companyName?: string;
      businessNumber?: string;
      businessAddress?: string;
      businessType?: string;
      businessCategory?: string;
      pickupCompanyName?: string;
      pickupPhone?: string;
      pickupAddress?: string;
    }
  ): Promise<User> {
    try {
      console.log('📝 카카오 회원가입 완료 처리...');

      const userData: User = {
        id: firebaseUser.uid,
        email: kakaoUserInfo.email,
        name: kakaoUserInfo.nickname,
        phone: additionalInfo.phone,
        role: additionalInfo.role,
        profileImage: kakaoUserInfo.profileImage || '',
        approvalStatus: additionalInfo.role === 'admin' ? 'approved' : 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        loginMethod: 'kakao'
      };

      // 역할별 추가 정보
      if (additionalInfo.role === 'contractor') {
        const contractorInfo: ContractorInfo = {
          name: kakaoUserInfo.nickname,
          phone: additionalInfo.phone,
          email: kakaoUserInfo.email,
          serviceAreas: additionalInfo.serviceAreas || [],
          experience: additionalInfo.experience || '',
          bankAccount: additionalInfo.bankAccount || '',
          bankName: additionalInfo.bankName || '',
          accountHolder: additionalInfo.accountHolder || kakaoUserInfo.nickname,
          rating: 0,
          completedJobs: 0,
          totalJobs: 0,
          totalEarnings: 0,
          level: 1,
          points: 0
        };
        userData.contractor = contractorInfo;
      } else if (additionalInfo.role === 'seller') {
        const sellerInfo: SellerInfo = {
          companyName: additionalInfo.companyName || '',
          businessNumber: additionalInfo.businessNumber || '',
          businessAddress: additionalInfo.businessAddress || '',
          businessType: additionalInfo.businessType || '',
          businessCategory: additionalInfo.businessCategory || '',
          rating: 0,
          completedJobs: 0,
          totalSales: 0,
          points: 0
        };

        // 픽업 정보가 있는 경우에만 추가
        if (additionalInfo.pickupCompanyName && additionalInfo.pickupCompanyName.trim()) {
          sellerInfo.pickupInfo = {
            companyName: additionalInfo.pickupCompanyName.trim(),
            phone: (additionalInfo.pickupPhone && additionalInfo.pickupPhone.trim()) || '',
            address: (additionalInfo.pickupAddress && additionalInfo.pickupAddress.trim()) || ''
          };
        }
        
        userData.seller = sellerInfo;
      }

      // Firestore에 사용자 정보 저장
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, userData);

      console.log('✅ 카카오 회원가입 완료:', userData);
      return userData;

    } catch (error) {
      console.error('❌ 카카오 회원가입 실패:', error);
      throw error;
    }
  }
}
