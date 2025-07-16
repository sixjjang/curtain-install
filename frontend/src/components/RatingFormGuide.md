# 평가 폼 시스템 가이드

## 개요

평가 폼 시스템은 커튼 설치 플랫폼에서 계약자, 판매자, 프로젝트 등 다양한 대상에 대한 종합적인 평가를 수집하는 React 컴포넌트입니다. 다중 카테고리 평가, 별점 시스템, 실시간 계산, 그리고 상세한 검증 기능을 제공합니다.

## 주요 기능

### 1. 다중 카테고리 평가
- **품질**: 작업 완성도와 품질
- **시간 준수**: 약속 시간 준수도
- **의사소통**: 소통과 협조
- **전문성**: 전문 지식과 태도
- **종합 평가**: 전체적인 만족도

### 2. 직관적인 별점 시스템
- 5점 만점 별점 인터페이스
- 호버 효과와 시각적 피드백
- 실시간 평점 텍스트 표시

### 3. 실시간 계산
- 평균 평점 자동 계산
- 실시간 업데이트
- 소수점 1자리까지 정확한 계산

### 4. 상세 검증
- 필수 입력 항목 검증
- 글자 수 제한 (10-500자)
- 실시간 에러 표시

### 5. 성공 피드백
- 시각적 성공 메시지
- 자동 폼 초기화
- 콜백 함수 지원

## 컴포넌트 구조

### RatingForm Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `targetId` | String | Required | 평가 대상 ID |
| `raterId` | String | Required | 평가자 ID |
| `role` | String | Required | 평가자 역할 |
| `targetName` | String | "대상" | 평가 대상 이름 |
| `onSuccess` | Function | - | 성공 시 콜백 |
| `onCancel` | Function | - | 취소 시 콜백 |
| `categories` | Array | Default | 평가 카테고리 설정 |

### 기본 카테고리 설정

```javascript
const defaultCategories = [
  { key: 'quality', label: '품질', description: '작업 품질과 완성도' },
  { key: 'punctuality', label: '시간 준수', description: '약속 시간 준수' },
  { key: 'communication', label: '의사소통', description: '소통과 협조' },
  { key: 'professionalism', label: '전문성', description: '전문 지식과 태도' },
  { key: 'overall', label: '종합 평가', description: '전체적인 만족도' }
];
```

## Firestore 데이터 구조

### ratings 컬렉션

```javascript
{
  id: 'rating_id',
  targetId: 'contractor_123',
  raterId: 'seller_456',
  role: 'seller',
  ratings: {
    quality: 5,
    punctuality: 4,
    communication: 5,
    professionalism: 4,
    overall: 5
  },
  averageRating: 4.6,
  comment: '매우 만족스러운 작업이었습니다...',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 사용 예시

### 기본 사용법

```jsx
import RatingForm from './RatingForm';

function App() {
  const handleRatingSuccess = (ratingData) => {
    console.log('평가 완료:', ratingData);
  };

  return (
    <RatingForm
      targetId="contractor_123"
      raterId="seller_456"
      role="seller"
      targetName="김철수 (계약자)"
      onSuccess={handleRatingSuccess}
    />
  );
}
```

### 커스텀 카테고리

```jsx
const customCategories = [
  { key: 'planning', label: '계획 수립', description: '프로젝트 계획과 준비' },
  { key: 'execution', label: '실행 과정', description: '실제 작업 진행' },
  { key: 'quality', label: '결과 품질', description: '최종 결과물 품질' },
  { key: 'overall', label: '종합 평가', description: '전체적인 만족도' }
];

<RatingForm
  targetId="project_123"
  raterId="user_456"
  role="both"
  targetName="강남구 커튼 설치 프로젝트"
  categories={customCategories}
  onSuccess={handleSuccess}
  onCancel={handleCancel}
/>
```

### 모달 형태 사용

```jsx
function ModalRatingForm() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button onClick={() => setShowForm(true)}>
        평가 작성
      </button>
      
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <RatingForm
            targetId="target_123"
            raterId="user_456"
            role="seller"
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </>
  );
}
```

## 평가 로직

### 평점 계산

```javascript
// 평균 평점 계산
const averageRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / Object.keys(ratings).length;

