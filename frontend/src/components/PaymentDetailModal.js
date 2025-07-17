import React, { useState } from 'react';

// JSDoc for props
/**
 * @param {Object} props
 * @param {any} props.payment
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function=} props.onStatusUpdate
 */
export default function PaymentDetailModal({ payment, isOpen, onClose, onStatusUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(payment?.paymentStatus || 'pending');

  if (!isOpen || !payment) return null;

  const handleStatusUpdate = async () => {
    if (!onStatusUpdate) return;
    setIsUpdating(true);
    try {
      await onStatusUpdate(payment.workOrderId, newStatus);
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('상태 업데이트에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-purple-100 text-purple-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      card: "카드",
      bank_transfer: "계좌이체",
      cash: "현금",
      mobile_payment: "모바일결제",
      other: "기타",
    };
    return labels[method] || method;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString('ko-KR');
    }
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다.');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              결제 상세 정보
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Payment Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">기본 정보</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">작업 ID</label>
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-900">{payment.workOrderId}</span>
                    <button
                      onClick={() => copyToClipboard(payment.workOrderId)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      복사
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">고객명</label>
                  <div className="mt-1 text-sm text-gray-900">{payment.customerName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">작업자</label>
                  <div className="mt-1 text-sm text-gray-900">{payment.workerName || '미배정'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">결제 상태</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.paymentStatus)}`}>
                      {payment.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">결제 상세</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">기본 시공비</label>
                  <div className="mt-1 text-sm text-gray-900">{payment.baseFee?.toLocaleString()}원</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">긴급 수수료</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {payment.paymentDetails?.urgentFee?.toLocaleString()}원 ({payment.urgentFeePercent}%)
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">총 결제금액</label>
                  <div className="mt-1 text-lg font-semibold text-green-600">
                    {payment.paymentDetails?.customerTotalPayment?.toLocaleString() || 
                     payment.paymentDetails?.totalFee?.toLocaleString()}원
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">작업자 지급액</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {payment.paymentDetails?.workerPayment?.toLocaleString()}원
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">플랫폼 수수료</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {payment.paymentDetails?.platformFee?.toLocaleString()}원 ({payment.platformFeePercent}%)
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">결제 방법</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {payment.paymentDetails?.paymentMethod ? 
                      getPaymentMethodLabel(payment.paymentDetails.paymentMethod) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Information */}
            {(payment.paymentDetails?.transactionId || payment.paymentDetails?.actualAmount) && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">거래 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payment.paymentDetails?.transactionId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">거래 ID</label>
                      <div className="mt-1 flex items-center">
                        <span className="text-sm text-gray-900 font-mono">{payment.paymentDetails.transactionId}</span>
                        <button
                          onClick={() => copyToClipboard(payment.paymentDetails.transactionId)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          복사
                        </button>
                      </div>
                    </div>
                  )}
                  {payment.paymentDetails?.actualAmount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">실제 결제액</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {payment.paymentDetails.actualAmount.toLocaleString()}원
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">시간 정보</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">생성일</label>
                  <div className="mt-1 text-sm text-gray-900">{formatDate(payment.createdAt)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">결제일</label>
                  <div className="mt-1 text-sm text-gray-900">{formatDate(payment.paymentDetails?.paidAt)}</div>
                </div>
                {payment.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">최종 수정일</label>
                    <div className="mt-1 text-sm text-gray-900">{formatDate(payment.updatedAt)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {payment.paymentDetails?.notes && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">메모</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700">{payment.paymentDetails.notes}</p>
                </div>
              </div>
            )}

            {/* Status Update (Admin Only) */}
            {onStatusUpdate && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">상태 변경</h4>
                <div className="flex items-center space-x-4">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">대기중</option>
                    <option value="processing">처리중</option>
                    <option value="paid">결제완료</option>
                    <option value="failed">결제실패</option>
                    <option value="refunded">환불</option>
                    <option value="cancelled">취소</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={isUpdating || newStatus === payment.paymentStatus}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? '업데이트 중...' : '상태 변경'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              닫기
            </button>
            <button
              onClick={() => {
                const url = `/admin/payment/${payment.workOrderId}`;
                window.open(url, '_blank');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              전체 페이지 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 