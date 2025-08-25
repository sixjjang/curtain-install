import { PaymentService } from '../services/paymentService';

export interface PaymentMethodStatus {
  simulation: boolean;
  tossPayments: boolean;
  kakaoPay: boolean;
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
      name: 'simulation',
      displayName: '시뮬레이션 (테스트)',
      description: '실제 결제 없이 테스트할 수 있는 모드입니다.',
      icon: '🧪',
      isAvailable: status.simulation,
      setupRequired: false
    },
    {
      name: 'kakao_pay',
      displayName: '카카오페이',
      description: '카카오페이를 통한 안전한 결제입니다.',
      icon: '💛',
      isAvailable: status.kakaoPay,
      setupRequired: !status.kakaoPay,
      setupGuide: '카카오페이 비즈니스 계정 설정 및 API 키 발급이 필요합니다.'
    },
    {
      name: 'toss_payments',
      displayName: '토스페이먼츠',
      description: '토스페이먼츠를 통한 다양한 결제 수단을 지원합니다.',
      icon: '💳',
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
    case 'kakao_pay':
      feeRate = 0.03; // 3%
      break;
    case 'toss_payments':
      feeRate = 0.03; // 3%
      break;
    case 'simulation':
      feeRate = 0; // 수수료 없음
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
      return '결제 대기중';
    case 'completed':
      return '결제 완료';
    case 'failed':
      return '결제 실패';
    case 'cancelled':
      return '결제 취소';
    default:
      return '알 수 없음';
  }
};

/**
 * 결제 수단을 한글로 변환합니다.
 */
export const getPaymentMethodText = (method: string): string => {
  switch (method) {
    case 'simulation':
      return '시뮬레이션';
    case 'kakao_pay':
      return '카카오페이';
    case 'toss_payments':
      return '토스페이먼츠';
    default:
      return '알 수 없음';
  }
};

/**
 * 결제 수단별 아이콘을 반환합니다.
 */
export const getPaymentMethodIcon = (method: string): string => {
  switch (method) {
    case 'simulation':
      return '🧪';
    case 'kakao_pay':
      return '💛';
    case 'toss_payments':
      return '💳';
    default:
      return '💰';
  }
};

/**
 * 결제 수단별 색상을 반환합니다.
 */
export const getPaymentMethodColor = (method: string): string => {
  switch (method) {
    case 'simulation':
      return '#666666';
    case 'kakao_pay':
      return '#FEE500';
    case 'toss_payments':
      return '#0064FF';
    default:
      return '#000000';
  }
};

/**
 * 결제 검증을 수행합니다.
 */
export const validatePaymentRequest = (amount: number, paymentMethod: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // 금액 검증
  if (amount <= 0) {
    errors.push('결제 금액은 0보다 커야 합니다.');
  }
  
  if (amount > 1000000) {
    errors.push('결제 금액은 1,000,000원을 초과할 수 없습니다.');
  }
  
  // 결제 수단 검증
  const availableMethods = PaymentService.getAvailablePaymentMethods();
  
  switch (paymentMethod) {
    case 'kakao_pay':
      if (!availableMethods.kakaoPay) {
        errors.push('카카오페이가 설정되지 않았습니다.');
      }
      break;
    case 'toss_payments':
      if (!availableMethods.tossPayments) {
        errors.push('토스페이먼츠가 설정되지 않았습니다.');
      }
      break;
    case 'simulation':
      if (!availableMethods.simulation) {
        errors.push('시뮬레이션 모드가 사용할 수 없습니다.');
      }
      break;
    default:
      errors.push('지원하지 않는 결제 수단입니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
