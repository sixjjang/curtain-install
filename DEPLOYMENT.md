# 배포 가이드 🚀

전문가의 손길을 다양한 환경에 배포하는 방법을 안내합니다.

## 📋 배포 전 체크리스트

- [ ] Firebase 프로젝트 생성 완료
- [ ] 환경 변수 설정 완료 (`.env` 파일)
- [ ] 로컬 빌드 테스트 통과
- [ ] Firebase 보안 규칙 설정 완료

## 🌐 배포 옵션

### 1. Firebase Hosting (권장)

가장 간단하고 빠른 배포 방법입니다.

#### 설정 단계

1. **Firebase CLI 설치**
```bash
npm install -g firebase-tools
```

2. **Firebase 로그인**
```bash
firebase login
```

3. **프로젝트 초기화**
```bash
firebase init hosting
```
- 프로젝트 선택: `curtain-installation-platform`
- Public directory: `build`
- Single-page app: `Yes`
- GitHub Actions: `No` (선택사항)

4. **배포 실행**
```bash
npm run deploy
```

#### 배포 후 확인
- Firebase Console → Hosting에서 배포 상태 확인
- 제공된 URL로 접속하여 애플리케이션 동작 확인

### 2. Vercel 배포

Vercel은 React 애플리케이션에 최적화된 배포 플랫폼입니다.

#### 설정 단계

1. **Vercel CLI 설치**
```bash
npm install -g vercel
```

2. **Vercel 로그인**
```bash
vercel login
```

3. **배포**
```bash
vercel --prod
```

4. **환경 변수 설정**
Vercel 대시보드에서 환경 변수 설정:
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

### 3. Netlify 배포

Netlify는 정적 사이트 호스팅에 특화된 플랫폼입니다.

#### 설정 단계

1. **Netlify CLI 설치**
```bash
npm install -g netlify-cli
```

2. **Netlify 로그인**
```bash
netlify login
```

3. **배포**
```bash
npm run build
netlify deploy --prod --dir=build
```

4. **환경 변수 설정**
Netlify 대시보드 → Site settings → Environment variables에서 설정

### 4. GitHub Pages 배포

GitHub 저장소와 연동하여 배포할 수 있습니다.

#### 설정 단계

1. **package.json에 homepage 추가**
```json
{
  "homepage": "https://yourusername.github.io/your-repo-name"
}
```

2. **gh-pages 패키지 설치**
```bash
npm install --save-dev gh-pages
```

3. **배포 스크립트 추가**
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

4. **배포 실행**
```bash
npm run deploy
```

## 🔧 환경별 설정

### 개발 환경
```env
REACT_APP_ENV=development
REACT_APP_API_URL=http://localhost:3000
```

### 스테이징 환경
```env
REACT_APP_ENV=staging
REACT_APP_API_URL=https://staging.yourdomain.com
```

### 프로덕션 환경
```env
REACT_APP_ENV=production
REACT_APP_API_URL=https://yourdomain.com
```

## 📊 배포 후 모니터링

### Firebase Analytics 설정
1. Firebase Console → Analytics 활성화
2. 웹 앱에 Google Analytics 추가
3. 사용자 행동 추적 설정

### 오류 모니터링
1. Firebase Console → Crashlytics 활성화
2. 오류 로그 모니터링
3. 성능 분석 확인

### 사용량 모니터링
- Firebase Console에서 실시간 사용자 수 확인
- Firestore 읽기/쓰기 횟수 모니터링
- Storage 사용량 확인

## 🔒 보안 설정

### Firebase 보안 규칙 업데이트
```javascript
// Firestore 보안 규칙
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 프로덕션 환경에서 더 엄격한 규칙 적용
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.sellerId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### HTTPS 강제 적용
- Firebase Hosting: 자동으로 HTTPS 적용
- Vercel/Netlify: 자동으로 HTTPS 적용
- 커스텀 도메인: SSL 인증서 설정 필요

## 🚨 문제 해결

### 일반적인 배포 문제

1. **빌드 실패**
   - 환경 변수 누락 확인
   - TypeScript 오류 수정
   - 의존성 충돌 해결

2. **Firebase 연결 오류**
   - API 키 확인
   - 보안 규칙 검토
   - 프로젝트 ID 확인

3. **라우팅 문제**
   - SPA 설정 확인
   - 404 리다이렉트 설정
   - React Router 설정 확인

### 디버깅 도구
- 브라우저 개발자 도구
- Firebase Console 로그
- 배포 플랫폼 로그

## 📈 성능 최적화

### 빌드 최적화
- 코드 스플리팅 적용
- 이미지 최적화
- 번들 크기 최소화

### 런타임 최적화
- React.memo 사용
- 불필요한 리렌더링 방지
- 메모이제이션 적용

## 🔄 지속적 배포 (CI/CD)

### GitHub Actions 설정
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: curtain-installation-platform
```

---

**배포 완료 후 반드시 다음 사항을 확인하세요:**
- [ ] 모든 페이지 정상 로드
- [ ] 사용자 인증 기능 동작
- [ ] 데이터베이스 연결 확인
- [ ] 파일 업로드 기능 테스트
- [ ] 모바일 반응형 확인
