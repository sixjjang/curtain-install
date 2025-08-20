# 구글 캘린더 연동 가이드

## 개요
시공 관리 플랫폼에서 구글 캘린더와 연동하여 시공 작업 일정을 자동으로 동기화할 수 있습니다.

## 기능
- **시공자**: 배정받은 시공 작업을 구글 캘린더에 동기화
- **판매자**: 의뢰한 시공 작업을 구글 캘린더에 동기화
- **실시간 동기화**: 작업 상태 변경 시 자동으로 캘린더 업데이트
- **양방향 연동**: 구글 캘린더에서도 작업 일정 확인 가능

## 설정 방법

### 1. Google Cloud Console 설정

#### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 이름: `construction-management-calendar`

#### 1.2 Google Calendar API 활성화
1. 왼쪽 메뉴에서 "API 및 서비스" > "라이브러리" 선택
2. "Google Calendar API" 검색 후 선택
3. "사용" 버튼 클릭하여 API 활성화

#### 1.3 OAuth 2.0 클라이언트 ID 생성
1. "API 및 서비스" > "사용자 인증 정보" 선택
2. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
3. 애플리케이션 유형: "웹 애플리케이션" 선택
4. 이름: `Construction Management Calendar`
5. 승인된 리디렉션 URI 추가:
   - `http://localhost:3000/google-callback` (개발용)
   - `https://your-domain.com/google-callback` (배포용)
6. "만들기" 클릭

#### 1.4 클라이언트 ID 및 시크릿 저장
생성된 클라이언트 ID와 시크릿을 안전한 곳에 저장

### 2. 환경 변수 설정

#### 2.1 .env 파일 생성
프로젝트 루트에 `.env` 파일 생성:

```env
# Google Calendar API 설정
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/google-callback
```

#### 2.2 환경 변수 적용
개발 서버 재시작:
```bash
npm start
```

### 3. 애플리케이션에서 연동

#### 3.1 시공자 연동
1. 시공자로 로그인
2. "캘린더 뷰" 메뉴 선택
3. "구글 캘린더 연동" 버튼 클릭
4. 구글 계정으로 로그인 및 권한 승인
5. 연동 완료 후 "구글 캘린더 동기화" 버튼으로 작업 동기화

#### 3.2 판매자 연동
1. 판매자로 로그인
2. "캘린더" 메뉴 선택
3. "구글 캘린더 연동" 버튼 클릭
4. 구글 계정으로 로그인 및 권한 승인
5. 연동 완료 후 "구글 캘린더 동기화" 버튼으로 작업 동기화

## 사용 방법

### 캘린더 뷰 기능
- **작업 목록**: 현재 사용자의 시공 작업 목록 표시
- **구글 이벤트**: 연동된 구글 캘린더의 이벤트 목록 표시
- **동기화**: 시공 작업을 구글 캘린더에 일괄 동기화
- **연동 해제**: 구글 캘린더 연동 해제

### 동기화되는 정보
- **작업 제목**: 시공 작업명
- **작업 설명**: 시공 내용 및 요구사항
- **예정일**: 시공 예정 날짜 및 시간
- **주소**: 시공 장소
- **상태**: 작업 진행 상태

## 보안 고려사항

### OAuth 2.0 보안
- 클라이언트 ID는 공개되어도 안전
- 클라이언트 시크릿은 절대 공개하지 않음
- 리디렉션 URI는 정확히 설정

### 데이터 보호
- 사용자별로 개별 캘린더 연동
- 필요한 최소 권한만 요청
- 연동 해제 시 모든 데이터 삭제

## 문제 해결

### 일반적인 문제

#### 1. "redirect_uri_mismatch" 오류
- Google Cloud Console의 리디렉션 URI와 환경 변수가 일치하는지 확인
- 개발/배포 환경에 맞는 URI 설정

#### 2. "access_denied" 오류
- 사용자가 권한 승인을 취소한 경우
- 다시 연동 시도

#### 3. 동기화 실패
- 네트워크 연결 확인
- 구글 캘린더 API 할당량 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 디버깅 방법

#### 1. 브라우저 개발자 도구
```javascript
// 콘솔에서 연동 상태 확인
console.log('Google Calendar 연동 상태:', await GoogleCalendarService.getConnection(userId));
```

#### 2. 네트워크 탭
- OAuth 요청/응답 확인
- API 호출 상태 확인

#### 3. 로그 확인
- 애플리케이션 로그에서 오류 메시지 확인
- 구글 클라우드 콘솔에서 API 사용량 확인

## API 할당량 및 제한

### Google Calendar API 제한
- **일일 요청 수**: 1,000,000,000 (기본)
- **초당 요청 수**: 1,000 (기본)
- **이벤트 생성**: 초당 10개
- **이벤트 조회**: 초당 100개

### 모니터링
- Google Cloud Console에서 API 사용량 모니터링
- 할당량 초과 시 알림 설정

## 고급 설정

### 커스텀 캘린더 사용
```typescript
// 특정 캘린더 ID 사용
const customCalendarId = 'custom_calendar_id@group.calendar.google.com';
await GoogleCalendarService.createEvent(userId, event, customCalendarId);
```

### 알림 설정
```typescript
// 이벤트에 알림 추가
const eventWithReminder = {
  ...event,
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 24 * 60 }, // 1일 전
      { method: 'popup', minutes: 60 } // 1시간 전
    ]
  }
};
```

## 지원 및 문의

### 기술 지원
- 이슈 발생 시 브라우저 콘솔 로그 첨부
- 네트워크 탭 스크린샷 제공
- 구글 클라우드 콘솔 오류 메시지 확인

### 추가 기능 요청
- 새로운 캘린더 기능 요청
- 기존 기능 개선 제안
- 버그 리포트

---

**참고**: 이 가이드는 Google Calendar API v3를 기준으로 작성되었습니다. API 버전이 변경될 경우 일부 설정이 달라질 수 있습니다.
