import { useState } from "react";
import { getFirestore, collection, addDoc, Timestamp, doc, updateDoc, increment } from "firebase/firestore";

const firestore = getFirestore();

const ContractorEvaluationForm = ({ contractorId, contractorName, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [ratings, setRatings] = useState({
    quality: 0,
    punctuality: 0,
    costSaving: 0,
    communication: 0,
    professionalism: 0
  });

  const categories = {
    quality: {
      name: "품질",
      description: "작업 품질과 완성도",
      examples: ["깔끔한 마감", "정확한 설치", "내구성"]
    },
    punctuality: {
      name: "시간 준수",
      description: "약속 시간 준수",
      examples: ["정시 도착", "작업 시간 준수", "일정 관리"]
    },
    costSaving: {
      name: "비용 절약",
      description: "효율적인 비용 관리",
      examples: ["합리적인 가격", "불필요한 비용 절약", "자재 효율성"]
    },
    communication: {
      name: "의사소통",
      description: "고객과의 소통",
      examples: ["명확한 설명", "적극적인 소통", "문제 해결 능력"]
    },
    professionalism: {
      name: "전문성",
      description: "전문적인 태도와 기술",
      examples: ["전문 지식", "깔끔한 복장", "정중한 태도"]
    }
  };

  const getRatingDescription = (rating) => {
    const descriptions = {
      1: "매우 나쁨",
      2: "나쁨", 
      3: "보통",
      4: "좋음",
      5: "매우 좋음"
    };
    return descriptions[rating] || "";
  };

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const getAverageRating = () => {
    const values = Object.values(ratings);
    const validRatings = values.filter(rating => rating > 0);
    return validRatings.length > 0 
      ? (validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length).toFixed(1)
      : 0;
  };

  const isFormValid = () => {
    const values = Object.values(ratings);
    return values.every(rating => rating > 0) && comment.trim().length > 0;
  };

  const submitEvaluation = async () => {
    if (!isFormValid()) {
      alert("모든 항목을 평가하고 의견을 작성해주세요.");
      return;
    }

    setLoading(true);
    try {
      const averageRating = parseFloat(getAverageRating());
      
      // Add evaluation document
      const evaluationData = {
        contractorId,
        contractorName: contractorName || "이름 없음",
        ratings,
        averageRating,
        comment: comment.trim(),
        createdAt: Timestamp.now(),
        status: "submitted"
      };

      const docRef = await addDoc(collection(firestore, "evaluations"), evaluationData);

      // Update contractor statistics
      const contractorRef = doc(firestore, "contractors", contractorId);
      await updateDoc(contractorRef, {
        totalRatings: increment(1),
        lastEvaluationAt: Timestamp.now()
      });

      alert("평가가 성공적으로 등록되었습니다!");
      
      // Reset form
      setRatings({
        quality: 0,
        punctuality: 0,
        costSaving: 0,
        communication: 0,
        professionalism: 0
      });
      setComment("");
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("평가 제출 오류:", error);
      alert("평가 제출 중 오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (category, value) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(category, star)}
            className={`text-2xl transition-colors ${
              star <= value ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 border">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          시공기사 평가
        </h3>
        {contractorName && (
          <p className="text-gray-600">시공기사: {contractorName}</p>
        )}
      </div>

      {/* Category Ratings */}
      <div className="space-y-6 mb-6">
        {Object.entries(categories).map(([category, info]) => (
          <div key={category} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {info.name}
                </h4>
                <p className="text-sm text-gray-600 mb-1">{info.description}</p>
                <div className="text-xs text-gray-500">
                  예시: {info.examples.join(", ")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">평점</div>
                <div className="text-lg font-bold text-blue-600">
                  {ratings[category] > 0 ? ratings[category] : '-'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              {renderStarRating(category, ratings[category])}
              {ratings[category] > 0 && (
                <span className="text-sm text-gray-600 ml-3">
                  {getRatingDescription(ratings[category])}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Overall Rating */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-lg font-semibold text-blue-900">종합 평점</h4>
            <p className="text-sm text-blue-700">모든 항목의 평균 평점</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {getAverageRating()}
            </div>
            <div className="text-sm text-blue-600">/ 5.0</div>
          </div>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          추가 의견 *
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="시공 과정에서 느낀 점이나 개선사항을 자유롭게 작성해주세요."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
        <div className="text-xs text-gray-500 mt-1">
          최소 10자 이상 작성해주세요. ({comment.length}/500)
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          onClick={submitEvaluation}
          disabled={!isFormValid() || loading}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            isFormValid() && !loading
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              제출 중...
            </div>
          ) : (
            '평가 제출'
          )}
        </button>
      </div>

      {/* Form Validation */}
      {!isFormValid() && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">다음 항목을 확인해주세요:</p>
            <ul className="list-disc list-inside space-y-1">
              {Object.values(ratings).some(rating => rating === 0) && (
                <li>모든 평가 항목에 평점을 매겨주세요</li>
              )}
              {comment.trim().length === 0 && (
                <li>추가 의견을 작성해주세요</li>
              )}
              {comment.trim().length > 0 && comment.trim().length < 10 && (
                <li>의견은 최소 10자 이상 작성해주세요</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Rating Guide */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">평점 기준</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
          <div>⭐ 1점: 매우 나쁨 - 심각한 문제가 있음</div>
          <div>⭐⭐ 2점: 나쁨 - 개선이 필요함</div>
          <div>⭐⭐⭐ 3점: 보통 - 기대에 부합함</div>
          <div>⭐⭐⭐⭐ 4점: 좋음 - 기대를 넘어섬</div>
          <div className="md:col-span-2">⭐⭐⭐⭐⭐ 5점: 매우 좋음 - 완벽한 서비스</div>
        </div>
      </div>
    </div>
  );
};

export default ContractorEvaluationForm; 