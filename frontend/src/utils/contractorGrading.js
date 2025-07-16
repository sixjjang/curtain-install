/**
 * 계약자 등급 결정 유틸리티
 * 5단계 등급 시스템 (브론즈, 실버, 골드, 플래티넘, 다이아몬드)
 */

// 등급별 기준 설정
const GRADE_CRITERIA = {
  1: { // 브론즈
    name: '브론즈',
    color: 'gray',
    minCompletedJobs: 0,
    minAverageRating: 0,
    minPhotoQualityScore: 0,
    minResponseTime: 120, // 분
    minOnTimeRate: 0,
    minSatisfactionRate: 0,
    description: '기본 서비스 제공'
  },
  2: { // 실버
    name: '실버',
    color: 'blue',
    minCompletedJobs: 10,
    minAverageRating: 3.5,
    minPhotoQualityScore: 3.0,
    minResponseTime: 90,
    minOnTimeRate: 70,
    minSatisfactionRate: 70,
    description: '우선 매칭, 기본 혜택'
  },
  3: { // 골드
    name: '골드',
    color: 'green',
    minCompletedJobs: 25,
    minAverageRating: 4.0,
    minPhotoQualityScore: 4.0,
    minResponseTime: 60,
    minOnTimeRate: 80,
    minSatisfactionRate: 80,
    description: '프리미엄 매칭, 추가 혜택'
  },
  4: { // 플래티넘
    name: '플래티넘',
    color: 'purple',
    minCompletedJobs: 50,
    minAverageRating: 4.3,
    minPhotoQualityScore: 4.5,
    minResponseTime: 45,
    minOnTimeRate: 90,
    minSatisfactionRate: 85,
    description: 'VIP 매칭, 특별 혜택'
  },
  5: { // 다이아몬드
    name: '다이아몬드',
    color: 'yellow',
    minCompletedJobs: 100,
    minAverageRating: 4.5,
    minPhotoQualityScore: 4.8,
    minResponseTime: 30,
    minOnTimeRate: 95,
    minSatisfactionRate: 90,
    description: '최고 등급, 모든 혜택'
  }
};

// 가중치 설정
const WEIGHTS = {
  completedJobsCount: 0.25,
  averageRating: 0.30,
  photoQualityScore: 0.20,
  responseTime: 0.15,
  onTimeRate: 0.10
};

/**
 * 계약자 등급 결정 (기본 함수)
 * @param {Object} params - 계약자 데이터
 * @param {number} params.completedJobsCount - 완료 작업 수
 * @param {number} params.averageRating - 평균 평점
 * @param {number} params.photoQualityScore - 사진 품질 점수
 * @param {number} params.responseTime - 평균 응답 시간 (분)
 * @param {number} params.onTimeRate - 시간 준수율 (%)
 * @param {number} params.satisfactionRate - 고객 만족도 (%)
 * @returns {number} 등급 (1-5)
 */
export function determineContractorLevel({
  completedJobsCount = 0,
  averageRating = 0,
  photoQualityScore = 0,
  responseTime = 120,
  onTimeRate = 0,
  satisfactionRate = 0
}) {
  // 입력값 유효성 검사
  const validatedParams = validateInputs({
    completedJobsCount,
    averageRating,
    photoQualityScore,
    responseTime,
    onTimeRate,
    satisfactionRate
  });

  // 등급별 기준 충족 여부 확인
  for (let level = 5; level >= 1; level--) {
    const criteria = GRADE_CRITERIA[level];
    
    if (meetsGradeCriteria(validatedParams, criteria)) {
      return level;
    }
  }

  return 1; // 기본 등급
}

/**
 * 입력값 유효성 검사
 * @param {Object} params - 입력 파라미터
 * @returns {Object} 검증된 파라미터
 */
function validateInputs(params) {
  const {
    completedJobsCount,
    averageRating,
    photoQualityScore,
    responseTime,
    onTimeRate,
    satisfactionRate
  } = params;

  return {
    completedJobsCount: Math.max(0, Math.min(completedJobsCount, 1000)),
    averageRating: Math.max(0, Math.min(averageRating, 5)),
    photoQualityScore: Math.max(0, Math.min(photoQualityScore, 10)),
    responseTime: Math.max(1, Math.min(responseTime, 480)), // 1분-8시간
    onTimeRate: Math.max(0, Math.min(onTimeRate, 100)),
    satisfactionRate: Math.max(0, Math.min(satisfactionRate, 100))
  };
}

