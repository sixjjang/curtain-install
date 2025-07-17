import React, { useState } from 'react';
import WorkOrderList from '../pages/WorkOrderList';
import WorkOrderNew from '../pages/WorkOrderNew';

export default function WorkOrderListExample() {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'detail'
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  const handleWorkOrderSelect = (workOrder) => {
    setSelectedWorkOrder(workOrder);
    setCurrentView('detail');
  };

  const handleCreateNew = () => {
    setCurrentView('create');
  };

  const handleCreateSuccess = (workOrderId, workOrderData) => {
    alert(`시공 요청이 성공적으로 등록되었습니다!\n\n작업 ID: ${workOrderId}\n고객명: ${workOrderData.customerName}`);
    setCurrentView('list');
  };

  const handleCancel = () => {
    setCurrentView('list');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedWorkOrder(null);
  };

  if (currentView === 'create') {
    return (
      <WorkOrderNew
        onSuccess={handleCreateSuccess}
        onCancel={handleCancel}
      />
    );
  }

  if (currentView === 'detail') {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">시공건 상세보기</h2>
            <button
              onClick={handleBackToList}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
            >
              목록으로
            </button>
          </div>

          {selectedWorkOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">고객명</label>
                  <p className="text-gray-900">{selectedWorkOrder.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시공 장소</label>
                  <p className="text-gray-900">{selectedWorkOrder.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시공 예정일</label>
                  <p className="text-gray-900">
                    {selectedWorkOrder.scheduledDate?.toDate 
                      ? selectedWorkOrder.scheduledDate.toDate().toLocaleDateString()
                      : new Date(selectedWorkOrder.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">긴급 수수료</label>
                  <p className="text-gray-900">{selectedWorkOrder.urgentFeeRate || 0}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedWorkOrder.status === '등록' ? 'bg-blue-100 text-blue-800' :
                    selectedWorkOrder.status === '배정중' ? 'bg-yellow-100 text-yellow-800' :
                    selectedWorkOrder.status === '배정완료' ? 'bg-green-100 text-green-800' :
                    selectedWorkOrder.status === '완료' ? 'bg-green-100 text-green-800' :
                    selectedWorkOrder.status === '취소' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedWorkOrder.status}
                  </span>
                </div>
                {selectedWorkOrder.estimateId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연결된 견적</label>
                    <p className="text-gray-900">{selectedWorkOrder.estimateId}</p>
                  </div>
                )}
              </div>
              
              {selectedWorkOrder.additionalNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">추가 요청사항</label>
                  <p className="text-gray-900">{selectedWorkOrder.additionalNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">시공건 관리 시스템</h2>
        
        <div className="space-y-6">
          {/* 설명 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">사용 방법</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• 시공건 목록을 확인하고 관리할 수 있습니다</li>
              <li>• 상태별 필터링과 검색 기능을 사용할 수 있습니다</li>
              <li>• 각 시공건의 상세 정보를 확인할 수 있습니다</li>
              <li>• 새로운 시공건을 등록할 수 있습니다</li>
              <li>• 실시간으로 데이터가 업데이트됩니다</li>
            </ul>
          </div>

          {/* 기능 설명 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">기능</h3>
            <ul className="text-gray-700 space-y-1">
              <li>✅ 실시간 데이터 동기화</li>
              <li>✅ 상태별 필터링</li>
              <li>✅ 고객명/장소 검색</li>
              <li>✅ 상태별 통계 표시</li>
              <li>✅ 상세보기 기능</li>
              <li>✅ 새 시공건 등록</li>
              <li>✅ 반응형 디자인</li>
              <li>✅ 오류 처리 및 로딩 상태</li>
            </ul>
          </div>

          {/* 시공건 목록 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">시공건 목록</h3>
            <p className="text-green-700 mb-4">
              아래에서 실제 시공건 목록을 확인하고 관리할 수 있습니다.
            </p>
            
            <WorkOrderList
              onWorkOrderSelect={handleWorkOrderSelect}
              onCreateNew={handleCreateNew}
            />
          </div>

          {/* 코드 예시 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">코드 예시</h3>
            <div className="text-yellow-700 space-y-2">
              <p><strong>기본 사용법:</strong></p>
              <pre className="bg-yellow-100 p-2 rounded text-sm overflow-x-auto">
{`import WorkOrderList from '../pages/WorkOrderList';

<WorkOrderList
  onWorkOrderSelect={(workOrder) => {
    // 시공건 선택 시 처리
    console.log('Selected work order:', workOrder);
  }}
  onCreateNew={() => {
    // 새 시공건 생성 시 처리
    console.log('Create new work order');
  }}
/>`}
              </pre>
            </div>
          </div>

          {/* 데이터 구조 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">데이터 구조</h3>
            <div className="text-purple-700 space-y-2">
              <p><strong>WorkOrder 필드:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><code>id</code> - 시공건 고유 ID</li>
                <li><code>estimateId</code> - 연결된 견적 ID (선택사항)</li>
                <li><code>customerName</code> - 고객명</li>
                <li><code>location</code> - 시공 장소</li>
                <li><code>scheduledDate</code> - 시공 예정일</li>
                <li><code>urgentFeeRate</code> - 긴급 시공 수수료 (%)</li>
                <li><code>status</code> - 작업 상태</li>
                <li><code>additionalNotes</code> - 추가 요청사항</li>
                <li><code>createdAt</code> - 생성일시</li>
                <li><code>updatedAt</code> - 수정일시</li>
              </ul>
            </div>
          </div>

          {/* 주의사항 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">주의사항</h3>
            <ul className="text-red-700 space-y-1">
              <li>• 시공건 데이터는 실시간으로 동기화됩니다</li>
              <li>• 상태 변경 시 즉시 반영됩니다</li>
              <li>• 검색은 고객명과 시공 장소에서만 작동합니다</li>
              <li>• 필터와 검색을 동시에 사용할 수 있습니다</li>
              <li>• 상세보기에서 시공건 정보를 확인할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 