# 판매자 정산 대시보드 가이드

## 개요

`SellerSettlementDashboard` 컴포넌트는 판매자가 자신의 정산 현황을 실시간으로 모니터링할 수 있는 종합적인 대시보드입니다. 이 컴포넌트는 Firebase Firestore에서 작업 주문 데이터를 가져와서 정산 통계를 계산하고 시각적으로 표시합니다.

## 주요 기능

### 📊 실시간 통계 대시보드
- **총 매출**: 결제 완료된 모든 작업의 총 금액
- **기사 지급액**: 작업자에게 지급되는 금액의 총합
- **플랫폼 수수료**: 플랫폼에서 수수하는 수수료의 총합
- **긴급 수수료**: 긴급 작업에 대한 추가 수수료
- **총 작업 건수**: 등록된 모든 작업의 개수
- **평균 주문 금액**: 작업당 평균 매출액

### 🔍 고급 필터링
- **기간별 필터**: 전체, 이번 달, 지난 달, 올해, 사용자 지정
- **사용자 지정 기간**: 특정 년/월 선택 가능
- **실시간 데이터 업데이트**: 필터 변경 시 즉시 데이터 갱신

### 📋 상세 정산 내역
- **작업별 상세 정보**: 각 작업의 정산 내역을 테이블로 표시
- **상태 표시**: 결제 상태 및 작업 상태를 색상으로 구분
- **금액 포맷팅**: 한국어 통화 형식으로 표시

## 컴포넌트 구조

### JavaScript 버전
```javascript
// frontend/src/components/SellerSettlementDashboard.js
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";

export default function SellerSettlementDashboard() {
  // 상태 관리
  const [summary, setSummary] = useState({...});
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // 컴포넌트 로직...
}
```

### TypeScript 버전
```typescript
// frontend/src/components/SellerSettlementDashboard.tsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";

interface SettlementSummary {
  totalSales: number;
  totalWorkerPayments: number;
  totalPlatformFees: number;
  totalUrgentFees: number;
  totalWorkOrders: number;
  averageOrderValue: number;
}

interface Settlement {
  id: string;
  workOrderId: string;
  totalFee: number;
  workerPayment: number;
  platformFee: number;
  urgentFee: number;
  baseFee: number;
  paymentStatus: string;
  createdAt: any;
  completedAt: any;
  status: string;
  workerId?: string;
  workerName?: string;
  customerAddress?: string;
  description?: string;
}

type FilterPeriod = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export default function SellerSettlementDashboard() {
  // 타입이 지정된 상태 관리
  const [summary, setSummary] = useState<SettlementSummary>({...});
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // 컴포넌트 로직...
}
```

## 사용법

### 기본 사용법
```jsx
import SellerSettlementDashboard from './components/SellerSettlementDashboard';

function App() {
  return (
    <div>
      <SellerSettlementDashboard />
    </div>
  );
}
```

### 예제 컴포넌트와 함께 사용
```jsx
import SellerSettlementDashboardExample from './components/SellerSettlementDashboardExample';

function App() {
  return (
    <div>
      <SellerSettlementDashboardExample />
    </div>
  );
}
```

## 데이터 구조

### Firestore 컬렉션: `workOrders`
```javascript
{
  id: "workOrderId",
  sellerId: "sellerUid",
  baseFee: 50000,
  paymentDetails: {
    totalFee: 55000,
    workerPayment: 45000,
    platformFee: 5000,
    urgentFee: 5000
  },
  paymentStatus: "paid", // "paid", "pending", "failed"
  status: "completed", // "pending", "in_progress", "completed", "cancelled"
  createdAt: Timestamp,
  completedAt: Timestamp,
  workerId: "workerUid",
  workerName: "작업자 이름",
  customerAddress: "고객 주소",
  description: "작업 설명"
}
```

## 주요 함수들

### 데이터 가져오기
```javascript
async function fetchSettlementData() {
  try {
    setLoading(true);
    setError(null);

    // 기본 쿼리 - 판매자 ID로 필터링
    let q = query(
      collection(db, "workOrders"),
      where("sellerId", "==", userId),
      orderBy("createdAt", "desc")
    );

    // 기간 필터 적용
    if (filterPeriod !== 'all') {
      const now = new Date();
      let startDate;

      switch (filterPeriod) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'custom':
          startDate = new Date(selectedYear, selectedMonth - 1, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        q = query(
          collection(db, "workOrders"),
          where("sellerId", "==", userId),
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
          orderBy("createdAt", "desc")
        );
      }
    }

    const snapshot = await getDocs(q);
    // 데이터 처리 로직...
  } catch (err) {
    console.error('정산 데이터 조회 실패:', err);
    setError('정산 데이터를 불러오는 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
}
```

