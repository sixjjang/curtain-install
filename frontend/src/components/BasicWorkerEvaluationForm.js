import { useState, useEffect } from "react";
import { auth } from "../firebase/firebase";
import { submitEvaluation, hasEvaluatedWorker } from "../utils/workerEvaluation";

/**
 * @param {Object} props
 * @param {string} props.workerId
 * @param {string} props.workOrderId
 * @param {string} props.sellerId
 * @param {function} [props.onSuccess]
 * @param {function} [props.onCancel]
 */
function BasicWorkerEvaluationForm({ workerId, workOrderId, sellerId, onSuccess, onCancel }) {
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
    // eslint-disable-next-line
  }, [workerId, workOrderId]);

  const checkExistingEvaluation = async (evaluatorId) => {
    try {
      const evaluated = await hasEvaluatedWorker(workerId, evaluatorId, workOrderId);
      setHasEvaluated(evaluated);
    } catch (error) {
      console.error("기존 평가 확인 실패:", error);
    }
  };

  async function handleSubmit(e) {
    e && e.preventDefault();
    if (!userId) {
      setError("로그인이 필요합니다.");
      return;
    }
    if (!comment.trim()) {
      setError("평가 코멘트를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const evaluation = {
        workerId,
        evaluatorId: userId,
        evaluatorType: "seller",
        rating,
        comment: comment.trim(),
        workOrderId,
        category: "overall"
      };
      const result = await submitEvaluation(evaluation);
      if (result.success) {
        setHasEvaluated(true);
        if (onSuccess) {
          onSuccess(result);
        } else {
          alert("평가가 등록되었습니다.");
        }
      } else {
        setError(result.message || "평가 등록에 실패했습니다.");
      }
    } catch (error) {
      setError(error.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (hasEvaluated) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800">이 작업에 대한 평가를 이미 완료하셨습니다.</p>
      </div>
    );
  }

  return (
    <form className="bg-white rounded-lg shadow p-6 max-w-md mx-auto" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold mb-4">시공기사 평가</h3>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <div className="space-y-4">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
          <select
            value={rating}
            onChange={e => setRating(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {[5, 4, 3, 2, 1].map(score => (
              <option key={score} value={score}>
                {score}점 - {score === 5
                  ? "매우 만족"
                  : score === 4
                  ? "만족"
                  : score === 3
                  ? "보통"
                  : score === 2
                  ? "불만족"
                  : "매우 불만족"}
              </option>
            ))}
          </select>
        </div>
        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">평가 코멘트</label>
          <textarea
            placeholder="작업에 대한 평가를 작성해주세요..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
          <p className="mt-1 text-sm text-gray-500">{comment.length}/500</p>
        </div>
        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !comment.trim()}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
              loading || !comment.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "평가 중..." : "평가 제출"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default BasicWorkerEvaluationForm; 