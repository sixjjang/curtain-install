/**
 * 짧고 간결한 ID 생성 유틸리티
 */

/**
 * 작업주문 ID 생성
 * 형식: WO + 연도(2자리) + 월(2자리) + 일(2자리) + 순번(3자리)
 * 예: WO241201001, WO241201002
 * @returns {string} 생성된 작업주문 ID
 */
export const generateWorkOrderId = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // 24
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 01-12
  const day = now.getDate().toString().padStart(2, '0'); // 01-31
  
  // 오늘 날짜의 순번을 가져오기 위해 Firestore에서 확인
  // 실제 구현에서는 Firestore에서 오늘 날짜의 마지막 순번을 조회해야 함
  const sequence = Math.floor(Math.random() * 999) + 1; // 임시로 랜덤 사용
  
  return `WO${year}${month}${day}${sequence.toString().padStart(3, '0')}`;
};

/**
 * 견적 ID 생성
 * 형식: ES + 연도(2자리) + 월(2자리) + 일(2자리) + 순번(3자리)
 * 예: ES241201001, ES241201002
 * @returns {string} 생성된 견적 ID
 */
export const generateEstimateId = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  const sequence = Math.floor(Math.random() * 999) + 1;
  
  return `ES${year}${month}${day}${sequence.toString().padStart(3, '0')}`;
};

/**
 * 프로젝트 ID 생성
 * 형식: PR + 연도(2자리) + 월(2자리) + 일(2자리) + 순번(3자리)
 * 예: PR241201001, PR241201002
 * @returns {string} 생성된 프로젝트 ID
 */
export const generateProjectId = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  const sequence = Math.floor(Math.random() * 999) + 1;
  
  return `PR${year}${month}${day}${sequence.toString().padStart(3, '0')}`;
};

/**
 * 결제 ID 생성
 * 형식: PY + 연도(2자리) + 월(2자리) + 일(2자리) + 순번(3자리)
 * 예: PY241201001, PY241201002
 * @returns {string} 생성된 결제 ID
 */
export const generatePaymentId = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  const sequence = Math.floor(Math.random() * 999) + 1;
  
  return `PY${year}${month}${day}${sequence.toString().padStart(3, '0')}`;
};

/**
 * 통신 채널 ID 생성
 * 형식: CH + 연도(2자리) + 월(2자리) + 일(2자리) + 순번(3자리)
 * 예: CH241201001, CH241201002
 * @returns {string} 생성된 통신 채널 ID
 */
export const generateChannelId = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  const sequence = Math.floor(Math.random() * 999) + 1;
  
  return `CH${year}${month}${day}${sequence.toString().padStart(3, '0')}`;
};

/**
 * ID에서 날짜 정보 추출
 * @param {string} id - 생성된 ID
 * @returns {Object} 날짜 정보 {year, month, day, sequence}
 */
export const parseIdDate = (id) => {
  if (!id || id.length < 9) return null;
  
  const year = parseInt(id.slice(2, 4));
  const month = parseInt(id.slice(4, 6));
  const day = parseInt(id.slice(6, 8));
  const sequence = parseInt(id.slice(8, 11));
  
  return { year, month, day, sequence };
};

/**
 * ID 유효성 검사
 * @param {string} id - 검사할 ID
 * @param {string} type - ID 타입 ('WO', 'ES', 'PR', 'PY', 'CH')
 * @returns {boolean} 유효성 여부
 */
export const validateId = (id, type) => {
  if (!id || typeof id !== 'string') return false;
  
  // 형식 검사: 타입 + 8자리 숫자
  const pattern = new RegExp(`^${type}\\d{8}$`);
  if (!pattern.test(id)) return false;
  
  // 날짜 유효성 검사
  const dateInfo = parseIdDate(id);
  if (!dateInfo) return false;
  
  const { year, month, day } = dateInfo;
  const currentYear = new Date().getFullYear() % 100;
  
  // 연도는 현재 연도보다 클 수 없음
  if (year > currentYear) return false;
  
  // 월은 1-12 사이
  if (month < 1 || month > 12) return false;
  
  // 일은 1-31 사이
  if (day < 1 || day > 31) return false;
  
  return true;
};

/**
 * ID 타입별 설명
 */
export const ID_TYPES = {
  WO: '작업주문',
  ES: '견적',
  PR: '프로젝트',
  PY: '결제',
  CH: '통신채널'
};

/**
 * ID 타입별 설명 가져오기
 * @param {string} id - ID
 * @returns {string} 타입 설명
 */
export const getTypeDescription = (id) => {
  if (!id || id.length < 2) return '알 수 없음';
  
  const type = id.slice(0, 2);
  return ID_TYPES[type] || '알 수 없음';
}; 