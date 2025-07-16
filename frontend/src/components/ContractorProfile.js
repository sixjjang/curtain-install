import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

const firestore = getFirestore();

const ContractorProfile = ({ contractorId }) => {
  const [contractor, setContractor] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // 등급 정보
  const gradeInfo = {
    1: { name: '브론즈', color: 'bg-gray-500', description: '기본 서비스 제공' },
    2: { name: '실버', color: 'bg-blue-500', description: '우선 매칭, 기본 혜택' },
    3: { name: '골드', color: 'bg-yellow-500', description: '프리미엄 매칭, 추가 혜택' },
    4: { name: '플래티넘', color: 'bg-purple-500', description: 'VIP 매칭, 특별 혜택' },
    5: { name: '다이아몬드', color: 'bg-yellow-400', description: '최고 등급, 모든 혜택' }
  };

  useEffect(() => {
    const fetchContractorData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 계약자 정보 조회
        const contractorRef = doc(firestore, "contractors", contractorId);
        const contractorSnap = await getDoc(contractorRef);
        
        if (!contractorSnap.exists()) {
          setError("계약자를 찾을 수 없습니다.");
          return;
        }

        const contractorData = contractorSnap.data();
        setContractor(contractorData);

        // 최근 리뷰 조회
        const reviewsQuery = query(
          collection(firestore, "reviews"),
          where("contractorId", "==", contractorId),
          orderBy("submittedAt", "desc"),
          limit(5)
        );
        
        const reviewsSnap = await getDocs(reviewsQuery);
        const reviews = reviewsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecentReviews(reviews);

      } catch (error) {
        console.error("Error fetching contractor data:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (contractorId) {
      fetchContractorData();
    }
  }, [contractorId]);

  // 평점 분포 계산
  const getRatingDistribution = () => {
    if (!contractor?.reviewStats?.ratingDistribution) return [];
    
    const distribution = contractor.reviewStats.ratingDistribution;
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    return [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: distribution[rating] || 0,
      percentage: total > 0 ? Math.round((distribution[rating] || 0) / total * 100) : 0
    }));
  };

  // 카테고리별 평점 표시
  const CategoryRating = ({ category, data }) => {
    if (!data) return null;
    
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-700">{category}</p>
          <p className="text-xs text-gray-500">{data.count}건 평가</p>
        </div>
        <div className="flex items-center">
          <div className="flex items-center mr-2">
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                className={`text-sm ${
                  star <= data.average ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {data.average.toFixed(1)}
          </span>
        </div>
      </div>
    );
  };

  // 리뷰 카드 컴포넌트
  const ReviewCard = ({ review }) => {
    const formatDate = (timestamp) => {
      if (!timestamp) return '-';
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      return date.toLocaleDateString('ko-KR');
    };

    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="flex items-center mr-2">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={`text-sm ${
                    star <= review.averageRating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {review.averageRating.toFixed(1)}점
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {formatDate(review.submittedAt)}
          </span>
        </div>
        
        <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {review.jobName}
          </span>
          {review.recommendToOthers && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              추천함
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">계약자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-400 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">오류가 발생했습니다</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">계약자 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const reviewStats = contractor.reviewStats || {};
  const ratingDistribution = getRatingDistribution();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {contractor.name || contractor.displayName} 프로필
              </h1>
              <p className="text-gray-600">시공업체 ID: {contractorId}</p>
            </div>
            
            {/* 등급 배지 */}
            {contractor.level && (
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${gradeInfo[contractor.level]?.color}`}>
                  {gradeInfo[contractor.level]?.name}
                </span>
                <p className="ml-2 text-sm text-gray-600">
                  {gradeInfo[contractor.level]?.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: '개요' },
                { id: 'ratings', name: '평점 상세' },
                { id: 'reviews', name: '최근 리뷰' },
                { id: 'stats', name: '통계' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">이름</p>
                    <p className="font-medium">{contractor.name || contractor.displayName}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">등급</p>
                    <p className="font-medium">
                      {contractor.level ? gradeInfo[contractor.level]?.name : '미정'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">총 리뷰 수</p>
                    <p className="font-medium">{reviewStats.totalReviews || 0}건</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">평균 평점</p>
                    <p className="font-medium">
                      {reviewStats.averageRating ? reviewStats.averageRating.toFixed(1) : '평가 없음'}점
                    </p>
                  </div>
                </div>
              </div>

              {/* 주요 통계 */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">주요 통계</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {reviewStats.recommendationRate || 0}%
                    </p>
                    <p className="text-sm text-blue-800">추천률</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {reviewStats.totalRecommendations || 0}
                    </p>
                    <p className="text-sm text-green-800">추천 수</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {contractor.completedJobsCount || 0}
                    </p>
                    <p className="text-sm text-yellow-800">완료 작업</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ratings' && (
            <div className="space-y-6">
              {/* 카테고리별 평점 */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">카테고리별 평점</h2>
                <div className="space-y-3">
                  {reviewStats.categoryAverages && Object.entries(reviewStats.categoryAverages).map(([category, data]) => (
                    <CategoryRating
                      key={category}
                      category={getCategoryLabel(category)}
                      data={data}
                    />
                  ))}
                </div>
              </div>

              {/* 평점 분포 */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">평점 분포</h2>
                <div className="space-y-2">
                  {ratingDistribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center">
                      <span className="w-8 text-sm text-gray-600">{rating}점</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-12 text-sm text-gray-600 text-right">
                        {count}건 ({percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 리뷰</h2>
              {recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {recentReviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">아직 리뷰가 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* 상세 통계 */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">상세 통계</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">평점 통계</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>총 리뷰 수</span>
                        <span className="font-medium">{reviewStats.totalReviews || 0}건</span>
                      </div>
                      <div className="flex justify-between">
                        <span>평균 평점</span>
                        <span className="font-medium">
                          {reviewStats.averageRating ? reviewStats.averageRating.toFixed(2) : '0.00'}점
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>총 평점</span>
                        <span className="font-medium">{reviewStats.totalRating || 0}점</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">추천 통계</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>추천 수</span>
                        <span className="font-medium">{reviewStats.totalRecommendations || 0}건</span>
                      </div>
                      <div className="flex justify-between">
                        <span>추천률</span>
                        <span className="font-medium">{reviewStats.recommendationRate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>비추천 수</span>
                        <span className="font-medium">
                          {(reviewStats.totalReviews || 0) - (reviewStats.totalRecommendations || 0)}건
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 등급 정보 */}
              {contractor.level && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">등급 정보</h2>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${gradeInfo[contractor.level]?.color}`}>
                        {gradeInfo[contractor.level]?.name}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        (등급 {contractor.level})
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {gradeInfo[contractor.level]?.description}
                    </p>
                    {contractor.lastGradeUpdate && (
                      <p className="text-xs text-gray-500">
                        등급 업데이트: {contractor.lastGradeUpdate.toDate().toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 카테고리 라벨 변환 함수
const getCategoryLabel = (category) => {
  const labels = {
    overall: '전체 만족도',
    quality: '시공 품질',
    punctuality: '시간 준수',
    communication: '의사소통',
    professionalism: '전문성',
    costSaving: '비용 절약'
  };
  return labels[category] || category;
};

export default ContractorProfile; 