import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { JobCompensation, JobScheduleChange } from '../../types';
import { SystemSettingsService } from './systemSettingsService';
import { JobService } from './jobService';

export class JobCompensationService {
  // 제품 준비 미완료 보상 처리
  static async processProductNotReadyCompensation(
    jobId: string,
    contractorId: string,
    contractorName: string,
    reason: string,
    adminId: string
  ): Promise<void> {
    try {
      // 1. 작업 정보 조회
      const job = await JobService.getJobById(jobId);
      if (!job) {
        throw new Error('작업을 찾을 수 없습니다.');
      }

      // 2. 보상 정책 조회
      const compensationPolicy = await SystemSettingsService.getCompensationPolicy();
      const compensationAmount = (job.budget?.max || 0) * (compensationPolicy.productNotReadyRate / 100);

      // 3. 보상 기록 저장
      const compensationData: Omit<JobCompensation, 'id'> = {
        jobId,
        contractorId,
        contractorName,
        compensationType: 'product_not_ready',
        compensationAmount,
        compensationRate: compensationPolicy.productNotReadyRate,
        reason,
        compensatedAt: new Date(),
        processedBy: adminId
      };

      await addDoc(collection(db, 'jobCompensations'), {
        ...compensationData,
        compensatedAt: serverTimestamp()
      });

      // 4. 작업 상태 업데이트
      await JobService.updateJobStatus(jobId, 'product_not_ready', contractorId, reason);

      console.log(`✅ 제품 준비 미완료 보상 처리 완료: ${jobId} (보상액: ${compensationAmount.toLocaleString()}원)`);
    } catch (error) {
      console.error('제품 준비 미완료 보상 처리 실패:', error);
      throw new Error('보상 처리를 할 수 없습니다.');
    }
  }

  // 소비자 부재 보상 처리
  static async processCustomerAbsentCompensation(
    jobId: string,
    contractorId: string,
    contractorName: string,
    reason: string,
    adminId: string
  ): Promise<void> {
    try {
      // 1. 작업 정보 조회
      const job = await JobService.getJobById(jobId);
      if (!job) {
        throw new Error('작업을 찾을 수 없습니다.');
      }

      // 2. 보상 정책 조회
      const compensationPolicy = await SystemSettingsService.getCompensationPolicy();
      const compensationAmount = (job.budget?.max || 0) * (compensationPolicy.customerAbsentRate / 100);

      // 3. 보상 기록 저장
      const compensationData: Omit<JobCompensation, 'id'> = {
        jobId,
        contractorId,
        contractorName,
        compensationType: 'customer_absent',
        compensationAmount,
        compensationRate: compensationPolicy.customerAbsentRate,
        reason,
        compensatedAt: new Date(),
        processedBy: adminId
      };

      await addDoc(collection(db, 'jobCompensations'), {
        ...compensationData,
        compensatedAt: serverTimestamp()
      });

      // 4. 작업 상태 업데이트
      await JobService.updateJobStatus(jobId, 'customer_absent', contractorId, reason);

      console.log(`✅ 소비자 부재 보상 처리 완료: ${jobId} (보상액: ${compensationAmount.toLocaleString()}원)`);
    } catch (error) {
      console.error('소비자 부재 보상 처리 실패:', error);
      throw new Error('보상 처리를 할 수 없습니다.');
    }
  }

  // 일정 변경 처리
  static async processScheduleChange(
    jobId: string,
    contractorId: string,
    contractorName: string,
    newScheduledDate: Date,
    changeReason: string
  ): Promise<void> {
    try {
      // 1. 작업 정보 조회
      const job = await JobService.getJobById(jobId);
      if (!job) {
        throw new Error('작업을 찾을 수 없습니다.');
      }

      if (!job.scheduledDate) {
        throw new Error('기존 일정이 설정되지 않았습니다.');
      }

      // 2. 보상 정책 조회
      const compensationPolicy = await SystemSettingsService.getCompensationPolicy();
      const feeAmount = (job.budget?.max || 0) * (compensationPolicy.scheduleChangeFeeRate / 100);

      // 3. 일정 변경 기록 저장
      const scheduleChangeData: Omit<JobScheduleChange, 'id'> = {
        jobId,
        contractorId,
        contractorName,
        oldScheduledDate: job.scheduledDate,
        newScheduledDate,
        changeReason,
        changedAt: new Date(),
        changedBy: contractorId,
        feeAmount: feeAmount > 0 ? feeAmount : undefined,
        feeRate: compensationPolicy.scheduleChangeFeeRate > 0 ? compensationPolicy.scheduleChangeFeeRate : undefined
      };

      await addDoc(collection(db, 'jobScheduleChanges'), {
        ...scheduleChangeData,
        oldScheduledDate: serverTimestamp(),
        newScheduledDate: serverTimestamp(),
        changedAt: serverTimestamp()
      });

      // 4. 작업 일정 업데이트
      const jobRef = doc(db, 'constructionJobs', jobId);
      await updateDoc(jobRef, {
        scheduledDate: newScheduledDate,
        status: 'schedule_changed',
        updatedAt: serverTimestamp()
      });

      // 5. 진행 기록 추가
      await JobService.updateJobStatus(jobId, 'schedule_changed', contractorId, `일정 변경: ${changeReason}`);

      console.log(`✅ 일정 변경 처리 완료: ${jobId} (새 일정: ${newScheduledDate.toLocaleDateString()})`);
    } catch (error) {
      console.error('일정 변경 처리 실패:', error);
      throw new Error('일정을 변경할 수 없습니다.');
    }
  }

