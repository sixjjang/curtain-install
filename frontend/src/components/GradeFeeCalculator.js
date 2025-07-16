import React, { useState, useEffect } from 'react';
import {
  calculateUrgentFeePercent,
  calculateUrgentFeeByLevel,
  getGradeInfo,
  getAllGradeInfo,
  getUrgencyBaseRates,
  generateGradeFeeExamples,
  generateUrgencyGradeFees,
  formatFeePercent,
  calculateDiscountAmount,
  getGradeBenefitDescription,
  calculateGradeUpgradeBenefit,
  generateComparisonTable,
  advancedGradeFeeCalculator
} from '../utils/gradeFeeCalculator';

const GradeFeeCalculator = () => {
  const [contractorLevel, setContractorLevel] = useState(3);
  const [basePercent, setBasePercent] = useState(15);
  const [urgencyLevel, setUrgencyLevel] = useState('high');
  const [totalAmount, setTotalAmount] = useState(1000000);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);

  const gradeInfo = getAllGradeInfo();
  const urgencyRates = getUrgencyBaseRates();

  useEffect(() => {
    // 실시간 계산 결과 업데이트
    const result = advancedGradeFeeCalculator({
      contractorLevel,
      basePercent,
      totalAmount,
      urgencyLevel,
      includeBreakdown: true
    });
    setCalculationResult(result);
  }, [contractorLevel, basePercent, urgencyLevel, totalAmount]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getGradeColor = (level) => {
    const colors = {
      1: 'bg-gray-100 text-gray-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-green-100 text-green-800',
      4: 'bg-purple-100 text-purple-800',
      5: 'bg-yellow-100 text-yellow-800'
    };
    return colors[level] || colors[1];
  };

  const getUrgencyColor = (level) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-yellow-100 text-yellow-800',
      'urgent': 'bg-orange-100 text-orange-800',
      'emergency': 'bg-red-100 text-red-800'
    };
    return colors[level] || colors['medium'];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          계약자 등급별 긴급 수수료 계산기
        </h1>
        <p className="text-gray-600">
          5단계 등급 시스템을 기반으로 한 긴급 수수료 할인 계산
        </p>
      </div>

      {/* 입력 폼 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">계산 조건 설정</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 계약자 등급 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              계약자 등급
            </label>
            <select
              value={contractorLevel}
              onChange={(e) => setContractorLevel(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.keys(gradeInfo).map(level => (
                <option key={level} value={level}>
                  {gradeInfo[level].name} ({level}등급) - {gradeInfo[level].discount}% 할인
                </option>
              ))}
            </select>
          </div>

          {/* 긴급도 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              긴급도
            </label>
            <select
              value={urgencyLevel}
              onChange={(e) => setUrgencyLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.keys(urgencyRates).map(level => (
                <option key={level} value={level}>
                  {level === 'low' && '낮음'}
                  {level === 'medium' && '보통'}
                  {level === 'high' && '높음'}
                  {level === 'urgent' && '긴급'}
                  {level === 'emergency' && '비상'}
                  {' '}({urgencyRates[level]}%)
                </option>
              ))}
            </select>
          </div>

          {/* 기본 수수료율 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기본 수수료율 (%)
            </label>
            <input
              type="number"
              value={basePercent}
              onChange={(e) => setBasePercent(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 총 금액 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              총 금액 (원)
            </label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 고급 옵션 토글 */}
        <div className="mt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showAdvanced ? '▼' : '▶'} 고급 옵션
          </button>
        </div>
      </div>

      {/* 계산 결과 */}
      {calculationResult && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">계산 결과</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* 현재 등급 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">현재 등급</h3>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(contractorLevel)}`}>
                {calculationResult.gradeInfo.name} ({contractorLevel}등급)
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {getGradeBenefitDescription(contractorLevel)}
              </p>
            </div>

            {/* 긴급도 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">긴급도</h3>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(urgencyLevel)}`}>
                {urgencyLevel === 'low' && '낮음'}
                {urgencyLevel === 'medium' && '보통'}
                {urgencyLevel === 'high' && '높음'}
                {urgencyLevel === 'urgent' && '긴급'}
                {urgencyLevel === 'emergency' && '비상'}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                기본 수수료율: {calculationResult.basePercent}%
              </p>
            </div>

            {/* 최종 수수료율 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">최종 수수료율</h3>
              <div className="text-2xl font-bold text-blue-600">
                {formatFeePercent(calculationResult.finalPercent)}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                할인: {calculationResult.discount}%
              </p>
            </div>
          </div>

          {/* 상세 분석 */}
          {calculationResult.breakdown && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-4">상세 분석</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">기본 수수료</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(calculationResult.breakdown.baseFee)}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">최종 수수료</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(calculationResult.breakdown.finalFee)}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">할인 금액</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(calculationResult.breakdown.discountAmount)}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">절약율</p>
                  <p className="text-lg font-semibold text-green-600">
                    {calculationResult.breakdown.savingsPercent}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 등급별 비교 테이블 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">등급별 수수료 비교</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">등급</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">할인율</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">기본 수수료</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">최종 수수료</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">절약액</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">혜택</th>
              </tr>
            </thead>
            <tbody>
              {calculationResult?.comparison.map((grade) => (
                <tr 
                  key={grade.level} 
                  className={`border-b border-gray-100 ${
                    grade.level === contractorLevel ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade.level)}`}>
                        {grade.gradeName}
                      </span>
                      {grade.level === contractorLevel && (
                        <span className="text-blue-600 text-sm">(현재)</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {grade.discount}%
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatFeePercent(grade.basePercent)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${
                      grade.level === contractorLevel ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {formatFeePercent(grade.finalPercent)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-green-600 font-medium">
                      {formatCurrency(calculateDiscountAmount(totalAmount, grade.basePercent, grade.finalPercent))}원
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {getGradeBenefitDescription(grade.level)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 등급 상승 혜택 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">등급 상승 혜택</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[contractorLevel + 1, contractorLevel + 2].map(targetLevel => {
            if (targetLevel > 5) return null;
            
            const benefit = calculateGradeUpgradeBenefit(contractorLevel, targetLevel, calculationResult?.basePercent || 0);
            
            if (!benefit.upgrade) return null;

            return (
              <div key={targetLevel} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  {benefit.targetGradeName} 등급으로 상승 시
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">현재 수수료:</span>
                    <span className="ml-2 font-medium">{formatFeePercent(benefit.currentFee)}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">목표 수수료:</span>
                    <span className="ml-2 font-medium text-blue-600">{formatFeePercent(benefit.targetFee)}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">추가 할인:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formatFeePercent(benefit.additionalDiscount)}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">추가 절약:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formatCurrency(calculateDiscountAmount(totalAmount, benefit.currentFee, benefit.targetFee))}원
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 긴급도별 비교 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">긴급도별 수수료 비교</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">긴급도</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">기본 수수료</th>
                {Object.keys(gradeInfo).map(level => (
                  <th key={level} className="text-left py-3 px-4 font-medium text-gray-900">
                    {gradeInfo[level].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(urgencyRates).map(urgency => (
                <tr key={urgency} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(urgency)}`}>
                      {urgency === 'low' && '낮음'}
                      {urgency === 'medium' && '보통'}
                      {urgency === 'high' && '높음'}
                      {urgency === 'urgent' && '긴급'}
                      {urgency === 'emergency' && '비상'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatFeePercent(urgencyRates[urgency])}
                  </td>
                  {Object.keys(gradeInfo).map(level => {
                    const finalFee = calculateUrgentFeeByLevel(urgency, parseInt(level));
                    return (
                      <td key={level} className="py-3 px-4">
                        <span className={`text-sm font-medium ${
                          parseInt(level) === contractorLevel && urgency === urgencyLevel 
                            ? 'text-blue-600' 
                            : 'text-gray-900'
                        }`}>
                          {formatFeePercent(finalFee)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">사용법 안내</h3>
        <div className="text-blue-800 space-y-2 text-sm">
          <p><strong>1. 계약자 등급 선택:</strong> 브론즈(1등급)부터 다이아몬드(5등급)까지 선택</p>
          <p><strong>2. 긴급도 설정:</strong> 낮음(5%)부터 비상(35%)까지 긴급도에 따른 기본 수수료율</p>
          <p><strong>3. 기본 수수료율:</strong> 수동으로 기본 수수료율을 설정할 수 있습니다</p>
          <p><strong>4. 총 금액 입력:</strong> 실제 할인 금액을 계산하기 위한 총 금액</p>
          <p><strong>5. 실시간 계산:</strong> 입력값 변경 시 즉시 계산 결과가 업데이트됩니다</p>
        </div>
      </div>
    </div>
  );
};

export default GradeFeeCalculator; 