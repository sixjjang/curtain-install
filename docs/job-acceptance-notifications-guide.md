# 작업 수락 알림 시스템 가이드

## 개요

작업 수락 알림 시스템은 시공업체가 작업을 수락할 때 판매자에게 자동으로 알림을 전송하는 시스템입니다. Firebase Cloud Functions를 사용하여 실시간으로 알림을 처리하고, FCM(Firebase Cloud Messaging)을 통해 푸시 알림을 전송합니다.

## 시스템 구성 요소

### 1. Firebase Cloud Function
- **파일**: `functions/index.js`
- **함수**: `notifySellerOnJobAccepted`
- **트리거**: Firestore `jobs/{jobId}` 문서 업데이트

### 2. React Hook
- **파일**: `frontend/src/hooks/useJobAcceptanceNotifications.js`
- **기능**: FCM 토큰 관리, 알림 설정, 실시간 알림 처리

### 3. React 컴포넌트
- **파일**: `frontend/src/components/JobAcceptanceNotificationExample.js`
- **기능**: 알림 관리 UI, 설정, 로그 조회

## 작동 원리

### 1. 작업 수락 프로세스
```javascript
// 1. 시공업체가 작업 수락
await acceptJob(jobId, contractorId);

// 2. Firestore 문서 업데이트
// jobs/{jobId} 문서의 status가 "open"에서 "assigned"로 변경

// 3. Cloud Function 트리거
exports.notifySellerOnJobAccepted = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    // 알림 전송 로직
  });
```

### 2. 알림 전송 프로세스
1. **판매자 정보 조회**: `users/{sellerId}` 문서에서 FCM 토큰과 알림 설정 확인
2. **계약자 정보 조회**: `contractors/{contractorId}` 문서에서 계약자 이름 조회
3. **FCM 메시지 구성**: 알림 제목, 내용, 데이터 페이로드 설정
4. **알림 전송**: 각 FCM 토큰에 대해 개별 전송
5. **로그 저장**: `notificationLogs` 컬렉션에 전송 결과 저장

## 주요 기능

### 1. 다중 FCM 토큰 지원
- 한 사용자가 여러 기기에서 알림을 받을 수 있음
- 각 토큰별로 개별 전송 및 오류 처리
- 유효하지 않은 토큰 자동 제거

### 2. 알림 설정 관리
```javascript
const notificationPreferences = {
  push: true,        // 푸시 알림
  email: true,       // 이메일 알림
  jobAccepted: true, // 작업 수락 알림
  jobCompleted: true, // 작업 완료 알림
  jobCancelled: true  // 작업 취소 알림
};
```

### 3. 상세한 로깅
- 전송 성공/실패 통계
- 각 토큰별 전송 결과
- 오류 상세 정보
- 실시간 로그 조회

### 4. 이메일 알림 지원
- SendGrid 또는 다른 이메일 서비스 연동 가능
- HTML 템플릿 지원
- 사용자별 알림 설정 적용

## 사용 방법

### 1. React Hook 사용
```javascript
import { useJobAcceptanceNotifications } from '../hooks/useJobAcceptanceNotifications';

const MyComponent = ({ userId }) => {
  const {
    fcmTokens,
    notificationPreferences,
    loading,
    error,
    lastNotification,
    initializeFCM,
    updateNotificationPreferences,
    getNotificationLogs,
    getNotificationStats
  } = useJobAcceptanceNotifications(userId);

  // FCM 초기화
  useEffect(() => {
    if (userId) {
      initializeFCM();
    }
  }, [userId]);

  // 알림 설정 변경
  const handleToggleNotification = async (type) => {
    const newPreferences = {
      ...notificationPreferences,
      [type]: !notificationPreferences[type]
    };
    await updateNotificationPreferences(newPreferences);
  };

  return (
    <div>
      {/* 알림 관리 UI */}
    </div>
  );
};
```

### 2. 컴포넌트 사용
```javascript
import JobAcceptanceNotificationExample from './JobAcceptanceNotificationExample';

const App = () => {
  return (
    <JobAcceptanceNotificationExample userId="seller123" />
  );
};
```

## 알림 메시지 형식

### FCM 메시지
```javascript
const message = {
  token: fcmToken,
  notification: {
    title: "시공 건이 수락되었습니다",
    body: `"${jobName}"이 ${contractorName}에 의해 수락되었습니다.`,
  },
  data: {
    type: "job_accepted",
    jobId: jobId,
    jobName: jobName,
    contractorId: contractorId,
    contractorName: contractorName,
    status: "assigned",
    timestamp: new Date().toISOString()
  },
  android: {
    notification: {
      channelId: "job_notifications",
      priority: "high",
      defaultSound: true,
      defaultVibrateTimings: true
    }
  },
  apns: {
    payload: {
      aps: {
        sound: "default",
        badge: 1
      }
    }
  }
};
```

