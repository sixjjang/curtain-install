import { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firestore = getFirestore();

/**
 * 작업 수락 알림 관리를 위한 React Hook
 */
export const useJobAcceptanceNotifications = (userId) => {
  const [fcmTokens, setFcmTokens] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState({
    push: true,
    email: true,
    jobAccepted: true,
    jobCompleted: true,
    jobCancelled: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);

  // FCM 토큰 가져오기
  const getFCMToken = useCallback(async () => {
    try {
      const messaging = getMessaging();
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
        });
        
        if (token) {
          console.log('FCM Token obtained:', token);
          return token;
        }
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      setError('FCM 토큰을 가져오는데 실패했습니다.');
    }
    return null;
  }, []);

  // FCM 토큰 추가
  const addFCMToken = useCallback(async (token) => {
    if (!userId || !token) return false;

    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
        lastTokenUpdate: new Date()
      });
      
      console.log('FCM token added successfully');
      return true;
    } catch (error) {
      console.error('Error adding FCM token:', error);
      setError('FCM 토큰 추가에 실패했습니다.');
      return false;
    }
  }, [userId]);

  // FCM 토큰 제거
  const removeFCMToken = useCallback(async (token) => {
    if (!userId || !token) return false;

    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(token)
      });
      
      console.log('FCM token removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing FCM token:', error);
      setError('FCM 토큰 제거에 실패했습니다.');
      return false;
    }
  }, [userId]);

  // 알림 설정 업데이트
  const updateNotificationPreferences = useCallback(async (preferences) => {
    if (!userId) return false;

    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        notificationPreferences: preferences,
        lastPreferencesUpdate: new Date()
      });
      
      setNotificationPreferences(preferences);
      console.log('Notification preferences updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      setError('알림 설정 업데이트에 실패했습니다.');
      return false;
    }
  }, [userId]);

  // FCM 토큰 초기화 및 등록
  const initializeFCM = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const token = await getFCMToken();
      
      if (token) {
        const success = await addFCMToken(token);
        if (!success) {
          setError('FCM 토큰 등록에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('Error initializing FCM:', error);
      setError('FCM 초기화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId, getFCMToken, addFCMToken]);

  // 사용자 알림 설정 실시간 감시
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(firestore, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setFcmTokens(userData.fcmTokens || []);
        setNotificationPreferences(userData.notificationPreferences || {
          push: true,
          email: true,
          jobAccepted: true,
          jobCompleted: true,
          jobCancelled: true
        });
      }
    }, (error) => {
      console.error('Error listening to user notifications:', error);
      setError('알림 설정을 불러오는데 실패했습니다.');
    });

    return () => unsubscribe();
  }, [userId]);

  // FCM 포그라운드 메시지 처리
  useEffect(() => {
    const messaging = getMessaging();
    
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // 작업 수락 알림 처리
      if (payload.data?.type === 'job_accepted') {
        const notificationData = {
          type: 'job_accepted',
          jobId: payload.data.jobId,
          jobName: payload.data.jobName,
          contractorName: payload.data.contractorName,
          timestamp: new Date().toISOString(),
          title: payload.notification?.title || '작업 수락 알림',
          body: payload.notification?.body || '작업이 수락되었습니다.'
        };
        
        setLastNotification(notificationData);
        
        // 브라우저 알림 표시
        if (Notification.permission === 'granted') {
          new Notification(notificationData.title, {
            body: notificationData.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `job_accepted_${payload.data.jobId}`,
            data: notificationData
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 알림 로그 조회
  const getNotificationLogs = useCallback(async (limit = 50) => {
    if (!userId) return [];

    try {
      const { collection, query, where, orderBy, limit: queryLimit, getDocs } = await import('firebase/firestore');
      
      const logsRef = collection(firestore, 'notificationLogs');
      const q = query(
        logsRef,
        where('targetUserId', '==', userId),
        where('type', '==', 'job_accepted'),
        orderBy('timestamp', 'desc'),
        queryLimit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      return [];
    }
  }, [userId]);

  // 알림 통계 조회
  const getNotificationStats = useCallback(async () => {
    if (!userId) return null;

    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const logsRef = collection(firestore, 'notificationLogs');
      const q = query(
        logsRef,
        where('targetUserId', '==', userId),
        where('type', '==', 'job_accepted')
      );
      
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => doc.data());
      
      const stats = {
        total: logs.length,
        success: logs.filter(log => log.status === 'success').length,
        failed: logs.filter(log => log.status === 'failed').length,
        partial: logs.filter(log => log.status === 'partial').length,
        error: logs.filter(log => log.status === 'error').length
      };
      
      stats.successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;
      
      return stats;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return null;
    }
  }, [userId]);

  return {
    // 상태
    fcmTokens,
    notificationPreferences,
    loading,
    error,
    lastNotification,
    
    // 메서드
    initializeFCM,
    addFCMToken,
    removeFCMToken,
    updateNotificationPreferences,
    getNotificationLogs,
    getNotificationStats,
    
    // 유틸리티
    hasValidTokens: fcmTokens.length > 0,
    isNotificationsEnabled: notificationPreferences.push && notificationPreferences.jobAccepted
  };
}; 