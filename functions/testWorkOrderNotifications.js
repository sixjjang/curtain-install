const admin = require('firebase-admin');
const { 
  sendFcmNotification,
  sendWorkOrderStatusNotification,
  sendWorkOrderStatusChangeNotification,
  getUserFcmToken
} = require('./sendFcmNotification');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

/**
 * FCM 알림 테스트 함수들
 */

// 1. 기본 FCM 알림 테스트
async function testBasicFcmNotification() {
  console.log('=== 기본 FCM 알림 테스트 ===');
  
  try {
    const result = await sendFcmNotification({
      title: '테스트 알림',
      body: '이것은 테스트 알림입니다.',
      token: 'YOUR_FCM_TOKEN_HERE', // 실제 FCM 토큰으로 교체
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('알림 전송 성공:', result);
    return result;
  } catch (error) {
    console.error('알림 전송 실패:', error);
    throw error;
  }
}

// 2. 작업 주문 상태 변경 알림 테스트
async function testWorkOrderStatusNotification() {
  console.log('=== 작업 주문 상태 변경 알림 테스트 ===');
  
  try {
    const result = await sendWorkOrderStatusNotification(
      'work-order-123',
      '진행중',
      'YOUR_FCM_TOKEN_HERE', // 실제 FCM 토큰으로 교체
      {
        title: '커튼 설치 작업',
        description: '거실 커튼 설치 및 조정',
        customerId: 'customer-123',
        workerId: 'worker-456'
      }
    );
    
    console.log('작업 주문 알림 전송 성공:', result);
    return result;
  } catch (error) {
    console.error('작업 주문 알림 전송 실패:', error);
    throw error;
  }
}

// 3. 사용자 ID로 알림 전송 테스트
async function testUserNotification() {
  console.log('=== 사용자 ID로 알림 전송 테스트 ===');
  
  try {
    const result = await sendWorkOrderStatusChangeNotification(
      'work-order-123',
      '완료',
      'user-123', // 실제 사용자 ID로 교체
      {
        title: '커튼 설치 작업',
        description: '거실 커튼 설치 및 조정'
      }
    );
    
    console.log('사용자 알림 전송 성공:', result);
    return result;
  } catch (error) {
    console.error('사용자 알림 전송 실패:', error);
    throw error;
  }
}

// 4. 사용자 FCM 토큰 조회 테스트
async function testGetUserFcmToken() {
  console.log('=== 사용자 FCM 토큰 조회 테스트 ===');
  
  try {
    const token = await getUserFcmToken('user-123'); // 실제 사용자 ID로 교체
    
    if (token) {
      console.log('FCM 토큰 조회 성공:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.log('사용자의 FCM 토큰이 없습니다.');
      return null;
    }
  } catch (error) {
    console.error('FCM 토큰 조회 실패:', error);
    throw error;
  }
}

// 5. 샘플 작업 주문 데이터 생성
async function createSampleWorkOrder() {
  console.log('=== 샘플 작업 주문 생성 ===');
  
  try {
    const workOrderData = {
      title: '커튼 설치 작업',
      description: '거실 커튼 설치 및 조정',
      status: '등록',
      customerId: 'customer-123',
      workerId: 'worker-456',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      estimatedCost: 150000,
      location: '서울시 강남구',
      priority: 'normal'
    };
    
    const docRef = await db.collection('workOrders').add(workOrderData);
    console.log('샘플 작업 주문 생성 성공:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('샘플 작업 주문 생성 실패:', error);
    throw error;
  }
}

// 6. 작업 주문 상태 변경 테스트
async function testWorkOrderStatusChange(workOrderId) {
  console.log('=== 작업 주문 상태 변경 테스트 ===');
  
  try {
    const statuses = ['등록', '배정완료', '진행중', '완료'];
    
    for (const status of statuses) {
      console.log(`상태를 ${status}로 변경 중...`);
      
      await db.collection('workOrders').doc(workOrderId).update({
        status: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`상태 변경 완료: ${status}`);
      
      // 상태 변경 간격을 위해 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('모든 상태 변경 완료');
  } catch (error) {
    console.error('작업 주문 상태 변경 실패:', error);
    throw error;
  }
}

// 7. 알림 로그 조회 테스트
async function testGetNotificationLogs() {
  console.log('=== 알림 로그 조회 테스트 ===');
  
  try {
    const logsSnapshot = await db
      .collection('notificationLogs')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const logs = [];
    logsSnapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('최근 알림 로그:', logs);
    return logs;
  } catch (error) {
    console.error('알림 로그 조회 실패:', error);
    throw error;
  }
}

// 8. 작업 주문 상태 변경 로그 조회 테스트
async function testGetWorkOrderStatusLogs() {
  console.log('=== 작업 주문 상태 변경 로그 조회 테스트 ===');
  
  try {
    const logsSnapshot = await db
      .collection('workOrderStatusLogs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    const logs = [];
    logsSnapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('최근 작업 주문 상태 변경 로그:', logs);
    return logs;
  } catch (error) {
    console.error('작업 주문 상태 변경 로그 조회 실패:', error);
    throw error;
  }
}

// 9. 전체 테스트 실행
async function runAllTests() {
  console.log('🚀 작업 주문 알림 시스템 테스트 시작\n');
  
  try {
    // 1. 샘플 작업 주문 생성
    const workOrderId = await createSampleWorkOrder();
    
    // 2. FCM 토큰 조회 테스트
    await testGetUserFcmToken();
    
    // 3. 알림 로그 조회 테스트
    await testGetNotificationLogs();
    
    // 4. 작업 주문 상태 변경 테스트 (Firestore 트리거 테스트)
    await testWorkOrderStatusChange(workOrderId);
    
    // 5. 상태 변경 로그 조회 테스트
    await testGetWorkOrderStatusLogs();
    
    console.log('\n✅ 모든 테스트 완료!');
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
  }
}

// 10. 개별 테스트 실행 함수들
async function runBasicNotificationTest() {
  console.log('🚀 기본 알림 테스트 시작\n');
  await testBasicFcmNotification();
}

async function runWorkOrderNotificationTest() {
  console.log('🚀 작업 주문 알림 테스트 시작\n');
  await testWorkOrderStatusNotification();
}

async function runUserNotificationTest() {
  console.log('🚀 사용자 알림 테스트 시작\n');
  await testUserNotification();
}

// 모듈 내보내기
module.exports = {
  testBasicFcmNotification,
  testWorkOrderStatusNotification,
  testUserNotification,
  testGetUserFcmToken,
  createSampleWorkOrder,
  testWorkOrderStatusChange,
  testGetNotificationLogs,
  testGetWorkOrderStatusLogs,
  runAllTests,
  runBasicNotificationTest,
  runWorkOrderNotificationTest,
  runUserNotificationTest
};

// 직접 실행 시 전체 테스트 실행
if (require.main === module) {
  runAllTests().then(() => {
    console.log('테스트 완료');
    process.exit(0);
  }).catch((error) => {
    console.error('테스트 실패:', error);
    process.exit(1);
  });
} 