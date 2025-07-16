/**
 * 광고주 데이터 유효성 검사
 * @param {Object} advertiserData - 검사할 광고주 데이터
 * @returns {Object} 검사 결과 { isValid: boolean, errors: Array }
 */
export const validateAdvertiserData = (advertiserData) => {
  const errors = [];

  // 필수 필드 검사
  if (!advertiserData.name || advertiserData.name.trim() === '') {
    errors.push('담당자명은 필수입니다.');
  }

  if (!advertiserData.contactEmail || advertiserData.contactEmail.trim() === '') {
    errors.push('연락처 이메일은 필수입니다.');
  } else if (!isValidEmail(advertiserData.contactEmail)) {
    errors.push('올바른 이메일 형식을 입력해주세요.');
  }

  if (!advertiserData.phone || advertiserData.phone.trim() === '') {
    errors.push('전화번호는 필수입니다.');
  } else if (!isValidPhone(advertiserData.phone)) {
    errors.push('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
  }

  // 선택적 필드 검사
  if (advertiserData.businessNumber && !isValidBusinessNumber(advertiserData.businessNumber)) {
    errors.push('올바른 사업자등록번호 형식을 입력해주세요. (예: 123-45-67890)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 이메일 형식 검사
 * @param {string} email - 검사할 이메일
 * @returns {boolean} 유효성 여부
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 전화번호 형식 검사
 * @param {string} phone - 검사할 전화번호
 * @returns {boolean} 유효성 여부
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * 사업자등록번호 형식 검사
 * @param {string} businessNumber - 검사할 사업자등록번호
 * @returns {boolean} 유효성 여부
 */
export const isValidBusinessNumber = (businessNumber) => {
  const businessNumberRegex = /^\d{3}-\d{2}-\d{5}$/;
  return businessNumberRegex.test(businessNumber);
};

/**
 * 광고주 상태 텍스트 변환
 * @param {string} status - 상태 코드
 * @returns {string} 상태 텍스트
 */
export const getAdvertiserStatusText = (status) => {
  const statusMap = {
    'active': '활성',
    'inactive': '비활성',
    'pending': '대기중',
    'suspended': '정지'
  };
  return statusMap[status] || status;
};

/**
 * 광고주 상태 색상 클래스 반환
 * @param {string} status - 상태 코드
 * @returns {string} Tailwind CSS 클래스
 */
export const getAdvertiserStatusColor = (status) => {
  const colorMap = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-red-100 text-red-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'suspended': 'bg-gray-100 text-gray-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * 광고주 데이터 포맷팅
 * @param {Object} advertiser - 광고주 데이터
 * @returns {Object} 포맷된 데이터
 */
export const formatAdvertiserData = (advertiser) => {
  return {
    ...advertiser,
    displayName: advertiser.companyName || advertiser.name,
    displayContact: `${advertiser.contactEmail} | ${advertiser.phone}`,
    statusText: getAdvertiserStatusText(advertiser.status),
    statusColor: getAdvertiserStatusColor(advertiser.status),
    createdAt: advertiser.createdAt?.toDate?.() || advertiser.createdAt,
    updatedAt: advertiser.updatedAt?.toDate?.() || advertiser.updatedAt
  };
};

/**
 * 광고주 검색 필터링
 * @param {Array} advertisers - 광고주 목록
 * @param {string} searchTerm - 검색어
 * @returns {Array} 필터링된 목록
 */
export const filterAdvertisers = (advertisers, searchTerm) => {
  if (!searchTerm) return advertisers;
  
  const term = searchTerm.toLowerCase();
  return advertisers.filter(advertiser => 
    advertiser.name?.toLowerCase().includes(term) ||
    advertiser.companyName?.toLowerCase().includes(term) ||
    advertiser.contactEmail?.toLowerCase().includes(term) ||
    advertiser.phone?.includes(term) ||
    advertiser.businessNumber?.includes(term)
  );
};

/**
 * 광고주 데이터 정렬
 * @param {Array} advertisers - 광고주 목록
 * @param {string} sortBy - 정렬 기준
 * @param {string} sortOrder - 정렬 순서 ('asc' | 'desc')
 * @returns {Array} 정렬된 목록
 */
export const sortAdvertisers = (advertisers, sortBy = 'createdAt', sortOrder = 'desc') => {
  return [...advertisers].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // 날짜 필드 처리
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = aValue?.toDate?.() || aValue;
      bValue = bValue?.toDate?.() || bValue;
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
 * 광고주 통계 계산
 * @param {Array} advertisers - 광고주 목록
 * @returns {Object} 통계 데이터
 */
export const calculateAdvertiserStats = (advertisers) => {
  const stats = {
    total: advertisers.length,
    active: 0,
    inactive: 0,
    pending: 0,
    suspended: 0,
    withCompanyName: 0,
    withBusinessNumber: 0
  };

  advertisers.forEach(advertiser => {
    stats[advertiser.status] = (stats[advertiser.status] || 0) + 1;
    if (advertiser.companyName) stats.withCompanyName++;
    if (advertiser.businessNumber) stats.withBusinessNumber++;
  });

  return stats;
}; 