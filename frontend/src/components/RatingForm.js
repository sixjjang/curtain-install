import { useState } from "react";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

const firestore = getFirestore();

const RatingForm = ({ 
  targetId, 
  raterId, 
  role, 
  targetName = "대상",
  onSuccess,
  onCancel,
  categories = [
    { key: 'quality', label: '품질', description: '작업 품질과 완성도' },
    { key: 'punctuality', label: '시간 준수', description: '약속 시간 준수' },
    { key: 'communication', label: '의사소통', description: '소통과 협조' },
    { key: 'professionalism', label: '전문성', description: '전문 지식과 태도' },
    { key: 'overall', label: '종합 평가', description: '전체적인 만족도' }
  ]
}) => {
  const [ratings, setRatings] = useState(
    categories.reduce((acc, category) => {
      acc[category.key] = 5;
      return acc;
    }, {})
  );
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // 평균 평점 계산
  const averageRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / Object.keys(ratings).length;

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
    // 에러 제거
    if (errors[category]) {
      setErrors(prev => ({
        ...prev,
        [category]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // 필수 카테고리 검증
    categories.forEach(category => {
      if (!ratings[category.key] || ratings[category.key] < 1) {
        newErrors[category.key] = `${category.label} 평가를 선택해주세요.`;
      }
    });

    // 코멘트 검증
    if (!comment.trim()) {
      newErrors.comment = "평가 내용을 입력해주세요.";
    } else if (comment.trim().length < 10) {
      newErrors.comment = "평가 내용은 최소 10자 이상 입력해주세요.";
    } else if (comment.trim().length > 500) {
      newErrors.comment = "평가 내용은 최대 500자까지 입력 가능합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitRating = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const ratingData = {
        targetId,
        raterId,
        role,
        ratings,
        averageRating: Math.round(averageRating * 10) / 10, // 소수점 1자리까지
        comment: comment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(firestore, "ratings"), ratingData);
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) {
          onSuccess(ratingData);
        }
        // 폼 초기화
        setRatings(categories.reduce((acc, category) => {
          acc[category.key] = 5;
          return acc;
        }, {}));
        setComment("");
        setErrors({});
      }, 2000);

    } catch (error) {
      console.error("평가 등록 오류:", error);
      setErrors({ submit: "평가 등록 중 오류가 발생했습니다. 다시 시도해주세요." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const renderStars = (category, value) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleRatingChange(category, i)}
          className={`p-1 transition-colors ${
            i <= value 
              ? 'text-yellow-400 hover:text-yellow-500' 
              : 'text-gray-300 hover:text-gray-400'
          }`}
          disabled={isSubmitting}
        >
          <StarIcon className="h-6 w-6" />
        </button>
      );
    }
    return stars;
  };

  const getRatingText = (rating) => {
    if (rating >= 4.5) return "매우 만족";
    if (rating >= 4.0) return "만족";
    if (rating >= 3.0) return "보통";
    if (rating >= 2.0) return "불만족";
    return "매우 불만족";
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-blue-600";
    if (rating >= 3.0) return "text-yellow-600";
    if (rating >= 2.0) return "text-orange-600";
    return "text-red-600";
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            평가가 성공적으로 등록되었습니다!
          </h3>
          <p className="text-gray-600">
            {targetName}에 대한 평가가 완료되었습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {targetName} 평가 작성
          </h2>
          {onCancel && (
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          정확하고 객관적인 평가를 부탁드립니다.
        </p>
      </div>

      {/* 평점 입력 */}
      <div className="px-6 py-4">
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.key} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{category.label}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {ratings[category.key]}점
                  </div>
                  <div className={`text-sm ${getRatingColor(ratings[category.key])}`}>
                    {getRatingText(ratings[category.key])}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {renderStars(category.key, ratings[category.key])}
              </div>
              
              {errors[category.key] && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {errors[category.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* 평균 평점 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">평균 평점</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {averageRating.toFixed(1)}점
              </div>
              <div className={`text-sm ${getRatingColor(averageRating)}`}>
                {getRatingText(averageRating)}
              </div>
            </div>
          </div>
        </div>

        {/* 평가 내용 */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            평가 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="경험하신 내용을 자세히 작성해주세요. (10-500자)"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (errors.comment) {
                setErrors(prev => ({ ...prev, comment: null }));
              }
            }}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
              errors.comment ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-2">
            {errors.comment && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {errors.comment}
              </p>
            )}
            <span className={`text-sm ${
              comment.length > 500 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {comment.length}/500
            </span>
          </div>
        </div>

        {/* 제출 에러 */}
        {errors.submit && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm flex items-center gap-1">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {errors.submit}
            </p>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3">
        {onCancel && (
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            취소
          </button>
        )}
        <button
          onClick={submitRating}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              등록 중...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4" />
              평가 등록
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RatingForm; 