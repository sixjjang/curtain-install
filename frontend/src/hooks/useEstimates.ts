import { useState, useEffect, useCallback } from 'react';
import { 
  fetchEstimatesBySeller, 
  getEstimate, 
  saveEstimate, 
  updateEstimateStatus,
  assignEstimateToContractor,
  unassignEstimate,
  getUnassignedEstimates,
  getEstimatesByContractor,
  getEstimateStats,
  type Estimate,
  type EstimateData,
  type Contractor
} from '../utils/saveEstimate';
import { db } from '../firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot,
  Firestore
} from 'firebase/firestore';

interface UseEstimatesOptions {
  sellerId?: string;
  contractorId?: string;
  realtime?: boolean;
}

interface UseEstimatesReturn {
  estimates: Estimate[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    completed: number;
    assigned: number;
    unassigned: number;
    totalAmount: number;
  } | null;
  fetchEstimates: () => Promise<void>;
  fetchEstimate: (id: string) => Promise<Estimate | null>;
  saveEstimate: (data: EstimateData) => Promise<string>;
  updateStatus: (id: string, status: Estimate['status']) => Promise<void>;
  assignToContractor: (id: string, contractorId: string) => Promise<void>;
  unassign: (id: string) => Promise<void>;
  fetchUnassigned: () => Promise<void>;
  fetchByContractor: (contractorId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  clearError: () => void;
}

export const useEstimates = (options: UseEstimatesOptions = {}): UseEstimatesReturn => {
  const { sellerId, contractorId, realtime = false } = options;
  
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UseEstimatesReturn['stats']>(null);

  // 실시간 업데이트 설정
  useEffect(() => {
    if (!realtime || !sellerId) return;

    const q = query(
      collection(db as Firestore, 'estimates'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const estimatesData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      })) as Estimate[];
      
      setEstimates(estimatesData);
      setLoading(false);
    }, (error) => {
      console.error('실시간 견적 업데이트 오류:', error);
      setError(`실시간 업데이트 실패: ${error.message}`);
    });

    return () => unsubscribe();
  }, [sellerId, realtime]);

  // 견적 목록 조회
  const fetchEstimates = useCallback(async () => {
    if (!sellerId) {
      setError('판매자 ID가 필요합니다.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchEstimatesBySeller(sellerId);
      setEstimates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '견적 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  // 특정 견적 조회
  const fetchEstimate = useCallback(async (id: string): Promise<Estimate | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getEstimate(id);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '견적 조회 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 견적 저장
  const saveEstimateData = useCallback(async (data: EstimateData): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const docId = await saveEstimate(data);
      
      // 실시간 업데이트가 아닌 경우 목록 새로고침
      if (!realtime) {
        await fetchEstimates();
      }
      
      return docId;
    } catch (err) {
      setError(err instanceof Error ? err.message : '견적 저장 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [realtime, fetchEstimates]);

  // 상태 업데이트
  const updateStatus = useCallback(async (id: string, status: Estimate['status']) => {
    setLoading(true);
    setError(null);
    
    try {
      await updateEstimateStatus(id, status);
      
      // 실시간 업데이트가 아닌 경우 목록 새로고침
      if (!realtime) {
        await fetchEstimates();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태 업데이트 실패');
    } finally {
      setLoading(false);
    }
  }, [realtime, fetchEstimates]);

  // 계약자 할당
  const assignToContractor = useCallback(async (id: string, contractorId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await assignEstimateToContractor(id, contractorId);
      
      // 실시간 업데이트가 아닌 경우 목록 새로고침
      if (!realtime) {
        await fetchEstimates();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '계약자 할당 실패');
    } finally {
      setLoading(false);
    }
  }, [realtime, fetchEstimates]);

  // 할당 해제
  const unassign = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await unassignEstimate(id);
      
      // 실시간 업데이트가 아닌 경우 목록 새로고침
      if (!realtime) {
        await fetchEstimates();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '할당 해제 실패');
    } finally {
      setLoading(false);
    }
  }, [realtime, fetchEstimates]);

  // 할당되지 않은 견적 조회
  const fetchUnassigned = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getUnassignedEstimates();
      setEstimates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '미할당 견적 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  // 계약자별 견적 조회
  const fetchByContractor = useCallback(async (contractorId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getEstimatesByContractor(contractorId);
      setEstimates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '계약자별 견적 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  // 통계 조회
  const fetchStats = useCallback(async () => {
    if (!sellerId) {
      setError('판매자 ID가 필요합니다.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await getEstimateStats(sellerId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '통계 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    estimates,
    loading,
    error,
    stats,
    fetchEstimates,
    fetchEstimate,
    saveEstimate: saveEstimateData,
    updateStatus,
    assignToContractor,
    unassign,
    fetchUnassigned,
    fetchByContractor,
    fetchStats,
    clearError
  };
};

// 특정 용도별 훅들
export const useSellerEstimates = (sellerId: string, realtime = false) => {
  return useEstimates({ sellerId, realtime });
};

export const useContractorEstimates = (contractorId: string) => {
  return useEstimates({ contractorId });
};

export const useUnassignedEstimates = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnassigned = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getUnassignedEstimates();
      setEstimates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '미할당 견적 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    estimates,
    loading,
    error,
    fetchUnassigned,
    clearError
  };
}; 