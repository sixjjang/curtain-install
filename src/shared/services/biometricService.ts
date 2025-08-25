import { saveBiometricSettings, getBiometricSettings, saveAutoLoginInfo, getAutoLoginInfo } from '../utils/storageUtils';

export interface BiometricCredential {
  id: string;
  name: string;
  displayName: string;
}

export interface BiometricAuthResult {
  success: boolean;
  credential?: BiometricCredential;
  error?: string;
}

export class BiometricService {
  private static isSupported(): boolean {
    return 'credentials' in navigator && 'preventSilentAccess' in navigator.credentials;
  }

  private static isSecureContext(): boolean {
    return window.isSecureContext;
  }

  /**
   * 생체인증 지원 여부 확인
   */
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      // 기본 지원 여부 확인
      if (!this.isSupported()) {
        console.log('생체인증: 기본 지원 안됨');
        return false;
      }

      // 보안 컨텍스트 확인 (HTTPS 또는 localhost)
      if (!this.isSecureContext()) {
        console.log('생체인증: 보안 컨텍스트 아님');
        return false;
      }

      // PublicKeyCredential 지원 여부 확인
      if (!window.PublicKeyCredential) {
        console.log('생체인증: PublicKeyCredential 지원 안됨');
        return false;
      }

      // 사용 가능한 인증 방식 확인
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log('생체인증: 사용 가능 여부:', available);
      
      return available;
    } catch (error) {
      console.error('생체인증 지원 여부 확인 실패:', error);
      return false;
    }
  }

  /**
   * 생체인증 활성화
   */
  static async enableBiometric(email: string, password: string): Promise<BiometricAuthResult> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: '생체인증을 지원하지 않는 기기입니다.'
        };
      }

      // 자동 로그인 정보 저장
      saveAutoLoginInfo(email, password, true);
      saveBiometricSettings(true);

      return {
        success: true
      };
    } catch (error) {
      console.error('생체인증 활성화 실패:', error);
      return {
        success: false,
        error: '생체인증 활성화에 실패했습니다.'
      };
    }
  }

  /**
   * 생체인증 비활성화
   */
  static async disableBiometric(): Promise<BiometricAuthResult> {
    try {
      saveBiometricSettings(false);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('생체인증 비활성화 실패:', error);
      return {
        success: false,
        error: '생체인증 비활성화에 실패했습니다.'
      };
    }
  }

  /**
   * 생체인증 상태 확인
   */
  static isBiometricEnabled(): boolean {
    return getBiometricSettings();
  }

  /**
   * 생체인증으로 로그인 시도
   */
  static async authenticateWithBiometric(): Promise<BiometricAuthResult> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: '생체인증을 지원하지 않는 기기입니다.'
        };
      }

      const isEnabled = this.isBiometricEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: '생체인증이 활성화되지 않았습니다.'
        };
      }

      // 저장된 로그인 정보 확인
      const savedInfo = getAutoLoginInfo();
      if (!savedInfo) {
        return {
          success: false,
          error: '저장된 로그인 정보가 없습니다.'
        };
      }

      // 생체인증 요청
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (credential) {
        return {
          success: true,
          credential: {
            id: credential.id,
            name: savedInfo.email,
            displayName: savedInfo.email
          }
        };
      } else {
        return {
          success: false,
          error: '생체인증이 취소되었습니다.'
        };
      }
    } catch (error) {
      console.error('생체인증 실패:', error);
      return {
        success: false,
        error: '생체인증에 실패했습니다.'
      };
    }
  }

  /**
   * 생체인증 등록
   */
  static async registerBiometric(email: string): Promise<BiometricAuthResult> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: '생체인증을 지원하지 않는 기기입니다.'
        };
      }

      // 랜덤 challenge 생성
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // 사용자 정보 생성
      const user = {
        id: new Uint8Array(16),
        name: email,
        displayName: email
      };
      crypto.getRandomValues(user.id);

      // PublicKeyCredential 생성 옵션
      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: '전문가의 손길',
          id: window.location.hostname
        },
        user,
        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7 // ES256
          }
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        },
        timeout: 60000
      };

      // 생체인증 등록
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;

      if (credential) {
        return {
          success: true,
          credential: {
            id: credential.id,
            name: email,
            displayName: email
          }
        };
      } else {
        return {
          success: false,
          error: '생체인증 등록이 취소되었습니다.'
        };
      }
    } catch (error) {
      console.error('생체인증 등록 실패:', error);
      return {
        success: false,
        error: '생체인증 등록에 실패했습니다.'
      };
    }
  }

  /**
   * 생체인증 정보 삭제
   */
  static async deleteBiometricCredential(): Promise<BiometricAuthResult> {
    try {
      if ('credentials' in navigator) {
        // 저장된 자격 증명 삭제
        await navigator.credentials.preventSilentAccess();
      }

      // 설정 초기화
      saveBiometricSettings(false);

      return {
        success: true
      };
    } catch (error) {
      console.error('생체인증 정보 삭제 실패:', error);
      return {
        success: false,
        error: '생체인증 정보 삭제에 실패했습니다.'
      };
    }
  }

  /**
   * 생체인증 상태 정보 조회
   */
  static async getBiometricStatus(): Promise<{
    isSupported: boolean;
    isEnabled: boolean;
    isSecureContext: boolean;
    isAvailable: boolean;
  }> {
    const isSupported = this.isSupported();
    const isSecureContext = this.isSecureContext();
    const isAvailable = await this.isBiometricAvailable();
    const isEnabled = this.isBiometricEnabled();

    return {
      isSupported,
      isEnabled,
      isSecureContext,
      isAvailable
    };
  }
}
