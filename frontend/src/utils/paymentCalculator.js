/**
 * 작업 주문 결제 계산 유틸리티
 */

// 작업 주문 인터페이스 (JSDoc으로 정의)
/**
 * @typedef {Object} WorkOrder
 * @property {number} baseFee - 기본 시공비
 * @property {number} urgentFeePercent - 긴급 시공 수수료 비율 (예: 15)
 * @property {number} platformFeePercent - 플랫폼 수수료 비율 (예: 10)
 * @property {number} [currentUrgentFeePercent] - 현재 긴급 수수료 비율 (동적 계산용)
 * @property {number} [discountPercent] - 할인 비율 (예: 5)
 * @property {number} [taxPercent] - 세금 비율 (예: 10)
 */

/**
 * 기본 결제 계산 함수
 * @param {WorkOrder} workOrder - 작업 주문 정보
 * @returns {Object} 계산된 결제 정보
 */
export function calculatePayment(workOrder) {
  const {
    baseFee = 0,
    urgentFeePercent = 0,
    platformFeePercent = 0,
    currentUrgentFeePercent,
    discountPercent = 0,
    taxPercent = 0
  } = workOrder;

  // 긴급 수수료 계산 (현재 비율이 있으면 사용, 없으면 기본 비율 사용)
  const actualUrgentFeePercent = currentUrgentFeePercent || urgentFeePercent;
  const urgentFee = baseFee * (actualUrgentFeePercent / 100);
  
  // 할인 계산
  const discountAmount = baseFee * (discountPercent / 100);
  const discountedBaseFee = baseFee - discountAmount;
  
  // 총 시공비 (할인 적용 후 + 긴급 수수료)
  const totalFee = discountedBaseFee + urgentFee;
  
  // 플랫폼 수수료 계산
  const platformFee = totalFee * (platformFeePercent / 100);
  
  // 세금 계산
  const taxAmount = totalFee * (taxPercent / 100);
  
  // 작업자 지급액 (총 시공비 - 플랫폼 수수료)
  const workerPayment = totalFee - platformFee;
  
  // 고객 총 결제액 (총 시공비 + 세금)
  const customerTotalPayment = totalFee + taxAmount;

  return {
    // 기본 정보
    baseFee,
    discountedBaseFee,
    discountAmount,
    discountPercent,
    
    // 긴급 수수료
    urgentFee,
    urgentFeePercent: actualUrgentFeePercent,
    
    // 총액
    totalFee,
    customerTotalPayment,
    
    // 수수료
    platformFee,
    platformFeePercent,
    taxAmount,
    taxPercent,
    
    // 지급액
    workerPayment,
    
    // 계산 세부사항
    breakdown: {
      baseFee,
      discount: {
        percent: discountPercent,
        amount: discountAmount
      },
      urgentFee: {
        percent: actualUrgentFeePercent,
        amount: urgentFee
      },
      platformFee: {
        percent: platformFeePercent,
        amount: platformFee
      },
      tax: {
        percent: taxPercent,
        amount: taxAmount
      }
    }
  };
}

/**
 * 긴급 수수료 동적 계산 함수
 * @param {WorkOrder} workOrder - 작업 주문 정보
 * @param {number} hoursSinceCreation - 생성 후 경과 시간 (시간)
 * @param {number} maxUrgentFeePercent - 최대 긴급 수수료 비율 (기본값: 50)
 * @param {number} increaseInterval - 증가 간격 (시간, 기본값: 1)
 * @param {number} increaseAmount - 증가량 (%, 기본값: 5)
 * @returns {number} 계산된 긴급 수수료 비율
 */
export function calculateDynamicUrgentFee(
  workOrder,
  hoursSinceCreation,
  maxUrgentFeePercent = 50,
  increaseInterval = 1,
  increaseAmount = 5
) {
  const baseUrgentFeePercent = workOrder.urgentFeePercent || 0;
  
  if (hoursSinceCreation <= 0) {
    return baseUrgentFeePercent;
  }

  // 증가 횟수 계산
  const increaseCount = Math.floor(hoursSinceCreation / increaseInterval);
  const calculatedIncrease = increaseCount * increaseAmount;
  
  // 최대 비율을 초과하지 않도록 제한
  const newUrgentFeePercent = Math.min(
    baseUrgentFeePercent + calculatedIncrease,
    maxUrgentFeePercent
  );

  return newUrgentFeePercent;
}

/**
 * 작업자 등급별 수수료 계산
 * @param {WorkOrder} workOrder - 작업 주문 정보
 * @param {Object} workerGrade - 작업자 등급 정보
 * @returns {Object} 등급별 수수료 정보
 */
export function calculateGradeBasedFees(workOrder, workerGrade) {
  const baseCalculation = calculatePayment(workOrder);
  
  // 등급별 수수료 조정
  const gradeMultiplier = getGradeMultiplier(workerGrade.level);
  const adjustedPlatformFee = baseCalculation.platformFee * gradeMultiplier;
  const adjustedWorkerPayment = baseCalculation.totalFee - adjustedPlatformFee;

  return {
    ...baseCalculation,
    platformFee: adjustedPlatformFee,
    workerPayment: adjustedWorkerPayment,
    gradeInfo: {
      level: workerGrade.level,
      name: workerGrade.name,
      multiplier: gradeMultiplier
    }
  };
}

