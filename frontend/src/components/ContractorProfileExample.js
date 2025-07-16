import React, { useState } from 'react';
import ContractorProfile from './ContractorProfile';

const ContractorProfileExample = () => {
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [contractorIdInput, setContractorIdInput] = useState('');

  // 예시 계약자 ID들
  const exampleContractorIds = [
    'contractor_001',
    'contractor_002', 
    'contractor_003',
    'contractor_high_grade',
    'contractor_new'
  ];

  const handleViewProfile = () => {
    if (contractorIdInput.trim()) {
      setSelectedContractorId(contractorIdInput.trim());
    }
  };

  const handleSelectExample = (id) => {
    setSelectedContractorId(id);
    setContractorIdInput(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            계약자 프로필 예시
          </h1>
          <p className="text-gray-600 mb-6">
            계약자 ID를 입력하거나 예시를 선택하여 프로필을 확인할 수 있습니다.
          </p>

          {/* 계약자 ID 입력 */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label htmlFor="contractorId" className="block text-sm font-medium text-gray-700 mb-2">
                계약자 ID
              </label>
              <input
                type="text"
                id="contractorId"
                value={contractorIdInput}
                onChange={(e) => setContractorIdInput(e.target.value)}
                placeholder="계약자 ID를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleViewProfile}
                disabled={!contractorIdInput.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                프로필 보기
              </button>
            </div>
          </div>

          {/* 예시 계약자 ID들 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">예시 계약자 ID</h3>
            <div className="flex flex-wrap gap-2">
              {exampleContractorIds.map((id) => (
                <button
                  key={id}
                  onClick={() => handleSelectExample(id)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 프로필 표시 */}
        {selectedContractorId && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-blue-900">
                    현재 표시 중: {selectedContractorId}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    계약자 프로필이 아래에 표시됩니다.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedContractorId('')}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  닫기
                </button>
              </div>
            </div>
            
            <ContractorProfile contractorId={selectedContractorId} />
          </div>
        )}

        {/* 사용법 안내 */}
        {!selectedContractorId && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">사용법</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">1. 계약자 ID 입력</h3>
                <p className="text-gray-600 text-sm">
                  위의 입력 필드에 조회하고 싶은 계약자의 ID를 입력하세요.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">2. 예시 ID 사용</h3>
                <p className="text-gray-600 text-sm">
                  테스트를 위해 제공된 예시 계약자 ID 중 하나를 선택할 수 있습니다.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">3. 프로필 확인</h3>
                <p className="text-gray-600 text-sm">
                  계약자의 상세 정보, 평점, 리뷰, 통계 등을 탭으로 구분하여 확인할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 기능 설명 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">주요 기능</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">개요</h4>
                  <p className="text-sm text-gray-600">
                    기본 정보와 주요 통계를 한눈에 확인
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">평점 상세</h4>
                  <p className="text-sm text-gray-600">
                    카테고리별 평점과 평점 분포 확인
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">최근 리뷰</h4>
                  <p className="text-sm text-gray-600">
                    최근 5개의 리뷰와 평가 내용 확인
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">통계</h4>
                  <p className="text-sm text-gray-600">
                    상세한 통계 정보와 등급 정보 확인
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorProfileExample; 