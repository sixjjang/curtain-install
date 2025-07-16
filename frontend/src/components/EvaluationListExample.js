import React, { useState } from 'react';
import ContractorEvaluationList from './ContractorEvaluationList';

const EvaluationListExample = () => {
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [maxItems, setMaxItems] = useState(10);
  const [showFilters, setShowFilters] = useState(true);

  // 샘플 시공기사 데이터 (실제로는 데이터베이스에서 가져옴)
  const sampleContractors = [
    { id: 'contractor1', name: '김철수', grade: 'A', averageRating: 4.7 },
    { id: 'contractor2', name: '이영희', grade: 'B', averageRating: 4.2 },
    { id: 'contractor3', name: '박민수', grade: 'C', averageRating: 3.8 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            시공기사 평가 내역 시스템
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              기능 설명
            </h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>상세 평가 표시:</strong> 카테고리별 평가 (품질, 시간 준수, 비용 절약, 의사소통, 전문성)</li>
              <li>• <strong>필터링:</strong> 평점 범위, 댓글 유무, 정렬 옵션</li>
              <li>• <strong>시각적 표시:</strong> 별점, 색상 코딩, 만족도 레이블</li>
              <li>• <strong>반응형 디자인:</strong> 모바일과 데스크톱에서 최적화된 표시</li>
              <li>• <strong>로딩 상태:</strong> 데이터 로딩 중 사용자 친화적인 표시</li>
            </ul>
          </div>
        </div>

        {/* 설정 패널 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">설정</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시공기사 선택
              </label>
              <select
                value={selectedContractorId}
                onChange={(e) => setSelectedContractorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">시공기사를 선택하세요</option>
                {sampleContractors.map(contractor => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.name} ({contractor.grade}등급, {contractor.averageRating}점)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 표시 개수
              </label>
              <select
                value={maxItems}
                onChange={(e) => setMaxItems(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5개</option>
                <option value={10}>10개</option>
                <option value={20}>20개</option>
                <option value={50}>50개</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showFilters}
                  onChange={(e) => setShowFilters(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">필터 표시</span>
              </label>
            </div>
          </div>
        </div>

        {/* 평가 내역 표시 */}
        {selectedContractorId ? (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {sampleContractors.find(c => c.id === selectedContractorId)?.name} 시공기사 평가 내역
              </h2>
              <p className="text-sm text-gray-500">
                시공기사 ID: {selectedContractorId}
              </p>
            </div>
            
            <ContractorEvaluationList
              contractorId={selectedContractorId}
              maxItems={maxItems}
              showFilters={showFilters}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              시공기사를 선택하세요
            </h3>
            <p className="text-gray-500">
              위의 드롭다운에서 평가 내역을 확인할 시공기사를 선택해주세요.
            </p>
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            사용법 안내
          </h3>
          <div className="text-yellow-800 space-y-2 text-sm">
            <p><strong>1. 시공기사 선택:</strong> 드롭다운에서 평가 내역을 확인할 시공기사를 선택합니다.</p>
            <p><strong>2. 표시 개수 조정:</strong> 한 번에 표시할 평가 개수를 설정합니다.</p>
            <p><strong>3. 필터 사용:</strong> 평점 범위, 댓글 유무, 정렬 방식을 설정하여 원하는 평가만 표시합니다.</p>
            <p><strong>4. 상세 정보 확인:</strong> 각 평가의 카테고리별 점수, 댓글, 평가자 정보를 확인합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationListExample; 