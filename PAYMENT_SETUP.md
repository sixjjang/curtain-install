# 결제 시스템 설정 가이드

## 개요

이 문서는 카카오페이와 토스페이먼츠 연동을 위한 설정 방법을 설명합니다.

## 1. 카카오페이 설정

### 1.1 카카오페이 가맹점 등록

1. [카카오페이 비즈니스](https://business.kakao.com/pay/)에 접속
2. 가맹점 계정 생성 및 로그인
3. "가맹점 등록" 메뉴에서 새 가맹점 등록
4. 사업자등록증, 통장사본 등 필요 서류 업로드
5. 승인 대기 (보통 1-3일 소요)

### 1.2 API 키 발급

1. 가맹점 승인 후 "개발자 센터" 메뉴 접속
2. "API 키 관리"에서 Admin Key 발급
3. 발급받은 Admin Key를 환경변수에 설정

### 1.3 환경변수 설정

`.env` 파일에 다음 내용 추가:

```env
# KakaoPay Configuration
REACT_APP_KAKAO_PAY_ADMIN_KEY=your_kakao_pay_admin_key_here
REACT_APP_KAKAO_PAY_REDIRECT_URL=http://localhost:3000/seller/payment-complete
```

### 1.4 카카오페이 결제 플로우

```
1. 결제 요청 → 카카오페이 결제 준비 API 호출
2. 사용자 → 카카오페이 결제 페이지로 리다이렉트
3. 결제 완료 → 승인 URL로 리다이렉트 (pg_token 포함)
4. 결제 승인 → 카카오페이 결제 승인 API 호출
5. 포인트 충전 → Firebase에 포인트 추가
```

## 2. 토스페이먼츠 설정

### 2.1 토스페이먼츠 가맹점 등록

1. [토스페이먼츠](https://pay.toss.im/)에 접속
2. 가맹점 계정 생성 및 로그인
3. 사업자 정보 등록 및 서류 제출
4. 승인 대기 (보통 1-2일 소요)

### 2.2 API 키 발급

1. 가맹점 승인 후 "개발자 센터" 메뉴 접속
2. "API 키 관리"에서 Secret Key와 Client Key 발급
3. 발급받은 키들을 환경변수에 설정

### 2.3 환경변수 설정

`.env` 파일에 다음 내용 추가:

```env
# Toss Payments Configuration
REACT_APP_TOSS_SECRET_KEY=your_toss_secret_key_here
REACT_APP_TOSS_CLIENT_KEY=your_toss_client_key_here
REACT_APP_TOSS_SUCCESS_URL=http://localhost:3000/seller/payment-complete
REACT_APP_TOSS_FAIL_URL=http://localhost:3000/seller/payment-fail
```

### 2.4 토스페이먼츠 결제 플로우

```
1. 결제 요청 → 토스페이먼츠 결제 API 호출
2. 사용자 → 토스페이먼츠 결제 페이지로 리다이렉트
3. 결제 완료 → 성공/실패 URL로 리다이렉트
4. 결제 승인 → 토스페이먼츠 결제 승인 API 호출
5. 포인트 충전 → Firebase에 포인트 추가
```

## 3. 지원하는 결제 수단

### 3.1 카카오페이
- 카카오페이 잔액
- 카드 결제
- 계좌이체

### 3.2 토스페이먼츠
- 신용카드
- 계좌이체
- 가상계좌
- 휴대폰 결제
- 상품권
- 문화상품권

## 4. 테스트 모드

### 4.1 카카오페이 테스트
- 카카오페이 개발자 센터에서 테스트 모드 활성화
- 테스트용 카드 정보 사용
- 실제 결제가 발생하지 않음

### 4.2 토스페이먼츠 테스트
- 토스페이먼츠 개발자 센터에서 테스트 모드 활성화
- 테스트용 결제 정보 사용
- 실제 결제가 발생하지 않음

## 5. 보안 고려사항

### 5.1 API 키 보안
- API 키는 절대 클라이언트 코드에 하드코딩하지 마세요
- 환경변수를 통해 안전하게 관리하세요
- 프로덕션 환경에서는 HTTPS 필수

### 5.2 결제 검증
- 서버 사이드에서 결제 금액 검증
- 중복 결제 방지 로직 구현
- 결제 상태 추적 및 관리

### 5.3 오류 처리
- 네트워크 오류 처리
- 결제 실패 시 롤백 처리
- 사용자 친화적인 오류 메시지

## 6. 배포 시 주의사항

### 6.1 도메인 설정
- 실제 도메인으로 리다이렉트 URL 변경
- HTTPS 프로토콜 사용 필수
- CORS 설정 확인

### 6.2 환경변수 관리
- 프로덕션 환경의 환경변수 설정
- 민감한 정보는 안전하게 관리
- 환경별 설정 분리

## 7. 문제 해결

### 7.1 일반적인 오류
- API 키 오류: 키가 올바르게 설정되었는지 확인
- CORS 오류: 도메인 설정 확인
- 결제 실패: 로그 확인 및 오류 메시지 분석

### 7.2 디버깅
- 브라우저 개발자 도구에서 네트워크 요청 확인
- Firebase 콘솔에서 로그 확인
- 결제 서비스 대시보드에서 결제 내역 확인

## 8. 추가 리소스

- [카카오페이 개발자 문서](https://developers.kakao.com/docs/latest/ko/kakaopay/common)
- [토스페이먼츠 개발자 문서](https://docs.tosspayments.com/)
- [Firebase 문서](https://firebase.google.com/docs)
