import { useState, useEffect } from 'react';

interface PWAUpdateInfo {
  hasUpdate: boolean;
  isUpdating: boolean;
  updateApp: () => void;
  skipUpdate: () => void;
}

export const usePWAUpdate = (): PWAUpdateInfo => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          setRegistration(reg);
          console.log('Service Worker 등록 성공:', reg);

          // 업데이트 확인
          reg.addEventListener('updatefound', () => {
            console.log('새 Service Worker 발견');
            const newWorker = reg.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('새 Service Worker 설치 완료, 업데이트 가능');
                  setHasUpdate(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker 등록 실패:', error);
        });

      // Service Worker 메시지 수신
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'APP_UPDATED') {
          console.log('앱 업데이트 알림 수신:', event.data.message);
          // 자동 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    }
  }, []);

  // 앱 업데이트 실행
  const updateApp = () => {
    if (registration && registration.waiting) {
      setIsUpdating(true);
      console.log('앱 업데이트 시작...');
      
      // 새 Service Worker에게 활성화 신호 전송
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Service Worker 변경 감지
      registration.addEventListener('controllerchange', () => {
        console.log('새 Service Worker가 활성화되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
      });
    }
  };

  // 업데이트 건너뛰기
  const skipUpdate = () => {
    setHasUpdate(false);
    console.log('업데이트를 건너뜁니다.');
  };

  return {
    hasUpdate,
    isUpdating,
    updateApp,
    skipUpdate
  };
};
