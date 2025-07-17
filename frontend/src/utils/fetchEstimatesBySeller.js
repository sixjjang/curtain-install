import { db } from '../firebase/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

/**
 * 판매자별 견적 목록을 조회하는 함수
 * @param {string} sellerId - 판매자 ID
 * @returns {Promise<Array>} 견적 목록
 */
export async function fetchEstimatesBySeller(sellerId) {
  try {
    const q = query(
      collection(db, 'estimates'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('판매자별 견적 조회 중 오류 발생:', error);
    throw new Error(`판매자별 견적 조회 실패: ${error.message}`);
  }
} 