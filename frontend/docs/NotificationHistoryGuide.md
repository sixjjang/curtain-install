# 등급 변경 알림 히스토리 시스템 가이드

## 개요

등급 변경 알림 히스토리 시스템은 계약자의 등급 변경 이력을 실시간으로 모니터링하고 관리할 수 있는 종합적인 관리 도구입니다.

## 주요 기능

### 1. 실시간 모니터링
- 등급 변경 이력의 실시간 조회
- 변경 유형별 분류 (상승/하락/동일)
- 등급별 색상 구분 및 시각적 표현

### 2. 고급 필터링
- **등급별 필터**: 특정 등급의 변경 이력만 조회
- **변경 유형 필터**: 상승/하락/전체 변경 이력 필터링
- **기간별 필터**: 오늘/최근 7일/이번 달/전체 기간

### 3. 통계 및 분석
- 총 변경 건수
- 표시된 건수
- 등급 상승/하락 통계
- 실시간 업데이트

### 4. 사용자 인터페이스
- 모던하고 직관적인 UI
- 반응형 디자인
- 로딩 상태 표시
- 페이지네이션 (더보기 기능)

## 컴포넌트 구조

### LevelChangeNotificationHistory
메인 컴포넌트로 다음 기능들을 포함합니다:

```jsx
import LevelChangeNotificationHistory from './LevelChangeNotificationHistory';

// 기본 사용법
<LevelChangeNotificationHistory />
```

### 주요 상태 관리

```javascript
const [notifications, setNotifications] = useState([]);
const [loading, setLoading] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
const [hasMore, setHasMore] = useState(true);
const [totalCount, setTotalCount] = useState(0);
const [filters, setFilters] = useState({
  level: "",
  changeType: "",
  dateRange: "all"
});
const [selectedNotifications, setSelectedNotifications] = useState([]);
const [showFilters, setShowFilters] = useState(false);
```

## 데이터 구조

### Firestore 컬렉션: `gradeChangeLogs`

```javascript
{
  id: "auto-generated",
  contractorId: "contractor_123",
  contractorName: "김철수", // 선택적
  oldLevel: 2,
  newLevel: 3,
  timestamp: Timestamp,
  reason: "평점 업데이트", // 선택적
  changeType: "upgrade", // 자동 계산
  adminId: "admin_456", // 선택적
  evaluationId: "eval_789" // 선택적
}
```

## 등급 시스템

### 5단계 등급 체계

```javascript
const gradeInfo = {
  1: { name: '브론즈', color: 'bg-gray-100 text-gray-800', description: '기본 서비스' },
  2: { name: '실버', color: 'bg-blue-100 text-blue-800', description: '우선 매칭' },
  3: { name: '골드', color: 'bg-green-100 text-green-800', description: '프리미엄 매칭' },
  4: { name: '플래티넘', color: 'bg-purple-100 text-purple-800', description: 'VIP 매칭' },
  5: { name: '다이아몬드', color: 'bg-yellow-100 text-yellow-800', description: '최고 등급' }
};
```

## 사용법

### 1. 기본 사용법

```jsx
import React from 'react';
import LevelChangeNotificationHistory from './LevelChangeNotificationHistory';

function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>관리자 대시보드</h1>
      <LevelChangeNotificationHistory />
    </div>
  );
}
```

### 2. 라우팅과 함께 사용

```jsx
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LevelChangeNotificationHistory from './LevelChangeNotificationHistory';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navigation">
          {/* 네비게이션 메뉴 */}
        </nav>
        
        <main className="main-content">
          <Switch>
            <Route path="/admin/grade-history" component={LevelChangeNotificationHistory} />
            {/* 다른 라우트들 */}
          </Switch>
        </main>
      </div>
    </Router>
  );
}
```

### 3. 사이드바와 함께 사용

```jsx
import React from 'react';
import LevelChangeNotificationHistory from './LevelChangeNotificationHistory';

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <div className="w-64 bg-white shadow-sm">
        <nav className="p-4">
          <a href="/admin/dashboard" className="block py-2">대시보드</a>
          <a href="/admin/grade-history" className="block py-2 text-blue-600">등급 변경 히스토리</a>
          {/* 다른 메뉴들 */}
        </nav>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="flex-1">
        <LevelChangeNotificationHistory />
      </div>
    </div>
  );
}
```

## 필터링 기능

### 등급별 필터링

```javascript
// 특정 등급의 변경 이력만 조회
const filterByLevel = (level) => {
  setFilters(prev => ({ ...prev, level: level }));
};

// 사용 예시
filterByLevel("3"); // 골드 등급 변경 이력만 조회
```

### 변경 유형 필터링

```javascript
// 등급 상승 이력만 조회
setFilters(prev => ({ ...prev, changeType: "upgrade" }));

// 등급 하락 이력만 조회
setFilters(prev => ({ ...prev, changeType: "downgrade" }));

// 모든 변경 이력 조회
setFilters(prev => ({ ...prev, changeType: "" }));
```

### 기간별 필터링

```javascript
// 오늘의 변경 이력
setFilters(prev => ({ ...prev, dateRange: "today" }));

// 최근 7일
setFilters(prev => ({ ...prev, dateRange: "week" }));

// 이번 달
setFilters(prev => ({ ...prev, dateRange: "month" }));

// 전체 기간
setFilters(prev => ({ ...prev, dateRange: "all" }));
```