### 날짜 포맷팅
```javascript
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  try {
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('ko-KR');
    }
    return new Date(timestamp).toLocaleDateString('ko-KR');
  } catch (error) {
    return '-';
  }
};
```

### 상태 색상 관리
```javascript
const getStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'text-green-600 bg-green-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'failed':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'paid':
      return '결제완료';
    case 'pending':
      return '결제대기';
    case 'failed':
      return '결제실패';
    default:
      return status;
  }
};
```

## 스타일링

### Tailwind CSS 클래스
- **그라디언트 카드**: `bg-gradient-to-r from-{color}-500 to-{color}-600`
- **반응형 그리드**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **테이블 스타일링**: `min-w-full divide-y divide-gray-200`
- **상태 배지**: `inline-flex px-2 py-1 text-xs font-semibold rounded-full`

### 색상 체계
- **성공/완료**: Green (`green-500`, `green-600`)
- **대기/진행**: Yellow (`yellow-500`, `yellow-600`)
- **실패/오류**: Red (`red-500`, `red-600`)
- **정보**: Blue (`blue-500`, `blue-600`)
- **보조**: Purple (`purple-500`, `purple-600`), Indigo (`indigo-500`, `indigo-600`), Pink (`pink-500`, `pink-600`)

## 인증 및 보안

### Firebase Authentication
```javascript
useEffect(() => {
  const unsubscribeAuth = auth.onAuthStateChanged(user => {
    if (user) {
      setUserId(user.uid);
    } else {
      setUserId(null);
      setSettlements([]);
      setLoading(false);
    }
  });

  return () => unsubscribeAuth();
}, []);
```

### 데이터 접근 제어
- 판매자 ID로 필터링하여 본인의 데이터만 조회
- 인증되지 않은 사용자는 접근 불가
- Firestore 보안 규칙과 연동

## 성능 최적화

### 데이터 로딩 최적화
- 로딩 상태 표시
- 에러 처리 및 사용자 피드백
- 조건부 렌더링

### 쿼리 최적화
- 필요한 필드만 조회
- 인덱스 활용을 위한 쿼리 구조
- 페이지네이션 고려 (필요시)

## 확장 가능한 기능

### 추가 가능한 기능들
1. **엑셀/PDF 내보내기**
2. **차트 및 그래프**
3. **실시간 알림**
4. **정산 요청 기능**
5. **세금 계산기**
6. **다국어 지원**

### 예제 확장 컴포넌트
```jsx
// SellerSettlementDashboardExample.js
export default function SellerSettlementDashboardExample() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', name: '정산 대시보드', icon: '📊' },
    { id: 'settings', name: '설정', icon: '⚙️' },
    { id: 'help', name: '도움말', icon: '❓' },
  ];

  // 탭 기반 네비게이션 구현...
}
```

## 트러블슈팅

### 일반적인 문제들

1. **데이터가 표시되지 않는 경우**
   - Firebase 인증 상태 확인
   - Firestore 보안 규칙 확인
   - 네트워크 연결 상태 확인

2. **필터가 작동하지 않는 경우**
   - Firestore 인덱스 설정 확인
   - 쿼리 구문 검증
   - 날짜 형식 확인

3. **성능 이슈**
   - 데이터 양이 많은 경우 페이지네이션 적용
   - 불필요한 리렌더링 방지
   - 쿼리 최적화

### 디버깅 팁
```javascript
// 콘솔 로그 추가
console.log('User ID:', userId);
console.log('Filter Period:', filterPeriod);
console.log('Settlements:', settlements);
console.log('Summary:', summary);
```

## 배포 및 유지보수

### 배포 시 고려사항
1. **환경 변수 설정**
2. **Firebase 프로젝트 설정**
3. **도메인 설정**
4. **SSL 인증서**

### 유지보수 체크리스트
- [ ] 정기적인 데이터 백업
- [ ] 성능 모니터링
- [ ] 보안 업데이트
- [ ] 사용자 피드백 수집
- [ ] 기능 개선 계획

## 라이선스 및 기여

이 컴포넌트는 MIT 라이선스 하에 배포됩니다. 기여는 언제든 환영합니다.

## 연락처

문의사항이나 버그 리포트는 프로젝트 이슈 트래커를 통해 제출해 주세요. 