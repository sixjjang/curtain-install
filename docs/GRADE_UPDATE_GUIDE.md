# 시공기사 등급 업데이트 시스템 가이드

## 개요

이 시스템은 평가 데이터를 기반으로 시공기사의 등급을 자동으로 계산하고 업데이트하는 종합적인 솔루션입니다. 기존의 단순한 평점 기반 등급 시스템을 상세한 카테고리별 평가 시스템으로 확장하여 더 정확하고 공정한 등급 산정이 가능합니다.

## 주요 기능

### 1. 상세 평가 시스템 지원
- **카테고리별 평가**: 품질, 시간 준수, 비용 절약, 의사소통, 전문성
- **가중치 적용**: 각 카테고리별로 다른 가중치 적용
- **트렌드 분석**: 최근 평가의 변화 추이 분석
- **권장사항 생성**: 등급 향상을 위한 구체적인 권장사항 제공

### 2. 다양한 업데이트 방식
- **개별 업데이트**: 특정 시공기사의 등급만 업데이트
- **배치 업데이트**: 선택된 여러 시공기사를 한 번에 업데이트
- **필터 업데이트**: 특정 조건에 맞는 모든 시공기사 업데이트

### 3. 자동화 기능
- **자동 알림**: 등급 변경 시 시공기사에게 푸시 알림 및 이메일 발송
- **변경 로그**: 모든 등급 변경 사항을 자동으로 기록
- **이력 관리**: 등급 변경 이력을 배열로 저장하여 추적 가능

## 시스템 구조

### Firebase Cloud Functions

```javascript
// functions/updateContractorGradeFromEvaluations.js
const { updateContractorGrade, batchUpdateContractorGrades, updateGradesByFilter } = require('./updateContractorGradeFromEvaluations');
```

#### 주요 함수들

1. **updateContractorGrade(contractorId, options)**
   - 개별 시공기사 등급 업데이트
   - 옵션: 알림 발송, 로그 기록, 강제 업데이트

2. **batchUpdateContractorGrades(contractorIds, options)**
   - 여러 시공기사 배치 업데이트
   - 결과 통계 제공

3. **updateGradesByFilter(filters, options)**
   - 필터 조건에 맞는 시공기사들 업데이트
   - 활성 상태, 등급, 최소 평가 수 등으로 필터링

### React 컴포넌트

```javascript
// frontend/src/components/GradeUpdateManager.js
import GradeUpdateManager from './GradeUpdateManager';
```

#### 주요 기능
- 시공기사 목록 조회 및 필터링
- 개별/배치 업데이트 UI
- 실시간 결과 표시
- 등급 변경 이력 확인

## 사용 방법

### 1. 기본 사용법

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const updateContractorGrade = httpsCallable(functions, 'updateContractorGrade');

// 개별 업데이트
const result = await updateContractorGrade({
  contractorId: 'contractor123',
  options: {
    sendNotification: true,
    logChanges: true,
    forceUpdate: false
  }
});
```

### 2. 배치 업데이트

```javascript
const batchUpdateContractorGrades = httpsCallable(functions, 'batchUpdateContractorGrades');

const result = await batchUpdateContractorGrades({
  contractorIds: ['contractor1', 'contractor2', 'contractor3'],
  options: {
    sendNotification: true,
    logChanges: true
  }
});

console.log(`성공: ${result.data.successful}명, 실패: ${result.data.failed}명, 등급 변경: ${result.data.gradeChanges}명`);
```

### 3. 필터 기반 업데이트

```javascript
const updateGradesByFilter = httpsCallable(functions, 'updateGradesByFilter');

const result = await updateGradesByFilter({
  filters: {
    active: true,
    grade: 'B',
    minEvaluations: 5
  },
  options: {
    sendNotification: true,
    logChanges: true
  }
});
```

### 4. React 컴포넌트 사용

```javascript
import GradeUpdateManager from './components/GradeUpdateManager';