  // 보상 기록 조회 (시공자별)
  static async getContractorCompensations(contractorId: string): Promise<JobCompensation[]> {
    try {
      const q = query(
        collection(db, 'jobCompensations'),
        where('contractorId', '==', contractorId),
        orderBy('compensatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        compensatedAt: doc.data().compensatedAt?.toDate() || new Date()
      })) as JobCompensation[];
      
    } catch (error) {
      console.error('시공자 보상 기록 조회 실패:', error);
      return [];
    }
  }

  // 일정 변경 기록 조회 (작업별)
  static async getJobScheduleChanges(jobId: string): Promise<JobScheduleChange[]> {
    try {
      const q = query(
        collection(db, 'jobScheduleChanges'),
        where('jobId', '==', jobId),
        orderBy('changedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        oldScheduledDate: doc.data().oldScheduledDate?.toDate() || new Date(),
        newScheduledDate: doc.data().newScheduledDate?.toDate() || new Date(),
        changedAt: doc.data().changedAt?.toDate() || new Date()
      })) as JobScheduleChange[];
      
    } catch (error) {
      console.error('작업 일정 변경 기록 조회 실패:', error);
      return [];
    }
  }

  // 전체 보상 통계 조회 (관리자용)
  static async getCompensationStats(): Promise<{
    totalCompensations: number;
    totalCompensationAmount: number;
    todayCompensations: number;
    todayCompensationAmount: number;
    compensationByType: {
      product_not_ready: { count: number; amount: number };
      customer_absent: { count: number; amount: number };
      schedule_change: { count: number; amount: number };
    };
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // 전체 보상 조회
      const totalQuery = query(collection(db, 'jobCompensations'));
      const totalSnapshot = await getDocs(totalQuery);
      
      // 오늘 보상 조회
      const todayQuery = query(
        collection(db, 'jobCompensations'),
        where('compensatedAt', '>=', Timestamp.fromDate(today)),
        where('compensatedAt', '<', Timestamp.fromDate(tomorrow))
      );
      const todaySnapshot = await getDocs(todayQuery);
      
      // 통계 계산
      let totalAmount = 0;
      let todayAmount = 0;
      const typeStats = {
        product_not_ready: { count: 0, amount: 0 },
        customer_absent: { count: 0, amount: 0 },
        schedule_change: { count: 0, amount: 0 }
      };
      
      totalSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalAmount += data.compensationAmount || 0;
        
        const type = data.compensationType;
        if (typeStats[type as keyof typeof typeStats]) {
          typeStats[type as keyof typeof typeStats].count++;
          typeStats[type as keyof typeof typeStats].amount += data.compensationAmount || 0;
        }
      });
      
      todaySnapshot.docs.forEach(doc => {
        const data = doc.data();
        todayAmount += data.compensationAmount || 0;
      });
      
      return {
        totalCompensations: totalSnapshot.size,
        totalCompensationAmount: totalAmount,
        todayCompensations: todaySnapshot.size,
        todayCompensationAmount: todayAmount,
        compensationByType: typeStats
      };
      
    } catch (error) {
      console.error('보상 통계 조회 실패:', error);
      return {
        totalCompensations: 0,
        totalCompensationAmount: 0,
        todayCompensations: 0,
        todayCompensationAmount: 0,
        compensationByType: {
          product_not_ready: { count: 0, amount: 0 },
          customer_absent: { count: 0, amount: 0 },
          schedule_change: { count: 0, amount: 0 }
        }
      };
    }
  }
}
