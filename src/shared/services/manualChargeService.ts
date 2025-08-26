import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ManualChargeRequest, AdminNotification } from '../../types';

export class ManualChargeService {
  // 수동 계좌이체 충전 요청 생성
  static async createChargeRequest(
    userId: string,
    userName: string,
    userPhone: string,
    amount: number
  ): Promise<ManualChargeRequest> {
    try {
      const chargeRequestData = {
        userId,
        userName,
        userPhone,
        amount,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'manualChargeRequests'), chargeRequestData);
      
      // 관리자에게 알림 발송
      await this.sendAdminNotification({
        type: 'manual_charge_request',
        title: '수동 계좌이체 충전 요청',
        message: `${userName}님이 ${amount.toLocaleString()}원 충전을 요청했습니다.`,
        data: {
          chargeRequestId: docRef.id,
          userId,
          userName,
          userPhone,
          amount
        }
      });

      return {
        id: docRef.id,
        ...chargeRequestData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as ManualChargeRequest;
    } catch (error) {
      console.error('수동 계좌이체 충전 요청 생성 실패:', error);
      throw new Error('충전 요청 생성에 실패했습니다.');
    }
  }

  // 관리자 알림 발송
  static async sendAdminNotification(notification: Omit<AdminNotification, 'id' | 'isRead' | 'createdAt'>): Promise<void> {
    try {
      const notificationData = {
        ...notification,
        isRead: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'adminNotifications'), notificationData);
    } catch (error) {
      console.error('관리자 알림 발송 실패:', error);
    }
  }

  // 사용자의 충전 요청 목록 조회
  static async getUserChargeRequests(userId: string): Promise<ManualChargeRequest[]> {
    try {
      const q = query(
        collection(db, 'manualChargeRequests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const requests: ManualChargeRequest[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate(),
          depositDate: data.depositDate ? (data.depositDate as Timestamp).toDate() : undefined,
          completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined
        } as ManualChargeRequest);
      });

      return requests;
    } catch (error) {
      console.error('사용자 충전 요청 조회 실패:', error);
      throw new Error('충전 요청 조회에 실패했습니다.');
    }
  }

  // 관리자용: 모든 충전 요청 목록 조회
  static async getAllChargeRequests(): Promise<ManualChargeRequest[]> {
    try {
      const q = query(
        collection(db, 'manualChargeRequests'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const requests: ManualChargeRequest[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate(),
          depositDate: data.depositDate ? (data.depositDate as Timestamp).toDate() : undefined,
          completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined
        } as ManualChargeRequest);
      });

      return requests;
    } catch (error) {
      console.error('모든 충전 요청 조회 실패:', error);
      throw new Error('충전 요청 조회에 실패했습니다.');
    }
  }

  // 관리자용: 충전 요청 완료 처리
  static async completeChargeRequest(
    requestId: string,
    adminId: string,
    depositName: string,
    depositAmount: number,
    depositDate: Date,
    adminNote?: string
  ): Promise<void> {
    try {
      const requestRef = doc(db, 'manualChargeRequests', requestId);
      
      await updateDoc(requestRef, {
        status: 'completed',
        depositName,
        depositAmount,
        depositDate: Timestamp.fromDate(depositDate),
        adminNote,
        completedAt: serverTimestamp(),
        completedBy: adminId,
        updatedAt: serverTimestamp()
      });

             // 포인트 지급 처리
       const { PointService } = await import('./pointService');
       const request = await this.getChargeRequestById(requestId);
       if (request) {
         await PointService.chargePoints(
           request.userId,
           'seller',
           depositAmount
         );
       }
    } catch (error) {
      console.error('충전 요청 완료 처리 실패:', error);
      throw new Error('충전 요청 완료 처리에 실패했습니다.');
    }
  }

  // 충전 요청 취소
  static async cancelChargeRequest(requestId: string, adminId: string, reason?: string): Promise<void> {
    try {
      const requestRef = doc(db, 'manualChargeRequests', requestId);
      
      await updateDoc(requestRef, {
        status: 'cancelled',
        adminNote: reason || '관리자에 의해 취소됨',
        completedAt: serverTimestamp(),
        completedBy: adminId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('충전 요청 취소 실패:', error);
      throw new Error('충전 요청 취소에 실패했습니다.');
    }
  }

  // 충전 요청 상세 조회
  static async getChargeRequestById(requestId: string): Promise<ManualChargeRequest | null> {
    try {
      const q = query(
        collection(db, 'manualChargeRequests'),
        where('__name__', '==', requestId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        depositDate: data.depositDate ? (data.depositDate as Timestamp).toDate() : undefined,
        completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined
      } as ManualChargeRequest;
    } catch (error) {
      console.error('충전 요청 상세 조회 실패:', error);
      throw new Error('충전 요청 조회에 실패했습니다.');
    }
  }

  // 관리자 알림 목록 조회
  static async getAdminNotifications(): Promise<AdminNotification[]> {
    try {
      const q = query(
        collection(db, 'adminNotifications'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notifications: AdminNotification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate(),
          readAt: data.readAt ? (data.readAt as Timestamp).toDate() : undefined
        } as AdminNotification);
      });

      return notifications;
    } catch (error) {
      console.error('관리자 알림 조회 실패:', error);
      throw new Error('알림 조회에 실패했습니다.');
    }
  }

  // 관리자 알림 읽음 처리
  static async markNotificationAsRead(notificationId: string, adminId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'adminNotifications', notificationId);
      
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp(),
        readBy: adminId
      });
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      throw new Error('알림 읽음 처리에 실패했습니다.');
    }
  }
}
