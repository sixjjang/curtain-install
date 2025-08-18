# 전문가의 손길 🏠

커튼 판매자와 시공자를 연결하는 플랫폼으로, 게임화된 레벨 시스템을 통해 시공자의 신뢰성과 숙련도를 검증하고 보상하는 웹 애플리케이션입니다.

## 🎯 주요 기능

### 👥 사용자 역할
- **판매자 (Seller)**: 커튼을 판매하고 시공을 의뢰
- **시공자 (Contractor)**: 시공 작업을 수락하고 고객 댁에 방문하여 시공
- **고객 (Customer)**: 커튼 구매 및 시공 후 평가
- **관리자 (Admin)**: 플랫폼 전체 관리

### 🎮 레벨 시스템
- 시공자가 작업 완료 시 경험치 획득
- 고객 만족도에 따른 추가 경험치 보상
- 레벨 상승에 따른 시공비 증가
- 높은 레벨의 시공자에게 우선 작업 추천

### 🔧 기술 스택
- **Frontend**: React 19 + TypeScript
- **UI Framework**: Material-UI (MUI)
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Routing**: React Router v7
- **State Management**: React Context API

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn
- Firebase 계정

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd construction-platform
```

2. **의존성 설치**
```bash
npm install
```

3. **Firebase 설정**
   - [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
   - `FIREBASE_SETUP.md` 파일 참조하여 Firebase 서비스 설정
   - 프로젝트 루트에 `.env` 파일 생성하고 Firebase 설정 정보 입력

4. **개발 서버 실행**
```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 애플리케이션을 확인할 수 있습니다.

## 📁 프로젝트 구조

```
src/
├── apps/                    # 역할별 애플리케이션
│   ├── admin/              # 관리자 앱
│   ├── contractor/         # 시공자 앱
│   ├── customer/           # 고객 설문
│   └── seller/             # 판매자 앱
├── shared/                 # 공통 컴포넌트 및 서비스
│   ├── components/         # 공통 UI 컴포넌트
│   ├── contexts/           # React Context
│   └── services/           # 비즈니스 로직 서비스
├── firebase/               # Firebase 설정
└── types.ts               # TypeScript 타입 정의
```

## 🔐 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 정보를 입력하세요:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## 📦 사용 가능한 스크립트

- `npm start` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm test` - 테스트 실행
- `npm run deploy` - Firebase Hosting에 배포
- `npm run deploy:preview` - 미리보기 채널에 배포
- `npm run analyze` - 빌드 분석

## 🌐 배포

### Firebase Hosting 배포

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

4. **배포**
```bash
npm run deploy
```

### 다른 배포 옵션
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: `npm run deploy`

## 🎮 레벨 시스템 상세

### 경험치 계산
- 기본 작업 완료: 50 경험치
- 고객 만족도 5점: +25 경험치
- 고객 만족도 4점: +15 경험치
- 고객 만족도 3점: +5 경험치
- 고객 만족도 2점 이하: +0 경험치

### 레벨별 혜택
- **레벨 1-5**: 초급 시공자 (기본 시공비)
- **레벨 6-10**: 중급 시공자 (시공비 +10%)
- **레벨 11-15**: 고급 시공자 (시공비 +20%)
- **레벨 16+**: 마스터 시공자 (시공비 +30%)

## 🔒 보안

- Firebase 보안 규칙을 통한 데이터 접근 제어
- 사용자 인증 및 권한 관리
- API 키 보안 유지
- 정기적인 보안 규칙 검토

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

프로젝트에 대한 질문이나 문제가 있으시면 이슈를 생성해 주세요.

---

**전문가의 손길** - 신뢰할 수 있는 시공 서비스로 더 나은 고객 경험을 제공합니다.
