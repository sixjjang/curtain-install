import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getAuth, deleteUser } from 'firebase/auth';

/**
 * 모든 Firestore 데이터를 삭제하는 유틸리티 함수
 * 주의: 이 함수는 모든 데이터를 영구적으로 삭제합니다!
 */
export const clearAllFirestoreData = async () => {
  try {
    console.log('데이터베이스 초기화를 시작합니다...');
    
    // 삭제할 컬렉션 목록
    const collectionsToDelete = [
      'users',
      'workOrders', 
      'estimates',
      'payments',
      'reviews',
      'notifications',
      'contractors',
      'advertisers',
      'media',
      'logs'
    ];

    let totalDeleted = 0;

    for (const collectionName of collectionsToDelete) {
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        const deletedCount = querySnapshot.docs.length;
        totalDeleted += deletedCount;
        console.log(`${collectionName}: ${deletedCount}개 문서 삭제됨`);
      } catch (error) {
        console.error(`${collectionName} 삭제 중 오류:`, error);
      }
    }

    console.log(`총 ${totalDeleted}개 문서가 삭제되었습니다.`);
    return { success: true, deletedCount: totalDeleted };
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 특정 컬렉션의 데이터만 삭제하는 함수
 */
export const clearCollection = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`${collectionName}: ${querySnapshot.docs.length}개 문서 삭제됨`);
    return { success: true, deletedCount: querySnapshot.docs.length };
  } catch (error) {
    console.error(`${collectionName} 삭제 중 오류:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자 데이터만 삭제하는 함수
 */
export const clearUserData = async () => {
  return await clearCollection('users');
};

/**
 * 작업 주문 데이터만 삭제하는 함수
 */
export const clearWorkOrderData = async () => {
  return await clearCollection('workOrders');
};

/**
 * Firebase Authentication 사용자 삭제 함수
 * 주의: 이 함수는 서버 사이드에서만 실행 가능합니다!
 */
export const clearFirebaseAuthUsers = async () => {
  try {
    // 클라이언트 사이드에서는 Firebase Admin SDK를 사용할 수 없으므로
    // Cloud Function을 호출해야 합니다
    const response = await fetch('/api/clear-auth-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Firebase Auth 사용자 삭제 실패');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Firebase Auth 사용자 삭제 중 오류:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 모든 데이터 삭제 (Firestore + Firebase Auth)
 */
export const clearAllData = async () => {
  try {
    // 1. Firestore 데이터 삭제
    const firestoreResult = await clearAllFirestoreData();
    
    // 2. Firebase Auth 사용자 삭제 (서버 사이드에서만 가능)
    const authResult = await clearFirebaseAuthUsers();
    
    return {
      success: firestoreResult.success && authResult.success,
      firestoreDeleted: firestoreResult.deletedCount || 0,
      authDeleted: authResult.deletedCount || 0,
      firestoreError: firestoreResult.error,
      authError: authResult.error
    };
  } catch (error) {
    console.error('전체 데이터 삭제 중 오류:', error);
    return { success: false, error: error.message };
  }
}; 