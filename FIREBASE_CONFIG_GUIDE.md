# 🔧 Firebase 설정 문제 해결 가이드

## 🚨 현재 오류: `auth/invalid-api-key`

이 오류는 Firebase API 키가 설정되지 않았거나 잘못되었을 때 발생합니다.

## 📋 해결 단계

### 1단계: Firebase Console에서 웹 앱 설정 확인

1. [Firebase Console](https://console.firebase.google.com/project/curtain-install/overview)에 접속
2. 프로젝트: `curtain-install` 선택
3. 왼쪽 메뉴에서 "프로젝트 설정" 클릭 (⚙️ 아이콘)
4. "일반" 탭에서 "내 앱" 섹션 확인

### 2단계: 웹 앱 등록 (아직 등록되지 않은 경우)

1. "웹 앱 추가" 버튼 클릭
2. 앱 닉네임: `curtain-platform-web`
3. "앱 등록" 클릭
4. Firebase SDK 설정 정보 복사

### 3단계: 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 정보를 입력:

```env
# Firebase Configuration (curtain-install 프로젝트용)
REACT_APP_FIREBASE_API_KEY=AIzaSyC... (Firebase에서 복사한 API 키)
REACT_APP_FIREBASE_AUTH_DOMAIN=curtain-install.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=curtain-install
REACT_APP_FIREBASE_STORAGE_BUCKET=curtain-install.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=552565384276
REACT_APP_FIREBASE_APP_ID=1:552565384276:web:... (Firebase에서 복사)

# App Configuration
REACT_APP_APP_NAME=전문가의 손길
REACT_APP_VERSION=1.0.0
```

### 4단계: Firebase 서비스 활성화

#### Authentication 설정
1. Firebase Console → Authentication → 시작하기
2. "이메일/비밀번호" 제공업체 활성화
3. "사용자 등록" 활성화

#### Firestore Database 설정
1. Firebase Console → Firestore Database → 데이터베이스 만들기
2. 테스트 모드로 시작
3. 위치 선택 (가까운 지역)

#### Storage 설정
1. Firebase Console → Storage → 시작하기
2. 테스트 모드로 시작

### 5단계: 개발 서버 재시작

```bash
npm start
```

## 🔍 문제 진단

### 환경 변수 확인
```bash
# .env 파일이 있는지 확인
ls -la .env

# .env 파일 내용 확인 (API 키는 가려져 있음)
cat .env
```

### Firebase 설정 확인
```bash
# Firebase 프로젝트 확인
firebase projects:list

# 현재 프로젝트 확인
firebase use
```

## 🚨 일반적인 문제들

### 1. API 키가 잘못된 경우
- Firebase Console에서 올바른 프로젝트 선택
- 웹 앱 설정에서 API 키 복사
- `.env` 파일의 `REACT_APP_FIREBASE_API_KEY` 업데이트

### 2. 프로젝트 ID가 잘못된 경우
- 현재 프로젝트: `curtain-install`
- `.env` 파일의 `REACT_APP_FIREBASE_PROJECT_ID` 확인

### 3. 웹 앱이 등록되지 않은 경우
- Firebase Console에서 웹 앱 등록
- 새로운 앱 닉네임으로 등록

### 4. 환경 변수가 로드되지 않는 경우
- `.env` 파일이 프로젝트 루트에 있는지 확인
- 파일명이 정확히 `.env`인지 확인
- 개발 서버 재시작

## 📱 테스트

환경 변수 설정 후:

1. 개발 서버 재시작: `npm start`
2. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속
3. 회원가입/로그인 테스트
4. Firebase Console에서 사용자 생성 확인

## 🔄 배포 업데이트

환경 변수 설정 후 재배포:

```bash
npm run build
firebase deploy
```

---

**💡 팁**: Firebase Console에서 웹 앱 설정을 복사할 때, 모든 필드를 정확히 복사해야 합니다. 특히 API 키와 앱 ID가 중요합니다.
