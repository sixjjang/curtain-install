import { useEffect, useState } fromreact;
import { db } from../firebase/firebase";
import[object Object] collection, query, where, getDocs, orderBy } from "firebase/firestore";
import[object Object] deleteEvaluation, getWorkerEvaluationStats } from "../utils/workerEvaluation;

export default function EvaluationList({ 
  workerId, 
  workerName = 작업자",
  showStats = true,
  onEvaluationDeleted 
}) {
  const [evaluations, setEvaluations] = useState(
  conststats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  consterror, setError] = useState(null);
  const [filterRating, setFilterRating] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all);
  const sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchEvaluations();
  }, [workerId]);

  async function fetchEvaluations()[object Object]   try [object Object]   setLoading(true);
      setError(null);

      // Fetch evaluations
      const q = query(
        collection(db, workerEvaluations"),
        where("workerId",==workerId),
        orderBy(createdAt", desc)   );

      const snapshot = await getDocs(q);
      const evals =   snapshot.forEach(docSnap => {
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
      setError(평가 내역을 불러오는 중 오류가 발생했습니다.');
    } finally [object Object]  setLoading(false);
    }
  }

  async function handleDelete(id) [object Object]
    if (confirm(정말 이 평가를 삭제하시겠습니까?)) {     try {
        await deleteEvaluation(id);
        setEvaluations(evals => evals.filter(e => e.id !== id));
        
        // Refresh stats
        if (showStats)[object Object]       const statsData = await getWorkerEvaluationStats(workerId);
          setStats(statsData);
        }

        if (onEvaluationDeleted) {
          onEvaluationDeleted(id);
        }
      } catch (error)[object Object]     console.error(평가 삭제 실패:, error);
        alert(평가 삭제에 실패했습니다.);
      }
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return -;    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000toLocaleDateString(ko-KR');
      }
      return new Date(timestamp).toLocaleDateString('ko-KR');
    } catch (error)[object Object]      return -   }
  };

  const getRatingStars = (rating) => {
    return (
      <div className=flexitems-center space-x-1>
        {[123, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4              star <= rating ?text-yellow-400 text-gray-30   }`}
            fill="currentColor           viewBox="0 00     >
            <path d=M9.0490927.30921 1.639211.92 010.73292a1 100.950.693.462c0.969 1.371 1.24.5881.8128.34 100-0.364 10.1180.07.29230.921-00.755 1.688.54 1.11820.82034a1 0100.1750l-28234784.5710.838-0.197-10.539.118070.2921 0-03641.118L209880.720783-0.573881.588-18134611292z" />
          </svg>
        ))}
        <span className=ml-1 text-sm text-gray-600>({rating}점)</span>
      </div>
    );
  };

  const getCategoryLabel = (category) => [object Object]    const labels = [object Object]
      overall: '전체 평가',
      quality: '작업 품질',
      punctuality: '시간 준수',
      communication: 의사소통
    };
    return labels[category] || category;
  };

  const getEvaluatorTypeLabel = (type) => [object Object]    const labels = [object Object]
      seller: 판매자,
      customer: 고객,
      admin: 관리자
    };
    return labels[type] || type;
  };

  // Filter and sort evaluations
  const filteredEvaluations = evaluations
    .filter(ev => [object Object]  if (filterRating && ev.rating !== filterRating) return false;
      if (filterCategory !== 'all' && ev.category !== filterCategory) return false;
      return true;
    })
    .sort((a, b) => [object Object]    if (sortBy === 'rating') [object Object]
        return b.rating - a.rating;
      }
      // Sort by date (newest first)
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
      return dateB - dateA;
    });

  if (loading) {
    return (
      <div className=max-w-6auto p-6">
        <div className="flex justify-center items-center h-32    <div className="animate-spin rounded-full h-8 w-8rder-b-2der-blue-600</div>
          <span className=ml-3">평가 내역을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className=max-w-6auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className=text-red-700error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className=max-w-6x-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4rder-b border-gray-20     <h1 className="text-2ont-bold text-gray-90           [object Object]workerName} 평가 내역
          </h1>
          <p className=text-gray-600 mt-1>
            총 {evaluations.length}개의 평가
          </p>
        </div>

    [object Object]/* Statistics */}
object Object]showStats && stats && (
          <div className=px-6ay-50rder-b border-gray-20>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4              <div className="text-center>
                <div className="text-2ont-bold text-blue-600>{stats.totalEvaluations}</div>
                <div className=text-sm text-gray-600div>
              </div>
              <div className="text-center>
                <div className="text-2nt-bold text-green-60tats.averageRating.toFixed(1)}</div>
                <div className=text-sm text-gray-600div>
              </div>
              <div className="text-center>
                <div className="text-2font-bold text-purple-600s.categoryAverages.quality.toFixed(1)}</div>
                <div className=text-sm text-gray-600div>
              </div>
              <div className="text-center>
                <div className="text-2 font-bold text-orange-600s.categoryAverages.punctuality.toFixed(1)}</div>
                <div className=text-sm text-gray-600div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className=px-6ay-50rder-b border-gray-200    <div className="flex flex-wrap items-center gap-4>
            <div>
              <label className="block text-sm font-medium text-gray-700mb-1bel>
              <select
                value=[object Object]filterRating || '}          onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-1 border border-gray-30rounded-md text-sm >
                <option value="">전체</option>
                {[54, 2, 1].map(rating => (
                  <option key={rating} value={rating}>{rating}점</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1 border border-gray-30rounded-md text-sm >
                <option value=alln>
                <option value="overall">전체 평가</option>
                <option value="quality">작업 품질</option>
                <option value=punctuality">시간 준수</option>
                <option value=communication">의사소통</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-70 mb-1">정렬</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-30rounded-md text-sm >
                <option value=date">날짜순</option>
                <option value="rating">평점순</option>
              </select>
            </div>
          </div>
        </div>

        {/* Evaluations List */}
        <div className="px-6py-4">
          {filteredEvaluations.length ===0 ? (
            <div className="text-center py-8>
              <p className=text-gray-50다.</p>
            </div>
          ) : (
            <div className="space-y-4>           {filteredEvaluations.map(ev => (
                <div key={ev.id} className="border border-gray-200nded-lg p-4gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className=flexitems-center space-x-3">
                      [object Object]getRatingStars(ev.rating)}
                      <span className="inline-block bg-blue-100text-blue-800 text-xs px-2                   {getCategoryLabel(ev.category)}
                      </span>
                      <span className="inline-block bg-gray-100text-gray-800 text-xs px-2                   {getEvaluatorTypeLabel(ev.evaluatorType)}
                      </span>
                    </div>
                    <div className=flexitems-center space-x-2">
                      <span className=text-sm text-gray-500">
                        {formatDate(ev.createdAt)}
                      </span>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className=px-2-1-50text-white text-xs rounded hover:bg-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  
                  {ev.comment && (
                    <div className="mb-2">
                      <p className=text-gray-70>{ev.comment}</p>
                    </div>
                  )}
                  
                  {ev.workOrderId && (
                    <div className=text-xs text-gray-500">
                      작업 주문: {ev.workOrderId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 