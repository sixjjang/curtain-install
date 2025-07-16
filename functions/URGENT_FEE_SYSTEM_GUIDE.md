# 긴급 수수료 시스템 가이드 (Firebase Cloud Functions)

## 개요

긴급 수수료 시스템은 오픈 상태의 시공건에 대해 시간이 지남에 따라 자동으로 긴급 수수료를 인상하는 시스템입니다. 이 시스템은 두 가지 방식으로 운영됩니다:

1. **10분 간격 시스템** (기본): 더 세밀한 수수료 관리
2. **1시간 간격 시스템** (대안): 더 간단한 수수료 관리

## 시스템 구조

### 1. 10분 간격 시스템 (`increaseUrgentFee`)

**실행 주기**: 10분마다
**파일 위치**: `functions/src/urgentFeeManager.js`

#### 주요 특징:
- **배치 처리**: 500개씩 배치로 처리하여 성능 최적화
- **상세 로깅**: 모든 처리 과정을 상세히 로깅
- **오류 처리**: 개별 작업별 오류 처리 및 통계 수집
- **통계 저장**: 처리 결과를 Firestore에 저장
- **알림 시스템**: 오류 발생 시 관리자 알림

#### 필수 필드:
```javascript
{
  status: "open",                    // 작업 상태
  urgentFeeEnabled: true,           // 긴급 수수료 활성화 여부
  urgentFeeIncreaseStartAt: Timestamp, // 긴급 수수료 증가 시작 시간
  urgentFeePercent: 15,             // 기본 긴급 수수료 비율
  maxUrgentFeePercent: 50,          // 최대 긴급 수수료 비율
  currentUrgentFeePercent: 15       // 현재 긴급 수수료 비율
}
```

#### 증가 로직:
- 10분마다 5%씩 증가
- 최대 수수료까지 증가
- 증가 횟수 추적
- 마지막 업데이트 시간 기록

### 2. 1시간 간격 시스템 (`increaseUrgentFeePeriodically`)

**실행 주기**: 1시간마다
**파일 위치**: `functions/index.js`

#### 주요 특징:
- **간단한 로직**: 단순하고 직관적인 증가 로직
- **기본 필드 사용**: 표준 작업 필드만 사용
- **즉시 처리**: 모든 작업을 한 번에 처리

#### 필수 필드:
```javascript
{
  status: "open",                    // 작업 상태
  createdAt: Timestamp,             // 작업 생성 시간
  lastFeeIncreaseAt: Timestamp,     // 마지막 수수료 증가 시간
  baseUrgentFeePercent: 15,         // 기본 긴급 수수료 비율
  maxUrgentFeePercent: 50,          // 최대 긴급 수수료 비율
  currentUrgentFeePercent: 15       // 현재 긴급 수수료 비율
}
```

#### 증가 로직:
- 1시간마다 5%씩 증가
- 최대 수수료까지 증가
- 마지막 증가 시간 기록

## 함수 목록

### 자동 실행 함수

1. **`increaseUrgentFee`** (10분 간격)
   - 가장 정교한 긴급 수수료 관리
   - 배치 처리 및 상세 로깅
   - 오류 처리 및 통계 수집

2. **`increaseUrgentFeePeriodically`** (1시간 간격)
   - 간단한 긴급 수수료 관리
   - 기본적인 증가 로직
   - 빠른 처리

### 수동 실행 함수

3. **`manualIncreaseUrgentFee`** (관리자용)
   - 관리자가 수동으로 긴급 수수료 인상
   - 특정 작업 또는 전체 작업 대상
   - 인증 및 권한 확인

## 데이터베이스 구조

### jobs 컬렉션

#### 10분 간격 시스템용 필드:
```javascript
{
  // 기본 정보
  id: "job123",
  title: "커튼 설치",
  status: "open",
  
  // 긴급 수수료 설정
  urgentFeeEnabled: true,
  urgentFeePercent: 15,             // 기본 수수료
  maxUrgentFeePercent: 50,          // 최대 수수료
  currentUrgentFeePercent: 15,      // 현재 수수료
  
  // 시간 관리
  urgentFeeIncreaseStartAt: Timestamp,
  lastUrgentFeeUpdate: Timestamp,
  
  // 통계
  urgentFeeIncreaseCount: 0,        // 증가 횟수
  urgentFeeMaxReachedAt: null       // 최대값 도달 시간
}
```

#### 1시간 간격 시스템용 필드:
```javascript
{
  // 기본 정보
  id: "job123",
  title: "커튼 설치",
  status: "open",
  
  // 긴급 수수료 설정
  baseUrgentFeePercent: 15,         // 기본 수수료
  maxUrgentFeePercent: 50,          // 최대 수수료
  currentUrgentFeePercent: 15,      // 현재 수수료
  
  // 시간 관리
  createdAt: Timestamp,
  lastFeeIncreaseAt: Timestamp
}
```

### urgentFeeStats 컬렉션 (10분 간격 시스템용)

```javascript
{
  id: "auto-generated",
  totalProcessed: 150,              // 처리된 작업 수
  totalIncreased: 25,               // 인상된 작업 수
  totalErrors: 2,                   // 오류 수
  executionTimeMs: 1250,            // 실행 시간 (ms)
  timestamp: "2024-01-15T10:30:00Z",
  errors: [                         // 오류 상세 (최대 10개)
    {
      jobId: "job123",
      error: "Invalid timestamp",
      timestamp: "2024-01-15T10:30:00Z"
    }
  ],
  createdAt: Timestamp
}
```

## 설정 방법

### 1. 10분 간격 시스템 활성화

