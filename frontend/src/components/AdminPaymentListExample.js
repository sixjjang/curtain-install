import React, { useState } from 'react';
import AdminPaymentList from './AdminPaymentList';
import PaymentDetailModal from './PaymentDetailModal';

export default function AdminPaymentListExample() {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleStatusUpdate = async (workOrderId, newStatus) => {
    try {
      // Call your Firebase function to update payment status
      const response = await fetch('/updatePaymentStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workOrderId,
          status: newStatus,
          updatedBy: 'admin',
          paidAt: newStatus === 'paid' ? new Date().toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      const result = await response.json();
      console.log('Payment status updated:', result);
      
      // You might want to refresh the payment list here
      // or update the local state
      
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="mt-1 text-sm text-gray-500">
                결제 내역 관리 및 모니터링
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                설정
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                새 작업 주문
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <a href="#" className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              결제 내역
            </a>
            <a href="#" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              작업 주문
            </a>
            <a href="#" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              고객 관리
            </a>
            <a href="#" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              작업자 관리
            </a>
            <a href="#" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
              통계
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">오늘 매출</dt>
                    <dd className="text-lg font-medium text-gray-900">₩2,450,000</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">완료된 작업</dt>
                    <dd className="text-lg font-medium text-gray-900">24</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">대기 중</dt>
                    <dd className="text-lg font-medium text-gray-900">8</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">실패한 결제</dt>
                    <dd className="text-lg font-medium text-gray-900">3</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-white shadow rounded-lg">
          <AdminPaymentList 
            onPaymentClick={handlePaymentClick}
          />
        </div>
      </div>

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        payment={selectedPayment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 커튼 설치 플랫폼. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                도움말
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                문의하기
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                개인정보처리방침
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Additional utility functions for the example
export const adminUtils = {
  // Generate sample payment data for testing
  generateSamplePayments: (count = 50) => {
    const statuses = ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'];
    const paymentMethods = ['card', 'bank_transfer', 'cash', 'mobile_payment'];
    const customers = ['김철수', '이영희', '박민수', '정수진', '최동욱', '한미영'];
    const workers = ['김기사', '이기사', '박기사', '정기사', '최기사'];

    return Array.from({ length: count }, (_, i) => ({
      workOrderId: `work-order-${String(i + 1).padStart(3, '0')}`,
      customerName: customers[Math.floor(Math.random() * customers.length)],
      workerName: workers[Math.floor(Math.random() * workers.length)],
      baseFee: Math.floor(Math.random() * 300000) + 100000,
      urgentFeePercent: Math.floor(Math.random() * 30) + 5,
      platformFeePercent: Math.floor(Math.random() * 15) + 5,
      paymentStatus: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      paymentDetails: {
        urgentFee: Math.floor(Math.random() * 50000) + 10000,
        totalFee: Math.floor(Math.random() * 400000) + 150000,
        platformFee: Math.floor(Math.random() * 40000) + 10000,
        workerPayment: Math.floor(Math.random() * 350000) + 120000,
        customerTotalPayment: Math.floor(Math.random() * 450000) + 160000,
        paidAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        transactionId: Math.random() > 0.2 ? `txn_${Math.random().toString(36).substr(2, 9)}` : null,
        actualAmount: Math.floor(Math.random() * 400000) + 150000,
        notes: Math.random() > 0.7 ? '특별 할인 적용' : null,
      },
    }));
  },

  // Export payment data to various formats
  exportPayments: (payments, format = 'csv') => {
    switch (format) {
      case 'csv':
        return convertToCSV(payments);
      case 'json':
        return JSON.stringify(payments, null, 2);
      case 'excel':
        // You would need a library like xlsx for Excel export
        return convertToCSV(payments);
      default:
        return convertToCSV(payments);
    }
  },

  // Calculate payment statistics
  calculateStatistics: (payments) => {
    const stats = {
      totalPayments: payments.length,
      totalRevenue: 0,
      totalWorkerPayments: 0,
      totalPlatformFees: 0,
      averagePayment: 0,
      statusCounts: {},
      paymentMethodCounts: {},
      dailyRevenue: {},
    };

    payments.forEach(payment => {
      stats.totalRevenue += payment.paymentDetails.totalFee || 0;
      stats.totalWorkerPayments += payment.paymentDetails.workerPayment || 0;
      stats.totalPlatformFees += payment.paymentDetails.platformFee || 0;
      
      stats.statusCounts[payment.paymentStatus] = (stats.statusCounts[payment.paymentStatus] || 0) + 1;
      
      if (payment.paymentDetails.paymentMethod) {
        stats.paymentMethodCounts[payment.paymentDetails.paymentMethod] = 
          (stats.paymentMethodCounts[payment.paymentDetails.paymentMethod] || 0) + 1;
      }

      if (payment.paymentDetails.paidAt) {
        const date = new Date(payment.paymentDetails.paidAt.seconds * 1000).toDateString();
        stats.dailyRevenue[date] = (stats.dailyRevenue[date] || 0) + (payment.paymentDetails.totalFee || 0);
      }
    });

    stats.averagePayment = stats.totalPayments > 0 ? stats.totalRevenue / stats.totalPayments : 0;

    return stats;
  },
};

// Helper function for CSV conversion
function convertToCSV(data) {
  const headers = [
    '작업 ID',
    '고객명',
    '작업자',
    '총 결제금액',
    '기사 지급액',
    '플랫폼 수수료',
    '결제 방법',
    '결제 상태',
    '결제일',
    '거래 ID'
  ];

  const rows = data.map(payment => [
    payment.workOrderId,
    payment.customerName,
    payment.workerName || '미배정',
    payment.paymentDetails.customerTotalPayment || payment.paymentDetails.totalFee || 0,
    payment.paymentDetails.workerPayment || 0,
    payment.paymentDetails.platformFee || 0,
    payment.paymentDetails.paymentMethod || '',
    payment.paymentStatus,
    payment.paymentDetails.paidAt ? 
      new Date(payment.paymentDetails.paidAt.seconds * 1000).toLocaleDateString('ko-KR') : '',
    payment.paymentDetails.transactionId || ''
  ]);

  return [headers, ...rows].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
} 