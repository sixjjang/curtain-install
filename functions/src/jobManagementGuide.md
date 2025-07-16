# 긴급 수수료 관리 시스템 가이드

## 개요

긴급 수수료 관리 시스템은 작업의 긴급도를 반영하여 단계적으로 수수료를 증가시키는 종합적인 관리 도구입니다. 시간이 지남에 따라 자동으로 수수료가 증가하여 작업의 긴급성을 높이고, 시공기사들의 참여를 유도합니다.

## 주요 기능

### 1. 단계적 긴급 수수료 증가
- **자동 증가**: 설정된 시간 간격으로 자동 증가
- **단계별 증가**: 설정 가능한 증가 단계 (기본 5%)
- **최대값 제한**: 설정 가능한 최대 수수료 (기본 50%)
- **커스텀 단계**: 필요시 커스텀 증가 단계 설정

### 2. 종합적인 검증 시스템
- **작업 상태 검증**: 열린 상태의 작업만 처리
- **수수료 설정 검증**: 긴급 수수료 설정 존재 확인
- **최대값 도달 확인**: 최대 수수료 도달 시 중단
- **입력 데이터 검증**: 유효한 작업 ID 확인

### 3. 상세한 로깅 및 추적
- **활동 로그**: 모든 증가 활동을 자동 기록
- **처리 시간 측정**: 각 처리의 소요 시간 기록
- **에러 로그**: 오류 발생 시 상세 로그 기록
- **통계 업데이트**: 전체 통계 자동 업데이트

### 4. 알림 시스템
- **자동 알림**: 수수료 증가 시 관련자에게 알림
- **FCM 푸시 알림**: 실시간 푸시 알림 발송
- **알림 이력**: 모든 알림 발송 이력 저장
- **참여자별 알림**: 작업 참여자들에게 개별 알림

### 5. 일괄 처리 기능
- **다중 작업 처리**: 여러 작업을 한 번에 처리
- **배치 크기 제어**: 처리할 작업 수 제한
- **오류 격리**: 개별 작업 실패가 전체에 영향 없음
- **진행 상황 추적**: 처리 진행 상황 실시간 확인

## 함수 사용법

### 기본 사용법

```javascript
const { increaseUrgentFee } = require('./jobManagement');

// 기본 증가
const result = await increaseUrgentFee('job123');
console.log(result);
```

### 고급 사용법

```javascript
// 옵션과 함께 사용
const result = await increaseUrgentFee('job123', {
  sendNotification: true,
  logActivity: true,
  customStep: 10 // 10% 증가
});
```

### 일괄 처리

```javascript
const { batchIncreaseUrgentFees } = require('./jobManagement');

const jobIds = ['job1', 'job2', 'job3'];
const batchResult = await batchIncreaseUrgentFees(jobIds, {
  batchSize: 5,
  sendNotification: true
});
```

### 조건 확인

```javascript
const { checkUrgentFeeIncreaseConditions } = require('./jobManagement');

const conditions = await checkUrgentFeeIncreaseConditions('job123');
if (conditions.canIncrease) {
  console.log('수수료를 증가할 수 있습니다.');
} else {
  console.log('사유:', conditions.reason);
}
```

## 함수 매개변수

### increaseUrgentFee(jobId, options)

| 매개변수 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `jobId` | string | ✅ | - | 작업 ID |
| `options.sendNotification` | boolean | ❌ | true | 알림 발송 여부 |
| `options.logActivity` | boolean | ❌ | true | 활동 로그 기록 여부 |
| `options.customStep` | number | ❌ | null | 커스텀 증가 단계 |

### batchIncreaseUrgentFees(jobIds, options)

| 매개변수 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `jobIds` | string[] | ✅ | - | 작업 ID 배열 |
| `options.batchSize` | number | ❌ | 10 | 배치 크기 |
| `options.sendNotification` | boolean | ❌ | true | 알림 발송 여부 |
| `options.logActivity` | boolean | ❌ | true | 활동 로그 기록 여부 |

## 반환값 구조

### increaseUrgentFee 반환값

```javascript
{
  success: boolean,        // 성공 여부
  jobId: string,          // 작업 ID
  increased: boolean,     // 증가 여부
  oldPercent: number,     // 이전 수수료
  newPercent: number,     // 새로운 수수료
  maxReached: boolean,    // 최대값 도달 여부
  error: string,          // 오류 메시지
  processingTime: number  // 처리 시간 (ms)
}
```

### batchIncreaseUrgentFees 반환값

```javascript
{
  total: number,          // 전체 작업 수
  successful: number,     // 성공한 작업 수
  failed: number,         // 실패한 작업 수
  increased: number,      // 증가된 작업 수
  maxReached: number,     // 최대값 도달한 작업 수
  results: Array          // 개별 결과 배열
}
```

## 데이터 구조

### 작업 데이터 (jobs collection)
```javascript
{
  id: "job123",
  status: "open",                    // 작업 상태
  urgentFeePercent: 10,             // 초기 긴급 수수료
  currentUrgentFeePercent: 15,      // 현재 긴급 수수료
  urgentFeeMaxPercent: 50,          // 최대 긴급 수수료
  urgentFeeIncreaseStep: 5,         // 증가 단계
  urgentFeeLastUpdated: Timestamp,  // 마지막 업데이트 시간
  urgentFeeIncreaseCount: 2,        // 증가 횟수
  urgentFeeMaxReachedAt: Timestamp  // 최대값 도달 시간
}
```