### 이메일 템플릿
```html
<h2>시공 건이 수락되었습니다</h2>
<p>안녕하세요, {{sellerName}}님</p>
<p>등록하신 작업 "{{jobName}}"이 {{contractorName}}에 의해 수락되었습니다.</p>
<p>작업 ID: {{jobId}}</p>
<p>수락 시간: {{timestamp}}</p>
```

## 데이터베이스 구조

### 1. users 컬렉션
```javascript
{
  fcmTokens: ["token1", "token2", "token3"],
  notificationPreferences: {
    push: true,
    email: true,
    jobAccepted: true,
    jobCompleted: true,
    jobCancelled: true
  },
  lastTokenUpdate: Timestamp,
  lastPreferencesUpdate: Timestamp
}
```

### 2. notificationLogs 컬렉션
```javascript
{
  type: "job_accepted",
  targetUserId: "seller123",
  targetType: "seller",
  jobId: "job456",
  jobName: "커튼 설치",
  contractorId: "contractor789",
  contractorName: "김시공",
  fcmTokensCount: 3,
  successCount: 2,
  failureCount: 1,
  results: [
    { success: true, tokenIndex: 0, messageId: "msg123" },
    { success: true, tokenIndex: 1, messageId: "msg124" },
    { success: false, tokenIndex: 2, error: "Invalid token" }
  ],
  timestamp: Timestamp,
  status: "partial" // success, failed, partial, error
}
```

## 오류 처리

### 1. FCM 토큰 오류
- `messaging/invalid-registration-token`: 유효하지 않은 토큰
- `messaging/registration-token-not-registered`: 등록되지 않은 토큰
- 자동으로 유효하지 않은 토큰 제거

### 2. 네트워크 오류
- 재시도 로직 구현
- 부분 실패 처리
- 상세한 오류 로깅

### 3. 권한 오류
- 브라우저 알림 권한 확인
- 권한 요청 UI 제공
- 권한 거부 시 대체 처리

## 성능 최적화

### 1. 배치 처리
- 여러 FCM 토큰을 병렬로 처리
- Promise.all을 사용한 동시 전송

### 2. 캐싱
- 사용자 정보 캐싱
- 알림 설정 캐싱
- 실시간 업데이트

### 3. 로깅 최적화
- 구조화된 로깅
- 성능 메트릭 수집
- 오류 분석

## 보안 고려사항

### 1. 인증
- Firebase Auth를 통한 사용자 인증
- 토큰 기반 권한 확인

### 2. 데이터 보호
- 민감한 정보 암호화
- 토큰 안전한 저장
- 접근 권한 제한

### 3. 스팸 방지
- 알림 빈도 제한
- 사용자별 설정 적용
- 오용 감지

## 모니터링 및 분석

### 1. 알림 통계
- 전송 성공률
- 사용자별 알림 수신률
- 시간대별 알림 패턴

### 2. 오류 분석
- 실패 원인 분류
- 토큰 유효성 통계
- 네트워크 오류 패턴

### 3. 사용자 행동
- 알림 클릭률
- 알림 설정 변경 패턴
- 사용자 만족도

## 확장 가능성

### 1. 추가 알림 유형
- 작업 완료 알림
- 작업 취소 알림
- 결제 완료 알림
- 리뷰 요청 알림

### 2. 다국어 지원
- 언어별 메시지 템플릿
- 지역별 시간대 처리
- 문화적 고려사항

### 3. 고급 기능
- 스케줄된 알림
- 조건부 알림
- 개인화된 메시지
- A/B 테스트

## 문제 해결

### 1. 알림이 오지 않는 경우
1. FCM 토큰이 등록되어 있는지 확인
2. 알림 설정이 활성화되어 있는지 확인
3. 브라우저 알림 권한 확인
4. 네트워크 연결 상태 확인

### 2. 중복 알림 문제
1. 알림 태그 설정 확인
2. 토큰 중복 제거
3. 전송 로직 검증

### 3. 성능 문제
1. 배치 크기 조정
2. 캐싱 전략 개선
3. 데이터베이스 인덱스 최적화

## 결론

작업 수락 알림 시스템은 판매자와 시공업체 간의 원활한 소통을 위한 핵심 기능입니다. 실시간 알림, 다중 플랫폼 지원, 상세한 로깅을 통해 사용자 경험을 향상시키고, 확장 가능한 아키텍처로 미래의 요구사항에 대응할 수 있습니다. 