# 결제 계산기 시스템 가이드

## 개요

커튼 설치 플랫폼을 위한 종합적인 결제 계산 시스템입니다. 기본 시공비, 긴급 수수료, 플랫폼 수수료, 할인, 세금 등을 고려한 정확한 결제 계산을 제공합니다.

## 주요 기능

### 1. 기본 결제 계산
- 기본 시공비 기반 계산
- 긴급 수수료 적용
- 플랫폼 수수료 계산
- 할인 및 세금 적용
- 작업자 지급액 계산

### 2. 동적 긴급 수수료
- 시간 경과에 따른 자동 수수료 증가
- 최대 수수료 한도 설정
- 커스터마이징 가능한 증가 규칙

### 3. 등급별 수수료 시스템
- 작업자 등급에 따른 수수료 차등 적용
- 브론즈 ~ 다이아몬드 등급 지원
- 등급별 혜택 자동 계산

### 4. 결제 검증
- 입력값 유효성 검사
- 경고 및 오류 메시지 제공
- 비즈니스 규칙 검증

### 5. 포맷팅 및 내보내기
- 한국어 통화 포맷팅
- 다국어 지원 가능
- 구조화된 데이터 출력

## 파일 구조

```
frontend/src/utils/
├── paymentCalculator.js          # JavaScript 버전
├── paymentCalculator.ts          # TypeScript 버전
├── paymentCalculator.test.js     # 테스트 및 예제
└── PAYMENT_CALCULATOR_GUIDE.md   # 이 가이드 파일

frontend/src/components/
├── PaymentCalculator.js          # React 컴포넌트
└── PaymentCalculatorExample.js   # 사용 예제 컴포넌트
```

## API 참조

### 기본 함수

#### `calculatePayment(workOrder)`

기본 결제 계산을 수행합니다.

**매개변수:**
- `workOrder` (Object): 작업 주문 정보
  - `baseFee` (number): 기본 시공비
  - `urgentFeePercent` (number): 긴급 수수료 비율 (%)
  - `platformFeePercent` (number): 플랫폼 수수료 비율 (%)
  - `discountPercent` (number, optional): 할인 비율 (%)
  - `taxPercent` (number, optional): 세금 비율 (%)
  - `currentUrgentFeePercent` (number, optional): 현재 긴급 수수료 비율

**반환값:**
```javascript
{
  baseFee: 150000,
  discountedBaseFee: 142500,
  discountAmount: 7500,
  discountPercent: 5,
  urgentFee: 22500,
  urgentFeePercent: 15,
  totalFee: 165000,
  customerTotalPayment: 181500,
  platformFee: 16500,
  platformFeePercent: 10,
  taxAmount: 16500,
  taxPercent: 10,
  workerPayment: 148500,
  breakdown: { ... }
}
```

#### `calculateDynamicUrgentFee(workOrder, hoursSinceCreation, options)`

시간 경과에 따른 동적 긴급 수수료를 계산합니다.

**매개변수:**
- `workOrder` (Object): 작업 주문 정보
- `hoursSinceCreation` (number): 생성 후 경과 시간 (시간)
- `maxUrgentFeePercent` (number, optional): 최대 긴급 수수료 비율 (기본값: 50)
- `increaseInterval` (number, optional): 증가 간격 (시간, 기본값: 1)
- `increaseAmount` (number, optional): 증가량 (%, 기본값: 5)

**반환값:**
```javascript
25 // 25% 긴급 수수료
```

#### `calculateGradeBasedFees(workOrder, workerGrade)`

작업자 등급에 따른 수수료를 계산합니다.

**매개변수:**
- `workOrder` (Object): 작업 주문 정보
- `workerGrade` (Object): 작업자 등급 정보
  - `level` (number): 등급 레벨 (1-5)
  - `name` (string): 등급명

**반환값:**
```javascript
{
  // 기본 결제 정보 + 등급 정보
  gradeInfo: {
    level: 3,
    name: '골드',
    multiplier: 0.8
  }
}
```

#### `formatPaymentInfo(paymentInfo, locale)`

결제 정보를 통화 포맷으로 변환합니다.

**매개변수:**
- `paymentInfo` (Object): 결제 정보
- `locale` (string, optional): 로케일 (기본값: 'ko-KR')

**반환값:**
```javascript
{
  // 원본 결제 정보 + 포맷된 정보
  formatted: {
    baseFee: '₩150,000',
    urgentFee: '₩22,500',
    totalFee: '₩165,000',
    platformFee: '₩16,500',
    workerPayment: '₩148,500',
    customerTotalPayment: '₩181,500'
  }
}
```

