import { useState, useCallback } from 'react';
import { 
  acceptJob, 
  declineJob, 
  completeJob, 
  canAcceptJob 
} from '../utils/jobManager';

export const useJobManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 작업 수락
  const handleAcceptJob = useCallback(async (jobId, contractorId, options = {}) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 먼저 수락 가능 여부 확인
      const canAccept = await canAcceptJob(contractorId, jobId);
      if (!canAccept.canAccept) {
        throw new Error(canAccept.reason);
      }

      const result = await acceptJob(jobId, contractorId, options);
      
      if (result.success) {
        setSuccess(result.message);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err.message || '작업 수락 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 작업 거절
  const handleDeclineJob = useCallback(async (jobId, contractorId, reason = "") => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await declineJob(jobId, contractorId, reason);
      
      if (result.success) {
        setSuccess(result.message);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err.message || '작업 거절 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 작업 완료
  const handleCompleteJob = useCallback(async (jobId, contractorId, completionData = {}) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await completeJob(jobId, contractorId, completionData);
      
      if (result.success) {
        setSuccess(result.message);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err.message || '작업 완료 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 작업 수락 가능 여부 확인
  const checkCanAcceptJob = useCallback(async (contractorId, jobId) => {
    try {
      const result = await canAcceptJob(contractorId, jobId);
      return result;
    } catch (err) {
      console.error('작업 수락 가능 여부 확인 실패:', err);
      return { canAccept: false, reason: '확인 중 오류가 발생했습니다.' };
    }
  }, []);

  // 상태 초기화
  const clearState = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    loading,
    error,
    success,
    acceptJob: handleAcceptJob,
    declineJob: handleDeclineJob,
    completeJob: handleCompleteJob,
    canAcceptJob: checkCanAcceptJob,
    clearState
  };
}; 