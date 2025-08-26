import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { SystemSettings } from '../../types';

export class SystemSettingsService {
  private static readonly SETTINGS_ID = 'system_settings';

  // 기본 설정값
  private static readonly DEFAULT_SETTINGS: Omit<SystemSettings, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'> = {
    escrowAutoReleaseHours: 48, // 기본 48시간
    jobCancellationPolicy: {
      maxCancellationHours: 24, // 기본 24시간
      maxDailyCancellations: 3, // 기본 하루 3회
      cancellationFeeRate: 5 // 기본 5%
    },
    compensationPolicy: {
      productNotReadyRate: 30, // 기본 30%
      customerAbsentRate: 100, // 기본 100%
      scheduleChangeFeeRate: 0 // 기본 0%
    },
    feeSettings: {
      sellerCommissionRate: 3, // 기본 3%
      contractorCommissionRate: 2 // 기본 2%
    },
    userGuidanceSettings: {
      contractorGuidance: {
        title: '시공자 서비스 이용 안내',
        content: '',
        version: 1
      },
      sellerGuidance: {
        title: '판매자 서비스 이용 안내',
        content: '',
        version: 1
      }
    }
  };

  // 시스템 설정 조회
  static async getSystemSettings(): Promise<SystemSettings> {
    try {
      const settingsRef = doc(db, 'systemSettings', this.SETTINGS_ID);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        return {
          id: settingsDoc.id,
          escrowAutoReleaseHours: data.escrowAutoReleaseHours || this.DEFAULT_SETTINGS.escrowAutoReleaseHours,
          jobCancellationPolicy: {
            maxCancellationHours: data.jobCancellationPolicy?.maxCancellationHours || this.DEFAULT_SETTINGS.jobCancellationPolicy.maxCancellationHours,
            maxDailyCancellations: data.jobCancellationPolicy?.maxDailyCancellations || this.DEFAULT_SETTINGS.jobCancellationPolicy.maxDailyCancellations,
            cancellationFeeRate: data.jobCancellationPolicy?.cancellationFeeRate || this.DEFAULT_SETTINGS.jobCancellationPolicy.cancellationFeeRate
          },
          compensationPolicy: {
            productNotReadyRate: data.compensationPolicy?.productNotReadyRate || this.DEFAULT_SETTINGS.compensationPolicy.productNotReadyRate,
            customerAbsentRate: data.compensationPolicy?.customerAbsentRate || this.DEFAULT_SETTINGS.compensationPolicy.customerAbsentRate,
            scheduleChangeFeeRate: data.compensationPolicy?.scheduleChangeFeeRate || this.DEFAULT_SETTINGS.compensationPolicy.scheduleChangeFeeRate
          },
          feeSettings: {
            sellerCommissionRate: data.feeSettings?.sellerCommissionRate !== undefined ? data.feeSettings.sellerCommissionRate : this.DEFAULT_SETTINGS.feeSettings.sellerCommissionRate,
            contractorCommissionRate: data.feeSettings?.contractorCommissionRate !== undefined ? data.feeSettings.contractorCommissionRate : this.DEFAULT_SETTINGS.feeSettings.contractorCommissionRate
          },
          userGuidanceSettings: {
            contractorGuidance: data.userGuidanceSettings?.contractorGuidance || this.DEFAULT_SETTINGS.userGuidanceSettings.contractorGuidance,
            sellerGuidance: data.userGuidanceSettings?.sellerGuidance || this.DEFAULT_SETTINGS.userGuidanceSettings.sellerGuidance
          },
          tossAccount: data.tossAccount || null,
          manualAccount: data.manualAccount || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          updatedBy: data.updatedBy || 'system'
        };
      } else {
        // 기본 설정으로 초기화
        return await this.initializeDefaultSettings();
      }
    } catch (error) {
      console.error('시스템 설정 조회 실패:', error);
      throw new Error('시스템 설정을 조회할 수 없습니다.');
    }
  }

  // 기본 설정으로 초기화
  static async initializeDefaultSettings(): Promise<SystemSettings> {
    try {
      const settingsRef = doc(db, 'systemSettings', this.SETTINGS_ID);
      const defaultSettings: SystemSettings = {
        id: this.SETTINGS_ID,
        ...this.DEFAULT_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'system'
      };

      await setDoc(settingsRef, {
        ...this.DEFAULT_SETTINGS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: 'system'
      });

      return defaultSettings;
    } catch (error) {
      console.error('기본 설정 초기화 실패:', error);
      throw new Error('기본 설정을 초기화할 수 없습니다.');
    }
  }

  // 에스크로 자동 지급 시간 업데이트
  static async updateEscrowAutoReleaseHours(hours: number, adminId: string): Promise<void> {
    try {
      if (hours < 1 || hours > 168) { // 1시간 ~ 7일 (168시간)
        throw new Error('에스크로 자동 지급 시간은 1시간에서 168시간(7일) 사이여야 합니다.');
      }

      const settingsRef = doc(db, 'systemSettings', this.SETTINGS_ID);
      await updateDoc(settingsRef, {
        escrowAutoReleaseHours: hours,
        updatedAt: serverTimestamp(),
        updatedBy: adminId
      });

      console.log(`✅ 에스크로 자동 지급 시간이 ${hours}시간으로 업데이트되었습니다.`);
    } catch (error) {
      console.error('에스크로 자동 지급 시간 업데이트 실패:', error);
      throw new Error('에스크로 자동 지급 시간을 업데이트할 수 없습니다.');
    }
  }

  // 현재 에스크로 자동 지급 시간 조회
  static async getEscrowAutoReleaseHours(): Promise<number> {
    try {
      const settings = await this.getSystemSettings();
      return settings.escrowAutoReleaseHours;
    } catch (error) {
      console.error('에스크로 자동 지급 시간 조회 실패:', error);
      return this.DEFAULT_SETTINGS.escrowAutoReleaseHours; // 기본값 반환
    }
  }

  // 설정 변경 이력 조회 (향후 확장용)
  static async getSettingsHistory(): Promise<SystemSettings[]> {
    try {
      // 현재는 단일 설정만 반환, 향후 이력 기능 추가 시 확장
      const settings = await this.getSystemSettings();
      return [settings];
    } catch (error) {
      console.error('설정 이력 조회 실패:', error);
      return [];
    }
  }

  // 취소 정책 업데이트
  static async updateCancellationPolicy(
    maxCancellationHours: number, 
    maxDailyCancellations: number,
    cancellationFeeRate: number,
    adminId: string
  ): Promise<void> {
    try {
      if (maxCancellationHours < 1 || maxCancellationHours > 168) {
        throw new Error('취소 가능 시간은 1시간에서 168시간(7일) 사이여야 합니다.');
      }
      if (maxDailyCancellations < 1 || maxDailyCancellations > 10) {
        throw new Error('일일 최대 취소 횟수는 1회에서 10회 사이여야 합니다.');
      }
      if (cancellationFeeRate < 0 || cancellationFeeRate > 50) {
        throw new Error('취소 수수료율은 0%에서 50% 사이여야 합니다.');
      }

      const settingsRef = doc(db, 'systemSettings', this.SETTINGS_ID);
      await updateDoc(settingsRef, {
        'jobCancellationPolicy.maxCancellationHours': maxCancellationHours,
        'jobCancellationPolicy.maxDailyCancellations': maxDailyCancellations,
        'jobCancellationPolicy.cancellationFeeRate': cancellationFeeRate,
        updatedAt: serverTimestamp(),
        updatedBy: adminId
      });

      console.log(`✅ 취소 정책이 업데이트되었습니다. (최대 취소 시간: ${maxCancellationHours}시간, 일일 최대 취소: ${maxDailyCancellations}회, 수수료율: ${cancellationFeeRate}%)`);
    } catch (error) {
      console.error('취소 정책 업데이트 실패:', error);
      throw new Error('취소 정책을 업데이트할 수 없습니다.');
    }
  }

  // 취소 정책 조회 (간편 메서드)
  static async getCancellationPolicy(): Promise<{ maxCancellationHours: number; maxDailyCancellations: number; cancellationFeeRate: number }> {
    try {
      const settings = await this.getSystemSettings();
      return settings.jobCancellationPolicy;
    } catch (error) {
      console.error('취소 정책 조회 실패:', error);
      return this.DEFAULT_SETTINGS.jobCancellationPolicy;
    }
  }

  // 보상 정책 업데이트
  static async updateCompensationPolicy(
    productNotReadyRate: number,
    customerAbsentRate: number,
    scheduleChangeFeeRate: number,
    adminId: string
  ): Promise<void> {
    try {
      if (productNotReadyRate < 0 || productNotReadyRate > 100) {
        throw new Error('제품 준비 미완료 보상율은 0%에서 100% 사이여야 합니다.');
      }
      if (customerAbsentRate < 0 || customerAbsentRate > 100) {
        throw new Error('소비자 부재 보상율은 0%에서 100% 사이여야 합니다.');
      }
      if (scheduleChangeFeeRate < 0 || scheduleChangeFeeRate > 50) {
        throw new Error('일정 변경 수수료율은 0%에서 50% 사이여야 합니다.');
      }

      const settingsRef = doc(db, 'systemSettings', this.SETTINGS_ID);
      await updateDoc(settingsRef, {
        'compensationPolicy.productNotReadyRate': productNotReadyRate,
        'compensationPolicy.customerAbsentRate': customerAbsentRate,
        'compensationPolicy.scheduleChangeFeeRate': scheduleChangeFeeRate,
        updatedAt: serverTimestamp(),
        updatedBy: adminId
      });

      console.log(`✅ 보상 정책이 업데이트되었습니다. (제품 미준비: ${productNotReadyRate}%, 소비자 부재: ${customerAbsentRate}%, 일정 변경 수수료: ${scheduleChangeFeeRate}%)`);
    } catch (error) {
      console.error('보상 정책 업데이트 실패:', error);
      throw new Error('보상 정책을 업데이트할 수 없습니다.');
    }
  }

  // 보상 정책 조회 (간편 메서드)
  static async getCompensationPolicy(): Promise<{ productNotReadyRate: number; customerAbsentRate: number; scheduleChangeFeeRate: number }> {
    try {
      const settings = await this.getSystemSettings();
      return settings.compensationPolicy;
    } catch (error) {
      console.error('보상 정책 조회 실패:', error);
      return this.DEFAULT_SETTINGS.compensationPolicy;
    }
  }

  // 토스페이먼츠 계좌 설정 업데이트
  static async updateTossAccount(
    bankName: string,
    accountNumber: string,
    accountHolder: string,
    isActive: boolean,
    adminId: string
  ): Promise<void> {
    try {
      if (!bankName || !accountNumber || !accountHolder) {
        throw new Error('은행명, 계좌번호, 예금주명을 모두 입력해주세요.');
      }

      const settingsRef = doc(db, 'systemSettings', this.SETTINGS_ID);
      await updateDoc(settingsRef, {
        tossAccount: {
          bankName,
          accountNumber,
          accountHolder,
          isActive
        },
        updatedAt: serverTimestamp(),
        updatedBy: adminId
      });

      console.log(`✅ 토스페이먼츠 계좌 설정이 업데이트되었습니다. (${bankName} ${accountNumber})`);
    } catch (error) {
      console.error('토스페이먼츠 계좌 설정 업데이트 실패:', error);
      throw new Error('토스페이먼츠 계좌 설정을 업데이트할 수 없습니다.');
    }
  }

  // 토스페이먼츠 계좌 설정 조회
  static async getTossAccount(): Promise<{ bankName: string; accountNumber: string; accountHolder: string; isActive: boolean } | null> {
    try {
      const settings = await this.getSystemSettings();
      return settings.tossAccount || null;
    } catch (error) {
      console.error('토스페이먼츠 계좌 설정 조회 실패:', error);
      return null;
    }
  }

  // 수동 계좌이체 계좌 설정 조회
  static async getManualAccount(): Promise<{ bankName: string; accountNumber: string; accountHolder: string; isActive: boolean } | null> {
    try {
      const settings = await this.getSystemSettings();
      return settings.manualAccount || null;
    } catch (error) {
      console.error('수동 계좌이체 계좌 설정 조회 실패:', error);
      return null;
    }
  }

  // 수동 계좌이체 계좌 설정 업데이트
  static async updateManualAccount(
    bankName: string,
    accountNumber: string,
    accountHolder: string,
    isActive: boolean,
    adminId: string
  ): Promise<void> {
    try {
      if (!bankName || !accountNumber || !accountHolder) {
        throw new Error('은행명, 계좌번호, 예금주명을 모두 입력해주세요.');
      }

      const settingsRef = doc(db, 'systemSettings', this.SETTINGS_ID);
      await updateDoc(settingsRef, {
        manualAccount: {
          bankName,
          accountNumber,
          accountHolder,
          isActive
        },
        updatedAt: serverTimestamp(),
        updatedBy: adminId
      });

      console.log(`✅ 수동 계좌이체 계좌 설정이 업데이트되었습니다. (${bankName} ${accountNumber})`);
    } catch (error) {
      console.error('수동 계좌이체 계좌 설정 업데이트 실패:', error);
      throw new Error('수동 계좌이체 계좌 설정을 업데이트할 수 없습니다.');
    }
  }

  // 수수료 설정 업데이트
  static async updateFeeSettings(
    sellerCommissionRate: number,
    contractorCommissionRate: number,
    adminId: string
  ): Promise<void> {
    try {
      if (sellerCommissionRate < 0 || sellerCommissionRate > 100) {
        throw new Error('판매자 수수료율은 0%에서 100% 사이여야 합니다.');
      }
      if (contractorCommissionRate < 0 || contractorCommissionRate > 100) {
        throw new Error('시공자 수수료율은 0%에서 100% 사이여야 합니다.');
      }

      const settingsRef = doc(db, 'systemSettings', this.SETTINGS_ID);
      await updateDoc(settingsRef, {
        'feeSettings.sellerCommissionRate': sellerCommissionRate,
        'feeSettings.contractorCommissionRate': contractorCommissionRate,
        updatedAt: serverTimestamp(),
        updatedBy: adminId
      });

      console.log(`✅ 수수료 설정이 업데이트되었습니다. (판매자 수수료: ${sellerCommissionRate}%, 시공자 수수료: ${contractorCommissionRate}%)`);
    } catch (error) {
      console.error('수수료 설정 업데이트 실패:', error);
      throw new Error('수수료 설정을 업데이트할 수 없습니다.');
    }
  }

  // 수수료 설정 조회 (간편 메서드)
  static async getFeeSettings(): Promise<{ sellerCommissionRate: number; contractorCommissionRate: number }> {
    try {
      const settings = await this.getSystemSettings();
      return settings.feeSettings;
    } catch (error) {
      console.error('수수료 설정 조회 실패:', error);
      return this.DEFAULT_SETTINGS.feeSettings;
    }
  }

  // 토스페이먼츠 계좌 설정 테스트 (개발용)
  static async testTossAccountSettings(): Promise<void> {
    try {
      console.log('🧪 토스페이먼츠 계좌 설정 테스트 시작...');
      
      // 1. 전체 시스템 설정 조회
      console.log('📋 1단계: 전체 시스템 설정 조회 중...');
      const systemSettings = await this.getSystemSettings();
      console.log('📋 전체 시스템 설정:', systemSettings);
      console.log('📋 tossAccount 필드:', systemSettings.tossAccount);
      
      // 2. 현재 토스페이먼츠 계좌 설정만 조회
      console.log('📋 2단계: 토스페이먼츠 계좌 설정만 조회 중...');
      const currentSettings = await this.getTossAccount();
      console.log('📋 현재 토스페이먼츠 계좌 설정:', currentSettings);
      
      // 3. 테스트 데이터로 설정 업데이트
      const testData = {
        bankName: '테스트은행',
        accountNumber: '123-456-789012',
        accountHolder: '테스트예금주',
        isActive: true
      };
      
      console.log('💾 3단계: 테스트 데이터로 설정 업데이트 중...');
      console.log('💾 테스트 데이터:', testData);
      
      await this.updateTossAccount(
        testData.bankName,
        testData.accountNumber,
        testData.accountHolder,
        testData.isActive,
        'test_admin'
      );
      
      console.log('✅ 3단계 완료: 설정 업데이트 성공');
      
      // 4. 업데이트된 설정 조회
      console.log('📋 4단계: 업데이트된 설정 조회 중...');
      const updatedSettings = await this.getTossAccount();
      console.log('✅ 업데이트된 토스페이먼츠 계좌 설정:', updatedSettings);
      
      // 5. 전체 시스템 설정 다시 조회
      console.log('📋 5단계: 전체 시스템 설정 다시 조회 중...');
      const updatedSystemSettings = await this.getSystemSettings();
      console.log('📋 업데이트된 전체 시스템 설정:', updatedSystemSettings);
      console.log('📋 업데이트된 tossAccount 필드:', updatedSystemSettings.tossAccount);
      
      // 6. 설정 비교 (키 순서 무관하게 비교)
      console.log('🔍 6단계: 설정 비교 중...');
      console.log('🔍 원본 테스트 데이터:', testData);
      console.log('🔍 업데이트된 설정:', updatedSettings);
      
      // 키 순서를 무관하게 비교
      const isMatch = testData.bankName === updatedSettings?.bankName &&
                     testData.accountNumber === updatedSettings?.accountNumber &&
                     testData.accountHolder === updatedSettings?.accountHolder &&
                     testData.isActive === updatedSettings?.isActive;
      console.log('🔍 설정 일치 여부:', isMatch ? '✅ 성공' : '❌ 실패');
      
      if (isMatch) {
        console.log('🎉 토스페이먼츠 계좌 설정 테스트 성공!');
      } else {
        console.error('❌ 토스페이먼츠 계좌 설정 테스트 실패!');
        console.error('❌ 원인: 저장된 데이터와 테스트 데이터가 일치하지 않습니다.');
        console.error('❌ 차이점:', {
          testData,
          updatedSettings,
          bankNameMatch: testData.bankName === updatedSettings?.bankName,
          accountNumberMatch: testData.accountNumber === updatedSettings?.accountNumber,
          accountHolderMatch: testData.accountHolder === updatedSettings?.accountHolder,
          isActiveMatch: testData.isActive === updatedSettings?.isActive
        });
      }
      
    } catch (error) {
      console.error('❌ 토스페이먼츠 계좌 설정 테스트 중 오류 발생:', error);
      console.error('❌ 오류 상세 정보:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
  }

  // Firebase Firestore 직접 확인 (디버깅용)
  static async debugFirestoreData(): Promise<void> {
    try {
      console.log('🔍 Firebase Firestore 직접 확인 시작...');
      
      const settingsRef = doc(db, 'systemSettings', this.SETTINGS_ID);
      const settingsDoc = await getDoc(settingsRef);
      
      console.log('📋 문서 존재 여부:', settingsDoc.exists());
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        console.log('📋 Firestore 원본 데이터:', data);
        console.log('📋 tossAccount 필드:', data.tossAccount);
        console.log('📋 tossAccount 타입:', typeof data.tossAccount);
        console.log('📋 tossAccount 키들:', data.tossAccount ? Object.keys(data.tossAccount) : 'null');
      } else {
        console.log('📋 문서가 존재하지 않습니다.');
      }
      
    } catch (error) {
      console.error('❌ Firebase Firestore 확인 중 오류:', error);
    }
  }

  // 사용자 안내사항 설정 업데이트
  static async updateUserGuidanceSettings(
    contractorGuidance: { title: string; content: string; version: number },
    sellerGuidance: { title: string; content: string; version: number },
    adminId: string
  ): Promise<void> {
    try {
      const settingsRef = doc(db, 'systemSettings', this.SETTINGS_ID);
      
      await updateDoc(settingsRef, {
        'userGuidanceSettings.contractorGuidance': contractorGuidance,
        'userGuidanceSettings.sellerGuidance': sellerGuidance,
        updatedAt: serverTimestamp(),
        updatedBy: adminId
      });
      
      console.log('✅ 사용자 안내사항 설정 업데이트 완료');
    } catch (error) {
      console.error('사용자 안내사항 설정 업데이트 실패:', error);
      throw new Error('사용자 안내사항 설정을 업데이트할 수 없습니다.');
    }
  }
}
