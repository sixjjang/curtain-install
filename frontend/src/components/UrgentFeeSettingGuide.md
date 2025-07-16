# 긴급 시공 수수료 설정 시스템 가이드

## 개요

긴급 시공 수수료 설정 시스템은 작업의 긴급도를 반영하여 수수료를 설정하고, 자동 증가 규칙을 관리할 수 있는 종합적인 설정 도구입니다. 시공기사들의 참여를 유도하고 긴급 작업의 우선순위를 높이기 위한 핵심 기능입니다.

## 주요 기능

### 1. 기본 수수료 설정
- **수수료 비율 설정**: 15-50% 범위에서 긴급 수수료 설정
- **실시간 미리보기**: 설정한 수수료의 실제 금액 미리보기
- **수준별 표시**: 수수료 수준을 색상으로 구분 (낮음/보통/높음/매우 높음)
- **범위 검증**: 설정 가능한 범위 내에서만 입력 허용

### 2. 고급 설정 기능
- **자동 증가 활성화**: 시간에 따른 자동 수수료 증가
- **증가 단계 설정**: 1-20% 사이에서 증가 단계 설정
- **증가 간격 설정**: 1-168시간(7일) 사이에서 증가 간격 설정
- **알림 설정**: 수수료 증가 시 알림 발송 여부 설정

### 3. 실시간 미리보기
- **현재 수수료**: 설정한 수수료의 실제 금액 표시
- **최대 수수료**: 최대 설정 가능한 수수료 금액 표시
- **다음 증가 시**: 다음 증가 시 예상 수수료 표시
- **증가 단계**: 남은 증가 단계 수 표시

### 4. 작업 정보 표시
- **작업 상태**: 현재 작업의 상태 정보
- **작업 제목**: 작업의 제목 표시
- **마지막 업데이트**: 수수료 설정의 마지막 업데이트 시간
- **증가 횟수**: 현재까지의 수수료 증가 횟수

### 5. 설정 이력 관리
- **변경 이력**: 모든 수수료 설정 변경 이력 추적
- **고급 설정 이력**: 자동 증가 규칙 변경 이력
- **타임스탬프**: 각 설정 변경의 정확한 시간 기록
- **설정 상세**: 변경된 설정의 상세 정보 저장

## 컴포넌트 사용법

### 기본 사용법

```jsx
import UrgentFeeSetting from './UrgentFeeSetting';

function App() {
  const handleFeeUpdated = (updateInfo) => {
    console.log('수수료 업데이트됨:', updateInfo);
    // 추가 처리 로직
  };

  return (
    <UrgentFeeSetting
      jobId="job123"
      basePercent={15}
      maxPercent={50}
      onFeeUpdated={handleFeeUpdated}
    />
  );
}
```

### 고급 사용법

```jsx
<UrgentFeeSetting
  jobId="job123"
  basePercent={15}
  maxPercent={50}
  onFeeUpdated={handleFeeUpdated}
  showPreview={true}
  enableAdvanced={true}
/>
```

## Props 설명

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `jobId` | string | ✅ | - | 작업 ID |
| `basePercent` | number | ❌ | 15 | 기본 수수료 비율 (%) |
| `maxPercent` | number | ❌ | 50 | 최대 수수료 비율 (%) |
| `onFeeUpdated` | function | ❌ | - | 수수료 업데이트 시 호출되는 콜백 |
| `showPreview` | boolean | ❌ | true | 수수료 미리보기 표시 여부 |
| `enableAdvanced` | boolean | ❌ | true | 고급 설정 기능 활성화 여부 |

## 데이터 구조

### 작업 데이터 (jobs collection)
```javascript
{
  id: "job123",
  title: "커튼 설치 작업",
  status: "open",
  urgentFeePercent: 20,                    // 긴급 수수료 비율
  currentUrgentFeePercent: 20,             // 현재 긴급 수수료
  urgentFeeMaxPercent: 50,                 // 최대 긴급 수수료
  urgentFeeLastUpdated: Timestamp,         // 마지막 업데이트 시간
  urgentFeeIncreaseCount: 0,               // 증가 횟수
  urgentFeeMaxReachedAt: null,             // 최대값 도달 시간
  urgentFeeIncreaseStep: 5,                // 증가 단계
  urgentFeeAutoIncrease: false,            // 자동 증가 활성화
  urgentFeeIncreaseInterval: 24,           // 증가 간격 (시간)
  urgentFeeNotificationEnabled: true       // 알림 활성화
}
```

### 설정 이력 데이터
```javascript
{
  jobId: "job123",
  urgentPercent: 20,
  maxPercent: 50,
  advancedSettings: {
    increaseStep: 5,
    autoIncrease: false,
    increaseInterval: 24,
    notificationEnabled: true
  },
  timestamp: "2024-01-15 14:30:00"
}
```

## 수수료 수준 시스템

### 수준별 구분
- **낮음 (15-20%)**: 일반적인 긴급 상황
  - 색상: 녹색 (text-green-600)
  - 설명: 기본적인 긴급 시공 요청

- **보통 (21-35%)**: 중간 정도의 긴급 상황
  - 색상: 노란색 (text-yellow-600)
  - 설명: 중간 정도의 긴급도가 필요한 상황

- **높음 (36-45%)**: 높은 긴급 상황
  - 색상: 주황색 (text-orange-600)
  - 설명: 높은 긴급도가 필요한 상황

- **매우 높음 (46-50%)**: 최고 긴급 상황
  - 색상: 빨간색 (text-red-600)
  - 설명: 최고 긴급도가 필요한 상황

