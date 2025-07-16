# 시공 평가 시스템 가이드

## 개요

시공 평가 시스템은 고객이 완료된 작업에 대해 상세한 평가를 할 수 있도록 하는 시스템입니다. 다중 카테고리 평점, 별점 시스템, 계약자 통계 업데이트 등의 기능을 제공합니다.

## 시스템 구성 요소

### 1. ReviewPage 컴포넌트
- **파일**: `frontend/src/components/ReviewPage.js`
- **기능**: 메인 평가 페이지, 다중 카테고리 평점, 별점 시스템

### 2. ReviewPageExample 컴포넌트
- **파일**: `frontend/src/components/ReviewPageExample.js`
- **기능**: ReviewPage 사용 예제, 테스트 인터페이스

## 주요 기능

### 1. 다중 카테고리 평점
```javascript
const ratingCategories = {
  overall: { label: "전체 만족도", description: "전반적인 서비스 만족도" },
  quality: { label: "시공 품질", description: "작업 완성도와 품질" },
  punctuality: { label: "시간 준수", description: "약속 시간 준수도" },
  communication: { label: "의사소통", description: "소통의 원활함" },
  professionalism: { label: "전문성", description: "전문적인 태도와 기술" },
  costSaving: { label: "비용 절약", description: "예산 대비 만족도" }
};
```

### 2. 별점 시스템
- 5점 만점 별점 시스템
- 시각적 별점 표시
- 호버 효과 및 애니메이션
- 실시간 평점 표시

### 3. 상세 평가 기능
- 텍스트 코멘트 (최대 1000자)
- 추천 여부 선택
- 평균 평점 자동 계산
- 실시간 문자 수 표시

### 4. 데이터 저장
- Firestore reviews 컬렉션에 저장
- 작업 문서 업데이트
- 계약자 통계 자동 업데이트

## 사용 방법

### 1. 기본 사용법
```javascript
import ReviewPage from './ReviewPage';

const MyComponent = () => {
  return (
    <ReviewPage 
      jobId="job123" 
      userId="user456" 
    />
  );
};
```

### 2. 예제 컴포넌트 사용
```javascript
import ReviewPageExample from './ReviewPageExample';

const App = () => {
  return <ReviewPageExample />;
};
```

## 데이터베이스 구조

### 1. reviews 컬렉션
```javascript
{
  jobId: "job123",
  contractorId: "contractor456",
  userId: "user789",
  ratings: {
    overall: 5,
    quality: 4,
    punctuality: 5,
    communication: 4,
    professionalism: 5,
    costSaving: 4
  },
  averageRating: 4.5,
  comment: "매우 만족스러운 시공이었습니다...",
  recommendToOthers: true,
  submittedAt: Timestamp,
  jobName: "커튼 설치",
  contractorName: "김시공"
}
```

### 2. jobs 컬렉션 업데이트
```javascript
{
  // 기존 작업 데이터...
  consumerReview: {
    // 위의 review 데이터와 동일
  },
  reviewSubmittedAt: Timestamp
}
```

### 3. contractors 컬렉션 업데이트
```javascript
{
  // 기존 계약자 데이터...
  reviewStats: {
    totalReviews: 25,
    averageRating: 4.3,
    totalRating: 107.5
  },
  lastReviewAt: Timestamp
}
```

## 컴포넌트 구조

### 1. StarRating 컴포넌트
```javascript
const StarRating = ({ category, value, onChange, label, description }) => {
  return (
    <div className="mb-6">
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      </div>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(category, star)}
            className={`text-2xl transition-colors ${
              star <= value
                ? "text-yellow-400 hover:text-yellow-500"
                : "text-gray-300 hover:text-gray-400"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
};
```

### 2. 상태 관리
```javascript
const [ratings, setRatings] = useState({
  overall: 0,
  quality: 0,
  punctuality: 0,
  communication: 0,
  professionalism: 0,
  costSaving: 0
});

const [comment, setComment] = useState("");
const [recommendToOthers, setRecommendToOthers] = useState(null);
```

## 유효성 검사

### 1. 필수 항목 검사
```javascript
// 전체 만족도 필수
if (ratings.overall === 0) {
  setError("전체 만족도를 선택해주세요.");
  return;
}

// 코멘트 필수
if (!comment.trim()) {
  setError("코멘트를 입력해주세요.");
  return;
}

// 추천 여부 필수
if (recommendToOthers === null) {
  setError("추천 여부를 선택해주세요.");
  return;
}
```

### 2. 데이터 검증
```javascript
// 평점 범위 검증
const validateRating = (rating) => {
  return rating >= 1 && rating <= 5;
};

