# 계약자 평점 시스템 가이드

## 개요

계약자 평점 시스템은 고객의 리뷰를 기반으로 시공업체의 평점을 자동으로 계산하고 업데이트하는 시스템입니다. 다중 카테고리 평점, 등급 시스템 연동, 실시간 통계 업데이트 등의 기능을 제공합니다.

## 시스템 구성 요소

### 1. Firebase Cloud Functions
- **`updateContractorRating`**: 작업 평가 시 자동 평점 업데이트
- **`batchUpdateContractorRatings`**: 배치 평점 업데이트 (관리자용)

### 2. 통계 계산 시스템
- **다중 카테고리 평점**: 6개 카테고리별 평균 계산
- **종합 평점**: 전체 평점의 가중 평균
- **추천률**: 고객 추천 비율 계산
- **평점 분포**: 1-5점별 분포 통계

### 3. 등급 시스템 연동
- **자동 등급 업데이트**: 평점 기반 등급 결정
- **등급 변경 알림**: FCM 및 이메일 알림
- **등급 변경 로그**: 상세한 변경 이력

## 주요 기능

### 1. 자동 평점 업데이트
```javascript
exports.updateContractorRating = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // 평가가 새로 등록된 경우만 처리
    if (!before.consumerReview && after.consumerReview) {
      // 평점 업데이트 로직
    }
  });
```

### 2. 다중 카테고리 평점 처리
```javascript
const ratingCategories = {
  overall: "전체 만족도",
  quality: "시공 품질",
  punctuality: "시간 준수",
  communication: "의사소통",
  professionalism: "전문성",
  costSaving: "비용 절약"
};
```

### 3. 통계 계산
```javascript
function calculateNewReviewStats(currentStats, reviewData) {
  // 새로운 통계 계산 로직
  return {
    totalReviews: newTotalReviews,
    averageRating: newAverageRating,
    categoryAverages: newCategoryAverages,
    ratingDistribution: newRatingDistribution,
    recommendationRate: newRecommendationRate
  };
}
```

## 데이터베이스 구조

### 1. contractors 컬렉션
```javascript
{
  // 기본 정보
  name: "김시공",
  displayName: "김시공",
  
  // 평점 통계
  reviewStats: {
    totalReviews: 25,
    averageRating: 4.3,
    totalRating: 107.5,
    categoryAverages: {
      overall: { average: 4.3, total: 107.5, count: 25 },
      quality: { average: 4.2, total: 105.0, count: 25 },
      punctuality: { average: 4.4, total: 110.0, count: 25 },
      communication: { average: 4.1, total: 102.5, count: 25 },
      professionalism: { average: 4.5, total: 112.5, count: 25 },
      costSaving: { average: 4.0, total: 100.0, count: 25 }
    },
    ratingDistribution: { 1: 0, 2: 1, 3: 2, 4: 8, 5: 14 },
    recommendationRate: 88.0, // 88%
    totalRecommendations: 22
  },
  
  // 등급 정보
  level: 3,
  lastGradeUpdate: Timestamp,
  gradeUpdateReason: "review_update",
  
  // 호환성을 위한 기존 필드
  ratingAverage: 4.3,
  ratingCount: 25,
  lastReviewAt: Timestamp,
  lastReviewJobId: "job123"
}
```

### 2. ratingUpdateLogs 컬렉션
```javascript
{
  contractorId: "contractor123",
  jobId: "job456",
  oldStats: {
    totalReviews: 24,
    averageRating: 4.25,
    // ... 기존 통계
  },
  newStats: {
    totalReviews: 25,
    averageRating: 4.3,
    // ... 새로운 통계
  },
  reviewData: {
    ratings: { overall: 5, quality: 4, ... },
    averageRating: 4.5,
    comment: "매우 만족스러운 서비스...",
    recommendToOthers: true
  },
  timestamp: Timestamp,
  type: "review_update"
}
```

### 3. gradeChangeLogs 컬렉션
```javascript
{
  contractorId: "contractor123",
  oldLevel: 2,
  newLevel: 3,
  reason: "review_update",
  trigger: "rating_update",
  reviewStats: {
    // 현재 리뷰 통계
  },
  timestamp: Timestamp
}
```

## 평점 계산 로직

