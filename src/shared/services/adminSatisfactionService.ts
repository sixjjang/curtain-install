import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { ChatService } from './chatService';
import { SatisfactionService } from './satisfactionService';
import { JobService } from './jobService';

export interface SatisfactionNotification {
  id: string;
  jobId: string;
  sellerId: string;
  contractorId: string;
  surveyId: string;
  surveyLink: string;
  message: string;
  isSent: boolean;
  sentAt?: Date;
  createdAt: Date;
}

export class AdminSatisfactionService {
  // 시공 완료 후 만족도 조사 알림 생성
  static async createSatisfactionNotification(jobId: string): Promise<string> {
    try {
      // 작업 정보 조회
      const job = await JobService.getJob(jobId);
      if (!job) {
        throw new Error('작업을 찾을 수 없습니다.');
      }

      if (job.status !== 'completed') {
        throw new Error('완료된 작업만 만족도 조사를 생성할 수 있습니다.');
      }

      // 만족도 조사 생성
      const surveyId = await SatisfactionService.createSurvey(
        jobId,
        job.customerId || '',
        job.contractorId || ''
      );

      // 만족도 조사 링크 생성
      const surveyLink = SatisfactionService.generateSurveyLink(surveyId);

      // 판매자에게 보낼 메시지 생성
      const message = `안녕하세요! 

시공이 완료되었습니다. 

고객님께 만족도 조사 링크를 전달해 주세요:

${surveyLink}

고객님이 만족도 조사를 완료하면 시공자의 평점에 반영됩니다.

감사합니다.`;

      // 알림 데이터 생성
      const notificationData = {
        jobId,
        sellerId: job.sellerId,
        contractorId: job.contractorId || '',
        surveyId,
        surveyLink,
        message,
        isSent: false,
        createdAt: serverTimestamp()
      };

      const notificationRef = await addDoc(
        collection(db, 'satisfactionNotifications'), 
        notificationData
      );

      return notificationRef.id;
    } catch (error) {
      console.error('만족도 조사 알림 생성 실패:', error);
      throw new Error('만족도 조사 알림을 생성할 수 없습니다.');
    }
  }

  // 판매자에게 만족도 조사 링크 채팅 전송
  static async sendSatisfactionMessageToSeller(notificationId: string): Promise<void> {
    try {
      // 알림 정보 조회
      const notificationRef = doc(db, 'satisfactionNotifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        throw new Error('알림을 찾을 수 없습니다.');
      }

      const notification = notificationDoc.data() as SatisfactionNotification;

      // 작업 정보 조회
      const job = await JobService.getJob(notification.jobId);
      if (!job) {
        throw new Error('작업을 찾을 수 없습니다.');
      }

      // 판매자와 관리자 간 채팅방 생성 또는 가져오기
      const chatRoomId = await ChatService.getOrCreateChatRoom(
        notification.jobId,
        [
          { id: 'admin', type: 'seller', name: '관리자' },
          { id: notification.sellerId, type: 'seller', name: job.sellerName || '판매자' }
        ]
      );

      // 관리자 메시지 전송
      await ChatService.sendMessage(
        chatRoomId,
        notification.jobId,
        'admin',
        'seller',
        '관리자',
        notification.message
      );

      // 알림 상태 업데이트
      await updateDoc(notificationRef, {
        isSent: true,
        sentAt: serverTimestamp()
      });

      console.log('판매자에게 만족도 조사 링크 전송 완료');
    } catch (error) {
      console.error('판매자에게 만족도 조사 링크 전송 실패:', error);
      throw new Error('판매자에게 만족도 조사 링크를 전송할 수 없습니다.');
    }
  }

  // 만족도 조사 알림 목록 조회
  static async getSatisfactionNotifications(): Promise<SatisfactionNotification[]> {
    try {
      const notificationsRef = collection(db, 'satisfactionNotifications');
      const querySnapshot = await getDocs(notificationsRef);
      
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        sentAt: doc.data().sentAt?.toDate()
      })) as SatisfactionNotification[];
      
      // 클라이언트에서 생성일 기준 내림차순 정렬
      return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('만족도 조사 알림 목록 조회 실패:', error);
      throw new Error('만족도 조사 알림 목록을 불러올 수 없습니다.');
    }
  }

  // 작업별 만족도 조사 알림 조회
  static async getSatisfactionNotificationByJobId(jobId: string): Promise<SatisfactionNotification | null> {
    try {
      const notificationsRef = collection(db, 'satisfactionNotifications');
      const q = query(notificationsRef, where('jobId', '==', jobId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          sentAt: doc.data().sentAt?.toDate()
        } as SatisfactionNotification;
      }
      
      return null;
    } catch (error) {
      console.error('작업별 만족도 조사 알림 조회 실패:', error);
      throw new Error('만족도 조사 알림을 불러올 수 없습니다.');
    }
  }

  // 만족도 조사 통계 조회 (관리자용)
  static async getSatisfactionStats(): Promise<{
    totalNotifications: number;
    sentNotifications: number;
    responseRate: number;
    averageRating: number;
  }> {
    try {
      const notificationsRef = collection(db, 'satisfactionNotifications');
      const querySnapshot = await getDocs(notificationsRef);
      
      const totalNotifications = querySnapshot.size;
      const sentNotifications = querySnapshot.docs.filter(
        doc => doc.data().isSent
      ).length;

      // 전체 만족도 조사 통계 조회
      const surveyStats = await SatisfactionService.getSurveyStats();
      
      return {
        totalNotifications,
        sentNotifications,
        responseRate: totalNotifications > 0 ? (sentNotifications / totalNotifications) * 100 : 0,
        averageRating: surveyStats.averageRating
      };
    } catch (error) {
      console.error('만족도 조사 통계 조회 실패:', error);
      return {
        totalNotifications: 0,
        sentNotifications: 0,
        responseRate: 0,
        averageRating: 0
      };
    }
  }
}
