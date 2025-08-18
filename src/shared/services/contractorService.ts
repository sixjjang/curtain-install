import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
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
}
