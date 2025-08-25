# 실제 결제 서비스 연동 설정 가이드

## 개요

이 문서는 포인트 충전 시 실제 결제 서비스(카카오페이, 토스페이먼츠)를 연동하기 위한 상세한 설정 방법을 설명합니다.

## 1. 카카오페이 연동 설정

### 1.1 카카오페이 비즈니스 계정 설정

1. **카카오페이 비즈니스 가입**
   - [카카오페이 비즈니스](https://business.kakao.com/pay/) 접속
   - "가맹점 등록" 클릭
   - 사업자 정보 입력 및 서류 제출
   - 승인 대기 (1-3일 소요)

2. **API 키 발급**
   - 가맹점 승인 후 "개발자 센터" 접속
   - "API 키 관리" → "Admin Key" 발급
   - 발급받은 Admin Key 복사

### 1.2 환경변수 설정

`.env` 파일에 다음 내용 추가:

```env
# KakaoPay Configuration
REACT_APP_KAKAO_PAY_ADMIN_KEY=your_actual_kakao_pay_admin_key_here
REACT_APP_KAKAO_PAY_REDIRECT_URL=https://yourdomain.com/seller/kakao-pay-complete
REACT_APP_KAKAO_PAY_CANCEL_URL=https://yourdomain.com/seller/payment-fail
```

### 1.3 카카오페이 결제 플로우

```
1. 사용자 → 포인트 충전 요청
2. 시스템 → 카카오페이 결제 준비 API 호출
3. 카카오페이 → 결제 페이지 URL 반환
4. 사용자 → 카카오페이 결제 페이지로 리다이렉트
5. 사용자 → 결제 완료
6. 카카오페이 → 승인 URL로 리다이렉트 (pg_token 포함)
7. 시스템 → 카카오페이 결제 승인 API 호출
8. 시스템 → 포인트 충전 처리
```

## 2. 토스페이먼츠 연동 설정

### 2.1 토스페이먼츠 가맹점 설정

1. **토스페이먼츠 가맹점 가입**
   - [토스페이먼츠](https://pay.toss.im/) 접속
   - "가맹점 등록" 클릭
   - 사업자 정보 입력 및 서류 제출
   - 승인 대기 (1-2일 소요)

2. **API 키 발급**
   - 가맹점 승인 후 "개발자 센터" 접속
   - "API 키 관리" → Secret Key, Client Key 발급
   - 발급받은 키들 복사

### 2.2 환경변수 설정

`.env` 파일에 다음 내용 추가:

```env
# Toss Payments Configuration
REACT_APP_TOSS_SECRET_KEY=your_actual_toss_secret_key_here
REACT_APP_TOSS_CLIENT_KEY=your_actual_toss_client_key_here
REACT_APP_TOSS_SUCCESS_URL=https://yourdomain.com/seller/payment-complete
REACT_APP_TOSS_FAIL_URL=https://yourdomain.com/seller/payment-fail
```

### 2.3 토스페이먼츠 결제 플로우

```
1. 사용자 → 포인트 충전 요청
2. 시스템 → 토스페이먼츠 결제 API 호출
3. 토스페이먼츠 → 결제 페이지 URL 반환
4. 사용자 → 토스페이먼츠 결제 페이지로 리다이렉트
5. 사용자 → 결제 완료
6. 토스페이먼츠 → 성공/실패 URL로 리다이렉트
7. 시스템 → 토스페이먼츠 결제 승인 API 호출
8. 시스템 → 포인트 충전 처리
```

## 3. 프로덕션 환경 설정

### 3.1 도메인 설정

실제 서비스에서는 다음 URL들을 실제 도메인으로 변경해야 합니다:

```env
# 프로덕션 환경 예시
REACT_APP_KAKAO_PAY_REDIRECT_URL=https://yourdomain.com/seller/kakao-pay-complete
REACT_APP_KAKAO_PAY_CANCEL_URL=https://yourdomain.com/seller/payment-fail
REACT_APP_TOSS_SUCCESS_URL=https://yourdomain.com/seller/payment-complete
REACT_APP_TOSS_FAIL_URL=https://yourdomain.com/seller/payment-fail
```

### 3.2 HTTPS 필수

결제 서비스는 보안상 HTTPS가 필수입니다:
- SSL 인증서 설치
- 모든 결제 관련 URL이 HTTPS로 시작하는지 확인

### 3.3 CORS 설정

결제 서비스에서 허용하는 도메인에 실제 도메인을 등록해야 합니다:

1. **카카오페이**: 개발자 센터에서 허용 도메인 등록
2. **토스페이먼츠**: 개발자 센터에서 허용 도메인 등록

## 4. 테스트 모드

### 4.1 카카오페이 테스트

```env
# 테스트용 가맹점 코드 사용
cid=TC0ONETIME  # 테스트용
```

테스트용 결제 정보:
- 카드번호: 1234-1234-1234-1234
- 유효기간: 12/25
- CVC: 123

### 4.2 토스페이먼츠 테스트

토스페이먼츠 개발자 센터에서 테스트 모드 활성화 후 테스트용 결제 정보 사용.

## 5. 보안 고려사항

### 5.1 API 키 보안

- API 키는 절대 클라이언트 코드에 하드코딩하지 마세요
- 환경변수를 통해 안전하게 관리하세요
- 프로덕션 환경에서는 API 키를 정기적으로 갱신하세요

### 5.2 결제 검증

- 서버 사이드에서 결제 금액 검증
- 중복 결제 방지 로직 구현
- 결제 상태 추적 및 관리

### 5.3 오류 처리

- 네트워크 오류 처리
- 결제 실패 시 롤백 처리
- 사용자 친화적인 오류 메시지

## 6. 문제 해결

### 6.1 일반적인 오류

**API 키 오류**
```
Error: 카카오페이 Admin Key가 설정되지 않았습니다.
Error: 토스페이먼츠 API 키가 설정되지 않았습니다.
```
→ 환경변수 설정 확인

**CORS 오류**
```
Access to fetch at 'https://kapi.kakao.com/v1/payment/ready' from origin 'http://localhost:3000' has been blocked by CORS policy
```
→ 도메인 설정 확인

**결제 실패**
```
결제 요청에 실패했습니다.
```
→ 로그 확인 및 오류 메시지 분석

### 6.2 디버깅

1. **브라우저 개발자 도구**
   - Network 탭에서 API 요청/응답 확인
   - Console 탭에서 오류 메시지 확인

2. **Firebase 콘솔**
   - Firestore에서 결제 데이터 확인
   - Functions 로그 확인

3. **결제 서비스 대시보드**
   - 카카오페이/토스페이먼츠 대시보드에서 결제 내역 확인

## 7. 추가 리소스

- [카카오페이 개발자 문서](https://developers.kakao.com/docs/latest/ko/kakaopay/common)
- [토스페이먼츠 개발자 문서](https://docs.tosspayments.com/)
- [Firebase 문서](https://firebase.google.com/docs)

## 8. 지원하는 결제 수단

### 8.1 카카오페이
- 카카오페이 잔액
- 카드 결제
- 계좌이체

### 8.2 토스페이먼츠
- 신용카드
- 계좌이체
- 가상계좌
- 휴대폰 결제
- 상품권
- 문화상품권

## 9. 결제 수수료

각 결제 서비스의 수수료는 다음과 같습니다:

- **카카오페이**: 2.5% ~ 3.5%
- **토스페이먼츠**: 2.5% ~ 3.5%

실제 수수료는 가맹점 등급과 거래량에 따라 달라질 수 있습니다.

## 10. 법적 고려사항

1. **전자상거래법 준수**
   - 결제 정보 보호
   - 환불 정책 명시
   - 개인정보 처리방침

2. **세무 신고**
   - 결제 수익에 대한 세무 신고
   - 부가가치세 처리

3. **고객 지원**
   - 결제 관련 문의 처리
   - 환불 처리 절차
