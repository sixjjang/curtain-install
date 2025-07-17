const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 작업 주문 상태 변경 시 알림 전송
 */
exports.notifyWorkOrderStatusChanged = functions.firestore
  .document("workOrders/{workOrderId}")
  .onUpdate(async (change, context) => {
    const workOrderId = context.params.workOrderId;
    const before = change.before.data();
    const after = change.after.data();

    // 상태가 변경되지 않았다면 알림 전송하지 않음
    if (before.status === after.status) {
      console.log(`작업 주문 ${workOrderId}: 상태 변경 없음 (${before.status})`);
      return null;
    }

    console.log(`작업 주문 ${workOrderId} 상태 변경: ${before.status} → ${after.status}`);

    try {
      const notifications = [];

      // 1. 판매자(시공업체)에게 알림
      if (after.sellerId) {
        const sellerToken = await getSellerFcmToken(after.sellerId);
        if (sellerToken) {
          notifications.push(
            sendWorkOrderNotification(
              sellerToken,
              after.status,
              workOrderId,
              after,
              'seller'
            )
          );
        }
      }

      // 2. 고객에게 알림
      if (after.customerId) {
        const customerToken = await getUserFcmToken(after.customerId);
        if (customerToken) {
          notifications.push(
            sendWorkOrderNotification(
              customerToken,
              after.status,
              workOrderId,
              after,
              'customer'
            )
          );
        }
      }

      // 3. 작업자에게 알림
      if (after.workerId) {
        const workerToken = await getUserFcmToken(after.workerId);
        if (workerToken) {
          notifications.push(
            sendWorkOrderNotification(
              workerToken,
              after.status,
              workOrderId,
              after,
              'worker'
            )
          );
        }
      }

      // 4. 관리자에게 알림 (중요한 상태 변경 시)
      if (shouldNotifyAdmin(after.status)) {
        const adminTokens = await getAdminFcmTokens();
        for (const token of adminTokens) {
          notifications.push(
            sendWorkOrderNotification(
              token,
              after.status,
              workOrderId,
              after,
              'admin'
            )
          );
        }
      }

      // 모든 알림 전송
      const results = await Promise.allSettled(notifications);
      
      // 결과 로깅
      let successCount = 0;
      let failureCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`알림 ${index + 1} 전송 성공:`, result.value);
          successCount++;
        } else {
          console.error(`알림 ${index + 1} 전송 실패:`, result.reason);
          failureCount++;
        }
      });

      // 상태 변경 로그 저장
      await logWorkOrderStatusChange(workOrderId, before.status, after.status, after);

      console.log(`알림 전송 완료: 성공 ${successCount}건, 실패 ${failureCount}건`);
      
      return {
        success: true,
        notificationsSent: successCount,
        notificationsFailed: failureCount,
        workOrderId,
        oldStatus: before.status,
        newStatus: after.status
      };

    } catch (error) {
      console.error('작업 주문 상태 변경 알림 처리 실패:', error);
      throw error;
    }
  });

/**
 * 판매자 FCM 토큰 조회
 */
async function getSellerFcmToken(sellerId) {
  try {
    const doc = await db.collection("users").doc(sellerId).get();
    if (!doc.exists) {
      console.log(`판매자 ${sellerId}를 찾을 수 없습니다`);
      return null;
    }
    
    const data = doc.data();
    const token = data?.fcmToken;
    
    if (!token) {
      console.log(`판매자 ${sellerId}의 FCM 토큰이 없습니다`);
      return null;
    }
    
    console.log(`판매자 ${sellerId} FCM 토큰 조회 성공`);
    return token;
  } catch (error) {
    console.error(`판매자 ${sellerId} FCM 토큰 조회 실패:`, error);
    return null;
  }
}

/**
 * 사용자 FCM 토큰 조회 (일반 사용자용)
 */