## 커스터마이징

### 등급 정보 수정

```javascript
// 컴포넌트 내부의 gradeInfo 객체 수정
const gradeInfo = {
  1: { name: '신입', color: 'bg-gray-100 text-gray-800', description: '신입 계약자' },
  2: { name: '일반', color: 'bg-blue-100 text-blue-800', description: '일반 계약자' },
  3: { name: '우수', color: 'bg-green-100 text-green-800', description: '우수 계약자' },
  4: { name: '특급', color: 'bg-purple-100 text-purple-800', description: '특급 계약자' },
  5: { name: '마스터', color: 'bg-yellow-100 text-yellow-800', description: '마스터 계약자' }
};
```

### 스타일 커스터마이징

```css
/* Tailwind CSS 클래스 수정 */
.grade-bronze {
  @apply bg-gray-100 text-gray-800;
}

.grade-silver {
  @apply bg-blue-100 text-blue-800;
}

.grade-gold {
  @apply bg-green-100 text-green-800;
}

.grade-platinum {
  @apply bg-purple-100 text-purple-800;
}

.grade-diamond {
  @apply bg-yellow-100 text-yellow-800;
}
```

## 성능 최적화

### 1. 페이지네이션
- 한 번에 20개씩 로드
- 더보기 버튼으로 추가 로드
- 스크롤 기반 무한 로딩 지원 가능

### 2. 필터링 최적화
- Firestore 쿼리 최적화
- 인덱스 설정 필요
- 복합 쿼리 지원

### 3. 캐싱
- React Query 또는 SWR 사용 권장
- 로컬 상태 관리 최적화

## 에러 처리

### 네트워크 에러

```javascript
try {
  const snapshot = await getDocs(q);
  // 데이터 처리
} catch (error) {
  console.error("알림 히스토리 로딩 오류:", error);
  // 사용자에게 에러 메시지 표시
}
```

### 데이터 검증

```javascript
const validateNotification = (data) => {
  if (!data.contractorId || !data.oldLevel || !data.newLevel) {
    throw new Error("필수 데이터가 누락되었습니다.");
  }
  
  if (data.oldLevel < 1 || data.oldLevel > 5 || data.newLevel < 1 || data.newLevel > 5) {
    throw new Error("등급 값이 유효하지 않습니다.");
  }
};
```

## 보안 고려사항

### 1. 권한 확인
```javascript
// 관리자 권한 확인
const checkAdminPermission = () => {
  const user = auth.currentUser;
  const userRole = user?.role;
  
  if (userRole !== 'admin') {
    throw new Error("관리자 권한이 필요합니다.");
  }
};
```

### 2. 데이터 접근 제한
```javascript
// Firestore 보안 규칙
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gradeChangeLogs/{document} {
      allow read: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.token.role == 'manager');
      allow write: if false; // 읽기 전용
    }
  }
}
```

## 모니터링 및 로깅

### 1. 사용자 활동 로깅
```javascript
const logUserActivity = (action, details) => {
  const logData = {
    userId: auth.currentUser?.uid,
    action: action,
    details: details,
    timestamp: new Date(),
    userAgent: navigator.userAgent
  };
  
  // 로그 저장
  addDoc(collection(firestore, "adminActivityLogs"), logData);
};
```

### 2. 성능 모니터링
```javascript
const measurePerformance = async (operation) => {
  const startTime = performance.now();
  
  try {
    await operation();
  } finally {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 성능 로그 저장
    console.log(`Operation took ${duration}ms`);
  }
};
```

## 테스트

### 1. 단위 테스트
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import LevelChangeNotificationHistory from './LevelChangeNotificationHistory';

test('renders notification history', () => {
  render(<LevelChangeNotificationHistory />);
  expect(screen.getByText('등급 변경 알림 히스토리')).toBeInTheDocument();
});

test('filters work correctly', () => {
  render(<LevelChangeNotificationHistory />);
  
  const levelFilter = screen.getByLabelText('등급별 필터');
  fireEvent.change(levelFilter, { target: { value: '3' } });
  
  // 필터 적용 확인
});
```

### 2. 통합 테스트
```javascript
test('loads and displays notifications', async () => {
  render(<LevelChangeNotificationHistory />);
  
  // 로딩 상태 확인
  expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  
  // 데이터 로드 후 확인
  await waitFor(() => {
    expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument();
  });
});
```

## 배포 고려사항

### 1. 환경 설정
```javascript
// 환경별 설정
const config = {
  development: {
    pageSize: 10,
    enableDebug: true
  },
  production: {
    pageSize: 20,
    enableDebug: false
  }
};
```

### 2. 번들 최적화
```javascript
// 동적 임포트
const LevelChangeNotificationHistory = React.lazy(() => 
  import('./LevelChangeNotificationHistory')
);

// 사용 시
<Suspense fallback={<div>로딩 중...</div>}>
  <LevelChangeNotificationHistory />
</Suspense>
```

## 결론

등급 변경 알림 히스토리 시스템은 계약자 관리의 핵심 도구로, 실시간 모니터링과 고급 필터링을 통해 효율적인 등급 관리가 가능합니다. 이 가이드를 참고하여 시스템을 효과적으로 활용하시기 바랍니다. 