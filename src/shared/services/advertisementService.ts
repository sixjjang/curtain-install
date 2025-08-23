import { db, storage } from '../../firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Advertisement } from '../../types';

export class AdvertisementService {
  private static readonly COLLECTION_NAME = 'advertisements';

  // 모든 광고 조회
  static async getAllAdvertisements(): Promise<Advertisement[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
             return querySnapshot.docs.map(doc => {
         const data = doc.data();
         return {
           id: doc.id,
           title: data.title,
           imageUrl: data.imageUrl,
           linkUrl: data.linkUrl,
           position: data.position,
           isActive: data.isActive,
           clickCount: data.clickCount || 0,
           publishStartDate: data.publishStartDate?.toDate() || new Date(),
           publishEndDate: data.publishEndDate?.toDate() || new Date(),
           isExpired: data.isExpired || false,
           extensionRequested: data.extensionRequested || false,
           createdAt: data.createdAt?.toDate() || new Date(),
           updatedAt: data.updatedAt?.toDate() || new Date(),
           createdBy: data.createdBy
         } as Advertisement;
       });
    } catch (error) {
      console.error('광고 목록 조회 실패:', error);
      throw new Error('광고 목록을 불러올 수 없습니다.');
    }
  }

  // 특정 위치의 활성 광고 조회
  static async getActiveAdvertisementsByPosition(position: 'sidebar' | 'dashboard' | 'chat'): Promise<Advertisement[]> {
    try {
      // 임시로 인덱스 없이 작동하도록 단순화
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
             // 클라이언트 사이드에서 필터링
       const filteredAds = querySnapshot.docs
         .map(doc => {
           const data = doc.data();
           return {
             id: doc.id,
             title: data.title,
             imageUrl: data.imageUrl,
             linkUrl: data.linkUrl,
             position: data.position,
             isActive: data.isActive,
             clickCount: data.clickCount || 0,
             publishStartDate: data.publishStartDate?.toDate() || new Date(),
             publishEndDate: data.publishEndDate?.toDate() || new Date(),
             isExpired: data.isExpired || false,
             extensionRequested: data.extensionRequested || false,
             createdAt: data.createdAt?.toDate() || new Date(),
             updatedAt: data.updatedAt?.toDate() || new Date(),
             createdBy: data.createdBy
           } as Advertisement;
         })
        .filter(ad => ad.position === position)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return filteredAds;
    } catch (error) {
      console.error('활성 광고 조회 실패:', error);
      throw new Error('활성 광고를 불러올 수 없습니다.');
    }
  }

  // 광고 상세 조회
  static async getAdvertisementById(id: string): Promise<Advertisement | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
             if (docSnap.exists()) {
         const data = docSnap.data();
         return {
           id: docSnap.id,
           title: data.title,
           imageUrl: data.imageUrl,
           linkUrl: data.linkUrl,
           position: data.position,
           isActive: data.isActive,
           clickCount: data.clickCount || 0,
           publishStartDate: data.publishStartDate?.toDate() || new Date(),
           publishEndDate: data.publishEndDate?.toDate() || new Date(),
           isExpired: data.isExpired || false,
           extensionRequested: data.extensionRequested || false,
           createdAt: data.createdAt?.toDate() || new Date(),
           updatedAt: data.updatedAt?.toDate() || new Date(),
           createdBy: data.createdBy
         } as Advertisement;
       }
      return null;
    } catch (error) {
      console.error('광고 상세 조회 실패:', error);
      throw new Error('광고 정보를 불러올 수 없습니다.');
    }
  }

  // 광고 이미지 업로드
  static async uploadAdvertisementImage(file: File, advertisementId: string): Promise<string> {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `advertisements/${advertisementId}/image.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('광고 이미지 업로드 실패:', error);
      throw new Error('이미지 업로드에 실패했습니다.');
    }
  }

  // 광고 생성
  static async createAdvertisement(
    title: string,
    imageFile: File,
    linkUrl: string,
    position: 'sidebar' | 'dashboard' | 'chat',
    createdBy: string,
    publishStartDate: Date,
    publishEndDate: Date
  ): Promise<string> {
    try {
             // 먼저 광고 문서 생성
       const advertisementData = {
         title,
         imageUrl: '', // 임시로 빈 문자열
         linkUrl,
         position,
         isActive: true,
         clickCount: 0, // 클릭수 초기화
         publishStartDate,
         publishEndDate,
         isExpired: false,
         extensionRequested: false,
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp(),
         createdBy
       };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), advertisementData);
      
      // 이미지 업로드
      const imageUrl = await this.uploadAdvertisementImage(imageFile, docRef.id);
      
      // 이미지 URL 업데이트
      await updateDoc(docRef, {
        imageUrl,
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('광고 생성 실패:', error);
      throw new Error('광고 생성에 실패했습니다.');
    }
  }

  // 광고 수정
  static async updateAdvertisement(
    id: string,
    updates: {
      title?: string;
      linkUrl?: string;
      position?: 'sidebar' | 'dashboard' | 'chat';
      isActive?: boolean;
    },
    imageFile?: File
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // 이미지가 제공된 경우 업로드
      if (imageFile) {
        const imageUrl = await this.uploadAdvertisementImage(imageFile, id);
        updateData.imageUrl = imageUrl;
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('광고 수정 실패:', error);
      throw new Error('광고 수정에 실패했습니다.');
    }
  }

  // 광고 삭제
  static async deleteAdvertisement(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // 이미지 파일 삭제
        if (data.imageUrl) {
          try {
            const imageRef = ref(storage, data.imageUrl);
            await deleteObject(imageRef);
          } catch (imageError) {
            console.warn('이미지 파일 삭제 실패:', imageError);
          }
        }
        
        // 문서 삭제
        await deleteDoc(docRef);
      }
    } catch (error) {
      console.error('광고 삭제 실패:', error);
      throw new Error('광고 삭제에 실패했습니다.');
    }
  }

  // 광고 활성화/비활성화 토글
  static async toggleAdvertisementStatus(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentStatus = docSnap.data().isActive;
        await updateDoc(docRef, {
          isActive: !currentStatus,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('광고 상태 변경 실패:', error);
      throw new Error('광고 상태 변경에 실패했습니다.');
    }
  }

  // 광고 클릭 추적
  static async trackAdvertisementClick(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentClickCount = docSnap.data().clickCount || 0;
        await updateDoc(docRef, {
          clickCount: currentClickCount + 1,
          updatedAt: serverTimestamp()
        });
        console.log(`✅ 광고 클릭 추적 완료: ${id} (클릭수: ${currentClickCount + 1})`);
      }
    } catch (error) {
      console.error('광고 클릭 추적 실패:', error);
      // 클릭 추적 실패는 사용자 경험에 영향을 주지 않도록 에러를 던지지 않음
    }
  }

  // 만료된 광고 조회
  static async getExpiredAdvertisements(): Promise<Advertisement[]> {
    try {
      // 임시로 인덱스 없이 작동하도록 단순화
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      const now = new Date();
      
      // 클라이언트 사이드에서 필터링
      return querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            imageUrl: data.imageUrl,
            linkUrl: data.linkUrl,
            position: data.position,
            isActive: data.isActive,
            clickCount: data.clickCount || 0,
            publishStartDate: data.publishStartDate?.toDate() || new Date(),
            publishEndDate: data.publishEndDate?.toDate() || new Date(),
            isExpired: data.isExpired || false,
            extensionRequested: data.extensionRequested || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            createdBy: data.createdBy
          } as Advertisement;
        })
        .filter(ad => ad.publishEndDate <= now);
    } catch (error) {
      console.error('만료된 광고 조회 실패:', error);
      throw new Error('만료된 광고를 불러올 수 없습니다.');
    }
  }

  // 광고 연장 요청
  static async requestExtension(id: string, newEndDate: Date): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(docRef, {
        publishEndDate: newEndDate,
        extensionRequested: true,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ 광고 연장 요청 완료: ${id}`);
    } catch (error) {
      console.error('광고 연장 요청 실패:', error);
      throw new Error('광고 연장 요청에 실패했습니다.');
    }
  }

  // 광고 종료
  static async endAdvertisement(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(docRef, {
        isActive: false,
        isExpired: true,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ 광고 종료 완료: ${id}`);
    } catch (error) {
      console.error('광고 종료 실패:', error);
      throw new Error('광고 종료에 실패했습니다.');
    }
  }

  // 게시기간 만료 체크 및 업데이트
  static async checkAndUpdateExpiredAdvertisements(): Promise<void> {
    try {
      // 임시로 인덱스 없이 작동하도록 단순화
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      const now = new Date();
      const expiredDocs = querySnapshot.docs.filter(doc => {
        const data = doc.data();
        const publishEndDate = data.publishEndDate?.toDate();
        return publishEndDate && publishEndDate <= now;
      });
      
      if (expiredDocs.length > 0) {
        const batch = writeBatch(db);
        
        expiredDocs.forEach((doc) => {
          batch.update(doc.ref, {
            isExpired: true,
            updatedAt: serverTimestamp()
          });
        });
        
        await batch.commit();
        console.log(`✅ ${expiredDocs.length}개의 만료된 광고 업데이트 완료`);
      }
    } catch (error) {
      console.error('만료된 광고 업데이트 실패:', error);
    }
  }
}