// 소수점 1자리까지 반올림
const roundedAverage = Math.round(averageRating * 10) / 10;
```

### 평점 텍스트 변환

```javascript
const getRatingText = (rating) => {
  if (rating >= 4.5) return "매우 만족";
  if (rating >= 4.0) return "만족";
  if (rating >= 3.0) return "보통";
  if (rating >= 2.0) return "불만족";
  return "매우 불만족";
};
```

### 평점 색상

```javascript
const getRatingColor = (rating) => {
  if (rating >= 4.5) return "text-green-600";
  if (rating >= 4.0) return "text-blue-600";
  if (rating >= 3.0) return "text-yellow-600";
  if (rating >= 2.0) return "text-orange-600";
  return "text-red-600";
};
```

## 검증 시스템

### 1. 필수 입력 검증

```javascript
const validateForm = () => {
  const errors = {};
  
  // 카테고리별 평가 검증
  categories.forEach(category => {
    if (!ratings[category.key] || ratings[category.key] < 1) {
      errors[category.key] = `${category.label} 평가를 선택해주세요.`;
    }
  });

  // 코멘트 검증
  if (!comment.trim()) {
    errors.comment = "평가 내용을 입력해주세요.";
  } else if (comment.trim().length < 10) {
    errors.comment = "평가 내용은 최소 10자 이상 입력해주세요.";
  } else if (comment.trim().length > 500) {
    errors.comment = "평가 내용은 최대 500자까지 입력 가능합니다.";
  }

  return errors;
};
```

### 2. 실시간 검증

```javascript
const handleRatingChange = (category, value) => {
  setRatings(prev => ({
    ...prev,
    [category]: value
  }));
  
  // 에러 제거
  if (errors[category]) {
    setErrors(prev => ({
      ...prev,
      [category]: null
    }));
  }
};
```

## UI/UX 특징

### 1. 별점 인터페이스

```jsx
const renderStars = (category, value) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <button
        key={i}
        onClick={() => handleRatingChange(category, i)}
        className={`p-1 transition-colors ${
          i <= value 
            ? 'text-yellow-400 hover:text-yellow-500' 
            : 'text-gray-300 hover:text-gray-400'
        }`}
      >
        <StarIcon className="h-6 w-6" />
      </button>
    );
  }
  return stars;
};
```

### 2. 실시간 평균 표시

```jsx
<div className="mt-6 p-4 bg-blue-50 rounded-lg">
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-blue-900">평균 평점</span>
    <div className="text-right">
      <div className="text-2xl font-bold text-blue-600">
        {averageRating.toFixed(1)}점
      </div>
      <div className={`text-sm ${getRatingColor(averageRating)}`}>
        {getRatingText(averageRating)}
      </div>
    </div>
  </div>
</div>
```

### 3. 성공 피드백

```jsx
if (showSuccess) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          평가가 성공적으로 등록되었습니다!
        </h3>
        <p className="text-gray-600">
          {targetName}에 대한 평가가 완료되었습니다.
        </p>
      </div>
    </div>
  );
}
```

## 성능 최적화

### 1. 메모이제이션

```jsx
import { useMemo } from 'react';

const averageRating = useMemo(() => {
  return Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / Object.keys(ratings).length;
}, [ratings]);
```

### 2. 디바운싱

```jsx
import { useCallback } from 'react';
import { debounce } from 'lodash';

const debouncedValidation = useCallback(
  debounce((ratings, comment) => {
    const errors = validateForm(ratings, comment);
    setErrors(errors);
  }, 300),
  []
);
```

### 3. 지연 로딩

```jsx
const RatingForm = React.lazy(() => import('./RatingForm'));

function App() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <RatingForm {...props} />
    </Suspense>
  );
}
```

## 에러 처리

### 1. 네트워크 에러

```javascript
try {
  await addDoc(collection(firestore, "ratings"), ratingData);
  setShowSuccess(true);
} catch (error) {
  console.error("평가 등록 오류:", error);
  setErrors({ submit: "평가 등록 중 오류가 발생했습니다. 다시 시도해주세요." });
}
```

### 2. 유효성 검사 에러

```javascript
const validateForm = () => {
  const newErrors = {};
  
  // 입력값 검증
  if (!targetId || !raterId || !role) {
    newErrors.general = "필수 정보가 누락되었습니다.";
  }
  
  // 평점 검증
  Object.entries(ratings).forEach(([category, rating]) => {
    if (rating < 1 || rating > 5) {
      newErrors[category] = "유효하지 않은 평점입니다.";
    }
  });
  
  return newErrors;
};
```

## 접근성 (Accessibility)

### 1. 키보드 네비게이션

```jsx
<button
  onClick={() => handleRatingChange(category, i)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRatingChange(category, i);
    }
  }}
  aria-label={`${category} ${i}점`}
  tabIndex={0}
