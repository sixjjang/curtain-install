const { 
  sendPaymentNotification,
  sendPaymentNotificationToUser,
  sendPaymentNotificationToUsers,
  sendPaymentCompleteNotification,
  notifyPaymentStatusChange,
  sendSettlementNotification,
  getUserFcmToken,
  PAYMENT_NOTIFICATION_TYPES
} = require('./paymentNotificationService');

// 테스트용 FCM 토큰 (실제 테스트 시 유효한 토큰으로 교체)
const TEST_FCM_TOKEN = 'test_fcm_token_here';

// 테스트용 사용자 ID (실제 테스트 시 유효한 사용자 ID로 교체)
const TEST_USER_ID = 'test_user_id_here';
const TEST_SELLER_ID = 'test_seller_id_here';
const TEST_WORKER_ID = 'test_worker_id_here';

// 테스트용 결제 정보
const samplePaymentInfo = {
  workOrderId: 'WO_20241201_001',
  paymentId: 'PAY_20241201_001',
  amount: 150000,
  currency: 'KRW',
  sellerId: TEST_SELLER_ID,
  workerId: TEST_WORKER_ID,
  paymentMethod: 'card',
  urgentFee: 15000,
  platformFee: 7500,
  workerPayment: 127500
};

// 테스트용 정산 정보
const sampleSettlementInfo = {
  settlementId: 'SETTLE_20241201_001',
  period: '2024-12',
  totalAmount: 1500000,
  workerCount: 5,
  workOrderCount: 10,
  userIds: [TEST_USER_ID, TEST_SELLER_ID]
};

// 1. 기본 결제 완료 알림 테스트
async function testBasicPaymentNotification() {
  console.log('=== 기본 결제 완료 알림 테스트 ===');
  
  try {
    const result = await sendPaymentCompleteNotification(TEST_FCM_TOKEN, samplePaymentInfo);
    console.log('결제 완료 알림 발송 성공:', result);
  } catch (error) {
    console.error('결제 완료 알림 발송 실패:', error);
  }
}

// 2. 다양한 결제 상태 알림 테스트
async function testPaymentStatusNotifications() {
  console.log('=== 다양한 결제 상태 알림 테스트 ===');
  
  const statuses = [
    PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE,
    PAYMENT_NOTIFICATION_TYPES.PAYMENT_FAILED,
    PAYMENT_NOTIFICATION_TYPES.PAYMENT_PENDING,
    PAYMENT_NOTIFICATION_TYPES.PAYMENT_REFUNDED,
    PAYMENT_NOTIFICATION_TYPES.PAYMENT_CANCELLED
  ];

  for (const status of statuses) {
    try {
      console.log(`테스트 중: ${status}`);
      const result = await sendPaymentNotification(TEST_FCM_TOKEN, samplePaymentInfo, status);
      console.log(`${status} 알림 발송 성공:`, result);
    } catch (error) {
      console.error(`${status} 알림 발송 실패:`, error);
    }
  }
}

// 3. 사용자 ID로 알림 발송 테스트
async function testUserNotification() {
  console.log('=== 사용자 ID로 알림 발송 테스트 ===');
  
  try {
    const result = await sendPaymentNotificationToUser(
      TEST_USER_ID,
      samplePaymentInfo,
      PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE
    );
    console.log('사용자 알림 발송 성공:', result);
  } catch (error) {
    console.error('사용자 알림 발송 실패:', error);
  }
}

// 4. 여러 사용자에게 알림 발송 테스트
async function testMultipleUserNotification() {
  console.log('=== 여러 사용자에게 알림 발송 테스트 ===');
  
  const userIds = [TEST_USER_ID, TEST_SELLER_ID, TEST_WORKER_ID];
  
  try {
    const results = await sendPaymentNotificationToUsers(
      userIds,
      samplePaymentInfo,
      PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE
    );
    console.log('다중 사용자 알림 발송 결과:', results);
  } catch (error) {
    console.error('다중 사용자 알림 발송 실패:', error);
  }
}

