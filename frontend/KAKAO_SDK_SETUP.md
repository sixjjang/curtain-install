# 카카오 SDK 설정 가이드 (서버 사이드 인증 방식)

## 개요

이 가이드는 커튼 설치 매칭 플랫폼에 카카오 SDK를 통합하는 방법을 설명합니다. **서버 사이드 인증 방식**을 사용하여 보안을 강화하고 Firebase Auth와 완전히 통합합니다.

## 🔐 인증 흐름

```
1. 사용자 → 카카오 로그인
2. 카카오 → 액세스 토큰 발급
3. 클라이언트 → 서버로 토큰 전송
4. 서버 → 카카오 토큰 검증 + 사용자 정보 조회
5. 서버 → Firebase Custom Token 생성
6. 클라이언트 → Firebase Custom Token으로 로그인
7. 완료 → Firebase Auth 완전 통합
```

## 1. 카카오 개발자 계정 설정

### 1.1 카카오 개발자 계정 생성
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 카카오 계정으로 로그인
3. "내 애플리케이션" → "애플리케이션 추가하기"

### 1.2 애플리케이션 정보 설정
```
애플리케이션 이름: 커튼 설치 매칭
사업자명: [회사명]
```

## 2. 플랫폼 설정

### 2.1 웹 플랫폼 등록
1. "플랫폼" → "Web" 선택
2. 사이트 도메인 등록:
   - 개발 환경: `http://localhost:3000`
   - 프로덕션 환경: `https://yourdomain.com`

### 2.2 JavaScript 키 확인
- "앱 키" 섹션에서 JavaScript 키 복사
- 예: `1234567890abcdef1234567890abcdef`

## 3. 카카오 로그인 설정

### 3.1 카카오 로그인 활성화
1. "카카오 로그인" → "활성화 설정" → "활성화"
2. "Redirect URI" 설정:
   - 개발: `http://localhost:3000/auth/kakao/callback`
   - 프로덕션: `https://yourdomain.com/auth/kakao/callback`

### 3.2 동의항목 설정
**필수 동의항목:**
- 닉네임 (profile_nickname)
- 프로필 사진 (profile_image)
- 이메일 (account_email)

**선택 동의항목:**
- 생년월일 (birthday)
- 연령대 (age_range)
- 성별 (gender)

## 4. 코드 설정

### 4.1 JavaScript 키 설정
`frontend/src/components/KakaoLoginButton.js` 파일에서 JavaScript 키를 설정:

```javascript
window.Kakao.init("YOUR_ACTUAL_KAKAO_JAVASCRIPT_KEY");
```

### 4.2 환경변수 설정 (권장)
`.env` 파일 생성:

```env
REACT_APP_KAKAO_JS_KEY=your_kakao_javascript_key_here
```

그리고 `KakaoLoginButton.js`에서:

```javascript
window.Kakao.init(process.env.REACT_APP_KAKAO_JS_KEY);
```

## 5. Firebase Functions 설정

### 5.1 함수 배포
```bash
cd functions
npm install
firebase deploy --only functions
```

### 5.2 함수 URL 확인
배포 후 다음 URL들을 확인하세요:
- `https://your-project.cloudfunctions.net/getFirebaseToken`
- `https://your-project.cloudfunctions.net/kakaoLogout`
- `https://your-project.cloudfunctions.net/getKakaoUserInfo`

## 6. 컴포넌트 사용법

### 6.1 기본 사용법

```jsx
import KakaoLoginButton from './components/KakaoLoginButton';

function App() {
  const handleLoginSuccess = (loginData) => {
    console.log('로그인 성공:', loginData);
    // loginData.user: Firebase 사용자 객체
    // loginData.kakaoUserInfo: 카카오 사용자 정보
    // loginData.isNewUser: 새 사용자 여부
  };

  const handleLoginError = (error) => {
    console.error('로그인 실패:', error);
  };

  return (
    <KakaoLoginButton
      onLoginSuccess={handleLoginSuccess}
      onLoginError={handleLoginError}
      className="w-full"
    />
  );
}
```

### 6.2 완전한 예제

```jsx
import React, { useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import KakaoLoginButton from "./KakaoLoginButton";

const KakaoLoginExample = () => {
  const [user, setUser] = useState(null);
  const auth = getAuth();

  const handleLoginSuccess = (loginData) => {
    setUser(loginData.user);
    
    if (loginData.isNewUser) {
      alert("커튼 설치 매칭에 오신 것을 환영합니다!");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div>
      {!user ? (
        <KakaoLoginButton
          onLoginSuccess={handleLoginSuccess}
          onLoginError={(error) => console.error(error)}
        />
      ) : (
        <div>
          <h2>안녕하세요, {user.displayName}님!</h2>
          <button onClick={handleLogout}>로그아웃</button>
        </div>
      )}
    </div>
  );
};
```

## 7. 서버 사이드 API

### 7.1 Firebase Custom Token 생성
**엔드포인트:** `POST /api/getFirebaseToken`

**요청:**
```json
{
  "token": "카카오_액세스_토큰"
}
```

**응답:**
```json
{
  "firebaseToken": "Firebase_Custom_Token",
  "userInfo": {
    "id": "카카오_사용자_ID",
    "properties": {
      "nickname": "사용자_닉네임",
      "profile_image": "프로필_이미지_URL"
    },
    "kakao_account": {
      "email": "사용자_이메일"
    }
  },
  "isNewUser": false,
  "message": "카카오 로그인 성공"
}
```

