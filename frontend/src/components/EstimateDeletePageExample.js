import React, { useState } from 'react';
import EstimateDeletePage from '../pages/EstimateDeletePage';

export default function EstimateDeletePageExample() {
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'delete'
  const [selectedEstimateId, setSelectedEstimateId] = useState(null);

  // 예시 견적 ID (실제 사용시에는 실제 견적 ID를 사용)
  const exampleEstimateId = 'example-estimate-id';

  const handleDeleteEstimate = (estimateId) => {
    setSelectedEstimateId(estimateId);
    setCurrentView('delete');
  };

  const handleDeleteSuccess = (estimateId) => {
    alert(`견적 ${estimateId}이(가) 성공적으로 삭제되었습니다!`);
    setCurrentView('list');
    setSelectedEstimateId(null);
    // 여기서 견적 목록을 새로고침하거나 다른 작업을 수행할 수 있습니다
  };

  const handleCancelDelete = () => {
    setCurrentView('list');
    setSelectedEstimateId(null);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedEstimateId(null);
  };

  if (currentView === 'delete') {
    return (
      <EstimateDeletePage
        estimateId={selectedEstimateId || exampleEstimateId}
        onDelete={handleDeleteSuccess}
        onCancel={handleCancelDelete}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">견적 삭제 페이지 예시</h2>
        
        <div className="space-y-6">
          {/* 설명 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">사용 방법</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• 견적 ID를 전달하여 삭제 확인 페이지를 표시합니다</li>
              <li>• onDelete 콜백으로 삭제 성공 시 처리를 할 수 있습니다</li>
              <li>• onCancel 콜백으로 취소 시 처리를 할 수 있습니다</li>
              <li>• onBack 콜백으로 뒤로 가기 시 처리를 할 수 있습니다</li>
              <li>• 상세한 견적 정보와 삭제 주의사항을 표시합니다</li>
            </ul>
          </div>

          {/* 기능 설명 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">기능</h3>
            <ul className="text-gray-700 space-y-1">
              <li>✅ 견적 정보 상세 표시</li>
              <li>✅ 삭제 주의사항 명시</li>
              <li>✅ 이중 확인 다이얼로그</li>
              <li>✅ 로딩 상태 표시</li>
              <li>✅ 오류 처리</li>
              <li>✅ 삭제 중 상태 표시</li>
              <li>✅ 취소 및 뒤로 가기 기능</li>
            </ul>
          </div>

          {/* 테스트 버튼 */}
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">테스트</h3>
              <p className="text-green-700 mb-3">
                아래 버튼을 클릭하여 견적 삭제 페이지를 테스트해보세요.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleDeleteEstimate(exampleEstimateId)}
                  className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                >
                  견적 삭제 페이지 열기
                </button>
                
                <button
                  onClick={() => handleDeleteEstimate('non-existent-id')}
                  className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
                >
                  존재하지 않는 견적 삭제 (오류 테스트)
                </button>
              </div>
            </div>
          </div>

          {/* 코드 예시 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">코드 예시</h3>
            <div className="text-yellow-700 space-y-2">
              <p><strong>기본 사용법:</strong></p>
              <pre className="bg-yellow-100 p-2 rounded text-sm overflow-x-auto">
{`import EstimateDeletePage from '../pages/EstimateDeletePage';

<EstimateDeletePage
  estimateId="your-estimate-id"
  onDelete={(id) => {
    // 삭제 성공 시 처리
    console.log('Estimate deleted:', id);
  }}
  onCancel={() => {
    // 취소 시 처리
    console.log('Delete cancelled');
  }}
  onBack={() => {
    // 뒤로 가기 시 처리
    console.log('Back to list');
  }}
/>`}
              </pre>
            </div>
          </div>

          {/* 주의사항 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">주의사항</h3>
            <ul className="text-red-700 space-y-1">
              <li>• 견적 삭제는 되돌릴 수 없는 작업입니다</li>
              <li>• 삭제 전 반드시 사용자 확인을 받아야 합니다</li>
              <li>• 관련된 모든 데이터가 영구적으로 삭제됩니다</li>
              <li>• 권한이 있는 사용자만 삭제할 수 있도록 제한해야 합니다</li>
              <li>• 삭제 로그를 남기는 것을 권장합니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 