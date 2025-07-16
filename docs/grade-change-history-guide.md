# 등급 변경 히스토리 시스템 가이드

## 개요

`GradeChangeHistory` 컴포넌트는 커튼 설치 플랫폼에서 계약자의 등급 변경 이력을 체계적으로 관리하고 조회할 수 있는 종합적인 히스토리 시스템입니다. 실시간 데이터 조회, 고급 필터링, 통계 대시보드, 상세 정보 모달 등의 기능을 제공합니다.

## 주요 기능

### 1. 실시간 히스토리 조회
- **최신순 정렬**: 변경 일시 기준 최신순으로 정렬
- **실시간 데이터**: Firestore에서 실시간 데이터 동기화
- **자동 새로고침**: 데이터 업데이트 시 자동 반영
- **로딩 상태**: 데이터 로딩 중 상태 표시

### 2. 고급 필터링 시스템
- **계약자 검색**: 이름 기반 실시간 검색
- **등급 필터**: 특정 등급으로 변경된 이력만 조회
- **기간 필터**: 오늘, 주, 월, 분기, 년 단위 필터링
- **필터 초기화**: 모든 필터를 한 번에 초기화

### 3. 통계 대시보드
- **총 변경 건수**: 전체 등급 변경 이력 수
- **등급 상승/하락**: 상승과 하락 건수 분리 표시
- **신규 등급**: 처음 등급을 받은 계약자 수
- **상승률**: 전체 대비 등급 상승 비율

### 4. 상세 정보 모달
- **변경 사유**: 등급 변경의 구체적인 이유
- **추가 메모**: 변경 시 추가된 참고사항
- **변경자 정보**: 등급을 변경한 관리자
- **정확한 시간**: 변경 일시의 정확한 표시

### 5. 페이지네이션
- **무한 스크롤**: 더보기 버튼으로 추가 데이터 로드
- **20건씩 로드**: 한 번에 20건씩 효율적으로 로드
- **로딩 상태**: 추가 로딩 중 상태 표시
- **자동 감지**: 더 이상 데이터가 없을 때 자동 감지

### 6. 변경 유형 분류
- **등급 상승**: 새 등급이 이전 등급보다 높은 경우 (초록색)
- **등급 하락**: 새 등급이 이전 등급보다 낮은 경우 (빨간색)
- **신규 등급**: 이전에 등급이 없던 계약자 (파란색)
- **등급 유지**: 등급이 변경되지 않은 경우 (회색)

## 컴포넌트 구조

```jsx
import GradeChangeHistory from './components/GradeChangeHistory';

// 기본 사용법
<GradeChangeHistory />
```

## Props

현재 버전에서는 별도의 props가 필요하지 않습니다. 모든 데이터는 Firestore에서 직접 조회합니다.

## 데이터 구조

### 등급 변경 히스토리 (Firestore - gradeChangeHistory 컬렉션)

```javascript
{
  id: "history_001",
  contractorId: "contractor_001",
  contractorName: "김철수",
  previousGrade: 3, // 이전 등급 (null인 경우 신규 등급)
  newGrade: 4, // 새 등급
  previousGradeName: "골드", // 이전 등급 이름
  newGradeName: "플래티넘", // 새 등급 이름
  changedAt: Timestamp, // 변경 일시
  changedBy: "admin", // 변경한 관리자 ID
  reason: "우수한 성과로 인한 등급 상승", // 변경 사유
  notes: "고객 만족도 4.8점, 완료 작업 50건 달성" // 추가 메모
}
```

### 5단계 등급 시스템

| 등급 | 이름 | 색상 | 설명 |
|------|------|------|------|
| 1 | 브론즈 | 회색 | 기본 서비스 제공 |
| 2 | 실버 | 파란색 | 우선 매칭, 기본 혜택 |
| 3 | 골드 | 노란색 | 프리미엄 매칭, 추가 혜택 |
| 4 | 플래티넘 | 보라색 | VIP 매칭, 특별 혜택 |
| 5 | 다이아몬드 | 금색 | 최고 등급, 모든 혜택 |

## 사용 방법

### 1. 기본 조회

```jsx
// 페이지 접속 시 자동으로 최신 20건 로드
// 변경 일시 기준 최신순 정렬
// 상단에 통계 카드 표시
```

### 2. 필터링 사용

```jsx
// 계약자 검색
// 입력 필드에 계약자 이름 입력

// 등급 필터
// 드롭다운에서 특정 등급 선택

// 기간 필터
// 오늘, 이번 주, 이번 달, 이번 분기, 올해 선택

// 필터 초기화
// "필터 초기화" 버튼 클릭
```

### 3. 상세 정보 확인

```jsx
// 각 행의 "상세보기" 버튼 클릭
// 모달 창에서 상세 정보 확인
// 변경 사유, 메모, 변경자 정보 등 표시
```

### 4. 더 많은 데이터 로드

```jsx
// 하단의 "더 보기" 버튼 클릭
// 추가 20건 로드
// 모든 데이터 로드 완료 시 버튼 숨김
```

## UI 구성 요소

### 1. 헤더 섹션
- 제목 및 설명
- 탭 네비게이션 (예시 컴포넌트에서)

### 2. 통계 카드
- 총 변경 건수 (파란색)
- 등급 상승 건수 (초록색)
- 등급 하락 건수 (빨간색)
- 신규 등급 건수 (보라색)
- 상승률 (노란색)

### 3. 필터 섹션
- 계약자 검색 입력 필드
- 등급 필터 드롭다운
- 기간 필터 드롭다운
- 필터 초기화 및 새로고침 버튼

### 4. 히스토리 테이블
- 계약자 정보 (이름, ID)
- 변경 유형 (색상 구분)
- 이전/새 등급 (배지 형태)
- 변경 일시
- 변경자
- 상세보기 버튼

