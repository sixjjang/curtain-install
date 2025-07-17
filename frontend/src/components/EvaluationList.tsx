import React, { useEffect, useState } from 'react';
import { Firestore } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from "firebase/firestore";
import { deleteEvaluation, getWorkerEvaluationStats } from "../utils/workerEvaluation";

interface Evaluation {
  id: string;
  workerId: string;
  evaluatorId: string;
  evaluatorType: 'seller' | 'customer' | 'admin';
  rating: number;
  comment?: string;
  workOrderId?: string;
  category: 'quality' | 'punctuality' | 'communication' | 'overall';
  createdAt: any;
  updatedAt?: any;
}

interface EvaluationStats {
  totalEvaluations: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number;
  };
  categoryAverages: {
    quality: number;
    punctuality: number;
    communication: number;
    overall: number;
  };
}

interface EvaluationListProps {
  workerId: string;
  workerName?: string;
  showStats?: boolean;
  onEvaluationDeleted?: (evaluationId: string) => void;
}

export default function EvaluationList({ 
  workerId, 
  workerName = "작업자",
  showStats = true,
  onEvaluationDeleted 
}: EvaluationListProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [stats, setStats] = useState<EvaluationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');

  useEffect(() => {
    fetchEvaluations();
  }, [workerId]);

  async function fetchEvaluations() {
    try {
      setLoading(true);
      setError(null);

      // Firebase가 초기화되지 않았으면 실행하지 않음
      if (!db) {
        console.warn('Firebase Firestore is not initialized');
        setError('Firebase가 초기화되지 않았습니다.');
        return;
      }

      // Fetch evaluations
      const q = query(
        collection(db as Firestore, "workerEvaluations"),
        where("workerId", "==", workerId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const evals: Evaluation[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        evals.push({
          id: docSnap.id,
          workerId: data.workerId,
          evaluatorId: data.evaluatorId,
          evaluatorType: data.evaluatorType || 'seller',
          rating: data.rating,
          comment: data.comment,
          workOrderId: data.workOrderId,
          category: data.category || 'overall',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });

      setEvaluations(evals);

      // Fetch stats if enabled
      if (showStats) {
        const statsData = await getWorkerEvaluationStats(workerId);
        setStats(statsData);
      }

    } catch (error) {
      console.error('평가 내역 조회 실패:', error);
      setError('평가 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('정말 이 평가를 삭제하시겠습니까?')) {
      try {
        await deleteEvaluation(id);
        setEvaluations(evals => evals.filter(e => e.id !== id));
        
        // Refresh stats
        if (showStats) {
          const statsData = await getWorkerEvaluationStats(workerId);
          setStats(statsData);
        }

        if (onEvaluationDeleted) {
          onEvaluationDeleted(id);
        }
      } catch (error) {
        console.error('평가 삭제 실패:', error);
        alert('평가 삭제에 실패했습니다.');
      }
    }
  }

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '-';
    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('ko-KR');
      }
      return new Date(timestamp).toLocaleDateString('ko-KR');
    } catch (error) {
      return '-';
    }
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}점)</span>
      </div>
    );
  };

  const getCategoryLabel = (category: string): string => {
    const labels = {
      overall: '전체 평가',
      quality: '작업 품질',
      punctuality: '시간 준수',
      communication: '의사소통'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getEvaluatorTypeLabel = (type: string): string => {
    const labels = {
      seller: '판매자',
      customer: '고객',
      admin: '관리자'
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Filter and sort evaluations
  const filteredEvaluations = evaluations
    .filter(ev => {
      if (filterRating && ev.rating !== filterRating) return false;
      if (filterCategory !== 'all' && ev.category !== filterCategory) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      // Sort by date (newest first)
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
      return dateB - dateA;
    });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">평가 내역을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            {workerName} 평가 내역
          </h1>
          <p className="text-gray-600 mt-1">
            총 {evaluations.length}개의 평가가 있습니다.
          </p>
        </div>

        {/* Stats Section */}
        {showStats && stats && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalEvaluations}</div>
                <div className="text-sm text-gray-600">총 평가 수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">평균 평점</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.categoryAverages.quality.toFixed(1)}</div>
                <div className="text-sm text-gray-600">작업 품질</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.categoryAverages.punctuality.toFixed(1)}</div>
                <div className="text-sm text-gray-600">시간 준수</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">평점 필터</label>
              <select
                value={filterRating || ''}
                onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="">전체</option>
                <option value="5">5점</option>
                <option value="4">4점</option>
                <option value="3">3점</option>
                <option value="2">2점</option>
                <option value="1">1점</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">전체</option>
                <option value="overall">전체 평가</option>
                <option value="quality">작업 품질</option>
                <option value="punctuality">시간 준수</option>
                <option value="communication">의사소통</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정렬</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'rating')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="date">날짜순</option>
                <option value="rating">평점순</option>
              </select>
            </div>
          </div>
        </div>

        {/* Evaluations List */}
        <div className="divide-y divide-gray-200">
          {filteredEvaluations.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              평가 내역이 없습니다.
            </div>
          ) : (
            filteredEvaluations.map((evaluation) => (
              <div key={evaluation.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      {getRatingStars(evaluation.rating)}
                      <span className="text-sm text-gray-500">
                        {getCategoryLabel(evaluation.category)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getEvaluatorTypeLabel(evaluation.evaluatorType)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(evaluation.createdAt)}
                      </span>
                    </div>
                    {evaluation.comment && (
                      <p className="text-gray-700 mt-2">{evaluation.comment}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(evaluation.id)}
                    className="ml-4 text-red-600 hover:text-red-800 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 