### 7.2 카카오 로그아웃
**엔드포인트:** `POST /api/kakaoLogout`

**요청:**
```json
{
  "uid": "Firebase_사용자_ID"
}
```

### 7.3 사용자 정보 조회
**엔드포인트:** `GET /api/getKakaoUserInfo?uid=사용자_ID`

## 8. 보안 고려사항

### 8.1 토큰 검증
- 모든 카카오 토큰은 서버에서 검증
- 클라이언트에서는 Firebase Custom Token만 사용
- 토큰 만료 시간 관리

### 8.2 CORS 설정
- 허용된 도메인만 API 접근 가능
- 프로덕션에서는 특정 도메인으로 제한

### 8.3 에러 처리
- 토큰 검증 실패 시 적절한 에러 메시지
- 사용자 친화적인 에러 메시지 제공

## 9. 데이터베이스 구조

### 9.1 Firestore 사용자 컬렉션
```javascript
users/{uid} = {
  provider: 'kakao',
  kakaoId: '카카오_사용자_ID',
  email: '사용자_이메일',
  displayName: '사용자_닉네임',
  photoURL: '프로필_이미지_URL',
  lastLogin: Timestamp,
  updatedAt: Timestamp,
  kakaoUserInfo: {
    // 카카오에서 받은 전체 사용자 정보
  }
}
```

## 10. 테스트

### 10.1 로컬 테스트
```bash
# 개발 서버 실행
npm start

# Firebase Functions 로컬 실행
cd functions
npm run serve

# 카카오 로그인 테스트
# 브라우저에서 http://localhost:3000 접속
```

### 10.2 프로덕션 배포
```bash
# 프론트엔드 빌드
npm run build

# Firebase Functions 배포
firebase deploy --only functions

# Firebase Hosting 배포
firebase deploy --only hosting
```

## 11. 문제 해결

### 11.1 일반적인 오류

#### "카카오 SDK를 찾을 수 없습니다"
- `index.html`에 카카오 SDK 스크립트가 제대로 로드되었는지 확인
- 네트워크 탭에서 스크립트 로딩 상태 확인

#### "카카오 SDK가 초기화되지 않았습니다"
- JavaScript 키가 올바른지 확인
- 도메인이 카카오 개발자 콘솔에 등록되었는지 확인

#### "서버 응답 오류"
- Firebase Functions가 제대로 배포되었는지 확인
- 함수 URL이 올바른지 확인
- CORS 설정 확인

#### "Firebase 토큰을 받지 못했습니다"
- 서버 로그 확인
- 카카오 토큰이 유효한지 확인
- Firebase 프로젝트 설정 확인

### 11.2 디버깅
```javascript
// 브라우저 콘솔에서 확인
console.log('Kakao SDK:', window.Kakao);
console.log('초기화 상태:', window.Kakao.isInitialized());
console.log('로그인 상태:', window.Kakao.Auth.getAccessToken());

// Firebase Functions 로그 확인
firebase functions:log
```

## 12. 성능 최적화

### 12.1 지연 로딩
```javascript
// 카카오 SDK 지연 로딩
const loadKakaoSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.Kakao) {
      resolve(window.Kakao);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.onload = () => resolve(window.Kakao);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};
```

### 12.2 에러 바운더리
```jsx
class KakaoErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('카카오 SDK 오류:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>카카오 서비스에 문제가 발생했습니다.</div>;
    }

    return this.props.children;
  }
}
```

## 13. 추가 기능

### 13.1 카카오톡 공유
```jsx
import KakaoShare from './components/KakaoShare';

<KakaoShare 
  jobData={job}
  className="mt-4"
/>
```

### 13.2 카카오톡 채널 추가
```javascript
import { addKakaoChannel } from '../utils/kakaoSDK';

<button onClick={() => addKakaoChannel('YOUR_CHANNEL_ID')}>
  카카오톡 채널 추가
</button>
```

## 14. 모니터링

### 14.1 Firebase Functions 모니터링
- Firebase Console에서 함수 실행 로그 확인
- 에러율 및 응답 시간 모니터링
- 사용량 및 비용 추적

### 14.2 카카오 개발자 콘솔
- 카카오 로그인 통계 확인
- 에러 로그 및 사용량 확인
- 동의항목별 통계 확인

## 15. 업데이트 및 유지보수

### 15.1 정기 업데이트
- 카카오 SDK 버전 업데이트
- Firebase Functions 의존성 업데이트
- 보안 패치 적용

### 15.2 백업 및 복구
- 사용자 데이터 정기 백업
- 장애 복구 계획 수립
- 데이터 마이그레이션 계획

이제 카카오 SDK가 서버 사이드 인증 방식으로 완전히 통합되어 보안성과 안정성을 모두 확보했습니다! 🎉

## 📋 체크리스트

- [ ] 카카오 개발자 계정 생성
- [ ] 애플리케이션 설정 완료
- [ ] JavaScript 키 설정
- [ ] 도메인 등록
- [ ] 동의항목 설정
- [ ] Firebase Functions 배포
- [ ] 프론트엔드 컴포넌트 통합
- [ ] 테스트 완료
- [ ] 프로덕션 배포
- [ ] 모니터링 설정 