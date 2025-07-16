# 사진 품질 검수 시스템 가이드

## 개요

사진 품질 검수 시스템은 업로드된 사진들의 품질을 체계적으로 평가하고, 문제가 있는 사진에 대해 이의신청을 제출할 수 있는 종합적인 도구입니다.

## 주요 기능

### 1. 품질 점수 평가 시스템
- **1-10점 품질 점수**: 각 사진에 대해 객관적인 품질 점수 부여
- **실시간 저장**: 점수 변경 시 즉시 Firestore에 저장
- **시각적 피드백**: 점수에 따른 색상 코딩 (녹색: 우수, 노란색: 양호, 주황색: 보통, 빨간색: 낮음)

### 2. 문제 유형 분류
9가지 체계적인 문제 유형으로 분류:
- **흐림/초점 문제**: 초점이 맞지 않거나 흐린 사진
- **노출/밝기 문제**: 과다 노출, 부족한 노출
- **구도/각도 문제**: 부적절한 구도나 촬영 각도
- **조명 문제**: 조명 부족, 반사, 그림자 문제
- **해상도 문제**: 낮은 해상도, 압축 문제
- **색상/화질 문제**: 색상 왜곡, 화질 저하
- **내용/구성 문제**: 요청된 내용과 다른 사진
- **기술적 문제**: 파일 손상, 메타데이터 문제
- **기타**: 기타 모든 문제

### 3. 심각도 평가
4단계 심각도 시스템:
- **낮음 (Low)**: 미미한 문제, 수용 가능
- **보통 (Medium)**: 개선이 필요한 문제
- **높음 (High)**: 중요한 문제, 수정 필요
- **심각 (Critical)**: 심각한 문제, 재촬영 필수

### 4. 사진 관리 기능
- **그리드 뷰**: 사진들을 깔끔한 그리드로 표시
- **확대 보기**: 모달을 통한 고해상도 사진 상세 검토
- **사진 정보**: 파일명, 크기, 업로드 시간 표시
- **선택 상태**: 선택된 사진 시각적 구분

### 5. 이의신청 시스템
- **상세 문제 내용**: 구체적인 문제 설명 (최소 10자)
- **제안 사항**: 개선 방안이나 재촬영 요청사항
- **자동 이력 관리**: 모든 이의신청 자동 기록
- **사진 상태 업데이트**: 이의신청 시 사진 상태 변경

## 컴포넌트 사용법

### 기본 사용법

```jsx
import QualityReview from './QualityReview';

function App() {
  const handleIssueSubmitted = (issueInfo) => {
    console.log('이의신청 제출됨:', issueInfo);
    // 추가 처리 로직
  };

  return (
    <QualityReview
      requestId="request123"
      reviewerId="reviewer456"
      onIssueSubmitted={handleIssueSubmitted}
    />
  );
}
```

### 고급 사용법

```jsx
<QualityReview
  requestId="request123"
  reviewerId="reviewer456"
  onIssueSubmitted={handleIssueSubmitted}
  showBeforeAfter={true}
  enableComparison={true}
/>
```

## Props 설명

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `requestId` | string | ✅ | - | 검수할 촬영 요청 ID |
| `reviewerId` | string | ✅ | - | 검수자 ID |
| `onIssueSubmitted` | function | ❌ | - | 이의신청 제출 시 호출되는 콜백 |
| `showBeforeAfter` | boolean | ❌ | true | Before/After 비교 기능 표시 여부 |
| `enableComparison` | boolean | ❌ | true | 사진 비교 기능 활성화 여부 |

## 데이터 구조

### 사진 데이터 (photos collection)
```javascript
{
  id: "photo123",
  requestId: "request456",
  url: "https://storage.googleapis.com/...",
  originalName: "IMG_001.jpg",
  fileSize: 2048576, // bytes
  uploadedAt: Timestamp,
  status: "uploaded",
  qualityScore: 8,
  hasQualityIssue: false,
  issueCount: 0,
  lastReviewedAt: Timestamp
}
```

### 이의신청 데이터 (qualityIssues collection)
```javascript
{
  id: "issue789",
  requestId: "request456",
  photoId: "photo123",
  reviewerId: "reviewer101",
  category: "blur",
  severity: "medium",
  comment: "사진이 흐려서 세부사항을 확인하기 어렵습니다.",
  suggestedAction: "더 선명한 사진으로 재촬영해주세요.",
  status: "pending",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  reviewedAt: Timestamp
}
```

