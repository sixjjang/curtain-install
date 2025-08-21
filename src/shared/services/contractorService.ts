import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { ContractorInfo } from '../../types';

// 시공자 기본 정보 타입
export interface ContractorBasicInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  experience: string;
  serviceAreas: string[];
  bankName: string;
  bankAccount: string;
  profileImage?: string;
}

// 선호 지역 타입
export interface PreferredRegion {
  id: string;
  name: string;
  regions: string[];
  createdAt: Date;
}

export class ContractorService {
  // 시공자 기본 정보 저장
  static async saveBasicInfo(contractorId: string, basicInfo: ContractorBasicInfo): Promise<void> {
    try {
      const contractorRef = doc(db, 'users', contractorId);
      
      // 문서가 존재하는지 확인
      const contractorDoc = await getDoc(contractorRef);
      
      if (contractorDoc.exists()) {
        // 문서가 존재하면 업데이트
        const existingData = contractorDoc.data();
        await updateDoc(contractorRef, {
          name: basicInfo.name,
          phone: basicInfo.phone,
          email: basicInfo.email,
          location: {
            ...existingData.location,
            address: basicInfo.address
          },
          experience: basicInfo.experience,
          serviceAreas: basicInfo.serviceAreas,
          bankName: basicInfo.bankName,
          bankAccount: basicInfo.bankAccount,
          ...(basicInfo.profileImage && { profileImage: basicInfo.profileImage }),
          updatedAt: new Date()
        });
      } else {
        // 문서가 존재하지 않으면 새로 생성
        await setDoc(contractorRef, {
          name: basicInfo.name,
          phone: basicInfo.phone,
          email: basicInfo.email,
          location: {
            address: basicInfo.address,
            coordinates: {
              lat: 37.5665,
              lng: 126.9780
            }
          },
          experience: basicInfo.experience,
          serviceAreas: basicInfo.serviceAreas,
          bankName: basicInfo.bankName,
          bankAccount: basicInfo.bankAccount,
          ...(basicInfo.profileImage && { profileImage: basicInfo.profileImage }),
          level: 1,
          totalJobs: 0,
          completedJobs: 0,
          totalEarnings: 0,
          rating: 0,
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('기본 정보 저장 실패:', error);
      throw new Error('기본 정보 저장에 실패했습니다.');
    }
  }

  // 시공자 기본 정보 불러오기
  static async getBasicInfo(contractorId: string): Promise<ContractorBasicInfo | null> {
    try {
      const contractorRef = doc(db, 'users', contractorId);
      const contractorDoc = await getDoc(contractorRef);
      
      if (contractorDoc.exists()) {
        const contractorData = contractorDoc.data();
        return {
          name: contractorData.name || '',
          phone: contractorData.phone || '',
          email: contractorData.email || '',
          address: contractorData.location?.address || '',
          experience: contractorData.experience || '',
          serviceAreas: contractorData.serviceAreas || [],
          bankName: contractorData.bankName || '',
          bankAccount: contractorData.bankAccount || '',
          profileImage: contractorData.profileImage || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('기본 정보 불러오기 실패:', error);
      throw new Error('기본 정보를 불러올 수 없습니다.');
    }
  }

  // 시공자 통계 정보 불러오기
  static async getContractorStats(contractorId: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    totalEarnings: number;
    rating: number;
    level: number;
    points: number;
  }> {
    try {
      const contractorRef = doc(db, 'users', contractorId);
      const contractorDoc = await getDoc(contractorRef);
      
      if (contractorDoc.exists()) {
        const contractorData = contractorDoc.data();
        return {
          totalJobs: contractorData.totalJobs || 0,
          completedJobs: contractorData.completedJobs || 0,
          totalEarnings: contractorData.totalEarnings || 0,
          rating: contractorData.rating || 0,
          level: contractorData.level || 1,
          points: contractorData.points || 0
        };
      }
      
      // 기본값 반환
      return {
        totalJobs: 0,
        completedJobs: 0,
        totalEarnings: 0,
        rating: 0,
        level: 1,
        points: 0
      };
    } catch (error) {
      console.error('시공자 통계 정보 불러오기 실패:', error);
      // 에러 발생 시 기본값 반환
      return {
        totalJobs: 0,
        completedJobs: 0,
        totalEarnings: 0,
        rating: 0,
        level: 1,
        points: 0
      };
    }
  }

  // 시공자 정보 업데이트
  static async updateContractorProfile(contractorId: string, profileData: Partial<ContractorBasicInfo>): Promise<void> {
    try {
      const contractorRef = doc(db, 'users', contractorId);
      
      // 문서가 존재하는지 확인
      const contractorDoc = await getDoc(contractorRef);
      
      if (contractorDoc.exists()) {
        // 문서가 존재하면 업데이트
        const existingData = contractorDoc.data();
        const updateData: any = {
          updatedAt: new Date()
        };

        // 각 필드별로 업데이트
        if (profileData.name !== undefined) updateData.name = profileData.name;
        if (profileData.phone !== undefined) updateData.phone = profileData.phone;
        if (profileData.email !== undefined) updateData.email = profileData.email;
        if (profileData.address !== undefined) {
          updateData.location = {
            ...existingData.location,
            address: profileData.address
          };
        }
        if (profileData.experience !== undefined) updateData.experience = profileData.experience;
        if (profileData.serviceAreas !== undefined) updateData.serviceAreas = profileData.serviceAreas;
        if (profileData.bankName !== undefined) updateData.bankName = profileData.bankName;
        if (profileData.bankAccount !== undefined) updateData.bankAccount = profileData.bankAccount;
        if (profileData.profileImage !== undefined) updateData.profileImage = profileData.profileImage;

        await updateDoc(contractorRef, updateData);
      } else {
        // 문서가 존재하지 않으면 새로 생성
        await setDoc(contractorRef, {
          ...profileData,
          location: {
            address: profileData.address || '',
            coordinates: {
              lat: 37.5665,
              lng: 126.9780
            }
          },
          level: 1,
          totalJobs: 0,
          completedJobs: 0,
          totalEarnings: 0,
          rating: 0,
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('시공자 프로필 업데이트 실패:', error);
      throw new Error('프로필 업데이트에 실패했습니다.');
    }
  }

  // 선호 지역 저장
  static async savePreferredRegion(contractorId: string, name: string, regions: string[]): Promise<string> {
    try {
      const preferredRegionsRef = collection(db, 'preferredRegions');
      const docRef = await addDoc(preferredRegionsRef, {
        contractorId,
        name,
        regions,
        createdAt: new Date()
      });
      
      console.log('선호 지역 저장 완료:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('선호 지역 저장 실패:', error);
      throw new Error('선호 지역 저장에 실패했습니다.');
    }
  }

  // 선호 지역 목록 불러오기
  static async getPreferredRegions(contractorId: string): Promise<PreferredRegion[]> {
    try {
      const preferredRegionsRef = collection(db, 'preferredRegions');
      const q = query(preferredRegionsRef, where('contractorId', '==', contractorId));
      const querySnapshot = await getDocs(q);
      
      const preferredRegions: PreferredRegion[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        preferredRegions.push({
          id: doc.id,
          name: data.name,
          regions: data.regions,
          createdAt: data.createdAt.toDate()
        });
      });
      
      // 생성일 기준으로 정렬 (최신순)
      preferredRegions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      console.log('선호 지역 목록 불러오기 완료:', preferredRegions.length, '개');
      return preferredRegions;
    } catch (error) {
      console.error('선호 지역 목록 불러오기 실패:', error);
      throw new Error('선호 지역 목록을 불러올 수 없습니다.');
    }
  }

  // 선호 지역 삭제
  static async deletePreferredRegion(regionId: string): Promise<void> {
    try {
      const regionRef = doc(db, 'preferredRegions', regionId);
      await deleteDoc(regionRef);
      
      console.log('선호 지역 삭제 완료:', regionId);
    } catch (error) {
      console.error('선호 지역 삭제 실패:', error);
      throw new Error('선호 지역 삭제에 실패했습니다.');
    }
  }

  // 선호 지역 업데이트
  static async updatePreferredRegion(regionId: string, name: string, regions: string[]): Promise<void> {
    try {
      const regionRef = doc(db, 'preferredRegions', regionId);
      await updateDoc(regionRef, {
        name,
        regions,
        updatedAt: new Date()
      });
      
      console.log('선호 지역 업데이트 완료:', regionId);
    } catch (error) {
      console.error('선호 지역 업데이트 실패:', error);
      throw new Error('선호 지역 업데이트에 실패했습니다.');
    }
  }

  // 모든 시공자 목록 불러오기
  static async getAllContractors(): Promise<any[]> {
    try {
      const contractorsRef = collection(db, 'users');
      const querySnapshot = await getDocs(contractorsRef);
      const contractors: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'contractor') {
          contractors.push({
            id: doc.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            businessName: data.contractor?.businessName || '',
            experience: data.experience || '',
            level: data.level || 1,
            rating: data.rating || 0,
            totalJobs: data.totalJobs || 0,
            completedJobs: data.completedJobs || 0,
            profileImage: data.profileImage,
            approvalStatus: data.approvalStatus,
            location: data.location,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        }
      });
      
      return contractors;
    } catch (error) {
      console.error('시공자 목록 불러오기 실패:', error);
      throw new Error('시공자 목록을 불러올 수 없습니다.');
    }
  }

  // 시공자 평점 업데이트 (만족도 조사 결과 반영)
  static async updateContractorRating(contractorId: string, newRating: number): Promise<void> {
    try {
      if (newRating < 1 || newRating > 5) {
        throw new Error('평점은 1-5 사이여야 합니다.');
      }

      const contractorRef = doc(db, 'users', contractorId);
      const contractorDoc = await getDoc(contractorRef);
      
      if (!contractorDoc.exists()) {
        throw new Error('시공자를 찾을 수 없습니다.');
      }

      const contractorData = contractorDoc.data();
      const currentRating = contractorData.rating || 0;
      const totalRatings = contractorData.totalRatings || 0;
      
      // 새로운 평균 평점 계산
      const newTotalRatings = totalRatings + 1;
      const newAverageRating = ((currentRating * totalRatings) + newRating) / newTotalRatings;
      
      // 평점 업데이트
      await updateDoc(contractorRef, {
        rating: Math.round(newAverageRating * 10) / 10, // 소수점 첫째 자리까지
        totalRatings: newTotalRatings,
        updatedAt: new Date()
      });
      
      console.log(`✅ 시공자 ${contractorId} 평점 업데이트: ${currentRating} → ${Math.round(newAverageRating * 10) / 10} (총 ${newTotalRatings}개 평가)`);
    } catch (error) {
      console.error('시공자 평점 업데이트 실패:', error);
      throw new Error('시공자 평점을 업데이트할 수 없습니다.');
    }
  }
}