### 미리보기 계산
```javascript
const calculateFeePreview = (baseAmount = 100000) => {
  const currentFee = (baseAmount * urgentPercent) / 100;
  const maxFee = (baseAmount * maxPercent) / 100;
  const increaseSteps = Math.ceil((maxPercent - urgentPercent) / increaseStep);
  
  return {
    currentFee,
    maxFee,
    increaseSteps,
    nextFee: urgentPercent + increaseStep <= maxPercent 
      ? (baseAmount * (urgentPercent + increaseStep)) / 100 
      : maxFee
  };
};
```

## 고급 설정 옵션

### 자동 증가 규칙
- **증가 단계**: 1%에서 20% 사이 설정
- **증가 간격**: 1시간에서 168시간(7일) 사이 설정
- **최대값 제한**: 설정된 최대 수수료까지만 증가
- **자동 중단**: 최대값 도달 시 자동 중단

### 알림 설정
- **수수료 증가 알림**: 수수료 증가 시 관련자에게 알림
- **FCM 푸시 알림**: 실시간 푸시 알림 발송
- **이메일 알림**: 이메일을 통한 알림 발송
- **알림 이력**: 모든 알림 발송 이력 저장

## 검증 시스템

### 입력 검증
```javascript
const validateInput = () => {
  // 수수료 범위 검증
  if (urgentPercent < basePercent || urgentPercent > maxPercent) {
    return false;
  }
  
  // 증가 단계 검증
  if (increaseStep < 1 || increaseStep > 20) {
    return false;
  }
  
  // 증가 간격 검증
  if (increaseInterval < 1 || increaseInterval > 168) {
    return false;
  }
  
  return true;
};
```

### 오류 처리
- **범위 오류**: 설정 가능한 범위를 벗어난 입력
- **네트워크 오류**: 데이터 저장 중 발생하는 오류
- **권한 오류**: 작업 수정 권한이 없는 경우
- **데이터 오류**: 잘못된 데이터 형식

## UI/UX 특징

### 반응형 디자인
- **모바일 최적화**: 모바일 기기에서도 사용하기 편한 UI
- **태블릿 지원**: 태블릿에서도 최적화된 레이아웃
- **데스크톱 최적화**: 데스크톱에서의 풀스크린 경험

### 사용자 피드백
- **로딩 상태**: 데이터 로딩 중 스피너 표시
- **저장 상태**: 저장 중 진행 상태 표시
- **성공 메시지**: 저장 완료 시 성공 메시지
- **오류 메시지**: 오류 발생 시 상세 오류 메시지

### 접근성
- **키보드 네비게이션**: 키보드만으로 모든 기능 사용 가능
- **스크린 리더 지원**: 스크린 리더 호환성
- **고대비 모드**: 고대비 모드에서도 가독성 보장
- **포커스 표시**: 포커스된 요소의 명확한 표시

## 성능 최적화

### 데이터 최적화
- **필요한 데이터만 로드**: 필요한 작업 데이터만 조회
- **캐싱 전략**: 자주 사용되는 데이터 캐싱
- **지연 로딩**: 필요할 때만 데이터 로드

### UI 최적화
- **가상 스크롤링**: 대용량 데이터 처리
- **메모이제이션**: 불필요한 리렌더링 방지
- **이미지 최적화**: 이미지 압축 및 최적화

## 보안 고려사항

### 데이터 검증
- **입력 검증**: 모든 사용자 입력 데이터 검증
- **XSS 방지**: 크로스 사이트 스크립팅 공격 방지
- **SQL 인젝션 방지**: 데이터베이스 인젝션 공격 방지

### 권한 관리
- **작업별 권한**: 작업 수정 권한 확인
- **사용자 인증**: 인증된 사용자만 접근 허용
- **세션 관리**: 안전한 세션 관리

## 확장 가능성

### 추가 기능
- **템플릿 시스템**: 미리 정의된 수수료 템플릿
- **일괄 설정**: 여러 작업 동시 설정
- **통계 대시보드**: 수수료 설정 통계
- **API 연동**: 외부 시스템과의 연동

### 통합 가능성
- **알림 시스템**: 기존 알림 시스템과 통합
- **결제 시스템**: 결제 시스템과 연동
- **리포트 시스템**: 보고서 생성 시스템과 통합
- **모니터링**: 시스템 모니터링과 통합

## 트러블슈팅

### 일반적인 문제

#### 작업 데이터가 로드되지 않는 경우
1. 작업 ID 확인
2. Firestore 권한 확인
3. 네트워크 연결 확인

#### 수수료가 저장되지 않는 경우
1. 입력값 범위 확인
2. 권한 확인
3. 네트워크 연결 확인

#### 미리보기가 표시되지 않는 경우
1. showPreview prop 확인
2. JavaScript 오류 확인
3. 계산 로직 확인

### 디버깅 팁
- 브라우저 개발자 도구 활용
- Firestore 콘솔에서 데이터 확인
- 네트워크 탭에서 요청/응답 확인

## 업데이트 로그

### v2.0.0 (현재 버전)
- 고급 설정 기능 추가
- 실시간 미리보기 추가
- 수준별 색상 구분 추가
- 설정 이력 관리 추가
- UI/UX 대폭 개선
- 검증 시스템 강화

### v1.0.0 (이전 버전)
- 기본 수수료 설정
- 단순한 저장 기능
- 기본 검증

## 라이선스

이 컴포넌트는 MIT 라이선스 하에 배포됩니다.

## 기여하기

버그 리포트, 기능 요청, 풀 리퀘스트를 환영합니다.

## 연락처

문의사항이 있으시면 개발팀에 연락해주세요. 