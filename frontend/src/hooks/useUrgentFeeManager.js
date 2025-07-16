import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export const useUrgentFeeManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 수동 긴급 수수료 인상
  const manualIncreaseUrgentFee = useCallback(async ({
    jobId,
    increasePercent = 5,
    reason = '관리자 수동 인상'
  }) => {
    setLoading(true);
    setError(null);

    try {
      const manualIncreaseFunction = httpsCallable(functions, 'manualIncreaseUrgentFee');
      
      const result = await manualIncreaseFunction({
        jobId,
        increasePercent,
        reason
      });

      return result.data;
    } catch (err) {
      const errorMessage = err.message || '긴급 수수료 인상 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 긴급 수수료 통계 조회
  const getUrgentFeeStats = useCallback(async ({ dateRange = 'week' } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const getStatsFunction = httpsCallable(functions, 'getUrgentFeeStats');
      
      const result = await getStatsFunction({ dateRange });

      return result.data;
    } catch (err) {
      const errorMessage = err.message || '긴급 수수료 통계 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 긴급 수수료 설정 업데이트
  const updateUrgentFeeSettings = useCallback(async ({
    enabled = true,
    increaseInterval = 600,
    increasePercent = 5,
    maxIncreasePercent = 50
  }) => {
    setLoading(true);
    setError(null);

    try {
      const updateSettingsFunction = httpsCallable(functions, 'updateUrgentFeeSettings');
      
      const result = await updateSettingsFunction({
        enabled,
        increaseInterval,
        increasePercent,
        maxIncreasePercent
      });

      return result.data;
    } catch (err) {
      const errorMessage = err.message || '긴급 수수료 설정 업데이트 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    manualIncreaseUrgentFee,
    getUrgentFeeStats,
    updateUrgentFeeSettings,
    clearError
  };
}; 