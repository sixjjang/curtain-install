import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * ID로 특정 견적을 조회하는 함수
 * @param {string} estimateId - 견적 ID
 * @returns {Promise<Object>} 견적 데이터
 */
export async function fetchEstimateById(estimateId) {
  try {
    const docRef = doc(db, 'estimates', estimateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      throw new Error('해당 견적이 존재하지 않습니다.');
    }
  } catch (error) {
    console.error('견적 조회 중 오류 발생:', error);
    throw new Error(`견적 조회 실패: ${error.message}`);
  }
} 