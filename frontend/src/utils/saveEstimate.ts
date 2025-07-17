import { db } from '../firebase/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  DocumentData,
  QueryDocumentSnapshot,
  Firestore
} from 'firebase/firestore';

// TypeScript 인터페이스 정의
export interface EstimateItem {
  name: string;
  description: string;
  amount: number;
}

export interface EstimateData {
  sellerId: string;
  items: EstimateItem[];
  total: number;
  customerName?: string;
  customerPhone?: string;
  projectDescription?: string;
}

export interface Estimate extends EstimateData {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  assigned: boolean;
  assignedTo: string | null;
  assignedAt: any | null; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  itemCount: number;
  currency: string;
  version: string;
}

export interface Contractor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
}

/**
 * 견적을 Firestore에 저장하는 함수
 * @param estimateData - 저장할 견적 데이터
 * @returns 저장된 문서의 ID
 */
export const saveEstimate = async (estimateData: EstimateData): Promise<string> => {
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
      status: 'pending' as const,
      assigned: false,
      assignedTo: null,
      assignedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      itemCount: estimateData.items.length,
      currency: 'KRW',
      version: '1.0'
    };

    // Firestore에 저장
    const docRef = await addDoc(collection(db as Firestore, 'estimates'), estimateDoc);
    
    console.log('견적이 성공적으로 저장되었습니다:', docRef.id);
    return docRef.id;

  } catch (error) {
    console.error('견적 저장 중 오류 발생:', error);
    throw new Error(`견적 저장 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 판매자별 견적 목록을 조회하는 함수
 * @param sellerId - 판매자 ID
 * @returns 견적 목록
 */
export const fetchEstimatesBySeller = async (sellerId: string): Promise<Estimate[]> => {
  try {
    const q = query(
      collection(db as Firestore, 'estimates'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    })) as Estimate[];
  } catch (error) {
    console.error('판매자별 견적 조회 중 오류 발생:', error);
    throw new Error(`판매자별 견적 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 견적 목록을 조회하는 함수 (기존 getEstimates와 동일)
 * @param sellerId - 판매자 ID
 * @returns 견적 목록
 */
export const getEstimates = async (sellerId: string): Promise<Estimate[]> => {
  return fetchEstimatesBySeller(sellerId);
};

/**
 * 특정 견적을 조회하는 함수
 * @param estimateId - 견적 ID
 * @returns 견적 데이터
 */
export const getEstimate = async (estimateId: string): Promise<Estimate> => {
  try {
    const estimateRef = doc(db as Firestore, 'estimates', estimateId);
    const estimateSnap = await getDoc(estimateRef);
    
    if (estimateSnap.exists()) {
      return {
        id: estimateSnap.id,
        ...estimateSnap.data(),
      } as Estimate;
    } else {
      throw new Error('견적을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('견적 조회 중 오류 발생:', error);
    throw new Error(`견적 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 견적 상태를 업데이트하는 함수
 * @param estimateId - 견적 ID
 * @param status - 새로운 상태
 */
export const updateEstimateStatus = async (estimateId: string, status: Estimate['status']): Promise<void> => {
  try {
    const estimateRef = doc(db as Firestore, 'estimates', estimateId);
    await updateDoc(estimateRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
    console.log('견적 상태가 업데이트되었습니다:', estimateId, status);
  } catch (error) {
    console.error('견적 상태 업데이트 실패:', error);
    throw error;
  }
};

/**
 * 견적을 계약자에게 할당하는 함수
 * @param estimateId - 견적 ID
 * @param contractorId - 계약자 ID
 */
export const assignEstimateToContractor = async (estimateId: string, contractorId: string): Promise<void> => {
  try {
    const estimateRef = doc(db as Firestore, 'estimates', estimateId);
    await updateDoc(estimateRef, {
      assigned: true,
      assignedTo: contractorId,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('견적이 계약자에게 할당되었습니다:', estimateId, contractorId);
  } catch (error) {
    console.error('견적 할당 실패:', error);
    throw error;
  }
};

/**
 * 견적을 일반적으로 업데이트하는 함수
 * @param estimateId - 견적 ID
 * @param updatedData - 업데이트할 데이터
 */
export const updateEstimate = async (estimateId: string, updatedData: Partial<Estimate>): Promise<void> => {
  try {
    const estimateRef = doc(db as Firestore, 'estimates', estimateId);
    await updateDoc(estimateRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
    
    console.log('견적이 업데이트되었습니다:', estimateId);
  } catch (error) {
    console.error('견적 업데이트 중 오류 발생:', error);
    throw new Error(`견적 업데이트 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 견적 할당을 해제하는 함수
 * @param estimateId - 견적 ID
 */
export const unassignEstimate = async (estimateId: string): Promise<void> => {
  try {
    const estimateRef = doc(db as Firestore, 'estimates', estimateId);
    await updateDoc(estimateRef, {
      assigned: false,
      assignedTo: null,
      assignedAt: null,
      updatedAt: serverTimestamp()
    });
    console.log('견적 할당이 해제되었습니다:', estimateId);
  } catch (error) {
    console.error('견적 할당 해제 실패:', error);
    throw error;
  }
};

/**
 * 할당되지 않은 견적 목록을 조회하는 함수
 * @returns 할당되지 않은 견적 목록
 */
export const getUnassignedEstimates = async (): Promise<Estimate[]> => {
  try {
    const q = query(
      collection(db as Firestore, 'estimates'),
      where('assigned', '==', false),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    })) as Estimate[];
  } catch (error) {
    console.error('할당되지 않은 견적 조회 중 오류 발생:', error);
    throw new Error(`할당되지 않은 견적 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 특정 계약자에게 할당된 견적 목록을 조회하는 함수
 * @param contractorId - 계약자 ID
 * @returns 계약자별 견적 목록
 */
export const getEstimatesByContractor = async (contractorId: string): Promise<Estimate[]> => {
  try {
    const q = query(
      collection(db as Firestore, 'estimates'),
      where('assignedTo', '==', contractorId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    })) as Estimate[];
  } catch (error) {
    console.error('계약자별 견적 조회 중 오류 발생:', error);
    throw new Error(`계약자별 견적 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 견적을 삭제하는 함수
 * @param estimateId - 삭제할 견적 ID
 */
export const deleteEstimate = async (estimateId: string): Promise<void> => {
  try {
    const estimateRef = doc(db as Firestore, 'estimates', estimateId);
    await deleteDoc(estimateRef);
    
    console.log('견적이 성공적으로 삭제되었습니다:', estimateId);
  } catch (error) {
    console.error('견적 삭제 중 오류 발생:', error);
    throw new Error(`견적 삭제 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 견적 통계를 조회하는 함수
 * @param sellerId - 판매자 ID
 * @returns 견적 통계
 */
export const getEstimateStats = async (sellerId: string): Promise<{
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  completed: number;
  assigned: number;
  unassigned: number;
  totalAmount: number;
}> => {
  try {
    const estimates = await fetchEstimatesBySeller(sellerId);
    
    const stats = estimates.reduce((acc, estimate) => {
      acc.total++;
      acc[estimate.status]++;
      if (estimate.assigned) {
        acc.assigned++;
      } else {
        acc.unassigned++;
      }
      acc.totalAmount += estimate.total;
      return acc;
    }, {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      completed: 0,
      assigned: 0,
      unassigned: 0,
      totalAmount: 0
    });

    return stats;
  } catch (error) {
    console.error('견적 통계 조회 중 오류 발생:', error);
    throw new Error(`견적 통계 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 