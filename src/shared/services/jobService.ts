import { collection, getDocs, query, where, orderBy, doc, updateDoc, addDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ConstructionJob } from '../../types';

export class JobService {
  // 6자리 대문자와 숫자 조합 ID 생성 (중복 방지)
  private static async generateJobId(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // ID 중복 확인
      try {
        const jobRef = doc(db, 'constructionJobs', result);
        const jobDoc = await getDoc(jobRef);
        if (!jobDoc.exists()) {
          return result; // 중복되지 않는 ID 반환
        }
      } catch (error) {
        // 에러 발생 시 해당 ID 사용
        return result;
      }
      
      attempts++;
    }
    
    // 최대 시도 횟수 초과 시 타임스탬프 기반 ID 생성
    const timestamp = Date.now().toString(36).toUpperCase();
    return timestamp.slice(-6).padStart(6, 'A');
  }

  // 안전한 날짜 변환 함수
  private static safeDateConversion(dateValue: any): Date | null {
    if (!dateValue) return null;
    
    // 이미 Date 객체인 경우
    if (dateValue instanceof Date) return dateValue;
    
    // Firestore Timestamp인 경우
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }
    
    // 문자열인 경우
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // 숫자인 경우 (timestamp)
    if (typeof dateValue === 'number') {
      return new Date(dateValue);
    }
    
    return null;
  }

  // 모든 작업 가져오기
  static async getAllJobs(): Promise<ConstructionJob[]> {
    try {
      const jobsRef = collection(db, 'constructionJobs');
      const q = query(jobsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const jobs: ConstructionJob[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jobs.push({
          id: doc.id,
          ...data,
          createdAt: this.safeDateConversion(data.createdAt) || new Date(),
          updatedAt: this.safeDateConversion(data.updatedAt) || new Date(),
          scheduledDate: this.safeDateConversion(data.scheduledDate),
          completedDate: this.safeDateConversion(data.completedDate),
          progressHistory: data.progressHistory?.map((step: any) => ({
            ...step,
            timestamp: this.safeDateConversion(step.timestamp) || new Date()
          })) || []
        } as ConstructionJob);
      });
      
      return jobs;
    } catch (error) {
      console.error('작업 목록 가져오기 실패:', error);
      throw new Error('작업 목록을 가져올 수 없습니다.');
    }
  }

  // 상태별 작업 개수 가져오기
  static async getJobCountsByStatus(): Promise<{ [key: string]: number }> {
    try {
      const jobs = await this.getAllJobs();
      const counts = {
        pending: 0,
        assigned: 0,
        product_preparing: 0,
        product_ready: 0,
        pickup_completed: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };
      
      jobs.forEach(job => {
        counts[job.status]++;
      });
      
      return counts;
    } catch (error) {
      console.error('작업 상태별 개수 가져오기 실패:', error);
      return {
        pending: 0,
        assigned: 0,
        product_preparing: 0,
        product_ready: 0,
        pickup_completed: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };
    }
  }

  // 상태별 작업 가져오기
  static async getJobsByStatus(status: ConstructionJob['status']): Promise<ConstructionJob[]> {
    try {
      const jobsRef = collection(db, 'constructionJobs');
      // 임시로 정렬 없이 필터링만 사용 (인덱스 생성 후 orderBy 추가 예정)
      const q = query(
        jobsRef, 
        where('status', '==', status)
      );
      const querySnapshot = await getDocs(q);
      
      const jobs: ConstructionJob[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jobs.push({
          id: doc.id,
          ...data,
          createdAt: this.safeDateConversion(data.createdAt) || new Date(),
          updatedAt: this.safeDateConversion(data.updatedAt) || new Date(),
          scheduledDate: this.safeDateConversion(data.scheduledDate),
          completedDate: this.safeDateConversion(data.completedDate),
          progressHistory: data.progressHistory?.map((step: any) => ({
            ...step,
            timestamp: this.safeDateConversion(step.timestamp) || new Date()
          })) || []
        } as ConstructionJob);
      });
      
      return jobs;
    } catch (error) {
      console.error(`${status} 상태 작업 가져오기 실패:`, error);
      throw new Error(`${status} 상태 작업을 가져올 수 없습니다.`);
    }
  }

  // 상태별 작업 가져오기 (기간 필터링 포함)
  static async getJobsByStatusWithPeriod(
    status: ConstructionJob['status'], 
    period: 'daily' | 'weekly' | 'monthly' | 'all'
  ): Promise<ConstructionJob[]> {
    try {
      const jobsRef = collection(db, 'constructionJobs');
      const q = query(
        jobsRef, 
        where('status', '==', status)
      );
      const querySnapshot = await getDocs(q);
      
      const jobs: ConstructionJob[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jobs.push({
          id: doc.id,
          ...data,
          createdAt: this.safeDateConversion(data.createdAt) || new Date(),
          updatedAt: this.safeDateConversion(data.updatedAt) || new Date(),
          scheduledDate: this.safeDateConversion(data.scheduledDate),
          completedDate: this.safeDateConversion(data.completedDate),
          progressHistory: data.progressHistory?.map((step: any) => ({
            ...step,
            timestamp: this.safeDateConversion(step.timestamp) || new Date()
          })) || []
        } as ConstructionJob);
      });

      // 기간별 필터링
      if (period !== 'all') {
        const now = new Date();
        const filteredJobs = jobs.filter(job => {
          let targetDate: Date;
          
          // 완료된 작업의 경우 completedDate 사용, 그 외에는 updatedAt 사용
          if (status === 'completed' && job.completedDate) {
            targetDate = job.completedDate;
          } else {
            targetDate = job.updatedAt;
          }

          switch (period) {
            case 'daily':
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              return targetDate >= today;
            case 'weekly':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return targetDate >= weekAgo;
            case 'monthly':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              return targetDate >= monthAgo;
            default:
              return true;
          }
        });
        
        return filteredJobs;
      }
      
      return jobs;
    } catch (error) {
      console.error(`${status} 상태 작업 가져오기 실패:`, error);
      throw new Error(`${status} 상태 작업을 가져올 수 없습니다.`);
    }
  }

  // 작업 상태 업데이트 (진행 시간 기록 포함)
  static async updateJobStatus(jobId: string, status: ConstructionJob['status'], contractorId?: string, note?: string): Promise<void> {
    try {
      const jobRef = doc(db, 'constructionJobs', jobId);
      
      // 현재 작업 정보 가져오기
      const jobDoc = await getDoc(jobRef);
      if (!jobDoc.exists()) {
        throw new Error('작업을 찾을 수 없습니다.');
      }
      
      const currentData = jobDoc.data();
      const currentProgressHistory = currentData.progressHistory || [];
      
      // 새로운 진행 단계 추가
      const newProgressStep = {
        status,
        timestamp: new Date(),
        contractorId,
        note
      };
      
      const updatedProgressHistory = [...currentProgressHistory, newProgressStep];
      
      await updateDoc(jobRef, {
        status,
        updatedAt: new Date(),
        progressHistory: updatedProgressHistory,
        ...(status === 'completed' && { completedDate: new Date() })
      });
      
      console.log(`작업 ${jobId}의 상태가 ${status}로 업데이트되었습니다. (시간: ${newProgressStep.timestamp})`);
    } catch (error) {
      console.error('작업 상태 업데이트 실패:', error);
      throw new Error('작업 상태를 업데이트할 수 없습니다.');
    }
  }

  // 최종 금액 업데이트
  static async updateFinalAmount(jobId: string, finalAmount: number): Promise<void> {
    try {
      const jobRef = doc(db, 'constructionJobs', jobId);
      await updateDoc(jobRef, {
        finalAmount,
        updatedAt: new Date()
      });
      
      console.log(`작업 ${jobId}의 최종 금액이 ${finalAmount.toLocaleString()}원으로 업데이트되었습니다.`);
    } catch (error) {
      console.error('최종 금액 업데이트 실패:', error);
      throw new Error('최종 금액을 업데이트할 수 없습니다.');
    }
  }

  // 고객 만족도 평가 업데이트
  static async updateCustomerSatisfaction(jobId: string, satisfaction: number): Promise<void> {
    try {
      if (satisfaction < 1 || satisfaction > 5) {
        throw new Error('만족도 점수는 1-5 사이여야 합니다.');
      }

      const jobRef = doc(db, 'constructionJobs', jobId);
      await updateDoc(jobRef, {
        customerSatisfaction: satisfaction,
        updatedAt: new Date()
      });
      
      console.log(`작업 ${jobId}의 고객 만족도가 ${satisfaction}/5로 업데이트되었습니다.`);
    } catch (error) {
      console.error('고객 만족도 업데이트 실패:', error);
      throw new Error('고객 만족도를 업데이트할 수 없습니다.');
    }
  }

  // 새 작업 생성
  static async createJob(jobData: Omit<ConstructionJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('작업 생성 시작:', jobData);
      
      const jobId = await this.generateJobId();
      console.log('생성된 작업 ID:', jobId);
      
      const jobRef = doc(db, 'constructionJobs', jobId);
      
      // 초기 진행 기록 생성
      const initialProgressStep = {
        status: jobData.status,
        timestamp: new Date(),
        contractorId: jobData.contractorId || null, // undefined 대신 null 사용
        note: '작업 생성'
      };
      
      // undefined 값 제거를 위한 데이터 정리 함수
      const cleanObject = (obj: any): any => {
        if (obj === null || obj === undefined) return null;
        if (typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
          return obj.map(cleanObject).filter(item => item !== null && item !== undefined);
        }
        
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            // null은 허용하지만 undefined는 제거
            cleaned[key] = cleanObject(value);
          }
        }
        return cleaned;
      };

      const jobDocument = {
        ...cleanObject(jobData),
        createdAt: new Date(),
        updatedAt: new Date(),
        progressHistory: [initialProgressStep]
      };
      
      console.log('저장할 작업 데이터:', jobDocument);
      
      // undefined 값이 있는지 확인
      const checkForUndefined = (obj: any, path: string = ''): void => {
        if (obj === undefined) {
          console.error(`❌ undefined found at path: ${path}`);
          return;
        }
        if (obj === null || typeof obj !== 'object') return;
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (value === undefined) {
            console.error(`❌ undefined found at path: ${currentPath}`);
          } else if (typeof value === 'object' && value !== null) {
            checkForUndefined(value, currentPath);
          }
        }
      };
      
      checkForUndefined(jobDocument);
      
      await setDoc(jobRef, jobDocument);
      console.log('작업 생성 완료:', jobId);
      
      return jobId;
    } catch (error) {
      console.error('작업 생성 실패:', error);
      console.error('작업 데이터:', jobData);
      throw new Error(`작업을 생성할 수 없습니다: ${error}`);
    }
  }

  // ID로 작업 가져오기
  static async getJobById(jobId: string): Promise<ConstructionJob> {
    try {
      const jobRef = doc(db, 'constructionJobs', jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        throw new Error('작업을 찾을 수 없습니다.');
      }
      
      const data = jobDoc.data();
      return {
        id: jobDoc.id,
        ...data,
        createdAt: this.safeDateConversion(data.createdAt) || new Date(),
        updatedAt: this.safeDateConversion(data.updatedAt) || new Date(),
        scheduledDate: this.safeDateConversion(data.scheduledDate),
        completedDate: this.safeDateConversion(data.completedDate),
        progressHistory: data.progressHistory?.map((step: any) => ({
          ...step,
          timestamp: this.safeDateConversion(step.timestamp) || new Date()
        })) || []
      } as ConstructionJob;
    } catch (error) {
      console.error('작업 상세 정보 가져오기 실패:', error);
      throw new Error('작업 상세 정보를 가져올 수 없습니다.');
    }
  }

  // 작업 삭제
  static async deleteJob(jobId: string): Promise<void> {
    try {
      const jobRef = doc(db, 'constructionJobs', jobId);
      await deleteDoc(jobRef);
    } catch (error) {
      console.error('작업 삭제 실패:', error);
      throw new Error('작업을 삭제할 수 없습니다.');
    }
  }

  // 테스트용 작업 데이터 생성
  static async createTestJobs(): Promise<void> {
    try {
      // 먼저 테스트 사용자들을 생성
      const testUsers = [
        {
          id: 'seller1',
          email: 'seller1@test.com',
          name: '김판매',
          phone: '010-1111-1111',
          role: 'seller' as const,
          companyName: '커튼하우스',
          businessNumber: '123-45-67890',
          address: '서울시 강남구',
          rating: 4.5,
          totalSales: 15000000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'seller2',
          email: 'seller2@test.com',
          name: '이판매',
          phone: '010-2222-2222',
          role: 'seller' as const,
          companyName: '블라인드월드',
          businessNumber: '234-56-78901',
          address: '서울시 서초구',
          rating: 4.2,
          totalSales: 12000000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'seller3',
          email: 'seller3@test.com',
          name: '박판매',
          phone: '010-3333-3333',
          role: 'seller' as const,
          companyName: '커튼마스터',
          businessNumber: '345-67-89012',
          address: '서울시 송파구',
          rating: 4.8,
          totalSales: 20000000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'customer1',
          email: 'customer1@test.com',
          name: '김고객',
          phone: '010-4444-4444',
          role: 'customer' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'customer2',
          email: 'customer2@test.com',
          name: '이고객',
          phone: '010-5555-5555',
          role: 'customer' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'customer3',
          email: 'customer3@test.com',
          name: '박고객',
          phone: '010-6666-6666',
          role: 'customer' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'customer4',
          email: 'customer4@test.com',
          name: '최고객',
          phone: '010-7777-7777',
          role: 'customer' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'customer5',
          email: 'customer5@test.com',
          name: '정고객',
          phone: '010-8888-8888',
          role: 'customer' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'contractor1',
          email: 'contractor1@test.com',
          name: '김시공',
          phone: '010-9999-9999',
          role: 'contractor' as const,
          level: 3,
          experience: 24,
          totalJobs: 45,
          rating: 4.6,
          skills: ['커튼설치', '블라인드설치'],
          isAvailable: true,
          location: {
            lat: 37.5665,
            lng: 126.9780,
            address: '서울시 강남구'
          },
          serviceAreas: ['강남구', '서초구'],
          bankAccount: '123-456789-01-234',
          bankName: '신한은행',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'contractor2',
          email: 'contractor2@test.com',
          name: '이시공',
          phone: '010-0000-0001',
          role: 'contractor' as const,
          level: 2,
          experience: 12,
          totalJobs: 23,
          rating: 4.3,
          skills: ['커튼설치'],
          isAvailable: true,
          location: {
            lat: 37.5519,
            lng: 126.9251,
            address: '서울시 마포구'
          },
          serviceAreas: ['마포구', '서대문구'],
          bankAccount: '234-567890-12-345',
          bankName: '국민은행',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'contractor3',
          email: 'contractor3@test.com',
          name: '박시공',
          phone: '010-0000-0002',
          role: 'contractor' as const,
          level: 1,
          experience: 6,
          totalJobs: 8,
          rating: 4.1,
          skills: ['커튼설치'],
          isAvailable: true,
          location: {
            lat: 37.5216,
            lng: 126.9242,
            address: '서울시 영등포구'
          },
          serviceAreas: ['영등포구'],
          bankAccount: '345-678901-23-456',
          bankName: '우리은행',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // 테스트 사용자들을 Firestore에 저장
      for (const userData of testUsers) {
        await setDoc(doc(db, 'users', userData.id), userData);
      }

      const testJobs = [
        {
          sellerId: 'seller1',
          customerId: 'customer1',
          title: '거실 커튼 설치',
          description: '거실 창문 커튼 설치 작업입니다. 블라인드와 커튼 모두 설치 필요합니다.',
          address: '서울시 강남구 테헤란로 123',
          coordinates: { lat: 37.5665, lng: 126.9780 },
          budget: { min: 50, max: 80 },
          items: [
            { name: '커튼', quantity: 2, unitPrice: 150000, totalPrice: 300000 },
            { name: '블라인드', quantity: 1, unitPrice: 80000, totalPrice: 80000 }
          ],
          status: 'pending' as const,
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
          images: [],
          requirements: ['블라인드 설치', '커튼 설치', '정리정돈']
        },
        {
          sellerId: 'seller2',
          customerId: 'customer2',
          contractorId: 'contractor1',
          title: '침실 커튼 교체',
          description: '침실 커튼을 새로운 것으로 교체하는 작업입니다.',
          address: '서울시 서초구 서초대로 456',
          coordinates: { lat: 37.5013, lng: 127.0246 },
          budget: { min: 30, max: 50 },
          items: [
            { name: '커튼', quantity: 1, unitPrice: 120000, totalPrice: 120000 }
          ],
          status: 'in_progress' as const,
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2일 후
          images: [],
          requirements: ['기존 커튼 제거', '새 커튼 설치']
        },
        {
          sellerId: 'seller1',
          customerId: 'customer3',
          contractorId: 'contractor2',
          title: '사무실 블라인드 설치',
          description: '사무실 창문에 블라인드를 설치하는 작업입니다.',
          address: '서울시 마포구 와우산로 789',
          coordinates: { lat: 37.5519, lng: 126.9251 },
          budget: { min: 100, max: 150 },
          items: [
            { name: '블라인드', quantity: 3, unitPrice: 45000, totalPrice: 135000 }
          ],
          status: 'completed' as const,
          completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3일 전 완료
          finalAmount: 135000,
          customerSatisfaction: 5,
          images: [],
          requirements: ['블라인드 설치', '정리정돈']
        },
        {
          sellerId: 'seller3',
          customerId: 'customer4',
          title: '주방 커튼 설치',
          description: '주방 창문에 커튼을 설치하는 작업입니다.',
          address: '서울시 송파구 올림픽로 321',
          coordinates: { lat: 37.5146, lng: 127.1059 },
          budget: { min: 40, max: 60 },
          items: [
            { name: '커튼', quantity: 1, unitPrice: 50000, totalPrice: 50000 }
          ],
          status: 'cancelled' as const,
          images: [],
          requirements: ['커튼 설치', '정리정돈']
        },
        {
          sellerId: 'seller2',
          customerId: 'customer5',
          contractorId: 'contractor3',
          title: '아이방 커튼 설치',
          description: '아이방 창문에 귀여운 커튼을 설치하는 작업입니다.',
          address: '서울시 영등포구 여의대로 654',
          coordinates: { lat: 37.5216, lng: 126.9242 },
          budget: { min: 35, max: 55 },
          items: [
            { name: '커튼', quantity: 1, unitPrice: 45000, totalPrice: 45000 }
          ],
          status: 'completed' as const,
          completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1일 전 완료
          finalAmount: 48000,
          customerSatisfaction: 4,
          images: [],
          requirements: ['커튼 설치', '정리정돈']
        }
      ];

      for (const jobData of testJobs) {
        await this.createJob(jobData);
      }

      console.log('테스트 사용자 및 작업 데이터가 생성되었습니다.');
    } catch (error) {
      console.error('테스트 작업 데이터 생성 실패:', error);
      throw new Error('테스트 작업 데이터를 생성할 수 없습니다.');
    }
  }
}
