import { db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 견적을 Firestore에 저장하는 함수
 * @param {Object} estimateData - 저장할 견적 데이터
 * @param {string} estimateData.sellerId - 판매자 ID
 * @param {Array} estimateData.items - 견적 항목 배열
 * @param {number} estimateData.total - 총 견적 금액
 * @param {string} estimateData.customerName - 고객명 (선택사항)
 * @param {string} estimateData.customerPhone - 고객 연락처 (선택사항)
 * @param {string} estimateData.projectDescription - 프로젝트 설명 (선택사항)
 * @returns {Promise<string>} 저장된 문서의 ID
 */
export const saveEstimate = async (estimateData) => {
  try {
    // 필수 필드 검증
    if (!estimateData.sellerId) {
      throw new Error('판매자 ID가 필요합니다.');
    }
    
    if (!estimateData.items || !Array.isArray(estimateData.items) || estimateData.items.length === 0) {
      throw new Error('견적 항목이 필요합니다.');
    }
    
    if (typeof estimateData.total !== 'number' || estimateData.total <= 0) {
      throw new Error('유효한 총 견적 금액이 필요합니다.');
    }

    // Firestore에 저장할 데이터 준비
    const estimateDoc = {
      sellerId: estimateData.sellerId,
      items: estimateData.items,
      total: estimateData.total,
      customerName: estimateData.customerName || '',
      customerPhone: estimateData.customerPhone || '',
      projectDescription: estimateData.projectDescription || '',
      status: 'pending', // pending, accepted, rejected, completed
      assigned: false, // 견적 할당 여부
      assignedTo: null, // 할당된 계약자 ID
      assignedAt: null, // 할당 시간
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // 추가 메타데이터
      itemCount: estimateData.items.length,
      currency: 'KRW',
      version: '1.0'
    };

    // Firestore에 저장
    const docRef = await addDoc(collection(db, 'estimates'), estimateDoc);
    
    console.log('견적이 성공적으로 저장되었습니다:', docRef.id);
    return docRef.id;

  } catch (error) {
    console.error('견적 저장 중 오류 발생:', error);
    throw new Error(`견적 저장 실패: ${error.message}`);
  }
};

/**
 * 견적 목록을 조회하는 함수
 * @param {string} sellerId - 판매자 ID
 * @returns {Promise<Array>} 견적 목록
 */
export const getEstimates = async (sellerId) => {
  try {
    const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
    
    const estimatesRef = collection(db, 'estimates');
    const q = query(
      estimatesRef,
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const estimates = [];
    
    querySnapshot.forEach((doc) => {
      estimates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return estimates;
  } catch (error) {
    console.error('견적 목록 조회 중 오류 발생:', error);
    throw new Error(`견적 목록 조회 실패: ${error.message}`);
  }
};

/**
 * 판매자별 견적 목록을 조회하는 함수 (fetchEstimatesBySeller와 동일)
 * @param {string} sellerId - 판매자 ID
 * @returns {Promise<Array>} 견적 목록
 */
export const fetchEstimatesBySeller = async (sellerId) => {
  try {
    const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
    
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
};

/**
 * 특정 견적을 조회하는 함수
 * @param {string} estimateId - 견적 ID
 * @returns {Promise<Object>} 견적 데이터
 */
export const getEstimate = async (estimateId) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    
    const estimateRef = doc(db, 'estimates', estimateId);
    const estimateSnap = await getDoc(estimateRef);
    
    if (estimateSnap.exists()) {
      return {
        id: estimateSnap.id,
        ...estimateSnap.data()
      };
    } else {
      throw new Error('견적을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('견적 조회 중 오류 발생:', error);
    throw new Error(`견적 조회 실패: ${error.message}`);
  }
};

/**
 * 견적 상태를 업데이트하는 함수
 * @param {string} estimateId - 견적 ID
 * @param {string} status - 새로운 상태
 * @returns {Promise<void>}
 */
export const updateEstimateStatus = async (estimateId, status) => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    
    const estimateRef = doc(db, 'estimates', estimateId);
    await updateDoc(estimateRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
    
    console.log('견적 상태가 업데이트되었습니다:', status);
  } catch (error) {
    console.error('견적 상태 업데이트 중 오류 발생:', error);
    throw new Error(`견적 상태 업데이트 실패: ${error.message}`);
  }
};

/**
 * 견적을 계약자에게 할당하는 함수
 * @param {string} estimateId - 견적 ID
 * @param {string} contractorId - 계약자 ID
 * @returns {Promise<void>}
 */
export const assignEstimateToContractor = async (estimateId, contractorId) => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    
    const estimateRef = doc(db, 'estimates', estimateId);
    await updateDoc(estimateRef, {
      assigned: true,
      assignedTo: contractorId,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('견적이 계약자에게 할당되었습니다:', contractorId);
  } catch (error) {
    console.error('견적 할당 중 오류 발생:', error);
    throw new Error(`견적 할당 실패: ${error.message}`);
  }
};

/**
 * 견적 할당을 해제하는 함수
 * @param {string} estimateId - 견적 ID
 * @returns {Promise<void>}
 */
export const unassignEstimate = async (estimateId) => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    
    const estimateRef = doc(db, 'estimates', estimateId);
    await updateDoc(estimateRef, {
      assigned: false,
      assignedTo: null,
      assignedAt: null,
      updatedAt: serverTimestamp()
    });
    
    console.log('견적 할당이 해제되었습니다.');
  } catch (error) {
    console.error('견적 할당 해제 중 오류 발생:', error);
    throw new Error(`견적 할당 해제 실패: ${error.message}`);
  }
};

/**
 * 할당되지 않은 견적 목록을 조회하는 함수
 * @returns {Promise<Array>} 할당되지 않은 견적 목록
 */
export const getUnassignedEstimates = async () => {
  try {
    const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
    
    const estimatesRef = collection(db, 'estimates');
    const q = query(
      estimatesRef,
      where('assigned', '==', false),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const estimates = [];
    
    querySnapshot.forEach((doc) => {
      estimates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return estimates;
  } catch (error) {
    console.error('할당되지 않은 견적 조회 중 오류 발생:', error);
    throw new Error(`할당되지 않은 견적 조회 실패: ${error.message}`);
  }
};

/**
 * 특정 계약자에게 할당된 견적 목록을 조회하는 함수
 * @param {string} contractorId - 계약자 ID
 * @returns {Promise<Array>} 할당된 견적 목록
 */
export const getEstimatesByContractor = async (contractorId) => {
  try {
    const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
    
    const estimatesRef = collection(db, 'estimates');
    const q = query(
      estimatesRef,
      where('assignedTo', '==', contractorId),
      orderBy('assignedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const estimates = [];
    
    querySnapshot.forEach((doc) => {
      estimates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return estimates;
  } catch (error) {
    console.error('계약자별 견적 조회 중 오류 발생:', error);
    throw new Error(`계약자별 견적 조회 실패: ${error.message}`);
  }
}; 