import React from 'react';
import JobList from './JobList';

const JobListExample = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            작업 관리 시스템
          </h1>
          <p className="text-lg text-gray-600">
            배정받은 작업들을 확인하고 상태를 관리하세요
          </p>
        </div>
        
        <JobList />
        
        {/* 사용법 안내 */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">사용법 안내</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">작업 상태</h3>
              <ul className="space-y-2 text-gray-600">
                <li><span className="font-medium">배정됨:</span> 작업이 배정되었지만 아직 시작하지 않은 상태</li>
                <li><span className="font-medium">진행중:</span> 작업이 시작되어 진행 중인 상태</li>
                <li><span className="font-medium">완료:</span> 작업이 성공적으로 완료된 상태</li>
                <li><span className="font-medium">취소:</span> 작업이 취소된 상태</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">주요 기능</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 필터링: 상태별로 작업 목록 필터링</li>
                <li>• 상태 변경: 작업 시작, 완료, 취소</li>
                <li>• 상세보기: 작업 상세 정보 확인</li>
                <li>• 통계: 작업 상태별 통계 확인</li>
                <li>• 실시간 업데이트: 상태 변경 시 자동 새로고침</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobListExample; 