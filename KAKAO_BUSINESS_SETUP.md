# 카카오톡 비즈니스 채널 설정 가이드

## 🚀 카카오톡 비즈니스 채널 설정

### 1. 카카오 비즈니스 계정 생성

1. **카카오 비즈니스 홈페이지 접속**
   - https://business.kakao.com 접속
   - "비즈니스 시작하기" 클릭

2. **계정 생성**
   - 카카오 계정으로 로그인
   - 비즈니스 정보 입력 (회사명, 사업자등록번호 등)
   - 인증 완료

### 2. 채널 생성 및 설정

1. **채널 생성**
   - 대시보드에서 "채널 만들기" 클릭
   - 채널명: "전문가의 손길" (또는 원하는 이름)
   - 채널 설명 입력

2. **채널 인증**
   - 사업자등록증 업로드
   - 인증 심사 대기 (1-3일 소요)

### 3. 카카오톡 비즈니스 API 설정

1. **API 키 발급**
   - 채널 관리 → API 설정
   - "API 키 발급" 클릭
   - Access Token 복사

2. **템플릿 설정**
   - 메시지 템플릿 → 새 템플릿 생성
   - 템플릿명: "시공 완료 만족도 평가"
   - 메시지 내용 설정

### 4. 애플리케이션 연동

#### 환경 변수 설정

`.env` 파일에 다음 정보 추가:

```env
# 카카오톡 비즈니스 설정
REACT_APP_KAKAO_BUSINESS_ACCESS_TOKEN=your_access_token_here
REACT_APP_KAKAO_BUSINESS_CHANNEL_ID=your_channel_id_here
REACT_APP_KAKAO_BUSINESS_TEMPLATE_ID=your_template_id_here
```

#### 초기화 코드

`src/App.tsx`에서 카카오톡 비즈니스 서비스 초기화:

```typescript
import { KakaoBusinessService } from './shared/services/kakaoBusinessService';

// 앱 시작 시 초기화
useEffect(() => {
  KakaoBusinessService.initialize({
    accessToken: process.env.REACT_APP_KAKAO_BUSINESS_ACCESS_TOKEN!,
    channelId: process.env.REACT_APP_KAKAO_BUSINESS_CHANNEL_ID!,
    templateId: process.env.REACT_APP_KAKAO_BUSINESS_TEMPLATE_ID!
  });
}, []);
```

### 5. 메시지 템플릿 예시

#### 기본 템플릿
```
🏠 [전문가의 손길] 시공 완료 안내

안녕하세요! 
[작업명] 시공이 완료되었습니다.

시공 품질에 대한 만족도를 평가해 주시면
더 나은 서비스를 제공하는데 도움이 됩니다.

[만족도 평가하기] 버튼 클릭
```

#### 버튼 설정
- **버튼명**: "만족도 평가하기"
- **링크**: `https://your-domain.com/satisfaction-survey/{jobId}`
- **모바일 링크**: `https://your-domain.com/satisfaction-survey/{jobId}`

### 6. 테스트 방법

#### 개발 환경에서 테스트

```typescript
// 브라우저 콘솔에서 실행
import { KakaoBusinessService } from './shared/services/kakaoBusinessService';

// 테스트 메시지 전송
KakaoBusinessService.sendTestMessage();
```

#### 실제 시공 완료 시 테스트

1. 시공자로 로그인
2. 작업 상태를 "완료"로 변경
3. 자동으로 만족도 평가 링크 전송 확인

### 7. 비용 정보

| 항목 | 비용 |
|------|------|
| 월 구독료 | 5-10만원 |
| 메시지당 비용 | 10-15원 |
| 초기 설정비 | 무료 |

### 8. 주의사항

1. **채널 인증 필수**: 인증되지 않은 채널은 메시지 전송 불가
2. **API 키 보안**: Access Token을 안전하게 보관
3. **메시지 제한**: 하루 최대 전송 가능 메시지 수 확인
4. **링크 도메인**: 만족도 평가 링크 도메인을 카카오톡에 등록

### 9. 문제 해결

#### 자주 발생하는 오류

1. **"채널 인증이 필요합니다"**
   - 채널 인증 상태 확인
   - 인증 심사 완료 대기

2. **"API 키가 유효하지 않습니다"**
   - Access Token 재발급
   - 환경 변수 확인

3. **"메시지 전송 실패"**
   - 템플릿 승인 상태 확인
   - 링크 도메인 등록 확인

### 10. 고객 지원

- 카카오 비즈니스 고객센터: 1544-9851
- 기술 문서: https://developers.kakao.com/docs/latest/ko/business-message/rest-api

---

## 🎯 다음 단계

1. 카카오 비즈니스 계정 생성
2. 채널 인증 완료
3. API 키 발급
4. 환경 변수 설정
5. 테스트 메시지 전송
6. 실제 시공 완료 시 자동 전송 확인

모든 설정이 완료되면 시공 완료 시 자동으로 고객에게 만족도 평가 링크가 카카오톡으로 전송됩니다! 🚀
