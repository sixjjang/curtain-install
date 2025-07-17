import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import Navigation from '../../components/Navigation';

export default function EstimateDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('견적서 ID가 필요합니다.');
      setLoading(false);
      return;
    }

    const estimateRef = doc(db, 'estimates', id);

    const unsubscribe = onSnapshot(
      estimateRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEstimate({ 
            id: docSnap.id, 
            ...data,
            // Firestore Timestamp를 Date로 변환
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
          });
          setError('');
        } else {
          setError('견적서를 찾을 수 없습니다.');
          setEstimate(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('견적서 조회 실패:', error);
        setError('견적서를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const handleBackToList = () => {
    router.push('/estimate/list');
  };

  const handleEdit = () => {
    router.push(`/estimate/edit/${id}`);
  };

  const formatDate = (date) => {
    if (!date) return '날짜 없음';
    if (date instanceof Date) {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">대기중</span>;
      case 'accepted':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">승인됨</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">거절됨</span>;
      case 'completed':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">완료됨</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="견적서 상세" />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">견적서를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="견적서 상세" />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleBackToList}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="견적서 상세" />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">견적서를 찾을 수 없습니다.</p>
            <button
              onClick={handleBackToList}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="견적서 상세" />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">견적서 상세</h1>
            <p className="text-gray-600 mt-1">견적서 ID: {estimate.id}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              수정
            </button>
            <button
              onClick={handleBackToList}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              목록으로
            </button>
          </div>
        </div>

        {/* 견적서 기본 정보 */}
        <div className="bg-white border rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">기본 정보</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고객명
                </label>
                <p className="text-gray-900">{estimate.customerName || '미입력'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <p className="text-gray-900">{estimate.customerPhone || '미입력'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <div>{getStatusBadge(estimate.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  할당 상태
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  estimate.assigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {estimate.assigned ? '할당됨' : '미할당'}
                </span>
              </div>
            </div>
            
            {estimate.projectDescription && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 설명
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{estimate.projectDescription}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작성일</label>
                  <p className="text-gray-900">{formatDate(estimate.createdAt)}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-gray-700 mb-1">총 견적 금액</label>
                  <p className="text-3xl font-bold text-green-600">
                    {estimate.total ? `${estimate.total.toLocaleString()}원` : '미정'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 견적 항목 */}
        {estimate.items && estimate.items.length > 0 && (
          <div className="bg-white border rounded-lg shadow-sm mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">견적 항목</h2>
            </div>
            <div className="px-6 py-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left font-semibold">항목명</th>
                      <th className="border border-gray-300 p-3 text-left font-semibold">수량</th>
                      <th className="border border-gray-300 p-3 text-left font-semibold">단가</th>
                      <th className="border border-gray-300 p-3 text-left font-semibold">소계</th>
                      <th className="border border-gray-300 p-3 text-left font-semibold">설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimate.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-3 font-medium">{item.name || '미입력'}</td>
                        <td className="border border-gray-300 p-3">{item.quantity || 0}</td>
                        <td className="border border-gray-300 p-3">
                          {item.unitPrice ? `${item.unitPrice.toLocaleString()}원` : '미정'}
                        </td>
                        <td className="border border-gray-300 p-3 font-semibold">
                          {item.subtotal ? `${item.subtotal.toLocaleString()}원` : '미정'}
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-gray-600">
                          {item.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="border border-gray-300 p-3 text-right font-semibold">
                        총 합계:
                      </td>
                      <td className="border border-gray-300 p-3 font-bold text-lg text-green-600">
                        {estimate.total ? `${estimate.total.toLocaleString()}원` : '미정'}
                      </td>
                      <td className="border border-gray-300 p-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 추가 정보 */}
        <div className="bg-white border rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">추가 정보</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  유효기간
                </label>
                <p className="text-gray-900">
                  {estimate.validUntil ? formatDate(estimate.validUntil) : '무제한'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  결제 조건
                </label>
                <p className="text-gray-900">
                  {estimate.paymentTerms || '별도 협의'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시공 기간
                </label>
                <p className="text-gray-900">
                  {estimate.constructionPeriod || '별도 협의'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자
                </label>
                <p className="text-gray-900">
                  {estimate.assignedTo || '미배정'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 타임스탬프 */}
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">타임스탬프</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작성일
                </label>
                <p className="text-gray-900">{formatDate(estimate.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수정일
                </label>
                <p className="text-gray-900">{formatDate(estimate.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 