### 5. 페이지네이션
- 더보기 버튼
- 로딩 상태 표시
- 자동 숨김 (데이터 없을 때)

### 6. 상세 정보 모달
- 계약자 정보
- 변경 유형
- 이전/새 등급
- 변경 일시
- 변경자
- 변경 사유
- 추가 메모

## 필터링 옵션

### 기간 필터

| 옵션 | 설명 | 기간 |
|------|------|------|
| 전체 기간 | 모든 기간 | 제한 없음 |
| 오늘 | 오늘 하루 | 오늘 00:00 ~ 현재 |
| 이번 주 | 최근 7일 | 7일 전 ~ 현재 |
| 이번 달 | 최근 30일 | 30일 전 ~ 현재 |
| 이번 분기 | 최근 90일 | 90일 전 ~ 현재 |
| 올해 | 올해 1월 1일부터 | 올해 1월 1일 ~ 현재 |

### 등급 필터

- 모든 등급
- 브론즈 (1등급)
- 실버 (2등급)
- 골드 (3등급)
- 플래티넘 (4등급)
- 다이아몬드 (5등급)

## 에러 처리

### 1. 데이터 로딩 오류
- "히스토리를 불러오는 중 오류가 발생했습니다."
- 로딩 스피너 표시
- 재시도 옵션 제공

### 2. 네트워크 오류
- 연결 실패 시 재시도 버튼
- 오프라인 상태 처리
- 부분 로딩 실패 처리

### 3. 필터링 오류
- 잘못된 필터 조건 처리
- 빈 결과 표시
- 필터 초기화 안내

## 성능 최적화

### 1. 데이터 최적화
- 20건씩 페이지네이션
- 필요한 필드만 조회
- 인덱스 활용

### 2. UI 최적화
- 가상 스크롤링 (향후 구현)
- 지연 로딩
- 메모이제이션

### 3. 쿼리 최적화
- 복합 인덱스 사용
- 필터 조건 최적화
- 캐싱 전략

## 보안 고려사항

### 1. 권한 관리
- 관리자 권한 확인
- 읽기 전용 접근
- 감사 로그 기록

### 2. 데이터 검증
- 입력값 검증
- 날짜 범위 확인
- 필터 조건 검증

### 3. Firestore 보안 규칙
```javascript
// 예시 보안 규칙
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
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
- 히스토리 내보내기 (CSV, Excel)
- 차트 및 그래프 표시
- 알림 시스템
- 자동 리포트 생성

### 2. 분석 도구
- 등급 변경 패턴 분석
- 예측 모델링
- 성과 분석
- 트렌드 분석

### 3. 관리 기능
- 히스토리 수정
- 일괄 처리
- 백업 및 복원
- 데이터 정리

## 사용 예시

### 1. 기본 사용법

```jsx
import React from 'react';
import GradeChangeHistory from './components/GradeChangeHistory';

const AdminDashboard = () => {
  return (
    <div>
      <h1>관리자 대시보드</h1>
      <GradeChangeHistory />
    </div>
  );
};
```

### 2. 라우팅과 함께 사용

```jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GradeChangeHistory from './components/GradeChangeHistory';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/grade-history" element={<GradeChangeHistory />} />
      {/* 기타 관리자 라우트 */}
    </Routes>
  );
};
```

### 3. 권한 확인과 함께 사용

```jsx
import React from 'react';
import { useAuth } from './hooks/useAuth';
import GradeChangeHistory from './components/GradeChangeHistory';

const ProtectedGradeHistory = () => {
  const { user, isAdmin } = useAuth();

  if (!user || !isAdmin) {
    return <div>접근 권한이 없습니다.</div>;
  }

  return <GradeChangeHistory />;
};
```

### 4. 탭 기반 레이아웃

```jsx
import React, { useState } from 'react';
import GradeChangeHistory from './components/GradeChangeHistory';
import GradeManagement from './components/GradeManagement';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('history');

  return (
    <div>
      <div className="tabs">
        <button 
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          등급 변경 히스토리
        </button>
        <button 
          className={activeTab === 'management' ? 'active' : ''}
          onClick={() => setActiveTab('management')}
        >
          등급 관리
        </button>
      </div>
      
      {activeTab === 'history' && <GradeChangeHistory />}
      {activeTab === 'management' && <GradeManagement />}
    </div>
  );
};
```

## 문제 해결

### 일반적인 문제들

1. **데이터가 로드되지 않는 경우**
   - Firestore 연결 확인
   - 보안 규칙 확인
   - 네트워크 연결 확인
   - 컬렉션 이름 확인

2. **필터링이 작동하지 않는 경우**
   - 인덱스 설정 확인
   - 필터 조건 검증
   - 쿼리 구문 확인

3. **페이지네이션이 작동하지 않는 경우**
   - lastDoc 상태 확인
   - hasMore 상태 확인
   - 쿼리 순서 확인

### 디버깅 팁

1. **콘솔 로그 확인**
   - 에러 메시지 확인
   - 네트워크 요청 확인
   - 상태 변화 추적

2. **Firestore 로그 확인**
   - 보안 규칙 위반 확인
   - 쿼리 성능 확인
   - 인덱스 사용 확인

3. **브라우저 개발자 도구**
   - 네트워크 탭에서 요청 확인
   - 애플리케이션 탭에서 로컬 스토리지 확인
   - 성능 탭에서 렌더링 성능 확인

## 업데이트 로그

- **v2.0**: 고급 필터링, 통계 대시보드, 상세 모달, 페이지네이션 추가
- **v1.0**: 기본 히스토리 조회 기능

## 라이선스

이 컴포넌트는 MIT 라이선스 하에 배포됩니다. 