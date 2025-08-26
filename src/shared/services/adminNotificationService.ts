import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

export interface AdminNotificationData {
  manualChargeRequests: number;
  pointWithdrawals: number;
  totalNewRequests: number;
}

export class AdminNotificationService {
  // 새로운 수동 충전 요청 개수 조회
  static async getNewManualChargeRequests(): Promise<number> {
    try {
      const requestsRef = collection(db, 'manualChargeRequests');
      const q = query(
        requestsRef,
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('새로운 수동 충전 요청 조회 실패:', error);
      return 0;
    }
  }

  // 새로운 포인트 인출 요청 개수 조회
  static async getNewPointWithdrawals(): Promise<number> {
    try {
      const withdrawalsRef = collection(db, 'pointWithdrawals');
      const q = query(
        withdrawalsRef,
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('새로운 포인트 인출 요청 조회 실패:', error);
      return 0;
    }
  }

  // 모든 새로운 요청건 조회
  static async getNewRequestsCount(): Promise<AdminNotificationData> {
    try {
      const [manualChargeCount, withdrawalCount] = await Promise.all([
        this.getNewManualChargeRequests(),
        this.getNewPointWithdrawals()
      ]);

      return {
        manualChargeRequests: manualChargeCount,
        pointWithdrawals: withdrawalCount,
        totalNewRequests: manualChargeCount + withdrawalCount
      };
    } catch (error) {
      console.error('새로운 요청건 조회 실패:', error);
      return {
        manualChargeRequests: 0,
        pointWithdrawals: 0,
        totalNewRequests: 0
      };
    }
  }

  // 실시간 알림 확인 (주기적으로 호출)
  static async checkForNewNotifications(): Promise<AdminNotificationData> {
    return this.getNewRequestsCount();
  }
}
