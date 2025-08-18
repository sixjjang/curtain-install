// 토스페이먼츠 API 설정
export const TOSS_PAYMENTS_CONFIG = {
  // 실제 토스페이먼츠 API 키로 교체하세요
  SECRET_KEY: process.env.REACT_APP_TOSS_SECRET_KEY || 'YOUR_TOSS_SECRET_KEY_HERE',
  CLIENT_KEY: process.env.REACT_APP_TOSS_CLIENT_KEY || 'YOUR_TOSS_CLIENT_KEY_HERE',
  
  // 토스페이먼츠 API 엔드포인트
  PAYMENT_URL: 'https://api.tosspayments.com/v1/payments',
  CONFIRM_URL: 'https://api.tosspayments.com/v1/payments/confirm',
  CANCEL_URL: 'https://api.tosspayments.com/v1/payments/cancel',
  
  // 결제 설정
  SUCCESS_URL: process.env.REACT_APP_TOSS_SUCCESS_URL || 'http://localhost:3000/seller/payment-complete',
  FAIL_URL: process.env.REACT_APP_TOSS_FAIL_URL || 'http://localhost:3000/seller/payment-fail',
  
  // 지원하는 결제 수단
  PAYMENT_METHODS: {
    CARD: 'card',           // 신용카드
    TRANSFER: 'transfer',   // 계좌이체
    VIRTUAL_ACCOUNT: 'virtual_account', // 가상계좌
    PHONE: 'phone',         // 휴대폰 결제
    GIFT_CERTIFICATE: 'gift_certificate', // 상품권
    CULTURE_GIFT_CERTIFICATE: 'culture_gift_certificate' // 문화상품권
  }
};

// 토스페이먼츠 API 키가 설정되었는지 확인
export const isTossApiKeySet = () => {
  return TOSS_PAYMENTS_CONFIG.SECRET_KEY !== 'YOUR_TOSS_SECRET_KEY_HERE' &&
         TOSS_PAYMENTS_CONFIG.CLIENT_KEY !== 'YOUR_TOSS_CLIENT_KEY_HERE';
};
