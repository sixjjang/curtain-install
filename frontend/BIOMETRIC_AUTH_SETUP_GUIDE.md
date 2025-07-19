# 생체인증 로그인 설정 가이드

## 개요

이 가이드는 커튼 설치 매칭 플랫폼에 생체인증(지문, 얼굴인식) 로그인을 설정하는 방법을 설명합니다. Web Authentication API(WebAuthn)를 사용하여 구현됩니다.

## 🔐 지원하는 생체인증

1. **지문 인식** - Touch ID, Windows Hello, Android 지문
2. **얼굴 인식** - Face ID, Windows Hello, Android 얼굴인식
3. **PIN/패턴** - 보조 인증 방식

## 📋 요구사항

### 브라우저 지원
- Chrome 67+
- Firefox 60+
- Safari 13+
- Edge 18+

### 하드웨어 요구사항
- 지문 센서 또는 얼굴인식 카메라
- TPM(Trusted Platform Module) 또는 Secure Enclave

## 1. WebAuthn 라이브러리 설치

### 1.1 Firebase Functions에 라이브러리 추가
```bash
cd functions
npm install @simplewebauthn/server @simplewebauthn/browser
```

### 1.2 프론트엔드에 라이브러리 추가
```bash
cd frontend
npm install @simplewebauthn/browser
```

## 2. Firebase Functions 설정

### 2.1 functions/index.js에 생체인증 함수 추가
```javascript
const { generateBiometricRegistrationOptions, completeBiometricRegistration, generateBiometricAuthenticationOptions, completeBiometricAuthentication } = require('./biometricAuth');

exports.generateBiometricRegistrationOptions = generateBiometricRegistrationOptions;
exports.completeBiometricRegistration = completeBiometricRegistration;
exports.generateBiometricAuthenticationOptions = generateBiometricAuthenticationOptions;
exports.completeBiometricAuthentication = completeBiometricAuthentication;
```

### 2.2 함수 배포
```bash
cd functions
firebase deploy --only functions
```

## 3. 환경 변수 설정

### 3.1 .env.local 파일에 추가
```env
# Biometric Authentication
NEXT_PUBLIC_RP_ID=your_project.firebaseapp.com
NEXT_PUBLIC_RP_NAME=커튼 설치 매칭
NEXT_PUBLIC_RP_ORIGIN=https://your_project.firebaseapp.com
```

### 3.2 프로덕션 환경
```env
NEXT_PUBLIC_RP_ID=your_project.firebaseapp.com
NEXT_PUBLIC_RP_NAME=커튼 설치 매칭
NEXT_PUBLIC_RP_ORIGIN=https://your_project.firebaseapp.com
```

## 4. 사용자 경험 개선

### 4.1 생체인증 지원 확인
```javascript
// 브라우저 지원 확인
if (!window.PublicKeyCredential) {
  console.log('이 브라우저는 생체인증을 지원하지 않습니다.');
}

// 하드웨어 지원 확인
const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
if (available) {
  console.log('생체인증이 사용 가능합니다.');
} else {
  console.log('생체인증을 사용할 수 없습니다.');
}
```

### 4.2 사용자 안내 메시지
- 생체인증 미지원: "이 브라우저는 생체인증을 지원하지 않습니다."
- 하드웨어 미지원: "지문 또는 얼굴인식을 설정해주세요."
- 등록 필요: "생체인증을 등록해주세요."

## 5. 보안 고려사항

### 5.1 HTTPS 필수
- 생체인증은 HTTPS 환경에서만 작동
- 개발 환경에서는 localhost 허용
- 프로덕션에서는 반드시 SSL 인증서 필요

### 5.2 도메인 설정
- RP ID(Relying Party ID)는 정확한 도메인으로 설정
- 서브도메인은 별도 설정 필요

### 5.3 챌린지 관리
- 랜덤 챌린지 생성 및 저장
- 세션 기반 챌린지 관리
- 챌린지 만료 시간 설정

## 6. 데이터베이스 스키마

### 6.1 Firestore 컬렉션 구조
```javascript
// biometricCredentials 컬렉션
{
  id: "credential_id",
  type: "public-key",
  rawId: [1, 2, 3, ...], // Uint8Array
  response: {
    attestationObject: [1, 2, 3, ...],
    clientDataJSON: [1, 2, 3, ...]
  },
  userId: "user_id",
  createdAt: Timestamp
}

// sessions 컬렉션
{
  challenge: [1, 2, 3, ...],
  userId: "user_id",
  createdAt: Timestamp
}

// users 컬렉션 (기존에 추가)
{
  biometricEnabled: true,
  biometricRegisteredAt: Timestamp,
  lastBiometricLogin: Timestamp
}
```

## 7. 테스트 방법

### 7.1 개발 환경 테스트
1. Chrome DevTools → Application → Credentials
2. 생체인증 등록 테스트
3. 생체인증 로그인 테스트

### 7.2 실제 디바이스 테스트
1. 모바일 브라우저에서 테스트
2. 지문/얼굴인식 실제 동작 확인
3. 다양한 브라우저에서 호환성 확인

## 8. 문제 해결

### 8.1 일반적인 오류
- **NotAllowedError**: 사용자가 생체인증 거부
- **SecurityError**: HTTPS가 아닌 환경
- **InvalidStateError**: 이미 등록된 자격증명
- **NotSupportedError**: 브라우저 미지원

### 8.2 디버깅 방법
```javascript
// 브라우저 콘솔에서 확인
console.log('WebAuthn 지원:', !!window.PublicKeyCredential);
console.log('생체인증 가능:', await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());

// 네트워크 탭에서 API 호출 확인
// Application 탭에서 저장된 자격증명 확인
```

### 8.3 로그 확인
```bash
# Firebase Functions 로그
firebase functions:log --only generateBiometricRegistrationOptions
firebase functions:log --only completeBiometricRegistration
```

## 9. 성능 최적화

### 9.1 지연 시간 최소화
- 챌린지 생성 최적화
- 데이터베이스 쿼리 최적화
- 캐싱 전략 적용

### 9.2 사용자 경험 개선
- 로딩 인디케이터 표시
- 명확한 에러 메시지
- 대체 로그인 방법 제공

## 10. 프로덕션 배포

### 10.1 도메인 설정
- RP ID를 실제 도메인으로 변경
- HTTPS 인증서 확인
- CORS 설정 확인

### 10.2 보안 강화
- 챌린지 만료 시간 단축
- 세션 관리 강화
- 로그 모니터링 설정

### 10.3 모니터링
- 생체인증 성공/실패율 추적
- 사용자 피드백 수집
- 성능 메트릭 모니터링

## 11. 추가 기능

### 11.1 다중 자격증명 지원
- 여러 디바이스에서 생체인증 등록
- 디바이스별 관리 기능

### 11.2 백업 인증 방법
- PIN/패턴 인증
- 보안 질문
- 이메일 인증

### 11.3 관리자 기능
- 생체인증 통계
- 사용자별 생체인증 상태
- 강제 해제 기능 