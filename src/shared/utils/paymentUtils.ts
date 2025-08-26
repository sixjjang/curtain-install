import { PaymentService } from '../services/paymentService';

export interface PaymentMethodStatus {
  simulation: boolean;
  tossPayments: boolean;
}

export interface PaymentMethodInfo {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  isAvailable: boolean;
  setupRequired: boolean;
  setupGuide?: string;
}

/**
 * 사용 가능한 결제 수단 목록을 반환합니다.
 */
export const getAvailablePaymentMethods = (): PaymentMethodInfo[] => {
  const status = PaymentService.getAvailablePaymentMethods();
  
  return [
    {
      name: 'toss_payments',
      displayName: '토스페이먼츠 (수수료 0%)',
      description: '실시간계좌이체와 무통장입금으로 수수료 없이 안전하게 결제',
      icon: '🏦',
      isAvailable: status.tossPayments,
      setupRequired: !status.tossPayments,
      setupGuide: '토스페이먼츠 가맹점 등록 및 API 키 발급이 필요합니다.'
    }
  ];
};

/**
 * 결제 수단별 설정 상태를 확인합니다.
 */
export const checkPaymentSetupStatus = (): {
  isFullyConfigured: boolean;
  configuredMethods: string[];
  missingMethods: string[];
  setupGuide: string[];
} => {
  const methods = getAvailablePaymentMethods();
  const configuredMethods = methods.filter(m => m.isAvailable).map(m => m.name);
  const missingMethods = methods.filter(m => m.setupRequired).map(m => m.name);
  const setupGuide = methods.filter(m => m.setupRequired).map(m => m.setupGuide || '');
  
  return {
    isFullyConfigured: missingMethods.length === 0,
    configuredMethods,
    missingMethods,
    setupGuide: setupGuide.filter(guide => guide)
  };
};

/**
 * 결제 금액을 포맷팅합니다.
 */
export const formatPaymentAmount = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
};

/**
 * 결제 수수료를 계산합니다.
 */
export const calculatePaymentFee = (amount: number, paymentMethod: string): {
  originalAmount: number;
  feeAmount: number;
  finalAmount: number;
  feeRate: number;
} => {
  let feeRate = 0;
  
  switch (paymentMethod) {
    case 'toss_payments':
    case 'transfer':
    case 'virtual_account':
      feeRate = 0; // 실시간계좌이체, 무통장입금은 수수료 없음
      break;
    default:
      feeRate = 0;
  }
  
  const feeAmount = Math.round(amount * feeRate);
  const finalAmount = amount + feeAmount;
  
  return {
    originalAmount: amount,
    feeAmount,
    finalAmount,
    feeRate
  };
};

/**
 * 결제 상태를 한글로 변환합니다.
 */
export const getPaymentStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return '처리 중';
    case 'completed':
      return '완료';
    case 'failed':
      return '실패';
    case 'cancelled':
      return '취소됨';
    default:
      return '알 수 없음';
  }
};

/**
 * 결제 수단별 설명을 반환합니다.
 */
export const getPaymentMethodDescription = (method: string): string => {
  switch (method) {
    case 'toss_payments':
      return '토스페이먼츠 (실시간계좌이체/무통장입금)';
    case 'transfer':
      return '실시간계좌이체';
    case 'virtual_account':
      return '무통장입금';
    default:
      return '알 수 없는 결제 수단';
  }
};

/**
 * 결제 수단이 사용 가능한지 확인합니다.
 */
export const isPaymentMethodAvailable = (method: string): boolean => {
  const availableMethods = PaymentService.getAvailablePaymentMethods();
  
  switch (method) {
    case 'toss_payments':
      return availableMethods.tossPayments;
    default:
      return false;
  }
};
