/**
 * 시공기사 등급 계산 유틸리티
 * 다양한 평가 항목을 기반으로 종합적인 등급을 계산합니다.
 */

// 등급 기준 정의
export const GRADE_CRITERIA = {
  A: { min: 4.5, label: "A", description: "우수", color: "green" },
  B: { min: 3.5, label: "B", description: "양호", color: "blue" },
  C: { min: 2.5, label: "C", description: "보통", color: "yellow" },
  D: { min: 0, label: "D", description: "미흡", color: "red" }
};

// 평가 항목 가중치 (총합이 1이 되도록 설정)
export const RATING_WEIGHTS = {
  quality: 0.25,        // 시공 품질
  punctuality: 0.20,    // 시간 준수
  costSaving: 0.20,     // 비용 효율성
  communication: 0.15,  // 의사소통
  professionalism: 0.20 // 전문성
};

/**
 * 기본 등급 계산 함수
 * @param {Array} ratings - 평가 배열
 * @returns {string} 등급 (A, B, C, D)
 */
export const calculateContractorGrade = (ratings) => {
  if (!ratings || ratings.length === 0) return "C";

  // 모든 평가의 평균 계산
  const totalScores = ratings.reduce(
    (acc, rating) => {
      // 개별 평가 항목들의 평균 계산
      const ratingValues = Object.values(rating.ratings || rating);
      const average = ratingValues.reduce((sum, val) => sum + (val || 0), 0) / ratingValues.length;
      
      acc.total += average;
      acc.count += 1;
      return acc;
    },
    { total: 0, count: 0 }
  );

  const overallAverage = totalScores.total / totalScores.count;

  // 등급 결정
  if (overallAverage >= GRADE_CRITERIA.A.min) return "A";
  else if (overallAverage >= GRADE_CRITERIA.B.min) return "B";
  else if (overallAverage >= GRADE_CRITERIA.C.min) return "C";
  else return "D";
};

/**
 * 가중치를 적용한 상세 등급 계산
 * @param {Array} ratings - 평가 배열
 * @returns {Object} 상세 등급 정보
 */
