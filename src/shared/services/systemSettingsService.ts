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
}
