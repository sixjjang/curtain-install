import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import app from '../firebase/firebase';

const functions = getFunctions(app);
const auth = getAuth();

export const useFCMToken = () => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(Notification.permission);

  // FCM 토큰 저장
  const saveToken = useCallback(async (fcmToken) => {
    try {
      setLoading(true);
      setError(null);

      const saveFCMTokenFunction = httpsCallable(functions, 'saveFCMToken');
      const result = await saveFCMTokenFunction({ token: fcmToken });
      
      console.log('FCM 토큰 저장 성공:', result.data);
      return result.data;
    } catch (error) {
      console.error('FCM 토큰 저장 실패:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // FCM 토큰 삭제
  const deleteToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const deleteFCMTokenFunction = httpsCallable(functions, 'deleteFCMToken');
      const result = await deleteFCMTokenFunction();
      
      console.log('FCM 토큰 삭제 성공:', result.data);
      setToken(null);
      return result.data;
    } catch (error) {
      console.error('FCM 토큰 삭제 실패:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // FCM 토큰 유효성 검증
  const validateToken = useCallback(async (fcmToken) => {
    try {
      setLoading(true);
      setError(null);

      const validateFCMTokenFunction = httpsCallable(functions, 'validateFCMToken');
      const result = await validateFCMTokenFunction({ token: fcmToken });
      
      console.log('FCM 토큰 유효성 검증 성공:', result.data);
      return result.data;
    } catch (error) {
      console.error('FCM 토큰 유효성 검증 실패:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 사용자별 FCM 토큰 조회
  const getToken = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const getFCMTokenFunction = httpsCallable(functions, 'getFCMToken');
      const result = await getFCMTokenFunction({ userId });
      
      console.log('FCM 토큰 조회 성공:', result.data);
      return result.data;
    } catch (error) {
      console.error('FCM 토큰 조회 실패:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 알림 권한 요청
  const requestPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        console.log('알림 권한이 허용되었습니다.');
        return { success: true, permission };
      } else if (permission === 'denied') {
        console.log('알림 권한이 거부되었습니다.');
        return { success: false, permission, message: '알림 권한이 거부되었습니다.' };
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 토큰 설정
  const setFCMToken = useCallback((fcmToken) => {
    setToken(fcmToken);
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 사용자 로그인 상태 변경 감지
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && token) {
        // 사용자가 로그인하고 토큰이 있는 경우 서버에 저장
        try {
          await saveToken(token);
        } catch (error) {
          console.error('로그인 시 토큰 저장 실패:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [token, saveToken]);

  return {
    // 상태
    token,
    loading,
    error,
    permission,
    
    // 액션
    saveToken,
    deleteToken,
    validateToken,
    getToken,
    requestPermission,
    setFCMToken,
    clearError
  };
};

export default useFCMToken; 