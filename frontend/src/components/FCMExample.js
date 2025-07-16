import React, { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';
import app from '../firebase/firebase';
import useFCMToken from '../hooks/useFCMToken';

const messaging = getMessaging(app);
const auth = getAuth();

const FCMExample = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [permission, setPermission] = useState(Notification.permission);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  
  // FCM 토큰 관리 훅 사용
  const {
    token: managedToken,
    loading: tokenLoading,
    error: tokenError,
    permission: managedPermission,
    saveToken,
    deleteToken,
    validateToken,
    getToken,
    requestPermission,
    setFCMToken,
    clearError
  } = useFCMToken();

  // FCM 토큰 요청
  const requestFCMToken = async () => {
    try {
      setLoading(true);
      
      // VAPID 키는 환경변수에서 가져오거나 실제 값으로 교체하세요
      const vapidKey = process.env.REACT_APP_FCM_VAPID_KEY || "YOUR_WEB_PUSH_CERTIFICATE_KEY_PAIR";
      
      const currentToken = await getToken(messaging, { vapidKey });
      
      if (currentToken) {
        console.log("FCM Token:", currentToken);
        setFcmToken(currentToken);
        setFCMToken(currentToken); // 훅의 토큰도 설정
        
        // 현재 로그인된 사용자가 있으면 토큰 저장
        const user = auth.currentUser;
        if (user) {
          await saveToken(currentToken);
        }
        
        return currentToken;
      } else {
        console.log('FCM 토큰을 받을 권한이 없습니다.');
        return null;
      }
    } catch (error) {
      console.error('FCM 토큰 요청 실패:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 알림 권한 요청
  const requestNotificationPermission = async () => {
    try {
      setLoading(true);
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        console.log('알림 권한이 허용되었습니다.');
        await requestFCMToken();
      } else if (permission === 'denied') {
        console.log('알림 권한이 거부되었습니다.');
        alert('알림을 받으려면 브라우저 설정에서 알림 권한을 허용해주세요.');
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 포그라운드 메시지 처리
  const handleForegroundMessage = (payload) => {
    console.log('FCM 포그라운드 메시지 수신:', payload);
    
    // 메시지 목록에 추가
    setMessages(prev => [...prev, {
      id: Date.now(),
      title: payload.notification?.title || '알림',
      body: payload.notification?.body || '새로운 알림이 있습니다.',
      data: payload.data || {},
      timestamp: new Date()
    }]);
    
    // 커스텀 알림 표시
    showCustomNotification(payload);
  };

  // 커스텀 알림 표시
  const showCustomNotification = (payload) => {
    try {
      const { notification, data } = payload;
      
      // 브라우저 알림 API 사용
      if ('Notification' in window && Notification.permission === 'granted') {
        const notificationOptions = {
          body: notification?.body || '새로운 알림이 있습니다.',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: data?.tag || 'default',
          requireInteraction: data?.requireInteraction || false,
          data: {
            ...data,
            timestamp: Date.now()
          }
        };

        // 커스텀 아이콘이 있는 경우 사용
        if (data?.icon) {
          notificationOptions.icon = data.icon;
        }

        const browserNotification = new Notification(
          notification?.title || '커튼 설치 매칭',
          notificationOptions
        );

        // 알림 클릭 이벤트 처리
        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
          
          // 클릭 액션이 있는 경우 해당 페이지로 이동
          if (data?.click_action) {
            window.location.href = data.click_action;
          }
        };

        // 알림 자동 닫기 (5초 후)
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      } else {
        // 알림 권한이 없는 경우 alert로 대체
        alert(`알림: ${notification?.title}\n${notification?.body}`);
      }
    } catch (error) {
      console.error('커스텀 알림 표시 실패:', error);
      // 폴백으로 alert 사용
      alert(`알림: ${payload.notification?.title}\n${payload.notification?.body}`);
    }
  };

  // 토큰 유효성 검증
  const validateCurrentToken = async () => {
    if (!fcmToken) {
      alert('먼저 FCM 토큰을 요청해주세요.');
      return;
    }
    
    try {
      const result = await validateToken(fcmToken);
      alert(`토큰 유효성 검증 성공: ${result.message}`);
    } catch (error) {
      alert(`토큰 유효성 검증 실패: ${error.message}`);
    }
  };

  // 토큰 삭제
  const deleteCurrentToken = async () => {
    try {
      await deleteToken();
      setFcmToken(null);
      alert('FCM 토큰이 삭제되었습니다.');
    } catch (error) {
      alert(`토큰 삭제 실패: ${error.message}`);
    }
  };

  // 메시지 삭제
  const deleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  useEffect(() => {
    // 컴포넌트 마운트 시 FCM 초기화
    const initializeFCM = async () => {
      // 알림 권한 확인
      if (Notification.permission === 'default') {
        // 권한을 아직 요청하지 않은 경우
        console.log('알림 권한을 요청합니다.');
        await requestNotificationPermission();
      } else if (Notification.permission === 'granted') {
        // 권한이 이미 허용된 경우
        console.log('알림 권한이 이미 허용되어 있습니다.');
        await requestFCMToken();
      } else {
        // 권한이 거부된 경우
        console.log('알림 권한이 거부되어 있습니다.');
        setPermission('denied');
      }
    };

    initializeFCM();

    // 포그라운드 메시지 리스너 등록
    const unsubscribe = onMessage(messaging, handleForegroundMessage);

    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">FCM 테스트 예제</h2>
      
      {/* 상태 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">FCM 상태</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">권한:</span> {permission}</p>
            <p><span className="font-medium">토큰:</span> {fcmToken ? '있음' : '없음'}</p>
            <p><span className="font-medium">로딩:</span> {loading ? '중' : '완료'}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">훅 상태</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">관리 토큰:</span> {managedToken ? '있음' : '없음'}</p>
            <p><span className="font-medium">훅 권한:</span> {managedPermission}</p>
            <p><span className="font-medium">훅 로딩:</span> {tokenLoading ? '중' : '완료'}</p>
            {tokenError && (
              <p className="text-red-600"><span className="font-medium">에러:</span> {tokenError}</p>
            )}
          </div>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={requestNotificationPermission}
          disabled={loading || permission === 'granted'}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          권한 요청
        </button>
        
        <button
          onClick={requestFCMToken}
          disabled={loading || permission !== 'granted'}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          토큰 요청
        </button>
        
        <button
          onClick={validateCurrentToken}
          disabled={!fcmToken || tokenLoading}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          토큰 검증
        </button>
        
        <button
          onClick={deleteCurrentToken}
          disabled={!fcmToken || tokenLoading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          토큰 삭제
        </button>
      </div>

      {/* 토큰 정보 */}
      {fcmToken && (
        <div className="bg-blue-50 p-4 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">FCM 토큰</h3>
          <div className="bg-white p-3 rounded border">
            <p className="text-xs font-mono break-all text-gray-700">{fcmToken}</p>
          </div>
        </div>
      )}

      {/* 수신된 메시지들 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          수신된 메시지 ({messages.length})
        </h3>
        
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">아직 수신된 메시지가 없습니다.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="bg-white p-4 rounded border">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800">{message.title}</h4>
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    삭제
                  </button>
                </div>
                <p className="text-gray-600 mb-2">{message.body}</p>
                <div className="text-xs text-gray-500">
                  <p>시간: {message.timestamp.toLocaleString()}</p>
                  {Object.keys(message.data).length > 0 && (
                    <p>데이터: {JSON.stringify(message.data)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 에러 표시 */}
      {tokenError && (
        <div className="mt-6 bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-red-800">에러</h3>
          <p className="text-red-600">{tokenError}</p>
          <button
            onClick={clearError}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            에러 초기화
          </button>
        </div>
      )}
    </div>
  );
};

export default FCMExample; 