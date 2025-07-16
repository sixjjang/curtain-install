# 계약자 등급별 긴급 수수료 계산기 가이드

## 개요

계약자 등급별 긴급 수수료 계산기는 5단계 등급 시스템을 기반으로 긴급 수수료에 대한 할인을 계산하는 종합적인 유틸리티입니다. 이 시스템은 계약자의 등급에 따라 차등화된 혜택을 제공하여 고품질 계약자에게 인센티브를 제공합니다.

## 등급 시스템

### 5단계 등급 구조

| 등급 | 이름 | 할인율 | 색상 | 설명 |
|------|------|--------|------|------|
| 1 | 브론즈 | 0% | 회색 | 기본 서비스 |
| 2 | 실버 | 5% | 파란색 | 우선 매칭 |
| 3 | 골드 | 10% | 초록색 | 프리미엄 매칭 |
| 4 | 플래티넘 | 15% | 보라색 | VIP 매칭 |
| 5 | 다이아몬드 | 20% | 노란색 | 최고 등급 |

### 긴급도별 기본 수수료율

| 긴급도 | 기본 수수료율 | 설명 |
|--------|---------------|------|
| 낮음 (low) | 5% | 일반적인 요청 |
| 보통 (medium) | 10% | 보통 긴급도 |
| 높음 (high) | 15% | 높은 긴급도 |
| 긴급 (urgent) | 25% | 긴급 요청 |
| 비상 (emergency) | 35% | 비상 상황 |

## 주요 기능

### 1. 기본 수수료 계산
```javascript
import { calculateUrgentFeePercent } from '../utils/gradeFeeCalculator';

// 기본 사용법
const finalPercent = calculateUrgentFeePercent(3, 15); // 골드 등급, 15% 기본 수수료
console.log(finalPercent); // 5% (15% - 10% 할인)
```

### 2. 긴급도별 계산
```javascript
import { calculateUrgentFeeByLevel } from '../utils/gradeFeeCalculator';

// 긴급도와 등급으로 계산
const finalPercent = calculateUrgentFeeByLevel('high', 4); // 높은 긴급도, 플래티넘 등급
console.log(finalPercent); // 0% (15% - 15% 할인)
```

### 3. 등급 정보 조회
```javascript
import { getGradeInfo, getAllGradeInfo } from '../utils/gradeFeeCalculator';

// 특정 등급 정보
const gradeInfo = getGradeInfo(3);
console.log(gradeInfo); // { name: '골드', discount: 10, color: 'green' }

// 모든 등급 정보
const allGrades = getAllGradeInfo();
console.log(allGrades); // 전체 등급 정보 객체
```

### 4. 등급별 비교 예시 생성
```javascript
import { generateGradeFeeExamples } from '../utils/gradeFeeCalculator';

// 15% 기본 수수료에 대한 모든 등급 계산
const examples = generateGradeFeeExamples(15);
console.log(examples);
/*
[
  { level: 1, gradeName: '브론즈', discount: 0, finalPercent: 15, savings: 0 },
  { level: 2, gradeName: '실버', discount: 5, finalPercent: 10, savings: 5 },
  { level: 3, gradeName: '골드', discount: 10, finalPercent: 5, savings: 10 },
  { level: 4, gradeName: '플래티넘', discount: 15, finalPercent: 0, savings: 15 },
  { level: 5, gradeName: '다이아몬드', discount: 20, finalPercent: 0, savings: 15 }
]
*/
```

### 5. 등급 상승 혜택 계산
```javascript
import { calculateGradeUpgradeBenefit } from '../utils/gradeFeeCalculator';

// 골드에서 플래티넘으로 상승 시 혜택
const benefit = calculateGradeUpgradeBenefit(3, 4, 15);
console.log(benefit);
/*
{
  upgrade: true,
  currentLevel: 3,
  targetLevel: 4,
  currentGradeName: '골드',
  targetGradeName: '플래티넘',
  currentFee: 5,
  targetFee: 0,
  additionalDiscount: 5,
  additionalDiscountPercent: '33.3'
}
*/
```

