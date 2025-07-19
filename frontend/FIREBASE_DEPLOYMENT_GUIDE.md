# Firebase 배포 가이드

## 개요

이 가이드는 커튼 설치 매칭 플랫폼을 Firebase 서버에 배포하는 방법을 설명합니다. 로컬 서버 대신 Firebase Hosting과 Cloud Functions를 사용합니다.

## 🔧 사전 준비

### 1. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 2. Firebase 로그인
```bash
firebase login
```

### 3. 프로젝트 초기화
```bash
firebase init
```

## 📁 프로젝트 구조

```
curtain-install/
├── frontend/          # Next.js 프론트엔드
├── functions/         # Firebase Cloud Functions
└── firebase.json      # Firebase 설정
```

## 🚀 배포 단계

### 1. 환경 변수 설정

#### 1.1 프론트엔드 환경 변수 (.env.local)
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Firebase VAPID Key (for FCM)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here

# Social Login Configuration
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_javascript_key_here
NEXT_PUBLIC_NAVER_CLIENT_ID=your_naver_client_id_here
NEXT_PUBLIC_NAVER_CALLBACK_URL=https://your_project.firebaseapp.com/auth/naver/callback

# Biometric Authentication Configuration
NEXT_PUBLIC_RP_ID=your_project.firebaseapp.com
NEXT_PUBLIC_RP_NAME=커튼 설치 매칭
NEXT_PUBLIC_RP_ORIGIN=https://your_project.firebaseapp.com

# API Configuration
NEXT_PUBLIC_API_URL=https://your_project.firebaseapp.com/api
```

#### 1.2 Firebase Functions 환경 변수
```bash
# Firebase Functions 환경 변수 설정
firebase functions:config:set biometric.rp_id="your_project.firebaseapp.com"
firebase functions:config:set biometric.rp_name="커튼 설치 매칭"
firebase functions:config:set biometric.rp_origin="https://your_project.firebaseapp.com"
firebase functions:config:set webauthn.timeout="60000"
firebase functions:config:set webauthn.attestation="direct"
```

### 2. 의존성 설치

#### 2.1 프론트엔드 의존성
```bash
cd frontend
npm install
```

#### 2.2 Firebase Functions 의존성
```bash
cd functions
npm install
```

### 3. 빌드 및 배포

#### 3.1 프론트엔드 빌드
```bash
cd frontend
npm run build
npm run export
```

#### 3.2 Firebase Functions 배포
```bash
cd functions
firebase deploy --only functions
```

#### 3.3 Firebase Hosting 배포
```bash
firebase deploy --only hosting
```

#### 3.4 전체 배포
```bash
firebase deploy
```

## 🔐 보안 설정

### 1. Firebase Authentication 설정
1. Firebase Console → Authentication → Sign-in method
2. 이메일/비밀번호 활성화
3. 소셜 로그인 설정 (카카오, 네이버, 구글)
4. 도메인 허용 목록에 Firebase 호스팅 도메인 추가

### 2. Firestore 보안 규칙
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 인증 확인
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // 관리자 권한 확인
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 사용자 본인 확인
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // 사용자 컬렉션
    match /users/{userId} {
      allow read, write: if isOwner(userId) || isAdmin();
    }
    
    // 생체인증 자격증명
    match /biometricCredentials/{credentialId} {
      allow read, write: if isAuthenticated();
    }
    
    // 세션 관리
    match /sessions/{sessionId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

### 3. Storage 보안 규칙
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 인증된 사용자만 접근
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🌐 도메인 설정

### 1. 커스텀 도메인 설정 (선택사항)
1. Firebase Console → Hosting → Custom domains
2. 도메인 추가 및 DNS 설정
3. SSL 인증서 자동 발급 대기

### 2. 환경 변수 업데이트
커스텀 도메인 사용 시 환경 변수 업데이트:
```env
NEXT_PUBLIC_RP_ID=yourdomain.com
NEXT_PUBLIC_RP_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

## 📊 모니터링 및 로그

### 1. Firebase Functions 로그 확인
```bash
firebase functions:log
```

### 2. 특정 함수 로그 확인
```bash
firebase functions:log --only generateBiometricRegistrationOptions
```

### 3. 실시간 로그 모니터링
```bash
firebase functions:log --follow
```

## 🔧 문제 해결

### 1. 일반적인 배포 오류
- **CORS 오류**: Firebase Functions에서 CORS 헤더 설정 확인
- **환경 변수 누락**: Firebase Functions 환경 변수 설정 확인
- **권한 오류**: Firestore 보안 규칙 확인

### 2. 생체인증 관련 문제
- **HTTPS 필수**: Firebase Hosting은 자동으로 HTTPS 제공
- **도메인 불일치**: RP_ID와 실제 도메인이 일치하는지 확인
- **브라우저 지원**: WebAuthn 지원 브라우저에서만 작동

### 3. 성능 최적화
- **함수 콜드 스타트**: 자주 사용되는 함수는 Keep Warm 설정
- **캐싱**: Firebase Hosting 캐싱 설정 활용
- **CDN**: Firebase Hosting의 글로벌 CDN 활용

## 📱 모바일 최적화

### 1. PWA 설정
- `manifest.json` 설정
- Service Worker 등록
- 오프라인 지원

### 2. 모바일 브라우저 호환성
- iOS Safari WebAuthn 지원 확인
- Android Chrome 생체인증 테스트
- 반응형 디자인 적용

## 🔄 CI/CD 파이프라인

### 1. GitHub Actions 예제
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install Dependencies
      run: |
        cd frontend && npm install
        cd ../functions && npm install
    
    - name: Build Frontend
      run: |
        cd frontend
        npm run build
        npm run export
    
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: your-project-id
```

## 📞 지원 및 문의

배포 중 문제가 발생하면:
1. Firebase Console 로그 확인
2. Firebase CLI 로그 확인
3. 브라우저 개발자 도구 콘솔 확인
4. 네트워크 탭에서 API 호출 확인

## 🔗 유용한 링크

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Firebase Functions Guide](https://firebase.google.com/docs/functions)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/) 