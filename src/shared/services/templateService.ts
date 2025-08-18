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
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { JobDescriptionTemplate, JobRequirementBadge } from '../../types';

export class TemplateService {
  // 설명 템플릿 저장
  static async saveDescriptionTemplate(template: Omit<JobDescriptionTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const templateRef = await addDoc(collection(db, 'jobDescriptionTemplates'), {
        ...template,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return templateRef.id;
    } catch (error) {
      console.error('설명 템플릿 저장 실패:', error);
      throw new Error('설명 템플릿 저장에 실패했습니다.');
    }
  }

  // 설명 템플릿 수정
  static async updateDescriptionTemplate(id: string, template: Partial<JobDescriptionTemplate>): Promise<void> {
    try {
      const templateRef = doc(db, 'jobDescriptionTemplates', id);
      await updateDoc(templateRef, {
        ...template,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('설명 템플릿 수정 실패:', error);
      throw new Error('설명 템플릿 수정에 실패했습니다.');
    }
  }

  // 설명 템플릿 삭제
  static async deleteDescriptionTemplate(id: string): Promise<void> {
    try {
      const templateRef = doc(db, 'jobDescriptionTemplates', id);
      await deleteDoc(templateRef);
    } catch (error) {
      console.error('설명 템플릿 삭제 실패:', error);
      throw new Error('설명 템플릿 삭제에 실패했습니다.');
    }
  }

  // 모든 설명 템플릿 가져오기
  static async getAllDescriptionTemplates(): Promise<JobDescriptionTemplate[]> {
    try {
      const q = query(
        collection(db, 'jobDescriptionTemplates'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const templates: JobDescriptionTemplate[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        templates.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as JobDescriptionTemplate);
      });
      
      return templates;
    } catch (error) {
      console.error('설명 템플릿 목록 가져오기 실패:', error);
      throw new Error('설명 템플릿 목록을 가져올 수 없습니다.');
    }
  }

  // 카테고리별 설명 템플릿 가져오기
  static async getDescriptionTemplatesByCategory(category: JobDescriptionTemplate['category']): Promise<JobDescriptionTemplate[]> {
    try {
      const q = query(
        collection(db, 'jobDescriptionTemplates'),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const templates: JobDescriptionTemplate[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        templates.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as JobDescriptionTemplate);
      });
      
      return templates;
    } catch (error) {
      console.error('카테고리별 설명 템플릿 가져오기 실패:', error);
      throw new Error('카테고리별 설명 템플릿을 가져올 수 없습니다.');
    }
  }

  // 뱃지 저장
  static async saveRequirementBadge(badge: Omit<JobRequirementBadge, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const badgeRef = await addDoc(collection(db, 'jobRequirementBadges'), {
        ...badge,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return badgeRef.id;
    } catch (error) {
      console.error('뱃지 저장 실패:', error);
      throw new Error('뱃지 저장에 실패했습니다.');
    }
  }

  // 뱃지 수정
  static async updateRequirementBadge(id: string, badge: Partial<JobRequirementBadge>): Promise<void> {
    try {
      const badgeRef = doc(db, 'jobRequirementBadges', id);
      await updateDoc(badgeRef, {
        ...badge,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('뱃지 수정 실패:', error);
      throw new Error('뱃지 수정에 실패했습니다.');
    }
  }

  // 뱃지 삭제
  static async deleteRequirementBadge(id: string): Promise<void> {
    try {
      const badgeRef = doc(db, 'jobRequirementBadges', id);
      await deleteDoc(badgeRef);
    } catch (error) {
      console.error('뱃지 삭제 실패:', error);
      throw new Error('뱃지 삭제에 실패했습니다.');
    }
  }

  // 모든 뱃지 가져오기
  static async getAllRequirementBadges(): Promise<JobRequirementBadge[]> {
    try {
      const q = query(
        collection(db, 'jobRequirementBadges'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const badges: JobRequirementBadge[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        badges.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as JobRequirementBadge);
      });
      
      return badges;
    } catch (error) {
      console.error('뱃지 목록 가져오기 실패:', error);
      throw new Error('뱃지 목록을 가져올 수 없습니다.');
    }
  }
}
