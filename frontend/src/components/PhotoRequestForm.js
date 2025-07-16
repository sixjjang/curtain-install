import { useState } from "react";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";
import { CameraIcon, VideoCameraIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const firestore = getFirestore();

const PhotoRequestForm = ({ jobId, contractorId, sellerId, onRequestCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    beforeCount: 1,
    afterCount: 1,
    videoOption: "none",
    requestedAngles: "",
    specialInstructions: "",
    priority: "normal",
    deadline: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.beforeCount < 0) {
      newErrors.beforeCount = "시공 전 사진 수는 0 이상이어야 합니다.";
    }
    
    if (formData.afterCount < 1) {
      newErrors.afterCount = "시공 후 사진은 최소 1장 이상 필요합니다.";
    }
    
    if (formData.afterCount > 20) {
      newErrors.afterCount = "시공 후 사진은 최대 20장까지 요청 가능합니다.";
    }
    
    if (formData.requestedAngles.trim().length === 0) {
      newErrors.requestedAngles = "요청 각도 및 위치를 입력해주세요.";
    }
    
    if (formData.deadline && new Date(formData.deadline) < new Date()) {
      newErrors.deadline = "마감일은 오늘 이후로 설정해주세요.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const submitRequest = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        jobId,
        contractorId,
        sellerId,
        requestedBeforeCount: formData.beforeCount,
        requestedAfterCount: formData.afterCount,
        requestedAngles: formData.requestedAngles.trim(),
        specialInstructions: formData.specialInstructions.trim(),
        videoOption: formData.videoOption,
        priority: formData.priority,
        deadline: formData.deadline ? Timestamp.fromDate(new Date(formData.deadline)) : null,
        status: "pending",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        submittedBy: sellerId,
        estimatedCompletionTime: calculateEstimatedTime(),
        totalPhotos: formData.beforeCount + formData.afterCount
      };

      const docRef = await addDoc(collection(firestore, "photoRequests"), requestData);
      
      // Success feedback
      if (onRequestCreated) {
        onRequestCreated(docRef.id, requestData);
      }
      
      // Reset form
      setFormData({
        beforeCount: 1,
        afterCount: 1,
        videoOption: "none",
        requestedAngles: "",
        specialInstructions: "",
        priority: "normal",
        deadline: ""
      });
      
    } catch (error) {
      console.error("촬영 요청 생성 오류:", error);
      setErrors({ submit: "요청 생성 중 오류가 발생했습니다. 다시 시도해주세요." });
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedTime = () => {
    let baseTime = 30; // 기본 30분
    
    // 사진 수에 따른 추가 시간
    baseTime += (formData.beforeCount + formData.afterCount) * 5;
    
    // 영상 옵션에 따른 추가 시간
    if (formData.videoOption === "short") baseTime += 15;
    if (formData.videoOption === "detailed") baseTime += 30;
    
    // 우선순위에 따른 조정
    if (formData.priority === "urgent") baseTime = Math.ceil(baseTime * 0.8); // 긴급은 20% 단축
    
    return baseTime;
  };

  const getVideoOptionDescription = (option) => {
    switch (option) {
      case "none": return "동영상 촬영 없음";
      case "short": return "짧은 영상 (15-30초)";
      case "detailed": return "상세 영상 (1-2분)";
      default: return "";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low": return "bg-gray-100 text-gray-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "high": return "bg-yellow-100 text-yellow-800";
      case "urgent": return "bg-red-100 text-red-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <CameraIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">사진/영상 촬영 요청</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          시공 전후 사진과 영상을 촬영하여 프로젝트를 기록하세요.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* 사진 요청 섹션 */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
            <CameraIcon className="h-5 w-5 text-gray-600" />
            사진 촬영 요청
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시공 전 사진 컷 수
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.beforeCount}
                onChange={(e) => handleInputChange("beforeCount", Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.beforeCount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.beforeCount && (
                <p className="text-red-600 text-sm mt-1">{errors.beforeCount}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">현재 상태를 기록하기 위한 사진</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시공 후 사진 컷 수 *
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.afterCount}
                onChange={(e) => handleInputChange("afterCount", Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.afterCount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1"
              />
              {errors.afterCount && (
                <p className="text-red-600 text-sm mt-1">{errors.afterCount}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">완성된 작업 결과를 보여주는 사진</p>
            </div>
          </div>
        </div>

        {/* 촬영 각도 및 위치 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            요청 각도 및 위치 *
          </label>
          <textarea
            value={formData.requestedAngles}
            onChange={(e) => handleInputChange("requestedAngles", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.requestedAngles ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={3}
            placeholder="예: 창문 왼쪽, 오른쪽, 중앙, 전체 뷰, 상세 부분 등"
          />
          {errors.requestedAngles && (
            <p className="text-red-600 text-sm mt-1">{errors.requestedAngles}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            촬영하고자 하는 구체적인 각도나 위치를 자세히 설명해주세요.
          </p>
        </div>

        {/* 영상 옵션 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <VideoCameraIcon className="h-5 w-5 text-gray-600" />
            동영상 촬영 옵션
          </label>
          <select
            value={formData.videoOption}
            onChange={(e) => handleInputChange("videoOption", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="none">촬영 없음</option>
            <option value="short">짧은 영상 (15-30초)</option>
            <option value="detailed">상세 영상 (1-2분)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {getVideoOptionDescription(formData.videoOption)}
          </p>
        </div>

        {/* 우선순위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            우선순위
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleInputChange("priority", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">낮음</option>
            <option value="normal">보통</option>
            <option value="high">높음</option>
            <option value="urgent">긴급</option>
          </select>
        </div>

        {/* 마감일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            마감일 (선택사항)
          </label>
          <input
            type="date"
            value={formData.deadline}
            onChange={(e) => handleInputChange("deadline", e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.deadline ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.deadline && (
            <p className="text-red-600 text-sm mt-1">{errors.deadline}</p>
          )}
        </div>

        {/* 특별 지시사항 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            특별 지시사항 (선택사항)
          </label>
          <textarea
            value={formData.specialInstructions}
            onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="특별한 촬영 요구사항이나 주의사항이 있다면 입력해주세요."
          />
        </div>

        {/* 요청 요약 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-gray-600" />
            요청 요약
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">총 사진 수:</span>
              <span className="font-medium ml-1">{formData.beforeCount + formData.afterCount}장</span>
            </div>
            <div>
              <span className="text-gray-600">영상:</span>
              <span className="font-medium ml-1">{getVideoOptionDescription(formData.videoOption)}</span>
            </div>
            <div>
              <span className="text-gray-600">우선순위:</span>
              <span className={`ml-1 px-2 py-1 rounded-full text-xs ${getPriorityColor(formData.priority)}`}>
                {formData.priority === "low" && "낮음"}
                {formData.priority === "normal" && "보통"}
                {formData.priority === "high" && "높음"}
                {formData.priority === "urgent" && "긴급"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">예상 소요시간:</span>
              <span className="font-medium ml-1">{calculateEstimatedTime()}분</span>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={submitRequest}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                요청 중...
              </div>
            ) : (
              "촬영 요청 제출"
            )}
          </button>
          
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoRequestForm; 