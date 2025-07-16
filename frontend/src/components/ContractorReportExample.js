import React, { useState } from 'react';
import ContractorReport from './ContractorReport';

const ContractorReportExample = () => {
  const [contractorId, setContractorId] = useState('');
  const [showReport, setShowReport] = useState(false);

  const handleViewReport = () => {
    if (contractorId.trim()) {
      setShowReport(true);
    }
  };

  const handleBack = () => {
    setShowReport(false);
    setContractorId('');
  };

  // Sample contractor IDs for testing
  const sampleContractorIds = [
    'contractor-001',
    'contractor-002', 
    'contractor-003'
  ];

  if (showReport) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← 뒤로 가기
          </button>
        </div>
        
        <ContractorReport contractorId={contractorId} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">시공기사 리포트 예제</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시공기사 ID 입력
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                placeholder="시공기사 ID를 입력하세요"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleViewReport}
                disabled={!contractorId.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                리포트 보기
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">샘플 시공기사 ID</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sampleContractorIds.map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setContractorId(id);
                    setShowReport(true);
                  }}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">{id}</div>
                  <div className="text-sm text-gray-500">클릭하여 리포트 보기</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">사용 방법</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. 시공기사 ID를 입력하거나 샘플 ID를 클릭하세요.</p>
              <p>2. "리포트 보기" 버튼을 클릭하여 상세 리포트를 확인하세요.</p>
              <p>3. 리포트에는 평점 분포, 카테고리별 평가, 최근 평가 등이 포함됩니다.</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">리포트 구성 요소</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• <strong>기본 정보</strong>: 이름, 등급, 평균 평점, 평가 건수</p>
              <p>• <strong>평점 분포</strong>: 1점~5점별 평가 분포 시각화</p>
              <p>• <strong>카테고리별 평가</strong>: 품질, 시간 준수, 비용 절약 등</p>
              <p>• <strong>최근 평가</strong>: 최근 10건의 상세 평가 내역</p>
              <p>• <strong>등급 변동</strong>: 등급 변경 이력 및 추이</p>
              <p>• <strong>연락처 정보</strong>: 시공기사 연락처</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorReportExample; 