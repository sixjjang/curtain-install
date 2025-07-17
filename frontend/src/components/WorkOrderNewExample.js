import React, { useState } from 'react';
import WorkOrderNew from '../pages/WorkOrderNew';

export default function WorkOrderNewExample() {
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'create'
  const [workOrders, setWorkOrders] = useState([]);

  const handleCreateWorkOrder = () => {
    setCurrentView('create');
  };

  const handleSuccess = (workOrderId, workOrderData) => {
    alert(`시공 요청이 성공적으로 등록되었습니다!\n\n작업 ID: ${workOrderId}\n고객명: ${workOrderData.customerName}`);
    
    // 새로 생성된 작업 주문을 목록에 추가
    setWorkOrders(prev => [{
      id: workOrderId,
      ...workOrderData,
      createdAt: new Date()
    }, ...prev]);
    
    setCurrentView('list');
  };

  const handleCancel = () => {
    setCurrentView('list');
  };

  if (currentView === 'create') {
    return (
      <WorkOrderNew
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">시공 요청 관리</h2>
          <button
            onClick={handleCreateWorkOrder}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            새 시공 요청 등록
          </button>
        </div>
        
        <div className="space-y-6">
          {/* 설명 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">사용 방법</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• 시공 요청을 등록하여 실제 작업을 관리할 수 있습니다</li>
              <li>• 기존 견적과 연결하거나 독립적으로 생성할 수 있습니다</li>
              <li>• 시공 예정일과 긴급 수수료를 설정할 수 있습니다</li>
              <li>• 추가 요청사항을 통해 특별한 요구사항을 기록할 수 있습니다</li>
            </ul>
          </div>

          {/* 기능 설명 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">기능</h3>
            <ul className="text-gray-700 space-y-1">
              <li>✅ 견적 ID 연결 (선택사항)</li>
              <li>✅ 고객명 및 시공 장소 입력</li>
              <li>✅ 시공 예정일 설정 (오늘 이후만 가능)</li>
              <li>✅ 긴급 시공 수수료 설정 (0-100%)</li>
              <li>✅ 추가 요청사항 기록</li>
              <li>✅ 실시간 폼 검증</li>
              <li>✅ 로딩 상태 및 오류 처리</li>
              <li>✅ 폼 초기화 기능</li>
            </ul>
          </div>

          {/* 등록된 작업 주문 목록 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">등록된 시공 요청</h3>
            {workOrders.length === 0 ? (
              <p className="text-green-700">아직 등록된 시공 요청이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {workOrders.map((workOrder, index) => (
                  <div key={workOrder.id} className="bg-white border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{workOrder.customerName}</h4>
                        <p className="text-sm text-gray-600">{workOrder.location}</p>
                        <p className="text-sm text-gray-600">
                          예정일: {workOrder.scheduledDate.toLocaleDateString()}
                        </p>
                        {workOrder.urgentFeeRate > 0 && (
                          <p className="text-sm text-orange-600">
                            긴급 수수료: {workOrder.urgentFeeRate}%
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        workOrder.status === '등록' ? 'bg-blue-100 text-blue-800' :
                        workOrder.status === '진행중' ? 'bg-yellow-100 text-yellow-800' :
                        workOrder.status === '완료' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {workOrder.status}
                      </span>
                    </div>
                    {workOrder.additionalNotes && (
                      <p className="text-sm text-gray-600 mt-2">
                        요청사항: {workOrder.additionalNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 코드 예시 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">코드 예시</h3>
            <div className="text-yellow-700 space-y-2">
              <p><strong>기본 사용법:</strong></p>
              <pre className="bg-yellow-100 p-2 rounded text-sm overflow-x-auto">
{`import WorkOrderNew from '../pages/WorkOrderNew';

<WorkOrderNew
  onSuccess={(workOrderId, workOrderData) => {
    // 등록 성공 시 처리
    console.log('Work order created:', workOrderId);
  }}
  onCancel={() => {
    // 취소 시 처리
    console.log('Creation cancelled');
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
                <li><code>estimateId</code> - 연결된 견적 ID (선택사항)</li>
                <li><code>customerName</code> - 고객명 (필수)</li>
                <li><code>location</code> - 시공 장소 (필수)</li>
                <li><code>scheduledDate</code> - 시공 예정일 (필수)</li>
                <li><code>urgentFeeRate</code> - 긴급 시공 수수료 (%)</li>
                <li><code>status</code> - 작업 상태 (기본값: "등록")</li>
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
              <li>• 시공 예정일은 오늘 이후의 날짜만 선택 가능합니다</li>
              <li>• 긴급 수수료는 0-100% 범위 내에서 설정해야 합니다</li>
              <li>• 고객명과 시공 장소는 필수 입력 항목입니다</li>
              <li>• 견적 ID는 기존 견적과 연결할 때만 입력하세요</li>
              <li>• 등록 후에는 시공 상태를 관리할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 