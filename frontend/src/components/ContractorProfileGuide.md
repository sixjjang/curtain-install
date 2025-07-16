# 계약자 프로필 시스템 가이드

## 개요

계약자 프로필 시스템은 커튼 설치 플랫폼에서 계약자의 정보를 종합적으로 표시하고 관리하는 React 컴포넌트입니다. 이 시스템은 계약자의 성과, 평점, 등급, 전문 분야 등을 한눈에 확인할 수 있도록 설계되었습니다.

## 주요 기능

### 1. 종합적인 프로필 표시
- **기본 정보**: 이름, 등급, 평점, 완료 시공 건수
- **연락처**: 전화번호, 이메일
- **위치**: 활동 지역
- **경력**: 시공 경력 연수
- **인증**: 인증된 계약자 표시

### 2. 실시간 통계 시스템
- **총 수익**: 완료된 작업의 총 수익
- **평균 응답 시간**: 고객 문의에 대한 응답 시간
- **만족도**: 고객 만족도 백분율
- **시간 준수율**: 약속 시간 준수율

### 3. 등급 시스템 (5단계)
- **브론즈 (1등급)**: 기본 서비스
- **실버 (2등급)**: 우선 매칭
- **골드 (3등급)**: 프리미엄 매칭
- **플래티넘 (4등급)**: VIP 매칭
- **다이아몬드 (5등급)**: 최고 등급

### 4. 리뷰 시스템
- 최근 리뷰 표시
- 별점 시각화
- 리뷰 내용 표시
- 리뷰 날짜 표시

### 5. 연락 기능
- 전화 연락 기능
- 이메일 연락 기능
- 연락 이력 추적

## 컴포넌트 구조

### ContractorProfile 컴포넌트

```jsx
<ContractorProfile
  contractor={contractorData}
  showDetails={true}
  showReviews={true}
  showStats={true}
  onContact={handleContact}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `contractor` | Object | Required | 계약자 데이터 객체 |
| `showDetails` | Boolean | true | 상세 정보 표시 여부 |
| `showReviews` | Boolean | true | 리뷰 표시 여부 |
| `showStats` | Boolean | true | 통계 표시 여부 |
| `onContact` | Function | - | 연락 처리 콜백 함수 |

#### Contractor 데이터 구조

```javascript
{
  id: 'contractor_id',
  name: '계약자 이름',
  level: 4, // 1-5 등급
  rating: 4.8, // 평균 평점
  reviewCount: 127, // 리뷰 개수
  completedJobsCount: 89, // 완료 시공 건수
  photoQualityScore: 9.2, // 사진 품질 점수
  location: '서울시 강남구',
  experience: 8, // 경력 연수
  phone: '010-1234-5678',
  email: 'contractor@example.com',
  isVerified: true, // 인증 여부
  profileImage: 'image_url', // 프로필 이미지
  specialties: ['커튼 설치', '블라인드 설치'], // 전문 분야
  certifications: ['시공기사 자격증'], // 자격증
  availability: '평일 09:00-18:00' // 가용 시간
}
```

## 탭 시스템

### 1. 개요 (Overview)
- 핵심 지표 카드
- 완료 시공, 평균 평점, 사진 품질, 등급
- 빠른 통계 정보

### 2. 통계 (Statistics)
- 상세 통계 차트
- 만족도 및 시간 준수율
- 성과 지표 요약

### 3. 리뷰 (Reviews)
- 최근 리뷰 목록
- 별점 시각화
- 리뷰 내용 및 날짜

### 4. 상세정보 (Details)
- 개인 정보
- 전문 분야
- 자격증
- 가용 시간

## 등급 시스템 상세

### 등급별 색상
- **브론즈**: 회색 (bg-gray-100 text-gray-800)
- **실버**: 파란색 (bg-blue-100 text-blue-800)
- **골드**: 초록색 (bg-green-100 text-green-800)
- **플래티넘**: 보라색 (bg-purple-100 text-purple-800)
- **다이아몬드**: 노란색 (bg-yellow-100 text-yellow-800)

### 등급 상승 조건
1. **높은 평점**: 4.5점 이상 유지
2. **완료 작업 수**: 많은 시공 경험
3. **사진 품질**: 우수한 사진 품질 점수
4. **시간 준수**: 약속 시간 준수율
5. **고객 만족도**: 높은 고객 만족도

## 통계 계산 로직

### 총 수익 계산
```javascript
const totalEarnings = jobs.reduce((sum, job) => {
  return sum + (job.contractorPayment || 0);
}, 0);
```

### 평균 응답 시간
```javascript
const averageResponseTime = totalJobs > 0 
  ? totalResponseTime / totalJobs 
  : 0;
```

### 만족도 계산
```javascript
const satisfactionRate = reviewCount > 0 
  ? (totalSatisfaction / reviewCount) * 20 
  : 0; // 5점 만점을 100점으로 변환
```

### 시간 준수율
```javascript
const onTimeRate = totalJobs > 0 
  ? (onTimeCount / totalJobs) * 100 
  : 0;