// 코멘트 길이 검증
const validateComment = (comment) => {
  return comment.trim().length > 0 && comment.length <= 1000;
};
```

## 오류 처리

### 1. 로딩 상태
```javascript
if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">데이터를 불러오는 중...</p>
      </div>
    </div>
  );
}
```

### 2. 오류 상태
```javascript
if (error) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">오류가 발생했습니다</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    </div>
  );
}
```

### 3. 제출 완료 상태
```javascript
if (submitted) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <h3 className="text-xl font-medium text-green-800 mb-2">평가 감사합니다!</h3>
          <p className="text-green-700">소중한 의견을 주셔서 감사합니다.</p>
        </div>
      </div>
    </div>
  );
}
```

## 성능 최적화

### 1. 메모이제이션
```javascript
const averageRating = useMemo(() => {
  const validRatings = Object.values(ratings).filter(r => r > 0);
  return validRatings.length > 0
    ? Math.round(validRatings.reduce((a, b) => a + b, 0) / validRatings.length * 10) / 10
    : 0;
}, [ratings]);
```

### 2. 배치 업데이트
```javascript
const updateContractorStats = async (contractorId, reviewData) => {
  try {
    const contractorRef = doc(firestore, "contractors", contractorId);
    const contractorSnap = await getDoc(contractorRef);
    
    if (contractorSnap.exists()) {
      const contractorData = contractorSnap.data();
      const currentStats = contractorData.reviewStats || {
        totalReviews: 0,
        averageRating: 0,
        totalRating: 0
      };

      const newStats = {
        totalReviews: currentStats.totalReviews + 1,
        totalRating: currentStats.totalRating + reviewData.averageRating,
        averageRating: (currentStats.totalRating + reviewData.averageRating) / (currentStats.totalReviews + 1)
      };

      await updateDoc(contractorRef, {
        reviewStats: newStats,
        lastReviewAt: new Date()
      });
    }
  } catch (error) {
    console.error("Error updating contractor stats:", error);
  }
};
```

## 보안 고려사항

### 1. 데이터 검증
- 클라이언트 및 서버 사이드 검증
- 평점 범위 검증
- 코멘트 길이 및 내용 검증

### 2. 권한 관리
- 사용자 인증 확인
- 작업 소유자 확인
- 중복 평가 방지

### 3. 데이터 보호
- 개인정보 암호화
- 안전한 데이터 전송
- 접근 권한 제한

## 테스트

### 1. 단위 테스트
```javascript
describe('ReviewPage', () => {
  test('평점 계산이 올바르게 작동한다', () => {
    const ratings = { overall: 5, quality: 4, punctuality: 5 };
    const average = calculateAverageRating(ratings);
    expect(average).toBe(4.7);
  });

  test('유효성 검사가 올바르게 작동한다', () => {
    const result = validateReview({ ratings: {}, comment: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('전체 만족도를 선택해주세요.');
  });
});
```

### 2. 통합 테스트
```javascript
test('리뷰 제출이 올바르게 작동한다', async () => {
  const reviewData = {
    ratings: { overall: 5, quality: 4 },
    comment: '좋은 서비스였습니다.',
    recommendToOthers: true
  };

  await submitReview(reviewData);

  // Firestore에 데이터가 저장되었는지 확인
  const savedReview = await getReview(jobId);
  expect(savedReview).toMatchObject(reviewData);
});
```

## 확장 가능성

### 1. 추가 평점 카테고리
```javascript
const additionalCategories = {
  cleanliness: { label: "청소 상태", description: "작업 후 청소 상태" },
  safety: { label: "안전성", description: "안전 수칙 준수도" },
  materials: { label: "자재 품질", description: "사용된 자재의 품질" }
};
```

### 2. 사진 첨부 기능
```javascript
const [photos, setPhotos] = useState([]);

const handlePhotoUpload = async (files) => {
  // 사진 업로드 로직
  const uploadedPhotos = await uploadPhotos(files);
  setPhotos(prev => [...prev, ...uploadedPhotos]);
};
```

### 3. 평가 템플릿
```javascript
const reviewTemplates = {
  positive: "매우 만족스러운 시공이었습니다. 시간도 잘 지켜주시고 품질도 좋았습니다.",
  neutral: "전반적으로 만족스럽습니다. 몇 가지 개선사항이 있지만 좋은 서비스였습니다.",
  negative: "개선이 필요한 부분들이 있었습니다. 더 나은 서비스를 기대합니다."
};
```

## 모니터링 및 분석

### 1. 평가 통계
```javascript
const getReviewStats = async (contractorId) => {
  const reviews = await getReviews(contractorId);
  
  return {
    totalReviews: reviews.length,
    averageRating: calculateAverage(reviews.map(r => r.averageRating)),
    ratingDistribution: calculateDistribution(reviews),
    recommendationRate: calculateRecommendationRate(reviews)
  };
};
```

### 2. 트렌드 분석
```javascript
const analyzeTrends = (reviews) => {
  const monthlyStats = groupByMonth(reviews);
  const trends = calculateTrends(monthlyStats);
  
  return {
    ratingTrend: trends.rating,
    volumeTrend: trends.volume,
    categoryTrends: trends.categories
  };
};
```

## 결론

시공 평가 시스템은 고객과 시공업체 간의 소통을 개선하고, 서비스 품질 향상을 위한 중요한 피드백 시스템입니다. 다중 카테고리 평점, 상세한 코멘트, 자동 통계 업데이트 등의 기능을 통해 정확하고 유용한 평가 데이터를 수집할 수 있습니다.

이 시스템을 통해 시공업체는 자신의 서비스 품질을 객관적으로 파악하고 개선할 수 있으며, 고객은 만족스러운 서비스를 받을 수 있도록 도움을 줄 수 있습니다. 