#### `validateWorkOrderPayment(workOrder)`

작업 주문 결제 정보의 유효성을 검사합니다.

**매개변수:**
- `workOrder` (Object): 작업 주문 정보

**반환값:**
```javascript
{
  isValid: true,
  errors: [],
  warnings: ['긴급 수수료가 30%를 초과합니다.']
}
```

### 고급 함수

#### `createPaymentRecord(workOrder, workerId, customerId)`

결제 내역 레코드를 생성합니다.

#### `calculatePlatformRevenue(workOrders, period)`

플랫폼 수익을 계산합니다.

#### `calculateAdvancedPayment(workOrder, workerGrade, options)`

고급 결제 계산 옵션을 사용합니다.

## 사용 예제

### 1. 기본 사용법

```javascript
import { calculatePayment } from './utils/paymentCalculator';

const workOrder = {
  baseFee: 200000,
  urgentFeePercent: 15,
  platformFeePercent: 10,
  discountPercent: 5,
  taxPercent: 10
};

const payment = calculatePayment(workOrder);
console.log(`총 시공비: ${payment.totalFee.toLocaleString()}원`);
console.log(`작업자 지급액: ${payment.workerPayment.toLocaleString()}원`);
```

### 2. 동적 긴급 수수료 적용

```javascript
import { calculateDynamicUrgentFee, calculatePayment } from './utils/paymentCalculator';

const workOrder = {
  baseFee: 150000,
  urgentFeePercent: 10,
  platformFeePercent: 15,
  createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6시간 전
};

const hoursSinceCreation = 6;
const dynamicUrgentFee = calculateDynamicUrgentFee(workOrder, hoursSinceCreation);

const payment = calculatePayment({
  ...workOrder,
  currentUrgentFeePercent: dynamicUrgentFee
});
```

### 3. 등급별 수수료 적용

```javascript
import { calculateGradeBasedFees } from './utils/paymentCalculator';

const workOrder = {
  baseFee: 300000,
  urgentFeePercent: 0,
  platformFeePercent: 20
};

const workerGrade = {
  level: 4,
  name: '플래티넘'
};

const payment = calculateGradeBasedFees(workOrder, workerGrade);
console.log(`수수료 할인율: ${(1 - payment.gradeInfo.multiplier) * 100}%`);
```

### 4. React 컴포넌트에서 사용

```jsx
import React, { useState } from 'react';
import PaymentCalculator from './components/PaymentCalculator';

function WorkOrderPage() {
  const [workOrder, setWorkOrder] = useState({
    baseFee: 250000,
    urgentFeePercent: 20,
    platformFeePercent: 12
  });

  const [workerGrade, setWorkerGrade] = useState({
    level: 3,
    name: '골드'
  });

  const handlePaymentChange = (payment) => {
    console.log('결제 정보 업데이트:', payment);
  };

  return (
    <div>
      <h1>작업 주문 결제</h1>
      <PaymentCalculator
        workOrder={workOrder}
        workerGrade={workerGrade}
        onPaymentChange={handlePaymentChange}
      />
    </div>
  );
}
```

## 등급 시스템

### 등급별 수수료 배율

| 등급 | 레벨 | 수수료 배율 | 할인율 | 설명 |
|------|------|-------------|--------|------|
| 브론즈 | 1 | 1.0 | 0% | 기본 서비스 제공 |
| 실버 | 2 | 0.9 | 10% | 우선 매칭, 기본 혜택 |
| 골드 | 3 | 0.8 | 20% | 프리미엄 매칭, 추가 혜택 |
| 플래티넘 | 4 | 0.7 | 30% | VIP 매칭, 특별 혜택 |
| 다이아몬드 | 5 | 0.6 | 40% | 최고 등급, 모든 혜택 |

### 등급별 혜택 예시

```javascript
const goldWorker = { level: 3, name: '골드' };
const payment = calculateGradeBasedFees(workOrder, goldWorker);

// 골드 등급은 20% 수수료 할인
// 플랫폼 수수료: 20,000원 → 16,000원
// 작업자 지급액: 180,000원 → 184,000원
```

## 동적 긴급 수수료 규칙

### 기본 규칙
- **기본 긴급 수수료**: 작업 주문 생성 시 설정된 비율
- **증가 간격**: 1시간마다
- **증가량**: 5%씩 증가
- **최대 한도**: 50%

