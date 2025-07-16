import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { StarIcon } from "@heroicons/react/20/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";

const firestore = getFirestore();

const ContractorEvaluationList = ({ contractorId, maxItems = 10, showFilters = true }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [filters, setFilters] = useState({
    minRating: 0,
    maxRating: 5,
    hasComment: false,
    sortBy: 'date' // 'date', 'rating', 'project'
  });

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const evaluationsRef = collection(firestore, "evaluations");
        const q = query(
          evaluationsRef, 
          where("contractorId", "==", contractorId),
          where("status", "==", "submitted"),
          orderBy("createdAt", "desc"),
          limit(maxItems)
        );
        
        const querySnapshot = await getDocs(q);
        const evals = [];
        querySnapshot.forEach((doc) => {
          evals.push({ id: doc.id, ...doc.data() });
        });
        
        setEvaluations(evals);
        setFilteredEvaluations(evals);
      } catch (error) {
        console.error("평가 데이터 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (contractorId) {
      fetchEvaluations();
    }
  }, [contractorId, maxItems]);

  // 필터링 및 정렬 적용
  useEffect(() => {
    let filtered = [...evaluations];

    // 평점 필터
    filtered = filtered.filter(evaluation => {
      const avgRating = getAverageRating(evaluation);
      return avgRating >= filters.minRating && avgRating <= filters.maxRating;
    });

    // 댓글 필터
    if (filters.hasComment) {
      filtered = filtered.filter(evaluation => evaluation.comment && evaluation.comment.trim().length > 0);
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return getAverageRating(b) - getAverageRating(a);
        case 'project':
          return (a.projectName || '').localeCompare(b.projectName || '');
        case 'date':
        default:
          return b.createdAt?.toDate?.() - a.createdAt?.toDate?.();
      }
    });

    setFilteredEvaluations(filtered);
  }, [evaluations, filters]);

  const getAverageRating = (evaluation) => {
    if (evaluation.ratings) {
      // 새로운 상세 평가 시스템
      const categoryRatings = Object.values(evaluation.ratings);
      return categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length;
    } else if (evaluation.averageRating) {
      // 기존 시스템과의 호환성
      return evaluation.averageRating;
    } else if (evaluation.rating) {
      // 레거시 시스템 지원
      return evaluation.rating;
    }
    return 0;
  };

  const getCategoryLabels = () => ({
    quality: "품질",
    punctuality: "시간 준수",
    costSaving: "비용 절약",
    communication: "의사소통",
    professionalism: "전문성"
  });

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className="inline-block">
          {i <= rating ? (
            <StarIcon className="h-4 w-4 text-yellow-400" />
          ) : (
            <StarOutlineIcon className="h-4 w-4 text-gray-300" />
          )}
        </span>
      );
    }
    return stars;
  };

  const renderCategoryRating = (evaluation) => {
    if (!evaluation.ratings) return null;

    const categoryLabels = getCategoryLabels();
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
        {Object.entries(evaluation.ratings).map(([category, rating]) => (
          <div key={category} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{categoryLabels[category] || category}:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{rating.toFixed(1)}</span>
              <div className="flex">
                {renderStars(rating)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-blue-600";
    if (rating >= 2.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return "매우 만족";
    if (rating >= 3.5) return "만족";
    if (rating >= 2.5) return "보통";
    if (rating >= 1.5) return "불만족";
    return "매우 불만족";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">평가 내역을 불러오는 중...</span>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">평가 내역이 없습니다</h3>
        <p className="text-gray-500">아직 이 시공기사에 대한 평가가 등록되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">평가 내역</h3>
                     <p className="text-sm text-gray-500">
             총 {evaluations.length}건의 평가 • 평균 평점: {
               (evaluations.reduce((sum, evaluation) => sum + getAverageRating(evaluation), 0) / evaluations.length).toFixed(1)
             }점
           </p>
        </div>
        {showFilters && (
          <div className="text-sm text-gray-500">
            {filteredEvaluations.length}건 표시
          </div>
        )}
      </div>

      {/* 필터 */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">필터</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최소 평점</label>
              <select
                value={filters.minRating}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>전체</option>
                <option value={1}>1점 이상</option>
                <option value={2}>2점 이상</option>
                <option value={3}>3점 이상</option>
                <option value={4}>4점 이상</option>
                <option value={4.5}>4.5점 이상</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최대 평점</label>
              <select
                value={filters.maxRating}
                onChange={(e) => setFilters(prev => ({ ...prev, maxRating: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>전체</option>
                <option value={4.5}>4.5점 이하</option>
                <option value={4}>4점 이하</option>
                <option value={3}>3점 이하</option>
                <option value={2}>2점 이하</option>
                <option value={1}>1점 이하</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정렬</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">날짜순</option>
                <option value="rating">평점순</option>
                <option value="project">프로젝트순</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasComment}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasComment: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">댓글 있는 평가만</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 평가 목록 */}
      <div className="space-y-4">
        {filteredEvaluations.map((evaluation) => {
          const avgRating = getAverageRating(evaluation);
          const ratingColor = getRatingColor(avgRating);
          const ratingLabel = getRatingLabel(avgRating);
          
          return (
            <div key={evaluation.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* 헤더 */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500">
                      {evaluation.projectName || `프로젝트 #${evaluation.projectId?.slice(-8)}`}
                    </span>
                    {evaluation.projectType && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {evaluation.projectType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${ratingColor}`}>
                      {avgRating.toFixed(1)}점
                    </span>
                    <span className={`text-sm ${ratingColor}`}>
                      {ratingLabel}
                    </span>
                    <div className="flex">
                      {renderStars(avgRating)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {evaluation.createdAt?.toDate?.().toLocaleDateString() || '날짜 없음'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {evaluation.createdAt?.toDate?.().toLocaleTimeString() || ''}
                  </div>
                </div>
              </div>

              {/* 카테고리별 평가 */}
              {evaluation.ratings && (
                <div className="mb-4">
                  {renderCategoryRating(evaluation)}
                </div>
              )}

              {/* 댓글 */}
              {evaluation.comment && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">의견</h5>
                  <p className="text-gray-700 whitespace-pre-wrap">{evaluation.comment}</p>
                </div>
              )}

              {/* 추가 정보 */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {evaluation.evaluatorName && (
                    <span>평가자: {evaluation.evaluatorName}</span>
                  )}
                  {evaluation.evaluationDate && (
                    <span>평가일: {evaluation.evaluationDate.toDate?.().toLocaleDateString()}</span>
                  )}
                  {evaluation.status && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      evaluation.status === 'submitted' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {evaluation.status === 'submitted' ? '제출됨' : '임시저장'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 결과 없음 */}
      {filteredEvaluations.length === 0 && evaluations.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">필터 조건에 맞는 평가가 없습니다.</p>
          <button
            onClick={() => setFilters({ minRating: 0, maxRating: 5, hasComment: false, sortBy: 'date' })}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
};

export default ContractorEvaluationList; 