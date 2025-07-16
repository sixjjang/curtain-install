# React Native FCM 작업 수락 알림 가이드

## 개요

React Native 앱에서 Firebase Cloud Messaging(FCM)을 사용하여 작업 수락 알림을 구현하는 가이드입니다. 이 시스템은 판매자가 시공업체의 작업 수락을 실시간으로 알 수 있도록 합니다.

## 시스템 구성 요소

### 1. React Native Hook
- **파일**: `frontend/src/hooks/useRegisterSellerFCM.js`
- **기능**: FCM 토큰 관리, 알림 설정, 실시간 알림 처리

### 2. React Native 컴포넌트
- **파일**: `frontend/src/components/SellerNotificationExample.js`
- **기능**: 알림 관리 UI, 설정, 로그 조회

## 설치 및 설정

### 1. 필요한 패키지 설치

```bash
# React Native Firebase 설치
npm install @react-native-firebase/app @react-native-firebase/messaging

# 또는 yarn 사용
yarn add @react-native-firebase/app @react-native-firebase/messaging
```

### 2. iOS 설정

#### Podfile에 추가
```ruby
target 'YourApp' do
  # 기존 설정...
  
  pod 'Firebase/Messaging'
end
```

#### AppDelegate.m 수정
```objc
#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  
  // 알림 권한 요청
  if ([UNUserNotificationCenter class] != nil) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    center.delegate = self;
  }
  
  return YES;
}

// 포그라운드 알림 처리
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  completionHandler(UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionSound);
}
```

#### Info.plist 설정
```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

### 3. Android 설정

#### android/app/build.gradle
```gradle
dependencies {
    // 기존 의존성...
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
}

