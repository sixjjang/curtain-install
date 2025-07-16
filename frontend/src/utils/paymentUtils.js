/**
 * 결제 데이터 유효성 검사
 * @param {Object} paymentData - 검사할 결제 데이터
 * @returns {Object} 검사 결과 { isValid: boolean, errors: Array }
 */
export const validatePaymentData = (paymentData) => {
  const errors = [];

  // 필수 필드 검사
  if (!paymentData.advertiserId || paymentData.advertiserId.trim() === '') {
    errors.push('광고주는 필수입니다.');
  }

  if (!paymentData.amount || paymentData.amount <= 0) {
    errors.push('결제금액은 0보다 커야 합니다.');
  }

  if (!Array.isArray(paymentData.ads) || paymentData.ads.length === 0) {
    errors.push('결제 대상 광고를 선택해주세요.');
  }

  // 결제수단 검사
  const validPaymentMethods = ['카드', '계좌이체', '현금', '기타'];
  if (paymentData.paymentMethod && !validPaymentMethods.includes(paymentData.paymentMethod)) {
    errors.push('올바른 결제수단을 선택해주세요.');
  }

  // 상태 검사
  const validStatuses = ['paid', 'pending', 'failed'];
  if (paymentData.status && !validStatuses.includes(paymentData.status)) {
    errors.push('올바른 결제 상태를 선택해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 결제 상태 텍스트 변환
 * @param {string} status - 상태 코드
 * @returns {string} 상태 텍스트
 */
export const getPaymentStatusText = (status) => {
  const statusMap = {
    'paid': '결제완료',
    'pending': '대기중',
    'failed': '실패'
  };
  return statusMap[status] || status;
};

/**
 * 결제 상태 색상 클래스 반환
 * @param {string} status - 상태 코드
 * @returns {string} Tailwind CSS 클래스
 */
export const getPaymentStatusColor = (status) => {
  const colorMap = {
    'paid': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'failed': 'bg-red-100 text-red-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * 결제수단 텍스트 변환
 * @param {string} method - 결제수단 코드
 * @returns {string} 결제수단 텍스트
 */
export const getPaymentMethodText = (method) => {
  const methodMap = {
    '카드': '신용카드',
    '계좌이체': '계좌이체',
    '현금': '현금',
    '기타': '기타'
  };
  return methodMap[method] || method;
};

/**
 * 결제 데이터 포맷팅
 * @param {Object} payment - 결제 데이터
 * @returns {Object} 포맷된 데이터
 */
export const formatPaymentData = (payment) => {
  return {
    ...payment,
    statusText: getPaymentStatusText(payment.status),
    statusColor: getPaymentStatusColor(payment.status),
    methodText: getPaymentMethodText(payment.paymentMethod),
    formattedAmount: payment.amount?.toLocaleString() + '원',
    paymentDate: payment.paymentDate?.toDate?.() || payment.paymentDate,
    createdAt: payment.createdAt?.toDate?.() || payment.createdAt,
    updatedAt: payment.updatedAt?.toDate?.() || payment.updatedAt
  };
};

/**
 * 결제 검색 필터링
 * @param {Array} payments - 결제 목록
 * @param {string} searchTerm - 검색어
 * @param {Array} advertisers - 광고주 목록
 * @returns {Array} 필터링된 목록
 */
export const filterPayments = (payments, searchTerm, advertisers = []) => {
  if (!searchTerm) return payments;
  
  const term = searchTerm.toLowerCase();
  return payments.filter(payment => {
    const advertiser = advertisers.find(a => a.id === payment.advertiserId);
    const advertiserName = advertiser ? (advertiser.companyName || advertiser.name) : '';
    
    return (
      payment.id.toLowerCase().includes(term) ||
      advertiserName.toLowerCase().includes(term) ||
      payment.amount?.toString().includes(term)
    );
  });
};

/**
 * 결제 데이터 정렬
 * @param {Array} payments - 결제 목록
 * @param {string} sortBy - 정렬 기준
 * @param {string} sortOrder - 정렬 순서 ('asc' | 'desc')
 * @returns {Array} 정렬된 목록
 */
export const sortPayments = (payments, sortBy = 'createdAt', sortOrder = 'desc') => {
  return [...payments].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // 날짜 필드 처리
    if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'paymentDate') {
      aValue = aValue?.toDate?.() || aValue;
      bValue = bValue?.toDate?.() || bValue;
    }

    // 숫자 필드 처리
    if (sortBy === 'amount') {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }

    // 문자열 필드 처리
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

/**
 * 결제 통계 계산
 * @param {Array} payments - 결제 목록
 * @returns {Object} 통계 데이터
 */
export const calculatePaymentStats = (payments) => {
  const stats = {
    total: payments.length,
    totalAmount: 0,
    paid: 0,
    pending: 0,
    failed: 0,
    paidAmount: 0,
    pendingAmount: 0,
    failedAmount: 0,
    averageAmount: 0
  };

  payments.forEach(payment => {
    const amount = payment.amount || 0;
    stats.totalAmount += amount;
    
    switch (payment.status) {
      case 'paid':
        stats.paid++;
        stats.paidAmount += amount;
        break;
      case 'pending':
        stats.pending++;
        stats.pendingAmount += amount;
        break;
      case 'failed':
        stats.failed++;
        stats.failedAmount += amount;
        break;
    }
  });

  stats.averageAmount = stats.total > 0 ? Math.round(stats.totalAmount / stats.total) : 0;

  return stats;
};

/**
 * 월별 결제 통계 계산
 * @param {Array} payments - 결제 목록
 * @returns {Array} 월별 통계
 */
export const calculateMonthlyPaymentStats = (payments) => {
  const monthlyStats = {};
  
  payments.forEach(payment => {
    const date = payment.paymentDate?.toDate?.() || payment.paymentDate;
    if (!date) return;
    
    const monthKey = new Date(date).toISOString().slice(0, 7); // YYYY-MM
    const amount = payment.amount || 0;
    
    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = {
        month: monthKey,
        totalAmount: 0,
        count: 0,
        paid: 0,
        pending: 0,
        failed: 0
      };
    }
    
    monthlyStats[monthKey].totalAmount += amount;
    monthlyStats[monthKey].count++;
    
    switch (payment.status) {
      case 'paid':
        monthlyStats[monthKey].paid++;
        break;
      case 'pending':
        monthlyStats[monthKey].pending++;
        break;
      case 'failed':
        monthlyStats[monthKey].failed++;
        break;
    }
  });
  
  return Object.values(monthlyStats).sort((a, b) => b.month.localeCompare(a.month));
};

/**
 * 광고주별 결제 통계 계산
 * @param {Array} payments - 결제 목록
 * @param {Array} advertisers - 광고주 목록
 * @returns {Array} 광고주별 통계
 */
export const calculateAdvertiserPaymentStats = (payments, advertisers) => {
  const advertiserStats = {};
  
  payments.forEach(payment => {
    const advertiserId = payment.advertiserId;
    const amount = payment.amount || 0;
    
    if (!advertiserStats[advertiserId]) {
      const advertiser = advertisers.find(a => a.id === advertiserId);
      advertiserStats[advertiserId] = {
        advertiserId,
        advertiserName: advertiser ? (advertiser.companyName || advertiser.name) : '알 수 없음',
        totalAmount: 0,
        count: 0,
        paid: 0,
        pending: 0,
        failed: 0
      };
    }
    
    advertiserStats[advertiserId].totalAmount += amount;
    advertiserStats[advertiserId].count++;
    
    switch (payment.status) {
      case 'paid':
        advertiserStats[advertiserId].paid++;
        break;
      case 'pending':
        advertiserStats[advertiserId].pending++;
        break;
      case 'failed':
        advertiserStats[advertiserId].failed++;
        break;
    }
  });
  
  return Object.values(advertiserStats).sort((a, b) => b.totalAmount - a.totalAmount);
}; 