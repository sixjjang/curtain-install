/**
 * 결제 계산기 테스트 파일
 * 실제 테스트 프레임워크 없이도 실행 가능한 예제들
 */

import {
  calculatePayment,
  calculateDynamicUrgentFee,
  calculateGradeBasedFees,
  formatPaymentInfo,
  validateWorkOrderPayment,
  createPaymentRecord,
  calculatePlatformRevenue
} from './paymentCalculator';

// 테스트용 샘플 데이터
const sampleWorkOrder = {
  id: 'test-work-order-001',
  baseFee: 200000,
  urgentFeePercent: 20,
  platformFeePercent: 15,
  discountPercent: 5,
  taxPercent: 10,
  createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3시간 전
  status: '등록'
};

const sampleWorkerGrade = {
  level: 4,
  name: '플래티넘',
  description: 'VIP 매칭, 특별 혜택'
};

// 테스트 함수들
function runTests() {
  console.log('🧪 결제 계산기 테스트 시작\n');

  // 1. 기본 결제 계산 테스트
  testBasicPaymentCalculation();
  
  // 2. 동적 긴급 수수료 테스트
  testDynamicUrgentFee();
  
  // 3. 등급별 수수료 테스트
  testGradeBasedFees();
  
  // 4. 포맷팅 테스트
  testFormatting();
  
  // 5. 검증 테스트
  testValidation();
  
  // 6. 결제 내역 생성 테스트
  testPaymentRecord();
  
  // 7. 플랫폼 수익 계산 테스트
  testPlatformRevenue();

  console.log('\n✅ 모든 테스트 완료!');
}

function testBasicPaymentCalculation() {
  console.log('📊 1. 기본 결제 계산 테스트');
  
  const workOrder = {
    baseFee: 150000,
    urgentFeePercent: 15,
    platformFeePercent: 10,
    discountPercent: 0,
    taxPercent: 10
  };

  const payment = calculatePayment(workOrder);
  
  console.log('입력:', workOrder);
  console.log('결과:', {
    기본시공비: payment.baseFee.toLocaleString() + '원',
    긴급수수료: payment.urgentFee.toLocaleString() + '원',
    총시공비: payment.totalFee.toLocaleString() + '원',
    플랫폼수수료: payment.platformFee.toLocaleString() + '원',
    작업자지급액: payment.workerPayment.toLocaleString() + '원',
    고객총결제액: payment.customerTotalPayment.toLocaleString() + '원'
  });
  
  // 검증
  const expectedUrgentFee = 150000 * 0.15;
  const expectedTotalFee = 150000 + expectedUrgentFee;
  const expectedPlatformFee = expectedTotalFee * 0.10;
  const expectedWorkerPayment = expectedTotalFee - expectedPlatformFee;
  const expectedCustomerPayment = expectedTotalFee * 1.10;

  console.log('검증:', {
    긴급수수료_정확: Math.abs(payment.urgentFee - expectedUrgentFee) < 1,
    총시공비_정확: Math.abs(payment.totalFee - expectedTotalFee) < 1,
    플랫폼수수료_정확: Math.abs(payment.platformFee - expectedPlatformFee) < 1,
    작업자지급액_정확: Math.abs(payment.workerPayment - expectedWorkerPayment) < 1,
    고객총결제액_정확: Math.abs(payment.customerTotalPayment - expectedCustomerPayment) < 1
  });
  
  console.log('');
}

function testDynamicUrgentFee() {
  console.log('⏰ 2. 동적 긴급 수수료 테스트');
  
  const workOrder = {
    baseFee: 100000,
    urgentFeePercent: 10
  };

  const testCases = [
    { hours: 0, expected: 10 },
    { hours: 1, expected: 15 },
    { hours: 2, expected: 20 },
    { hours: 5, expected: 35 },
    { hours: 10, expected: 50 }, // 최대값
    { hours: 15, expected: 50 }  // 최대값 유지
  ];

  testCases.forEach(({ hours, expected }) => {
    const result = calculateDynamicUrgentFee(workOrder, hours);
    const isCorrect = result === expected;
    console.log(`${hours}시간 후: ${result}% (예상: ${expected}%) ${isCorrect ? '✅' : '❌'}`);
  });
  
  console.log('');
}