### 6. 고급 계산기
```javascript
import { advancedGradeFeeCalculator } from '../utils/gradeFeeCalculator';

// 종합적인 계산
const result = advancedGradeFeeCalculator({
  contractorLevel: 3,
  basePercent: 15,
  totalAmount: 1000000,
  urgencyLevel: 'high',
  includeBreakdown: true
});

console.log(result);
/*
{
  contractorLevel: 3,
  gradeInfo: { name: '골드', discount: 10, color: 'green' },
  basePercent: 15,
  finalPercent: 5,
  discount: 10,
  urgencyLevel: 'high',
  breakdown: {
    baseFee: 150000,
    finalFee: 50000,
    discountAmount: 100000,
    savingsPercent: '66.7'
  },
  comparison: [...]
}
*/
```

## React 컴포넌트 사용법

### 기본 사용법
```jsx
import GradeFeeCalculator from './GradeFeeCalculator';

function App() {
  return (
    <div>
      <GradeFeeCalculator />
    </div>
  );
}
```

### 커스텀 설정
```jsx
import { advancedGradeFeeCalculator } from '../utils/gradeFeeCalculator';

function CustomCalculator() {
  const [contractorLevel, setContractorLevel] = useState(3);
  const [basePercent, setBasePercent] = useState(15);
  
  const result = advancedGradeFeeCalculator({
    contractorLevel,
    basePercent,
    totalAmount: 1000000,
    includeBreakdown: true
  });

  return (
    <div>
      <h2>커스텀 계산기</h2>
      <div>
        <label>계약자 등급:</label>
        <select value={contractorLevel} onChange={(e) => setContractorLevel(parseInt(e.target.value))}>
          <option value={1}>브론즈</option>
          <option value={2}>실버</option>
          <option value={3}>골드</option>
          <option value={4}>플래티넘</option>
          <option value={5}>다이아몬드</option>
        </select>
      </div>
      <div>
        <label>기본 수수료율 (%):</label>
        <input 
          type="number" 
          value={basePercent} 
          onChange={(e) => setBasePercent(parseFloat(e.target.value))}
        />
      </div>
      <div>
        <h3>계산 결과</h3>
        <p>최종 수수료율: {result.finalPercent}%</p>
        <p>할인 금액: {result.breakdown.discountAmount.toLocaleString()}원</p>
      </div>
    </div>
  );
}
```

## 계산 로직

### 1. 기본 계산 공식
```
최종 수수료율 = Math.max(기본 수수료율 - 등급별 할인율, 0)
```

### 2. 할인 금액 계산
```
할인 금액 = (총 금액 × 기본 수수료율) - (총 금액 × 최종 수수료율)
```

### 3. 절약율 계산
```
절약율 = ((기본 수수료율 - 최종 수수료율) / 기본 수수료율) × 100
```

## 유효성 검사

### 1. 등급 유효성
- 등급은 1-5 범위 내에서만 유효
- 범위를 벗어나는 경우 기본값(1등급) 사용
- 경고 메시지 출력

### 2. 수수료율 유효성
- 수수료율은 0-100% 범위 내에서만 유효
- 범위를 벗어나는 경우 기본값(0%) 사용
- 경고 메시지 출력

### 3. 금액 유효성
- 총 금액은 0 이상이어야 함
- 음수인 경우 0으로 처리

## 성능 최적화

### 1. 메모이제이션
```javascript
import { useMemo } from 'react';

function OptimizedCalculator({ contractorLevel, basePercent, totalAmount }) {
  const result = useMemo(() => {
    return advancedGradeFeeCalculator({
      contractorLevel,
      basePercent,
      totalAmount,
      includeBreakdown: true
    });
  }, [contractorLevel, basePercent, totalAmount]);

  return <div>{/* 결과 표시 */}</div>;
}
```

