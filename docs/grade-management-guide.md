# 계약자 등급 관리 시스템 가이드

## 개요

`GradeManagement` 컴포넌트는 커튼 설치 플랫폼에서 계약자의 등급을 체계적으로 관리할 수 있는 종합적인 관리 시스템입니다. 5단계 등급 시스템을 기반으로 개별 및 일괄 등급 변경, 필터링, 통계 기능을 제공합니다.

## 주요 기능

### 1. 5단계 등급 시스템
- **브론즈 (1등급)**: 기본 서비스 제공
- **실버 (2등급)**: 우선 매칭, 기본 혜택
- **골드 (3등급)**: 프리미엄 매칭, 추가 혜택
- **플래티넘 (4등급)**: VIP 매칭, 특별 혜택
- **다이아몬드 (5등급)**: 최고 등급, 모든 혜택

### 2. 등급 관리 기능
- **개별 등급 변경**: 계약자별 개별 등급 변경
- **일괄 등급 변경**: 여러 계약자의 등급을 한 번에 변경
- **실시간 업데이트**: 등급 변경 후 즉시 반영
- **변경 히스토리**: 모든 등급 변경 이력 자동 기록

### 3. 필터링 및 검색
- **이름 검색**: 계약자 이름으로 검색
- **등급 필터**: 특정 등급의 계약자만 표시
- **실시간 필터링**: 검색어 입력 시 즉시 결과 표시

### 4. 통계 대시보드
- **등급별 통계**: 각 등급별 계약자 수 표시
- **시각적 카드**: 색상 구분된 통계 카드
- **실시간 업데이트**: 변경 후 통계 자동 갱신

## 컴포넌트 구조

```jsx
import GradeManagement from './components/GradeManagement';

// 기본 사용법
<GradeManagement />
```

## Props

현재 버전에서는 별도의 props가 필요하지 않습니다. 모든 데이터는 Firestore에서 직접 조회합니다.

## 데이터 구조

### 계약자 데이터 (Firestore - contractors 컬렉션)

```javascript
{
  id: "contractor_001",
  name: "김철수",
  displayName: "김철수",
  level: 4, // 현재 등급 (1-5)
  grade: 4, // 이전 버전 호환성 (선택사항)
  previousGrade: 3, // 이전 등급
  lastGradeUpdate: Timestamp, // 마지막 등급 변경 시간
  reviewStats: {
    totalReviews: 127,
    averageRating: 4.8,
    // 기타 리뷰 통계...
  },
  completedJobsCount: 89,
  // 기타 계약자 정보...
}
```

### 등급 변경 히스토리 (Firestore - gradeChangeHistory 컬렉션)

```javascript
{
  id: "history_001",
  contractorId: "contractor_001",
  contractorName: "김철수",
  previousGrade: 3,
  newGrade: 4,
  previousGradeName: "골드",
  newGradeName: "플래티넘",
  changedAt: Timestamp,
  changedBy: "admin", // 변경한 관리자 ID
  reason: "관리자 수동 변경", // 변경 사유
  notes: "우수한 성과로 인한 등급 상승" // 추가 메모
}
```

## 사용 방법

### 1. 개별 등급 변경

```jsx
// 1. 계약자 목록에서 변경할 계약자 찾기
// 2. 해당 계약자의 "등급 변경" 드롭다운에서 새 등급 선택
// 3. 하단의 확인 메시지 확인 후 "등급 변경" 버튼 클릭
// 4. 성공 메시지 확인
```

### 2. 일괄 등급 변경

```jsx
// 1. "일괄 변경" 버튼 클릭
// 2. 변경할 계약자들의 체크박스 선택
// 3. 새 등급 선택
// 4. "일괄 변경" 버튼 클릭
```

### 3. 필터링 및 검색

```jsx
// 검색: 계약자 이름 입력
// 등급 필터: 드롭다운에서 등급 선택
// 결과 확인: 필터링된 결과 수 확인
```

## 등급 시스템 상세

### 등급별 혜택

| 등급 | 이름 | 색상 | 매칭 우선순위 | 수수료 할인 | 기타 혜택 |
|------|------|------|---------------|-------------|-----------|
| 1 | 브론즈 | 회색 | 기본 | 없음 | 기본 서비스 |
| 2 | 실버 | 파란색 | 우선 | 5% | 기본 혜택 |
| 3 | 골드 | 노란색 | 프리미엄 | 10% | 추가 혜택 |
| 4 | 플래티넘 | 보라색 | VIP | 15% | 특별 혜택 |
| 5 | 다이아몬드 | 금색 | 최우선 | 20% | 모든 혜택 |

### 등급 상승 조건

1. **평점**: 높은 평점과 만족도
2. **작업 수**: 많은 완료 작업 수
3. **시간 준수**: 정시 도착 및 완료
4. **품질**: 우수한 시공 품질
5. **고객 만족**: 고객 추천률

