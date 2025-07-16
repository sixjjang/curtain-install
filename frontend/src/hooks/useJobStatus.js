import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase/firebase';

const functions = getFunctions(app);

export const useJobStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 작업 상태 변경
  const updateJobStatus = useCallback(async (jobId, newStatus, reason = null) => {
    try {
      setLoading(true);
      setError(null);

      const updateJobStatusFunction = httpsCallable(functions, 'updateJobStatus');
      const result = await updateJobStatusFunction({
        jobId,
        newStatus,
        reason
      });
      
      console.log('작업 상태 변경 성공:', result.data);
      return result.data;
    } catch (error) {
      console.error('작업 상태 변경 실패:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 작업 상태 일괄 업데이트 (관리자용)
  const batchUpdateJobStatus = useCallback(async (jobIds, newStatus, reason = null) => {
    try {
      setLoading(true);
      setError(null);

      const batchUpdateJobStatusFunction = httpsCallable(functions, 'batchUpdateJobStatus');
      const result = await batchUpdateJobStatusFunction({
        jobIds,
        newStatus,
        reason
      });
      
      console.log('작업 상태 일괄 변경 성공:', result.data);
      return result.data;
    } catch (error) {
      console.error('작업 상태 일괄 변경 실패:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 작업 상태 통계 조회
  const getJobStatusStats = useCallback(async (contractorId = null) => {
    try {
      setLoading(true);
      setError(null);

      const getJobStatusStatsFunction = httpsCallable(functions, 'getJobStatusStats');
      const result = await getJobStatusStatsFunction({
        contractorId
      });
      
      console.log('작업 상태 통계 조회 성공:', result.data);
      return result.data;
    } catch (error) {
      console.error('작업 상태 통계 조회 실패:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 작업 시작
  const startJob = useCallback(async (jobId, reason = null) => {
    return await updateJobStatus(jobId, 'in_progress', reason);
  }, [updateJobStatus]);

  // 작업 완료
  const completeJob = useCallback(async (jobId, reason = null) => {
    return await updateJobStatus(jobId, 'completed', reason);
  }, [updateJobStatus]);

  // 작업 취소
  const cancelJob = useCallback(async (jobId, reason = null) => {
    return await updateJobStatus(jobId, 'cancelled', reason);
  }, [updateJobStatus]);

  // 작업 거절
  const rejectJob = useCallback(async (jobId, reason = null) => {
    return await updateJobStatus(jobId, 'cancelled', reason);
  }, [updateJobStatus]);

  return {
    // 상태
    loading,
    error,
    
    // 액션
    updateJobStatus,
    batchUpdateJobStatus,
    getJobStatusStats,
    startJob,
    completeJob,
    cancelJob,
    rejectJob,
    clearError
  };
};

export default useJobStatus; 