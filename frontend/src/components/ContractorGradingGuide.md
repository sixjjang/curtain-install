# 계약자 등급 시스템 가이드

## 개요

이 가이드는 커튼 설치 플랫폼의 계약자 등급 시스템에 대한 상세한 설명과 사용법을 제공합니다. 5단계 등급 시스템을 통해 계약자의 성과를 종합적으로 평가하고, 지속적인 개선을 유도합니다.

## 등급 시스템 구조

### 5단계 등급 체계

| 등급 | 이름 | 색상 | 설명 |
|------|------|------|------|
| 1 | 브론즈 | 회색 | 기본 서비스 제공 |
| 2 | 실버 | 파란색 | 우선 매칭, 기본 혜택 |
| 3 | 골드 | 초록색 | 프리미엄 매칭, 추가 혜택 |
| 4 | 플래티넘 | 보라색 | VIP 매칭, 특별 혜택 |
| 5 | 다이아몬드 | 노란색 | 최고 등급, 모든 혜택 |

### 등급별 기준

#### 브론즈 (1등급)
- **완료 작업 수**: 0건 이상
- **평균 평점**: 0점 이상
- **사진 품질 점수**: 0점 이상
- **응답 시간**: 120분 이하
- **시간 준수율**: 0% 이상
- **고객 만족도**: 0% 이상

#### 실버 (2등급)
- **완료 작업 수**: 10건 이상
- **평균 평점**: 3.5점 이상
- **사진 품질 점수**: 3.0점 이상
- **응답 시간**: 90분 이하
- **시간 준수율**: 70% 이상
- **고객 만족도**: 70% 이상

#### 골드 (3등급)
- **완료 작업 수**: 25건 이상
- **평균 평점**: 4.0점 이상
- **사진 품질 점수**: 4.0점 이상
- **응답 시간**: 60분 이하
- **시간 준수율**: 80% 이상
- **고객 만족도**: 80% 이상

#### 플래티넘 (4등급)
- **완료 작업 수**: 50건 이상
- **평균 평점**: 4.3점 이상
- **사진 품질 점수**: 4.5점 이상
- **응답 시간**: 45분 이하
- **시간 준수율**: 90% 이상
- **고객 만족도**: 85% 이상

#### 다이아몬드 (5등급)
- **완료 작업 수**: 100건 이상
- **평균 평점**: 4.5점 이상
- **사진 품질 점수**: 4.8점 이상
- **응답 시간**: 30분 이하
- **시간 준수율**: 95% 이상
- **고객 만족도**: 90% 이상

## 가중 점수 시스템

### 가중치 설정
각 평가 항목에 가중치를 적용하여 종합 점수를 계산합니다:

- **완료 작업 수**: 25% (0.25)
- **평균 평점**: 30% (0.30)
- **사진 품질 점수**: 20% (0.20)
- **응답 시간**: 15% (0.15)
- **시간 준수율**: 10% (0.10)

### 점수 계산 방식
1. **완료 작업 수**: (작업 수 / 100) × 100 (최대 100점)
2. **평균 평점**: (평점 / 5) × 100
3. **사진 품질 점수**: (점수 / 10) × 100
4. **응답 시간**: 100 - (응답 시간 / 2) (빠를수록 높은 점수)
5. **시간 준수율**: 그대로 사용

## 주요 기능

### 1. 기본 등급 결정
```javascript
import { determineContractorLevel } from '../utils/contractorGrading';

const contractorData = {
  completedJobsCount: 35,
  averageRating: 4.2,
  photoQualityScore: 4.3,
  responseTime: 45,
  onTimeRate: 85,
  satisfactionRate: 82
};

const level = determineContractorLevel(contractorData);
console.log(`계약자 등급: ${level}등급`);
```

### 2. 가중 점수 계산
```javascript
import { calculateWeightedScore } from '../utils/contractorGrading';

const weightedScore = calculateWeightedScore(contractorData);
console.log(`가중 점수: ${weightedScore.toFixed(1)}점`);
```

### 3. 상세 분석
```javascript
import { analyzeContractorGrade } from '../utils/contractorGrading';

const analysis = analyzeContractorGrade(contractorData);
console.log('현재 등급:', analysis.currentGrade.name);
console.log('다음 등급:', analysis.nextGrade?.name);
console.log('강점:', analysis.strengths);
console.log('개선점:', analysis.improvements);
```

