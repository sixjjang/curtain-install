# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `curtain-installation-platform` (또는 원하는 이름)
4. Google Analytics 활성화 (선택사항)
5. "프로젝트 만들기" 클릭

## 2. 웹 앱 등록

1. 프로젝트 대시보드에서 "웹" 아이콘 클릭
2. 앱 닉네임: `curtain-platform-web`
3. "앱 등록" 클릭
4. Firebase SDK 설정 정보 복사

## 3. 환경 변수 설정

1. 프로젝트 루트에 `.env` 파일 생성
2. `env.example` 파일을 참고하여 Firebase 설정 정보 입력:

```env
REACT_APP_FIREBASE_API_KEY=your_actual_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## 4. Firebase 서비스 설정

### Authentication 설정
1. Firebase Console → Authentication → 시작하기
2. "이메일/비밀번호" 제공업체 활성화
3. "사용자 등록" 활성화

### Firestore Database 설정
1. Firebase Console → Firestore Database → 데이터베이스 만들기
2. 보안 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 인증 확인
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 관리자는 모든 데이터 접근 가능
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 시공 작업 관련 규칙
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.sellerId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // 리뷰 관련 규칙
    match /reviews/{reviewId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage 설정
1. Firebase Console → Storage → 시작하기
2. 보안 규칙 설정:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 5. 배포 준비

### 빌드 테스트
```bash
npm run build
```

### 배포 옵션
1. **Firebase Hosting** (권장)
2. **Vercel**
3. **Netlify**
4. **GitHub Pages**

## 6. Firebase Hosting 배포

1. Firebase CLI 설치:
```bash
npm install -g firebase-tools
```

2. Firebase 로그인:
```bash
firebase login
```

3. 프로젝트 초기화:
```bash
firebase init hosting
```

4. 빌드 및 배포:
```bash
npm run build
firebase deploy
```

## 7. 보안 고려사항

- `.env` 파일을 `.gitignore`에 추가
- Firebase 보안 규칙 정기적 검토
- API 키 노출 방지
- 사용자 권한 관리 철저히

## 8. 모니터링

- Firebase Console에서 사용량 모니터링
- 오류 로그 확인
- 성능 분석 활용
