import React, { useState, useEffect } from 'react';
import pricingCalculator, { URGENCY_LEVELS, TIME_SLOTS } from '../utils/pricingCalculator';

const PricingCalculatorComponent = ({ onCalculate, initialData = {} }) => {
  const [projectData, setProjectData] = useState({
    curtainWidth: initialData.curtainWidth || '',
    curtainHeight: initialData.curtainHeight || '',
    complexity: initialData.complexity || 'simple',
    urgencyLevel: initialData.urgencyLevel || URGENCY_LEVELS.NORMAL,
    installationTime: initialData.installationTime || new Date().toISOString().slice(0, 16),
    materials: initialData.materials || [],
    distance: initialData.distance || '',
    parkingRequired: initialData.parkingRequired || false,
    floor: initialData.floor || '',
    specialEquipment: initialData.specialEquipment || false,
    rushHour: initialData.rushHour || false,
    requestTime: Date.now()
  });

  const [sellerSettings, setSellerSettings] = useState({
    basePrice: 50000,
    pricePerMeter: 15000,
    urgentFeePercent: 15,
    emergencyFeePercent: 25,
    sameDayFeePercent: 35,
    maxUrgentFeePercent: 50
  });

  const [pricingResult, setPricingResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState([]);

  // Calculate pricing when project data changes
  useEffect(() => {
    if (projectData.curtainWidth && projectData.curtainHeight) {
      calculatePricing();
    }
  }, [projectData, sellerSettings]);

  const calculatePricing = () => {
    setIsCalculating(true);
    setErrors([]);

    try {
      // Validate project data
      const validation = pricingCalculator.validateProjectData(projectData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setPricingResult(null);
        return;
      }

      // Calculate pricing
      const result = pricingCalculator.getPricingEstimate(projectData, sellerSettings);
      setPricingResult(result);

      // Call callback if provided
      if (onCalculate) {
        onCalculate(result);
      }
    } catch (error) {
      console.error('Pricing calculation error:', error);
      setErrors(['가격 계산 중 오류가 발생했습니다.']);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSellerSettingChange = (e) => {
    const { name, value } = e.target;
    setSellerSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const addMaterial = () => {
    setProjectData(prev => ({
      ...prev,
      materials: [...prev.materials, { type: 'curtain_rod', quantity: 1, quality: 'standard' }]
    }));
  };

  const updateMaterial = (index, field, value) => {
    setProjectData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const removeMaterial = (index) => {
    setProjectData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const getUrgencyDescription = (level) => {
    return pricingCalculator.getUrgencyDescription(level);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">커튼 설치 가격 계산기</h2>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {errors.map((error, index) => (
            <p key={index} className="text-sm">{error}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Details */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">프로젝트 정보</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  커튼 너비 (m)
                </label>
                <input
                  type="number"
                  name="curtainWidth"
                  value={projectData.curtainWidth}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  커튼 높이 (m)
                </label>
                <input
                  type="number"
                  name="curtainHeight"
                  value={projectData.curtainHeight}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2.4"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설치 복잡도
              </label>
              <select
                name="complexity"
                value={projectData.complexity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="simple">간단</option>
                <option value="moderate">보통</option>
                <option value="complex">복잡</option>
                <option value="very_complex">매우 복잡</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                긴급도
              </label>
              <select
                name="urgencyLevel"
                value={projectData.urgencyLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(URGENCY_LEVELS).map(([key, value]) => {
                  const desc = getUrgencyDescription(value);
                  return (
                    <option key={value} value={value}>
                      {desc.icon} {desc.title} - {desc.timeframe}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설치 시간
              </label>
              <input
                type="datetime-local"
                name="installationTime"
                value={projectData.installationTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                거리 (km)
              </label>
              <input
                type="number"
                name="distance"
                value={projectData.distance}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                층수
              </label>
              <input
                type="number"
                name="floor"
                value={projectData.floor}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="parkingRequired"
                  checked={projectData.parkingRequired}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                주차비 필요
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="specialEquipment"
                  checked={projectData.specialEquipment}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                특수 장비 필요
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rushHour"
                  checked={projectData.rushHour}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                러시아워 시간
              </label>
            </div>
          </div>

          {/* Materials */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">재료</h4>
            {projectData.materials.map((material, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <select
                  value={material.type}
                  onChange={(e) => updateMaterial(index, 'type', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="curtain_rod">커튼 로드</option>
                  <option value="curtain_rings">커튼 링</option>
                  <option value="brackets">브라켓</option>
                  <option value="screws">나사</option>
                  <option value="anchors">앵커</option>
                  <option value="curtain_fabric">커튼 천</option>
                  <option value="lining">라이닝</option>
                  <option value="tiebacks">타이백</option>
                </select>
                <input
                  type="number"
                  value={material.quantity}
                  onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                />
                <select
                  value={material.quality}
                  onChange={(e) => updateMaterial(index, 'quality', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="basic">기본</option>
                  <option value="standard">표준</option>
                  <option value="premium">프리미엄</option>
                  <option value="luxury">럭셔리</option>
                </select>
                <button
                  onClick={() => removeMaterial(index)}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              onClick={addMaterial}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              재료 추가
            </button>
          </div>
        </div>

        {/* Pricing Results */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">가격 계산 결과</h3>
            
            {isCalculating ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">가격을 계산하는 중...</p>
              </div>
            ) : pricingResult ? (
              <div className="space-y-4">
                {/* Total Cost */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-blue-600 mb-1">총 설치 비용</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {pricingCalculator.formatPrice(pricingResult.totalCost)}
                    </p>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">비용 세부내역</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>기본 설치비</span>
                      <span>{pricingCalculator.formatPrice(pricingResult.baseFee)}</span>
                    </div>
                    {pricingResult.urgencyFee > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>긴급 수수료</span>
                        <span>+{pricingCalculator.formatPrice(pricingResult.urgencyFee)}</span>
                      </div>
                    )}
                    {pricingResult.timeBasedFee > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>시간대 수수료</span>
                        <span>+{pricingCalculator.formatPrice(pricingResult.timeBasedFee)}</span>
                      </div>
                    )}
                    {pricingResult.additionalFees > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>추가 비용</span>
                        <span>+{pricingCalculator.formatPrice(pricingResult.additionalFees)}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>총 비용</span>
                      <span>{pricingCalculator.formatPrice(pricingResult.totalCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Savings */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-green-600 mb-1">정상가 대비 절약</p>
                    <p className="text-xl font-bold text-green-900">
                      {pricingCalculator.formatPrice(pricingResult.savings.savingsAmount)}
                    </p>
                    <p className="text-sm text-green-600">
                      ({pricingResult.savings.savingsPercent}% 할인)
                    </p>
                  </div>
                </div>

                {/* Estimate Range */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">예상 범위</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>최소</span>
                      <span>{pricingCalculator.formatPrice(pricingResult.estimate.min)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>권장</span>
                      <span className="font-medium">{pricingCalculator.formatPrice(pricingResult.estimate.recommended)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>최대</span>
                      <span>{pricingCalculator.formatPrice(pricingResult.estimate.max)}</span>
                    </div>
                  </div>
                </div>

                {/* Contractor Payment */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">시공기사 지급</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>시공기사 지급</span>
                      <span>{pricingCalculator.formatPrice(pricingResult.contractorPayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>플랫폼 수수료</span>
                      <span>{pricingCalculator.formatPrice(pricingResult.platformFee)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>시공기사 비율</span>
                      <span>{pricingResult.contractorPercentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                프로젝트 정보를 입력하면 가격이 계산됩니다.
              </div>
            )}
          </div>

          {/* Seller Settings (Admin/Seller only) */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">판매자 설정</h4>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기본 설치비
                </label>
                <input
                  type="number"
                  name="basePrice"
                  value={sellerSettings.basePrice}
                  onChange={handleSellerSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  미터당 비용
                </label>
                <input
                  type="number"
                  name="pricePerMeter"
                  value={sellerSettings.pricePerMeter}
                  onChange={handleSellerSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  긴급 수수료 (%)
                </label>
                <input
                  type="number"
                  name="urgentFeePercent"
                  value={sellerSettings.urgentFeePercent}
                  onChange={handleSellerSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculatorComponent; 