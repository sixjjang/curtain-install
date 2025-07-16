/**
 * 시공기사 배정 유틸리티
 * 등급, 가용성, 위치, 기술 등을 고려한 최적의 시공기사 배정 시스템
 */

// 등급별 우선순위 (낮을수록 높은 우선순위)
const GRADE_PRIORITY = { A: 1, B: 2, C: 3, D: 4 };

// 등급별 가중치 (점수 계산용)
const GRADE_WEIGHTS = { A: 1.0, B: 0.8, C: 0.6, D: 0.4 };

// 거리별 가중치 (km 기준)
const DISTANCE_WEIGHTS = {
  0: 1.0,    // 0-5km
  5: 0.9,    // 5-10km
  10: 0.8,   // 10-15km
  15: 0.7,   // 15-20km
  20: 0.6,   // 20km+
};

/**
 * 시공기사 배정 메인 함수 (고급 기능)
 * @param {Array} contractors - 시공기사 배열
 * @param {Object} job - 작업 정보
 * @param {Object} options - 배정 옵션
 * @returns {Object} 배정 결과
 */
export const assignContractor = (contractors, job, options = {}) => {
  const {
    maxDistance = 50,           // 최대 거리 (km)
    minRating = 0,              // 최소 평점
    requireExperience = false,  // 경험 요구 여부
    priority = 'grade',         // 우선순위 기준: 'grade', 'distance', 'rating', 'composite'
    maxCandidates = 10,         // 최대 후보 수
    autoAssign = false          // 자동 배정 여부
  } = options;

  try {
    // 1단계: 기본 필터링
    const eligible = filterEligibleContractors(contractors, job, {
      maxDistance,
      minRating,
      requireExperience
    });

    if (eligible.length === 0) {
      return {
        success: false,
        message: "조건을 만족하는 시공기사가 없습니다.",
        candidates: [],
        assignment: null
      };
    }

    // 2단계: 점수 계산 및 정렬
    const scoredCandidates = calculateScores(eligible, job, priority);
    const sortedCandidates = sortCandidates(scoredCandidates, priority);

    // 3단계: 최종 후보 선정
    const finalCandidates = sortedCandidates.slice(0, maxCandidates);

    // 4단계: 자동 배정 (옵션)
    let assignment = null;
    if (autoAssign && finalCandidates.length > 0) {
      assignment = performAutoAssignment(finalCandidates[0], job);
    }

    return {
      success: true,
      message: `${finalCandidates.length}명의 시공기사가 배정되었습니다.`,
      candidates: finalCandidates,
      assignment,
      stats: generateAssignmentStats(finalCandidates, job)
    };

  } catch (error) {
    console.error("시공기사 배정 오류:", error);
    return {
      success: false,
      message: "배정 처리 중 오류가 발생했습니다.",
      candidates: [],
      assignment: null,
      error: error.message
    };
  }
};

/**
 * 간단한 시공기사 배정 함수 (사용자 요청 스타일)
 * @param {Object} job - 작업 정보
 * @param {Array} contractors - 시공기사 배열 [{ id, grade, available, ... }]
 * @returns {string|null} 배정된 시공기사 ID 또는 null
 */
export const assignJob = (job, contractors) => {
  // contractors는 [{ id, grade, available, ... }]
  // grade 순서: A > B > C 등급 높을수록 우선권 부여
  contractors.sort((a, b) => gradeRank(b.grade) - gradeRank(a.grade));

  for (const contractor of contractors) {
    if (contractor.available && matchJob(contractor, job)) {
      return contractor.id; // 배정된 시공기사 ID 반환
    }
  }
  return null; // 배정 불가 시 null 반환
};

/**
 * 등급 순위 반환
 * @param {string} grade - 등급 (A, B, C, D)
 * @returns {number} 순위 (높을수록 좋은 등급)
 */
export const gradeRank = (grade) => {
  const ranks = { A: 3, B: 2, C: 1, D: 0 };
  return ranks[grade] || 0;
};

/**
 * 작업 매칭 확인
 * @param {Object} contractor - 시공기사 정보
 * @param {Object} job - 작업 정보
 * @returns {boolean} 매칭 여부
 */