export const calculateDetailedGrade = (ratings) => {
  if (!ratings || ratings.length === 0) {
    return {
      grade: "C",
      averageRating: 0,
      totalRatings: 0,
      categoryScores: {},
      gradeInfo: GRADE_CRITERIA.C,
      recommendations: ["더 많은 평가가 필요합니다."]
    };
  }

  // 카테고리별 점수 계산
  const categoryTotals = {};
  const categoryCounts = {};

  ratings.forEach(rating => {
    const ratingData = rating.ratings || rating;
    
    Object.keys(RATING_WEIGHTS).forEach(category => {
      if (ratingData[category] !== undefined) {
        categoryTotals[category] = (categoryTotals[category] || 0) + ratingData[category];
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
  });

  // 카테고리별 평균 계산
  const categoryScores = {};
  Object.keys(categoryTotals).forEach(category => {
    categoryScores[category] = categoryTotals[category] / categoryCounts[category];
  });

  // 가중 평균 계산
  let weightedSum = 0;
  let totalWeight = 0;

  Object.keys(categoryScores).forEach(category => {
    const weight = RATING_WEIGHTS[category] || 0;
    weightedSum += categoryScores[category] * weight;
    totalWeight += weight;
  });

  const averageRating = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // 등급 결정
  let grade = "D";
  Object.keys(GRADE_CRITERIA).forEach(gradeKey => {
    if (averageRating >= GRADE_CRITERIA[gradeKey].min) {
      grade = gradeKey;
    }
  });

  const gradeInfo = GRADE_CRITERIA[grade];

  // 개선 권장사항 생성
  const recommendations = generateRecommendations(categoryScores, averageRating);

  return {
    grade,
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings: ratings.length,
    categoryScores,
    gradeInfo,
    recommendations,
    recentTrend: calculateRecentTrend(ratings)
  };
};

/**
 * 최근 평가 트렌드 계산
 * @param {Array} ratings - 평가 배열
 * @returns {Object} 트렌드 정보
 */
const calculateRecentTrend = (ratings) => {
  if (ratings.length < 2) return { trend: "stable", change: 0 };

  // 최근 5개 평가만 사용
  const recentRatings = ratings.slice(-5);
  const olderRatings = ratings.slice(0, -5);

  if (olderRatings.length === 0) return { trend: "stable", change: 0 };

  const recentAverage = recentRatings.reduce((sum, rating) => {
    const ratingData = rating.ratings || rating;
    const values = Object.values(ratingData);
    return sum + (values.reduce((a, b) => a + b, 0) / values.length);
  }, 0) / recentRatings.length;

  const olderAverage = olderRatings.reduce((sum, rating) => {
    const ratingData = rating.ratings || rating;
    const values = Object.values(ratingData);
    return sum + (values.reduce((a, b) => a + b, 0) / values.length);
  }, 0) / olderRatings.length;

  const change = recentAverage - olderAverage;

  return {
    trend: change > 0.5 ? "improving" : change < -0.5 ? "declining" : "stable",
    change: Math.round(change * 10) / 10
  };
};

/**
 * 개선 권장사항 생성
 * @param {Object} categoryScores - 카테고리별 점수
 * @param {number} averageRating - 전체 평균 점수
 * @returns {Array} 권장사항 배열
 */
const generateRecommendations = (categoryScores, averageRating) => {
  const recommendations = [];

  // 전체 점수가 낮은 경우
  if (averageRating < 3.0) {
    recommendations.push("전반적인 서비스 품질 개선이 필요합니다.");
  }

  // 카테고리별 개선 권장사항
  Object.entries(categoryScores).forEach(([category, score]) => {
    if (score < 3.0) {
      const categoryLabels = {
        quality: "시공 품질",
        punctuality: "시간 준수",
        costSaving: "비용 효율성",
        communication: "의사소통",
        professionalism: "전문성"
      };

      const improvements = {
        quality: "시공 기술 향상과 품질 관리 강화",
        punctuality: "일정 관리 및 시간 준수 개선",
        costSaving: "비용 효율적인 작업 방법 도입",
        communication: "고객과의 소통 능력 향상",
        professionalism: "전문적인 태도와 서비스 마인드 개선"
      };

      recommendations.push(`${categoryLabels[category]} 개선: ${improvements[category]}`);
    }
  });

  // 긍정적인 피드백
  const highScores = Object.entries(categoryScores).filter(([_, score]) => score >= 4.0);
  if (highScores.length > 0) {
    const strengths = highScores.map(([category, _]) => {
      const labels = {
        quality: "시공 품질",
        punctuality: "시간 준수",
        costSaving: "비용 효율성",
        communication: "의사소통",
        professionalism: "전문성"
      };
      return labels[category];
    });
    recommendations.push(`우수한 항목: ${strengths.join(", ")}`);
  }

  return recommendations.length > 0 ? recommendations : ["현재 수준을 유지하세요."];
};

/**
 * 등급별 혜택 및 요구사항
 * @param {string} grade - 등급
 * @returns {Object} 등급별 정보
 */
export const getGradeBenefits = (grade) => {
  const benefits = {
    A: {
      title: "A등급 - 우수",
      benefits: [
        "우선 고객 배정",
        "프리미엄 요금 적용 가능",
        "특별 프로모션 참여 자격",
        "고객 추천 우선권"
      ],
      requirements: [
        "평균 평점 4.5 이상",
        "최소 10건 이상의 평가",
        "최근 3개월 내 부정적 평가 없음"
      ]
    },
    B: {
      title: "B등급 - 양호",
      benefits: [
        "일반 고객 배정",
        "표준 요금 적용",
        "기본 프로모션 참여"
      ],
      requirements: [
        "평균 평점 3.5 이상",
        "최소 5건 이상의 평가"
      ]
    },
    C: {
      title: "C등급 - 보통",
      benefits: [
        "기본 고객 배정",
        "표준 요금 적용"
      ],
      requirements: [
        "평균 평점 2.5 이상",
        "개선 계획 수립 필요"
      ]
    },
    D: {
      title: "D등급 - 미흡",
      benefits: [
        "제한적 고객 배정"
      ],
      requirements: [
        "즉시 개선 계획 수립",
        "교육 프로그램 참여",
        "정기 모니터링"
      ]
    }
  };

  return benefits[grade] || benefits.C;
};

/**
 * 등급 색상 및 스타일 정보
 * @param {string} grade - 등급
 * @returns {Object} 스타일 정보
 */
export const getGradeStyle = (grade) => {
  const styles = {
    A: {
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
      icon: "🏆"
    },
    B: {
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200",
      icon: "⭐"
    },
    C: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      borderColor: "border-yellow-200",
      icon: "📊"
    },
    D: {
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-red-200",
      icon: "⚠️"
    }
  };

  return styles[grade] || styles.C;
};

/**
 * 평가 통계 계산
 * @param {Array} ratings - 평가 배열
 * @returns {Object} 통계 정보
 */
export const calculateRatingStats = (ratings) => {
  if (!ratings || ratings.length === 0) {
    return {
      totalRatings: 0,
      averageRating: 0,
      grade: "C",
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentRatings: [],
      monthlyTrend: []
    };
  }

  // 평점 분포 계산
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalScore = 0;
  let totalCount = 0;

  ratings.forEach(rating => {
    const ratingData = rating.ratings || rating;
    const values = Object.values(ratingData);
    const average = values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
    
    const roundedAverage = Math.round(average);
    distribution[roundedAverage] = (distribution[roundedAverage] || 0) + 1;
    
    totalScore += average;
    totalCount += 1;
  });

  const averageRating = totalScore / totalCount;
  const grade = calculateContractorGrade(ratings);

  // 최근 평가 (최근 5개)
  const recentRatings = ratings.slice(-5).map(rating => ({
    ...rating,
    date: rating.date?.toDate?.() || new Date(rating.date?.seconds * 1000)
  }));

  return {
    totalRatings: ratings.length,
    averageRating: Math.round(averageRating * 10) / 10,
    grade,
    ratingDistribution: distribution,
    recentRatings,
    satisfactionRate: Math.round((distribution[4] + distribution[5]) / totalCount * 100)
  };
};

export default {
  calculateContractorGrade,
  calculateDetailedGrade,
  getGradeBenefits,
  getGradeStyle,
  calculateRatingStats,
  GRADE_CRITERIA,
  RATING_WEIGHTS
}; 