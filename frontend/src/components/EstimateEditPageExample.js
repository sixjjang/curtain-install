import React, { useState } from 'react';
import EstimateEditPage from '../pages/EstimateEditPage';

export default function EstimateEditPageExample() {
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'edit'
  const [selectedEstimateId, setSelectedEstimateId] = useState(null);

  // 예시 견적 ID (실제 사용시에는 실제 견적 ID를 사용)
  const exampleEstimateId = 'example-estimate-id';

  const handleEditEstimate = (estimateId) => {
    setSelectedEstimateId(estimateId);
    setCurrentView('edit');
  };

  const handleSaveSuccess = () => {
    alert('견적이 성공적으로 저장되었습니다!');
    setCurrentView('list');
    // 여기서 견적 목록을 새로고침하거나 다른 작업을 수행할 수 있습니다
  };

  const handleCancelEdit = () => {
    setCurrentView('list');
    setSelectedEstimateId(null);
  };

  if (currentView === 'edit') {
    return (
      <EstimateEditPage
        estimateId={selectedEstimateId || exampleEstimateId}
        onSave={handleSaveSuccess}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">견적 편집 예시</h2>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">사용 방법</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• 견적 ID를 전달하여 견적을 편집할 수 있습니다</li>
              <li>• onSave 콜백으로 저장 성공 시 처리를 할 수 있습니다</li>
              <li>• onCancel 콜백으로 취소 시 처리를 할 수 있습니다</li>
              <li>• 자동으로 수량 × 단가 = 소계가 계산됩니다</li>
              <li>• 항목 추가/삭제가 가능합니다</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">기능</h3>
            <ul className="text-gray-700 space-y-1">
              <li>✅ 견적 기본 정보 편집 (고객명, 연락처, 프로젝트 설명)</li>
              <li>✅ 견적 항목 추가/삭제/편집</li>
              <li>✅ 자동 총액 계산</li>
              <li>✅ 로딩 상태 표시</li>
              <li>✅ 오류 처리</li>
              <li>✅ 저장 중 상태 표시</li>
              <li>✅ 변경사항 확인 후 취소</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => handleEditEstimate(exampleEstimateId)}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              견적 편집 시작
            </button>
            
            <button
              onClick={() => handleEditEstimate('non-existent-id')}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
            >
              존재하지 않는 견적 편집 (오류 테스트)
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">주의사항</h4>
          <p className="text-yellow-700 text-sm">
            실제 사용 시에는 유효한 견적 ID를 전달해야 합니다. 
            존재하지 않는 견적 ID를 사용하면 오류가 발생합니다.
          </p>
        </div>
      </div>
    </div>
  );
} 