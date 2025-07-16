# 완전한 알림 시스템 가이드

이 문서는 커튼 설치 플랫폼의 완전한 알림 시스템에 대한 상세한 가이드입니다. 푸시 알림과 이메일 알림을 모두 지원하며, 상세한 로깅과 모니터링 기능을 제공합니다.

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [로그 구조](#로그-구조)
3. [설치 및 설정](#설치-및-설정)
4. [사용법](#사용법)
5. [API 엔드포인트](#api-엔드포인트)
6. [모니터링 및 분석](#모니터링-및-분석)
7. [트러블슈팅](#트러블슈팅)

## 🏗️ 시스템 개요

### 주요 기능
- ✅ **푸시 알림**: FCM을 통한 실시간 푸시 알림
- ✅ **이메일 알림**: SendGrid를 통한 HTML 이메일 발송
- ✅ **통합 로깅**: 모든 알림의 상세한 로그 저장
- ✅ **자동 트리거**: Firestore 이벤트 기반 자동 알림
- ✅ **배치 처리**: 대량 알림 발송 지원
- ✅ **오류 처리**: 재시도 로직 및 오류 분석
- ✅ **통계 분석**: 성공률, 오류 분석 등

### 알림 타입
```javascript
// 푸시 알림 타입
NOTIFICATION_TYPES = {
  SETTLEMENT_COMPLETE: 'settlement_complete',
  AD_STATUS_CHANGE: 'ad_status_change',
  PAYMENT_RECEIVED: 'payment_received',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  WORKER_GRADE_UPDATE: 'worker_grade_update'
}

// 이메일 템플릿
EMAIL_TEMPLATES = {
  SETTLEMENT_COMPLETE: '정산 완료 안내',
  AD_STATUS_CHANGE: '광고 상태 변경 안내',
  PAYMENT_RECEIVED: '결제 완료 안내',
  SYSTEM_ANNOUNCEMENT: '시스템 공지사항'
}
```

## 📊 로그 구조

### 로그 엔트리 구조
```javascript
{
  "timestamp": "2025-07-16T12:34:56Z",
  "advertiserId": "advertiser123",
  "type": "email", // "email" or "push"
  "category": "settlement", // "settlement", "ad_status", "payment", "system", "worker_grade", "marketing", "security"
  "status": "success", // "success", "failure", "pending", "retry"
  "message": "정산 완료 알림 발송 완료",
  "error": null, // 오류 발생 시 상세 정보
  "metadata": {
    "to": "user@example.com",
    "templateName": "SETTLEMENT_COMPLETE",
    "settlementId": "settlement_123",
    "amount": 50000,
    "period": "2024-01",
    "createdAt": "2025-07-16T12:34:56Z",
    "version": "1.0"
  }
}
```

### 로그 상태
- **success**: 알림 발송 성공
- **failure**: 알림 발송 실패
- **pending**: 알림 발송 대기 중
- **retry**: 알림 재시도 중

### 로그 카테고리
- **settlement**: 정산 관련 알림
- **ad_status**: 광고 상태 변경 알림
- **payment**: 결제 관련 알림
- **system**: 시스템 공지사항
- **worker_grade**: 시공기사 등급 업데이트
- **marketing**: 마케팅 알림
- **security**: 보안 관련 알림

## ⚙️ 설치 및 설정

### 1. 환경 변수 설정
```bash
# .env 파일에 추가
FIREBASE_PROJECT_ID=your-project-id
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

### 2. SendGrid 설정 (이메일용)
1. SendGrid 계정 생성
2. API 키 생성
3. 발신자 이메일 인증
4. 환경 변수에 API 키 추가

### 3. Firebase 설정 (푸시 알림용)
1. Firebase Console → Project Settings → Cloud Messaging
2. Web Push certificates 생성
3. VAPID 키 생성

## 📱 사용법

### 1. 푸시 알림 발송

```javascript
// 단일 푸시 알림
POST /sendPushNotification
{
  "token": "fcm_token_here",
  "title": "알림 제목",
  "body": "알림 내용",
  "data": {
    "customKey": "customValue",
    "advertiserId": "advertiser123",
    "category": "settlement"
  }
}

// 사용자별 푸시 알림
POST /sendNotificationToUser
{
  "userId": "advertiser123",
  "type": "settlement_complete",
  "customData": {
    "settlementId": "settlement_123",
    "amount": 50000
  }
}
```

### 2. 이메일 알림 발송

```javascript
// 단일 이메일 발송
POST /sendEmail
{
  "to": "user@example.com",
  "templateName": "SETTLEMENT_COMPLETE",
  "data": {
    "advertiserId": "advertiser123",
    "settlementId": "settlement_123",
    "amount": 50000,
    "period": "2024-01"
  }
}

// 사용자별 이메일 발송
POST /sendEmailToUser
{
  "advertiserId": "advertiser123",
  "templateName": "SETTLEMENT_COMPLETE",
  "data": {
    "settlementId": "settlement_123",
    "amount": 50000,
    "period": "2024-01"
  }
}
```

### 3. 배치 알림 발송

```javascript
// 배치 푸시 알림
POST /sendBatchNotifications
{
  "notifications": [
    {
      "token": "token1",
      "title": "제목1",
      "body": "내용1"
    },
    {
      "token": "token2",
      "title": "제목2", 
      "body": "내용2"
    }
  ]
}

// 배치 이메일 발송
POST /sendBatchEmails
{
  "emails": [
    {
      "to": "user1@example.com",
      "templateName": "SETTLEMENT_COMPLETE",
      "data": { "amount": 50000 }
    },
    {
      "to": "user2@example.com",
      "templateName": "AD_STATUS_CHANGE",
      "data": { "adTitle": "광고 제목" }
    }
  ]
}
```

### 4. 전체 광고주 알림

```javascript
// 전체 광고주 푸시 알림
POST /sendTopicNotification
{
  "topic": "all_advertisers",
  "title": "전체 공지",
  "body": "모든 광고주에게 전달되는 공지사항입니다."
}

// 전체 광고주 이메일 발송
POST /sendEmailToAllAdvertisers
{
  "templateName": "SYSTEM_ANNOUNCEMENT",
  "data": {
    "title": "시스템 점검 안내",
    "content": "<p>시스템 점검이 예정되어 있습니다.</p>"
  }
}
```

## 🔌 API 엔드포인트

### 푸시 알림 API
- `POST /sendPushNotification` - 단일 푸시 알림
- `POST /sendNotificationToUser` - 사용자별 푸시 알림
- `POST /sendBatchNotifications` - 배치 푸시 알림
- `POST /sendTopicNotification` - 토픽 푸시 알림

### 이메일 API
- `POST /sendEmail` - 단일 이메일 발송
- `POST /sendEmailToUser` - 사용자별 이메일 발송
- `POST /sendBatchEmails` - 배치 이메일 발송
- `POST /sendEmailToAllAdvertisers` - 전체 광고주 이메일 발송

### 테스트 API
- `POST /sendTestNotification` - 푸시 알림 테스트
- `POST /sendTestNotificationToAll` - 전체 푸시 알림 테스트
- `POST /testEmail` - 이메일 테스트

### 로그 및 통계 API
- `GET /getNotificationLogs` - 알림 로그 조회
- `GET /getNotificationStats` - 알림 통계 조회
- `GET /getLogStats` - 로그 통계 조회
- `GET /getErrorAnalysis` - 오류 분석 조회
- `POST /cleanupOldLogs` - 오래된 로그 정리

### 관리 API
- `POST /cleanupInvalidTokens` - 무효한 토큰 정리

## 📊 모니터링 및 분석

### 1. 로그 조회

```javascript
// 기본 로그 조회
GET /getNotificationLogs

// 필터링된 로그 조회
GET /getNotificationLogs?advertiserId=advertiser123&type=email&status=success&limit=50

// 날짜 범위 로그 조회
GET /getNotificationLogs?startDate=2024-01-01&endDate=2024-01-31
```

### 2. 통계 조회

```javascript
// 전체 통계
GET /getNotificationStats

// 사용자별 통계
GET /getNotificationStats?advertiserId=advertiser123

// 타입별 통계
GET /getNotificationStats?type=email
```

### 3. 오류 분석

```javascript
// 오류 분석 조회
GET /getErrorAnalysis

// 응답 예시
{
  "success": true,
  "analysis": {
    "totalErrors": 15,
    "errorTypes": {
      "messaging/invalid-registration-token": 8,
      "messaging/quota-exceeded": 3,
      "messaging/registration-token-not-registered": 4
    },
    "topErrors": [
      { "code": "messaging/invalid-registration-token", "count": 8 },
      { "code": "messaging/registration-token-not-registered", "count": 4 },
      { "code": "messaging/quota-exceeded", "count": 3 }
    ],
    "recommendations": [
      "무효한 FCM 토큰 정리가 필요합니다.",
      "등록되지 않은 토큰이 많습니다. 토큰 정리를 실행하세요."
    ]
  }
}
```

### 4. 실시간 모니터링

```javascript
// Firestore 실시간 리스너 사용
const unsubscribe = db.collection('notificationLogs')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .onSnapshot(snapshot => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('최근 알림 로그:', logs);
  });
```

## 🔧 트러블슈팅

### 1. 일반적인 문제

#### 푸시 알림이 수신되지 않음
- FCM 토큰 유효성 확인
- 브라우저 알림 권한 확인
- VAPID 키 설정 확인
- 네트워크 연결 상태 확인

#### 이메일이 발송되지 않음
- SendGrid API 키 확인
- 발신자 이메일 인증 확인
- 이메일 템플릿 확인
- 수신자 이메일 주소 확인

#### 로그가 저장되지 않음
- Firestore 권한 설정 확인
- 네트워크 연결 상태 확인
- 함수 로그 확인

### 2. 디버깅 명령어

```bash
# 함수 로그 확인
firebase functions:log

# 특정 함수 로그 확인
firebase functions:log --only sendPushNotification

# 실시간 로그 확인
firebase functions:log --tail

# 함수 배포
firebase deploy --only functions

# 함수 로컬 테스트
firebase emulators:start --only functions
```

### 3. 성능 최적화

```javascript
// 배치 처리로 성능 향상
const batchSize = 500;
const batches = [];

for (let i = 0; i < notifications.length; i += batchSize) {
  batches.push(notifications.slice(i, i + batchSize));
}

for (const batch of batches) {
  await sendBatchNotifications(batch);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
}
```

### 4. 오류 처리

```javascript
// 오류 타입별 처리
catch (error) {
  switch (error.code) {
    case 'messaging/invalid-registration-token':
      await removeInvalidToken(userId);
      break;
      
    case 'messaging/quota-exceeded':
      await delayAndRetry();
      break;
      
    case 'messaging/registration-token-not-registered':
      await removeInvalidToken(userId);
      break;
      
    default:
      await logNotificationError(data, error);
  }
}
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. **Firebase Console** → Functions → Logs
2. **Firestore** → notificationLogs 컬렉션
3. **브라우저 개발자 도구** → Console
4. **네트워크 탭**에서 API 요청 상태

추가 지원이 필요하면 관리자에게 문의하세요.

## 🔄 자동화 예시

### 정산 완료 시 자동 알림
```javascript
// Firestore 트리거
exports.onSettlementComplete = functions.firestore
  .document('advertiserSettlements/{settlementId}')
  .onCreate(async (snap, context) => {
    const settlementData = snap.data();
    const advertiserId = settlementData.advertiserId;

    // 푸시 알림 + 이메일 발송
    await Promise.all([
      sendNotificationToUser(advertiserId, 'settlement_complete', {
        settlementId: context.params.settlementId,
        amount: settlementData.amount,
        period: settlementData.period
      }),
      sendEmailToUser(advertiserId, 'SETTLEMENT_COMPLETE', {
        settlementId: context.params.settlementId,
        amount: settlementData.amount,
        period: settlementData.period
      })
    ]);
  });
```

이 시스템은 완전한 알림 솔루션을 제공하며, 푸시 알림과 이메일을 모두 지원하고 상세한 로깅과 모니터링 기능을 포함합니다. 