import React, { useState, useEffect } from 'react';
import {
  calculatePayment,
  calculateDynamicUrgentFee,
  calculateGradeBasedFees,
  formatPaymentInfo,
  validateWorkOrderPayment
} from '../utils/paymentCalculator';

export default function PaymentCalculator({ workOrder, workerGrade, onPaymentChange }) {
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [formattedPayment, setFormattedPayment] = useState(null);
  const [validation, setValidation] = useState(null);
  const [hoursSinceCreation, setHoursSinceCreation] = useState(0);

  useEffect(() => {
    if (workOrder) {
      // 경과 시간 계산
      const createdAt = workOrder.createdAt ? new Date(workOrder.createdAt) : new Date();
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
      setHoursSinceCreation(hoursDiff);

      // 동적 긴급 수수료 계산
      const dynamicUrgentFee = calculateDynamicUrgentFee(workOrder, hoursDiff);
      const workOrderWithDynamicFee = {
        ...workOrder,
        currentUrgentFeePercent: dynamicUrgentFee
      };

      // 결제 계산
      let calculatedPayment;
      if (workerGrade) {
        calculatedPayment = calculateGradeBasedFees(workOrderWithDynamicFee, workerGrade);
      } else {
        calculatedPayment = calculatePayment(workOrderWithDynamicFee);
      }

      setPaymentInfo(calculatedPayment);
      setFormattedPayment(formatPaymentInfo(calculatedPayment));
      setValidation(validateWorkOrderPayment(workOrderWithDynamicFee));

      // 부모 컴포넌트에 결제 정보 전달
      if (onPaymentChange) {
        onPaymentChange(calculatedPayment);
      }
    }
  }, [workOrder, workerGrade, onPaymentChange]);

  if (!workOrder || !paymentInfo) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="text-center text-gray-500">
          작업 주문 정보를 입력해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검증 결과 */}
      {validation && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">검증 결과</h3>
          {validation.errors.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">오류</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-red-500 mr-2">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-2">경고</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-yellow-500 mr-2">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 기본 정보 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기본 시공비
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {formattedPayment.formatted.baseFee}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              긴급 수수료
            </label>
            <p className="text-lg font-semibold text-orange-600">
              {formattedPayment.formatted.urgentFee} ({paymentInfo.urgentFeePercent}%)
            </p>
          </div>
          {paymentInfo.discountPercent > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                할인
              </label>
              <p className="text-lg font-semibold text-green-600">
                -{formattedPayment.formatted.discountAmount} ({paymentInfo.discountPercent}%)
              </p>
            </div>
          )}
          {paymentInfo.taxPercent > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                세금
              </label>
              <p className="text-lg font-semibold text-gray-600">
                {formattedPayment.formatted.taxAmount} ({paymentInfo.taxPercent}%)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 수수료 정보 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">수수료 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              플랫폼 수수료
            </label>
            <p className="text-lg font-semibold text-blue-600">
              {formattedPayment.formatted.platformFee} ({paymentInfo.platformFeePercent}%)
            </p>
            {paymentInfo.gradeInfo && (
              <p className="text-sm text-gray-500 mt-1">
                {paymentInfo.gradeInfo.name} 등급 적용 (배율: {paymentInfo.gradeInfo.multiplier})
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              작업자 지급액
            </label>
            <p className="text-lg font-semibold text-green-600">
              {formattedPayment.formatted.workerPayment}
            </p>
          </div>
        </div>
      </div>

      {/* 총액 정보 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">총액 정보</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700">총 시공비</span>
            <span className="font-semibold text-gray-900">
              {formattedPayment.formatted.totalFee}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700">고객 총 결제액</span>
            <span className="font-semibold text-blue-600 text-lg">
              {formattedPayment.formatted.customerTotalPayment}
            </span>
          </div>
        </div>
      </div>

      {/* 동적 긴급 수수료 정보 */}
      {hoursSinceCreation > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-800 mb-2">
            동적 긴급 수수료 정보
          </h4>
          <div className="text-sm text-orange-700 space-y-1">
            <p>생성 후 경과 시간: {Math.floor(hoursSinceCreation)}시간</p>
            <p>기본 긴급 수수료: {workOrder.urgentFeePercent || 0}%</p>
            <p>현재 긴급 수수료: {paymentInfo.urgentFeePercent}%</p>
            {paymentInfo.urgentFeePercent > (workOrder.urgentFeePercent || 0) && (
              <p className="font-medium">
                ⚠️ 긴급 수수료가 {paymentInfo.urgentFeePercent - (workOrder.urgentFeePercent || 0)}% 증가했습니다.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 계산 세부사항 */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">계산 세부사항</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• 기본 시공비: {workOrder.baseFee?.toLocaleString()}원</p>
          <p>• 긴급 수수료: {workOrder.baseFee?.toLocaleString()} × {paymentInfo.urgentFeePercent}% = {paymentInfo.urgentFee?.toLocaleString()}원</p>
          <p>• 총 시공비: {paymentInfo.discountedBaseFee?.toLocaleString()} + {paymentInfo.urgentFee?.toLocaleString()} = {paymentInfo.totalFee?.toLocaleString()}원</p>
          <p>• 플랫폼 수수료: {paymentInfo.totalFee?.toLocaleString()} × {paymentInfo.platformFeePercent}% = {paymentInfo.platformFee?.toLocaleString()}원</p>
          <p>• 작업자 지급액: {paymentInfo.totalFee?.toLocaleString()} - {paymentInfo.platformFee?.toLocaleString()} = {paymentInfo.workerPayment?.toLocaleString()}원</p>
        </div>
      </div>
    </div>
  );
} 