### 계산 예시

```javascript
// 기본 긴급 수수료: 10%
// 시간 경과에 따른 변화:
// 0시간: 10%
// 1시간: 15%
// 2시간: 20%
// 3시간: 25%
// ...
// 8시간: 50% (최대)
// 9시간: 50% (최대 유지)
```

### 커스터마이징

```javascript
const dynamicFee = calculateDynamicUrgentFee(
  workOrder,
  hoursSinceCreation,
  60,    // 최대 60%
  2,     // 2시간마다 증가
  10     // 10%씩 증가
);
```

## 검증 규칙

### 필수 검증
- 기본 시공비 > 0
- 긴급 수수료 비율: 0-100%
- 플랫폼 수수료 비율: 0-50%

### 경고 조건
- 긴급 수수료 > 30%
- 플랫폼 수수료 > 20%

### 검증 예시

```javascript
const validation = validateWorkOrderPayment(workOrder);

if (!validation.isValid) {
  console.error('오류:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('경고:', validation.warnings);
}
```

## 테스트 및 디버깅

### 테스트 실행

```javascript
// 브라우저 콘솔에서
import './utils/paymentCalculator.test.js';

// 모든 테스트 실행
runPaymentCalculatorTests();

// 사용 예제 보기
showPaymentCalculatorExamples();
```

### 개별 테스트

```javascript
import {
  testBasicPaymentCalculation,
  testDynamicUrgentFee,
  testGradeBasedFees
} from './utils/paymentCalculator.test.js';

testBasicPaymentCalculation();
testDynamicUrgentFee();
testGradeBasedFees();
```

## 성능 최적화

### 계산 최적화
- 불필요한 재계산 방지
- 메모이제이션 활용
- 배치 처리 지원

### 메모리 관리
- 대용량 데이터 처리 시 청크 단위 처리
- 가비지 컬렉션 최적화

## 확장 가능성

### 새로운 수수료 타입 추가
```javascript
// 새로운 수수료 타입 정의
const customFee = {
  type: 'premium',
  percent: 5,
  description: '프리미엄 서비스 수수료'
};

// 계산 함수 확장
function calculateCustomPayment(workOrder, customFees) {
  // 커스텀 수수료 계산 로직
}
```

### 다국어 지원
```javascript
// 다국어 포맷팅
const formatted = formatPaymentInfo(payment, 'en-US');
// 결과: $150.00, $22.50, etc.

const formattedJP = formatPaymentInfo(payment, 'ja-JP');
// 결과: ¥15,000, ¥2,250, etc.
```

### 외부 API 연동
```javascript
// 환율 API 연동
async function calculateInternationalPayment(workOrder, currency) {
  const exchangeRate = await getExchangeRate('KRW', currency);
  const payment = calculatePayment(workOrder);
  
  return {
    ...payment,
    internationalAmount: payment.totalFee * exchangeRate,
    currency
  };
}
```

## 문제 해결

### 일반적인 문제

#### 1. 계산 결과가 예상과 다른 경우
- 입력값 검증 확인
- 단위 변환 확인 (원 ↔ 퍼센트)
- 소수점 반올림 확인

#### 2. 동적 긴급 수수료가 증가하지 않는 경우
- `createdAt` 필드 확인
- 시간대 설정 확인
- 경과 시간 계산 로직 확인

#### 3. 등급별 수수료가 적용되지 않는 경우
- 작업자 등급 정보 확인
- 등급 레벨 범위 확인 (1-5)
- 수수료 배율 계산 확인

### 디버깅 팁

```javascript
// 디버깅을 위한 상세 로깅
function debugPaymentCalculation(workOrder) {
  console.log('입력값:', workOrder);
  
  const payment = calculatePayment(workOrder);
  console.log('계산 결과:', payment);
  
  const validation = validateWorkOrderPayment(workOrder);
  console.log('검증 결과:', validation);
  
  return payment;
}
```

## 라이선스 및 기여

이 결제 계산기 시스템은 MIT 라이선스 하에 배포됩니다.

### 기여 방법
1. 이슈 리포트
2. 기능 요청
3. 버그 수정
4. 문서 개선
5. 테스트 추가

### 연락처
- 개발팀: dev@curtain-install.com
- 기술 지원: support@curtain-install.com

---

**버전**: 1.0.0  
**최종 업데이트**: 2024년 12월  
**작성자**: 커튼 설치 플랫폼 개발팀 