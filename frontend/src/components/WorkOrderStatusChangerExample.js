import React, { useState } from "react";
import WorkOrderStatusChanger from "./WorkOrderStatusChanger";

export default function WorkOrderStatusChangerExample() {
  const [workOrder, setWorkOrder] = useState({
    id: "work-order-123",
    status: "등록",
    title: "커튼 설치 작업",
    description: "거실 커튼 설치 및 조정",
    createdAt: new Date(),
  });

  const handleStatusChanged = (newStatus) => {
    setWorkOrder(prev => ({
      ...prev,
      status: newStatus
    }));
    console.log(`작업 상태가 ${newStatus}로 변경되었습니다.`);
  };

  const getStatusColor = (status) => {
    const colors = {
      등록: "bg-blue-100 text-blue-800",
      배정완료: "bg-yellow-100 text-yellow-800",
      진행중: "bg-orange-100 text-orange-800",
      완료: "bg-green-100 text-green-800",
      취소: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">작업 상태 변경 예제</h1>
      
      {/* 작업 정보 표시 */}
      <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">작업 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              작업 ID
            </label>
            <p className="text-gray-900">{workOrder.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 상태
            </label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(workOrder.status)}`}>
              {workOrder.status}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              작업 제목
            </label>
            <p className="text-gray-900">{workOrder.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              생성일
            </label>
            <p className="text-gray-900">
              {workOrder.createdAt.toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            작업 설명
          </label>
          <p className="text-gray-900">{workOrder.description}</p>
        </div>
      </div>

      {/* 상태 변경 컴포넌트 */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">상태 변경</h2>
        <WorkOrderStatusChanger
          workOrderId={workOrder.id}
          currentStatus={workOrder.status}
          onStatusChanged={handleStatusChanged}
        />
      </div>

      {/* 상태 흐름 설명 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">상태 흐름 가이드</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>등록</strong> → 배정완료 또는 취소</p>
          <p><strong>배정완료</strong> → 진행중 또는 취소</p>
          <p><strong>진행중</strong> → 완료 또는 취소</p>
          <p><strong>완료</strong> → 더 이상 변경 불가</p>
          <p><strong>취소</strong> → 더 이상 변경 불가</p>
        </div>
      </div>

      {/* 디버그 정보 */}
      <div className="bg-gray-50 border rounded-lg p-4 mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">디버그 정보</h3>
        <pre className="text-xs text-gray-600 overflow-auto">
          {JSON.stringify(workOrder, null, 2)}
        </pre>
      </div>
    </div>
  );
} 