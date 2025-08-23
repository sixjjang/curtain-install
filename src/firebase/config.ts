import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase 설정 - 실제 프로젝트
const firebaseConfig = {
  apiKey: "AIzaSyCt3iSulcZ0Vo5BrZ38mTpMmK7tAjeVN5E",
  authDomain: "curtain-install.firebaseapp.com",
  projectId: "curtain-install",
  storageBucket: "curtain-install.firebasestorage.app",
  messagingSenderId: "552565384276",
  appId: "1:552565384276:web:eaa400189e2014f28979c1"
};

// 디버깅을 위한 로그
console.log('Firebase Config:', firebaseConfig);

// Firebase 초기화
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase 앱 초기화 성공');
} catch (error) {
  console.error('❌ Firebase 앱 초기화 실패:', error);
  throw error;
}

// 서비스 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 개발 환경에서 에뮬레이터 연결 (선택사항)
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✅ Firebase 에뮬레이터 연결됨');
  } catch (error) {
    console.warn('⚠️ Firebase 에뮬레이터 연결 실패:', error);
  }
}

// Firebase 연결 테스트 함수 (재시도 로직 포함)
export const testFirebaseConnection = async (retryCount = 3) => {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Firebase 연결 테스트 시도 ${attempt}/${retryCount}...`);
      
      // Firestore 연결 테스트
      const testCollection = collection(db, 'test');
      const snapshot = await getDocs(testCollection);
      console.log('✅ Firestore 연결 성공');
      
      // Auth 연결 테스트
      const currentUser = auth.currentUser;
      console.log('✅ Auth 연결 성공, 현재 사용자:', currentUser ? '로그인됨' : '로그인 안됨');
      
      return {
        firestore: true,
        auth: true,
        message: 'Firebase 연결이 정상입니다.',
        attempt
      };
    } catch (error) {
      console.error(`❌ Firebase 연결 실패 (시도 ${attempt}/${retryCount}):`, error);
      
      if (attempt === retryCount) {
        return {
          firestore: false,
          auth: false,
          error: error,
          message: 'Firebase 연결에 실패했습니다.',
          attempt
        };
      }
      
      // 재시도 전 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Firestore 오류 처리 함수
export const handleFirestoreError = (error: any) => {
  console.error('Firestore 오류 발생:', error);
  
  if (error.code === 'unavailable') {
    console.warn('Firestore 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
    return '서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
  }
  
  if (error.code === 'permission-denied') {
    console.warn('Firestore 접근 권한이 없습니다.');
    return '접근 권한이 없습니다.';
  }
  
  if (error.message && error.message.includes('BloomFilter')) {
    console.warn('BloomFilter 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    return '네트워크 연결에 문제가 있을 수 있습니다. 인터넷 연결을 확인해주세요.';
  }
  
  return '알 수 없는 오류가 발생했습니다.';
};

export default app;
