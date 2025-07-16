import { useEffect, useState } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import app from "../firebase/firebase";

const messaging = getMessaging(app);
const auth = getAuth();
const firestore = getFirestore();

const FcmHandler = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [permission, setPermission] = useState(Notification.permission);
  const [loading, setLoading] = useState(false);

  // 알림 권한 요청
  const requestNotificationPermission = async () => {
    try {
      setLoading(true);
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        console.log('알림 권한이 허용되었습니다.');
        await getFCMToken();
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

  // FCM 토큰 가져오기
  const getFCMToken = async () => {
    try {
      setLoading(true);
      
      // VAPID 키는 환경변수에서 가져오거나 실제 값으로 교체하세요
      const vapidKey = process.env.REACT_APP_FCM_VAPID_KEY || "YOUR_WEB_PUSH_CERTIFICATE_KEY_PAIR";
      
      const currentToken = await getToken(messaging, { vapidKey });
      
      if (currentToken) {
        console.log("FCM Token:", currentToken);
        setFcmToken(currentToken);
        
        // 현재 로그인된 사용자가 있으면 토큰 저장
        const user = auth.currentUser;
        if (user) {
          await saveTokenToServer(currentToken, user.uid);
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

  // 서버에 토큰 저장
  const saveTokenToServer = async (token, userId) => {
    try {
      // Firestore에 토큰 저장
      await setDoc(doc(firestore, 'users', userId), {
        fcmToken: token,
        lastTokenUpdate: new Date(),
        platform: 'web'
      }, { merge: true });
      
      console.log('FCM 토큰이 서버에 저장되었습니다.');
      
      // Firebase Functions를 통한 토큰 저장 (선택사항)
      // await saveTokenToFirebaseFunctions(token, userId);
      
    } catch (error) {
      console.error('FCM 토큰 저장 실패:', error);
    }
  };

  // Firebase Functions를 통한 토큰 저장 (선택사항)
  const saveTokenToFirebaseFunctions = async (token, userId) => {
    try {
      const response = await fetch('/api/saveFCMToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, userId }),
      });
      
      if (response.ok) {
        console.log('FCM 토큰이 Firebase Functions를 통해 저장되었습니다.');
      } else {
        console.error('FCM 토큰 저장 API 호출 실패');
      }
    } catch (error) {
      console.error('FCM 토큰 저장 API 오류:', error);
    }
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

  // 포그라운드 메시지 처리
  const handleForegroundMessage = (payload) => {
    console.log('FCM 포그라운드 메시지 수신:', payload);
    
    // 커스텀 알림 표시
    showCustomNotification(payload);
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
        await getFCMToken();
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

  // 사용자 로그인 상태 변경 감지
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && fcmToken) {
        // 사용자가 로그인하고 FCM 토큰이 있는 경우 토큰 저장
        await saveTokenToServer(fcmToken, user.uid);
      }
    });

    return () => unsubscribe();
  }, [fcmToken]);

  // 개발자 정보 표시 (개발 모드에서만)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg text-sm max-w-xs">
        <h4 className="font-semibold mb-2">FCM 상태</h4>
        <div className="space-y-1">
          <p>• 권한: {permission}</p>
          <p>• 토큰: {fcmToken ? '있음' : '없음'}</p>
          <p>• 로딩: {loading ? '중' : '완료'}</p>
        </div>
        {permission === 'denied' && (
          <button
            onClick={requestNotificationPermission}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            권한 다시 요청
          </button>
        )}
      </div>
    );
  }

  // 프로덕션에서는 UI를 렌더링하지 않음
  return null;
};

export default FcmHandler; 