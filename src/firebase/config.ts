import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
const app = initializeApp(firebaseConfig);

// 서비스 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Firebase 연결 테스트 함수
export const testFirebaseConnection = async () => {
  try {
    console.log('Firebase 연결 테스트 시작...');
    
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
      message: 'Firebase 연결이 정상입니다.'
    };
  } catch (error) {
    console.error('❌ Firebase 연결 실패:', error);
    return {
      firestore: false,
      auth: false,
      error: error,
      message: 'Firebase 연결에 실패했습니다.'
    };
  }
};

export default app;