function testGradeBasedFees() {
  console.log('🏆 3. 등급별 수수료 테스트');
  
  const workOrder = {
    baseFee: 200000,
    urgentFeePercent: 0,
    platformFeePercent: 20
  };

  const grades = [
    { level: 1, name: '브론즈', expectedMultiplier: 1.0 },
    { level: 2, name: '실버', expectedMultiplier: 0.9 },
    { level: 3, name: '골드', expectedMultiplier: 0.8 },
    { level: 4, name: '플래티넘', expectedMultiplier: 0.7 },
    { level: 5, name: '다이아몬드', expectedMultiplier: 0.6 }
  ];

  grades.forEach(({ level, name, expectedMultiplier }) => {
    const workerGrade = { level, name };
    const payment = calculateGradeBasedFees(workOrder, workerGrade);
    const actualMultiplier = payment.gradeInfo?.multiplier || 1.0;
    const isCorrect = Math.abs(actualMultiplier - expectedMultiplier) < 0.01;
    
    console.log(`${name} (${level}등급):`);
    console.log(`  수수료 배율: ${actualMultiplier} (예상: ${expectedMultiplier}) ${isCorrect ? '✅' : '❌'}`);
    console.log(`  플랫폼 수수료: ${payment.platformFee.toLocaleString()}원`);
    console.log(`  작업자 지급액: ${payment.workerPayment.toLocaleString()}원`);
  });
  
  console.log('');
}

function testFormatting() {
  console.log('💱 4. 포맷팅 테스트');
  
  const payment = calculatePayment(sampleWorkOrder);
  const formatted = formatPaymentInfo(payment);
  
  console.log('포맷된 결과:');
  Object.entries(formatted.formatted).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('');
}

