# 간단한 카카오 로그인 설정 가이드

## 개요

이 가이드는 **간소화된 카카오 로그인 시스템**을 설정하는 방법을 설명합니다. 복잡한 기능을 제거하고 핵심 기능만 남겨 더 쉽게 구현할 수 있습니다.

## 🔐 인증 흐름

```
1. 사용자 → 카카오 로그인
2. 카카오 → 액세스 토큰 발급
3. 클라이언트 → 서버로 토큰 전송
4. 서버 → 카카오 사용자 정보 조회
5. 서버 → Firebase Custom Token 생성 (UID: kakao:카카오ID)
6. 클라이언트 → Firebase Custom Token으로 로그인
7. 완료 → Firebase Auth 완전 통합
```

## 1. 카카오 개발자 설정

### 1.1 애플리케이션 생성
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. "내 애플리케이션" → "애플리케이션 추가하기"
3. 애플리케이션 이름: "커튼 설치 매칭"

### 1.2 플랫폼 설정
1. "플랫폼" → "Web" 선택
2. 사이트 도메인 등록:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://yourdomain.com`

### 1.3 카카오 로그인 설정
1. "카카오 로그인" → "활성화 설정" → "활성화"
2. "Redirect URI" 설정:
   - 개발: `http://localhost:3000/auth/kakao/callback`
   - 프로덕션: `https://yourdomain.com/auth/kakao/callback`

### 1.4 동의항목 설정
**필수 동의항목:**
- 닉네임 (profile_nickname)
- 프로필 사진 (profile_image)
- 이메일 (account_email)

## 2. 코드 설정

### 2.1 JavaScript 키 설정
`frontend/src/components/SimpleKakaoLogin.js`에서:

```javascript
window.Kakao.init("YOUR_KAKAO_JAVASCRIPT_KEY");
```

### 2.2 환경변수 설정 (권장)
`.env` 파일:
```env
REACT_APP_KAKAO_JS_KEY=your_kakao_javascript_key_here
```

그리고 코드에서:
```javascript
window.Kakao.init(process.env.REACT_APP_KAKAO_JS_KEY);
```

## 3. Firebase Functions 배포

### 3.1 함수 배포
```bash
cd functions
npm install
firebase deploy --only functions
```

### 3.2 함수 URL 확인
배포 후 URL 확인:
- `https://your-project.cloudfunctions.net/getFirebaseToken`

## 4. 컴포넌트 사용법

### 4.1 간단한 사용법
```jsx
import SimpleKakaoLogin from './components/SimpleKakaoLogin';

function App() {
  return (
    <div>
      <SimpleKakaoLogin />
    </div>
  );
}
```

### 4.2 고급 사용법 (콜백 포함)
```jsx
import KakaoLoginButton from './components/KakaoLoginButton';

function App() {
  const handleLoginSuccess = (loginData) => {
    console.log('로그인 성공:', loginData.user);
    console.log('카카오 정보:', loginData.kakaoUserInfo);
    console.log('새 사용자:', loginData.isNewUser);
  };

  return (
    <KakaoLoginButton
      onLoginSuccess={handleLoginSuccess}
      onLoginError={(error) => console.error('로그인 실패:', error)}
    />
  );
}
```

## 5. 데이터베이스 구조

### 5.1 Firebase Auth 사용자
```
UID: kakao:카카오ID
이메일: 사용자_이메일
닉네임: 사용자_닉네임
프로필사진: 프로필_이미지_URL
```

### 5.2 Firestore 사용자 컬렉션
```javascript
users/kakao:카카오ID = {
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

## 6. API 엔드포인트

### 6.1 Firebase Custom Token 생성
**POST** `/api/getFirebaseToken`

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

## 7. 테스트

### 7.1 로컬 테스트
```bash
# 개발 서버 실행
npm start

# Firebase Functions 로컬 실행
cd functions
npm run serve

# 브라우저에서 http://localhost:3000 접속
```

### 7.2 프로덕션 배포
```bash
# 프론트엔드 빌드
npm run build

# Firebase Functions 배포
firebase deploy --only functions

# Firebase Hosting 배포
firebase deploy --only hosting
```

## 8. 문제 해결

### 8.1 일반적인 오류

#### "카카오 SDK를 찾을 수 없습니다"
- `index.html`에 카카오 SDK 스크립트 확인
- 네트워크 탭에서 스크립트 로딩 상태 확인

#### "카카오 SDK가 초기화되지 않았습니다"
- JavaScript 키가 올바른지 확인
- 도메인이 카카오 개발자 콘솔에 등록되었는지 확인

#### "서버 응답 오류"
- Firebase Functions가 제대로 배포되었는지 확인
- 함수 URL이 올바른지 확인

#### "Firebase 토큰을 받지 못했습니다"
- 서버 로그 확인: `firebase functions:log`
- 카카오 토큰이 유효한지 확인

### 8.2 디버깅
```javascript
// 브라우저 콘솔에서 확인
console.log('Kakao SDK:', window.Kakao);
console.log('초기화 상태:', window.Kakao.isInitialized());
console.log('로그인 상태:', window.Kakao.Auth.getAccessToken());

// Firebase Functions 로그 확인
firebase functions:log
```

## 9. 보안 고려사항

### 9.1 토큰 관리
- 모든 카카오 토큰은 서버에서 검증
- 클라이언트에서는 Firebase Custom Token만 사용
- UID 중복 방지를 위해 `kakao:카카오ID` 형식 사용

### 9.2 CORS 설정
- 허용된 도메인만 API 접근 가능
- 프로덕션에서는 특정 도메인으로 제한

### 9.3 에러 처리
- 토큰 검증 실패 시 적절한 에러 메시지
- 사용자 친화적인 알림 제공

## 10. 성능 최적화

### 10.1 지연 로딩
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

### 10.2 에러 바운더리
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

## 11. 추가 기능

### 11.1 카카오톡 공유
```jsx
import KakaoShare from './components/KakaoShare';

<KakaoShare 
  jobData={job}
  className="mt-4"
/>
```

### 11.2 사용자 상태 관리
```jsx
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const auth = getAuth();

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('사용자 로그인됨:', user);
    } else {
      console.log('사용자 로그아웃됨');
    }
  });

  return () => unsubscribe();
}, []);
```

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

## 🎯 핵심 장점

1. **간단함**: 복잡한 기능 제거로 구현이 쉬움
2. **보안성**: 서버 사이드 토큰 검증
3. **안정성**: Firebase Auth 완전 통합
4. **확장성**: 필요시 추가 기능 구현 가능
5. **유지보수**: 코드가 간결하여 유지보수 용이

이제 간단하고 안전한 카카오 로그인 시스템이 완성되었습니다! 🎉 