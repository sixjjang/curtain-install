# 소셜 로그인 설정 가이드

## 개요

이 가이드는 커튼 설치 매칭 플랫폼에 구글, 카카오, 네이버 소셜 로그인을 설정하는 방법을 설명합니다.

## 🔐 지원하는 소셜 로그인

1. **구글 로그인** - Firebase Authentication 내장
2. **카카오 로그인** - Firebase Custom Token 방식
3. **네이버 로그인** - Firebase Custom Token 방식

## 1. 구글 로그인 설정

### 1.1 Firebase Console에서 설정
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 → Authentication → Sign-in method
3. "Google" 제공업체 활성화
4. 프로젝트 지원 이메일 설정
5. "저장" 클릭

### 1.2 웹 클라이언트 ID 확인
- Google Cloud Console에서 웹 클라이언트 ID 확인
- Firebase Console의 Authentication > Settings > Authorized domains에서 도메인 추가

## 2. 카카오 로그인 설정

### 2.1 카카오 개발자 계정 설정
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. "내 애플리케이션" → "애플리케이션 추가하기"
3. 애플리케이션 이름: "커튼 설치 매칭"

### 2.2 플랫폼 설정
1. "플랫폼" → "Web" 선택
2. 사이트 도메인 등록:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://yourdomain.com`

### 2.3 카카오 로그인 설정
1. "카카오 로그인" → "활성화 설정" → "활성화"
2. "Redirect URI" 설정:
   - 개발: `http://localhost:3000/auth/kakao/callback`
   - 프로덕션: `https://yourdomain.com/auth/kakao/callback`

### 2.4 동의항목 설정
**필수 동의항목:**
- 닉네임 (profile_nickname)
- 프로필 사진 (profile_image)
- 이메일 (account_email)

### 2.5 JavaScript 키 확인
- "앱 키" 섹션에서 JavaScript 키 복사
- `.env.local`에 추가: `NEXT_PUBLIC_KAKAO_JS_KEY=your_key_here`

## 3. 네이버 로그인 설정

### 3.1 네이버 개발자 센터 설정
1. [Naver Developers](https://developers.naver.com/) 접속
2. "애플리케이션 등록" → "애플리케이션 등록"
3. 애플리케이션 이름: "커튼 설치 매칭"

### 3.2 서비스 환경 설정
1. "서비스 URL" 설정:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://yourdomain.com`
2. "Callback URL" 설정:
   - 개발: `http://localhost:3000/auth/naver/callback`
   - 프로덕션: `https://yourdomain.com/auth/naver/callback`

### 3.3 동의항목 설정
**필수 동의항목:**
- 이름 (name)
- 이메일 (email)
- 프로필 사진 (profile_image)

### 3.4 클라이언트 ID 확인
- "애플리케이션 정보"에서 클라이언트 ID 복사
- `.env.local`에 추가: `NEXT_PUBLIC_NAVER_CLIENT_ID=your_client_id_here`

## 4. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

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
NEXT_PUBLIC_NAVER_CALLBACK_URL=http://localhost:3000/auth/naver/callback

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Environment
NODE_ENV=development
```

## 5. Firebase Functions 설정 (카카오/네이버)

### 5.1 카카오 인증 함수
`functions/kakaoAuth.js` 파일이 이미 구현되어 있습니다.

### 5.2 네이버 인증 함수 생성
`functions/naverAuth.js` 파일을 생성해야 합니다:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.getNaverFirebaseToken = functions.https.onRequest(async (req, res) => {
  // CORS 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const naverToken = req.body.token;
  if (!naverToken) {
    res.status(400).json({ error: "네이버 토큰 필요" });
    return;
  }

  try {
    // 네이버 API로 사용자 정보 요청
    const naverUserResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${naverToken}` },
    });

    if (!naverUserResponse.ok) {
      throw new Error('네이버 사용자 정보 조회 실패');
    }

    const naverUser = await naverUserResponse.json();
    
    if (naverUser.response) {
      const uid = `naver:${naverUser.response.id}`;
      const email = naverUser.response.email;
      const displayName = naverUser.response.name;
      const photoURL = naverUser.response.profile_image;

      let firebaseUser = null;
      let isNewUser = false;

      // 기존 사용자 확인
      try {
        firebaseUser = await admin.auth().getUser(uid);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          isNewUser = true;
        } else {
          throw error;
        }
      }

      // 새 사용자인 경우 생성
      if (isNewUser) {
        firebaseUser = await admin.auth().createUser({
          uid: uid,
          email: email,
          displayName: displayName,
          photoURL: photoURL,
          emailVerified: email ? true : false,
          disabled: false
        });
      }

      // Firebase Custom Token 생성
      const customToken = await admin.auth().createCustomToken(uid, {
        provider: "naver",
        naverProfile: naverUser.response,
      });

      // Firestore에 사용자 정보 저장/업데이트
      const userDocRef = admin.firestore().collection('users').doc(uid);
      await userDocRef.set({
        provider: 'naver',
        naverId: naverUser.response.id,
        email: email,
        displayName: displayName,
        photoURL: photoURL,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        naverUserInfo: naverUser.response
      }, { merge: true });

      res.status(200).json({ 
        firebaseToken: customToken,
        userInfo: naverUser.response,
        isNewUser: isNewUser,
        message: '네이버 로그인 성공'
      });
    } else {
      res.status(401).json({ error: "유효하지 않은 네이버 사용자" });
    }
  } catch (error) {
    console.error('네이버 인증 처리 오류:', error);
    res.status(500).json({ 
      error: '인증 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});
```

### 5.3 함수 배포
```bash
cd functions
npm install
firebase deploy --only functions
```

## 6. 테스트

### 6.1 개발 서버 실행
```bash
npm run dev
```

### 6.2 각 소셜 로그인 테스트
1. 로그인 페이지에서 각 소셜 로그인 버튼 클릭
2. 팝업에서 로그인 완료
3. 대시보드로 리디렉션 확인
4. Firebase Console에서 사용자 생성 확인

## 7. 프로덕션 배포 시 주의사항

### 7.1 도메인 설정
- Firebase Console에서 Authorized domains에 프로덕션 도메인 추가
- 카카오/네이버 개발자 콘솔에서 프로덕션 도메인 등록

### 7.2 환경 변수 설정
- 프로덕션 서버에 환경 변수 설정
- Vercel, Netlify 등 배포 플랫폼에서 환경 변수 추가

### 7.3 보안 설정
- Firestore 보안 규칙 업데이트
- CORS 설정 확인

## 8. 문제 해결

### 8.1 구글 로그인이 안 되는 경우
- Firebase Console에서 Google 제공업체가 활성화되었는지 확인
- Authorized domains에 도메인이 추가되었는지 확인

### 8.2 카카오 로그인이 안 되는 경우
- JavaScript 키가 올바른지 확인
- Redirect URI가 정확한지 확인
- 동의항목이 설정되었는지 확인

### 8.3 네이버 로그인이 안 되는 경우
- 클라이언트 ID가 올바른지 확인
- Callback URL이 정확한지 확인
- 동의항목이 설정되었는지 확인

### 8.4 공통 문제
- 브라우저 콘솔에서 에러 메시지 확인
- 네트워크 탭에서 API 호출 상태 확인
- Firebase Functions 로그 확인 