function testValidation() {
  console.log('✅ 5. 검증 테스트');
  
  const testCases = [
    {
      name: '정상 케이스',
      workOrder: { baseFee: 100000, urgentFeePercent: 10, platformFeePercent: 10 },
      shouldBeValid: true
    },
    {
      name: '기본 시공비 0',
      workOrder: { baseFee: 0, urgentFeePercent: 10, platformFeePercent: 10 },
      shouldBeValid: false
    },
    {
      name: '긴급 수수료 100% 초과',
      workOrder: { baseFee: 100000, urgentFeePercent: 150, platformFeePercent: 10 },
      shouldBeValid: false
    },
    {
      name: '플랫폼 수수료 50% 초과',
      workOrder: { baseFee: 100000, urgentFeePercent: 10, platformFeePercent: 60 },
      shouldBeValid: false
    },
    {
      name: '높은 긴급 수수료 (경고)',
      workOrder: { baseFee: 100000, urgentFeePercent: 40, platformFeePercent: 10 },
      shouldBeValid: true
    }
  ];

  testCases.forEach(({ name, workOrder, shouldBeValid }) => {
    const validation = validateWorkOrderPayment(workOrder);
    const isValid = validation.isValid === shouldBeValid;
    
    console.log(`${name}:`);
    console.log(`  유효성: ${validation.isValid} (예상: ${shouldBeValid}) ${isValid ? '✅' : '❌'}`);
    if (validation.errors.length > 0) {
      console.log(`  오류: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.log(`  경고: ${validation.warnings.join(', ')}`);
    }
  });
  
  console.log('');
}

function testPaymentRecord() {
  console.log('📝 6. 결제 내역 생성 테스트');
  
  const paymentRecord = createPaymentRecord(
    sampleWorkOrder,
    'worker-123',
    'customer-456'
  );
  
  console.log('생성된 결제 내역:');
  console.log(`  작업 주문 ID: ${paymentRecord.workOrderId}`);
  console.log(`  작업자 ID: ${paymentRecord.workerId}`);
  console.log(`  고객 ID: ${paymentRecord.customerId}`);
  console.log(`  상태: ${paymentRecord.status}`);
  console.log(`  계산 시간: ${paymentRecord.calculatedAt.toLocaleString()}`);
  console.log(`  총 시공비: ${paymentRecord.paymentInfo.totalFee.toLocaleString()}원`);
  
  console.log('');
}

function testPlatformRevenue() {
  console.log('💰 7. 플랫폼 수익 계산 테스트');
  
  const workOrders = [
    { ...sampleWorkOrder, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }, // 1일 전
    { ...sampleWorkOrder, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }, // 2일 전
    { ...sampleWorkOrder, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7일 전
    { ...sampleWorkOrder, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30일 전
  ];

  const dailyRevenue = calculatePlatformRevenue(workOrders, 'daily');
  const weeklyRevenue = calculatePlatformRevenue(workOrders, 'weekly');
  const monthlyRevenue = calculatePlatformRevenue(workOrders, 'monthly');

  console.log('일일 수익:', {
    총수익: dailyRevenue.totalRevenue.toLocaleString() + '원',
    총주문: dailyRevenue.totalOrders + '건',
    평균수익: dailyRevenue.averageRevenue.toLocaleString() + '원'
  });

  console.log('주간 수익:', {
    총수익: weeklyRevenue.totalRevenue.toLocaleString() + '원',
    총주문: weeklyRevenue.totalOrders + '건',
    평균수익: weeklyRevenue.averageRevenue.toLocaleString() + '원'
  });

  console.log('월간 수익:', {
    총수익: monthlyRevenue.totalRevenue.toLocaleString() + '원',
    총주문: monthlyRevenue.totalOrders + '건',
    평균수익: monthlyRevenue.averageRevenue.toLocaleString() + '원'
  });
  
  console.log('');
}

// 실제 사용 예제
function showUsageExamples() {
  console.log('📚 사용 예제\n');

  // 예제 1: 간단한 결제 계산
  console.log('예제 1: 간단한 결제 계산');
  const simpleWorkOrder = {
    baseFee: 100000,
    urgentFeePercent: 10,
    platformFeePercent: 15
  };
  
  const simplePayment = calculatePayment(simpleWorkOrder);
  console.log(`기본 시공비: ${simplePayment.baseFee.toLocaleString()}원`);
  console.log(`긴급 수수료: ${simplePayment.urgentFee.toLocaleString()}원`);
  console.log(`총 시공비: ${simplePayment.totalFee.toLocaleString()}원`);
  console.log(`플랫폼 수수료: ${simplePayment.platformFee.toLocaleString()}원`);
  console.log(`작업자 지급액: ${simplePayment.workerPayment.toLocaleString()}원\n`);

  // 예제 2: 등급별 수수료 적용
  console.log('예제 2: 등급별 수수료 적용');
  const goldWorker = { level: 3, name: '골드' };
  const gradePayment = calculateGradeBasedFees(simpleWorkOrder, goldWorker);
  console.log(`골드 등급 적용 후 작업자 지급액: ${gradePayment.workerPayment.toLocaleString()}원`);
  console.log(`수수료 할인율: ${(1 - gradePayment.gradeInfo.multiplier) * 100}%\n`);

  // 예제 3: 동적 긴급 수수료
  console.log('예제 3: 동적 긴급 수수료');
  const urgentWorkOrder = {
    baseFee: 200000,
    urgentFeePercent: 5,
    platformFeePercent: 10,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6시간 전
  };
  
  const hoursSinceCreation = 6;
  const dynamicUrgentFee = calculateDynamicUrgentFee(urgentWorkOrder, hoursSinceCreation);
  console.log(`6시간 후 긴급 수수료: ${dynamicUrgentFee}% (기본: ${urgentWorkOrder.urgentFeePercent}%)`);
  
  const urgentPayment = calculatePayment({
    ...urgentWorkOrder,
    currentUrgentFeePercent: dynamicUrgentFee
  });
  console.log(`동적 수수료 적용 후 총 시공비: ${urgentPayment.totalFee.toLocaleString()}원\n`);

  // 예제 4: 포맷팅
  console.log('예제 4: 포맷팅');
  const formattedPayment = formatPaymentInfo(simplePayment);
  console.log(`포맷된 총 시공비: ${formattedPayment.formatted.totalFee}`);
  console.log(`포맷된 작업자 지급액: ${formattedPayment.formatted.workerPayment}\n`);
}

// 실행
if (typeof window !== 'undefined') {
  // 브라우저 환경에서 실행
  window.runPaymentCalculatorTests = runTests;
  window.showPaymentCalculatorExamples = showUsageExamples;
  
  console.log('🎯 결제 계산기 테스트 준비 완료!');
  console.log('다음 명령어로 테스트를 실행하세요:');
  console.log('- runPaymentCalculatorTests() : 모든 테스트 실행');
  console.log('- showPaymentCalculatorExamples() : 사용 예제 보기');
} else {
  // Node.js 환경에서 실행
  runTests();
  showUsageExamples();
}

export {
  runTests,
  showUsageExamples,
  testBasicPaymentCalculation,
  testDynamicUrgentFee,
  testGradeBasedFees,
  testFormatting,
  testValidation,
  testPaymentRecord,
  testPlatformRevenue
}; 