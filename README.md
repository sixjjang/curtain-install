# 커튼 시공 관리 플랫폼

## 🚨 현재 상황: Firebase Storage CORS 오류

현재 Firebase Storage에서 CORS 오류가 발생하고 있습니다. 이는 Firebase Storage 설정이 완료되지 않았기 때문입니다.

### ✅ 임시 해결책
- **회원가입**: 이미지 없이도 정상적으로 회원가입이 가능합니다
- **이미지 업로드**: 로컬에 임시 저장되어 사용할 수 있습니다
- **사용자 경험**: 오류 없이 모든 기능을 이용할 수 있습니다

### 🔧 CORS 설정 방법 (관리자용)

1. **Firebase Console** 접속: https://console.firebase.google.com/
2. **프로젝트**: `curtain-install` 선택
3. **Storage** → **Rules** 탭으로 이동
4. **CORS 설정 추가**:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]
```

자세한 설정 방법은 [FIREBASE_STORAGE_CORS_SETUP.md](./FIREBASE_STORAGE_CORS_SETUP.md)를 참조하세요.

## 📋 프로젝트 개요

커튼 시공 관리 플랫폼은 커튼 판매자와 시공업체를 연결하는 웹 애플리케이션입니다.

### 주요 기능
- **판매자**: 커튼 판매, 시공업체 매칭, 주문 관리
- **시공업체**: 작업 수락, 일정 관리, 완료 보고
- **관리자**: 사용자 관리, 작업 모니터링, 통계 분석

### 기술 스택
- **Frontend**: React, TypeScript, Material-UI
- **Backend**: Firebase (Firestore, Storage, Auth)
- **배포**: Firebase Hosting

## 🚀 시작하기

### 필수 요구사항
- Node.js 16+ 
- npm 또는 yarn
- Firebase 프로젝트

### 설치 및 실행

1. **의존성 설치**
```bash
npm install
```

2. **환경 변수 설정**
```bash
cp env.example .env
```
`.env` 파일에 Firebase 설정을 추가하세요.

3. **개발 서버 실행**
```bash
npm start
```

4. **빌드**
```bash
npm run build
```

## 📁 프로젝트 구조

```
src/
├── apps/                    # 애플리케이션별 컴포넌트
│   ├── admin/              # 관리자 앱
│   ├── contractor/         # 시공업체 앱
│   ├── customer/           # 고객 앱
│   └── seller/             # 판매자 앱
├── shared/                 # 공통 컴포넌트 및 서비스
│   ├── components/         # 공통 컴포넌트
│   ├── contexts/           # React Context
│   ├── services/           # API 서비스
│   └── utils/              # 유틸리티 함수
├── types/                  # TypeScript 타입 정의
└── firebase/               # Firebase 설정
```

## 🔐 인증 및 권한

### 사용자 역할
- **판매자**: 커튼 판매 및 주문 관리
- **시공업체**: 시공 작업 수행
- **관리자**: 시스템 전체 관리

### 승인 프로세스
1. 회원가입 → 관리자 승인 대기
2. 관리자 승인 → 서비스 이용 가능
3. 거부 시 → 서비스 이용 불가

## 📱 주요 페이지

### 판매자
- 대시보드: 매출 통계, 주문 현황
- 작업 관리: 주문 목록, 시공업체 매칭
- 프로필: 기본 정보, 픽업 정보

### 시공업체
- 대시보드: 작업 현황, 수익 통계
- 작업 목록: 수락한 작업, 완료된 작업
- 프로필: 기본 정보, 서비스 지역

### 관리자
- 사용자 관리: 승인, 거부, 정지
- 작업 관리: 전체 작업 모니터링
- 통계: 매출, 작업 완료율 등

## 🔧 개발 가이드

### 코드 스타일
- TypeScript 사용
- Material-UI 컴포넌트 활용
- 함수형 컴포넌트 및 Hooks 사용

### 상태 관리
- React Context API 사용
- Firebase 실시간 데이터베이스 활용

### 에러 처리
- 사용자 친화적 에러 메시지
- 네트워크 오류 대응
- CORS 오류 임시 해결책

## 🚨 알려진 문제

### Firebase Storage CORS 오류
- **현상**: 이미지 업로드 시 CORS 오류 발생
- **원인**: Firebase Storage CORS 설정 미완료
- **해결책**: 
  1. Firebase Console에서 CORS 설정
  2. 임시로 로컬 저장 사용
  3. 설정 완료 후 서버 저장으로 전환

### 임시 해결책
- 이미지 없이 회원가입 가능
- 로컬에 임시 저장하여 사용
- CORS 설정 완료 후 자동으로 서버 저장 전환

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. [FIREBASE_STORAGE_CORS_SETUP.md](./FIREBASE_STORAGE_CORS_SETUP.md)
2. [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
3. [QUICK_START.md](./QUICK_START.md)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