>
  <StarIcon className="h-6 w-6" />
</button>
```

### 2. 스크린 리더 지원

```jsx
<div role="group" aria-labelledby="rating-label">
  <div id="rating-label" className="sr-only">품질 평가</div>
  {renderStars('quality', ratings.quality)}
</div>
```

### 3. 색상 대비

```css
/* WCAG AA 기준 준수 */
.rating-star {
  color: #fbbf24; /* 충분한 대비 */
}

.rating-star:hover {
  color: #f59e0b; /* 호버 시 더 명확한 대비 */
}
```

## 테스트

### 1. 단위 테스트

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import RatingForm from './RatingForm';

describe('RatingForm', () => {
  test('별점 클릭 시 평점이 업데이트되는지 확인', () => {
    render(<RatingForm targetId="test" raterId="user" role="seller" />);
    
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[4]); // 5점 클릭
    
    expect(screen.getByText('5점')).toBeInTheDocument();
  });

  test('평가 내용이 10자 미만일 때 에러 표시', () => {
    render(<RatingForm targetId="test" raterId="user" role="seller" />);
    
    const textarea = screen.getByPlaceholderText(/평가 내용을 입력해주세요/);
    fireEvent.change(textarea, { target: { value: '짧음' } });
    
    const submitButton = screen.getByText('평가 등록');
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/평가 내용은 최소 10자 이상/)).toBeInTheDocument();
  });
});
```

### 2. 통합 테스트

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { addDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');

describe('RatingForm Integration', () => {
  test('평가 제출 시 Firestore에 저장되는지 확인', async () => {
    addDoc.mockResolvedValue({ id: 'test-id' });
    
    render(<RatingForm targetId="test" raterId="user" role="seller" />);
    
    // 별점 선택
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[4]);
    
    // 평가 내용 입력
    const textarea = screen.getByPlaceholderText(/평가 내용을 입력해주세요/);
    fireEvent.change(textarea, { target: { value: '매우 만족스러운 작업이었습니다.' } });
    
    // 제출
    const submitButton = screen.getByText('평가 등록');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          targetId: 'test',
          raterId: 'user',
          role: 'seller'
        })
      );
    });
  });
});
```

## 배포 고려사항

### 1. 환경 변수

```javascript
// .env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

### 2. 번들 최적화

```javascript
// 필요한 함수만 import
import { addDoc, serverTimestamp } from 'firebase/firestore';

// 전체 import는 개발 시에만
import * as firebase from 'firebase/firestore';
```

### 3. 에러 모니터링

```javascript
import * as Sentry from '@sentry/react';

const submitRating = async () => {
  try {
    await addDoc(collection(firestore, "ratings"), ratingData);
  } catch (error) {
    Sentry.captureException(error);
    setErrors({ submit: "평가 등록 중 오류가 발생했습니다." });
  }
};
```

## 향후 개선 계획

### 1. 기능 추가
- 이미지 첨부 기능
- 음성 평가 기능
- 평가 템플릿 시스템
- 평가 분석 대시보드

### 2. 성능 개선
- 가상화된 평가 목록
- 서버 사이드 렌더링
- Progressive Web App 지원

### 3. 사용자 경험
- 애니메이션 효과
- 드래그 앤 드롭 인터페이스
- 모바일 최적화
- 다국어 지원

## 결론

평가 폼 시스템은 사용자 친화적인 인터페이스와 강력한 검증 기능을 통해 신뢰할 수 있는 평가 데이터를 수집합니다. 지속적인 개선과 사용자 피드백을 통해 더욱 완성도 높은 평가 시스템으로 발전시켜 나갈 예정입니다. 