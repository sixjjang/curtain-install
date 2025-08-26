// 토스페이먼츠 설정
export const TOSS_PAYMENTS_CLIENT_KEY = process.env.REACT_APP_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
export const TOSS_PAYMENTS_SECRET_KEY = process.env.REACT_APP_TOSS_SECRET_KEY || 'test_sk_D4yKeq5bgrpKRd0JYbLVGX0lzW6Y';

// 은행 이체 시뮬레이션 모드 (개발/테스트 환경에서 사용)
export const ENABLE_BANK_TRANSFER_SIMULATION = process.env.REACT_APP_ENABLE_BANK_TRANSFER_SIMULATION === 'true' || process.env.NODE_ENV === 'development';

// 실제 은행 API 사용 여부
export const USE_REAL_BANK_API = process.env.REACT_APP_USE_REAL_BANK_API === 'true' && !ENABLE_BANK_TRANSFER_SIMULATION;

// 토스페이먼츠 API 엔드포인트
export const TOSS_PAYMENTS_CONFIG = {
  // 실제 토스페이먼츠 API 키로 교체하세요
  SECRET_KEY: process.env.REACT_APP_TOSS_SECRET_KEY || 'test_sk_D4yKeq5bgrpKRd0JYbLVGX0lzW6Y',
  CLIENT_KEY: process.env.REACT_APP_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq',
  
  // 토스페이먼츠 API 엔드포인트
  PAYMENT_URL: 'https://api.tosspayments.com/v1/payments',
  CONFIRM_URL: 'https://api.tosspayments.com/v1/payments/confirm',
  CANCEL_URL: 'https://api.tosspayments.com/v1/payments/cancel',
  
  // 결제 설정
  SUCCESS_URL: process.env.REACT_APP_TOSS_SUCCESS_URL || 'http://localhost:3000/seller/payment-complete',
  FAIL_URL: process.env.REACT_APP_TOSS_FAIL_URL || 'http://localhost:3000/seller/payment-fail',
  
  // 지원하는 결제 수단 (실시간계좌이체와 무통장입금만)
  PAYMENT_METHODS: {
    TRANSFER: 'transfer',   // 실시간계좌이체 (수수료 0%)
    VIRTUAL_ACCOUNT: 'virtual_account', // 무통장입금 (수수료 0%)
  },
  
  // 기본 결제 수단 (실시간계좌이체)
  DEFAULT_PAYMENT_METHOD: 'transfer',
  
  // 수수료 없는 결제 수단
  ZERO_FEE_METHODS: ['transfer', 'virtual_account'],
  
  // 지원하는 결제 수단 목록
  SUPPORTED_METHODS: ['transfer', 'virtual_account']
};

// 토스페이먼츠 API 키가 설정되었는지 확인
export const isTossApiKeySet = () => {
  // 개발 환경에서는 테스트 키도 허용
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // 프로덕션 환경에서는 실제 키가 설정되었는지 확인
  return TOSS_PAYMENTS_CONFIG.SECRET_KEY !== 'test_sk_D4yKeq5bgrpKRd0JYbLVGX0lzW6Y' &&
         TOSS_PAYMENTS_CONFIG.CLIENT_KEY !== 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
};
