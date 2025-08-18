import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

// 고객 정보 타입
export interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  rating?: number;
  totalJobs?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerService {
  // 고객 정보 저장
  static async saveCustomerInfo(customerInfo: Omit<CustomerInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const customerRef = await addDoc(collection(db, 'customers'), {
        ...customerInfo,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return customerRef.id;
    } catch (error) {
      console.error('고객 정보 저장 실패:', error);
      throw new Error('고객 정보 저장에 실패했습니다.');
    }
  }

  // 고객 정보 수정
  static async updateCustomerInfo(id: string, customerInfo: Partial<CustomerInfo>): Promise<void> {
    try {
      const customerRef = doc(db, 'customers', id);
      await updateDoc(customerRef, {
        ...customerInfo,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('고객 정보 수정 실패:', error);
      throw new Error('고객 정보 수정에 실패했습니다.');
    }
  }

  // 고객 정보 조회
  static async getCustomerInfo(customerId: string): Promise<CustomerInfo | null> {
    try {
      const customerRef = doc(db, 'customers', customerId);
      const customerDoc = await getDoc(customerRef);
      
      if (customerDoc.exists()) {
        const data = customerDoc.data();
        return {
          id: customerDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as CustomerInfo;
      }
      
      return null;
    } catch (error) {
      console.error('고객 정보 조회 실패:', error);
      throw new Error('고객 정보를 조회할 수 없습니다.');
    }
  }

  // 작업 ID로 고객 정보 조회 (작업에 연결된 고객 정보)
  static async getCustomerByJobId(jobId: string): Promise<CustomerInfo | null> {
    try {
      const q = query(
        collection(db, 'customers'),
        where('jobId', '==', jobId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as CustomerInfo;
      }
      
      return null;
    } catch (error) {
      console.error('작업별 고객 정보 조회 실패:', error);
      throw new Error('작업별 고객 정보를 조회할 수 없습니다.');
    }
  }

  // 고객 평점 계산
  static async getCustomerRating(customerId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('customerId', '==', customerId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return 0;
      }
      
      let totalRating = 0;
      let reviewCount = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalRating += data.rating || 0;
        reviewCount++;
      });
      
      return reviewCount > 0 ? totalRating / reviewCount : 0;
    } catch (error) {
      console.error('고객 평점 계산 실패:', error);
      return 0;
    }
  }

  // 고객의 총 작업 수 조회
  static async getCustomerTotalJobs(customerId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'constructionJobs'),
        where('customerId', '==', customerId),
        where('status', '==', 'completed')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.size;
    } catch (error) {
      console.error('고객 총 작업 수 조회 실패:', error);
      return 0;
    }
  }
}