/**
 * 등급 기준 충족 여부 확인
 * @param {Object} params - 계약자 데이터
 * @param {Object} criteria - 등급 기준
 * @returns {boolean} 기준 충족 여부
 */
function meetsGradeCriteria(params, criteria) {
  return (
    params.completedJobsCount >= criteria.minCompletedJobs &&
    params.averageRating >= criteria.minAverageRating &&
    params.photoQualityScore >= criteria.minPhotoQualityScore &&
    params.responseTime <= criteria.minResponseTime &&
    params.onTimeRate >= criteria.minOnTimeRate &&
    params.satisfactionRate >= criteria.minSatisfactionRate
  );
}

/**
 * 가중 평점 계산
 * @param {Object} params - 계약자 데이터
 * @returns {number} 가중 평점 (0-100)
 */
export function calculateWeightedScore(params) {
  const validatedParams = validateInputs(params);
  
  // 응답 시간 점수 (빠를수록 높은 점수)
  const responseTimeScore = Math.max(0, 100 - (validatedParams.responseTime / 2));
  
  // 각 항목별 점수 계산
  const scores = {
    completedJobsCount: Math.min(100, (validatedParams.completedJobsCount / 100) * 100),
    averageRating: (validatedParams.averageRating / 5) * 100,
    photoQualityScore: (validatedParams.photoQualityScore / 10) * 100,
    responseTime: responseTimeScore,
    onTimeRate: validatedParams.onTimeRate
  };

  // 가중 평균 계산
  const weightedScore = Object.entries(WEIGHTS).reduce((total, [key, weight]) => {
    return total + (scores[key] * weight);
  }, 0);

  return Math.round(weightedScore * 100) / 100;
}

/**
 * 등급별 상세 분석
 * @param {Object} params - 계약자 데이터
 * @returns {Object} 상세 분석 결과
 */
export function analyzeContractorGrade(params) {
  const currentLevel = determineContractorLevel(params);
  const weightedScore = calculateWeightedScore(params);
  const validatedParams = validateInputs(params);

  const analysis = {
    currentLevel,
    currentGrade: GRADE_CRITERIA[currentLevel],
    weightedScore,
    nextLevel: currentLevel < 5 ? currentLevel + 1 : null,
    nextGrade: currentLevel < 5 ? GRADE_CRITERIA[currentLevel + 1] : null,
    requirements: {},
    improvements: [],
    strengths: [],
    weaknesses: []
  };

  // 다음 등급 요구사항 분석
  if (analysis.nextGrade) {
    analysis.requirements = {
      completedJobsCount: Math.max(0, analysis.nextGrade.minCompletedJobs - validatedParams.completedJobsCount),
      averageRating: Math.max(0, analysis.nextGrade.minAverageRating - validatedParams.averageRating),
      photoQualityScore: Math.max(0, analysis.nextGrade.minPhotoQualityScore - validatedParams.photoQualityScore),
      responseTime: Math.max(0, validatedParams.responseTime - analysis.nextGrade.minResponseTime),
      onTimeRate: Math.max(0, analysis.nextGrade.minOnTimeRate - validatedParams.onTimeRate),
      satisfactionRate: Math.max(0, analysis.nextGrade.minSatisfactionRate - validatedParams.satisfactionRate)
    };
  }

  // 강점 분석
  if (validatedParams.averageRating >= 4.5) {
    analysis.strengths.push('우수한 고객 만족도');
  }
  if (validatedParams.photoQualityScore >= 4.5) {
    analysis.strengths.push('높은 사진 품질');
  }
  if (validatedParams.responseTime <= 30) {
    analysis.strengths.push('빠른 응답 시간');
  }
  if (validatedParams.onTimeRate >= 95) {
    analysis.strengths.push('뛰어난 시간 준수율');
  }
  if (validatedParams.completedJobsCount >= 50) {
    analysis.strengths.push('풍부한 작업 경험');
  }

  // 개선점 분석
  if (validatedParams.averageRating < 4.0) {
    analysis.improvements.push('고객 만족도 향상 필요');
  }
  if (validatedParams.photoQualityScore < 4.0) {
    analysis.improvements.push('사진 품질 개선 필요');
  }
  if (validatedParams.responseTime > 60) {
    analysis.improvements.push('응답 시간 단축 필요');
  }
  if (validatedParams.onTimeRate < 80) {
    analysis.improvements.push('시간 준수율 향상 필요');
  }
  if (validatedParams.completedJobsCount < 25) {
    analysis.improvements.push('더 많은 작업 경험 필요');
  }

  return analysis;
}

