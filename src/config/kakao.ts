// 카카오 API 설정
export const KAKAO_CONFIG = {
  // 실제 카카오 API 키로 교체하세요
  API_KEY: process.env.REACT_APP_KAKAO_API_KEY || 'YOUR_KAKAO_API_KEY_HERE',
  
  // API 엔드포인트
  ADDRESS_SEARCH_URL: 'https://dapi.kakao.com/v2/local/search/address.json',
  KEYWORD_SEARCH_URL: 'https://dapi.kakao.com/v2/local/search/keyword.json',
  
  // 지도 설정
  MAP_OPTIONS: {
    center: { lat: 37.5665, lng: 126.9780 }, // 서울 시청
    level: 3
  }
};

// 카카오페이 설정
export const KAKAO_PAY_CONFIG = {
  // 실제 카카오페이 API 키로 교체하세요
  ADMIN_KEY: process.env.REACT_APP_KAKAO_PAY_ADMIN_KEY || 'YOUR_KAKAO_PAY_ADMIN_KEY_HERE',
  
  // 카카오페이 API 엔드포인트
  READY_URL: 'https://kapi.kakao.com/v1/payment/ready',
  APPROVE_URL: 'https://kapi.kakao.com/v1/payment/approve',
  CANCEL_URL: 'https://kapi.kakao.com/v1/payment/cancel',
  
  // 결제 설정
  PARTNER_ORDER_ID: 'construction_platform',
  PARTNER_USER_ID: 'construction_user',
  
  // 리다이렉트 URL (실제 도메인으로 변경 필요)
  REDIRECT_URL: process.env.REACT_APP_KAKAO_PAY_REDIRECT_URL || 'http://localhost:3000/seller/payment-complete'
};

// 카카오 API 키가 설정되었는지 확인
export const isKakaoApiKeySet = () => {
  return KAKAO_CONFIG.API_KEY !== 'YOUR_KAKAO_API_KEY_HERE';
};
