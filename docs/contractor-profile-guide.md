# 계약자 프로필 컴포넌트 가이드

## 개요

`ContractorProfile` 컴포넌트는 커튼 설치 플랫폼에서 계약자의 상세 정보를 표시하는 종합적인 프로필 페이지입니다. 계약자의 기본 정보, 평점, 리뷰, 통계, 등급 정보를 탭으로 구분하여 제공합니다.

## 주요 기능

### 1. 종합적인 프로필 표시
- **기본 정보**: 이름, 등급, 리뷰 수, 평균 평점
- **등급 시스템**: 5단계 등급 (브론즈~다이아몬드) 표시
- **주요 통계**: 추천률, 추천 수, 완료 작업 수

### 2. 탭 기반 정보 구성
- **개요**: 기본 정보와 주요 통계
- **평점 상세**: 카테고리별 평점과 평점 분포
- **최근 리뷰**: 최근 5개의 리뷰 표시
- **통계**: 상세한 통계 정보와 등급 정보

### 3. 실시간 데이터 연동
- Firestore에서 계약자 정보 실시간 조회
- 리뷰 데이터 자동 로딩
- 에러 처리 및 로딩 상태 관리

## 컴포넌트 구조

```jsx
import ContractorProfile from './components/ContractorProfile';

// 기본 사용법
<ContractorProfile contractorId="contractor_001" />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `contractorId` | string | Yes | 조회할 계약자의 고유 ID |

## 데이터 구조

### 계약자 데이터 (Firestore - contractors 컬렉션)

```javascript
{
  id: "contractor_001",
  name: "김철수",
  displayName: "김철수",
  level: 4, // 1-5 등급
  reviewStats: {
    totalReviews: 127,
    averageRating: 4.8,
    totalRating: 609.6,
    recommendationRate: 95.3,
    totalRecommendations: 121,
    ratingDistribution: {
      5: 89,
      4: 25,
      3: 10,
      2: 2,
      1: 1
    },
    categoryAverages: {
      overall: { average: 4.8, count: 127 },
      quality: { average: 4.9, count: 127 },
      punctuality: { average: 4.7, count: 127 },
      communication: { average: 4.6, count: 127 },
      professionalism: { average: 4.8, count: 127 },
      costSaving: { average: 4.5, count: 127 }
    }
  },
  completedJobsCount: 89,
  lastGradeUpdate: Timestamp,
  // 기타 계약자 정보...
}
```

### 리뷰 데이터 (Firestore - reviews 컬렉션)

```javascript
{
  id: "review_001",
  contractorId: "contractor_001",
  jobName: "강남구 커튼 설치",
  averageRating: 4.8,
  comment: "정말 만족스러운 시공이었습니다.",
  recommendToOthers: true,
  submittedAt: Timestamp,
  // 카테고리별 평점...
  ratings: {
    overall: 5,
    quality: 5,
    punctuality: 4,
    communication: 5,
    professionalism: 5,
    costSaving: 4
  }
}
```

## 등급 시스템

### 등급별 정보

| 등급 | 이름 | 색상 | 설명 |
|------|------|------|------|
| 1 | 브론즈 | bg-gray-500 | 기본 서비스 제공 |
| 2 | 실버 | bg-blue-500 | 우선 매칭, 기본 혜택 |
| 3 | 골드 | bg-yellow-500 | 프리미엄 매칭, 추가 혜택 |
| 4 | 플래티넘 | bg-purple-500 | VIP 매칭, 특별 혜택 |
| 5 | 다이아몬드 | bg-yellow-400 | 최고 등급, 모든 혜택 |

## 사용 예시

### 1. 기본 사용법

```jsx
import React from 'react';
import ContractorProfile from './components/ContractorProfile';

const App = () => {
  return (
    <div>
      <h1>계약자 프로필</h1>
      <ContractorProfile contractorId="contractor_001" />
    </div>
  );
};
```

### 2. 동적 계약자 ID 사용

```jsx
import React, { useState } from 'react';
import ContractorProfile from './components/ContractorProfile';

const ContractorSelector = () => {
  const [selectedContractorId, setSelectedContractorId] = useState('');

  return (
    <div>
      <select 
        value={selectedContractorId} 
        onChange={(e) => setSelectedContractorId(e.target.value)}
      >
        <option value="">계약자 선택</option>
        <option value="contractor_001">김철수</option>
        <option value="contractor_002">이영희</option>
        <option value="contractor_003">박민수</option>
      </select>

      {selectedContractorId && (
        <ContractorProfile contractorId={selectedContractorId} />
      )}
    </div>
  );
};
```

### 3. 라우팅과 함께 사용

```jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import ContractorProfile from './components/ContractorProfile';

