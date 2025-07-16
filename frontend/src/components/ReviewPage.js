import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";

const firestore = getFirestore();

const ReviewPage = ({ jobId, userId }) => {
  const [job, setJob] = useState(null);
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  // 다중 카테고리 평점
  const [ratings, setRatings] = useState({
    overall: 0,
    quality: 0,
    punctuality: 0,
    communication: 0,
    professionalism: 0,
    costSaving: 0
  });
  
  const [comment, setComment] = useState("");
  const [recommendToOthers, setRecommendToOthers] = useState(null);

  // 평점 카테고리 정의
  const ratingCategories = {
    overall: { label: "전체 만족도", description: "전반적인 서비스 만족도" },
    quality: { label: "시공 품질", description: "작업 완성도와 품질" },
    punctuality: { label: "시간 준수", description: "약속 시간 준수도" },
    communication: { label: "의사소통", description: "소통의 원활함" },
    professionalism: { label: "전문성", description: "전문적인 태도와 기술" },
    costSaving: { label: "비용 절약", description: "예산 대비 만족도" }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 작업 정보 조회
        const jobRef = doc(firestore, "jobs", jobId);
        const jobSnap = await getDoc(jobRef);
        
        if (!jobSnap.exists()) {
          setError("작업을 찾을 수 없습니다.");
          return;
        }

        const jobData = jobSnap.data();
        setJob(jobData);

        // 계약자 정보 조회
        if (jobData.assignedContractorId) {
          const contractorRef = doc(firestore, "contractors", jobData.assignedContractorId);
          const contractorSnap = await getDoc(contractorRef);
          
          if (contractorSnap.exists()) {
            setContractor(contractorSnap.data());
          }
        }

        // 이미 제출된 리뷰가 있는지 확인
        if (jobData.consumerReview) {
          setSubmitted(true);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId]);

  // 별점 컴포넌트
  const StarRating = ({ category, value, onChange, label, description }) => {
    return (
      <div className="mb-6">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <p className="text-xs text-gray-500 mb-2">{description}</p>
        </div>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(category, star)}
              className={`text-2xl transition-colors ${
                star <= value
                  ? "text-yellow-400 hover:text-yellow-500"
                  : "text-gray-300 hover:text-gray-400"
              }`}
            >
              ★
            </button>
          ))}
          <span className="ml-3 text-sm text-gray-600">
            {value > 0 ? `${value}점` : "선택해주세요"}
          </span>
        </div>
      </div>
    );
  };

  // 평점 변경 핸들러
  const handleRatingChange = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  // 평균 평점 계산
  const averageRating = Object.values(ratings).filter(r => r > 0).length > 0
    ? Math.round(Object.values(ratings).filter(r => r > 0).reduce((a, b) => a + b, 0) / 
                Object.values(ratings).filter(r => r > 0).length * 10) / 10
    : 0;

  // 리뷰 제출
  const submitReview = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // 유효성 검사
      if (ratings.overall === 0) {
        setError("전체 만족도를 선택해주세요.");
        return;
      }

      if (!comment.trim()) {
        setError("코멘트를 입력해주세요.");
        return;
      }

      if (recommendToOthers === null) {
        setError("추천 여부를 선택해주세요.");
        return;
      }

      const reviewData = {
        jobId: jobId,
        contractorId: job?.assignedContractorId,
        userId: userId,
        ratings: ratings,
        averageRating: averageRating,
        comment: comment.trim(),
        recommendToOthers: recommendToOthers,
        submittedAt: new Date(),
        jobName: job?.name,
        contractorName: contractor?.name || contractor?.displayName
      };

      // 리뷰 저장
      await addDoc(collection(firestore, "reviews"), reviewData);

      // 작업 문서 업데이트
      await updateDoc(doc(firestore, "jobs", jobId), {
        consumerReview: reviewData,
        reviewSubmittedAt: new Date()
      });

      // 계약자 통계 업데이트 (선택사항)
      if (job?.assignedContractorId) {
        await updateContractorStats(job.assignedContractorId, reviewData);
      }

      setSubmitted(true);

    } catch (error) {
      console.error("Error submitting review:", error);
      setError("리뷰 제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  // 계약자 통계 업데이트
  const updateContractorStats = async (contractorId, reviewData) => {
    try {
      const contractorRef = doc(firestore, "contractors", contractorId);
      const contractorSnap = await getDoc(contractorRef);
      
      if (contractorSnap.exists()) {
        const contractorData = contractorSnap.data();
        const currentStats = contractorData.reviewStats || {
          totalReviews: 0,
          averageRating: 0,
          totalRating: 0
        };

        const newStats = {
          totalReviews: currentStats.totalReviews + 1,
          totalRating: currentStats.totalRating + reviewData.averageRating,
          averageRating: (currentStats.totalRating + reviewData.averageRating) / (currentStats.totalReviews + 1)
        };

        await updateDoc(contractorRef, {
          reviewStats: newStats,
          lastReviewAt: new Date()
        });
      }
    } catch (error) {
      console.error("Error updating contractor stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8">
            <div className="text-green-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-green-800 mb-2">평가 감사합니다!</h3>
            <p className="text-green-700 mb-4">
              소중한 의견을 주셔서 감사합니다. 더 나은 서비스를 제공하도록 노력하겠습니다.
            </p>
            <div className="text-sm text-green-600">
              <p>평균 평점: {averageRating}점</p>
              <p>제출 시간: {new Date().toLocaleString('ko-KR')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            시공 평가
          </h1>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>작업명:</strong> {job?.name}</p>
            {contractor && (
              <p><strong>시공업체:</strong> {contractor.name || contractor.displayName}</p>
            )}
            <p><strong>작업 ID:</strong> {jobId}</p>
          </div>
        </div>

        {/* 평점 입력 폼 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            상세 평가
          </h2>

          {/* 평점 카테고리들 */}
          {Object.entries(ratingCategories).map(([category, config]) => (
            <StarRating
              key={category}
              category={category}
              value={ratings[category]}
              onChange={handleRatingChange}
              label={config.label}
              description={config.description}
            />
          ))}

          {/* 평균 평점 표시 */}
          {averageRating > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>평균 평점:</strong> {averageRating}점
              </p>
            </div>
          )}

          {/* 추천 여부 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              다른 사람에게 추천하시겠습니까?
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recommend"
                  value="true"
                  checked={recommendToOthers === true}
                  onChange={() => setRecommendToOthers(true)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">네, 추천합니다</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recommend"
                  value="false"
                  checked={recommendToOthers === false}
                  onChange={() => setRecommendToOthers(false)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">아니오, 추천하지 않습니다</span>
              </label>
            </div>
          </div>

          {/* 코멘트 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상세 코멘트
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="시공 과정에서의 경험이나 개선사항을 자유롭게 작성해주세요..."
              maxLength={1000}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {comment.length}/1000
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={submitReview}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "제출 중..." : "평가 제출"}
            </button>
          </div>
        </div>

        {/* 안내사항 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">평가 안내사항</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 모든 항목을 평가해주시면 더 정확한 피드백을 제공할 수 있습니다.</li>
            <li>• 건설적인 의견은 다른 고객들에게 도움이 됩니다.</li>
            <li>• 제출된 평가는 수정할 수 없으니 신중하게 작성해주세요.</li>
            <li>• 개인정보는 보호되며, 익명으로 처리됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage; 