/**
 * 고객용 평가 링크 생성 유틸리티
 */

/**
 * 평가 링크 생성
 * @param {string} workOrderId - 작업 주문 ID
 * @param {string} baseUrl - 기본 URL (선택사항)
 * @returns {string} 평가 링크
 */
export const generateReviewLink = (workOrderId, baseUrl = null) => {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com');
  return `${base}/customer-review/${workOrderId}`;
};

/**
 * QR 코드용 평가 링크 생성
 * @param {string} workOrderId - 작업 주문 ID
 * @param {string} baseUrl - 기본 URL (선택사항)
 * @returns {string} QR 코드용 평가 링크
 */
export const generateQRReviewLink = (workOrderId, baseUrl = null) => {
  return generateReviewLink(workOrderId, baseUrl);
};

/**
 * SMS용 평가 링크 생성 (단축 URL 포함)
 * @param {string} workOrderId - 작업 주문 ID
 * @param {string} baseUrl - 기본 URL (선택사항)
 * @returns {Object} SMS용 링크 정보
 */
export const generateSMSReviewLink = (workOrderId, baseUrl = null) => {
  const fullLink = generateReviewLink(workOrderId, baseUrl);
  
  return {
    fullLink,
    shortLink: fullLink, // 실제로는 URL 단축 서비스 사용
    smsText: `시공 완료 평가를 부탁드립니다.\n${fullLink}\n\nInstall - 전문 시공 매칭`
  };
};

/**
 * 이메일용 평가 링크 생성
 * @param {string} workOrderId - 작업 주문 ID
 * @param {string} customerName - 고객명
 * @param {string} baseUrl - 기본 URL (선택사항)
 * @returns {Object} 이메일용 링크 정보
 */
export const generateEmailReviewLink = (workOrderId, customerName, baseUrl = null) => {
  const fullLink = generateReviewLink(workOrderId, baseUrl);
  
  return {
    fullLink,
    subject: '[Install] 시공 완료 평가를 부탁드립니다',
    body: `
안녕하세요, ${customerName}님

커튼 설치가 완료되어 소중한 평가를 부탁드립니다.

평가 링크: ${fullLink}

평가를 통해 더 나은 서비스를 제공할 수 있도록 노력하겠습니다.

감사합니다.
Install - 전문 시공 매칭
    `.trim()
  };
};

/**
 * 평가 링크 유효성 검사
 * @param {string} link - 검사할 링크
 * @returns {boolean} 유효한 링크 여부
 */
export const isValidReviewLink = (link) => {
  if (!link) return false;
  
  // 기본적인 URL 형식 검사
  try {
    const url = new URL(link);
    return url.pathname.includes('/customer-review/');
  } catch {
    return false;
  }
};

/**
 * 링크에서 작업 주문 ID 추출
 * @param {string} link - 평가 링크
 * @returns {string|null} 작업 주문 ID
 */
export const extractWorkOrderIdFromLink = (link) => {
  if (!isValidReviewLink(link)) return null;
  
  try {
    const url = new URL(link);
    const pathParts = url.pathname.split('/');
    const reviewIndex = pathParts.indexOf('customer-review');
    
    if (reviewIndex !== -1 && pathParts[reviewIndex + 1]) {
      return pathParts[reviewIndex + 1];
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * 평가 링크 통계 정보 생성
 * @param {string} workOrderId - 작업 주문 ID
 * @returns {Object} 링크 통계 정보
 */
export const generateReviewLinkStats = (workOrderId) => {
  const timestamp = Date.now();
  
  return {
    workOrderId,
    linkGeneratedAt: timestamp,
    linkExpiresAt: timestamp + (30 * 24 * 60 * 60 * 1000), // 30일 후 만료
    maxUses: 1, // 한 번만 사용 가능
    currentUses: 0,
    isActive: true
  };
};

/**
 * 평가 링크 만료 여부 확인
 * @param {Object} linkStats - 링크 통계 정보
 * @returns {boolean} 만료 여부
 */
export const isReviewLinkExpired = (linkStats) => {
  if (!linkStats) return true;
  
  const now = Date.now();
  return now > linkStats.linkExpiresAt || 
         linkStats.currentUses >= linkStats.maxUses || 
         !linkStats.isActive;
};

/**
 * 평가 링크 사용 기록
 * @param {Object} linkStats - 링크 통계 정보
 * @returns {Object} 업데이트된 링크 통계
 */
export const markReviewLinkAsUsed = (linkStats) => {
  if (!linkStats) return null;
  
  return {
    ...linkStats,
    currentUses: linkStats.currentUses + 1,
    lastUsedAt: Date.now(),
    isActive: linkStats.currentUses + 1 < linkStats.maxUses
  };
}; 