const ContractorProfilePage = () => {
  const { contractorId } = useParams();

  return (
    <div>
      <ContractorProfile contractorId={contractorId} />
    </div>
  );
};
```

## 탭별 상세 정보

### 1. 개요 탭
- **기본 정보**: 이름, 등급, 총 리뷰 수, 평균 평점
- **주요 통계**: 추천률, 추천 수, 완료 작업 수

### 2. 평점 상세 탭
- **카테고리별 평점**: 
  - 전체 만족도
  - 시공 품질
  - 시간 준수
  - 의사소통
  - 전문성
  - 비용 절약
- **평점 분포**: 1점~5점별 분포와 퍼센티지

### 3. 최근 리뷰 탭
- 최근 5개의 리뷰 표시
- 평점, 날짜, 댓글, 추천 여부
- 작업명 표시

### 4. 통계 탭
- **평점 통계**: 총 리뷰 수, 평균 평점, 총 평점
- **추천 통계**: 추천 수, 추천률, 비추천 수
- **등급 정보**: 현재 등급, 설명, 업데이트 날짜

## 에러 처리

컴포넌트는 다음과 같은 에러 상황을 처리합니다:

1. **계약자를 찾을 수 없는 경우**
   - "계약자를 찾을 수 없습니다." 메시지 표시

2. **데이터 로딩 오류**
   - "데이터를 불러오는 중 오류가 발생했습니다." 메시지 표시

3. **로딩 상태**
   - 스피너와 "계약자 정보를 불러오는 중..." 메시지 표시

## 스타일링

컴포넌트는 Tailwind CSS를 사용하여 스타일링되어 있습니다:

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **모던 UI**: 카드 기반 레이아웃, 그림자, 둥근 모서리
- **색상 시스템**: 등급별 색상 구분, 상태별 색상 사용
- **애니메이션**: 로딩 스피너, 호버 효과

## 성능 최적화

1. **데이터 캐싱**: useEffect를 통한 효율적인 데이터 로딩
2. **조건부 렌더링**: 필요한 데이터만 표시
3. **메모이제이션**: 계산된 값들의 효율적인 처리
4. **에러 바운더리**: 에러 상황에서의 안정적인 처리

## 확장 가능성

### 1. 추가 기능 구현
- 계약자 연락 기능
- 리뷰 작성 기능
- 등급 변경 히스토리
- 작업 이력 표시

### 2. 커스터마이징
- 테마 변경
- 추가 탭 구현
- 데이터 필터링
- 정렬 옵션

### 3. 통합 가능성
- 관리자 대시보드
- 알림 시스템
- 분석 도구
- 보고서 생성

## 예시 컴포넌트

`ContractorProfileExample` 컴포넌트를 참조하여 실제 사용 방법을 확인할 수 있습니다:

```jsx
import ContractorProfileExample from './components/ContractorProfileExample';

// 예시 컴포넌트 사용
<ContractorProfileExample />
```

## 주의사항

1. **Firestore 설정**: Firebase 프로젝트와 Firestore 데이터베이스가 올바르게 설정되어야 합니다.
2. **데이터 구조**: 계약자와 리뷰 데이터가 지정된 구조로 저장되어야 합니다.
3. **권한 설정**: Firestore 보안 규칙이 적절히 설정되어야 합니다.
4. **네트워크**: 인터넷 연결이 필요합니다.

## 문제 해결

### 일반적인 문제들

1. **데이터가 로드되지 않는 경우**
   - Firestore 연결 확인
   - 계약자 ID 확인
   - 보안 규칙 확인

2. **스타일이 적용되지 않는 경우**
   - Tailwind CSS 설치 확인
   - CSS 번들링 확인

3. **성능 문제**
   - 데이터 인덱싱 확인
   - 불필요한 리렌더링 확인

## 업데이트 로그

- **v2.0**: 탭 기반 UI, 상세 통계, 등급 시스템 추가
- **v1.0**: 기본 프로필 표시 기능

## 라이선스

이 컴포넌트는 MIT 라이선스 하에 배포됩니다. 