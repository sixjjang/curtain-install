import React, { useState } from "react";
import WorkOrderDetail from "../pages/WorkOrderDetail";

export default function WorkOrderDetailExample() {
  const [currentView, setCurrentView] = useState("list"); // "list" or "detail"
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);

  // 샘플 작업 주문 목록
  const sampleWorkOrders = [
    {
      id: "work-order-1",
      title: "거실 커튼 설치",
      description: "거실 커튼 설치 및 조정 작업",
      status: "등록",
      customerId: "customer-123",
      sellerId: "seller-456",
      workerId: "worker-789",
      estimatedCost: 150000,
      location: "서울시 강남구",
      priority: "normal",
      urgentFeeRate: 0,
      scheduledDate: new Date("2024-01-15"),
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10")
    },
    {
      id: "work-order-2",
      title: "침실 블라인드 설치",
      description: "침실 블라인드 설치 및 조정",
      status: "진행중",
      customerId: "customer-124",
      sellerId: "seller-457",
      workerId: "worker-790",
      estimatedCost: 120000,
      location: "서울시 서초구",
      priority: "high",
      urgentFeeRate: 15,
      scheduledDate: new Date("2024-01-12"),
      createdAt: new Date("2024-01-08"),
      updatedAt: new Date("2024-01-11")
    },
    {
      id: "work-order-3",
      title: "사무실 커튼 교체",
      description: "사무실 커튼 교체 및 정리",
      status: "완료",
      customerId: "customer-125",
      sellerId: "seller-458",
      workerId: "worker-791",
      estimatedCost: 200000,
      location: "서울시 마포구",
      priority: "normal",
      urgentFeeRate: 0,
      scheduledDate: new Date("2024-01-10"),
      createdAt: new Date("2024-01-05"),
      updatedAt: new Date("2024-01-10")
    }
  ];

  const handleWorkOrderClick = (workOrderId) => {
    setSelectedWorkOrderId(workOrderId);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedWorkOrderId(null);
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

  const formatDate = (date) => {
    if (!date) return "미정";
    return date.toLocaleDateString('ko-KR');
  };

  // 작업 주문 목록 뷰
  if (currentView === "list") {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">작업 주문 목록</h1>
          <button
            onClick={() => setCurrentView("detail")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            새 작업 주문 생성
          </button>
        </div>

        <div className="bg-white border rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">작업 주문 목록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예정일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예상 비용
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleWorkOrders.map((workOrder) => (
                  <tr 
                    key={workOrder.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleWorkOrderClick(workOrder.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {workOrder.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {workOrder.description}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {workOrder.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(workOrder.status)}`}>
                        {workOrder.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(workOrder.scheduledDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {workOrder.estimatedCost ? `${workOrder.estimatedCost.toLocaleString()}원` : "미정"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWorkOrderClick(workOrder.id);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 사용법 안내 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">사용법</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 작업 주문 행을 클릭하여 상세 정보를 확인할 수 있습니다.</li>
            <li>• 상세 페이지에서 작업 상태를 변경할 수 있습니다.</li>
            <li>• 상태 변경 시 자동으로 FCM 알림이 전송됩니다.</li>
            <li>• 실시간으로 작업 정보가 업데이트됩니다.</li>
          </ul>
        </div>
      </div>
    );
  }

  // 작업 주문 상세 뷰
  return (
    <div>
      <WorkOrderDetail
        workOrderId={selectedWorkOrderId}
        onBack={handleBackToList}
      />
    </div>
  );
} 