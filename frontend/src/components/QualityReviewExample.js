import React, { useState } from 'react';
import QualityReview from './QualityReview';

const QualityReviewExample = () => {
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [reviewHistory, setReviewHistory] = useState([]);
  const [reviewerId] = useState('reviewer123');

  // 샘플 촬영 요청 데이터
  const sampleRequests = [
    {
      id: 'request1',
      title: '서울시 강남구 커튼 설치 - 시공 전후 사진',
      contractor: '김철수',
      status: 'completed',
      photoCount: 8,
      completedAt: '2024-01-15',
      hasQualityIssues: false
    },
    {
      id: 'request2',
      title: '부산시 해운대구 블라인드 설치 - 상세 촬영',
      contractor: '이영희',
      status: 'completed',
      photoCount: 12,
      completedAt: '2024-01-20',
      hasQualityIssues: true
    },
    {
      id: 'request3',
      title: '대구시 수성구 롤스크린 설치 - 기본 촬영',
      contractor: '박민수',
      status: 'completed',
      photoCount: 6,
      completedAt: '2024-01-10',
      hasQualityIssues: false
    },
  ];

  const handleIssueSubmitted = (issueInfo) => {
    // 이의신청 제출 처리
    const issueRecord = {
      id: Date.now(),
      issueId: issueInfo.issueId,
      photoId: issueInfo.photoId,
      category: issueInfo.category,
      severity: issueInfo.severity,
      timestamp: new Date().toLocaleString(),
      requestId: selectedRequestId
    };
    
    setReviewHistory(prev => [issueRecord, ...prev.slice(0, 9)]); // 최대 10개 유지
    
    // 성공 메시지
    console.log('이의신청 제출됨:', issueInfo);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'completed': return '완료';
      case 'in_progress': return '진행중';
      default: return '알 수 없음';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      blur: '흐림/초점 문제',
      exposure: '노출/밝기 문제',
      composition: '구도/각도 문제',
      lighting: '조명 문제',
      resolution: '해상도 문제',
      color: '색상/화질 문제',
      content: '내용/구성 문제',
      technical: '기술적 문제',
      other: '기타'
    };
    return categories[category] || category;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            사진 품질 검수 시스템
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              기능 설명
            </h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>품질 점수 평가:</strong> 각 사진에 대해 1-10점 품질 점수 부여</li>
              <li>• <strong>문제 유형 분류:</strong> 9가지 문제 유형으로 체계적 분류</li>
              <li>• <strong>심각도 평가:</strong> 낮음/보통/높음/심각 4단계 심각도 설정</li>
              <li>• <strong>상세 이의신청:</strong> 구체적인 문제 내용과 개선 제안 작성</li>
              <li>• <strong>사진 확대 보기:</strong> 고해상도 사진 상세 검토</li>
              <li>• <strong>검수 이력 관리:</strong> 모든 검수 활동 자동 기록</li>
            </ul>
          </div>
        </div>

        {/* 촬영 요청 선택 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">검수할 촬영 요청 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleRequests.map(request => (
              <div
                key={request.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRequestId === request.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRequestId(request.id)}
              >
                <h3 className="font-medium text-gray-900 mb-2">{request.title}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>시공기사: {request.contractor}</p>
                  <p>사진 수: {request.photoCount}장</p>
                  <p>완료일: {request.completedAt}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                  {request.hasQualityIssues && (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      품질 이슈 있음
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {selectedRequestId && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setSelectedRequestId('')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                선택 취소
              </button>
            </div>
          )}
        </div>

        {/* 품질 검수 컴포넌트 */}
        {selectedRequestId ? (
          <div className="mb-6">
            <QualityReview
              requestId={selectedRequestId}
              reviewerId={reviewerId}
              onIssueSubmitted={handleIssueSubmitted}
              showBeforeAfter={true}
              enableComparison={true}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              검수할 촬영 요청을 선택하세요
            </h3>
            <p className="text-gray-500">
              위의 촬영 요청 중 하나를 선택하여 사진 품질을 검수할 수 있습니다.
            </p>
          </div>
        )}

        {/* 검수 이력 */}
        {reviewHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 검수 이력</h2>
            <div className="space-y-3">
              {reviewHistory.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        이의신청 #{record.issueId.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        요청 ID: {record.requestId} • 사진 ID: {record.photoId}
                      </p>
                      <p className="text-xs text-gray-500">
                        제출 시간: {record.timestamp}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(record.severity)}`}>
                        {record.severity === 'low' && '낮음'}
                        {record.severity === 'medium' && '보통'}
                        {record.severity === 'high' && '높음'}
                        {record.severity === 'critical' && '심각'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <p><strong>문제 유형:</strong> {getCategoryLabel(record.category)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 검수 가이드라인 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            품질 검수 가이드라인
          </h3>
          <div className="text-yellow-800 space-y-2 text-sm">
            <p><strong>품질 점수 기준:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 8-10점: 우수한 품질, 문제 없음</li>
              <li>• 6-7점: 양호한 품질, 소소한 개선점</li>
              <li>• 4-5점: 보통 품질, 개선 필요</li>
              <li>• 1-3점: 낮은 품질, 재촬영 권장</li>
            </ul>
            <p><strong>심각도 기준:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 낮음: 미미한 문제, 수용 가능</li>
              <li>• 보통: 개선이 필요한 문제</li>
              <li>• 높음: 중요한 문제, 수정 필요</li>
              <li>• 심각: 심각한 문제, 재촬영 필수</li>
            </ul>
          </div>
        </div>

        {/* 사용법 안내 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            사용법 안내
          </h3>
          <div className="text-green-800 space-y-2 text-sm">
            <p><strong>1. 촬영 요청 선택:</strong> 검수할 촬영 요청을 선택합니다.</p>
            <p><strong>2. 사진 검토:</strong> 업로드된 사진들을 미리보기로 확인합니다.</p>
            <p><strong>3. 품질 점수 부여:</strong> 각 사진에 대해 1-10점 품질 점수를 부여합니다.</p>
            <p><strong>4. 확대 보기:</strong> 문제가 의심되는 사진은 확대 보기로 상세 검토합니다.</p>
            <p><strong>5. 이의신청 작성:</strong> 문제가 있는 사진을 선택하여 이의신청을 작성합니다.</p>
            <p><strong>6. 제출:</strong> 문제 유형, 심각도, 상세 내용을 입력하여 제출합니다.</p>
          </div>
        </div>

        {/* 기술 사양 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            기술 사양
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">품질 평가 기능</h4>
              <ul className="space-y-1">
                <li>• 1-10점 품질 점수 시스템</li>
                <li>• 9가지 문제 유형 분류</li>
                <li>• 4단계 심각도 평가</li>
                <li>• 실시간 점수 저장</li>
                <li>• 사진별 검수 이력</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">이의신청 기능</h4>
              <ul className="space-y-1">
                <li>• 상세 문제 내용 작성</li>
                <li>• 개선 제안 사항 입력</li>
                <li>• 자동 이력 관리</li>
                <li>• 사진 상태 업데이트</li>
                <li>• 검수자 정보 추적</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityReviewExample; 