import { useState, useEffect } from "react";
import { auth } from "../firebase/firebase";
import { submitEvaluation, hasEvaluatedWorker } from "../utils/workerEvaluation";

export default function WorkerEvaluationForm({ workerId, workOrderId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
    category: "overall"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [userId, setUserId] = useState(null);

  const categories = [
    { value: "overall", label: "전체 평가", icon: "⭐" },
    { value: "quality", label: "작업 품질", icon: "🔧" },
    { value: "punctuality", label: "시간 준수", icon: "⏰" },
    { value: "communication", label: "의사소통", icon: "💬" }
  ];

  const ratingLabels = {
    1: "매우 불만족",
    2: "불만족",
    3: "보통",
    4: "만족",
    5: "매우 만족"
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
        checkExistingEvaluation(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribeAuth();
  }, [workerId, workOrderId]);

  const checkExistingEvaluation = async (evaluatorId) => {
    try {
      const evaluated = await hasEvaluatedWorker(workerId, evaluatorId, workOrderId);
      setHasEvaluated(evaluated);
    } catch (error) {
      console.error('기존 평가 확인 실패:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating: parseInt(rating)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!formData.comment.trim()) {
      setError('평가 코멘트를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const evaluation = {
        workerId,
        evaluatorId: userId,
        evaluatorType: 'seller', // or 'customer' based on context
        rating: formData.rating,
        comment: formData.comment.trim(),
        workOrderId,
        category: formData.category
      };

      const result = await submitEvaluation(evaluation);
      
      if (result.success) {
        setHasEvaluated(true);
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (hasEvaluated) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              평가 완료
            </h3>
            <p className="text-sm text-green-700 mt-1">
              이 작업에 대한 평가를 이미 완료하셨습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          작업자 평가
        </h2>
        <p className="text-gray-600">
          작업 완료 후 작업자의 성과를 평가해주세요.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            평가 카테고리
          </label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <label
                key={category.value}
                className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${
                  formData.category === category.value
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : 'border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={category.value}
                  checked={formData.category === category.value}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="flex flex-1">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{category.icon}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {category.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`h-5 w-5 shrink-0 rounded-full border flex items-center justify-center ${
                  formData.category === category.value
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {formData.category === category.value && (
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            평점
          </label>
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleRatingChange(rating)}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
                  formData.rating === rating
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-1">
                  {[...Array(rating)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-6 w-6 ${
                        formData.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-gray-600">{rating}점</span>
                <span className="text-xs text-gray-500 mt-1">
                  {ratingLabels[rating]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            평가 코멘트
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={4}
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="작업에 대한 구체적인 평가를 작성해주세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            최소 10자 이상 작성해주세요. ({formData.comment.length}/500)
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={loading || formData.comment.length < 10}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              loading || formData.comment.length < 10
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                평가 중...
              </div>
            ) : (
              '평가 제출'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 