import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { submitEvaluation, hasEvaluatedWorker } from "../utils/workerEvaluation";

function SimpleWorkerEvaluationForm({ workerId, workOrderId, sellerId, onSuccess, onCancel }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [userId, setUserId] = useState(null);

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

  async function handleSubmit() {
    if (!userId) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!comment.trim()) {
      setError('평가 코멘트를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const evaluation = {
        workerId,
        evaluatorId: userId,
        evaluatorType: 'seller',
        rating,
        comment: comment.trim(),
        workOrderId,
        category: 'overall'
      };

      const result = await submitEvaluation(evaluation);
      
      if (result.success) {
        setHasEvaluated(true);
        if (onSuccess) {
          onSuccess(result);
        } else {
          alert("평가가 등록되었습니다.");
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const getRatingStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}점)</span>
      </div>
    );
  };

  if (hasEvaluated) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">시공기사 평가</h3>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            평점 선택
          </label>
          {getRatingStars(rating)}
        </div>

        {/* Alternative Dropdown Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            또는 드롭다운에서 선택
          </label>
          <select 
            value={rating} 
            onChange={e => setRating(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[5, 4, 3, 2, 1].map((score) => (
              <option key={score} value={score}>
                {score}점 - {score === 5 ? '매우 만족' : score === 4 ? '만족' : score === 3 ? '보통' : score === 2 ? '불만족' : '매우 불만족'}
              </option>
            ))}
          </select>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            평가 코멘트
          </label>
          <textarea
            placeholder="작업에 대한 평가를 작성해주세요..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            {comment.length}/500
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
            onClick={handleSubmit}
            disabled={loading || !comment.trim()}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              loading || !comment.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0 3.042.135 5.824 7.938 3.042.135 5.824 7.938z"></path>
                </svg>
                평가 중...
              </div>
            ) : (
              '평가 제출'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SimpleWorkerEvaluationForm; 