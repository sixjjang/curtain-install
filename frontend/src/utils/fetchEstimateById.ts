import { db } from '../firebase/firebase';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

export interface EstimateItem {
  name: string;
  description: string;
  amount: number;
}

export interface Estimate {
  id: string;
  sellerId: string;
  items: EstimateItem[];
  total: number;
  customerName?: string;
  customerPhone?: string;
  projectDescription?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  assigned: boolean;
  assignedTo?: string;
  assignedAt?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  itemCount: number;
  currency: string;
  version: string;
}

/**
 * ID로 특정 견적을 조회하는 함수
 * @param estimateId - 견적 ID
 * @returns 견적 데이터
 */
export async function fetchEstimateById(estimateId: string): Promise<Estimate> {
  try {
    const docRef = doc(db as Firestore, 'estimates', estimateId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Estimate;
    } else {
      throw new Error('견적을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('견적 조회 실패:', error);
    throw error;
  }
} 