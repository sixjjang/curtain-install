import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { JobCancellation } from '../../types';
import { SystemSettingsService } from './systemSettingsService';

export class JobCancellationService {
  // 시공자의 작업 취소 가능 여부 확인
  static async canCancelJob(jobId: string, contractorId: string): Promise<{
    canCancel: boolean;
    reason?: string;
    cancellationNumber?: number;
    totalCancellationsToday?: number;
    maxCancellationHours?: number;
    maxDailyCancellations?: number;
    feeAmount?: number;
    feeRate?: number;
    requiresFee?: boolean;
  }> {
    try {
      // 1. 시스템 설정 조회
      const cancellationPolicy = await SystemSettingsService.getCancellationPolicy();
      
      // 2. 작업 정보 조회 (JobService에서 가져와야 함)
      const { JobService } = await import('./jobService');
      const job = await JobService.getJobById(jobId);
      
      if (!job) {
        return { canCancel: false, reason: '작업을 찾을 수 없습니다.' };
      }
      
      if (job.contractorId !== contractorId) {
        return { canCancel: false, reason: '해당 작업의 시공자가 아닙니다.' };
      }
      
      if (job.status !== 'assigned') {
        return { canCancel: false, reason: '수락된 작업만 취소할 수 있습니다.' };
      }
      
      // 3. 수락 시간 확인
      if (!job.acceptedAt) {
        return { canCancel: false, reason: '작업 수락 시간 정보가 없습니다.' };
      }
      
      const acceptedTime = job.acceptedAt instanceof Date ? job.acceptedAt : (job.acceptedAt as any)?.toDate?.() || new Date();
      const now = new Date();
      const hoursSinceAcceptance = (now.getTime() - acceptedTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceAcceptance > cancellationPolicy.maxCancellationHours) {
        return { 
          canCancel: false, 
          reason: `수락 후 ${cancellationPolicy.maxCancellationHours}시간이 경과하여 취소할 수 없습니다.`,
          maxCancellationHours: cancellationPolicy.maxCancellationHours
        };
      }
      
      // 4. 오늘 취소 횟수 확인
      const todayCancellations = await this.getTodayCancellations(contractorId);
      const totalCancellationsToday = todayCancellations.length;
      
      // 5. 해당 시공자의 총 취소 횟수 확인
      const contractorCancellations = await this.getContractorCancellations(contractorId);
      const cancellationNumber = contractorCancellations.length + 1;
      
      // 6. 수수료 적용 여부 확인
      const requiresFee = totalCancellationsToday >= cancellationPolicy.maxDailyCancellations || 
                         hoursSinceAcceptance > cancellationPolicy.maxCancellationHours;
      
      let feeAmount = 0;
      if (requiresFee && cancellationPolicy.cancellationFeeRate > 0) {
        const jobBudget = job.budget?.max || 0;
        feeAmount = jobBudget * (cancellationPolicy.cancellationFeeRate / 100);
      }
      
      if (totalCancellationsToday >= cancellationPolicy.maxDailyCancellations) {
        return { 
          canCancel: true, 
          reason: `오늘 취소 가능 횟수(${cancellationPolicy.maxDailyCancellations}회)를 초과하여 수수료가 적용됩니다.`,
          cancellationNumber,
          totalCancellationsToday,
          maxDailyCancellations: cancellationPolicy.maxDailyCancellations,
          feeAmount,
          feeRate: cancellationPolicy.cancellationFeeRate,
          requiresFee: true
        };
      }
      
      if (hoursSinceAcceptance > cancellationPolicy.maxCancellationHours) {
        return { 
          canCancel: true, 
          reason: `수락 후 ${cancellationPolicy.maxCancellationHours}시간이 경과하여 수수료가 적용됩니다.`,
          cancellationNumber,
          totalCancellationsToday,
          maxCancellationHours: cancellationPolicy.maxCancellationHours,
          feeAmount,
          feeRate: cancellationPolicy.cancellationFeeRate,
          requiresFee: true
        };
      }
      
      return {
        canCancel: true,
        cancellationNumber,
        totalCancellationsToday,
        maxCancellationHours: cancellationPolicy.maxCancellationHours,
        maxDailyCancellations: cancellationPolicy.maxDailyCancellations,
        feeAmount: 0,
        feeRate: cancellationPolicy.cancellationFeeRate,
        requiresFee: false
      };
      
    } catch (error) {
      console.error('작업 취소 가능 여부 확인 실패:', error);
      return { canCancel: false, reason: '취소 가능 여부를 확인할 수 없습니다.' };
    }
  }

