import React, { useState } from 'react';
import PaymentCalculator from './PaymentCalculator';

export default function PaymentCalculatorExample() {
  const [workOrder, setWorkOrder] = useState({
    id: 'work-order-123',
    baseFee: 150000,
    urgentFeePercent: 15,
    platformFeePercent: 10,
    discountPercent: 0,
    taxPercent: 10,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전 생성
    status: '등록'
  });

  const [workerGrade, setWorkerGrade] = useState({
    level: 3,
    name: '골드',
    description: '프리미엄 매칭, 추가 혜택'
  });

  const [paymentInfo, setPaymentInfo] = useState(null);

  const handleWorkOrderChange = (field, value) => {
    setWorkOrder(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkerGradeChange = (level) => {
    const grades = {
      1: { level: 1, name: '브론즈', description: '기본 서비스 제공' },
      2: { level: 2, name: '실버', description: '우선 매칭, 기본 혜택' },
      3: { level: 3, name: '골드', description: '프리미엄 매칭, 추가 혜택' },
      4: { level: 4, name: '플래티넘', description: 'VIP 매칭, 특별 혜택' },
      5: { level: 5, name: '다이아몬드', description: '최고 등급, 모든 혜택' }
    };
    setWorkerGrade(grades[level]);
  };

  const handlePaymentChange = (payment) => {
    setPaymentInfo(payment);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">결제 계산기 예제</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 폼 */}
        <div className="space-y-6">
          {/* 작업 주문 정보 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">작업 주문 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기본 시공비 (원)
                </label>
                <input
                  type="number"
                  value={workOrder.baseFee}
                  onChange={(e) => handleWorkOrderChange('baseFee', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  긴급 수수료 비율 (%)
                </label>
                <input
                  type="number"
                  value={workOrder.urgentFeePercent}
                  onChange={(e) => handleWorkOrderChange('urgentFeePercent', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  플랫폼 수수료 비율 (%)
                </label>
                <input
                  type="number"
                  value={workOrder.platformFeePercent}
                  onChange={(e) => handleWorkOrderChange('platformFeePercent', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="50"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  할인 비율 (%)
                </label>
                <input
                  type="number"
                  value={workOrder.discountPercent}
                  onChange={(e) => handleWorkOrderChange('discountPercent', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  세금 비율 (%)
                </label>
                <input
                  type="number"
                  value={workOrder.taxPercent}
                  onChange={(e) => handleWorkOrderChange('taxPercent', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
            </div>
          </div>

          {/* 작업자 등급 */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">작업자 등급</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((level) => (
                <label key={level} className="flex items-center">
                  <input
                    type="radio"
                    name="workerGrade"
                    value={level}
                    checked={workerGrade.level === level}
                    onChange={() => handleWorkerGradeChange(level)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">
                      {level === 1 && '브론즈'}
                      {level === 2 && '실버'}
                      {level === 3 && '골드'}
                      {level === 4 && '플래티넘'}
                      {level === 5 && '다이아몬드'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {level === 1 && '기본 서비스 제공'}
                      {level === 2 && '우선 매칭, 기본 혜택'}
                      {level === 3 && '프리미엄 매칭, 추가 혜택'}
                      {level === 4 && 'VIP 매칭, 특별 혜택'}
                      {level === 5 && '최고 등급, 모든 혜택'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 현재 설정 요약 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">현재 설정</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• 기본 시공비: {workOrder.baseFee?.toLocaleString()}원</p>
              <p>• 긴급 수수료: {workOrder.urgentFeePercent}%</p>
              <p>• 플랫폼 수수료: {workOrder.platformFeePercent}%</p>
              <p>• 작업자 등급: {workerGrade.name} (수수료 {getGradeMultiplier(workerGrade.level) * 100}%)</p>
              <p>• 생성 시간: {workOrder.createdAt.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 결제 계산 결과 */}
        <div>
          <PaymentCalculator
            workOrder={workOrder}
            workerGrade={workerGrade}
            onPaymentChange={handlePaymentChange}
          />
        </div>
      </div>

      {/* 결제 정보 요약 */}
      {paymentInfo && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">결제 정보 요약</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {paymentInfo.formatted?.customerTotalPayment || paymentInfo.customerTotalPayment?.toLocaleString() + '원'}
              </div>
              <div className="text-sm text-green-700">고객 총 결제액</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {paymentInfo.formatted?.workerPayment || paymentInfo.workerPayment?.toLocaleString() + '원'}
              </div>
              <div className="text-sm text-blue-700">작업자 지급액</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {paymentInfo.formatted?.platformFee || paymentInfo.platformFee?.toLocaleString() + '원'}
              </div>
              <div className="text-sm text-orange-700">플랫폼 수수료</div>
            </div>
          </div>
        </div>
      )}

      {/* 사용법 안내 */}
      <div className="mt-6 bg-gray-50 border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">사용법</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 기본 시공비를 입력하면 자동으로 모든 수수료가 계산됩니다.</li>
          <li>• 긴급 수수료는 시간이 지날수록 자동으로 증가합니다 (1시간마다 5%씩).</li>
          <li>• 작업자 등급에 따라 플랫폼 수수료가 조정됩니다.</li>
          <li>• 할인과 세금을 적용할 수 있습니다.</li>
          <li>• 모든 계산은 실시간으로 업데이트됩니다.</li>
        </ul>
      </div>
    </div>
  );
}

// 등급별 수수료 배율 반환 함수
function getGradeMultiplier(gradeLevel) {
  const multipliers = {
    1: 1.0,  // 브론즈: 기본 수수료
    2: 0.9,  // 실버: 10% 할인
    3: 0.8,  // 골드: 20% 할인
    4: 0.7,  // 플래티넘: 30% 할인
    5: 0.6   // 다이아몬드: 40% 할인
  };
  
  return multipliers[gradeLevel] || 1.0;
} 