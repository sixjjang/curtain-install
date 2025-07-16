import React, { useState } from 'react';
import { useJobManager } from '../hooks/useJobManager';
import JobListForContractors from './JobListForContractors';

const JobListForContractorsExample = () => {
  const [currentUserId, setCurrentUserId] = useState('contractor123');
  const [acceptStatus, setAcceptStatus] = useState('');
  
  const { acceptJob, loading, error } = useJobManager();

  const handleAcceptJob = async (jobId, contractorId) => {
    try {
      setAcceptStatus('수락 중...');
      await acceptJob(jobId, contractorId);
      setAcceptStatus('작업이 성공적으로 수락되었습니다!');
      
      // 3초 후 상태 초기화
      setTimeout(() => {
        setAcceptStatus('');
      }, 3000);
    } catch (error) {
      setAcceptStatus(`수락 실패: ${error.message}`);
      
      // 5초 후 상태 초기화
      setTimeout(() => {
        setAcceptStatus('');
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                시공업체용 작업 목록
              </h1>
              <p className="text-gray-600">
                수락 가능한 작업들을 확인하고 수락하세요
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  현재 사용자 ID
                </label>
                <input
                  type="text"
                  value={currentUserId}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contractor123"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 상태 메시지 */}
      {acceptStatus && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`p-4 rounded-lg ${
            acceptStatus.includes('성공') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : acceptStatus.includes('실패') 
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {acceptStatus.includes('성공') ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : acceptStatus.includes('실패') ? (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{acceptStatus}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-blue-800">작업을 처리하는 중...</span>
            </div>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 작업 목록 컴포넌트 */}
      <JobListForContractors
        currentUserId={currentUserId}
        acceptJob={handleAcceptJob}
        showFilters={true}
        maxJobs={50}
        showUrgentOnly={false}
      />

      {/* 사용법 안내 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">컴포넌트 사용법</h3>
          <div className="text-yellow-800 space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-2">필수 Props:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>currentUserId</code>: 현재 로그인한 시공업체의 ID</li>
                <li><code>acceptJob</code>: 작업 수락을 처리하는 함수 (jobId, contractorId) => Promise</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">선택 Props:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>showFilters</code>: 필터 표시 여부 (기본값: true)</li>
                <li><code>maxJobs</code>: 최대 표시 작업 수 (기본값: 50)</li>
                <li><code>showUrgentOnly</code>: 긴급 작업만 표시 (기본값: false)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">주요 기능:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>실시간 작업 목록 업데이트</li>
                <li>긴급 수수료 색상 구분</li>
                <li>필터링 및 정렬</li>
                <li>작업 수락 기능</li>
                <li>반응형 디자인</li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-300">
              <p className="font-medium text-yellow-900">💡 팁:</p>
              <p className="text-yellow-800 text-xs">
                acceptJob 함수는 Firebase Cloud Functions의 acceptJobTransaction을 호출하여 
                안전한 트랜잭션으로 작업을 수락합니다. 수락 후 작업 상태가 자동으로 업데이트됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobListForContractorsExample; 