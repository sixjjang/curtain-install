const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { 
  sendWorkOrderStatusChangeNotification,
  sendFcmNotification 
} = require('./sendFcmNotification');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 작업 주문 상태 변경 시 알림 전송 Cloud Function
 * Firestore 트리거로 작동
 */
exports.onWorkOrderStatusChange = functions.firestore
  .document('workOrders/{workOrderId}')
  .onUpdate(async (change, context) => {
    const workOrderId = context.params.workOrderId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    // 상태가 변경되지 않았다면 알림 전송하지 않음
    if (beforeData.status === afterData.status) {
      console.log('상태 변경 없음, 알림 전송 건너뜀');
      return null;
    }

    const oldStatus = beforeData.status;
    const newStatus = afterData.status;
    
    console.log(`작업 주문 ${workOrderId} 상태 변경: ${oldStatus} → ${newStatus}`);

    try {
      const notifications = [];

      // 1. 작업자에게 알림 (작업이 배정되거나 상태가 변경될 때)
      if (afterData.workerId) {
        notifications.push(
          sendWorkOrderStatusChangeNotification(
            workOrderId,
            newStatus,
            afterData.workerId,
            {
              workOrderTitle: afterData.title,
              workOrderDescription: afterData.description,
              oldStatus,
              newStatus
            }
          )
        );
      }

      // 2. 고객에게 알림 (작업 주문을 생성한 사용자)
      if (afterData.customerId) {
        notifications.push(
          sendWorkOrderStatusChangeNotification(
            workOrderId,
            newStatus,
            afterData.customerId,
            {
              workOrderTitle: afterData.title,
              workOrderDescription: afterData.description,
              oldStatus,
              newStatus
            }
          )
        );
      }

      // 3. 관리자에게 알림 (특정 상태 변경 시)
      if (shouldNotifyAdmin(newStatus)) {
        const adminTokens = await getAdminFcmTokens();
        for (const token of adminTokens) {
          notifications.push(
            sendFcmNotification({
              title: '작업 주문 상태 변경',
              body: `작업 주문 ${workOrderId}의 상태가 ${newStatus}로 변경되었습니다`,
              token,
              data: {
                workOrderId,
                status: newStatus,
                type: 'admin_work_order_status_change',
                oldStatus,
                newStatus
              }
            })
          );
        }
      }

      // 모든 알림 전송
      const results = await Promise.allSettled(notifications);
      
      // 결과 로깅
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`알림 ${index + 1} 전송 성공:`, result.value);
        } else {
          console.error(`알림 ${index + 1} 전송 실패:`, result.reason);
        }
      });

      // 상태 변경 로그 저장
      await logWorkOrderStatusChange(workOrderId, oldStatus, newStatus, afterData);

      return { success: true, notificationsSent: results.length };
    } catch (error) {
      console.error('작업 주문 상태 변경 알림 처리 실패:', error);
      throw error;
    }
  });

/**
 * 관리자 알림이 필요한 상태인지 확인
 */
function shouldNotifyAdmin(status) {
  const adminNotificationStatuses = ['취소', '완료', '진행중'];
  return adminNotificationStatuses.includes(status);
}

/**
 * 관리자 FCM 토큰 조회
 */
async function getAdminFcmTokens() {
  try {
    const adminUsersSnapshot = await db
      .collection('users')
      .where('role', '==', 'admin')
      .where('fcmToken', '!=', null)
      .get();

    const tokens = [];
    adminUsersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
      }
    });

    return tokens;
  } catch (error) {
    console.error('관리자 FCM 토큰 조회 실패:', error);
    return [];
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
        customerId: workOrderData.customerId,
        workerId: workOrderData.workerId
      }
    });
  } catch (error) {
    console.error('작업 주문 상태 변경 로그 저장 실패:', error);
  }
}

/**
 * HTTP 함수로 직접 알림 전송 (테스트용)
 */
exports.sendWorkOrderNotification = functions.https.onCall(async (data, context) => {
  // 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다');
  }

  const { workOrderId, newStatus, userId, workOrderData } = data;

  // 입력 검증
  if (!workOrderId || !newStatus || !userId) {
    throw new functions.https.HttpsError('invalid-argument', '필수 필드가 누락되었습니다');
  }

  try {
    const result = await sendWorkOrderStatusChangeNotification(
      workOrderId,
      newStatus,
      userId,
      workOrderData || {}
    );

    return { success: true, messageId: result };
  } catch (error) {
    console.error('HTTP 함수 알림 전송 실패:', error);
    throw new functions.https.HttpsError('internal', '알림 전송에 실패했습니다');
  }
});

/**
 * 배치 알림 전송 (여러 사용자에게 동시 전송)
 */
exports.sendBatchWorkOrderNotifications = functions.https.onCall(async (data, context) => {
  // 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다');
  }

  const { workOrderId, newStatus, userIds, workOrderData } = data;

  // 입력 검증
  if (!workOrderId || !newStatus || !userIds || !Array.isArray(userIds)) {
    throw new functions.https.HttpsError('invalid-argument', '필수 필드가 누락되었습니다');
  }

  try {
    const notifications = userIds.map(userId =>
      sendWorkOrderStatusChangeNotification(
        workOrderId,
        newStatus,
        userId,
        workOrderData || {}
      )
    );

    const results = await Promise.allSettled(notifications);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      success: true,
      total: userIds.length,
      successful,
      failed,
      results: results.map((result, index) => ({
        userId: userIds[index],
        success: result.status === 'fulfilled',
        messageId: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    };
  } catch (error) {
    console.error('배치 알림 전송 실패:', error);
    throw new functions.https.HttpsError('internal', '배치 알림 전송에 실패했습니다');
  }
}); 