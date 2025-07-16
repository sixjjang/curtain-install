import React from 'react';
import GradeUpdateManager from './GradeUpdateManager';

const GradeUpdateExample = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            시공기사 등급 관리 시스템
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              기능 설명
            </h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>개별 업데이트:</strong> 특정 시공기사의 등급을 개별적으로 업데이트</li>
              <li>• <strong>배치 업데이트:</strong> 선택된 여러 시공기사의 등급을 한 번에 업데이트</li>
              <li>• <strong>필터 업데이트:</strong> 특정 조건에 맞는 모든 시공기사의 등급을 업데이트</li>
              <li>• <strong>자동 알림:</strong> 등급 변경 시 시공기사에게 자동으로 알림 발송</li>
              <li>• <strong>변경 로그:</strong> 모든 등급 변경 사항을 자동으로 기록</li>
            </ul>
          </div>
        </div>

        <GradeUpdateManager />
      </div>
    </div>
  );
};

export default GradeUpdateExample; 