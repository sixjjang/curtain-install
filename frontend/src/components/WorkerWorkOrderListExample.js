import React, { useState } from 'react';
import WorkerWorkOrderList from '../pages/WorkerWorkOrderList';

export default function WorkerWorkOrderListExample() {
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'accepted'
  const [acceptedWorkOrders, setAcceptedWorkOrders] = useState([]);

  // 예시 시공기사 ID (실제 사용시에는 로그인된 사용자 ID를 사용)
  const exampleWorkerId = 'worker_example_123';

  const handleWorkOrderAccepted = (workOrderId, workOrderData) => {
    // 수락된 작업을 목록에 추가
    const acceptedWorkOrder = {
      id: workOrderId,
      ...workOrderData,
      acceptedAt: new Date(),
      workerId: exampleWorkerId
    };
    
    setAcceptedWorkOrders(prev => [acceptedWorkOrder, ...prev]);
    
    alert(`작업이 성공적으로 수락되었습니다!\n\n고객명: ${workOrderData.customerName}\n시공 장소: ${workOrderData.location}`);
  };

  const handleBack = () => {
    setCurrentView('list');
  };

  if (currentView === 'accepted') {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">수락한 작업 목록</h2>
            <button
              onClick={handleBack}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              작업 목록으로
            </button>
          </div>

          {acceptedWorkOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">아직 수락한 작업이 없습니다</h3>
              <p className="text-gray-500">작업 목록에서 작업을 수락하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {acceptedWorkOrders.map((workOrder) => (
                <div key={workOrder.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{workOrder.customerName}</h3>
                      <p className="text-sm text-gray-600">{workOrder.location}</p>
                      <p className="text-sm text-gray-600">
                        수락일: {workOrder.acceptedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      수락됨
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">시공기사 작업 관리 시스템</h2>
        
        <div className="space-y-6">
          {/* 설명 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">사용 방법</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• 대기 중인 작업 목록을 확인할 수 있습니다</li>
              <li>• 원하는 작업을 선택하여 수락할 수 있습니다</li>
              <li>• 수락한 작업은 즉시 배정완료 상태로 변경됩니다</li>
              <li>• 긴급 수수료가 있는 작업은 추가 보상을 받을 수 있습니다</li>
              <li>• 실시간으로 새로운 작업이 업데이트됩니다</li>
            </ul>
          </div>

          {/* 기능 설명 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">기능</h3>
            <ul className="text-gray-700 space-y-1">
              <li>✅ 실시간 작업 목록 동기화</li>
              <li>✅ 작업 수락 기능</li>
              <li>✅ 긴급 작업 표시</li>
              <li>✅ 상세 작업 정보 표시</li>
              <li>✅ 수락 중 로딩 상태</li>
              <li>✅ 오류 처리 및 복구</li>
              <li>✅ 반응형 디자인</li>
              <li>✅ 수락한 작업 추적</li>
            </ul>
          </div>

          {/* 시공기사 정보 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">시공기사 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시공기사 ID</label>
                <p className="text-gray-900">{exampleWorkerId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">수락한 작업 수</label>
                <p className="text-gray-900">{acceptedWorkOrders.length}건</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setCurrentView('accepted')}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
              >
                수락한 작업 보기
              </button>
            </div>
          </div>

          {/* 작업 목록 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">대기 중인 작업 목록</h3>
            <p className="text-yellow-700 mb-4">
              아래에서 수락 가능한 작업 목록을 확인하고 작업을 수락할 수 있습니다.
            </p>
            
            <WorkerWorkOrderList
              workerId={exampleWorkerId}
              onWorkOrderAccepted={handleWorkOrderAccepted}
              onBack={() => console.log('Back button clicked')}
            />
          </div>

          {/* 코드 예시 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">코드 예시</h3>
            <div className="text-purple-700 space-y-2">
              <p><strong>기본 사용법:</strong></p>
              <pre className="bg-purple-100 p-2 rounded text-sm overflow-x-auto">
{`import WorkerWorkOrderList from '../pages/WorkerWorkOrderList';

<WorkerWorkOrderList
  workerId="worker_123"
  onWorkOrderAccepted={(workOrderId, workOrderData) => {
    // 작업 수락 시 처리
    console.log('Work order accepted:', workOrderId);
  }}
  onBack={() => {
    // 뒤로 가기 시 처리
    console.log('Back to previous page');
  }}
/>`}
              </pre>
            </div>
          </div>

          {/* 데이터 구조 */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-indigo-800 mb-2">데이터 구조</h3>
            <div className="text-indigo-700 space-y-2">
              <p><strong>WorkOrder 필드 (수락 시 업데이트):</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><code>status</code> - "등록" → "배정완료"로 변경</li>
                <li><code>assignedWorkerId</code> - 수락한 시공기사 ID</li>
                <li><code>assignedAt</code> - 수락 일시</li>
                <li><code>updatedAt</code> - 최종 수정 일시</li>
              </ul>
            </div>
          </div>

          {/* 주의사항 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">주의사항</h3>
            <ul className="text-red-700 space-y-1">
              <li>• 작업을 수락하면 즉시 배정완료 상태로 변경됩니다</li>
              <li>• 수락한 작업은 취소할 수 없습니다</li>
              <li>• 다른 시공기사가 먼저 수락한 작업은 수락할 수 없습니다</li>
              <li>• 긴급 수수료가 있는 작업은 추가 보상을 받을 수 있습니다</li>
              <li>• 작업 정보는 실시간으로 업데이트됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 