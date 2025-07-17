import React, { useEffect, useState } from "react";
import { fetchEstimateById } from "../utils/fetchEstimateById";
import { deleteEstimate } from "../utils/deleteEstimate";

export default function EstimateDetailPage({ estimateId, onDelete, onEdit, onBack }) {
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (estimateId) {
      loadEstimate(estimateId);
    }
  }, [estimateId]);

  const loadEstimate = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEstimateById(id);
      setEstimate(data);
    } catch (err) {
      setError(err.message);
      console.error('견적 로딩 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!estimate) return;

    // 사용자 확인
    const isConfirmed = window.confirm(
      `견적 "${estimate.customerName || '무명'}"을(를) 정말 삭제하시겠습니까?\n\n` +
      '이 작업은 되돌릴 수 없습니다.'
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setDeleting(true);
      await deleteEstimate(estimate.id);
      
      alert('견적이 성공적으로 삭제되었습니다!');
      
      if (onDelete) {
        onDelete(estimate.id);
      }
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
      console.error('견적 삭제 오류:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    if (onEdit && estimate) {
      onEdit(estimate.id);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg">견적을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-gray-600">견적을 찾을 수 없습니다.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">견적 상세보기</h2>
        <div className="space-x-3">
          <button
            onClick={handleBack}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
          >
            목록으로
          </button>
        </div>
      </div>

      {/* 견적 기본 정보 */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">고객명</label>
            <p className="text-gray-900">{estimate.customerName || '미입력'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <p className="text-gray-900">{estimate.customerPhone || '미입력'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              estimate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              estimate.status === 'accepted' ? 'bg-green-100 text-green-800' :
              estimate.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {estimate.status === 'pending' ? '대기중' :
               estimate.status === 'accepted' ? '승인됨' :
               estimate.status === 'rejected' ? '거절됨' :
               '완료됨'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">할당 상태</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              estimate.assigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {estimate.assigned ? '할당됨' : '미할당'}
            </span>
          </div>
        </div>
        
        {estimate.projectDescription && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 설명</label>
            <p className="text-gray-900">{estimate.projectDescription}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생성일</label>
              <p className="text-gray-900">
                {estimate.createdAt ? new Date(estimate.createdAt.seconds * 1000).toLocaleDateString() : '알 수 없음'}
              </p>
            </div>
            <div className="text-right">
              <label className="block text-sm font-medium text-gray-700 mb-1">총 견적 금액</label>
              <p className="text-2xl font-bold text-green-600">
                {estimate.total.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 견적 항목 */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">견적 항목</h3>
        
        {estimate.items && estimate.items.length > 0 ? (
          <div className="space-y-3">
            {estimate.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">항목명</label>
                    <p className="text-gray-900">{item.name || '미입력'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
                    <p className="text-gray-900">{item.quantity || 1}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">단가</label>
                    <p className="text-gray-900">{(item.amount || 0).toLocaleString()}원</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">소계</label>
                    <p className="text-gray-900 font-semibold">{(item.itemTotal || 0).toLocaleString()}원</p>
                  </div>
                </div>
                
                {item.description && (
                  <div className="mt-3 pt-3 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <p className="text-gray-900">{item.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>견적 항목이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          onClick={handleBack}
          className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
        >
          목록으로
        </button>
        
        {!estimate.assigned && (
          <>
            <button
              onClick={handleEdit}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              수정
            </button>
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          </>
        )}
      </div>
    </div>
  );
} 