### 활동 로그 (jobActivities collection)
```javascript
{
  id: "activity123",
  jobId: "job123",
  type: "urgent_fee_increase",
  oldValue: 10,
  newValue: 15,
  increaseStep: 5,
  maxReached: false,
  timestamp: Timestamp,
  processedBy: "system",
  metadata: {
    previousIncreaseCount: 1,
    maxPercent: 50,
    processingTime: 150
  }
}
```

### 통계 데이터 (statistics collection)
```javascript
{
  id: "urgentFees",
  totalIncreases: 150,              // 총 증가 횟수
  totalIncreaseAmount: 750,         // 총 증가량
  maxReachedCount: 25,              // 최대값 도달 횟수
  lastUpdated: Timestamp            // 마지막 업데이트 시간
}
```

## 처리 프로세스

### 1. 입력 검증
- 작업 ID 유효성 확인
- 작업 존재 여부 확인
- 작업 상태 검증 (열린 상태만)

### 2. 조건 확인
- 긴급 수수료 설정 존재 확인
- 최대값 도달 여부 확인
- 증가 가능 여부 판단

### 3. 수수료 계산
- 현재 수수료 확인
- 새로운 수수료 계산
- 최대값 제한 적용

### 4. 데이터 업데이트
- 작업 데이터 업데이트
- 활동 로그 기록
- 통계 업데이트

### 5. 알림 발송
- 작업 참여자 조회
- 알림 데이터 생성
- FCM 토큰으로 발송

## 오류 처리

### 일반적인 오류
- **작업을 찾을 수 없음**: 유효하지 않은 작업 ID
- **작업이 열린 상태가 아님**: 이미 완료되거나 취소된 작업
- **긴급 수수료 설정이 없음**: 긴급 수수료가 설정되지 않은 작업
- **최대값에 도달**: 이미 최대 수수료에 도달한 작업

### 오류 로그
모든 오류는 `errorLogs` 컬렉션에 자동으로 기록됩니다:
```javascript
{
  functionName: "increaseUrgentFee",
  jobId: "job123",
  error: "작업을 찾을 수 없습니다.",
  stack: "Error stack trace...",
  processingTime: 150,
  timestamp: Timestamp
}
```

## 성능 최적화

### 배치 처리
- 여러 작업을 배치로 처리하여 성능 향상
- Firestore 제한을 고려한 배치 크기 조정
- 배치 간 지연으로 서버 부하 분산

### 비동기 처리
- 알림 발송을 비동기로 처리
- 통계 업데이트를 비동기로 처리
- 오류 발생 시에도 주요 프로세스 계속 진행

### 캐싱 전략
- 자주 조회되는 데이터 캐싱
- 조건 확인 결과 캐싱
- 통계 데이터 캐싱

## 보안 고려사항

### 데이터 검증
- 모든 입력 데이터 검증
- SQL 인젝션 방지
- 권한 확인

### 접근 제어
- 관리자 권한 확인
- 작업별 접근 권한 검증
- 민감한 정보 보호

## 모니터링 및 알림

### 로깅
- 모든 처리 활동 로깅
- 성능 메트릭 수집
- 오류 추적 및 분석

### 알림
- 처리 실패 시 관리자 알림
- 성능 저하 시 알림
- 시스템 상태 모니터링

## 확장 가능성

### 추가 기능
- 시간 기반 자동 증가
- 복잡한 증가 규칙
- 사용자 정의 증가 로직
- 통계 대시보드

### 통합 가능성
- 외부 시스템 연동
- API 엔드포인트 제공
- 웹훅 지원
- 실시간 업데이트

## 배포 및 설정

### Cloud Functions 배포
```bash
firebase deploy --only functions:increaseUrgentFee
firebase deploy --only functions:batchIncreaseUrgentFees
```

### 환경 변수 설정
```bash
firebase functions:config:set
  jobmanagement.default_step="5"
  jobmanagement.max_percent="50"
  jobmanagement.batch_size="10"
```

### 권한 설정
- Firestore 읽기/쓰기 권한
- FCM 발송 권한
- 알림 서비스 권한

## 트러블슈팅

### 일반적인 문제

#### 작업을 찾을 수 없는 경우
1. 작업 ID 확인
2. Firestore 권한 확인
3. 컬렉션 경로 확인

#### 수수료가 증가하지 않는 경우
1. 작업 상태 확인
2. 긴급 수수료 설정 확인
3. 최대값 도달 여부 확인

#### 알림이 발송되지 않는 경우
1. FCM 토큰 확인
2. 알림 권한 확인
3. 네트워크 연결 확인

### 디버깅 팁
- Cloud Functions 로그 확인
- Firestore 콘솔에서 데이터 확인
- 성능 모니터링 도구 활용

## 업데이트 로그

### v2.0.0 (현재 버전)
- 종합적인 오류 처리 추가
- 상세한 로깅 시스템 추가
- 알림 시스템 통합
- 일괄 처리 기능 추가
- 통계 추적 기능 추가
- 성능 최적화

### v1.0.0 (이전 버전)
- 기본 긴급 수수료 증가
- 단순한 상태 확인
- 기본 로깅

## 라이선스

이 시스템은 MIT 라이선스 하에 배포됩니다.

## 기여하기

버그 리포트, 기능 요청, 풀 리퀘스트를 환영합니다.

## 연락처

문의사항이 있으시면 개발팀에 연락해주세요. 