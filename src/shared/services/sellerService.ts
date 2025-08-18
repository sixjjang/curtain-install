import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { SellerPickupInfo } from '../../types';

// 판매자 기본 정보 타입
export interface SellerBasicInfo {
  name: string;
  companyName: string;
  businessNumber: string;
  address: string;
  phone: string;
  email: string;
  profileImage?: string;
}

export class SellerService {
  // 판매자 픽업 정보 저장
  static async savePickupInfo(sellerId: string, pickupInfo: SellerPickupInfo): Promise<void> {
    try {
      const sellerRef = doc(db, 'sellers', sellerId);
      
      // 문서가 존재하는지 확인
      const sellerDoc = await getDoc(sellerRef);
      
      if (sellerDoc.exists()) {
        // 문서가 존재하면 업데이트
        await updateDoc(sellerRef, {
          pickupInfo: pickupInfo,
          updatedAt: new Date()
        });
      } else {
        // 문서가 존재하지 않으면 새로 생성
        await setDoc(sellerRef, {
          pickupInfo: pickupInfo,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('픽업 정보 저장 실패:', error);
      throw new Error('픽업 정보 저장에 실패했습니다.');
    }
  }

  // 판매자 픽업 정보 불러오기
  static async getPickupInfo(sellerId: string): Promise<SellerPickupInfo | null> {
    try {
      const sellerRef = doc(db, 'sellers', sellerId);
      const sellerDoc = await getDoc(sellerRef);
      
      if (sellerDoc.exists()) {
        const sellerData = sellerDoc.data();
        return sellerData.pickupInfo || null;
      }
      
      return null;
    } catch (error) {
      console.error('픽업 정보 불러오기 실패:', error);
      throw new Error('픽업 정보를 불러올 수 없습니다.');
    }
  }

  // 판매자 기본 정보 저장
  static async saveBasicInfo(sellerId: string, basicInfo: SellerBasicInfo): Promise<void> {
    try {
      const sellerRef = doc(db, 'sellers', sellerId);
      
      // undefined 값 제거
      const cleanBasicInfo = { ...basicInfo };
      if (cleanBasicInfo.profileImage === undefined) {
        delete cleanBasicInfo.profileImage;
      }
      
      // 문서가 존재하는지 확인
      const sellerDoc = await getDoc(sellerRef);
      
      if (sellerDoc.exists()) {
        // 문서가 존재하면 업데이트
        await updateDoc(sellerRef, {
          ...cleanBasicInfo,
          updatedAt: new Date()
        });
      } else {
        // 문서가 존재하지 않으면 새로 생성
        await setDoc(sellerRef, {
          ...cleanBasicInfo,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('기본 정보 저장 실패:', error);
      throw new Error('기본 정보 저장에 실패했습니다.');
    }
  }

  // 판매자 기본 정보 불러오기
  static async getBasicInfo(sellerId: string): Promise<SellerBasicInfo | null> {
    try {
      const sellerRef = doc(db, 'sellers', sellerId);
      const sellerDoc = await getDoc(sellerRef);
      
      if (sellerDoc.exists()) {
        const sellerData = sellerDoc.data();
        return {
          name: sellerData.name || '',
          companyName: sellerData.companyName || '',
          businessNumber: sellerData.businessNumber || '',
          address: sellerData.address || '',
          phone: sellerData.phone || '',
          email: sellerData.email || '',
          profileImage: sellerData.profileImage || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('기본 정보 불러오기 실패:', error);
      throw new Error('기본 정보를 불러올 수 없습니다.');
    }
  }

  // 판매자 정보 업데이트
  static async updateSellerProfile(sellerId: string, profileData: Partial<SellerPickupInfo>): Promise<void> {
    try {
      const sellerRef = doc(db, 'sellers', sellerId);
      
      // 문서가 존재하는지 확인
      const sellerDoc = await getDoc(sellerRef);
      
      if (sellerDoc.exists()) {
        // 문서가 존재하면 업데이트
        await updateDoc(sellerRef, {
          ...profileData,
          updatedAt: new Date()
        });
      } else {
        // 문서가 존재하지 않으면 새로 생성
        await setDoc(sellerRef, {
          ...profileData,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('판매자 프로필 업데이트 실패:', error);
      throw new Error('프로필 업데이트에 실패했습니다.');
    }
  }
}
