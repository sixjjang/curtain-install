import React, { useState } from 'react';
import { saveEstimate } from '../utils/saveEstimate';

// 견적 입력 컴포넌트
const EstimateInput = ({ onEstimateChange }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    projectDescription: '',
    curtainType: 'roller',
    width: '',
    height: '',
    quantity: 1,
    installationType: 'basic',
    urgency: 'normal'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 부모 컴포넌트에 변경사항 전달
    onEstimateChange(formData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">견적 요청서</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 고객 정보 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">고객 정보</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              고객명
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="고객명을 입력하세요"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              연락처
            </label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-1234-5678"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              프로젝트 설명
            </label>
            <textarea
              name="projectDescription"
              value={formData.projectDescription}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="커튼 설치 요구사항을 설명해주세요"
            />
          </div>
        </div>

        {/* 커튼 사양 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">커튼 사양</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              커튼 타입
            </label>
            <select
              name="curtainType"
              value={formData.curtainType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="roller">롤러커튼</option>
              <option value="roman">로만커튼</option>
              <option value="venetian">베네시안 블라인드</option>
              <option value="vertical">버티컬 블라인드</option>
              <option value="honeycomb">허니컴 셰이드</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                너비 (cm)
              </label>
              <input
                type="number"
                name="width"
                value={formData.width}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                높이 (cm)
              </label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="200"
                min="1"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              수량
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              설치 타입
            </label>
            <select
              name="installationType"
              value={formData.installationType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="basic">기본 설치</option>
              <option value="premium">프리미엄 설치</option>
              <option value="custom">맞춤 설치</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              긴급도
            </label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">일반</option>
              <option value="urgent">긴급</option>
              <option value="very_urgent">매우 긴급</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// 견적 계산 함수
const calculateEstimate = (formData) => {
  if (!formData.width || !formData.height || !formData.quantity) {
    return null;
  }

  const width = parseFloat(formData.width);
  const height = parseFloat(formData.height);
  const quantity = parseInt(formData.quantity);
  
  // 기본 가격 (커튼 타입별)
  const basePrices = {
    roller: 15000,
    roman: 25000,
    venetian: 20000,
    vertical: 18000,
    honeycomb: 30000
  };
  
  // 설치 타입별 추가 비용
  const installationCosts = {
    basic: 0,
    premium: 10000,
    custom: 20000
  };
  
  // 긴급도별 추가 비용
  const urgencyCosts = {
    normal: 0,
    urgent: 5000,
    very_urgent: 15000
  };
  
  // 면적 계산 (제곱미터)
  const area = (width * height) / 10000;
  
  // 기본 가격 계산
  const basePrice = basePrices[formData.curtainType] || 15000;
  const materialCost = basePrice * area * quantity;
  
  // 추가 비용 계산
  const installationCost = installationCosts[formData.installationType] || 0;
  const urgencyCost = urgencyCosts[formData.urgency] || 0;
  
  // 총 비용 계산
  const subtotal = materialCost + installationCost + urgencyCost;
  const tax = subtotal * 0.1; // 10% 부가세
  const total = subtotal + tax;
  
  return {
    details: [
      {
        name: '커튼 재료비',
        description: `${formData.curtainType} (${width}cm x ${height}cm) x ${quantity}개`,
        amount: materialCost
      },
      {
        name: '설치 비용',
        description: `${formData.installationType} 설치`,
        amount: installationCost
      },
      {
        name: '긴급 비용',
        description: `${formData.urgency} 처리`,
        amount: urgencyCost
      },
      {
        name: '부가세',
        description: '10%',
        amount: tax
      }
    ],
    subtotal,
    tax,
    total,
    area,
    quantity
  };
};

export default function EstimatePage() {
  const [estimateData, setEstimateData] = useState(null);
  const [estimateResult, setEstimateResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedEstimateId, setSavedEstimateId] = useState(null);
  
  const sellerId = "abcd1234"; // 추후 로그인 연동

  const handleEstimateChange = (data) => {
    setEstimateData(data);
  };

  const handleCalculate = () => {
    if (!estimateData) {
      alert("견적 정보를 입력해주세요!");
      return;
    }

    const result = calculateEstimate(estimateData);
    if (result) {
      setEstimateResult(result);
    } else {
      alert("필수 정보를 모두 입력해주세요!");
    }
  };

  const handleSave = async () => {
    if (!estimateResult) {
      alert("먼저 견적 계산을 완료해주세요!");
      return;
    }

    setIsLoading(true);
    try {
      const docId = await saveEstimate({
        sellerId,
        items: estimateResult.details,
        total: estimateResult.total,
        customerName: estimateData?.customerName || '',
        customerPhone: estimateData?.customerPhone || '',
        projectDescription: estimateData?.projectDescription || '',
      });

      setSavedEstimateId(docId);
      alert(`견적 저장 완료! 문서 ID: ${docId}`);
    } catch (error) {
      console.error('견적 저장 실패:', error);
      alert(`견적 저장 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">커튼 설치 견적</h1>
        <p className="text-gray-600">정확한 견적을 위해 상세 정보를 입력해주세요</p>
      </div>

      <EstimateInput onEstimateChange={handleEstimateChange} />

      <div className="text-center">
        <button
          onClick={handleCalculate}
          className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg font-semibold transition-colors duration-200"
        >
          견적 계산하기
        </button>
      </div>

      {estimateResult && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">견적 결과</h2>
          
          <div className="space-y-4">
            {estimateResult.details.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <div className="font-medium text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
                <div className="font-semibold text-gray-800">
                  {formatCurrency(item.amount)}원
                </div>
              </div>
            ))}
            
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex justify-between items-center text-lg font-semibold text-gray-800">
                <span>총 견적 금액</span>
                <span className="text-2xl text-blue-600">
                  {formatCurrency(estimateResult.total)}원
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-8 rounded-lg font-semibold transition-colors duration-200"
            >
              {isLoading ? '저장 중...' : '견적 저장'}
            </button>
            
            {savedEstimateId && (
              <div className="text-sm text-green-600 font-medium">
                저장된 견적 ID: {savedEstimateId}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 