  // 작업 취소 실행
  static async cancelJob(
    jobId: string, 
    contractorId: string, 
    contractorName: string, 
    reason?: string
  ): Promise<void> {
    try {
      // 1. 취소 가능 여부 재확인
      const canCancelResult = await this.canCancelJob(jobId, contractorId);
      if (!canCancelResult.canCancel) {
        throw new Error(canCancelResult.reason || '작업을 취소할 수 없습니다.');
      }
      
      // 2. 작업 상태 업데이트
      const { JobService } = await import('./jobService');
      await JobService.updateJobStatus(jobId, 'cancelled', contractorId, reason);
      
      // 3. 취소 기록 저장
      const cancellationData: Omit<JobCancellation, 'id'> = {
        jobId,
        contractorId,
        contractorName,
        cancelledAt: new Date(),
        reason,
        cancellationNumber: canCancelResult.cancellationNumber!,
        totalCancellationsToday: canCancelResult.totalCancellationsToday!,
        feeAmount: canCancelResult.feeAmount,
        feeRate: canCancelResult.feeRate
      };
      
      await addDoc(collection(db, 'jobCancellations'), {
        ...cancellationData,
        cancelledAt: serverTimestamp()
      });
      
      console.log(`✅ 작업 취소 완료: ${jobId} (시공자: ${contractorName})`);
      
    } catch (error) {
      console.error('작업 취소 실패:', error);
      throw new Error('작업을 취소할 수 없습니다.');
    }
  }

  // 오늘 취소한 작업 목록 조회
  static async getTodayCancellations(contractorId: string): Promise<JobCancellation[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const q = query(
        collection(db, 'jobCancellations'),
        where('contractorId', '==', contractorId),
        where('cancelledAt', '>=', Timestamp.fromDate(today)),
        where('cancelledAt', '<', Timestamp.fromDate(tomorrow)),
        orderBy('cancelledAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        cancelledAt: doc.data().cancelledAt?.toDate() || new Date()
      })) as JobCancellation[];
      
    } catch (error) {
      console.error('오늘 취소 목록 조회 실패:', error);
      return [];
    }
  }

  // 시공자의 전체 취소 목록 조회
  static async getContractorCancellations(contractorId: string): Promise<JobCancellation[]> {
    try {
      const q = query(
        collection(db, 'jobCancellations'),
        where('contractorId', '==', contractorId),
        orderBy('cancelledAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        cancelledAt: doc.data().cancelledAt?.toDate() || new Date()
      })) as JobCancellation[];
      
    } catch (error) {
      console.error('시공자 취소 목록 조회 실패:', error);
      return [];
    }
  }

  // 작업별 취소 기록 조회
  static async getJobCancellations(jobId: string): Promise<JobCancellation[]> {
    try {
      const q = query(
        collection(db, 'jobCancellations'),
        where('jobId', '==', jobId),
        orderBy('cancelledAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        cancelledAt: doc.data().cancelledAt?.toDate() || new Date()
      })) as JobCancellation[];
      
    } catch (error) {
      console.error('작업 취소 기록 조회 실패:', error);
      return [];
    }
  }

  // 전체 취소 통계 조회 (관리자용)
  static async getCancellationStats(): Promise<{
    totalCancellations: number;
    todayCancellations: number;
    topCancellingContractors: Array<{
      contractorId: string;
      contractorName: string;
      cancellationCount: number;
    }>;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // 전체 취소 수
      const totalQuery = query(collection(db, 'jobCancellations'));
      const totalSnapshot = await getDocs(totalQuery);
      
      // 오늘 취소 수
      const todayQuery = query(
        collection(db, 'jobCancellations'),
        where('cancelledAt', '>=', Timestamp.fromDate(today)),
        where('cancelledAt', '<', Timestamp.fromDate(tomorrow))
      );
      const todaySnapshot = await getDocs(todayQuery);
      
      // 시공자별 취소 수 집계
      const contractorStats = new Map<string, { name: string; count: number }>();
      
      totalSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const contractorId = data.contractorId;
        const contractorName = data.contractorName;
        
        if (contractorStats.has(contractorId)) {
          contractorStats.get(contractorId)!.count++;
        } else {
          contractorStats.set(contractorId, { name: contractorName, count: 1 });
        }
      });
      
      // 상위 취소 시공자 정렬
      const topCancellingContractors = Array.from(contractorStats.entries())
        .map(([contractorId, { name, count }]) => ({
          contractorId,
          contractorName: name,
          cancellationCount: count
        }))
        .sort((a, b) => b.cancellationCount - a.cancellationCount)
        .slice(0, 10); // 상위 10명
      
      return {
        totalCancellations: totalSnapshot.size,
        todayCancellations: todaySnapshot.size,
        topCancellingContractors
      };
      
    } catch (error) {
      console.error('취소 통계 조회 실패:', error);
      return {
        totalCancellations: 0,
        todayCancellations: 0,
        topCancellingContractors: []
      };
    }
  }
}
