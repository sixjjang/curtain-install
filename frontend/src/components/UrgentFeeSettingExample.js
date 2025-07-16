import React, { useState } from 'react';
import UrgentFeeSetting from './UrgentFeeSetting';

const UrgentFeeSettingExample = () => {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [settingHistory, setSettingHistory] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(true);

  // 샘플 작업 데이터
  const sampleJobs = [
    {
      id: 'job1',
      title: '서울시 강남구 커튼 설치',
      status: 'open',
      urgentFeePercent: 15,
      urgentFeeIncreaseCount: 2,
      lastUpdated: '2024-01-15 14:30'
    },
    {
      id: 'job2',
      title: '부산시 해운대구 블라인드 설치',
      status: 'open',
      urgentFeePercent: 25,
      urgentFeeIncreaseCount: 5,
      lastUpdated: '2024-01-20 09:15'
    },
    {
      id: 'job3',
      title: '대구시 수성구 롤스크린 설치',
      status: 'in_progress',
      urgentFeePercent: 35,
      urgentFeeIncreaseCount: 8,
      lastUpdated: '2024-01-18 16:45'
    },
  ];

  const handleFeeUpdated = (updateInfo) => {
    // 긴급 수수료 업데이트 처리
    const historyRecord = {
      id: Date.now(),
      jobId: updateInfo.jobId,
      urgentPercent: updateInfo.urgentPercent,
      maxPercent: updateInfo.maxPercent,
      advancedSettings: updateInfo.advancedSettings,
      timestamp: new Date().toLocaleString()
    };
    
    setSettingHistory(prev => [historyRecord, ...prev.slice(0, 9)]); // 최대 10개 유지
    
    // 성공 메시지
    console.log('긴급 수수료 업데이트됨:', updateInfo);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return '대기중';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      default: return '알 수 없음';
    }
  };

  const getFeeLevelColor = (percent) => {
    if (percent <= 20) return 'text-green-600';
    if (percent <= 35) return 'text-yellow-600';
    if (percent <= 45) return 'text-orange-600';
    return 'text-red-600';
  };

  const getFeeLevelText = (percent) => {
    if (percent <= 20) return '낮음';
    if (percent <= 35) return '보통';
    if (percent <= 45) return '높음';
    return '매우 높음';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            긴급 시공 수수료 설정 시스템
          </h1>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              기능 설명
            </h3>
            <ul className="text-orange-800 space-y-1 text-sm">
              <li>• <strong>기본 수수료 설정:</strong> 긴급 시공을 위한 기본 수수료 비율 설정</li>
              <li>• <strong>실시간 미리보기:</strong> 설정한 수수료의 실제 금액 미리보기</li>
              <li>• <strong>고급 설정:</strong> 자동 증가 규칙 및 알림 설정</li>
              <li>• <strong>수준별 표시:</strong> 수수료 수준을 색상으로 구분 표시</li>
              <li>• <strong>작업 정보 표시:</strong> 현재 작업의 상태 및 이력 정보</li>
              <li>• <strong>설정 이력 관리:</strong> 모든 설정 변경 이력 추적</li>
            </ul>
          </div>
        </div>

        {/* 작업 선택 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">설정할 작업 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleJobs.map(job => (
              <div
                key={job.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedJobId === job.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedJobId(job.id)}
              >
                <h3 className="font-medium text-gray-900 mb-2">{job.title}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>상태: {getStatusText(job.status)}</p>
                  <p>현재 수수료: {job.urgentFeePercent}%</p>
                  <p>증가 횟수: {job.urgentFeeIncreaseCount}회</p>
                  <p>마지막 업데이트: {job.lastUpdated}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(job.status)}`}>
                    {getStatusText(job.status)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeeLevelColor(job.urgentFeePercent)}`}>
                    {getFeeLevelText(job.urgentFeePercent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {selectedJobId && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setSelectedJobId('')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                선택 취소
              </button>
            </div>
          )}
        </div>

        {/* 긴급 수수료 설정 컴포넌트 */}
        {selectedJobId ? (
          <div className="mb-6">
            <UrgentFeeSetting
              jobId={selectedJobId}
              basePercent={15}
              maxPercent={50}
              onFeeUpdated={handleFeeUpdated}
              showPreview={true}
              enableAdvanced={showAdvanced}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              설정할 작업을 선택하세요
            </h3>
            <p className="text-gray-500">
              위의 작업 중 하나를 선택하여 긴급 시공 수수료를 설정할 수 있습니다.
            </p>
          </div>
        )}

        {/* 설정 이력 */}
        {settingHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 설정 이력</h2>
            <div className="space-y-3">
              {settingHistory.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        작업 #{record.jobId} 긴급 수수료 설정
                      </h3>
                      <p className="text-sm text-gray-600">
                        수수료: {record.urgentPercent}% • 최대: {record.maxPercent}%
                      </p>
                      <p className="text-xs text-gray-500">
                        설정 시간: {record.timestamp}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeeLevelColor(record.urgentPercent)}`}>
                        {getFeeLevelText(record.urgentPercent)}
                      </span>
                    </div>
                  </div>
                  
                  {record.advancedSettings && (
                    <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                      <p><strong>고급 설정:</strong></p>
                      <p>• 증가 단계: {record.advancedSettings.increaseStep}%</p>
                      <p>• 자동 증가: {record.advancedSettings.autoIncrease ? '활성화' : '비활성화'}</p>
                      <p>• 증가 간격: {record.advancedSettings.increaseInterval}시간</p>
                      <p>• 알림: {record.advancedSettings.notificationEnabled ? '활성화' : '비활성화'}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 설정 가이드라인 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            긴급 수수료 설정 가이드라인
          </h3>
          <div className="text-yellow-800 space-y-2 text-sm">
            <p><strong>수수료 수준 기준:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• <span className="text-green-600 font-medium">낮음 (15-20%)</span>: 일반적인 긴급 상황</li>
              <li>• <span className="text-yellow-600 font-medium">보통 (21-35%)</span>: 중간 정도의 긴급 상황</li>
              <li>• <span className="text-orange-600 font-medium">높음 (36-45%)</span>: 높은 긴급 상황</li>
              <li>• <span className="text-red-600 font-medium">매우 높음 (46-50%)</span>: 최고 긴급 상황</li>
            </ul>
            <p><strong>자동 증가 설정:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 증가 단계: 1%에서 20% 사이 설정 가능</li>
              <li>• 증가 간격: 1시간에서 168시간(7일) 사이 설정 가능</li>
              <li>• 최대값 도달 시 자동 중단</li>
              <li>• 알림 발송으로 관련자에게 통보</li>
            </ul>
          </div>
        </div>

        {/* 사용법 안내 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            사용법 안내
          </h3>
          <div className="text-green-800 space-y-2 text-sm">
            <p><strong>1. 작업 선택:</strong> 설정할 작업을 선택합니다.</p>
            <p><strong>2. 기본 수수료 설정:</strong> 긴급 수수료 비율을 설정합니다 (15-50%).</p>
            <p><strong>3. 미리보기 확인:</strong> 설정한 수수료의 실제 금액을 미리 확인합니다.</p>
            <p><strong>4. 고급 설정 (선택사항):</strong> 자동 증가 규칙과 알림 설정을 구성합니다.</p>
            <p><strong>5. 저장:</strong> 설정을 저장하고 적용합니다.</p>
            <p><strong>6. 모니터링:</strong> 설정 이력과 작업 상태를 확인합니다.</p>
          </div>
        </div>

        {/* 기술 사양 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            기술 사양
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">기본 기능</h4>
              <ul className="space-y-1">
                <li>• 15-50% 수수료 범위 설정</li>
                <li>• 실시간 수수료 미리보기</li>
                <li>• 수준별 색상 구분</li>
                <li>• 작업 정보 표시</li>
                <li>• 설정 이력 관리</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">고급 기능</h4>
              <ul className="space-y-1">
                <li>• 자동 증가 규칙 설정</li>
                <li>• 증가 단계 및 간격 조정</li>
                <li>• 알림 발송 설정</li>
                <li>• 조건 검증 및 오류 처리</li>
                <li>• 실시간 상태 업데이트</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrgentFeeSettingExample; 