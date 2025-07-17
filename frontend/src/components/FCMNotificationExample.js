import React, { useEffect, useState } from 'react';
import { auth } from '../firebase/firebase';
import { 
  requestNotificationPermission, 
  onMessageListener, 
  saveFCMTokenToUser, 
  removeFCMTokenFromUser,
  isNotificationSupported,
  getNotificationPermissionStatus,
  showCustomNotification,
  initializeFCMForUser
} from '../services/fcmService';

export default function FCMNotificationExample() {
  const [fcmToken, setFcmToken] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported(isNotificationSupported());
    setPermissionStatus(getNotificationPermissionStatus());

    // Listen for auth state changes
    if (auth) {
      const unsubscribeAuth = auth.onAuthStateChanged(user => {
        if (user) {
          setUserId(user.uid);
          initializeFCMForUser(user.uid).then(token => {
            setFcmToken(token);
          });
        } else {
          setUserId(null);
          setFcmToken(null);
        }
      });
      return () => unsubscribeAuth();
    }
  }, []);

  useEffect(() => {
    // Set up message listener
    const unsubscribe = onMessageListener((payload) => {
      console.log('Message received in component:', payload);
      setMessages(prev => [...prev, {
        id: Date.now(),
        title: payload.notification?.title || '새 알림',
        body: payload.notification?.body || '',
        timestamp: new Date(),
        data: payload.data
      }]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const token = await requestNotificationPermission();
      setFcmToken(token);
      setPermissionStatus(getNotificationPermissionStatus());
      
      if (token && userId) {
        await saveFCMTokenToUser(token, userId);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveToken = async () => {
    if (userId) {
      await removeFCMTokenFromUser(userId);
      setFcmToken(null);
    }
  };

  const handleTestNotification = () => {
    showCustomNotification('테스트 알림', {
      body: '이것은 테스트 알림입니다.',
      icon: '/favicon.ico',
      tag: 'test-notification',
      onClick: () => {
        console.log('Test notification clicked');
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'granted':
        return 'text-green-600 bg-green-100';
      case 'denied':
        return 'text-red-600 bg-red-100';
      case 'default':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'granted':
        return '허용됨';
      case 'denied':
        return '거부됨';
      case 'default':
        return '요청 대기';
      case 'not-supported':
        return '지원되지 않음';
      default:
        return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">FCM 알림 설정</h1>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">지원 여부</h3>
          <p className={`mt-1 text-lg font-semibold ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
            {isSupported ? '지원됨' : '지원되지 않음'}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">권한 상태</h3>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(permissionStatus)}`}>
            {getStatusText(permissionStatus)}
          </span>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">FCM 토큰</h3>
          <p className="mt-1 text-sm text-gray-900">
            {fcmToken ? '설정됨' : '설정되지 않음'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 mb-6">
        {!fcmToken && isSupported && (
          <button
            onClick={handleRequestPermission}
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중...' : '알림 권한 요청'}
          </button>
        )}
        
        {fcmToken && (
          <div className="flex flex-col md:flex-row gap-2">
            <button
              onClick={handleTestNotification}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              테스트 알림 보내기
            </button>
            <button
              onClick={handleRemoveToken}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              FCM 토큰 제거
            </button>
          </div>
        )}
      </div>

      {/* FCM Token Display */}
      {fcmToken && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">FCM 토큰</h3>
          <div className="bg-gray-100 rounded-md p-3">
            <p className="text-sm text-gray-700 break-all">{fcmToken}</p>
          </div>
        </div>
      )}

      {/* Received Messages */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">받은 메시지</h3>
        {messages.length === 0 ? (
          <p className="text-gray-500">아직 받은 메시지가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{message.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{message.body}</p>
                    {message.data && (
                      <p className="text-xs text-gray-500 mt-2">
                        데이터: {JSON.stringify(message.data)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">설정 방법</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Firebase Console에서 프로젝트 설정</li>
          <li>Cloud Messaging 탭에서 웹 푸시 인증서 생성</li>
          <li>VAPID 키를 환경변수에 설정: NEXT_PUBLIC_FIREBASE_VAPID_KEY</li>
          <li>firebase-messaging-sw.js 파일을 public 폴더에 추가</li>
        </ol>
      </div>
    </div>
  );
} 