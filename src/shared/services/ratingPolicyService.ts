import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { 
  RatingBasedCommissionPolicy, 
  RatingBasedSuspensionPolicy 
} from '../../types';

export class RatingPolicyService {
  // 평점 기반 수수료율 정책 조회
  static async getCommissionPolicies(): Promise<RatingBasedCommissionPolicy[]> {
    try {
      const policiesRef = collection(db, 'ratingCommissionPolicies');
      const q = query(policiesRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const policies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as RatingBasedCommissionPolicy[];
      
      // 평점 기준으로 정렬 (높은 평점부터)
      return policies.sort((a, b) => b.minRating - a.minRating);
    } catch (error) {
      console.error('평점 기반 수수료율 정책 조회 실패:', error);
      throw new Error('수수료율 정책을 불러올 수 없습니다.');
    }
  }

  // 평점 기반 정지 정책 조회
  static async getSuspensionPolicies(): Promise<RatingBasedSuspensionPolicy[]> {
    try {
      const policiesRef = collection(db, 'ratingSuspensionPolicies');
      const q = query(policiesRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const policies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as RatingBasedSuspensionPolicy[];
      
      // 평점 기준으로 정렬 (낮은 평점부터)
      return policies.sort((a, b) => a.minRating - b.minRating);
    } catch (error) {
      console.error('평점 기반 정지 정책 조회 실패:', error);
      throw new Error('정지 정책을 불러올 수 없습니다.');
    }
  }

  // 평점 기반 수수료율 정책 생성
  static async createCommissionPolicy(policy: Omit<RatingBasedCommissionPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const policyData = {
        ...policy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const policyRef = await addDoc(collection(db, 'ratingCommissionPolicies'), policyData);
      return policyRef.id;
    } catch (error) {
      console.error('평점 기반 수수료율 정책 생성 실패:', error);
      throw new Error('수수료율 정책을 생성할 수 없습니다.');
    }
  }

  // 평점 기반 정지 정책 생성
  static async createSuspensionPolicy(policy: Omit<RatingBasedSuspensionPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const policyData = {
        ...policy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const policyRef = await addDoc(collection(db, 'ratingSuspensionPolicies'), policyData);
      return policyRef.id;
    } catch (error) {
      console.error('평점 기반 정지 정책 생성 실패:', error);
      throw new Error('정지 정책을 생성할 수 없습니다.');
    }
  }

  // 평점 기반 수수료율 정책 수정
  static async updateCommissionPolicy(id: string, policy: Partial<RatingBasedCommissionPolicy>): Promise<void> {
    try {
      const policyRef = doc(db, 'ratingCommissionPolicies', id);
      await updateDoc(policyRef, {
        ...policy,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('평점 기반 수수료율 정책 수정 실패:', error);
      throw new Error('수수료율 정책을 수정할 수 없습니다.');
    }
  }

  // 평점 기반 정지 정책 수정
  static async updateSuspensionPolicy(id: string, policy: Partial<RatingBasedSuspensionPolicy>): Promise<void> {
    try {
      const policyRef = doc(db, 'ratingSuspensionPolicies', id);
      await updateDoc(policyRef, {
        ...policy,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('평점 기반 정지 정책 수정 실패:', error);
      throw new Error('정지 정책을 수정할 수 없습니다.');
    }
  }

  // 평점 기반 수수료율 정책 삭제
  static async deleteCommissionPolicy(id: string): Promise<void> {
    try {
      const policyRef = doc(db, 'ratingCommissionPolicies', id);
      await deleteDoc(policyRef);
    } catch (error) {
      console.error('평점 기반 수수료율 정책 삭제 실패:', error);
      throw new Error('수수료율 정책을 삭제할 수 없습니다.');
    }
  }

  // 평점 기반 정지 정책 삭제
  static async deleteSuspensionPolicy(id: string): Promise<void> {
    try {
      const policyRef = doc(db, 'ratingSuspensionPolicies', id);
      await deleteDoc(policyRef);
    } catch (error) {
      console.error('평점 기반 정지 정책 삭제 실패:', error);
      throw new Error('정지 정책을 삭제할 수 없습니다.');
    }
  }

  // 평점에 따른 수수료율 계산
  static async getCommissionRateByRating(rating: number): Promise<number> {
    try {
      const policies = await this.getCommissionPolicies();
      
      // 평점에 맞는 정책 찾기
      const applicablePolicy = policies.find(policy => 
        rating >= policy.minRating && 
        (policy.maxRating === undefined || rating < policy.maxRating)
      );
      
      return applicablePolicy?.commissionRate || 3; // 기본값 3%
    } catch (error) {
      console.error('평점 기반 수수료율 계산 실패:', error);
      return 3; // 기본값 3%
    }
  }

  // 평점에 따른 정지 일수 계산
  static async getSuspensionDaysByRating(rating: number): Promise<number> {
    try {
      const policies = await this.getSuspensionPolicies();
      
      // 평점에 맞는 정책 찾기
      const applicablePolicy = policies.find(policy => 
        rating < policy.minRating && 
        (policy.maxRating === undefined || rating >= policy.maxRating)
      );
      
      return applicablePolicy?.suspensionDays || 0; // 기본값 0일 (정지 없음)
    } catch (error) {
      console.error('평점 기반 정지 일수 계산 실패:', error);
      return 0; // 기본값 0일 (정지 없음)
    }
  }

  // 기본 정책 초기화 (시스템 설정)
  static async initializeDefaultPolicies(): Promise<void> {
    try {
      // 기본 수수료율 정책
      const defaultCommissionPolicies = [
        {
          minRating: 4.5,
          maxRating: 5.0,
          commissionRate: 0,
          description: '평점 4.5점 이상 - 수수료율 0%',
          isActive: true
        },
        {
          minRating: 3.5,
          maxRating: 4.5,
          commissionRate: 3,
          description: '평점 3.5점 이상 ~ 4.5점 미만 - 수수료율 3%',
          isActive: true
        },
        {
          minRating: 0,
          maxRating: 3.5,
          commissionRate: 5,
          description: '평점 3.5점 미만 - 수수료율 5%',
          isActive: true
        }
      ];

      // 기본 정지 정책
      const defaultSuspensionPolicies = [
        {
          minRating: 3.5,
          maxRating: 4.5,
          suspensionDays: 2,
          description: '평점 3.5점 미만 - 신규 시공건 수락 정지 2일',
          isActive: true
        },
        {
          minRating: 3.0,
          maxRating: 3.5,
          suspensionDays: 5,
          description: '평점 3점 미만 - 신규 시공건 수락 정지 5일',
          isActive: true
        },
        {
          minRating: 2.5,
          maxRating: 3.0,
          suspensionDays: 7,
          description: '평점 2.5점 미만 - 신규 시공건 수락 정지 7일',
          isActive: true
        },
        {
          minRating: 2.0,
          maxRating: 2.5,
          suspensionDays: 14,
          description: '평점 2점 미만 - 신규 시공건 수락 정지 14일',
          isActive: true
        },
        {
          minRating: 0,
          maxRating: 2.0,
          suspensionDays: -1,
          description: '평점 1.5점 미만 - 신규 시공건 수락 영구정지',
          isActive: true
        }
      ];

      // 기존 정책 삭제
      const existingCommissionPolicies = await getDocs(collection(db, 'ratingCommissionPolicies'));
      const existingSuspensionPolicies = await getDocs(collection(db, 'ratingSuspensionPolicies'));

      for (const doc of existingCommissionPolicies.docs) {
        await deleteDoc(doc.ref);
      }
      for (const doc of existingSuspensionPolicies.docs) {
        await deleteDoc(doc.ref);
      }

      // 새 정책 생성
      for (const policy of defaultCommissionPolicies) {
        await this.createCommissionPolicy(policy);
      }
      for (const policy of defaultSuspensionPolicies) {
        await this.createSuspensionPolicy(policy);
      }

    } catch (error) {
      console.error('기본 정책 초기화 실패:', error);
      throw new Error('기본 정책을 초기화할 수 없습니다.');
    }
  }
}