function AdminDashboard() {
  return (
    <div>
      <h1>관리자 대시보드</h1>
      <GradeUpdateManager />
    </div>
  );
}
```

## 등급 계산 로직

### 1. 기본 등급 기준

```javascript
const GRADE_CRITERIA = {
  A: { minRating: 4.5, minEvaluations: 10, description: "최고 등급" },
  B: { minRating: 3.5, minEvaluations: 5, description: "우수 등급" },
  C: { minRating: 2.5, minEvaluations: 3, description: "일반 등급" },
  D: { minRating: 0, minEvaluations: 1, description: "개선 필요" }
};
```

### 2. 카테고리별 가중치

```javascript
const CATEGORY_WEIGHTS = {
  quality: 0.3,        // 품질 (30%)
  punctuality: 0.2,    // 시간 준수 (20%)
  costSaving: 0.2,     // 비용 절약 (20%)
  communication: 0.15, // 의사소통 (15%)
  professionalism: 0.15 // 전문성 (15%)
};
```

### 3. 계산 과정

1. **평가 데이터 수집**: 해당 시공기사의 모든 평가 데이터 조회
2. **카테고리별 평균 계산**: 각 카테고리별 평균 점수 계산
3. **가중 평균 계산**: 가중치를 적용한 최종 평점 계산
4. **등급 결정**: 평점과 평가 수를 기준으로 등급 결정
5. **트렌드 분석**: 최근 평가의 변화 추이 분석
6. **권장사항 생성**: 등급 향상을 위한 구체적인 권장사항 생성

## 데이터 구조

### 시공기사 문서 구조

```javascript
{
  id: "contractor123",
  grade: "A",
  averageRating: 4.7,
  totalRatings: 15,
  lastGradeUpdate: Timestamp,
  gradeDetails: {
    categoryScores: {
      quality: 4.8,
      punctuality: 4.5,
      costSaving: 4.6,
      communication: 4.7,
      professionalism: 4.9
    },
    recommendations: ["의사소통 개선 필요", "전문성 우수"],
    recentTrend: "improving"
  },
  gradeHistory: [
    {
      fromGrade: "B",
      toGrade: "A",
      date: Timestamp,
      averageRating: 4.7,
      totalRatings: 15,
      reason: "평가 기반 자동 업데이트"
    }
  ]
}
```

### 평가 문서 구조

```javascript
{
  id: "evaluation123",
  contractorId: "contractor123",
  projectId: "project456",
  ratings: {
    quality: 5,
    punctuality: 4,
    costSaving: 5,
    communication: 4,
    professionalism: 5
  },
  averageRating: 4.6,
  comment: "전반적으로 만족스러운 작업이었습니다.",
  status: "submitted",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 알림 시스템

### 1. 푸시 알림

```javascript
const notificationData = {
  title: "등급 변경 알림",
  body: `귀하의 등급이 ${oldGrade}에서 ${newGrade}로 변경되었습니다.`,
  data: {
    type: "grade_change",
    contractorId,
    oldGrade,
    newGrade,
    averageRating
  }
};
```

### 2. 이메일 알림

등급 변경 시 시공기사에게 자동으로 이메일 알림 발송 (선택사항)

## 로그 시스템

### 등급 변경 로그

```javascript
{
  contractorId: "contractor123",
  contractorName: "김철수",
  oldGrade: "B",
  newGrade: "A",
  averageRating: 4.7,
  totalRatings: 15,
  changeDate: Timestamp,
  categoryScores: { ... },
  recommendations: [ ... ],
  changeType: "evaluation_based",
  source: "automatic_update"
}
```

## 보안 및 권한

### 1. 관리자 권한 확인

```javascript
// Firebase Functions에서 관리자 권한 확인
if (!context.auth || !context.auth.token.admin) {
  throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
}
```

### 2. 입력 검증

```javascript
if (!contractorId) {
  throw new functions.https.HttpsError('invalid-argument', '시공기사 ID가 필요합니다.');
}
```

## 에러 처리

### 1. 일반적인 에러 상황

- **시공기사 없음**: 해당 ID의 시공기사가 존재하지 않는 경우
- **평가 데이터 없음**: 평가 데이터가 없는 경우
- **권한 부족**: 관리자 권한이 없는 경우
- **네트워크 오류**: Firebase 연결 오류

### 2. 에러 처리 방법

```javascript
try {
  const result = await updateContractorGrade(contractorId, options);
  console.log('업데이트 성공:', result);
} catch (error) {
  console.error('업데이트 실패:', error.message);
  
  if (error.code === 'permission-denied') {
    // 권한 부족 처리
  } else if (error.code === 'not-found') {
    // 시공기사 없음 처리
  } else {
    // 기타 오류 처리
  }
}
```

## 성능 최적화

### 1. 배치 처리

- 여러 시공기사를 한 번에 처리하여 성능 향상
- Firebase Functions의 동시 실행 제한 고려

### 2. 캐싱

- 자주 조회되는 데이터는 캐싱하여 성능 향상
- React 컴포넌트에서 적절한 상태 관리

### 3. 인덱싱

- Firestore 쿼리 성능을 위한 적절한 인덱스 설정
- 복합 쿼리에 대한 인덱스 생성

## 모니터링 및 분석

### 1. 로그 분석

- 등급 변경 빈도 및 패턴 분석
- 에러 발생률 및 원인 분석
- 성능 메트릭 수집

### 2. 통계 대시보드

- 등급별 시공기사 분포
- 등급 변경 트렌드
- 평가 데이터 품질 분석

## 확장 가능성

### 1. 추가 기능

- **자동 등급 업데이트**: 정기적인 자동 등급 업데이트
- **등급 예측**: 머신러닝을 활용한 등급 예측
- **고객 만족도 연동**: 고객 만족도와 등급 연동

### 2. 외부 시스템 연동

- **HR 시스템 연동**: 인사 시스템과 등급 정보 연동
- **급여 시스템 연동**: 등급에 따른 급여 차등 적용
- **교육 시스템 연동**: 등급별 맞춤 교육 프로그램 추천

## 결론

이 시스템은 시공기사의 등급을 공정하고 정확하게 관리할 수 있는 종합적인 솔루션입니다. 상세한 평가 시스템, 자동화된 업데이트, 그리고 다양한 관리 기능을 통해 효율적인 시공기사 관리가 가능합니다.

시스템을 도입할 때는 단계적으로 적용하여 사용자들의 적응을 돕고, 지속적인 모니터링과 개선을 통해 최적의 성과를 달성할 수 있습니다. 