## UI 구성 요소

### 1. 헤더 섹션
- 제목 및 설명
- 탭 네비게이션 (예시 컴포넌트에서)

### 2. 통계 카드
- 등급별 계약자 수 표시
- 색상 구분된 카드 레이아웃

### 3. 필터 및 검색
- 검색 입력 필드
- 등급 필터 드롭다운
- 기능 버튼들

### 4. 계약자 목록 테이블
- 체크박스 (일괄 변경 모드)
- 계약자 정보
- 현재 등급
- 평점 및 작업 수
- 등급 변경 드롭다운

### 5. 변경 확인 섹션
- 선택된 계약자 정보
- 변경 전후 등급 표시
- 변경 버튼

## 에러 처리

### 1. 데이터 로딩 오류
- "계약자 목록을 불러오는 중 오류가 발생했습니다."
- 로딩 스피너 표시

### 2. 등급 변경 오류
- "등급 변경 중 오류가 발생했습니다."
- 입력 검증 오류 메시지

### 3. 네트워크 오류
- 연결 실패 시 재시도 옵션
- 오프라인 상태 처리

## 성능 최적화

### 1. 데이터 최적화
- 필요한 데이터만 조회
- 페이지네이션 지원 (향후 구현)
- 캐싱 전략

### 2. UI 최적화
- 가상 스크롤링 (대용량 데이터)
- 지연 로딩
- 메모이제이션

### 3. 배치 처리
- 일괄 변경 시 배치 처리
- 트랜잭션 사용
- 에러 복구

## 보안 고려사항

### 1. 권한 관리
- 관리자 권한 확인
- 등급 변경 권한 검증
- 감사 로그 기록

### 2. 데이터 검증
- 입력값 검증
- 등급 범위 확인
- 중복 변경 방지

### 3. Firestore 보안 규칙
```javascript
// 예시 보안 규칙
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /contractors/{contractorId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   request.auth.token.admin == true;
    }
    
    match /gradeChangeHistory/{historyId} {
      allow read: if request.auth != null && 
                   request.auth.token.admin == true;
      allow create: if request.auth != null && 
                     request.auth.token.admin == true;
    }
  }
}
```

## 확장 가능성

### 1. 추가 기능
- 등급 변경 승인 워크플로우
- 자동 등급 상승/하락
- 등급별 혜택 관리
- 통계 리포트 생성

### 2. 알림 시스템
- 등급 변경 알림
- 등급 상승 축하 메시지
- 관리자 알림

### 3. 분석 도구
- 등급별 성과 분석
- 등급 상승 패턴 분석
- 예측 모델링

## 사용 예시

### 1. 기본 사용법

```jsx
import React from 'react';
import GradeManagement from './components/GradeManagement';

const AdminDashboard = () => {
  return (
    <div>
      <h1>관리자 대시보드</h1>
      <GradeManagement />
    </div>
  );
};
```

### 2. 라우팅과 함께 사용

```jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GradeManagement from './components/GradeManagement';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/grade-management" element={<GradeManagement />} />
      {/* 기타 관리자 라우트 */}
    </Routes>
  );
};
```

### 3. 권한 확인과 함께 사용

```jsx
import React from 'react';
import { useAuth } from './hooks/useAuth';
import GradeManagement from './components/GradeManagement';

const ProtectedGradeManagement = () => {
  const { user, isAdmin } = useAuth();

  if (!user || !isAdmin) {
    return <div>접근 권한이 없습니다.</div>;
  }

  return <GradeManagement />;
};
```

## 문제 해결

### 일반적인 문제들

1. **데이터가 로드되지 않는 경우**
   - Firestore 연결 확인
   - 보안 규칙 확인
   - 네트워크 연결 확인

2. **등급 변경이 되지 않는 경우**
   - 권한 확인
   - 입력값 검증
   - Firestore 오류 로그 확인

3. **일괄 변경이 실패하는 경우**
   - 선택된 계약자 수 확인
   - 배치 크기 제한 확인
   - 네트워크 타임아웃 확인

### 디버깅 팁

1. **콘솔 로그 확인**
   - 에러 메시지 확인
   - 네트워크 요청 확인

2. **Firestore 로그 확인**
   - 보안 규칙 위반 확인
   - 쿼리 성능 확인

3. **브라우저 개발자 도구**
   - 네트워크 탭에서 요청 확인
   - 애플리케이션 탭에서 로컬 스토리지 확인

## 업데이트 로그

- **v2.0**: 5단계 등급 시스템, 일괄 변경, 필터링 기능 추가
- **v1.0**: 기본 등급 변경 기능

## 라이선스

이 컴포넌트는 MIT 라이선스 하에 배포됩니다. 