### 4. 등급 상승 예상
```javascript
import { calculateGradeUpgradeProjection } from '../utils/contractorGrading';

const projections = {
  completedJobsPerMonth: 5,
  ratingImprovementPerMonth: 0.1,
  photoQualityImprovementPerMonth: 0.2,
  responseTimeImprovementPerMonth: 5,
  onTimeRateImprovementPerMonth: 2,
  satisfactionRateImprovementPerMonth: 1
};

const projection = calculateGradeUpgradeProjection(contractorData, projections);
console.log('등급 상승 가능:', projection.canUpgrade);
console.log('예상 소요 기간:', projection.estimatedMonths);
```

### 5. 등급별 혜택 조회
```javascript
import { getGradeBenefits } from '../utils/contractorGrading';

const benefits = getGradeBenefits(level);
console.log('등급 혜택:', benefits.benefits);
```

### 6. 통계 생성
```javascript
import { generateGradeStatistics } from '../utils/contractorGrading';

const statistics = generateGradeStatistics(contractors);
console.log('등급별 분포:', statistics.byGrade);
console.log('상위 성과자:', statistics.topPerformers);
```

## React 컴포넌트 사용법

### 기본 사용법
```jsx
import ContractorGradingExample from './ContractorGradingExample';

function App() {
  return (
    <div>
      <ContractorGradingExample />
    </div>
  );
}
```

### 고급 분석 사용법
```jsx
import { advancedContractorGrading } from '../utils/contractorGrading';

const result = advancedContractorGrading({
  contractor: contractorData,
  includeAnalysis: true,
  includeProjections: true,
  projections: monthlyImprovements,
  includeStatistics: true,
  allContractors: contractorsList
});
```

## 데이터 구조

### 계약자 데이터 형식
```javascript
const contractorData = {
  // 필수 필드
  completedJobsCount: 35,        // 완료 작업 수
  averageRating: 4.2,            // 평균 평점 (1-5)
  photoQualityScore: 4.3,        // 사진 품질 점수 (1-10)
  responseTime: 45,              // 평균 응답 시간 (분)
  onTimeRate: 85,                // 시간 준수율 (%)
  satisfactionRate: 82,          // 고객 만족도 (%)
  
  // 선택적 필드
  id: 'contractor123',           // 계약자 ID
  name: '김철수',                // 계약자 이름
  email: 'kim@example.com',      // 이메일
  phone: '010-1234-5678'         // 전화번호
};
```

### 분석 결과 형식
```javascript
const analysis = {
  currentLevel: 3,               // 현재 등급
  currentGrade: {                // 현재 등급 정보
    name: '골드',
    color: 'green',
    description: '프리미엄 매칭, 추가 혜택'
  },
  weightedScore: 78.5,           // 가중 점수
  nextLevel: 4,                  // 다음 등급
  nextGrade: {                   // 다음 등급 정보
    name: '플래티넘',
    color: 'purple',
    description: 'VIP 매칭, 특별 혜택'
  },
  requirements: {                // 다음 등급 요구사항
    completedJobsCount: 15,      // 추가 필요 작업 수
    averageRating: 0.1,          // 평점 개선 필요
    photoQualityScore: 0.2,      // 사진 품질 개선 필요
    responseTime: 0,             // 응답 시간 개선 필요
    onTimeRate: 5,               // 시간 준수율 개선 필요
    satisfactionRate: 3          // 만족도 개선 필요
  },
  strengths: [                   // 강점 목록
    '우수한 고객 만족도',
    '높은 사진 품질'
  ],
  improvements: [                // 개선점 목록
    '더 많은 작업 경험 필요'
  ]
};
```

## 등급별 혜택

### 브론즈 혜택
- 기본 서비스 이용 가능
- 일반적인 매칭 시스템 이용

### 실버 혜택
- 일반 계약자보다 우선적으로 매칭
- 기본 할인 및 혜택 제공
- 검색 결과에서 프로필 강조 표시

### 골드 혜택
- 고품질 고객과 우선 매칭
- 수수료 할인 및 추가 혜택
- 전용 고객 지원 서비스
- 프로모션 및 마케팅 지원

