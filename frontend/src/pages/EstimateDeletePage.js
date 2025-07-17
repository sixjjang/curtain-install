import React, { useEffect, useState } from "react";
import { fetchEstimateById } from "../utils/fetchEstimateById";
import { deleteEstimate } from "../utils/deleteEstimate";

export default function EstimateDeletePage({ estimateId, onDelete, onCancel, onBack }) {
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
      setError('존재하지 않는 견적입니다.');
      console.error('견적 로딩 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!estimate) return;

    // 상세한 확인 다이얼로그
    const isConfirmed = window.confirm(
      `견적 "${estimate.customerName || '무명'}"을(를) 정말 삭제하시겠습니까?\n\n` +
      '⚠️ 주의사항:\n' +
      '• 이 작업은 되돌릴 수 없습니다\n' +
      '• 관련된 모든 데이터가 영구적으로 삭제됩니다\n' +
      '• 계약자에게 할당된 견적인 경우 할당도 해제됩니다\n\n' +
      '정말 삭제하시겠습니까?'
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setDeleting(true);
      await deleteEstimate(estimateId);
      
      alert("견적이 성공적으로 삭제되었습니다.");
      
      if (onDelete) {
        onDelete(estimateId);
      }
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
      console.error('견적 삭제 오류:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg">견적을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-10">
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
      <div className="max-w-xl mx-auto mt-10">
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-gray-600">견적을 찾을 수 없습니다.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-6 p-6">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">견적 삭제 확인</h2>
          <p className="text-gray-600 mt-2">삭제하기 전에 견적 정보를 확인해주세요</p>
        </div>

        {/* 견적 정보 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">삭제할 견적 정보</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">고객명:</span>
              <span className="font-medium text-gray-900">{estimate.customerName || '미입력'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">연락처:</span>
              <span className="font-medium text-gray-900">{estimate.customerPhone || '미입력'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">프로젝트 설명:</span>
              <span className="font-medium text-gray-900 max-w-xs text-right">
                {estimate.projectDescription || '미입력'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">견적 항목:</span>
              <span className="font-medium text-gray-900">{estimate.items?.length || 0}개</span>
            </div>
            
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-600 font-semibold">총 견적 금액:</span>
              <span className="font-bold text-lg text-red-600">
                {estimate.total?.toLocaleString() || 0}원
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">상태:</span>
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
            
            <div className="flex justify-between">
              <span className="text-gray-600">할당 상태:</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                estimate.assigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {estimate.assigned ? '할당됨' : '미할당'}
              </span>
            </div>
          </div>
        </div>

        {/* 경고 메시지 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">삭제 주의사항</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>이 작업은 되돌릴 수 없습니다</li>
                  <li>견적과 관련된 모든 데이터가 영구적으로 삭제됩니다</li>
                  <li>계약자에게 할당된 견적인 경우 할당도 해제됩니다</li>
                  <li>삭제 후에는 견적 정보를 복구할 수 없습니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            disabled={deleting}
          >
            취소
          </button>
          
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                삭제 중...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                견적 삭제
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 