### 2. 지연 계산
```javascript
function LazyCalculator() {
  const [shouldCalculate, setShouldCalculate] = useState(false);
  
  const result = shouldCalculate ? advancedGradeFeeCalculator(options) : null;
  
  return (
    <div>
      <button onClick={() => setShouldCalculate(true)}>
        계산 시작
      </button>
      {result && <div>{/* 결과 표시 */}</div>}
    </div>
  );
}
```

## 에러 처리

### 1. 기본 에러 처리
```javascript
try {
  const result = calculateUrgentFeePercent(contractorLevel, basePercent);
  return result;
} catch (error) {
  console.error('수수료 계산 오류:', error);
  return 0; // 기본값 반환
}
```

### 2. 사용자 정의 에러
```javascript
class GradeFeeError extends Error {
  constructor(message, level, basePercent) {
    super(message);
    this.name = 'GradeFeeError';
    this.level = level;
    this.basePercent = basePercent;
  }
}

function safeCalculate(level, basePercent) {
  if (level < 1 || level > 5) {
    throw new GradeFeeError('Invalid contractor level', level, basePercent);
  }
  return calculateUrgentFeePercent(level, basePercent);
}
```

## 테스트

### 1. 단위 테스트
```javascript
import { calculateUrgentFeePercent } from '../utils/gradeFeeCalculator';

describe('Grade Fee Calculator', () => {
  test('골드 등급 15% 수수료 계산', () => {
    const result = calculateUrgentFeePercent(3, 15);
    expect(result).toBe(5);
  });

  test('다이아몬드 등급 10% 수수료 계산', () => {
    const result = calculateUrgentFeePercent(5, 10);
    expect(result).toBe(0); // 10% - 20% = 0% (최소 0% 보장)
  });

  test('잘못된 등급 처리', () => {
    const result = calculateUrgentFeePercent(0, 15);
    expect(result).toBe(15); // 기본값 사용
  });
});
```

### 2. 통합 테스트
```javascript
import { advancedGradeFeeCalculator } from '../utils/gradeFeeCalculator';

describe('Advanced Calculator', () => {
  test('완전한 계산 결과', () => {
    const result = advancedGradeFeeCalculator({
      contractorLevel: 3,
      basePercent: 15,
      totalAmount: 1000000,
      includeBreakdown: true
    });

    expect(result.finalPercent).toBe(5);
    expect(result.breakdown.discountAmount).toBe(100000);
    expect(result.comparison).toHaveLength(5);
  });
});
```

## 배포 고려사항

### 1. 번들 크기 최적화
```javascript
// 필요한 함수만 import
import { calculateUrgentFeePercent } from '../utils/gradeFeeCalculator';

// 전체 import는 개발 시에만
import * as GradeFeeUtils from '../utils/gradeFeeCalculator';
```

### 2. 환경별 설정
```javascript
const GRADE_DISCOUNT_RATES = process.env.NODE_ENV === 'production' 
  ? PRODUCTION_GRADES 
  : DEVELOPMENT_GRADES;
```

### 3. 캐싱 전략
```javascript
const calculationCache = new Map();

function cachedCalculate(level, basePercent) {
  const key = `${level}-${basePercent}`;
  if (calculationCache.has(key)) {
    return calculationCache.get(key);
  }
  
  const result = calculateUrgentFeePercent(level, basePercent);
  calculationCache.set(key, result);
  return result;
}
```

## 향후 개선 계획

### 1. 기능 확장
- 동적 할인율 설정
- 계절별 할인율
- 지역별 할인율
- 프로모션 코드 지원

### 2. 성능 개선
- Web Worker를 통한 백그라운드 계산
- 서버 사이드 계산 지원
- 실시간 업데이트

### 3. 사용자 경험
- 애니메이션 효과
- 드래그 앤 드롭 인터페이스
- 모바일 최적화
- 접근성 개선

## 결론

계약자 등급별 긴급 수수료 계산기는 체계적이고 확장 가능한 구조로 설계되어 있어, 다양한 비즈니스 요구사항에 맞게 커스터마이징할 수 있습니다. 지속적인 개선과 사용자 피드백을 통해 더욱 정교한 계산 시스템으로 발전시켜 나갈 예정입니다. 