/**
 * 등급별 혜택 정보 조회
 * @param {number} level - 등급
 * @returns {Object} 등급별 혜택 정보
 */
export function getGradeBenefits(level) {
  const gradeInfo = GRADE_CRITERIA[level];
  
  const benefits = {
    1: [
      { title: '기본 서비스', description: '플랫폼 기본 서비스 이용 가능' },
      { title: '기본 매칭', description: '일반적인 매칭 시스템 이용' }
    ],
    2: [
      { title: '우선 매칭', description: '일반 계약자보다 우선적으로 매칭' },
      { title: '기본 혜택', description: '기본 할인 및 혜택 제공' },
      { title: '프로필 강조', description: '검색 결과에서 프로필 강조 표시' }
    ],
    3: [
      { title: '프리미엄 매칭', description: '고품질 고객과 우선 매칭' },
      { title: '추가 혜택', description: '수수료 할인 및 추가 혜택' },
      { title: '전용 지원', description: '전용 고객 지원 서비스' },
      { title: '마케팅 지원', description: '프로모션 및 마케팅 지원' }
    ],
    4: [
      { title: 'VIP 매칭', description: '최고급 고객과 전용 매칭' },
      { title: '특별 혜택', description: '대폭 수수료 할인 및 특별 혜택' },
      { title: '우선 지원', description: '24시간 우선 고객 지원' },
      { title: '전용 마케팅', description: '전용 마케팅 캠페인 지원' },
      { title: '교육 프로그램', description: '전용 교육 및 트레이닝 프로그램' }
    ],
    5: [
      { title: '최고 등급', description: '플랫폼 최고 등급 혜택' },
      { title: '모든 혜택', description: '모든 등급의 혜택을 누릴 수 있음' },
      { title: '전용 매니저', description: '전용 계정 매니저 배정' },
      { title: '최우선 지원', description: '모든 지원에서 최우선 처리' },
      { title: '파트너십', description: '플랫폼 파트너십 기회' },
      { title: '수익 공유', description: '플랫폼 수익 공유 프로그램' }
    ]
  };

  return {
    level,
    gradeInfo,
    benefits: benefits[level] || benefits[1]
  };
}

/**
 * 등급 상승 예상 시기 계산
 * @param {Object} params - 현재 계약자 데이터
 * @param {Object} projections - 예상 개선 수치
 * @returns {Object} 등급 상승 예상 정보
 */
export function calculateGradeUpgradeProjection(params, projections = {}) {
  const analysis = analyzeContractorGrade(params);
  const currentLevel = analysis.currentLevel;
  
  if (currentLevel >= 5) {
    return {
      canUpgrade: false,
      message: '이미 최고 등급입니다.',
      currentLevel,
      nextLevel: null
    };
  }

  const nextLevel = currentLevel + 1;
  const nextGrade = GRADE_CRITERIA[nextLevel];
  const requirements = analysis.requirements;

  // 예상 개선 수치 적용
  const projectedParams = {
    ...params,
    completedJobsCount: params.completedJobsCount + (projections.completedJobsCount || 0),
    averageRating: Math.min(5, params.averageRating + (projections.averageRating || 0)),
    photoQualityScore: Math.min(10, params.photoQualityScore + (projections.photoQualityScore || 0)),
    responseTime: Math.max(1, params.responseTime - (projections.responseTime || 0)),
    onTimeRate: Math.min(100, params.onTimeRate + (projections.onTimeRate || 0)),
    satisfactionRate: Math.min(100, params.satisfactionRate + (projections.satisfactionRate || 0))
  };

  const projectedLevel = determineContractorLevel(projectedParams);
  const canUpgrade = projectedLevel >= nextLevel;

  // 예상 소요 시간 계산 (월 단위)
  const estimatedMonths = calculateEstimatedTime(requirements, projections);

  return {
    canUpgrade,
    currentLevel,
    nextLevel,
    nextGrade,
    requirements,
    projectedLevel,
    estimatedMonths,
    message: canUpgrade 
      ? `${nextGrade.name} 등급 달성 가능` 
      : `${nextGrade.name} 등급 달성을 위해 추가 개선 필요`
  };
}

/**
 * 등급 상승 예상 시간 계산
 * @param {Object} requirements - 요구사항
 * @param {Object} projections - 예상 개선 수치
 * @returns {number} 예상 소요 월수
 */
