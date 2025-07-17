/**
 * 작업 주문 결제 계산 유틸리티 (TypeScript)
 */

// 타입 정의
export interface WorkOrder {
  id?: string;
  baseFee: number;                    // 기본 시공비
  urgentFeePercent: number;           // 긴급 시공 수수료 비율 (예: 15)
  platformFeePercent: number;         // 플랫폼 수수료 비율 (예: 10)
  currentUrgentFeePercent?: number;   // 현재 긴급 수수료 비율 (동적 계산용)
  discountPercent?: number;           // 할인 비율 (예: 5)
  taxPercent?: number;                // 세금 비율 (예: 10)
  createdAt?: Date;                   // 생성 시간
  status?: string;                    // 상태
}

export interface WorkerGrade {
  level: number;                      // 등급 레벨 (1-5)
  name: string;                       // 등급명
  description?: string;               // 등급 설명
}

export interface PaymentInfo {
  // 기본 정보
  baseFee: number;
  discountedBaseFee: number;
  discountAmount: number;
  discountPercent: number;
  
  // 긴급 수수료
  urgentFee: number;
  urgentFeePercent: number;
  
  // 총액
  totalFee: number;
  customerTotalPayment: number;
  
  // 수수료
  platformFee: number;
  platformFeePercent: number;
  taxAmount: number;
  taxPercent: number;
  
  // 지급액
  workerPayment: number;
  
  // 등급 정보 (등급별 계산 시)
  gradeInfo?: {
    level: number;
    name: string;
    multiplier: number;
  };
  
  // 계산 세부사항
  breakdown: {
    baseFee: number;
    discount: {
      percent: number;
      amount: number;
    };
    urgentFee: {
      percent: number;
      amount: number;
    };
    platformFee: {
      percent: number;
      amount: number;
    };
    tax: {
      percent: number;
      amount: number;
    };
  };
}

export interface FormattedPaymentInfo extends PaymentInfo {
  formatted: {
    baseFee: string;
    urgentFee: string;
    totalFee: string;
    platformFee: string;
    workerPayment: string;
    customerTotalPayment: string;
    taxAmount: string;
    discountAmount: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PaymentRecord {
  workOrderId: string;
  workerId: string;
  customerId: string;
  paymentInfo: PaymentInfo;
  validation: ValidationResult;
  calculatedAt: Date;
  status: 'calculated' | 'pending' | 'completed' | 'failed';
}

export interface PlatformRevenue {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageRevenue: number;
  periodStart: Date;
  periodEnd: Date;
  breakdown: {
    byStatus: Record<string, number>;
    byUrgentFee: Record<string, number>;
  };
}

/**
 * 기본 결제 계산 함수
 */
export function calculatePayment(workOrder: WorkOrder): PaymentInfo {
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
 */
export function calculateDynamicUrgentFee(
  workOrder: WorkOrder,
  hoursSinceCreation: number,
  maxUrgentFeePercent: number = 50,
  increaseInterval: number = 1,
  increaseAmount: number = 5
): number {
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
 */
export function calculateGradeBasedFees(workOrder: WorkOrder, workerGrade: WorkerGrade): PaymentInfo {
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
 */
function getGradeMultiplier(gradeLevel: number): number {
  const multipliers: Record<number, number> = {
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
 */
export function formatPaymentInfo(paymentInfo: PaymentInfo, locale: string = 'ko-KR'): FormattedPaymentInfo {
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
 */
export function validateWorkOrderPayment(workOrder: WorkOrder): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

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
 */
export function createPaymentRecord(
  workOrder: WorkOrder, 
  workerId: string, 
  customerId: string
): PaymentRecord {
  const paymentInfo = calculatePayment(workOrder);
  const validation = validateWorkOrderPayment(workOrder);

  return {
    workOrderId: workOrder.id || '',
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
 */
export function calculatePlatformRevenue(
  workOrders: WorkOrder[], 
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
): PlatformRevenue {
  const now = new Date();
  const periodStart = getPeriodStart(now, period);
  
  const filteredOrders = workOrders.filter(order => {
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
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
 */
function getPeriodStart(date: Date, period: string): Date {
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
 */
function groupByStatus(orders: WorkOrder[]): Record<string, number> {
  return orders.reduce((acc, order) => {
    const status = order.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * 긴급 수수료별 그룹화
 */
function groupByUrgentFee(orders: WorkOrder[]): Record<string, number> {
  return orders.reduce((acc, order) => {
    const urgentFee = order.urgentFeePercent || 0;
    const range = urgentFee === 0 ? '0%' :
                  urgentFee <= 10 ? '1-10%' :
                  urgentFee <= 20 ? '11-20%' :
                  urgentFee <= 30 ? '21-30%' : '30%+';
    
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * 결제 계산 옵션
 */
export interface PaymentCalculationOptions {
  includeTax?: boolean;
  includeDiscount?: boolean;
  useDynamicUrgentFee?: boolean;
  maxUrgentFeePercent?: number;
  increaseInterval?: number;
  increaseAmount?: number;
}

/**
 * 고급 결제 계산 함수
 */
export function calculateAdvancedPayment(
  workOrder: WorkOrder, 
  workerGrade?: WorkerGrade,
  options: PaymentCalculationOptions = {}
): PaymentInfo {
  const {
    includeTax = true,
    includeDiscount = true,
    useDynamicUrgentFee = true,
    maxUrgentFeePercent = 50,
    increaseInterval = 1,
    increaseAmount = 5
  } = options;

  let modifiedWorkOrder = { ...workOrder };

  // 동적 긴급 수수료 계산
  if (useDynamicUrgentFee && workOrder.createdAt) {
    const hoursSinceCreation = (new Date().getTime() - new Date(workOrder.createdAt).getTime()) / (1000 * 60 * 60);
    const dynamicUrgentFee = calculateDynamicUrgentFee(
      workOrder, 
      hoursSinceCreation, 
      maxUrgentFeePercent, 
      increaseInterval, 
      increaseAmount
    );
    modifiedWorkOrder.currentUrgentFeePercent = dynamicUrgentFee;
  }

  // 세금 제외
  if (!includeTax) {
    modifiedWorkOrder.taxPercent = 0;
  }

  // 할인 제외
  if (!includeDiscount) {
    modifiedWorkOrder.discountPercent = 0;
  }

  // 등급별 계산 또는 기본 계산
  if (workerGrade) {
    return calculateGradeBasedFees(modifiedWorkOrder, workerGrade);
  } else {
    return calculatePayment(modifiedWorkOrder);
  }
} 