### 1. 기본 통계 계산
```javascript
// 총 리뷰 수
const newTotalReviews = currentStats.totalReviews + 1;

// 평균 평점
const newTotalRating = currentStats.totalRating + reviewData.averageRating;
const newAverageRating = newTotalRating / newTotalReviews;

// 추천률
const newTotalRecommendations = currentStats.totalRecommendations + 
  (reviewData.recommendToOthers ? 1 : 0);
const newRecommendationRate = newTotalRecommendations / newTotalReviews;
```

### 2. 카테고리별 평균 계산
```javascript
const newCategoryAverages = { ...currentStats.categoryAverages };

Object.entries(ratings).forEach(([category, rating]) => {
  if (rating > 0) {
    const currentCategoryTotal = (newCategoryAverages[category]?.total || 0) + rating;
    const currentCategoryCount = (newCategoryAverages[category]?.count || 0) + 1;
    
    newCategoryAverages[category] = {
      average: currentCategoryTotal / currentCategoryCount,
      total: currentCategoryTotal,
      count: currentCategoryCount
    };
  }
});
```

### 3. 평점 분포 계산
```javascript
const newRatingDistribution = { ...currentStats.ratingDistribution };
const overallRating = Math.round(averageRating);

if (overallRating >= 1 && overallRating <= 5) {
  newRatingDistribution[overallRating]++;
}
```

## 등급 시스템 연동

### 1. 등급 결정 로직
```javascript
async function updateContractorGradeFromReview(contractorId, reviewStats) {
  const gradeData = {
    completedJobsCount: reviewStats.totalReviews,
    averageRating: reviewStats.averageRating,
    photoQualityScore: contractorData.photoQualityScore || 0,
    responseTime: contractorData.responseTime || 120,
    onTimeRate: contractorData.onTimeRate || 0,
    satisfactionRate: reviewStats.recommendationRate
  };

  const newLevel = determineContractorLevel(gradeData);
  
  if (newLevel !== currentLevel) {
    // 등급 변경 처리
  }
}
```

### 2. 등급 기준
```javascript
const GRADE_CRITERIA = {
  1: { // 브론즈
    minCompletedJobs: 0,
    minAverageRating: 0,
    minSatisfactionRate: 0
  },
  2: { // 실버
    minCompletedJobs: 10,
    minAverageRating: 3.5,
    minSatisfactionRate: 70
  },
  3: { // 골드
    minCompletedJobs: 25,
    minAverageRating: 4.0,
    minSatisfactionRate: 80
  },
  4: { // 플래티넘
    minCompletedJobs: 50,
    minAverageRating: 4.3,
    minSatisfactionRate: 85
  },
  5: { // 다이아몬드
    minCompletedJobs: 100,
    minAverageRating: 4.5,
    minSatisfactionRate: 90
  }
};
```

## 배치 처리

### 1. 관리자용 배치 업데이트
```javascript
exports.batchUpdateContractorRatings = functions.https.onCall(async (data, context) => {
  // 관리자 권한 확인
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  // 배치 처리 로직
  const results = [];
  const errors = [];

  for (const doc of contractors) {
    try {
      // 개별 계약자 처리
      const newStats = recalculateStatsFromReviews(reviews);
      await updateContractorGradeFromReview(contractorId, newStats);
      results.push({ contractorId, newStats });
    } catch (error) {
      errors.push({ contractorId: doc.id, error: error.message });
    }
  }

  return { success: true, results, errors };
});
```

### 2. 통계 재계산
```javascript
function recalculateStatsFromReviews(reviews) {
  let totalRating = 0;
  let totalRecommendations = 0;
  const categoryTotals = {};
  const categoryCounts = {};

  reviews.forEach(review => {
    totalRating += review.averageRating || 0;
    if (review.recommendToOthers) totalRecommendations++;

    // 카테고리별 평균 계산
    if (review.ratings) {
      Object.entries(review.ratings).forEach(([category, rating]) => {
        if (rating > 0) {
          categoryTotals[category] = (categoryTotals[category] || 0) + rating;
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      });
    }
  });

  return {
    totalReviews: reviews.length,
    averageRating: totalRating / reviews.length,
    recommendationRate: totalRecommendations / reviews.length,
    // ... 기타 통계
  };
}
```

