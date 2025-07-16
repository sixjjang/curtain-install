import React, { useState } from 'react';
import JobUrgentFeeSettings from './JobUrgentFeeSettings';

const UrgentFeeSettingsExample = () => {
  const [currentSettings, setCurrentSettings] = useState({
    baseUrgentFee: 15,
    maxUrgentFee: 50,
    autoIncreaseEnabled: true,
    increaseInterval: 600,
    increasePercent: 5,
    increaseStartDelay: 0
  });

  const [selectedJobId, setSelectedJobId] = useState('job_123');

  const handleSettingsChange = (newSettings) => {
    setCurrentSettings(newSettings);
    console.log('설정 변경됨:', newSettings);
  };

  const handleSaveSettings = async (settings) => {
    console.log('설정 저장됨:', settings);
    // 여기서 실제 저장 로직을 구현할 수 있습니다
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            긴급 수수료 설정 예제
          </h1>
          <p className="text-gray-600">
            다양한 긴급 수수료 설정 옵션을 테스트해보세요.
          </p>
        </div>

        {/* 시공건 ID 설정 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">시공건 설정</h2>
          <div className="flex items-center space-x-4">
            <label htmlFor="jobId" className="text-sm font-medium text-gray-700">
              시공건 ID:
            </label>
            <input
              type="text"
              id="jobId"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="시공건 ID를 입력하세요"
            />
          </div>
        </div>

        {/* 기본 설정 예제 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 긴급 수수료 설정</h2>
          <JobUrgentFeeSettings
            onChange={handleSettingsChange}
            initialValues={currentSettings}
            showPreview={true}
            showAutoIncrease={true}
            jobId={selectedJobId}
          />
        </div>

        {/* 간단한 설정 예제 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">간단한 설정 (미리보기 없음)</h2>
          <JobUrgentFeeSettings
            onChange={handleSettingsChange}
            initialValues={{
              baseUrgentFee: 10,
              maxUrgentFee: 30,
              autoIncreaseEnabled: false
            }}
            showPreview={false}
            showAutoIncrease={true}
          />
        </div>

        {/* 자동 인상 비활성화 예제 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">자동 인상 비활성화</h2>
          <JobUrgentFeeSettings
            onChange={handleSettingsChange}
            initialValues={{
              baseUrgentFee: 20,
              maxUrgentFee: 20,
              autoIncreaseEnabled: false
            }}
            showPreview={true}
            showAutoIncrease={true}
          />
        </div>

        {/* 빠른 인상 설정 예제 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 인상 설정</h2>
          <JobUrgentFeeSettings
            onChange={handleSettingsChange}
            initialValues={{
              baseUrgentFee: 5,
              maxUrgentFee: 40,
              autoIncreaseEnabled: true,
              increaseInterval: 300, // 5분
              increasePercent: 3,
              increaseStartDelay: 30 // 30분 후 시작
            }}
            showPreview={true}
            showAutoIncrease={true}
          />
        </div>

        {/* 현재 설정 표시 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">현재 설정 상태</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 overflow-x-auto">
              {JSON.stringify(currentSettings, null, 2)}
            </pre>
          </div>
        </div>

        {/* 빠른 설정 버튼들 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">빠른 설정</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setCurrentSettings({
                baseUrgentFee: 10,
                maxUrgentFee: 25,
                autoIncreaseEnabled: true,
                increaseInterval: 600,
                increasePercent: 3,
                increaseStartDelay: 0
              })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              보수적 설정
            </button>
            <button
              onClick={() => setCurrentSettings({
                baseUrgentFee: 20,
                maxUrgentFee: 60,
                autoIncreaseEnabled: true,
                increaseInterval: 300,
                increasePercent: 5,
                increaseStartDelay: 60
              })}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              적극적 설정
            </button>
            <button
              onClick={() => setCurrentSettings({
                baseUrgentFee: 15,
                maxUrgentFee: 50,
                autoIncreaseEnabled: false,
                increaseInterval: 600,
                increasePercent: 5,
                increaseStartDelay: 0
              })}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              수동 설정
            </button>
          </div>
        </div>

        {/* 사용법 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">컴포넌트 사용법</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p><strong>• onChange:</strong> 설정이 변경될 때마다 호출되는 콜백 함수입니다.</p>
            <p><strong>• initialValues:</strong> 컴포넌트 초기화 시 사용할 기본값입니다.</p>
            <p><strong>• showPreview:</strong> 미리보기 섹션 표시 여부를 설정합니다.</p>
            <p><strong>• showAutoIncrease:</strong> 자동 인상 설정 섹션 표시 여부를 설정합니다.</p>
            <p><strong>• jobId:</strong> 설정을 저장할 시공건의 ID입니다.</p>
            <p><strong>• 실시간 미리보기:</strong> 설정 변경 시 즉시 미리보기가 업데이트됩니다.</p>
            <p><strong>• 유효성 검사:</strong> 입력값에 대한 자동 유효성 검사가 수행됩니다.</p>
          </div>
        </div>

        {/* 코드 예제 */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">코드 예제</h3>
          <pre className="text-green-400 text-sm overflow-x-auto">
{`import JobUrgentFeeSettings from './JobUrgentFeeSettings';

// 기본 사용법
<JobUrgentFeeSettings
  onChange={(settings) => console.log('설정 변경:', settings)}
  initialValues={{
    baseUrgentFee: 15,
    maxUrgentFee: 50,
    autoIncreaseEnabled: true,
    increaseInterval: 600,
    increasePercent: 5,
    increaseStartDelay: 0
  }}
  showPreview={true}
  showAutoIncrease={true}
  jobId="job_123"
/>

// 간단한 사용법
<JobUrgentFeeSettings
  onChange={handleSettingsChange}
  showPreview={false}
  showAutoIncrease={false}
/>

// 자동 인상 비활성화
<JobUrgentFeeSettings
  initialValues={{
    baseUrgentFee: 20,
    maxUrgentFee: 20,
    autoIncreaseEnabled: false
  }}
  showAutoIncrease={true}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default UrgentFeeSettingsExample; 