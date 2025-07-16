import messaging from '@react-native-firebase/messaging';
import { useEffect, useState, useCallback } from 'react';
import { getFirestore, doc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from "firebase/firestore";
import { Alert, Platform } from 'react-native';

const firestore = getFirestore();

/**
 * React Native 판매자 FCM 토큰 관리 Hook
 * 다중 토큰 지원, 알림 설정, 실시간 업데이트 포함
 */
function useRegisterSellerFCM(userId) {
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

  // 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        return true;
      } else {
        console.log('Notification permission denied');
        setError('알림 권한이 거부되었습니다.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setError('알림 권한 요청 중 오류가 발생했습니다.');
      return false;
    }
  }, []);

  // FCM 토큰 가져오기
  const getFCMToken = useCallback(async () => {
    try {
      const token = await messaging().getToken();
      if (token) {
        console.log('FCM Token obtained:', token);
        return token;
      } else {
        console.log('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      setError('FCM 토큰을 가져오는데 실패했습니다.');
      return null;
    }
  }, []);

  // FCM 토큰 추가
  const addFCMToken = useCallback(async (token) => {
    if (!userId || !token) return false;

    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
        lastTokenUpdate: new Date(),
        platform: Platform.OS,
        appVersion: Platform.Version
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

  // FCM 초기화
  const initializeFCM = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. 알림 권한 요청
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setLoading(false);
        return;
      }

      // 2. FCM 토큰 가져오기
      const token = await getFCMToken();
      if (token) {
        // 3. 토큰 추가
        const success = await addFCMToken(token);
        if (!success) {
          setError('FCM 토큰 등록에 실패했습니다.');
        }
      }

      // 4. 토큰 갱신 리스너 설정
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
        console.log('FCM token refreshed:', token);
        addFCMToken(token);
      });

      return unsubscribeTokenRefresh;
    } catch (error) {
      console.error('Error initializing FCM:', error);
      setError('FCM 초기화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId, requestNotificationPermission, getFCMToken, addFCMToken]);

  // 포그라운드 메시지 처리
  const handleForegroundMessage = useCallback(async (remoteMessage) => {
    console.log('Foreground message received:', remoteMessage);
    
    // 작업 수락 알림 처리
    if (remoteMessage.data?.type === 'job_accepted') {
      const notificationData = {
        type: 'job_accepted',
        jobId: remoteMessage.data.jobId,
        jobName: remoteMessage.data.jobName,
        contractorName: remoteMessage.data.contractorName,
        timestamp: new Date().toISOString(),
        title: remoteMessage.notification?.title || '작업 수락 알림',
        body: remoteMessage.notification?.body || '작업이 수락되었습니다.'
      };
      
      setLastNotification(notificationData);
      
      // 알림 표시 (React Native Alert 또는 로컬 알림)
      Alert.alert(
        notificationData.title,
        notificationData.body,
        [
          {
            text: '확인',
            onPress: () => console.log('Notification acknowledged')
          },
          {
            text: '상세보기',
            onPress: () => {
              // 작업 상세 페이지로 이동하는 로직
              console.log('Navigate to job details:', notificationData.jobId);
            }
          }
        ]
      );
    }
  }, []);

  // 백그라운드 메시지 처리
  const handleBackgroundMessage = useCallback(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage);
    
    // 백그라운드에서 받은 메시지 처리
    // 주로 로컬 알림을 표시하거나 데이터를 저장
    if (remoteMessage.data?.type === 'job_accepted') {
      // 로컬 알림 표시 로직
      console.log('Background job accepted notification:', remoteMessage.data);
    }
  }, []);

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

  // FCM 초기화 및 메시지 리스너 설정
  useEffect(() => {
    let unsubscribeTokenRefresh;
    let unsubscribeForeground;
    let unsubscribeBackground;

    const setupFCM = async () => {
      if (!userId) return;

      // FCM 초기화
      unsubscribeTokenRefresh = await initializeFCM();

      // 포그라운드 메시지 리스너
      unsubscribeForeground = messaging().onMessage(handleForegroundMessage);

      // 백그라운드 메시지 리스너 (앱이 백그라운드에 있을 때)
      unsubscribeBackground = messaging().setBackgroundMessageHandler(handleBackgroundMessage);
    };

    setupFCM();

    return () => {
      if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
      if (unsubscribeForeground) unsubscribeForeground();
      if (unsubscribeBackground) unsubscribeBackground();
    };
  }, [userId, initializeFCM, handleForegroundMessage, handleBackgroundMessage]);

  // 앱 시작 시 알림 권한 확인
  useEffect(() => {
    const checkInitialPermission = async () => {
      try {
        const authStatus = await messaging().hasPermission();
        console.log('Initial notification permission status:', authStatus);
        
        if (authStatus === messaging.AuthorizationStatus.DENIED) {
          setError('알림 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
        }
      } catch (error) {
        console.error('Error checking initial permission:', error);
      }
    };

    checkInitialPermission();
  }, []);

  // 알림 로그 조회 (선택사항)
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

  // 알림 통계 조회 (선택사항)
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
    requestNotificationPermission,
    getNotificationLogs,
    getNotificationStats,
    
    // 유틸리티
    hasValidTokens: fcmTokens.length > 0,
    isNotificationsEnabled: notificationPreferences.push && notificationPreferences.jobAccepted,
    platform: Platform.OS
  };
}

export default useRegisterSellerFCM; 