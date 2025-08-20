import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { EmergencyJobSettings, PricingOption } from '../../types';

export interface PricingItem {
  id: string;
  name: string;
  basePrice: number;
  unit: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PricingService {
  private static collectionName = 'pricingItems';
  private static travelFeeCollectionName = 'systemSettings';
  private static emergencySettingsCollectionName = 'emergencyJobSettings';
  private static optionsCollectionName = 'pricingOptions';
  private static categoriesCollectionName = 'pricingCategories';

  // 모든 품목 가져오기
  static async getAllItems(): Promise<PricingItem[]> {
    try {
      // 임시로 인덱스 없이 작동하도록 수정
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const items: PricingItem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          name: data.name,
          basePrice: data.basePrice,
          unit: data.unit,
          description: data.description,
          category: data.category,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      // 클라이언트 사이드에서 정렬
      return items.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('품목 목록 가져오기 실패:', error);
      throw error;
    }
  }

  // 품목 추가
  static async addItem(item: Omit<PricingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('품목 추가 실패:', error);
      throw error;
    }
  }

  // 품목 수정
  static async updateItem(id: string, updates: Partial<PricingItem>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('품목 수정 실패:', error);
      throw error;
    }
  }

  // 품목 삭제 (비활성화)
  static async deleteItem(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('품목 삭제 실패:', error);
      throw error;
    }
  }

  // 기본 품목 데이터 초기화
  static async initializeDefaultItems(): Promise<void> {
    try {
      const existingItems = await this.getAllItems();
      
      if (existingItems.length === 0) {
        const defaultItems = [
          {
            name: '커튼',
            basePrice: 150000,
            unit: '개',
            description: '기본 커튼 설치',
            category: '커튼',
            isActive: true
          },
          {
            name: '블라인드',
            basePrice: 80000,
            unit: '개',
            description: '기본 블라인드 설치',
            category: '블라인드',
            isActive: true
          },
          {
            name: '전동커튼',
            basePrice: 250000,
            unit: '개',
            description: '전동 커튼 설치',
            category: '전동커튼',
            isActive: true
          },
          {
            name: '전동블라인드',
            basePrice: 180000,
            unit: '개',
            description: '전동 블라인드 설치',
            category: '전동블라인드',
            isActive: true
          },
          {
            name: '배터리전동 블라인드',
            basePrice: 200000,
            unit: '개',
            description: '배터리 전동 블라인드 설치',
            category: '전동블라인드',
            isActive: true
          },
          {
            name: '배터리전동 커튼',
            basePrice: 300000,
            unit: '개',
            description: '배터리 전동 커튼 설치',
            category: '전동커튼',
            isActive: true
          },
          {
            name: 'IoT셋팅',
            basePrice: 50000,
            unit: '회',
            description: 'IoT 스마트 홈 설정',
            category: 'IoT',
            isActive: true
          }
        ];

        for (const item of defaultItems) {
          await this.addItem(item);
        }
        
        console.log('기본 품목 데이터가 초기화되었습니다.');
      }
    } catch (error) {
      console.error('기본 품목 초기화 실패:', error);
      throw error;
    }
  }

  // 기본출장비 가져오기
  static async getTravelFee(): Promise<number> {
    try {
      const docRef = doc(db, this.travelFeeCollectionName, 'travelFee');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().amount || 17000;
      } else {
        // 기본출장비 문서가 없으면 생성
        await this.setTravelFee(17000);
        return 17000;
      }
    } catch (error) {
      console.error('기본출장비 가져오기 실패:', error);
      return 17000; // 기본값 반환
    }
  }

  // 기본출장비 설정
  static async setTravelFee(amount: number): Promise<void> {
    try {
      const docRef = doc(db, this.travelFeeCollectionName, 'travelFee');
      await setDoc(docRef, {
        amount,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('기본출장비 설정 실패:', error);
      throw error;
    }
  }

  // 기본출장비 업데이트 (setTravelFee의 별칭)
  static async updateTravelFee(amount: number): Promise<void> {
    return this.setTravelFee(amount);
  }

  // 긴급시공건 설정 관련 메서드들

  // 모든 긴급시공건 설정 가져오기
  static async getAllEmergencySettings(): Promise<EmergencyJobSettings[]> {
    try {
      const q = query(
        collection(db, this.emergencySettingsCollectionName),
        orderBy('hoursWithin', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const settings: EmergencyJobSettings[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        settings.push({
          id: doc.id,
          hoursWithin: data.hoursWithin,
          additionalPercentage: data.additionalPercentage,
          additionalAmount: data.additionalAmount,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      return settings;
    } catch (error) {
      console.error('긴급시공건 설정 목록 가져오기 실패:', error);
      throw error;
    }
  }

  // 긴급시공건 설정 추가
  static async addEmergencySetting(setting: Omit<EmergencyJobSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.emergencySettingsCollectionName), {
        ...setting,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('긴급시공건 설정 추가 실패:', error);
      throw error;
    }
  }

  // 긴급시공건 설정 수정
  static async updateEmergencySetting(id: string, updates: Partial<EmergencyJobSettings>): Promise<void> {
    try {
      const docRef = doc(db, this.emergencySettingsCollectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('긴급시공건 설정 수정 실패:', error);
      throw error;
    }
  }

  // 긴급시공건 설정 삭제
  static async deleteEmergencySetting(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.emergencySettingsCollectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('긴급시공건 설정 삭제 실패:', error);
      throw error;
    }
  }

  // 기본 긴급시공건 설정 초기화
  static async initializeDefaultEmergencySettings(): Promise<void> {
    try {
      const existingSettings = await this.getAllEmergencySettings();
      
      if (existingSettings.length === 0) {
        const defaultSettings = [
          {
            hoursWithin: 48,
            additionalPercentage: 20,
            additionalAmount: 20000, // 20% 추가금액을 500원 단위로 계산
            isActive: true
          },
          {
            hoursWithin: 24,
            additionalPercentage: 30,
            additionalAmount: 30000, // 30% 추가금액을 500원 단위로 계산
            isActive: true
          },
          {
            hoursWithin: 12,
            additionalPercentage: 50,
            additionalAmount: 50000, // 50% 추가금액을 500원 단위로 계산
            isActive: true
          }
        ];

        for (const setting of defaultSettings) {
          await this.addEmergencySetting(setting);
        }
        
        console.log('기본 긴급시공건 설정이 초기화되었습니다.');
      }
    } catch (error) {
      console.error('기본 긴급시공건 설정 초기화 실패:', error);
      throw error;
    }
  }

  // 추가금액을 500원 단위로 계산하는 헬퍼 함수
  static calculateAdditionalAmount(totalConstructionCost: number, percentage: number): number {
    const additionalAmount = Math.round((totalConstructionCost * percentage) / 100);
    // 500원 단위로 반올림
    return Math.round(additionalAmount / 500) * 500;
  }

  // 옵션 관련 메서드들
  static async getAllOptions(): Promise<PricingOption[]> {
    try {
      const q = query(
        collection(db, this.optionsCollectionName),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const options: PricingOption[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        options.push({
          id: doc.id,
          name: data.name,
          price: data.price,
          category: data.category,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      return options.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('옵션 목록 가져오기 실패:', error);
      throw error;
    }
  }

  static async addOption(option: Omit<PricingOption, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.optionsCollectionName), {
        ...option,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('옵션 추가 실패:', error);
      throw error;
    }
  }

  static async updateOption(id: string, updates: Partial<PricingOption>): Promise<void> {
    try {
      const docRef = doc(db, this.optionsCollectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('옵션 수정 실패:', error);
      throw error;
    }
  }

  static async deleteOption(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.optionsCollectionName, id);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('옵션 삭제 실패:', error);
      throw error;
    }
  }

  static async initializeDefaultOptions(): Promise<void> {
    const defaultOptions = [
      {
        name: '높이 추가 (3m 이상)',
        price: 10000,
        category: '높이추가',
        isActive: true
      },
      {
        name: '콘크리트 천장',
        price: 15000,
        category: '콘크리트추가',
        isActive: true
      },
      {
        name: '석고보드 천장',
        price: 12000,
        category: '석고추가',
        isActive: true
      },
      {
        name: '기존 커튼 철거',
        price: 8000,
        category: '철거추가',
        isActive: true
      },
      {
        name: '폐기물 처리',
        price: 5000,
        category: '폐기추가',
        isActive: true
      },
      {
        name: 'IoT 스마트 제어',
        price: 25000,
        category: 'IoT세팅',
        isActive: true
      }
    ];

    for (const option of defaultOptions) {
      await this.addOption(option);
    }
  }

  // 카테고리 관리 함수들
  static async getAllCategories(): Promise<string[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.categoriesCollectionName));
      const categories: string[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive !== false) {
          categories.push(data.name);
        }
      });
      
      return categories.sort();
    } catch (error) {
      console.error('카테고리 목록 가져오기 실패:', error);
      // 기본 카테고리 반환
      return ['기본', '전동', '배터리전동', 'IoT세팅', '높이추가', '콘크리트추가', '석고추가', '철거추가', '폐기추가', '기타시공'];
    }
  }

  static async addCategory(name: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.categoriesCollectionName), {
        name: name.trim(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('카테고리 추가 실패:', error);
      throw error;
    }
  }

  static async updateCategory(oldName: string, newName: string): Promise<void> {
    try {
      // 카테고리 문서 찾기
      const q = query(collection(db, this.categoriesCollectionName), where('name', '==', oldName));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, this.categoriesCollectionName, querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          name: newName.trim(),
          updatedAt: new Date()
        });
      }

      // 해당 카테고리를 사용하는 모든 품목과 옵션 업데이트
      await this.updateItemsCategory(oldName, newName);
      await this.updateOptionsCategory(oldName, newName);
    } catch (error) {
      console.error('카테고리 수정 실패:', error);
      throw error;
    }
  }

  static async deleteCategory(name: string): Promise<void> {
    try {
      // 카테고리 문서 찾기
      const q = query(collection(db, this.categoriesCollectionName), where('name', '==', name));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, this.categoriesCollectionName, querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          isActive: false,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      throw error;
    }
  }

  private static async updateItemsCategory(oldName: string, newName: string): Promise<void> {
    try {
      const q = query(collection(db, this.collectionName), where('category', '==', oldName));
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map(docRef => 
        updateDoc(doc(db, this.collectionName, docRef.id), {
          category: newName,
          updatedAt: new Date()
        })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('품목 카테고리 업데이트 실패:', error);
      throw error;
    }
  }

  private static async updateOptionsCategory(oldName: string, newName: string): Promise<void> {
    try {
      const q = query(collection(db, this.optionsCollectionName), where('category', '==', oldName));
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map(docRef => 
        updateDoc(doc(db, this.optionsCollectionName, docRef.id), {
          category: newName,
          updatedAt: new Date()
        })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('옵션 카테고리 업데이트 실패:', error);
      throw error;
    }
  }

  static async initializeDefaultCategories(): Promise<void> {
    const defaultCategories = [
      '기본', '전동', '배터리전동', 'IoT세팅', '높이추가', '콘크리트추가', '석고추가', '철거추가', '폐기추가', '기타시공'
    ];

    // 기존 카테고리 목록 가져오기
    const existingCategories = await this.getAllCategories();
    
    for (const categoryName of defaultCategories) {
      // 이미 존재하는 카테고리는 건너뛰기
      if (!existingCategories.includes(categoryName)) {
        try {
          await this.addCategory(categoryName);
          console.log(`카테고리 ${categoryName} 추가됨`);
        } catch (error) {
          console.error(`카테고리 ${categoryName} 추가 실패:`, error);
        }
      } else {
        console.log(`카테고리 ${categoryName} 이미 존재함 - 건너뜀`);
      }
    }
  }

  // 중복 카테고리 정리 함수
  static async cleanupDuplicateCategories(): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, this.categoriesCollectionName));
      const categories: { id: string; name: string; isActive: boolean }[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        categories.push({
          id: doc.id,
          name: data.name,
          isActive: data.isActive !== false
        });
      });

      // 이름별로 그룹화하여 중복 찾기
      const nameGroups: { [key: string]: { id: string; name: string; isActive: boolean }[] } = {};
      categories.forEach(category => {
        if (!nameGroups[category.name]) {
          nameGroups[category.name] = [];
        }
        nameGroups[category.name].push(category);
      });

      // 중복된 카테고리 중 하나만 남기고 나머지는 비활성화
      for (const [name, duplicates] of Object.entries(nameGroups)) {
        if (duplicates.length > 1) {
          console.log(`중복 카테고리 발견: ${name} (${duplicates.length}개)`);
          
          // 활성 상태인 것 중 첫 번째를 유지하고 나머지는 비활성화
          const activeOnes = duplicates.filter(cat => cat.isActive);
          const toDeactivate = activeOnes.slice(1); // 첫 번째 이후의 것들
          
          for (const category of toDeactivate) {
            const docRef = doc(db, this.categoriesCollectionName, category.id);
            await updateDoc(docRef, {
              isActive: false,
              updatedAt: new Date()
            });
            console.log(`카테고리 ${name} (ID: ${category.id}) 비활성화됨`);
          }
        }
      }
    } catch (error) {
      console.error('중복 카테고리 정리 실패:', error);
      throw error;
    }
  }
}