// 5. 결제 상태 변경 알림 테스트
async function testPaymentStatusChangeNotification() {
  console.log('=== 결제 상태 변경 알림 테스트 ===');
  
  try {
    await notifyPaymentStatusChange(
      samplePaymentInfo.workOrderId,
      'paid',
      samplePaymentInfo
    );
    console.log('결제 상태 변경 알림 발송 성공');
  } catch (error) {
    console.error('결제 상태 변경 알림 발송 실패:', error);
  }
}

// 6. 정산 완료 알림 테스트
async function testSettlementNotification() {
  console.log('=== 정산 완료 알림 테스트 ===');
  
  try {
    const result = await sendSettlementNotification(TEST_USER_ID, sampleSettlementInfo);
    console.log('정산 완료 알림 발송 성공:', result);
  } catch (error) {
    console.error('정산 완료 알림 발송 실패:', error);
  }
}

// 7. FCM 토큰 조회 테스트
async function testGetUserFcmToken() {
  console.log('=== FCM 토큰 조회 테스트 ===');
  
  try {
    const token = await getUserFcmToken(TEST_USER_ID);
    console.log('FCM 토큰 조회 결과:', token ? '토큰 존재' : '토큰 없음');
  } catch (error) {
    console.error('FCM 토큰 조회 실패:', error);
  }
}

// 8. 템플릿 변수 치환 테스트
function testTemplateVariableReplacement() {
  console.log('=== 템플릿 변수 치환 테스트 ===');
  
  const template = "작업 ID {workOrderId}의 결제가 완료되었습니다. 금액: {amount}원";
  const variables = {
    workOrderId: 'WO_20241201_001',
    amount: '150,000'
  };
  
  // 템플릿 변수 치환 함수 (paymentNotificationService.js에서 가져옴)
  const replaceTemplateVariables = (template, variables) => {
    let result = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, variables[key]);
    });
    return result;
  };
  
  const result = replaceTemplateVariables(template, variables);
  console.log('원본 템플릿:', template);
  console.log('치환 결과:', result);
}

// 9. 전체 테스트 실행
async function runAllTests() {
  console.log('🚀 결제 알림 시스템 테스트 시작\n');
  
  // 기본 테스트들
  await testBasicPaymentNotification();
  console.log('');
  
  await testPaymentStatusNotifications();
  console.log('');
  
  await testUserNotification();
  console.log('');
  
  await testMultipleUserNotification();
  console.log('');
  
  await testPaymentStatusChangeNotification();
  console.log('');
  
  await testSettlementNotification();
  console.log('');
  
  await testGetUserFcmToken();
  console.log('');
  
  // 동기 테스트
  testTemplateVariableReplacement();
  console.log('');
  
  console.log('✅ 모든 테스트 완료');
}

// 10. 특정 테스트만 실행
async function runSpecificTest(testName) {
  console.log(`🧪 ${testName} 테스트 실행\n`);
  
  switch (testName) {
    case 'basic':
      await testBasicPaymentNotification();
      break;
    case 'status':
      await testPaymentStatusNotifications();
      break;
    case 'user':
      await testUserNotification();
      break;
    case 'multiple':
      await testMultipleUserNotification();
      break;
    case 'statusChange':
      await testPaymentStatusChangeNotification();
      break;
    case 'settlement':
      await testSettlementNotification();
      break;
    case 'token':
      await testGetUserFcmToken();
      break;
    case 'template':
      testTemplateVariableReplacement();
      break;
    default:
      console.log('알 수 없는 테스트:', testName);
      console.log('사용 가능한 테스트: basic, status, user, multiple, statusChange, settlement, token, template');
  }
}

// 모듈 내보내기
module.exports = {
  testBasicPaymentNotification,
  testPaymentStatusNotifications,
  testUserNotification,
  testMultipleUserNotification,
  testPaymentStatusChangeNotification,
  testSettlementNotification,
  testGetUserFcmToken,
  testTemplateVariableReplacement,
  runAllTests,
  runSpecificTest
};

// 직접 실행 시 전체 테스트 실행
if (require.main === module) {
  const testName = process.argv[2];
  
  if (testName) {
    runSpecificTest(testName);
  } else {
    runAllTests();
  }
} 