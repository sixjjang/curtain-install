# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: "curtain-install-app")
4. Google Analytics 설정 (선택사항)
5. "프로젝트 만들기" 클릭

## 2. 웹 앱 추가

1. 프로젝트 대시보드에서 "웹" 아이콘 클릭
2. 앱 닉네임 입력 (예: "curtain-install-web")
3. "Firebase Hosting 설정" 체크 해제
4. "앱 등록" 클릭

## 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase VAPID Key (for FCM)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Environment
NODE_ENV=development
```

## 4. Firebase Authentication 설정

1. Firebase Console에서 "Authentication" 메뉴 클릭
2. "시작하기" 클릭
3. "로그인 방법" 탭에서 다음 제공업체 활성화:
   - 이메일/비밀번호
   - Google (선택사항)
4. "저장" 클릭

## 5. Firestore Database 설정

1. Firebase Console에서 "Firestore Database" 메뉴 클릭
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 선택:
   - "테스트 모드에서 시작" 선택 (개발용)
   - 또는 "프로덕션 모드에서 시작" 선택 (실제 서비스용)
4. 데이터베이스 위치 선택 (한국: asia-northeast3)
5. "완료" 클릭

## 6. Firestore 보안 규칙 설정

Firestore Database > 규칙 탭에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 프로필
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 관리자만 접근 가능한 컬렉션
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 공개 읽기, 인증된 사용자만 쓰기
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 7. Storage 설정 (선택사항)

1. Firebase Console에서 "Storage" 메뉴 클릭
2. "시작하기" 클릭
3. 보안 규칙 선택
4. "완료" 클릭

## 8. FCM 설정 (선택사항)

1. Firebase Console에서 "프로젝트 설정" 클릭
2. "Cloud Messaging" 탭 클릭
3. "웹 푸시 인증서" 생성
4. VAPID 키를 `.env.local`에 추가

## 9. 테스트

1. 개발 서버 재시작: `npm run dev`
2. 로그인 페이지에서 테스트 계정으로 로그인
3. Firebase Console에서 Authentication > 사용자 탭에서 사용자 확인

## 10. 프로덕션 배포 시 주의사항

1. Firestore 보안 규칙을 프로덕션용으로 수정
2. 환경 변수를 프로덕션 서버에 설정
3. 도메인을 Firebase Console에 추가
4. SSL 인증서 설정

## 문제 해결

### Firebase가 초기화되지 않는 경우
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인
- 개발 서버를 재시작

### 로그인이 안 되는 경우
- Firebase Console에서 Authentication이 활성화되었는지 확인
- 이메일/비밀번호 로그인이 활성화되었는지 확인
- 사용자가 Firebase Console에 등록되었는지 확인

### 권한 오류가 발생하는 경우
- Firestore 보안 규칙을 확인
- 사용자 역할이 올바르게 설정되었는지 확인 