export const matchJob = (contractor, job) => {
  // 기본 가용성 확인
  if (!contractor.available) return false;
  
  // 활성 상태 확인
  if (contractor.suspended || !contractor.active) return false;
  
  // 스케줄 확인
  if (job.date && !isAvailable(contractor, job.date, job.duration)) {
    return false;
  }
  
  // 예산 확인
  if (job.budget) {
    const contractorCost = contractor.hourlyRate || contractor.estimatedCost || 0;
    if (contractorCost > job.budget) return false;
  }
  
  // 거리 확인
  if (job.location && contractor.location) {
    const distance = calculateDistance(contractor.location, job.location);
    if (distance > (job.maxDistance || 50)) return false;
  }
  
  // 평점 확인
  if (job.minRating && contractor.averageRating < job.minRating) {
    return false;
  }
  
  // 기술 요구사항 확인
  if (job.requiredSkills && contractor.skills) {
    const hasAllSkills = job.requiredSkills.every(skill => 
      contractor.skills.includes(skill)
    );
    if (!hasAllSkills) return false;
  }
  
  return true;
};

/**
 * 적격 시공기사 필터링
 * @param {Array} contractors - 시공기사 배열
 * @param {Object} job - 작업 정보
 * @param {Object} filters - 필터 조건
 * @returns {Array} 적격 시공기사 배열
 */
const filterEligibleContractors = (contractors, job, filters) => {
  return contractors.filter(contractor => {
    // 기본 정보 확인
    if (!contractor.active || contractor.suspended) {
      return false;
    }

    // 가용성 확인
    if (!isAvailable(contractor, job.date, job.duration)) {
      return false;
    }

    // 예산 확인
    if (job.budget < contractor.minCost || job.budget > contractor.maxCost) {
      return false;
    }

    // 거리 확인
    const distance = calculateDistance(contractor.location, job.location);
    if (distance > filters.maxDistance) {
      return false;
    }

    // 평점 확인
    if (contractor.averageRating < filters.minRating) {
      return false;
    }

    // 경험 요구사항 확인
    if (filters.requireExperience && !hasRequiredExperience(contractor, job.type)) {
      return false;
    }

    // 기술 요구사항 확인
    if (job.requiredSkills && !hasRequiredSkills(contractor, job.requiredSkills)) {
      return false;
    }

    return true;
  });
};

/**
 * 가용성 확인
 * @param {Object} contractor - 시공기사 정보
 * @param {Date} jobDate - 작업 날짜
 * @param {number} duration - 작업 시간 (시간)
 * @returns {boolean} 가용 여부
 */
const isAvailable = (contractor, jobDate, duration = 8) => {
  // 작업 날짜가 가용 날짜에 포함되는지 확인
  const availableDates = contractor.availableDates || [];
  const jobDateStr = jobDate.toISOString().split('T')[0];
  
  if (!availableDates.includes(jobDateStr)) {
    return false;
  }

  // 기존 예약과 충돌하는지 확인
  const existingJobs = contractor.scheduledJobs || [];
  const jobStart = new Date(jobDate);
  const jobEnd = new Date(jobStart.getTime() + duration * 60 * 60 * 1000);

  for (const scheduledJob of existingJobs) {
    const scheduledStart = scheduledJob.startTime?.toDate?.() || new Date(scheduledJob.startTime);
    const scheduledEnd = scheduledJob.endTime?.toDate?.() || new Date(scheduledJob.endTime);

    if (jobStart < scheduledEnd && jobEnd > scheduledStart) {
      return false; // 시간 충돌
    }
  }

  return true;
};

/**
 * 거리 계산 (Haversine 공식)
 * @param {Object} location1 - 위치 1 {lat, lng}
 * @param {Object} location2 - 위치 2 {lat, lng}
 * @returns {number} 거리 (km)
 */