## 모니터링 및 로깅

### 1. 상세 로깅
```javascript
// 평점 업데이트 로그
await firestore.collection("ratingUpdateLogs").add({
  contractorId: contractorId,
  jobId: jobId,
  oldStats: currentStats,
  newStats: newStats,
  reviewData: reviewData,
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
  type: "review_update"
});

// 오류 로그
await firestore.collection("ratingUpdateLogs").add({
  contractorId: contractorId,
  jobId: jobId,
  error: error.message,
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
  type: "review_update_error"
});
```

### 2. 성능 모니터링
```javascript
console.log(`Contractor ${contractorId} rating updated: ${newStats.averageRating.toFixed(2)} (${newStats.totalReviews} reviews)`);
console.log(`Batch rating update completed: ${results.length} processed, ${errors.length} errors`);
```

## 오류 처리

### 1. 데이터 검증
```javascript
// 계약자 ID 확인
if (!contractorId) {
  console.log(`No contractor ID found for job ${jobId}`);
  return null;
}

// 계약자 문서 존재 확인
if (!contractorDoc.exists) {
  console.log(`Contractor ${contractorId} not found`);
  return null;
}
```

### 2. 예외 처리
```javascript
try {
  // 평점 업데이트 로직
} catch (error) {
  console.error(`Error updating contractor rating for ${contractorId}:`, error);
  
  // 오류 로그 저장
  await firestore.collection("ratingUpdateLogs").add({
    contractorId: contractorId,
    jobId: jobId,
    error: error.message,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    type: "review_update_error"
  });
}
```

## 성능 최적화

### 1. 배치 처리
- 여러 계약자를 한 번에 처리
- Firestore 배치 작업 사용
- 효율적인 데이터 업데이트

### 2. 캐싱
- 자주 사용되는 통계 데이터 캐싱
- 불필요한 재계산 방지

### 3. 인덱스 최적화
- 리뷰 조회를 위한 인덱스 설정
- 효율적인 쿼리 실행

## 보안 고려사항

### 1. 권한 관리
- 관리자 권한 확인
- 데이터 접근 제한
- 안전한 API 호출

### 2. 데이터 무결성
- 입력 데이터 검증
- 중복 처리 방지
- 일관성 보장

### 3. 감사 로그
- 모든 변경사항 로깅
- 사용자 행동 추적
- 보안 이벤트 모니터링

## 확장 가능성

### 1. 추가 통계
- 월별/연도별 통계
- 지역별 평점 분석
- 작업 유형별 평점

### 2. 고급 분석
- 평점 트렌드 분석
- 예측 모델링
- 성과 지표

### 3. 알림 시스템
- 평점 임계값 알림
- 등급 변경 알림
- 성과 개선 제안

## 테스트

### 1. 단위 테스트
```javascript
describe('Rating Calculation', () => {
  test('평균 평점 계산이 올바르게 작동한다', () => {
    const currentStats = { totalReviews: 10, totalRating: 40 };
    const reviewData = { averageRating: 5 };
    const newStats = calculateNewReviewStats(currentStats, reviewData);
    expect(newStats.averageRating).toBe(4.09);
  });
});
```

### 2. 통합 테스트
```javascript
test('리뷰 제출 시 평점이 올바르게 업데이트된다', async () => {
  // 테스트 데이터 준비
  const jobId = 'test-job-123';
  const contractorId = 'test-contractor-456';
  
  // 리뷰 제출
  await submitReview(jobId, reviewData);
  
  // 평점 업데이트 확인
  const contractor = await getContractor(contractorId);
  expect(contractor.reviewStats.averageRating).toBe(expectedRating);
});
```

## 결론

계약자 평점 시스템은 고객 리뷰를 기반으로 시공업체의 성과를 객관적으로 평가하고, 이를 통해 서비스 품질 향상을 도모하는 핵심 시스템입니다. 다중 카테고리 평점, 자동 등급 업데이트, 상세한 통계 분석을 통해 공정하고 정확한 평가를 제공합니다.

이 시스템을 통해 시공업체는 자신의 성과를 객관적으로 파악하고 개선할 수 있으며, 고객은 신뢰할 수 있는 시공업체를 선택할 수 있도록 도움을 줄 수 있습니다. 