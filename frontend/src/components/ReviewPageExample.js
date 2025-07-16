import React, { useState } from 'react';
import ReviewPage from './ReviewPage';

const ReviewPageExample = () => {
  const [jobId, setJobId] = useState('');
  const [userId, setUserId] = useState('');
  const [showReview, setShowReview] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jobId && userId) {
      setShowReview(true);
    } else {
      alert('작업 ID와 사용자 ID를 모두 입력해주세요.');
    }
  };

  const handleBack = () => {
    setShowReview(false);
    setJobId('');
    setUserId('');
  };

  if (showReview) {
    return (
      <div>
        <div className="bg-gray-100 p-4 border-b">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← 뒤로 가기
          </button>
        </div>
        <ReviewPage jobId={jobId} userId={userId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            리뷰 페이지 예제
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작업 ID
              </label>
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="예: job123"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자 ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="예: user456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              리뷰 페이지 열기
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">사용법 안내</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• 작업 ID: 평가할 작업의 고유 ID를 입력하세요.</p>
              <p>• 사용자 ID: 평가를 작성하는 사용자의 ID를 입력하세요.</p>
              <p>• 실제 데이터베이스에 존재하는 ID를 사용해야 합니다.</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">테스트 데이터</h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <p><strong>작업 ID:</strong> job123</p>
              <p><strong>사용자 ID:</strong> user456</p>
              <p>위 데이터로 테스트해보세요.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPageExample; 