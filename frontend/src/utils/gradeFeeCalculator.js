/**
 * 계약자 등급별 긴급 수수료 계산 유틸리티
 * 5단계 등급 시스템 (브론즈, 실버, 골드, 플래티넘, 다이아몬드)
 */

// 등급별 할인율 설정
const GRADE_DISCOUNT_RATES = {
  1: { name: '브론즈', discount: 0, color: 'gray' },
  2: { name: '실버', discount: 5, color: 'blue' },
  3: { name: '골드', discount: 10, color: 'green' },
  4: { name: '플래티넘', discount: 15, color: 'purple' },
  5: { name: '다이아몬드', discount: 20, color: 'yellow' }
};

// 긴급도별 기본 수수료율
const URGENCY_BASE_RATES = {
  'low': 5,      // 낮은 긴급도
  'medium': 10,  // 보통 긴급도
  'high': 15,    // 높은 긴급도
  'urgent': 25,  // 긴급
  'emergency': 35 // 비상
};

/**
 * 계약자 등급에 따른 긴급 수수료율 계산
 * @param {number} contractorLevel - 계약자 등급 (1-5)
 * @param {number} basePercent - 기본 긴급 수수료율
 * @returns {number} 할인이 적용된 긴급 수수료율
 */
export function calculateUrgentFeePercent(contractorLevel, basePercent) {
  // 등급 유효성 검사
  if (!contractorLevel || contractorLevel < 1 || contractorLevel > 5) {
    console.warn(`Invalid contractor level: ${contractorLevel}. Using level 1.`);
    contractorLevel = 1;
  }

  // 기본 수수료율 유효성 검사
  if (basePercent < 0 || basePercent > 100) {
    console.warn(`Invalid base percentage: ${basePercent}. Using 0.`);
    basePercent = 0;
  }

  // 등급별 할인율 가져오기
  const gradeInfo = GRADE_DISCOUNT_RATES[contractorLevel];
  const discount = gradeInfo ? gradeInfo.discount : 0;

  // 할인 적용 (최소 0% 보장)
  const finalPercent = Math.max(basePercent - discount, 0);
  
  return Math.round(finalPercent * 100) / 100; // 소수점 2자리까지 반올림
}

/**
 * 긴급도별 기본 수수료율 계산
 * @param {string} urgencyLevel - 긴급도 레벨
 * @param {number} contractorLevel - 계약자 등급
 * @returns {number} 최종 긴급 수수료율
 */
export function calculateUrgentFeeByLevel(urgencyLevel, contractorLevel) {
  const baseRate = URGENCY_BASE_RATES[urgencyLevel] || 0;
  return calculateUrgentFeePercent(contractorLevel, baseRate);
}

/**
 * 등급별 할인 정보 조회
 * @param {number} contractorLevel - 계약자 등급
 * @returns {object} 등급 정보 (이름, 할인율, 색상)
 */
export function getGradeInfo(contractorLevel) {
  return GRADE_DISCOUNT_RATES[contractorLevel] || GRADE_DISCOUNT_RATES[1];
}

/**
 * 모든 등급의 할인 정보 조회
 * @returns {object} 모든 등급 정보
 */
export function getAllGradeInfo() {
  return GRADE_DISCOUNT_RATES;
}

/**
 * 긴급도별 기본 수수료율 조회
 * @returns {object} 긴급도별 기본 수수료율
 */
export function getUrgencyBaseRates() {
  return URGENCY_BASE_RATES;
}

/**
 * 등급별 수수료 계산 예시 생성
 * @param {number} basePercent - 기본 수수료율
 * @returns {Array} 등급별 수수료 계산 결과
 */
export function generateGradeFeeExamples(basePercent) {
  return Object.keys(GRADE_DISCOUNT_RATES).map(level => {
    const levelNum = parseInt(level);
    const gradeInfo = GRADE_DISCOUNT_RATES[levelNum];
    const finalPercent = calculateUrgentFeePercent(levelNum, basePercent);
    
    return {
      level: levelNum,
      gradeName: gradeInfo.name,
      discount: gradeInfo.discount,
      color: gradeInfo.color,
      basePercent,
      finalPercent,
      savings: basePercent - finalPercent
    };
  });
}

/**
 * 긴급도별 모든 등급 수수료 계산
 * @returns {object} 긴급도별 등급 수수료 계산 결과
 */
export function generateUrgencyGradeFees() {
  const results = {};
  
  Object.keys(URGENCY_BASE_RATES).forEach(urgencyLevel => {
    results[urgencyLevel] = generateGradeFeeExamples(URGENCY_BASE_RATES[urgencyLevel]);
  });
  
  return results;
}

/**
 * 수수료 계산 결과를 포맷팅
 * @param {number} percent - 수수료율
 * @returns {string} 포맷팅된 수수료율 문자열
 */
export function formatFeePercent(percent) {
  return `${percent.toFixed(1)}%`;
}