function calculateEstimatedTime(requirements, projections) {
  if (!projections || Object.keys(projections).length === 0) {
    return null; // 예상 수치가 없으면 계산 불가
  }

  const timeEstimates = [];

  // 완료 작업 수 예상 시간
  if (requirements.completedJobsCount > 0 && projections.completedJobsPerMonth) {
    timeEstimates.push(Math.ceil(requirements.completedJobsCount / projections.completedJobsPerMonth));
  }

  // 평점 개선 예상 시간
  if (requirements.averageRating > 0 && projections.ratingImprovementPerMonth) {
    timeEstimates.push(Math.ceil(requirements.averageRating / projections.ratingImprovementPerMonth));
  }

  // 사진 품질 개선 예상 시간
  if (requirements.photoQualityScore > 0 && projections.photoQualityImprovementPerMonth) {
    timeEstimates.push(Math.ceil(requirements.photoQualityScore / projections.photoQualityImprovementPerMonth));
  }

  // 응답 시간 개선 예상 시간
  if (requirements.responseTime > 0 && projections.responseTimeImprovementPerMonth) {
    timeEstimates.push(Math.ceil(requirements.responseTime / projections.responseTimeImprovementPerMonth));
  }

  // 시간 준수율 개선 예상 시간
  if (requirements.onTimeRate > 0 && projections.onTimeRateImprovementPerMonth) {
    timeEstimates.push(Math.ceil(requirements.onTimeRate / projections.onTimeRateImprovementPerMonth));
  }

  return timeEstimates.length > 0 ? Math.max(...timeEstimates) : null;
}

/**
 * 등급별 통계 생성
 * @param {Array} contractors - 계약자 데이터 배열
 * @returns {Object} 등급별 통계
 */
export function generateGradeStatistics(contractors) {
  const stats = {
    total: contractors.length,
    byGrade: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    averageScores: {},
    topPerformers: [],
    improvementCandidates: []
  };

  contractors.forEach(contractor => {
    const level = determineContractorLevel(contractor);
    stats.byGrade[level]++;
  });

  // 평균 점수 계산
  const scoreKeys = ['averageRating', 'photoQualityScore', 'completedJobsCount'];
  scoreKeys.forEach(key => {
    const values = contractors.map(c => c[key]).filter(v => v !== undefined);
    if (values.length > 0) {
      stats.averageScores[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
    }
  });

  // 상위 성과자 (가중 점수 기준)
  const contractorsWithScores = contractors.map(contractor => ({
    ...contractor,
    weightedScore: calculateWeightedScore(contractor)
  }));

  stats.topPerformers = contractorsWithScores
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 10);

  // 개선 후보자 (다음 등급 근접자)
  stats.improvementCandidates = contractorsWithScores
    .filter(contractor => {
      const analysis = analyzeContractorGrade(contractor);
      return analysis.nextLevel && analysis.requirements;
    })
    .sort((a, b) => {
      const analysisA = analyzeContractorGrade(a);
      const analysisB = analyzeContractorGrade(b);
      const totalRequirementsA = Object.values(analysisA.requirements).reduce((sum, val) => sum + val, 0);
      const totalRequirementsB = Object.values(analysisB.requirements).reduce((sum, val) => sum + val, 0);
      return totalRequirementsA - totalRequirementsB;
    })
    .slice(0, 10);

  return stats;
}

/**
 * 등급 결정 (고급 함수)
 * @param {Object} options - 고급 옵션
 * @returns {Object} 종합 분석 결과
 */
export function advancedContractorGrading(options = {}) {
  const {
    contractor,
    includeAnalysis = true,
    includeProjections = false,
    projections = {},
    includeStatistics = false,
    allContractors = []
  } = options;

  const result = {
    level: determineContractorLevel(contractor),
    weightedScore: calculateWeightedScore(contractor),
    gradeInfo: GRADE_CRITERIA[determineContractorLevel(contractor)]
  };

  if (includeAnalysis) {
    result.analysis = analyzeContractorGrade(contractor);
  }

  if (includeProjections) {
    result.projection = calculateGradeUpgradeProjection(contractor, projections);
  }

  if (includeStatistics && allContractors.length > 0) {
    result.statistics = generateGradeStatistics(allContractors);
  }

  return result;
}

// 기본 내보내기
export default {
  determineContractorLevel,
  calculateWeightedScore,
  analyzeContractorGrade,
  getGradeBenefits,
  calculateGradeUpgradeProjection,
  generateGradeStatistics,
  advancedContractorGrading,
  GRADE_CRITERIA
}; 