/**
 * 등급별 수수료 배율 반환
 * @param {number} gradeLevel - 등급 레벨 (1-5)
 * @returns {number} 수수료 배율
 */
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

/**
 * 결제 정보 포맷팅
 * @param {Object} paymentInfo - 결제 정보
 * @param {string} locale - 로케일 (기본값: 'ko-KR')
 * @returns {Object} 포맷된 결제 정보
 */
export function formatPaymentInfo(paymentInfo, locale = 'ko-KR') {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'KRW'
  });

  return {
    ...paymentInfo,
    formatted: {
      baseFee: formatter.format(paymentInfo.baseFee),
      urgentFee: formatter.format(paymentInfo.urgentFee),
      totalFee: formatter.format(paymentInfo.totalFee),
      platformFee: formatter.format(paymentInfo.platformFee),
      workerPayment: formatter.format(paymentInfo.workerPayment),
      customerTotalPayment: formatter.format(paymentInfo.customerTotalPayment),
      taxAmount: formatter.format(paymentInfo.taxAmount),
      discountAmount: formatter.format(paymentInfo.discountAmount)
    }
  };
}

/**
 * 결제 검증 함수
 * @param {WorkOrder} workOrder - 작업 주문 정보
 * @returns {Object} 검증 결과
 */
export function validateWorkOrderPayment(workOrder) {
  const errors = [];
  const warnings = [];

  // 기본 검증
  if (!workOrder.baseFee || workOrder.baseFee <= 0) {
    errors.push('기본 시공비는 0보다 커야 합니다.');
  }

  if (workOrder.urgentFeePercent < 0 || workOrder.urgentFeePercent > 100) {
    errors.push('긴급 수수료 비율은 0-100% 사이여야 합니다.');
  }

  if (workOrder.platformFeePercent < 0 || workOrder.platformFeePercent > 50) {
    errors.push('플랫폼 수수료 비율은 0-50% 사이여야 합니다.');
  }

  // 경고 사항
  if (workOrder.urgentFeePercent > 30) {
    warnings.push('긴급 수수료가 30%를 초과합니다. 고객 확인이 필요할 수 있습니다.');
  }

  if (workOrder.platformFeePercent > 20) {
    warnings.push('플랫폼 수수료가 20%를 초과합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 결제 내역 생성 함수
 * @param {WorkOrder} workOrder - 작업 주문 정보
 * @param {string} workerId - 작업자 ID
 * @param {string} customerId - 고객 ID
 * @returns {Object} 결제 내역 객체
 */
export function createPaymentRecord(workOrder, workerId, customerId) {
  const paymentInfo = calculatePayment(workOrder);
  const validation = validateWorkOrderPayment(workOrder);

  return {
    workOrderId: workOrder.id,
    workerId,
    customerId,
    paymentInfo,
    validation,
    calculatedAt: new Date(),
    status: 'calculated'
  };
}

/**
 * 예상 수익 계산 함수 (플랫폼용)
 * @param {Array} workOrders - 작업 주문 배열
 * @param {string} period - 기간 ('daily', 'weekly', 'monthly')
 * @returns {Object} 수익 분석
 */
export function calculatePlatformRevenue(workOrders, period = 'monthly') {
  const now = new Date();
  const periodStart = getPeriodStart(now, period);
  
  const filteredOrders = workOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= periodStart;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => {
    const payment = calculatePayment(order);
    return sum + payment.platformFee;
  }, 0);

  const totalOrders = filteredOrders.length;
  const averageRevenue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    period,
    totalRevenue,
    totalOrders,
    averageRevenue,
    periodStart,
    periodEnd: now,
    breakdown: {
      byStatus: groupByStatus(filteredOrders),
      byUrgentFee: groupByUrgentFee(filteredOrders)
    }
  };
}

/**
 * 기간 시작일 계산
 * @param {Date} date - 기준 날짜
 * @param {string} period - 기간
 * @returns {Date} 기간 시작일
 */
function getPeriodStart(date, period) {
  const start = new Date(date);
  
  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  
  return start;
}

/**
 * 상태별 그룹화
 * @param {Array} orders - 작업 주문 배열
 * @returns {Object} 상태별 통계
 */
function groupByStatus(orders) {
  return orders.reduce((acc, order) => {
    const status = order.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

/**
 * 긴급 수수료별 그룹화
 * @param {Array} orders - 작업 주문 배열
 * @returns {Object} 긴급 수수료별 통계
 */
function groupByUrgentFee(orders) {
  return orders.reduce((acc, order) => {
    const urgentFee = order.urgentFeePercent || 0;
    const range = urgentFee === 0 ? '0%' :
                  urgentFee <= 10 ? '1-10%' :
                  urgentFee <= 20 ? '11-20%' :
                  urgentFee <= 30 ? '21-30%' : '30%+';
    
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {});
} 