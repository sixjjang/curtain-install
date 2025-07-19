import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../firebase/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function CustomerReviewPage() {
  const router = useRouter();
  const { workOrderId } = router.query;
  
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [reviewData, setReviewData] = useState({
    overallRating: 0,
    qualityRating: 0,
    punctualityRating: 0,
    communicationRating: 0,
    cleanlinessRating: 0,
    comment: '',
    recommendToOthers: null
  });

  useEffect(() => {
    if (workOrderId) {
      loadWorkOrder();
    }
  }, [workOrderId]);

  const loadWorkOrder = async () => {
    try {
      setLoading(true);
      const workOrderRef = doc(db, 'workOrders', workOrderId);
      const workOrderDoc = await getDoc(workOrderRef);
      
      if (workOrderDoc.exists()) {
        const data = workOrderDoc.data();
        setWorkOrder({
          id: workOrderDoc.id,
          ...data
        });
        
        // 이미 평가가 완료되었는지 확인
        if (data.reviewCompleted) {
          setError('이미 평가가 완료되었습니다.');
        }
      } else {
        setError('작업 주문을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('작업 주문 로드 실패:', error);
      setError('작업 주문을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (category, rating) => {
    setReviewData(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const handleInputChange = (field, value) => {
    setReviewData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 기본 검증
    if (reviewData.overallRating === 0) {
      setError('전체 만족도를 평가해주세요.');
      return;
    }
    
    if (reviewData.recommendToOthers === null) {
      setError('추천 여부를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 평가 데이터 생성
      const reviewSubmission = {
        workOrderId,
        customerName: workOrder.customerName,
        workerId: workOrder.workerId || null,
        workerName: workOrder.workerName || '시공자',
        sellerId: workOrder.sellerId,
        sellerName: workOrder.sellerName,
        ...reviewData,
        submittedAt: serverTimestamp(),
        reviewType: 'customer_web',
        ipAddress: null, // 클라이언트에서 IP 수집하지 않음
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null
      };

      // 평가 저장
      await addDoc(collection(db, 'customerReviews'), reviewSubmission);

      // 작업 주문에 평가 완료 표시
      const workOrderRef = doc(db, 'workOrders', workOrderId);
      await updateDoc(workOrderRef, {
        reviewCompleted: true,
        reviewCompletedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      setSuccess(true);
    } catch (error) {
      console.error('평가 제출 실패:', error);
      setError('평가 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, category, label }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(category, star)}
            className={`text-2xl transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            ★
          </button>
        ))}
      </div>
      <div className="text-sm text-gray-600 mt-1">
        {rating > 0 && `${rating}점`}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">작업 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">오류 발생</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.close()}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              창 닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">평가 완료</h2>
            <p className="text-gray-600 mb-6">
              소중한 평가를 감사합니다!<br />
              더 나은 서비스를 위해 노력하겠습니다.
            </p>
            <button
              onClick={() => window.close()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              창 닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm">
          {/* 헤더 */}
          <div className="bg-blue-600 text-white p-6 rounded-t-lg">
            <h1 className="text-2xl font-bold text-center">시공 완료 평가</h1>
            <p className="text-center mt-2 opacity-90">
              Install - 전문 시공 매칭
            </p>
          </div>

          {/* 작업 정보 */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">작업 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">고객명:</span>
                <span className="ml-2 font-medium">{workOrder.customerName}</span>
              </div>
              <div>
                <span className="text-gray-600">시공 장소:</span>
                <span className="ml-2 font-medium">{workOrder.location}</span>
              </div>
              <div>
                <span className="text-gray-600">시공일:</span>
                <span className="ml-2 font-medium">
                  {workOrder.scheduledDate?.toDate?.()?.toLocaleDateString() || '미정'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">작업 상태:</span>
                <span className="ml-2 font-medium">{workOrder.status}</span>
              </div>
            </div>
          </div>

          {/* 평가 폼 */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* 전체 만족도 */}
              <StarRating
                rating={reviewData.overallRating}
                onRatingChange={handleRatingChange}
                category="overallRating"
                label="전체 만족도 *"
              />

              {/* 세부 평가 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StarRating
                  rating={reviewData.qualityRating}
                  onRatingChange={handleRatingChange}
                  category="qualityRating"
                  label="시공 품질"
                />
                <StarRating
                  rating={reviewData.punctualityRating}
                  onRatingChange={handleRatingChange}
                  category="punctualityRating"
                  label="시간 준수"
                />
                <StarRating
                  rating={reviewData.communicationRating}
                  onRatingChange={handleRatingChange}
                  category="communicationRating"
                  label="소통 능력"
                />
                <StarRating
                  rating={reviewData.cleanlinessRating}
                  onRatingChange={handleRatingChange}
                  category="cleanlinessRating"
                  label="청결도"
                />
              </div>

              {/* 추천 여부 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  다른 분에게 추천하시겠습니까? *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recommendToOthers"
                      value="yes"
                      checked={reviewData.recommendToOthers === true}
                      onChange={() => handleInputChange('recommendToOthers', true)}
                      className="mr-2"
                    />
                    <span>네, 추천합니다</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recommendToOthers"
                      value="no"
                      checked={reviewData.recommendToOthers === false}
                      onChange={() => handleInputChange('recommendToOthers', false)}
                      className="mr-2"
                    />
                    <span>아니요</span>
                  </label>
                </div>
              </div>

              {/* 추가 의견 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  추가 의견 (선택사항)
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => handleInputChange('comment', e.target.value)}
                  placeholder="시공 과정에서 특별히 좋았던 점이나 개선되었으면 하는 점을 자유롭게 작성해주세요."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 제출 버튼 */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submitting ? '평가 제출 중...' : '평가 제출하기'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 안내 문구 */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>평가 제출 후에는 수정할 수 없습니다.</p>
          <p>정확한 평가를 위해 신중하게 작성해주세요.</p>
        </div>
      </div>
    </div>
  );
} 