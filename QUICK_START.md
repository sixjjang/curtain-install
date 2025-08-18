# 🚀 빠른 시작 가이드

전문가의 손길을 10분 안에 배포하는 방법입니다.

## 📋 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `curtain-installation-platform`
4. Google Analytics 비활성화 (선택사항)
5. "프로젝트 만들기" 클릭

## 🔧 2단계: 웹 앱 등록

1. 프로젝트 대시보드에서 "웹" 아이콘 클릭
2. 앱 닉네임: `curtain-platform-web`
3. "앱 등록" 클릭
4. Firebase SDK 설정 정보 복사 (아래 참고)

## ⚙️ 3단계: 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 정보를 입력:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyC... (Firebase에서 복사한 API 키)
REACT_APP_FIREBASE_AUTH_DOMAIN=curtain-installation-platform.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=curtain-installation-platform
REACT_APP_FIREBASE_STORAGE_BUCKET=curtain-installation-platform.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789 (Firebase에서 복사)
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef (Firebase에서 복사)

REACT_APP_APP_NAME=전문가의 손길
REACT_APP_VERSION=1.0.0
```

## 🔐 4단계: Firebase 서비스 설정

### Authentication 설정
1. Firebase Console → Authentication → 시작하기
2. "이메일/비밀번호" 제공업체 활성화
3. "사용자 등록" 활성화

### Firestore Database 설정
1. Firebase Console → Firestore Database → 데이터베이스 만들기
2. 테스트 모드로 시작 (30일 후 보안 규칙 설정)
3. 위치 선택 (가까운 지역)

### Storage 설정
1. Firebase Console → Storage → 시작하기
2. 테스트 모드로 시작

## 🚀 5단계: 배포

### Firebase CLI 로그인
```bash
firebase login
```

### 프로젝트 초기화
```bash
firebase init hosting
```
- 프로젝트 선택: `curtain-installation-platform`
- Public directory: `build`
- Single-page app: `Yes`
- GitHub Actions: `No`

### 배포 실행
```bash
npm run deploy
```

## ✅ 6단계: 확인

1. Firebase Console → Hosting에서 배포 URL 확인
2. 제공된 URL로 접속하여 애플리케이션 동작 확인
3. 회원가입/로그인 테스트
4. 각 역할별 페이지 접근 테스트

## 🎯 테스트 계정

배포 후 다음 계정으로 테스트할 수 있습니다:

### 관리자 계정 생성
1. 회원가입에서 "관리자" 역할 선택
2. 이메일: `admin@test.com`
3. 비밀번호: `admin123`

### 판매자 계정 생성
1. 회원가입에서 "판매자" 역할 선택
2. 이메일: `seller@test.com`
3. 비밀번호: `seller123`

### 시공자 계정 생성
1. 회원가입에서 "시공자" 역할 선택
2. 이메일: `contractor@test.com`
3. 비밀번호: `contractor123`

## 🔧 문제 해결

### 빌드 오류
```bash
npm run build
```
오류가 발생하면 TypeScript 오류를 수정 후 다시 시도

### Firebase 연결 오류
- 환경 변수가 올바르게 설정되었는지 확인
- Firebase 프로젝트 ID가 정확한지 확인

### 배포 오류
```bash
firebase logout
firebase login
firebase init hosting
```

## 📱 모바일 테스트

배포된 URL을 모바일 브라우저에서 접속하여 반응형 디자인 확인

## 🔄 업데이트

코드 변경 후 재배포:
```bash
npm run build
firebase deploy
```

---

**🎉 축하합니다! 전문가의 손길이 성공적으로 배포되었습니다!**