apply plugin: 'com.google.gms.google-services'
```

#### android/build.gradle
```gradle
buildscript {
    dependencies {
        // 기존 의존성...
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

#### google-services.json 파일 추가
- Firebase Console에서 다운로드한 `google-services.json` 파일을 `android/app/` 디렉토리에 추가

## 사용 방법

### 1. 기본 사용법

```javascript
import React from 'react';
import { View, Text } from 'react-native';
import useRegisterSellerFCM from '../hooks/useRegisterSellerFCM';

const MyComponent = ({ userId }) => {
  const {
    fcmTokens,
    notificationPreferences,
    loading,
    error,
    lastNotification,
    initializeFCM,
    updateNotificationPreferences
  } = useRegisterSellerFCM(userId);

  // FCM 초기화
  useEffect(() => {
    if (userId) {
      initializeFCM();
    }
  }, [userId]);

  if (loading) {
    return <Text>로딩 중...</Text>;
  }

  if (error) {
    return <Text>오류: {error}</Text>;
  }

  return (
    <View>
      <Text>FCM 토큰 수: {fcmTokens.length}</Text>
      <Text>알림 활성화: {notificationPreferences.push ? '예' : '아니오'}</Text>
      {lastNotification && (
        <Text>최근 알림: {lastNotification.title}</Text>
      )}
    </View>
  );
};
```

### 2. 컴포넌트 사용

```javascript
import React from 'react';
import SellerNotificationExample from './SellerNotificationExample';

const App = () => {
  return (
    <SellerNotificationExample userId="seller123" />
  );
};
```

## 주요 기능

### 1. FCM 토큰 관리
```javascript
const {
  fcmTokens,
  addFCMToken,
  removeFCMToken,
  hasValidTokens
} = useRegisterSellerFCM(userId);

// 토큰 추가
await addFCMToken(token);

// 토큰 제거
await removeFCMToken(token);

// 유효한 토큰 존재 여부
console.log('Has valid tokens:', hasValidTokens);
```

### 2. 알림 설정 관리
```javascript
const {
  notificationPreferences,
  updateNotificationPreferences
} = useRegisterSellerFCM(userId);

// 알림 설정 변경
await updateNotificationPreferences({
  push: true,
  email: true,
  jobAccepted: true,
  jobCompleted: true,
  jobCancelled: true
});
```

### 3. 실시간 알림 처리
```javascript
const {
  lastNotification,
  handleForegroundMessage,
  handleBackgroundMessage
} = useRegisterSellerFCM(userId);

// 포그라운드 메시지 처리
const handleMessage = (remoteMessage) => {
  if (remoteMessage.data?.type === 'job_accepted') {
    // 작업 수락 알림 처리
    console.log('Job accepted:', remoteMessage.data);
  }
};
```

## 알림 메시지 형식

### FCM 메시지 구조
```javascript
{
  notification: {
    title: "시공 건이 수락되었습니다",
    body: ""커튼 설치"가 김시공에 의해 수락되었습니다."
  },
  data: {
    type: "job_accepted",
    jobId: "job123",
    jobName: "커튼 설치",
    contractorId: "contractor456",
    contractorName: "김시공",
    status: "assigned",
    timestamp: "2024-01-15T10:30:00.000Z"
  }
}
```

### React Native에서 메시지 처리
```javascript
// 포그라운드 메시지
messaging().onMessage(remoteMessage => {
  console.log('Foreground message:', remoteMessage);
  
  if (remoteMessage.data?.type === 'job_accepted') {
    // Alert 또는 로컬 알림 표시
    Alert.alert(
      remoteMessage.notification.title,
      remoteMessage.notification.body,
      [
        { text: '확인', onPress: () => {} },
        { text: '상세보기', onPress: () => navigateToJob(remoteMessage.data.jobId) }
      ]
    );
  }
});

// 백그라운드 메시지
messaging().setBackgroundMessageHandler(remoteMessage => {
  console.log('Background message:', remoteMessage);
  
  if (remoteMessage.data?.type === 'job_accepted') {
    // 로컬 알림 표시 또는 데이터 저장
    return Promise.resolve();
  }
});
```

## 데이터베이스 구조

### users 컬렉션
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
  lastPreferencesUpdate: Timestamp,
  platform: "ios", // 또는 "android"
  appVersion: "1.0.0"
}
```

### notificationLogs 컬렉션
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
  status: "partial"
}
```

## 오류 처리

### 1. 권한 오류
```javascript
const requestNotificationPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      // 권한이 거부된 경우 처리
      Alert.alert(
        '알림 권한 필요',
        '알림을 받으려면 설정에서 권한을 허용해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => openSettings() }
        ]
      );
    }
  } catch (error) {
    console.error('Permission request failed:', error);
  }
};
```

### 2. 토큰 오류
```javascript
const handleTokenError = async (error) => {
  if (error.code === 'messaging/invalid-registration-token' || 
      error.code === 'messaging/registration-token-not-registered') {
    // 유효하지 않은 토큰 제거
    await removeFCMToken(invalidToken);
  }
};
```

### 3. 네트워크 오류
```javascript
const handleNetworkError = (error) => {
  console.error('Network error:', error);
  
  // 재시도 로직
  setTimeout(() => {
    initializeFCM();
  }, 5000);
};
```

## 성능 최적화

### 1. 토큰 갱신 처리
```javascript
// 토큰 갱신 리스너
messaging().onTokenRefresh(token => {
  console.log('Token refreshed:', token);
  addFCMToken(token);
});
```

### 2. 메모리 관리
```javascript
useEffect(() => {
  let unsubscribeTokenRefresh;
  let unsubscribeForeground;
  let unsubscribeBackground;

  const setupFCM = async () => {
    // FCM 설정...
  };

  setupFCM();

  // 클린업 함수
  return () => {
    if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
    if (unsubscribeForeground) unsubscribeForeground();
    if (unsubscribeBackground) unsubscribeBackground();
  };
}, [userId]);
```

### 3. 배치 처리
```javascript
const batchUpdateTokens = async (tokens) => {
  const batch = firestore.batch();
  
  tokens.forEach(token => {
    const userRef = doc(firestore, 'users', userId);
    batch.update(userRef, {
      fcmTokens: arrayUnion(token)
    });
  });
  
  await batch.commit();
};
```

## 보안 고려사항

### 1. 토큰 보안
- FCM 토큰은 민감한 정보이므로 안전하게 저장
- 서버에서 토큰 검증
- 만료된 토큰 자동 제거

### 2. 권한 관리
- 사용자별 알림 권한 확인
- 권한 거부 시 대체 처리
- 설정 변경 감지

### 3. 데이터 보호
- 개인정보 암호화
- 안전한 통신 프로토콜 사용
- 접근 권한 제한

## 테스트

### 1. 로컬 테스트
```javascript
// 테스트 알림 전송
const sendTestNotification = async () => {
  const token = await messaging().getToken();
  
  // Firebase Console에서 테스트 메시지 전송
  console.log('Test token:', token);
};
```

### 2. 백그라운드 테스트
```javascript
// 백그라운드 메시지 테스트
messaging().setBackgroundMessageHandler(remoteMessage => {
  console.log('Background test message:', remoteMessage);
  return Promise.resolve();
});
```

### 3. 권한 테스트
```javascript
// 권한 상태 확인
const checkPermission = async () => {
  const authStatus = await messaging().hasPermission();
  console.log('Permission status:', authStatus);
};
```

## 문제 해결

### 1. 알림이 오지 않는 경우
1. FCM 토큰이 올바르게 등록되었는지 확인
2. 알림 권한이 허용되었는지 확인
3. 앱이 백그라운드에서 실행 중인지 확인
4. 네트워크 연결 상태 확인

### 2. 중복 알림 문제
1. 토큰 중복 제거
2. 알림 태그 설정
3. 메시지 ID 중복 확인

### 3. 성능 문제
1. 토큰 갱신 빈도 조정
2. 메모리 누수 확인
3. 배치 처리 최적화

## 모니터링 및 분석

### 1. 알림 통계
```javascript
const getNotificationStats = async () => {
  const stats = await getNotificationStats();
  console.log('Notification stats:', stats);
  
  // 성공률, 실패 원인 등 분석
  return stats;
};
```

### 2. 사용자 행동 분석
```javascript
const trackNotificationInteraction = (notificationData) => {
  // 알림 클릭, 액션 등 추적
  analytics().logEvent('notification_interaction', {
    type: notificationData.type,
    jobId: notificationData.jobId,
    action: 'click'
  });
};
```

### 3. 오류 모니터링
```javascript
const logError = (error, context) => {
  console.error('FCM Error:', error);
  
  // 오류 로깅 서비스에 전송
  crashlytics().recordError(error, context);
};
```

## 확장 가능성

### 1. 추가 알림 유형
- 작업 완료 알림
- 결제 완료 알림
- 리뷰 요청 알림
- 시스템 공지 알림

### 2. 고급 기능
- 스케줄된 알림
- 조건부 알림
- 개인화된 메시지
- A/B 테스트

### 3. 다국어 지원
- 언어별 메시지 템플릿
- 지역별 시간대 처리
- 문화적 고려사항

## 결론

React Native FCM을 사용한 작업 수락 알림 시스템은 판매자와 시공업체 간의 원활한 소통을 위한 핵심 기능입니다. 실시간 알림, 다중 플랫폼 지원, 상세한 로깅을 통해 사용자 경험을 향상시키고, 확장 가능한 아키텍처로 미래의 요구사항에 대응할 수 있습니다.

이 가이드를 따라 구현하면 안정적이고 효율적인 푸시 알림 시스템을 구축할 수 있습니다. 