import { db } from '../firebase/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

/**
 * 견적을 삭제하는 함수
 * @param estimateId - 삭제할 견적 ID
 */
export async function deleteEstimate(estimateId: string): Promise<void> {
  try {
    const estimateRef = doc(db as Firestore, 'estimates', estimateId);
    await deleteDoc(estimateRef);

    console.log('견적이 성공적으로 삭제되었습니다:', estimateId);
  } catch (error) {
    console.error('견적 삭제 중 오류 발생:', error);
    throw error;
  }
} 