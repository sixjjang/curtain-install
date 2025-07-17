import { db } from '../firebase/firebase';
import { doc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';

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
 * 견적을 업데이트하는 함수
 * @param estimateId - 견적 ID
 * @param updatedData - 업데이트할 데이터
 */
export async function updateEstimate(estimateId: string, updatedData: Partial<Estimate>): Promise<void> {
  try {
    const estimateRef = doc(db as Firestore, 'estimates', estimateId);
    await updateDoc(estimateRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
    
    console.log('견적이 성공적으로 업데이트되었습니다:', estimateId);
  } catch (error) {
    console.error('견적 업데이트 중 오류 발생:', error);
    throw new Error(`견적 업데이트 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 