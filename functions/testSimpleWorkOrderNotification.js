const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

/**
 * 간단한 작업 주문 알림 테스트
 */

// 1. 샘플 사용자 데이터 생성 (FCM 토큰 포함)
async function createSampleUsers() {
  console.log('=== 샘플 사용자 데이터 생성 ===');
  
  const users = [
    {
      id: 'seller-123',
      name: '커튼마스터',
      role: 'seller',
      fcmToken: 'YOUR_SELLER_FCM_TOKEN_HERE' // 실제 FCM 토큰으로 교체
    },
    {
      id: 'customer-123',
      name: '김고객',
      role: 'customer',
      fcmToken: 'YOUR_CUSTOMER_FCM_TOKEN_HERE' // 실제 FCM 토큰으로 교체
    },
    {
      id: 'worker-123',
      name: '박작업자',
      role: 'worker',
      fcmToken: 'YOUR_WORKER_FCM_TOKEN_HERE' // 실제 FCM 토큰으로 교체
    },
    {
      id: 'admin-123',
      name: '관리자',
      role: 'admin',
      fcmToken: 'YOUR_ADMIN_FCM_TOKEN_HERE' // 실제 FCM 토큰으로 교체
    }
  ];

  for (const user of users) {
    try {
      await db.collection('users').doc(user.id).set({
        name: user.name,
        role: user.role,
        fcmToken: user.fcmToken,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`사용자 ${user.name} 생성 완료`);
    } catch (error) {
      console.error(`사용자 ${user.name} 생성 실패:`, error);
    }
  }
}

// 2. 샘플 작업 주문 생성
async function createSampleWorkOrder() {
  console.log('=== 샘플 작업 주문 생성 ===');
  
  const workOrderData = {
    title: '거실 커튼 설치',
    description: '거실 커튼 설치 및 조정 작업',
    status: '등록',
    sellerId: 'seller-123',
    customerId: 'customer-123',
    workerId: 'worker-123',
    estimatedCost: 150000,
    location: '서울시 강남구',
    priority: 'normal',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    const docRef = await db.collection('workOrders').add(workOrderData);
    console.log('샘플 작업 주문 생성 완료:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('샘플 작업 주문 생성 실패:', error);
    throw error;
  }
}

// 3. 작업 주문 상태 변경 테스트
async function testWorkOrderStatusChanges(workOrderId) {
  console.log('=== 작업 주문 상태 변경 테스트 ===');
  
  const statuses = ['등록', '배정완료', '진행중', '완료'];
  
  for (const status of statuses) {
    console.log(`\n상태를 ${status}로 변경 중...`);
    
    try {
      await db.collection('workOrders').doc(workOrderId).update({
        status: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ 상태 변경 완료: ${status}`);
      
      // 상태 변경 후 잠시 대기 (알림 처리 시간 확보)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ 상태 변경 실패: ${status}`, error);
    }
  }
  
  console.log('\n모든 상태 변경 테스트 완료');
}

// 4. 알림 로그 조회
async function checkNotificationLogs() {
  console.log('=== 알림 로그 조회 ===');
  
  try {
    // 작업 주문 상태 변경 로그 조회
    const statusLogsSnapshot = await db
      .collection('workOrderStatusLogs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    console.log('\n📋 작업 주문 상태 변경 로그:');
    statusLogsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.workOrderId}: ${data.oldStatus} → ${data.newStatus} (${data.timestamp?.toDate()})`);
    });
    
    // 일반 알림 로그 조회 (있는 경우)
    const notificationLogsSnapshot = await db
      .collection('notificationLogs')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    if (!notificationLogsSnapshot.empty) {
      console.log('\n📱 알림 전송 로그:');
      notificationLogsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.type}: ${data.title} (${data.success ? '성공' : '실패'})`);
      });
    }
    
  } catch (error) {
    console.error('로그 조회 실패:', error);
  }
}

// 5. 전체 테스트 실행
async function runSimpleTest() {
  console.log('🚀 간단한 작업 주문 알림 테스트 시작\n');
  
  try {
    // 1. 샘플 사용자 생성
    await createSampleUsers();
    
    // 2. 샘플 작업 주문 생성
    const workOrderId = await createSampleWorkOrder();
    
    // 3. 상태 변경 테스트 (Firestore 트리거 테스트)
    await testWorkOrderStatusChanges(workOrderId);
    
    // 4. 로그 확인
    await checkNotificationLogs();
    
    console.log('\n✅ 테스트 완료!');
    console.log('\n📝 참고사항:');
    console.log('- 실제 FCM 토큰을 설정해야 알림이 전송됩니다');
    console.log('- Firebase Functions가 배포되어야 트리거가 작동합니다');
    console.log('- 로그는 Firebase Console에서 확인할 수 있습니다');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
  }
}

// 6. 사용자별 FCM 토큰 조회 테스트
async function testGetUserTokens() {
  console.log('=== 사용자 FCM 토큰 조회 테스트 ===');
  
  const userIds = ['seller-123', 'customer-123', 'worker-123', 'admin-123'];
  
  for (const userId of userIds) {
    try {
      const doc = await db.collection('users').doc(userId).get();
      if (doc.exists) {
        const data = doc.data();
        const hasToken = data.fcmToken ? '있음' : '없음';
        console.log(`${userId}: FCM 토큰 ${hasToken}`);
      } else {
        console.log(`${userId}: 사용자 없음`);
      }
    } catch (error) {
      console.error(`${userId} 조회 실패:`, error);
    }
  }
}

// 모듈 내보내기
module.exports = {
  createSampleUsers,
  createSampleWorkOrder,
  testWorkOrderStatusChanges,
  checkNotificationLogs,
  runSimpleTest,
  testGetUserTokens
};

// 직접 실행 시 테스트 실행
if (require.main === module) {
  runSimpleTest().then(() => {
    console.log('테스트 완료');
    process.exit(0);
  }).catch((error) => {
    console.error('테스트 실패:', error);
    process.exit(1);
  });
} 