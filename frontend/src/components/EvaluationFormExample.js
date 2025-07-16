import React, { useState } from 'react';
import ContractorEvaluationForm from './ContractorEvaluationForm';

const EvaluationFormExample = () => {
  const [selectedContractor, setSelectedContractor] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [evaluationHistory, setEvaluationHistory] = useState([]);

  // Sample contractors for demonstration
  const sampleContractors = [
    { id: 'contractor-001', name: '김철수', grade: 'A', specialty: '커튼 설치' },
    { id: 'contractor-002', name: '이영희', grade: 'B', specialty: '블라인드 설치' },
    { id: 'contractor-003', name: '박민수', grade: 'C', specialty: '롤스크린 설치' }
  ];

  const handleEvaluationSuccess = () => {
    // Add to evaluation history
    const newEvaluation = {
      id: Date.now(),
      contractorId: selectedContractor,
      contractorName: sampleContractors.find(c => c.id === selectedContractor)?.name,
      timestamp: new Date().toLocaleString(),
      status: 'completed'
    };
    
    setEvaluationHistory(prev => [newEvaluation, ...prev]);
    setShowForm(false);
    setSelectedContractor('');
  };

  const handleStartEvaluation = (contractorId) => {
    setSelectedContractor(contractorId);
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
    setSelectedContractor('');
  };

  if (showForm) {
    const contractor = sampleContractors.find(c => c.id === selectedContractor);
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← 뒤로 가기
          </button>
        </div>
        
        <ContractorEvaluationForm
          contractorId={selectedContractor}
          contractorName={contractor?.name}
          onSuccess={handleEvaluationSuccess}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">시공기사 평가 시스템</h2>
        <p className="text-gray-600">
          시공 완료 후 시공기사에 대한 상세한 평가를 진행해주세요. 
          평가는 시공기사의 등급과 향후 서비스 품질 향상에 중요한 자료로 활용됩니다.
        </p>
      </div>

      {/* Contractor Selection */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">평가할 시공기사 선택</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleContractors.map((contractor) => (
            <div key={contractor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{contractor.name}</h4>
                  <p className="text-sm text-gray-600">{contractor.specialty}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  contractor.grade === 'A' ? 'bg-green-100 text-green-800' :
                  contractor.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                  contractor.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {contractor.grade}등급
                </span>
              </div>
              
              <button
                onClick={() => handleStartEvaluation(contractor.id)}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                평가 시작
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation History */}
      {evaluationHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 평가 내역</h3>
          
          <div className="space-y-3">
            {evaluationHistory.map((evaluation) => (
              <div key={evaluation.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{evaluation.contractorName}</div>
                  <div className="text-sm text-gray-500">{evaluation.timestamp}</div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  완료
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evaluation Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">평가 가이드</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>평가 항목:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>품질:</strong> 작업 품질과 완성도 (깔끔한 마감, 정확한 설치, 내구성)</li>
            <li><strong>시간 준수:</strong> 약속 시간 준수 (정시 도착, 작업 시간 준수, 일정 관리)</li>
            <li><strong>비용 절약:</strong> 효율적인 비용 관리 (합리적인 가격, 불필요한 비용 절약)</li>
            <li><strong>의사소통:</strong> 고객과의 소통 (명확한 설명, 적극적인 소통, 문제 해결 능력)</li>
            <li><strong>전문성:</strong> 전문적인 태도와 기술 (전문 지식, 깔끔한 복장, 정중한 태도)</li>
          </ul>
          
          <p className="mt-3"><strong>평점 기준:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>5점: 매우 좋음 - 완벽한 서비스</li>
            <li>4점: 좋음 - 기대를 넘어섬</li>
            <li>3점: 보통 - 기대에 부합함</li>
            <li>2점: 나쁨 - 개선이 필요함</li>
            <li>1점: 매우 나쁨 - 심각한 문제가 있음</li>
          </ul>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 mb-3">평가의 중요성</h3>
        <div className="text-sm text-green-800 space-y-2">
          <p>• <strong>품질 향상:</strong> 정확한 평가는 시공기사의 서비스 품질 향상에 도움이 됩니다.</p>
          <p>• <strong>등급 관리:</strong> 평가 결과는 시공기사의 등급 결정에 반영됩니다.</p>
          <p>• <strong>고객 만족:</strong> 다른 고객들이 더 나은 서비스를 받을 수 있도록 도와줍니다.</p>
          <p>• <strong>시스템 개선:</strong> 전체적인 서비스 품질 향상에 기여합니다.</p>
        </div>
      </div>
    </div>
  );
};

export default EvaluationFormExample; 