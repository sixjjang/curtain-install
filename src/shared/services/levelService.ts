import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { ContractorLevel } from '../../types';

export class LevelService {
  private static collectionName = 'contractorLevels';

  // 모든 레벨 가져오기
  static async getAllLevels(): Promise<ContractorLevel[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('level', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as ContractorLevel[];
    } catch (error) {
      console.error('레벨 목록 가져오기 실패:', error);
      throw error;
    }
  }

  // 특정 레벨 가져오기
  static async getLevelById(levelId: string): Promise<ContractorLevel | null> {
    try {
      const docRef = doc(db, this.collectionName, levelId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
        } as ContractorLevel;
      }
      return null;
    } catch (error) {
      console.error('레벨 가져오기 실패:', error);
      throw error;
    }
  }

  // 레벨 생성
  static async createLevel(levelData: Omit<ContractorLevel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...levelData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('레벨 생성 실패:', error);
      throw error;
    }
  }

  // 레벨 수정
  static async updateLevel(levelId: string, levelData: Partial<Omit<ContractorLevel, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, levelId);
      await updateDoc(docRef, {
        ...levelData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('레벨 수정 실패:', error);
      throw error;
    }
  }

  // 레벨 삭제
  static async deleteLevel(levelId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, levelId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('레벨 삭제 실패:', error);
      throw error;
    }
  }

  // 기본 레벨 데이터 생성 (초기 설정용)
  static async createDefaultLevels(): Promise<void> {
    try {
      const defaultLevels = [
        {
          level: 1,
          name: '신입시공자',
          completedJobsCount: 0,
          benefits: ['기본 혜택 제공'],
          isActive: true
        },
        {
          level: 2,
          name: '일반시공자',
          completedJobsCount: 10,
          benefits: ['우선 매칭', '수수료 할인'],
          isActive: true
        },
        {
          level: 3,
          name: '고급시공자',
          completedJobsCount: 30,
          benefits: ['우선 매칭', '수수료 할인', '프리미엄 배지'],
          isActive: true
        },
        {
          level: 4,
          name: '최고급시공자',
          completedJobsCount: 100,
          benefits: ['최우선 매칭', '최저 수수료', 'VIP 배지', '전용 고객 지원'],
          isActive: true
        }
      ];

      for (const levelData of defaultLevels) {
        await this.createLevel(levelData);
      }
    } catch (error) {
      console.error('기본 레벨 생성 실패:', error);
      throw error;
    }
  }
}