### 플래티넘 혜택
- 최고급 고객과 전용 매칭
- 대폭 수수료 할인 및 특별 혜택
- 24시간 우선 고객 지원
- 전용 마케팅 캠페인 지원
- 전용 교육 및 트레이닝 프로그램

### 다이아몬드 혜택
- 플랫폼 최고 등급 혜택
- 모든 등급의 혜택을 누릴 수 있음
- 전용 계정 매니저 배정
- 모든 지원에서 최우선 처리
- 플랫폼 파트너십 기회
- 플랫폼 수익 공유 프로그램

## 모니터링 및 관리

### 주요 지표
1. **등급 분포**: 전체 계약자의 등급별 분포
2. **평균 점수**: 전체 계약자의 평균 성과 점수
3. **상위 성과자**: 가중 점수 기준 상위 10명
4. **개선 후보자**: 다음 등급 근접자 10명

### 관리 팁
1. **정기적인 평가**: 월 1회 등급 재평가
2. **개선 계획 수립**: 개별 계약자별 맞춤 개선 계획
3. **인센티브 제공**: 등급 상승 시 추가 혜택 제공
4. **교육 프로그램**: 등급별 맞춤 교육 제공

## 에러 처리

### 입력값 검증
- 모든 수치는 유효한 범위 내에서만 처리
- 음수 값은 0으로 변환
- 최대값 초과 시 최대값으로 제한

### 예외 상황
- 데이터 누락 시 기본값 사용
- 계산 오류 시 안전한 기본값 반환
- 네트워크 오류 시 로컬 캐시 사용

## 성능 최적화

### 계산 최적화
- 메모이제이션을 통한 중복 계산 방지
- 배치 처리를 통한 대량 데이터 처리
- 인덱싱을 통한 빠른 검색

### UI 최적화
- 가상화를 통한 대량 데이터 렌더링
- 지연 로딩을 통한 초기 로딩 시간 단축
- 캐싱을 통한 반복 요청 최소화

## 확장성

### 새로운 평가 기준 추가
1. `GRADE_CRITERIA`에 새로운 기준 추가
2. `WEIGHTS`에 가중치 설정
3. `validateInputs` 함수에 검증 로직 추가
4. UI 컴포넌트에 입력 필드 추가

### 새로운 등급 추가
1. `GRADE_CRITERIA`에 새로운 등급 정보 추가
2. 등급별 혜택 정보 업데이트
3. UI 컴포넌트의 색상 및 스타일 업데이트

## 보안 고려사항

### 데이터 보호
- 개인정보 암호화 저장
- 접근 권한 관리
- 감사 로그 기록

### 계산 무결성
- 서버 사이드 검증
- 클라이언트 사이드 검증
- 데이터 일관성 확인

## 테스트

### 단위 테스트
```javascript
// 등급 결정 테스트
test('브론즈 등급 결정', () => {
  const data = { completedJobsCount: 5, averageRating: 3.0 };
  expect(determineContractorLevel(data)).toBe(1);
});

// 가중 점수 테스트
test('가중 점수 계산', () => {
  const data = { completedJobsCount: 50, averageRating: 4.5 };
  const score = calculateWeightedScore(data);
  expect(score).toBeGreaterThan(0);
  expect(score).toBeLessThanOrEqual(100);
});
```

### 통합 테스트
```javascript
// 전체 분석 테스트
test('전체 분석 기능', () => {
  const result = advancedContractorGrading({
    contractor: sampleData,
    includeAnalysis: true,
    includeProjections: true
  });
  
  expect(result.level).toBeDefined();
  expect(result.analysis).toBeDefined();
  expect(result.projection).toBeDefined();
});
```

## 결론

이 계약자 등급 시스템은 계약자의 성과를 종합적으로 평가하고, 지속적인 개선을 유도하는 체계적인 시스템입니다. 5단계 등급 체계와 가중 점수 시스템을 통해 공정하고 객관적인 평가가 가능하며, 등급별 혜택을 통해 계약자의 동기부여를 높일 수 있습니다.

시스템의 확장성과 유지보수성을 고려하여 설계되었으며, 새로운 요구사항에 따라 쉽게 확장할 수 있습니다. 정기적인 모니터링과 개선을 통해 플랫폼의 전반적인 서비스 품질을 향상시킬 수 있습니다. 