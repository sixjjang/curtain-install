import { useState, useEffect } from "react";
import { getFirestore, doc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  InformationCircleIcon,
  CogIcon,
  ArrowUpIcon,
  CalculatorIcon
} from "@heroicons/react/24/outline";

const firestore = getFirestore();

const UrgentFeeSetting = ({ 
  jobId, 
  basePercent = 15, 
  maxPercent = 50,
  onFeeUpdated,
  showPreview = true,
  enableAdvanced = true
}) => {
  const [urgentPercent, setUrgentPercent] = useState(basePercent);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [jobData, setJobData] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState({
    increaseStep: 5,
    autoIncrease: false,
    increaseInterval: 24, // hours
    notificationEnabled: true
  });

  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const jobDoc = await getDoc(doc(firestore, "jobs", jobId));
      
      if (jobDoc.exists()) {
        const data = jobDoc.data();
        setJobData(data);
        
        // 기존 설정값 로드
        setUrgentPercent(data.urgentFeePercent || basePercent);
        setAdvancedSettings({
          increaseStep: data.urgentFeeIncreaseStep || 5,
          autoIncrease: data.urgentFeeAutoIncrease || false,
          increaseInterval: data.urgentFeeIncreaseInterval || 24,
          notificationEnabled: data.urgentFeeNotificationEnabled !== false
        });
      }
    } catch (error) {
      console.error("작업 데이터 로드 오류:", error);
      setError("작업 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const validateInput = () => {
    if (urgentPercent < basePercent || urgentPercent > maxPercent) {
      setError(`긴급 수수료는 ${basePercent}% 이상, ${maxPercent}% 이하로 설정해주세요.`);
      return false;
    }

    if (advancedSettings.increaseStep < 1 || advancedSettings.increaseStep > 20) {
      setError("증가 단계는 1%에서 20% 사이로 설정해주세요.");
      return false;
    }

    if (advancedSettings.increaseInterval < 1 || advancedSettings.increaseInterval > 168) {
      setError("증가 간격은 1시간에서 168시간(7일) 사이로 설정해주세요.");
      return false;
    }

    setError("");
    return true;
  };

  const saveUrgentFee = async () => {
    if (!validateInput()) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updateData = {
        urgentFeePercent: urgentPercent,
        currentUrgentFeePercent: urgentPercent,
        urgentFeeMaxPercent: maxPercent,
        urgentFeeLastUpdated: Timestamp.now(),
        urgentFeeIncreaseCount: 0, // 초기화
        urgentFeeMaxReachedAt: null // 초기화
      };

      // 고급 설정 추가
      if (enableAdvanced) {
        updateData.urgentFeeIncreaseStep = advancedSettings.increaseStep;
        updateData.urgentFeeAutoIncrease = advancedSettings.autoIncrease;
        updateData.urgentFeeIncreaseInterval = advancedSettings.increaseInterval;
        updateData.urgentFeeNotificationEnabled = advancedSettings.notificationEnabled;
      }

      await updateDoc(doc(firestore, "jobs", jobId), updateData);

      setSuccess("긴급 수수료가 성공적으로 저장되었습니다.");
      
      // 콜백 호출
      if (onFeeUpdated) {
        onFeeUpdated({
          jobId,
          urgentPercent,
          maxPercent,
          advancedSettings
        });
      }

      // 성공 메시지 자동 제거
      setTimeout(() => setSuccess(""), 3000);

    } catch (error) {
      console.error("긴급 수수료 저장 오류:", error);
      setError("저장 중 오류가 발생했습니다: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateFeePreview = (baseAmount = 100000) => {
    const currentFee = (baseAmount * urgentPercent) / 100;
    const maxFee = (baseAmount * maxPercent) / 100;
    const increaseSteps = Math.ceil((maxPercent - urgentPercent) / advancedSettings.increaseStep);
    
    return {
      currentFee,
      maxFee,
      increaseSteps,
      nextFee: urgentPercent + advancedSettings.increaseStep <= maxPercent 
        ? (baseAmount * (urgentPercent + advancedSettings.increaseStep)) / 100 
        : maxFee
    };
  };

  const getFeeLevelColor = (percent) => {
    if (percent <= 20) return "text-green-600";
    if (percent <= 35) return "text-yellow-600";
    if (percent <= 45) return "text-orange-600";
    return "text-red-600";
  };

  const getFeeLevelText = (percent) => {
    if (percent <= 20) return "낮음";
    if (percent <= 35) return "보통";
    if (percent <= 45) return "높음";
    return "매우 높음";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">설정을 불러오는 중...</span>
      </div>
    );
  }

  const preview = calculateFeePreview();

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">긴급 시공 수수료 설정</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          긴급 시공을 위한 수수료를 설정하고 자동 증가 규칙을 관리하세요.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="text-green-800 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* 기본 설정 */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">기본 수수료 설정</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                긴급 수수료 비율
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={urgentPercent}
                    min={basePercent}
                    max={maxPercent}
                    onChange={(e) => setUrgentPercent(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={saving}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeeLevelColor(urgentPercent)}`}>
                    {getFeeLevelText(urgentPercent)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                범위: {basePercent}% ~ {maxPercent}%
              </p>
            </div>

            {/* 수수료 미리보기 */}
            {showPreview && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalculatorIcon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">수수료 미리보기 (기준: 10만원)</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">현재 수수료:</p>
                    <p className="font-medium text-gray-900">
                      {preview.currentFee.toLocaleString()}원 ({urgentPercent}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">최대 수수료:</p>
                    <p className="font-medium text-gray-900">
                      {preview.maxFee.toLocaleString()}원 ({maxPercent}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">다음 증가 시:</p>
                    <p className="font-medium text-gray-900">
                      {preview.nextFee.toLocaleString()}원
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">증가 단계:</p>
                    <p className="font-medium text-gray-900">
                      {preview.increaseSteps}회 남음
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 고급 설정 */}
        {enableAdvanced && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">고급 설정</h4>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <CogIcon className="h-4 w-4" />
                {showAdvanced ? "숨기기" : "보이기"}
              </button>
            </div>

            {showAdvanced && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      증가 단계
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={advancedSettings.increaseStep}
                        min={1}
                        max={20}
                        onChange={(e) => setAdvancedSettings(prev => ({
                          ...prev,
                          increaseStep: Number(e.target.value)
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={saving}
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">1% ~ 20%</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      증가 간격
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={advancedSettings.increaseInterval}
                        min={1}
                        max={168}
                        onChange={(e) => setAdvancedSettings(prev => ({
                          ...prev,
                          increaseInterval: Number(e.target.value)
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={saving}
                      />
                      <span className="text-gray-500">시간</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">1시간 ~ 168시간(7일)</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={advancedSettings.autoIncrease}
                      onChange={(e) => setAdvancedSettings(prev => ({
                        ...prev,
                        autoIncrease: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={saving}
                    />
                    <span className="text-sm font-medium text-gray-700">자동 증가 활성화</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={advancedSettings.notificationEnabled}
                      onChange={(e) => setAdvancedSettings(prev => ({
                        ...prev,
                        notificationEnabled: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={saving}
                    />
                    <span className="text-sm font-medium text-gray-700">수수료 증가 시 알림 발송</span>
                  </label>
                </div>

                {/* 자동 증가 정보 */}
                {advancedSettings.autoIncrease && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <InformationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">자동 증가 설정됨</p>
                        <p>• {advancedSettings.increaseStep}%씩 {advancedSettings.increaseInterval}시간마다 자동 증가</p>
                        <p>• 최대 {maxPercent}%까지 증가 가능</p>
                        <p>• 총 {preview.increaseSteps}회 증가 예정</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 현재 작업 정보 */}
        {jobData && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">현재 작업 정보</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">작업 상태:</p>
                <p className="font-medium text-gray-900">{jobData.status || "알 수 없음"}</p>
              </div>
              <div>
                <p className="text-gray-600">작업 제목:</p>
                <p className="font-medium text-gray-900">{jobData.title || "제목 없음"}</p>
              </div>
              {jobData.urgentFeeLastUpdated && (
                <div>
                  <p className="text-gray-600">마지막 업데이트:</p>
                  <p className="font-medium text-gray-900">
                    {jobData.urgentFeeLastUpdated.toDate().toLocaleString()}
                  </p>
                </div>
              )}
              {jobData.urgentFeeIncreaseCount !== undefined && (
                <div>
                  <p className="text-gray-600">증가 횟수:</p>
                  <p className="font-medium text-gray-900">{jobData.urgentFeeIncreaseCount}회</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={saveUrgentFee}
            disabled={saving}
            className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                저장 중...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                긴급 수수료 저장
              </>
            )}
          </button>
          
          <button
            onClick={fetchJobData}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
};

export default UrgentFeeSetting; 