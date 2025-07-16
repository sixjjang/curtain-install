import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export const useGradeChangeLogger = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 등급 변경 로그 기록
  const logGradeChange = useCallback(async ({
    contractorId,
    oldLevel,
    newLevel,
    reason,
    adminId,
    evaluationId
  }) => {
    setLoading(true);
    setError(null);

    try {
      const logGradeChangeFunction = httpsCallable(functions, 'logGradeChange');
      
      const result = await logGradeChangeFunction({
        contractorId,
        oldLevel,
        newLevel,
        reason,
        adminId,
        evaluationId
      });

      return result.data;
    } catch (err) {
      const errorMessage = err.message || '등급 변경 로그 기록 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 등급 변경 로그 조회
  const getGradeChangeLogs = useCallback(async ({
    limit = 20,
    startAfter,
    filters = {},
    orderBy = 'timestamp',
    orderDirection = 'desc'
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const getGradeChangeLogsFunction = httpsCallable(functions, 'getGradeChangeLogs');
      
      const result = await getGradeChangeLogsFunction({
        limit,
        startAfter,
        filters,
        orderBy,
        orderDirection
      });

      return result.data;
    } catch (err) {
      const errorMessage = err.message || '등급 변경 로그 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 등급 변경 통계 조회
  const getGradeChangeStats = useCallback(async ({ dateRange = 'all' } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const getGradeChangeStatsFunction = httpsCallable(functions, 'getGradeChangeStats');
      
      const result = await getGradeChangeStatsFunction({ dateRange });

      return result.data;
    } catch (err) {
      const errorMessage = err.message || '등급 변경 통계 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 등급 변경 로그 삭제 (관리자용)
  const deleteGradeChangeLog = useCallback(async ({ logId }) => {
    setLoading(true);
    setError(null);

    try {
      const deleteGradeChangeLogFunction = httpsCallable(functions, 'deleteGradeChangeLog');
      
      const result = await deleteGradeChangeLogFunction({ logId });

      return result.data;
    } catch (err) {
      const errorMessage = err.message || '등급 변경 로그 삭제 중 오류가 발생했습니다.';
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
    logGradeChange,
    getGradeChangeLogs,
    getGradeChangeStats,
    deleteGradeChangeLog,
    clearError
  };
}; 