/**
 * 할인 금액 계산
 * @param {number} totalAmount - 총 금액
 * @param {number} basePercent - 기본 수수료율
 * @param {number} finalPercent - 최종 수수료율
 * @returns {number} 할인 금액
 */
export function calculateDiscountAmount(totalAmount, basePercent, finalPercent) {
  const baseFee = (totalAmount * basePercent) / 100;
  const finalFee = (totalAmount * finalPercent) / 100;
  return baseFee - finalFee;
}

/**
 * 등급별 혜택 설명 생성
 * @param {number} contractorLevel - 계약자 등급
 * @returns {string} 등급별 혜택 설명
 */
export function getGradeBenefitDescription(contractorLevel) {
  const gradeInfo = getGradeInfo(contractorLevel);
  
  if (gradeInfo.discount === 0) {
    return `${gradeInfo.name} 등급: 기본 긴급 수수료율 적용`;
  }
  
  return `${gradeInfo.name} 등급: 긴급 수수료 ${gradeInfo.discount}% 할인`;
}

/**
 * 등급 상승 시 예상 혜택 계산
 * @param {number} currentLevel - 현재 등급
 * @param {number} targetLevel - 목표 등급
 * @param {number} basePercent - 기본 수수료율
 * @returns {object} 등급 상승 혜택 정보
 */
export function calculateGradeUpgradeBenefit(currentLevel, targetLevel, basePercent) {
  if (targetLevel <= currentLevel) {
    return {
      upgrade: false,
      message: '목표 등급이 현재 등급보다 낮거나 같습니다.'
    };
  }

  const currentFee = calculateUrgentFeePercent(currentLevel, basePercent);
  const targetFee = calculateUrgentFeePercent(targetLevel, basePercent);
  const additionalDiscount = currentFee - targetFee;

  return {
    upgrade: true,
    currentLevel,
    targetLevel,
    currentGradeName: getGradeInfo(currentLevel).name,
    targetGradeName: getGradeInfo(targetLevel).name,
    currentFee,
    targetFee,
    additionalDiscount,
    additionalDiscountPercent: ((additionalDiscount / basePercent) * 100).toFixed(1)
  };
}

/**
 * 등급별 수수료 비교 테이블 생성
 * @param {number} basePercent - 기본 수수료율
 * @returns {Array} 비교 테이블 데이터
 */
export function generateComparisonTable(basePercent) {
  return Object.keys(GRADE_DISCOUNT_RATES).map(level => {
    const levelNum = parseInt(level);
    const gradeInfo = GRADE_DISCOUNT_RATES[levelNum];
    const finalPercent = calculateUrgentFeePercent(levelNum, basePercent);
    
    return {
      level: levelNum,
      gradeName: gradeInfo.name,
      discount: gradeInfo.discount,
      color: gradeInfo.color,
      basePercent,
      finalPercent,
      savings: basePercent - finalPercent,
      savingsPercent: ((gradeInfo.discount / basePercent) * 100).toFixed(1)
    };
  });
}

/**
 * 등급별 수수료 계산기 (고급 기능)
 * @param {object} options - 계산 옵션
 * @returns {object} 계산 결과
 */
export function advancedGradeFeeCalculator(options = {}) {
  const {
    contractorLevel = 1,
    basePercent = 10,
    totalAmount = 0,
    urgencyLevel = 'medium',
    includeBreakdown = true
  } = options;

  // 기본 수수료율 결정
  const actualBasePercent = urgencyLevel ? URGENCY_BASE_RATES[urgencyLevel] || basePercent : basePercent;
  
  // 최종 수수료율 계산
  const finalPercent = calculateUrgentFeePercent(contractorLevel, actualBasePercent);
  
  // 기본 결과
  const result = {
    contractorLevel,
    gradeInfo: getGradeInfo(contractorLevel),
    basePercent: actualBasePercent,
    finalPercent,
    discount: actualBasePercent - finalPercent,
    urgencyLevel
  };

  // 상세 분석 포함
  if (includeBreakdown) {
    result.breakdown = {
      baseFee: totalAmount > 0 ? (totalAmount * actualBasePercent) / 100 : 0,
      finalFee: totalAmount > 0 ? (totalAmount * finalPercent) / 100 : 0,
      discountAmount: totalAmount > 0 ? (totalAmount * (actualBasePercent - finalPercent)) / 100 : 0,
      savingsPercent: actualBasePercent > 0 ? ((actualBasePercent - finalPercent) / actualBasePercent * 100).toFixed(1) : 0
    };
  }

  // 등급별 비교 정보
  result.comparison = generateGradeFeeExamples(actualBasePercent);

  return result;
}

// 기본 내보내기
export default {
  calculateUrgentFeePercent,
  calculateUrgentFeeByLevel,
  getGradeInfo,
  getAllGradeInfo,
  getUrgencyBaseRates,
  generateGradeFeeExamples,
  generateUrgencyGradeFees,
  formatFeePercent,
  calculateDiscountAmount,
  getGradeBenefitDescription,
  calculateGradeUpgradeBenefit,
  generateComparisonTable,
  advancedGradeFeeCalculator
}; 