const calculateDistance = (location1, location2) => {
  if (!location1 || !location2) return Infinity;

  const R = 6371; // 지구 반지름 (km)
  const dLat = (location2.lat - location1.lat) * Math.PI / 180;
  const dLng = (location2.lng - location1.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(location1.lat * Math.PI / 180) * Math.cos(location2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * 필요 경험 확인
 * @param {Object} contractor - 시공기사 정보
 * @param {string} jobType - 작업 유형
 * @returns {boolean} 경험 보유 여부
 */
const hasRequiredExperience = (contractor, jobType) => {
  const experience = contractor.experience || {};
  return experience[jobType] && experience[jobType] > 0;
};

/**
 * 필요 기술 확인
 * @param {Object} contractor - 시공기사 정보
 * @param {Array} requiredSkills - 필요 기술 배열
 * @returns {boolean} 기술 보유 여부
 */
const hasRequiredSkills = (contractor, requiredSkills) => {
  const skills = contractor.skills || [];
  return requiredSkills.every(skill => skills.includes(skill));
};

/**
 * 점수 계산
 * @param {Array} candidates - 후보 시공기사 배열
 * @param {Object} job - 작업 정보
 * @param {string} priority - 우선순위 기준
 * @returns {Array} 점수가 계산된 후보 배열
 */
const calculateScores = (candidates, job, priority) => {
  return candidates.map(contractor => {
    const scores = {
      grade: calculateGradeScore(contractor),
      distance: calculateDistanceScore(contractor, job),
      rating: calculateRatingScore(contractor),
      availability: calculateAvailabilityScore(contractor, job),
      experience: calculateExperienceScore(contractor, job),
      cost: calculateCostScore(contractor, job)
    };

    // 종합 점수 계산
    const compositeScore = calculateCompositeScore(scores, priority);

    return {
      ...contractor,
      scores,
      compositeScore,
      distance: calculateDistance(contractor.location, job.location)
    };
  });
};

/**
 * 등급 점수 계산
 * @param {Object} contractor - 시공기사 정보
 * @returns {number} 등급 점수 (0-100)
 */
const calculateGradeScore = (contractor) => {
  const grade = contractor.grade || 'C';
  return GRADE_WEIGHTS[grade] * 100;
};

/**
 * 거리 점수 계산
 * @param {Object} contractor - 시공기사 정보
 * @param {Object} job - 작업 정보
 * @returns {number} 거리 점수 (0-100)
 */
const calculateDistanceScore = (contractor, job) => {
  const distance = calculateDistance(contractor.location, job.location);
  
  if (distance <= 5) return 100;
  if (distance <= 10) return 90;
  if (distance <= 15) return 80;
  if (distance <= 20) return 70;
  if (distance <= 30) return 60;
  if (distance <= 40) return 50;
  return 40;
};

/**
 * 평점 점수 계산
 * @param {Object} contractor - 시공기사 정보
 * @returns {number} 평점 점수 (0-100)
 */
const calculateRatingScore = (contractor) => {
  const rating = contractor.averageRating || 0;
  return Math.min(rating * 20, 100); // 5점 만점을 100점으로 변환
};

/**
 * 가용성 점수 계산
 * @param {Object} contractor - 시공기사 정보
 * @param {Object} job - 작업 정보
 * @returns {number} 가용성 점수 (0-100)
 */
const calculateAvailabilityScore = (contractor, job) => {
  const availableDates = contractor.availableDates || [];
  const jobDate = job.date.toISOString().split('T')[0];
  
  if (availableDates.includes(jobDate)) {
    return 100;
  }
  
  // 근접 날짜 확인
  const jobDateObj = new Date(jobDate);
  const closeDates = availableDates.filter(date => {
    const dateObj = new Date(date);
    const diffDays = Math.abs((jobDateObj - dateObj) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  });
  
  return closeDates.length > 0 ? 80 : 0;
};

/**
 * 경험 점수 계산
 * @param {Object} contractor - 시공기사 정보
 * @param {Object} job - 작업 정보
 * @returns {number} 경험 점수 (0-100)
 */
const calculateExperienceScore = (contractor, job) => {
  const experience = contractor.experience || {};
  const jobExperience = experience[job.type] || 0;
  
  if (jobExperience >= 5) return 100;
  if (jobExperience >= 3) return 80;
  if (jobExperience >= 1) return 60;
  return 40;
};

/**
 * 비용 점수 계산
 * @param {Object} contractor - 시공기사 정보
 * @param {Object} job - 작업 정보
 * @returns {number} 비용 점수 (0-100)
 */
const calculateCostScore = (contractor, job) => {
  const contractorCost = contractor.hourlyRate || contractor.estimatedCost || 0;
  const jobBudget = job.budget;
  
  if (contractorCost <= jobBudget * 0.7) return 100;
  if (contractorCost <= jobBudget * 0.8) return 90;
  if (contractorCost <= jobBudget * 0.9) return 80;
  if (contractorCost <= jobBudget) return 70;
  return 50;
};

/**
 * 종합 점수 계산
 * @param {Object} scores - 각 항목별 점수
 * @param {string} priority - 우선순위 기준
 * @returns {number} 종합 점수
 */
const calculateCompositeScore = (scores, priority) => {
  const weights = {
    grade: { grade: 0.3, rating: 0.25, distance: 0.2, availability: 0.15, experience: 0.1 },
    distance: { distance: 0.4, grade: 0.2, rating: 0.2, availability: 0.15, experience: 0.05 },
    rating: { rating: 0.4, grade: 0.25, distance: 0.2, availability: 0.1, experience: 0.05 },
    composite: { grade: 0.25, rating: 0.25, distance: 0.2, availability: 0.15, experience: 0.1, cost: 0.05 }
  };

  const weight = weights[priority] || weights.composite;
  let totalScore = 0;

  Object.entries(weight).forEach(([key, value]) => {
    totalScore += (scores[key] || 0) * value;
  });

  return Math.round(totalScore);
};

/**
 * 후보 정렬
 * @param {Array} candidates - 후보 배열
 * @param {string} priority - 우선순위 기준
 * @returns {Array} 정렬된 후보 배열
 */
const sortCandidates = (candidates, priority) => {
  return [...candidates].sort((a, b) => {
    switch (priority) {
      case 'grade':
        return GRADE_PRIORITY[a.grade] - GRADE_PRIORITY[b.grade];
      case 'distance':
        return a.distance - b.distance;
      case 'rating':
        return b.averageRating - a.averageRating;
      case 'composite':
      default:
        return b.compositeScore - a.compositeScore;
    }
  });
};

/**
 * 자동 배정 수행
 * @param {Object} contractor - 배정될 시공기사
 * @param {Object} job - 작업 정보
 * @returns {Object} 배정 결과
 */
const performAutoAssignment = (contractor, job) => {
  const assignment = {
    contractorId: contractor.id,
    contractorName: contractor.name,
    jobId: job.id,
    jobTitle: job.title,
    assignedAt: new Date(),
    status: 'assigned',
    estimatedCost: contractor.estimatedCost || job.budget * 0.8,
    estimatedDuration: job.duration || 8,
    notes: `자동 배정: ${contractor.grade}등급, 평점 ${contractor.averageRating}`
  };

  return assignment;
};

/**
 * 배정 통계 생성
 * @param {Array} candidates - 후보 배열
 * @param {Object} job - 작업 정보
 * @returns {Object} 통계 정보
 */
const generateAssignmentStats = (candidates, job) => {
  const stats = {
    totalCandidates: candidates.length,
    gradeDistribution: { A: 0, B: 0, C: 0, D: 0 },
    averageRating: 0,
    averageDistance: 0,
    averageCost: 0,
    topGrade: null
  };

  if (candidates.length === 0) return stats;

  // 등급 분포
  candidates.forEach(c => {
    const grade = c.grade || 'C';
    stats.gradeDistribution[grade]++;
  });

  // 평균값 계산
  stats.averageRating = candidates.reduce((sum, c) => sum + (c.averageRating || 0), 0) / candidates.length;
  stats.averageDistance = candidates.reduce((sum, c) => sum + c.distance, 0) / candidates.length;
  stats.averageCost = candidates.reduce((sum, c) => sum + (c.estimatedCost || 0), 0) / candidates.length;

  // 최고 등급
  const grades = candidates.map(c => c.grade).filter(Boolean);
  if (grades.length > 0) {
    stats.topGrade = grades.reduce((min, grade) => 
      GRADE_PRIORITY[grade] < GRADE_PRIORITY[min] ? grade : min
    );
  }

  return stats;
};

/**
 * 배정 결과 검증
 * @param {Object} assignment - 배정 결과
 * @param {Object} job - 작업 정보
 * @returns {Object} 검증 결과
 */
export const validateAssignment = (assignment, job) => {
  const errors = [];

  if (!assignment.contractorId) {
    errors.push("시공기사 ID가 없습니다.");
  }

  if (!assignment.jobId) {
    errors.push("작업 ID가 없습니다.");
  }

  if (assignment.estimatedCost > job.budget) {
    errors.push("예상 비용이 예산을 초과합니다.");
  }

  if (assignment.estimatedDuration > job.maxDuration) {
    errors.push("예상 소요 시간이 허용 시간을 초과합니다.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 배정 취소
 * @param {string} assignmentId - 배정 ID
 * @param {string} reason - 취소 사유
 * @returns {Object} 취소 결과
 */
export const cancelAssignment = (assignmentId, reason = "고객 요청") => {
  return {
    assignmentId,
    status: 'cancelled',
    cancelledAt: new Date(),
    reason,
    message: "배정이 취소되었습니다."
  };
};

export default {
  assignContractor,
  assignJob,
  gradeRank,
  matchJob,
  validateAssignment,
  cancelAssignment,
  GRADE_PRIORITY,
  GRADE_WEIGHTS
}; 