```javascript
// 작업 생성 시 설정
const jobData = {
  title: "커튼 설치",
  status: "open",
  urgentFeeEnabled: true,
  urgentFeePercent: 15,
  maxUrgentFeePercent: 50,
  currentUrgentFeePercent: 15,
  urgentFeeIncreaseStartAt: admin.firestore.Timestamp.now()
};

await firestore.collection("jobs").add(jobData);
```

### 2. 1시간 간격 시스템 활성화

```javascript
// 작업 생성 시 설정
const jobData = {
  title: "커튼 설치",
  status: "open",
  baseUrgentFeePercent: 15,
  maxUrgentFeePercent: 50,
  currentUrgentFeePercent: 15,
  createdAt: admin.firestore.Timestamp.now(),
  lastFeeIncreaseAt: admin.firestore.Timestamp.now()
};

await firestore.collection("jobs").add(jobData);
```

## 모니터링 및 로깅

### 1. Cloud Functions 로그

Firebase Console에서 각 함수의 실행 로그를 확인할 수 있습니다:

```bash
# 로그 확인
firebase functions:log --only increaseUrgentFee
firebase functions:log --only increaseUrgentFeePeriodically
```

### 2. 통계 데이터 확인

```javascript
// 10분 간격 시스템 통계 조회
const statsRef = firestore.collection("urgentFeeStats");
const statsSnapshot = await statsRef
  .orderBy("createdAt", "desc")
  .limit(10)
  .get();

statsSnapshot.forEach(doc => {
  console.log("통계:", doc.data());
});
```

### 3. 작업별 수수료 이력

```javascript
// 특정 작업의 수수료 변화 추적
const jobRef = firestore.collection("jobs").doc("job123");
const jobDoc = await jobRef.get();
const jobData = jobDoc.data();

console.log("현재 수수료:", jobData.currentUrgentFeePercent);
console.log("증가 횟수:", jobData.urgentFeeIncreaseCount);
console.log("마지막 업데이트:", jobData.lastUrgentFeeUpdate);
```

## 오류 처리

### 1. 일반적인 오류

- **타임스탬프 오류**: 잘못된 타임스탬프 형식
- **필드 누락**: 필수 필드가 없는 경우
- **권한 오류**: Firestore 쓰기 권한 부족
- **네트워크 오류**: 일시적인 네트워크 문제

### 2. 오류 대응 방법

```javascript
// 오류 발생 시 재시도 로직
const updateWithRetry = async (docRef, data, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await docRef.update(data);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## 성능 최적화

### 1. 배치 처리 (10분 간격 시스템)

- 500개씩 배치로 처리
- 메모리 사용량 최적화
- 실행 시간 단축

### 2. 인덱스 최적화

```javascript
// Firestore 인덱스 설정
// jobs 컬렉션
{
  status: "open",
  urgentFeeEnabled: true,
  urgentFeeIncreaseStartAt: "asc"
}
```

### 3. 쿼리 최적화

```javascript
// 효율적인 쿼리
const query = jobsRef
  .where("status", "==", "open")
  .where("urgentFeeEnabled", "==", true)
  .orderBy("urgentFeeIncreaseStartAt", "asc")
  .limit(500);
```

## 보안 고려사항

### 1. 인증 및 권한

- 관리자 함수는 인증 필요
- Firestore 보안 규칙 설정
- 적절한 권한 검증

### 2. 데이터 검증

```javascript
// 입력 데이터 검증
const validateJobData = (jobData) => {
  if (!jobData.status || jobData.status !== "open") {
    throw new Error("Invalid job status");
  }
  
  if (jobData.urgentFeePercent < 0 || jobData.urgentFeePercent > 100) {
    throw new Error("Invalid urgent fee percent");
  }
  
  return true;
};
```

## 확장 가능성

### 1. 추가 기능

- **동적 증가율**: 작업별로 다른 증가율 설정
- **시간대별 증가**: 특정 시간대에만 증가
- **계절별 조정**: 계절에 따른 수수료 조정
- **지역별 차등**: 지역에 따른 수수료 차등

### 2. 통합 기능

- **알림 시스템**: 수수료 증가 시 알림
- **대시보드**: 실시간 모니터링 대시보드
- **리포트**: 수수료 증가 통계 리포트
- **API**: 외부 시스템 연동 API

## 트러블슈팅

### 1. 함수가 실행되지 않는 경우

```bash
# 함수 상태 확인
firebase functions:list

# 함수 재배포
firebase deploy --only functions:increaseUrgentFee
firebase deploy --only functions:increaseUrgentFeePeriodically
```

### 2. 수수료가 증가하지 않는 경우

```javascript
// 작업 데이터 확인
const jobRef = firestore.collection("jobs").doc("job123");
const jobDoc = await jobRef.get();
const jobData = jobDoc.data();

console.log("작업 상태:", jobData.status);
console.log("긴급 수수료 활성화:", jobData.urgentFeeEnabled);
console.log("현재 수수료:", jobData.currentUrgentFeePercent);
console.log("최대 수수료:", jobData.maxUrgentFeePercent);
```

### 3. 성능 문제

```javascript
// 배치 크기 조정 (10분 간격 시스템)
const batchSize = 250; // 기본값 500에서 조정

// 실행 주기 조정
// functions.pubsub.schedule('every 20 minutes') // 10분에서 20분으로 변경
```

## 결론

긴급 수수료 시스템은 두 가지 방식을 제공하여 다양한 요구사항에 대응할 수 있습니다:

- **10분 간격 시스템**: 정교한 관리가 필요한 경우
- **1시간 간격 시스템**: 간단한 관리가 필요한 경우

시스템 선택 시 다음을 고려하세요:
- 작업의 긴급도
- 관리 복잡도
- 성능 요구사항
- 모니터링 필요성 