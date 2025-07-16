import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import JobDetail from './JobDetail';

const JobDetailExample = () => {
  // 샘플 작업 ID들
  const sampleJobIds = [
    'job_001',
    'job_002', 
    'job_003',
    'job_004',
    'job_005'
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              작업 상세 페이지 예제
            </h1>
            <p className="text-lg text-gray-600">
              작업 상세 정보를 확인하고 상태를 관리하세요
            </p>
          </div>

          <Routes>
            <Route path="/job/:jobId" element={<JobDetail />} />
            <Route path="/" element={
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">테스트 작업 선택</h2>
                  <p className="text-gray-600 mb-6">
                    아래 작업 ID 중 하나를 클릭하여 작업 상세 페이지를 확인해보세요.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sampleJobIds.map((jobId) => (
                      <Link
                        key={jobId}
                        to={`/job/${jobId}`}
                        className="block p-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                          {jobId}
                        </h3>
                        <p className="text-blue-700 text-sm">
                          작업 상세 정보 보기
                        </p>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">사용법 안내</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">주요 기능</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• 실시간 작업 정보 표시</li>
                          <li>• 작업 상태 변경 (시작/완료/취소)</li>
                          <li>• 상태 변경 이력 추적</li>
                          <li>• 작업 타임라인 표시</li>
                          <li>• 고객 정보 및 연락처</li>
                          <li>• 반응형 디자인</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">라우팅 설정</h4>
                        <div className="bg-gray-800 text-gray-100 p-4 rounded text-sm font-mono">
                          <p>Route: /job/:jobId</p>
                          <p>Component: JobDetail</p>
                          <p>Params: jobId</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ 주의사항</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• 실제 Firestore에 해당 작업 ID가 존재해야 합니다</li>
                      <li>• 로그인이 필요합니다</li>
                      <li>• 작업 상태 변경은 배정된 계약자만 가능합니다</li>
                      <li>• 상태 변경 시 FCM 알림이 전송됩니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default JobDetailExample; 