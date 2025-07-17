import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import WorkOrderStatusChanger from "../../components/WorkOrderStatusChanger";
import Navigation from "../../components/Navigation";

export default function WorkOrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("작업 주문 ID가 필요합니다.");
      setLoading(false);
      return;
    }

    const workOrderRef = doc(db, "workOrders", id);

    const unsubscribe = onSnapshot(
      workOrderRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWorkOrder({ 
            id: docSnap.id, 
            ...data,
            // Firestore Timestamp를 Date로 변환
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
            scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate
          });
          setError(null);
        } else {
          setError("작업 정보를 찾을 수 없습니다.");
          setWorkOrder(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("작업 주문 조회 실패:", error);
        setError("작업 정보를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const handleStatusChanged = (newStatus) => {
    setWorkOrder((prev) => ({ ...prev, status: newStatus }));
    console.log(`작업 상태가 ${newStatus}로 변경되었습니다.`);
  };

  const handleBackToList = () => {
    router.push('/workorder/list');
  };

  const formatDate = (date) => {
    if (!date) return "미정";
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

  const getStatusColor = (status) => {
    const colors = {
      '등록': 'bg-blue-100 text-blue-800',
      '배정완료': 'bg-yellow-100 text-yellow-800',
      '진행중': 'bg-orange-100 text-orange-800',
      '완료': 'bg-green-100 text-green-800',
      '취소': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="작업 상세 정보" />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">작업 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="작업 상세 정보" />
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

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="작업 상세 정보" />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">작업 정보를 찾을 수 없습니다.</p>
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
      <Navigation title="작업 상세 정보" />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">작업 상세 정보</h1>
            <p className="text-gray-600 mt-1">작업 주문 ID: {workOrder.id}</p>
          </div>
          <button
            onClick={handleBackToList}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>

        {/* 작업 정보 카드 */}
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
                <p className="text-gray-900">{workOrder.customerName || "미입력"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  현재 상태
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(workOrder.status)}`}>
                  {workOrder.status || '미정'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시공 장소
                </label>
                <p className="text-gray-900">{workOrder.location || "미입력"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시공 예정일
                </label>
                <p className="text-gray-900">{formatDate(workOrder.scheduledDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <p className="text-gray-900">{workOrder.customerPhone || "미입력"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  긴급 수수료
                </label>
                <p className="text-gray-900">
                  {workOrder.urgentFeeRate > 0 ? `${workOrder.urgentFeeRate}%` : "없음"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 제품 정보 */}
        {workOrder.products && workOrder.products.length > 0 && (
          <div className="bg-white border rounded-lg shadow-sm mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">제품 정보</h2>
            </div>
            <div className="px-6 py-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left font-semibold">제품명</th>
                      <th className="border border-gray-300 p-3 text-left font-semibold">수량</th>
                      <th className="border border-gray-300 p-3 text-left font-semibold">단위</th>
                      <th className="border border-gray-300 p-3 text-left font-semibold">설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrder.products.map((product, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-3">{product.name}</td>
                        <td className="border border-gray-300 p-3">{product.quantity}</td>
                        <td className="border border-gray-300 p-3">{product.unit}</td>
                        <td className="border border-gray-300 p-3">{product.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 추가 요청사항 */}
        {workOrder.description && (
          <div className="bg-white border rounded-lg shadow-sm mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">추가 요청사항</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-900">{workOrder.description}</p>
            </div>
          </div>
        )}

        {/* 상태 변경 */}
        <div className="bg-white border rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">상태 관리</h2>
          </div>
          <div className="px-6 py-4">
            <WorkOrderStatusChanger 
              workOrderId={workOrder.id}
              currentStatus={workOrder.status}
              onStatusChanged={handleStatusChanged}
            />
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
                  생성일
                </label>
                <p className="text-gray-900">{formatDate(workOrder.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수정일
                </label>
                <p className="text-gray-900">{formatDate(workOrder.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}