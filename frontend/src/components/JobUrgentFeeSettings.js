import { useState, useEffect } from "react";
import { useUrgentFeeManager } from "../hooks/useUrgentFeeManager";

const JobUrgentFeeSettings = ({ 
  onChange, 
  initialValues = {}, 
  showPreview = true, 
  showAutoIncrease = true,
  jobId = null 
}) => {
  const [settings, setSettings] = useState({
    baseUrgentFee: initialValues.baseUrgentFee || 15,
    maxUrgentFee: initialValues.maxUrgentFee || 50,
    autoIncreaseEnabled: initialValues.autoIncreaseEnabled !== false,
    increaseInterval: initialValues.increaseInterval || 600, // 10분
    increasePercent: initialValues.increasePercent || 5,
    increaseStartDelay: initialValues.increaseStartDelay || 0 // 즉시 시작
  });

  const [preview, setPreview] = useState({
    currentFee: 0,
    nextIncrease: null,
    totalIncreases: 0,
    estimatedTime: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { updateUrgentFeeSettings, clearError } = useUrgentFeeManager();

  // 실시간 미리보기 계산
  useEffect(() => {
    if (!showPreview) return;

    const calculatePreview = () => {
      const { baseUrgentFee, maxUrgentFee, autoIncreaseEnabled, increaseInterval, increasePercent, increaseStartDelay } = settings;
      
      if (!autoIncreaseEnabled) {
        setPreview({
          currentFee: baseUrgentFee,
          nextIncrease: null,
          totalIncreases: 0,
          estimatedTime: null
        });
        return;
      }

      const now = new Date();
      const startTime = new Date(now.getTime() + (increaseStartDelay * 60 * 1000));
      const timeToStart = increaseStartDelay > 0 ? startTime : now;

      // 최대 인상 횟수 계산
      const maxIncreases = Math.floor((maxUrgentFee - baseUrgentFee) / increasePercent);
      
      // 예상 완료 시간
      const estimatedCompletion = new Date(timeToStart.getTime() + (maxIncreases * increaseInterval * 1000));

      setPreview({
        currentFee: baseUrgentFee,
        nextIncrease: timeToStart,
        totalIncreases: maxIncreases,
        estimatedTime: estimatedCompletion
      });
    };

    calculatePreview();
  }, [settings, showPreview]);

  const handleSettingChange = (field, value) => {
    const newSettings = { ...settings, [field]: value };
    
    // 유효성 검사
    if (field === 'baseUrgentFee') {
      if (value < 0) value = 0;
      if (value > newSettings.maxUrgentFee) value = newSettings.maxUrgentFee;
    } else if (field === 'maxUrgentFee') {
      if (value < newSettings.baseUrgentFee) value = newSettings.baseUrgentFee;
      if (value > 100) value = 100;
    } else if (field === 'increasePercent') {
      if (value < 1) value = 1;
      if (value > 20) value = 20;
    } else if (field === 'increaseInterval') {
      if (value < 60) value = 60; // 최소 1분
      if (value > 3600) value = 3600; // 최대 1시간
    } else if (field === 'increaseStartDelay') {
      if (value < 0) value = 0;
      if (value > 1440) value = 1440; // 최대 24시간
    }

    newSettings[field] = value;
    setSettings(newSettings);
    
    // 부모 컴포넌트에 변경 알림
    onChange && onChange(newSettings);
    
    // 에러/성공 메시지 초기화
    setError(null);
    setSuccess(null);
  };

  const handleSaveSettings = async () => {
    if (!jobId) {
      setError('시공건 ID가 필요합니다.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUrgentFeeSettings({
        enabled: settings.autoIncreaseEnabled,
        increaseInterval: settings.increaseInterval,
        increasePercent: settings.increasePercent,
        maxIncreasePercent: settings.maxUrgentFee
      });

      setSuccess('긴급 수수료 설정이 저장되었습니다.');
    } catch (err) {
      setError(err.message || '설정 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFeeColor = (fee) => {
    if (fee >= 40) return 'text-red-600 bg-red-50';
    if (fee >= 25) return 'text-orange-600 bg-orange-50';
    if (fee >= 15) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">오류</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* 성공 메시지 */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">성공</h3>
              <div className="mt-2 text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 기본 설정 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">기본 긴급 수수료 설정</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="baseUrgentFee" className="block text-sm font-medium text-gray-700 mb-2">
                기본 긴급 수수료 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="baseUrgentFee"
                  value={settings.baseUrgentFee}
                  onChange={(e) => handleSettingChange('baseUrgentFee', Number(e.target.value))}
                  min="0"
                  max={settings.maxUrgentFee}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                시공건 등록 시 적용되는 기본 긴급 수수료입니다.
              </p>
            </div>

            <div>
              <label htmlFor="maxUrgentFee" className="block text-sm font-medium text-gray-700 mb-2">
                최대 긴급 수수료 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="maxUrgentFee"
                  value={settings.maxUrgentFee}
                  onChange={(e) => handleSettingChange('maxUrgentFee', Number(e.target.value))}
                  min={settings.baseUrgentFee}
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                자동 인상으로 도달할 수 있는 최대 긴급 수수료입니다.
              </p>
            </div>
          </div>
        </div>

        {/* 자동 인상 설정 */}
        {showAutoIncrease && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">자동 인상 설정</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoIncreaseEnabled"
                  checked={settings.autoIncreaseEnabled}
                  onChange={(e) => handleSettingChange('autoIncreaseEnabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoIncreaseEnabled" className="ml-2 text-sm font-medium text-gray-700">
                  자동 인상 활성화
                </label>
              </div>

              {settings.autoIncreaseEnabled && (
                <>
                  <div>
                    <label htmlFor="increaseInterval" className="block text-sm font-medium text-gray-700 mb-2">
                      인상 간격
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="increaseInterval"
                        value={Math.floor(settings.increaseInterval / 60)}
                        onChange={(e) => handleSettingChange('increaseInterval', Number(e.target.value) * 60)}
                        min="1"
                        max="60"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 text-sm">분</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      긴급 수수료가 자동으로 인상되는 간격입니다.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="increasePercent" className="block text-sm font-medium text-gray-700 mb-2">
                      인상 비율 (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="increasePercent"
                        value={settings.increasePercent}
                        onChange={(e) => handleSettingChange('increasePercent', Number(e.target.value))}
                        min="1"
                        max="20"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      한 번에 인상되는 긴급 수수료 비율입니다.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="increaseStartDelay" className="block text-sm font-medium text-gray-700 mb-2">
                      인상 시작 지연
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="increaseStartDelay"
                        value={settings.increaseStartDelay}
                        onChange={(e) => handleSettingChange('increaseStartDelay', Number(e.target.value))}
                        min="0"
                        max="1440"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 text-sm">분</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      시공건 등록 후 자동 인상이 시작되기까지의 지연 시간입니다.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 미리보기 */}
      {showPreview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">설정 미리보기</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500">현재 긴급 수수료</h4>
              <p className={`text-2xl font-bold ${getFeeColor(preview.currentFee)}`}>
                {preview.currentFee}%
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500">다음 인상 시각</h4>
              <p className="text-lg font-semibold text-gray-900">
                {formatDateTime(preview.nextIncrease)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500">총 인상 횟수</h4>
              <p className="text-2xl font-bold text-blue-600">
                {preview.totalIncreases}회
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500">예상 완료 시각</h4>
              <p className="text-lg font-semibold text-gray-900">
                {formatDateTime(preview.estimatedTime)}
              </p>
            </div>
          </div>

          {settings.autoIncreaseEnabled && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">인상 일정</h4>
              <div className="space-y-2">
                {Array.from({ length: Math.min(5, preview.totalIncreases) }, (_, i) => {
                  const increaseTime = new Date(preview.nextIncrease.getTime() + (i * settings.increaseInterval * 1000));
                  const feeAtTime = settings.baseUrgentFee + (i * settings.increasePercent);
                  return (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {formatDateTime(increaseTime)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeeColor(feeAtTime)}`}>
                        {feeAtTime}%
                      </span>
                    </div>
                  );
                })}
                {preview.totalIncreases > 5 && (
                  <div className="text-xs text-gray-500 text-center">
                    ... 및 {preview.totalIncreases - 5}회 추가 인상
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 저장 버튼 */}
      {jobId && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      )}

      {/* 사용법 안내 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">설정 가이드</h3>
        <div className="text-gray-700 space-y-1 text-sm">
          <p><strong>• 기본 긴급 수수료:</strong> 시공건 등록 시 즉시 적용되는 수수료입니다.</p>
          <p><strong>• 최대 긴급 수수료:</strong> 자동 인상으로 도달할 수 있는 최대 한도입니다.</p>
          <p><strong>• 인상 간격:</strong> 긴급 수수료가 자동으로 인상되는 시간 간격입니다.</p>
          <p><strong>• 인상 비율:</strong> 한 번에 인상되는 수수료의 비율입니다.</p>
          <p><strong>• 시작 지연:</strong> 시공건 등록 후 자동 인상이 시작되기까지의 대기 시간입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default JobUrgentFeeSettings; 