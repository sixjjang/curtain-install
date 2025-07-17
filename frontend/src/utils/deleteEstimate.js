import { db } from '../firebase/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

/**
 * 견적을 삭제하는 함수
 * @param {string} estimateId - 삭제할 견적 ID
 */
export async function deleteEstimate(estimateId) {
  try {
    const estimateRef = doc(db, 'estimates', estimateId);
    await deleteDoc(estimateRef);
    
    console.log('견적이 성공적으로 삭제되었습니다:', estimateId);
  } catch (error) {
    console.error('견적 삭제 중 오류 발생:', error);
    throw new Error(`견적 삭제 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 