## 품질 점수 기준

### 점수별 평가 기준
- **8-10점**: 우수한 품질, 문제 없음
- **6-7점**: 양호한 품질, 소소한 개선점
- **4-5점**: 보통 품질, 개선 필요
- **1-3점**: 낮은 품질, 재촬영 권장

### 점수별 색상
- **8-10점**: 녹색 (text-green-600)
- **6-7점**: 노란색 (text-yellow-600)
- **4-5점**: 주황색 (text-orange-600)
- **1-3점**: 빨간색 (text-red-600)

## 심각도별 색상

- **낮음**: 파란색 (bg-blue-100 text-blue-800)
- **보통**: 노란색 (bg-yellow-100 text-yellow-800)
- **높음**: 주황색 (bg-orange-100 text-orange-800)
- **심각**: 빨간색 (bg-red-100 text-red-800)

## 검수 프로세스

### 1. 촬영 요청 선택
- 검수할 촬영 요청을 선택합니다
- 요청별 사진 목록을 확인합니다

### 2. 사진 검토
- 업로드된 사진들을 미리보기로 확인
- 각 사진의 기본 정보 확인 (파일명, 크기, 업로드 시간)

### 3. 품질 점수 부여
- 각 사진에 대해 1-10점 품질 점수 부여
- 점수는 실시간으로 Firestore에 저장

### 4. 상세 검토
- 문제가 의심되는 사진은 확대 보기로 상세 검토
- 고해상도로 세부사항 확인

### 5. 이의신청 작성
- 문제가 있는 사진 선택
- 문제 유형, 심각도, 상세 내용 입력
- 개선 제안 사항 작성 (선택사항)

### 6. 제출
- 모든 필수 항목 입력 확인
- 이의신청 제출
- 자동으로 사진 상태 업데이트

## 에러 처리

### 검증 오류
- 사진 미선택
- 문제 유형 미선택
- 문제 내용 10자 미만

### 네트워크 오류
- 사진 로드 실패
- 이의신청 제출 실패
- 품질 점수 저장 실패

### 사용자 피드백
- 에러 메시지 표시
- 로딩 상태 표시
- 성공 메시지 표시

## 성능 최적화

### 이미지 최적화
- 썸네일 사용으로 로딩 속도 향상
- 지연 로딩 (Lazy Loading) 적용
- 이미지 압축 및 최적화

### 데이터 최적화
- 필요한 데이터만 로드
- 페이지네이션 적용
- 캐싱 전략 사용

## 보안 고려사항

### 데이터 접근 제어
- 검수자 권한 확인
- 요청별 접근 권한 검증
- 민감한 정보 보호

### 입력 검증
- 사용자 입력 데이터 검증
- XSS 공격 방지
- SQL 인젝션 방지

## 확장 가능성

### 추가 기능
- 사진 비교 도구
- Before/After 슬라이더
- 주석 도구
- 팀 협업 기능

### 통합 가능성
- 알림 시스템 연동
- 보고서 생성
- 통계 대시보드
- API 연동

## 트러블슈팅

### 일반적인 문제

#### 사진이 로드되지 않는 경우
1. 네트워크 연결 확인
2. Firebase Storage 권한 확인
3. 이미지 URL 유효성 확인

#### 이의신청 제출이 실패하는 경우
1. 필수 항목 입력 확인
2. 네트워크 연결 확인
3. Firebase 권한 확인

#### 품질 점수가 저장되지 않는 경우
1. Firebase 연결 확인
2. 권한 설정 확인
3. 콘솔 에러 확인

### 디버깅 팁
- 브라우저 개발자 도구 활용
- Firebase 콘솔 로그 확인
- 네트워크 탭에서 요청/응답 확인

## 업데이트 로그

### v2.0.0 (현재 버전)
- 품질 점수 시스템 추가
- 문제 유형 분류 개선
- 심각도 평가 시스템 추가
- UI/UX 대폭 개선
- 확대 보기 기능 추가
- 실시간 저장 기능 추가

### v1.0.0 (이전 버전)
- 기본 이의신청 기능
- 간단한 사진 목록
- 기본 폼 검증

## 라이선스

이 컴포넌트는 MIT 라이선스 하에 배포됩니다.

## 기여하기

버그 리포트, 기능 요청, 풀 리퀘스트를 환영합니다.

## 연락처

문의사항이 있으시면 개발팀에 연락해주세요. 