async function getUserFcmToken(userId) {
  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      console.log(`사용자 ${userId}를 찾을 수 없습니다`);
      return null;
    }
    
    const data = doc.data();
    const token = data?.fcmToken;
    
    if (!token) {
      console.log(`사용자 ${userId}의 FCM 토큰이 없습니다`);
      return null;
    }
    
    console.log(`사용자 ${userId} FCM 토큰 조회 성공`);
    return token;
  } catch (error) {
    console.error(`사용자 ${userId} FCM 토큰 조회 실패:`, error);
    return null;
  }
}

/**
 * 관리자 FCM 토큰들 조회
 */
async function getAdminFcmTokens() {
  try {
    const adminUsersSnapshot = await db
      .collection("users")
      .where("role", "==", "admin")
      .where("fcmToken", "!=", null)
      .get();

    const tokens = [];
    adminUsersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
      }
    });

    console.log(`관리자 FCM 토큰 ${tokens.length}개 조회 성공`);
    return tokens;
  } catch (error) {
    console.error('관리자 FCM 토큰 조회 실패:', error);
    return [];
  }
}

/**
 * 관리자 알림이 필요한 상태인지 확인
 */
function shouldNotifyAdmin(status) {
  const adminNotificationStatuses = ['취소', '완료', '진행중'];
  return adminNotificationStatuses.includes(status);
}

/**
 * 상태별 알림 메시지 생성
 */
function getStatusMessage(status, userType) {
  const statusMessages = {
    '등록': {
      seller: '새로운 시공건이 등록되었습니다',
      customer: '시공건이 등록되었습니다',
      worker: '새로운 작업이 등록되었습니다',
      admin: '새로운 시공건이 등록되었습니다'
    },
    '배정완료': {
      seller: '시공건이 배정되었습니다',
      customer: '시공건이 배정되었습니다',
      worker: '작업이 배정되었습니다',
      admin: '시공건이 배정되었습니다'
    },
    '진행중': {
      seller: '시공이 시작되었습니다',
      customer: '시공이 시작되었습니다',
      worker: '작업이 시작되었습니다',
      admin: '시공이 시작되었습니다'
    },
    '완료': {
      seller: '시공이 완료되었습니다',
      customer: '시공이 완료되었습니다',
      worker: '작업이 완료되었습니다',
      admin: '시공이 완료되었습니다'
    },
    '취소': {
      seller: '시공건이 취소되었습니다',
      customer: '시공건이 취소되었습니다',
      worker: '작업이 취소되었습니다',
      admin: '시공건이 취소되었습니다'
    }
  };

  return statusMessages[status]?.[userType] || `시공건 상태가 '${status}'(으)로 변경되었습니다`;
}

/**
 * 작업 주문 알림 전송
 */
async function sendWorkOrderNotification(token, status, workOrderId, workOrderData, userType) {
  const title = "시공건 상태 변경 알림";
  const body = getStatusMessage(status, userType);

  const payload = {
    notification: {
      title,
      body,
    },
    token,
    data: {
      workOrderId,
      status,
      userType,
      type: 'work_order_status_change',
      timestamp: new Date().toISOString(),
      title: workOrderData.title || '',
      description: workOrderData.description || ''
    }
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log(`${userType} 알림 전송 성공:`, response);
    return response;
  } catch (error) {
    console.error(`${userType} 알림 전송 실패:`, error);
    throw error;
  }
}

/**
 * 작업 주문 상태 변경 로그 저장
 */
async function logWorkOrderStatusChange(workOrderId, oldStatus, newStatus, workOrderData) {
  try {
    await db.collection('workOrderStatusLogs').add({
      workOrderId,
      oldStatus,
      newStatus,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      workOrderData: {
        title: workOrderData.title,
        description: workOrderData.description,
        sellerId: workOrderData.sellerId,
        customerId: workOrderData.customerId,
        workerId: workOrderData.workerId
      }
    });
    console.log(`작업 주문 상태 변경 로그 저장 완료: ${workOrderId}`);
  } catch (error) {
    console.error('작업 주문 상태 변경 로그 저장 실패:', error);
  }
} 