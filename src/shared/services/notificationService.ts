import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Notification } from '../../types';

export class NotificationService {
  // 알림 생성
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error',
    actionUrl?: string
  ): Promise<string> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const newNotification = {
        userId,
        title,
        message,
        type,
        isRead: false,
        actionUrl,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(notificationsRef, newNotification);
      return docRef.id;
    } catch (error) {
      console.error('알림 생성 실패:', error);
      throw error;
    }
  }

  // 채팅 메시지 알림 생성
  static async createChatNotification(
    jobId: string,
    senderId: string,
    senderName: string,
    message: string,
    recipientId: string
  ): Promise<void> {
    try {
      const title = '새로운 채팅 메시지';
      const notificationMessage = `${senderName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`;
      const actionUrl = `/seller/chat/${jobId}`;
      
      await this.createNotification(
        recipientId,
        title,
        notificationMessage,
        'info',
        actionUrl
      );
    } catch (error) {
      console.error('채팅 알림 생성 실패:', error);
    }
  }

  // 사용자의 알림 목록 가져오기
  static async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef, 
        where('userId', '==', userId)
        // orderBy 제거하여 인덱스 오류 해결
      );
      
      const querySnapshot = await getDocs(q);
      const notifications: Notification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          isRead: data.isRead,
          actionUrl: data.actionUrl,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      
      // 클라이언트에서 정렬
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return notifications;
    } catch (error) {
      console.error('알림 목록 가져오기 실패:', error);
      throw error;
    }
  }

  // 알림 읽음 처리
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true
      });
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      throw error;
    }
  }

  // 모든 알림 읽음 처리
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef, 
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
      throw error;
    }
  }

  // 읽지 않은 알림 개수 가져오기
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef, 
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('읽지 않은 알림 개수 가져오기 실패:', error);
      return 0;
    }
  }

  // 실시간 알림 구독
  static subscribeToNotifications(
    userId: string, 
    callback: (notifications: Notification[]) => void
  ): () => void {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef, 
      where('userId', '==', userId)
      // orderBy 제거하여 인덱스 없이도 작동
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          isRead: data.isRead,
          actionUrl: data.actionUrl,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      
      // 클라이언트에서 정렬
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      callback(notifications);
    });
    
    return unsubscribe;
  }

  // 실시간 읽지 않은 알림 개수 구독
  static subscribeToUnreadCount(
    userId: string, 
    callback: (count: number) => void
  ): () => void {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef, 
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      callback(querySnapshot.size);
    });
    
    return unsubscribe;
  }
}