```

## Firestore 데이터 구조

### 계약자 컬렉션 (contractors)
```javascript
{
  id: 'contractor_id',
  name: '계약자 이름',
  level: 4,
  rating: 4.8,
  reviewCount: 127,
  completedJobsCount: 89,
  photoQualityScore: 9.2,
  // ... 기타 필드
}
```

### 작업 컬렉션 (jobs)
```javascript
{
  id: 'job_id',
  contractorId: 'contractor_id',
  status: 'completed',
  contractorPayment: 500000,
  completedOnTime: true,
  responseTime: 30, // 분 단위
  // ... 기타 필드
}
```

### 리뷰 컬렉션 (contractorReviews)
```javascript
{
  id: 'review_id',
  contractorId: 'contractor_id',
  overallRating: 4.5,
  comment: '리뷰 내용',
  createdAt: Timestamp,
  // ... 기타 필드
}
```

## 사용 예시

### 기본 사용법
```jsx
import ContractorProfile from './ContractorProfile';

function App() {
  const contractor = {
    id: 'contractor1',
    name: '김철수',
    level: 4,
    rating: 4.8,
    // ... 기타 데이터
  };

  const handleContact = (type, contactInfo) => {
    if (type === 'phone') {
      window.open(`tel:${contactInfo}`);
    } else if (type === 'email') {
      window.open(`mailto:${contactInfo}`);
    }
  };

  return (
    <ContractorProfile
      contractor={contractor}
      onContact={handleContact}
    />
  );
}
```

### 조건부 렌더링
```jsx
<ContractorProfile
  contractor={contractor}
  showDetails={userRole === 'admin'}
  showReviews={true}
  showStats={userRole === 'seller'}
  onContact={handleContact}
/>
```

## 스타일링

### Tailwind CSS 클래스
- **컨테이너**: `max-w-4xl mx-auto bg-white rounded-xl shadow-lg border`
- **헤더**: `h-32 bg-gradient-to-r from-blue-500 to-purple-600`
- **프로필 이미지**: `w-32 h-32 bg-gray-200 rounded-full border-4 border-white`
- **탭**: `border-b border-gray-200`
- **카드**: `bg-gray-50 rounded-lg p-4`

### 반응형 디자인
- **모바일**: 단일 컬럼 레이아웃
- **태블릿**: 2컬럼 레이아웃
- **데스크톱**: 4컬럼 레이아웃

## 성능 최적화

### 1. 데이터 로딩
- 필요한 데이터만 조회
- 페이지네이션 적용
- 캐싱 활용

### 2. 렌더링 최적화
- React.memo 사용
- 불필요한 리렌더링 방지
- 가상화 적용 (대량 데이터)

### 3. 이미지 최적화
- WebP 포맷 사용
- 적절한 크기로 리사이징
- 지연 로딩 적용

## 에러 처리

### 1. 데이터 로딩 실패
```javascript
if (!contractor) {
  return (
    <div className="text-center py-12">
      <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        계약자 정보가 없습니다
      </h3>
      <p className="text-gray-500">계약자 데이터를 불러올 수 없습니다.</p>
    </div>
  );
}
```

### 2. 네트워크 에러
```javascript
try {
  await fetchContractorData();
} catch (error) {
  console.error("계약자 데이터 로드 오류:", error);
  // 에러 상태 처리
}
```

## 접근성 (Accessibility)

### 1. 키보드 네비게이션
- 모든 인터랙티브 요소에 키보드 접근 지원
- Tab 순서 최적화

### 2. 스크린 리더 지원
- 적절한 ARIA 라벨
- 의미있는 HTML 구조
- 대체 텍스트 제공

### 3. 색상 대비
- WCAG AA 기준 준수
- 색상만으로 정보 전달하지 않음

## 테스트

### 1. 단위 테스트
```javascript
import { render, screen } from '@testing-library/react';
import ContractorProfile from './ContractorProfile';

test('계약자 정보가 올바르게 표시되는지 확인', () => {
  const contractor = {
    name: '김철수',
    level: 4,
    rating: 4.8
  };

  render(<ContractorProfile contractor={contractor} />);
  
  expect(screen.getByText('김철수')).toBeInTheDocument();
  expect(screen.getByText('플래티넘')).toBeInTheDocument();
  expect(screen.getByText('4.8')).toBeInTheDocument();
});
```

### 2. 통합 테스트
- Firestore 연동 테스트
- 연락 기능 테스트
- 탭 전환 테스트

## 배포 고려사항

### 1. 환경 변수
```javascript
// .env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

### 2. 빌드 최적화
- 코드 스플리팅
- 번들 크기 최적화
- 이미지 압축

### 3. CDN 설정
- 정적 자산 캐싱
- Gzip 압축
- HTTP/2 지원

## 향후 개선 계획

### 1. 기능 추가
- 실시간 채팅
- 파일 공유
- 일정 관리
- 결제 시스템

### 2. 성능 개선
- 서버 사이드 렌더링
- Progressive Web App
- 오프라인 지원

### 3. 분석 도구
- Google Analytics
- 사용자 행동 분석
- A/B 테스트

## 결론

계약자 프로필 시스템은 커튼 설치 플랫폼의 핵심 기능으로, 계약자와 고객 간의 신뢰를 구축하고 효율적인 매칭을 지원합니다. 지속적인 개선과 사용자 피드백을 통해 더욱 완성도 높은 시스템으로 발전시켜 나갈 예정입니다. 