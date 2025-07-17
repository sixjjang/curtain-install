const admin = require('firebase-admin');

// Firebase Admin 초기화 (이미 초기화되어 있다면 재사용)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

/**
 * FCM 알림 전송 함수
 * @param {Object} payload - 알림 페이로드
 * @param {string} payload.title - 알림 제목
 * @param {string} payload.body - 알림 내용
 * @param {string} payload.token - FCM 토큰
 * @param {Object} payload.data - 추가 데이터 (선택사항)
 * @returns {Promise<string>} 메시지 ID
 */
async function sendFcmNotification(payload) {
  const { title, body, token, data = {} } = payload;

  // 입력 검증
  if (!title || !body || !token) {
    throw new Error('필수 필드가 누락되었습니다: title, body, token');
  }

  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('유효하지 않은 FCM 토큰입니다');
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      timestamp: new Date().toISOString(),
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    token,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channel_id: 'work_order_channel',
        icon: 'ic_notification',
        color: '#2196F3'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('FCM 알림 전송 성공:', response);
    
    // 알림 로그 저장
    await logNotification({
      type: 'work_order_status',
      title,
      body,
      token: token.substring(0, 10) + '...',
      messageId: response,
      success: true
    });

    return response;
  } catch (error) {
    console.error('FCM 알림 전송 실패:', error);
    
    // 오류 로그 저장
    await logNotification({
      type: 'work_order_status',
      title,
      body,
      token: token.substring(0, 10) + '...',
      error: error.message,
      success: false
    });

    throw error;
  }
}

/**
 * 작업 주문 상태 변경 알림 전송
 * @param {string} workOrderId - 작업 주문 ID
 * @param {string} newStatus - 새로운 상태
 * @param {string} fcmToken - 수신자 FCM 토큰
 * @param {Object} workOrderData - 작업 주문 데이터
 */
async function sendWorkOrderStatusNotification(workOrderId, newStatus, fcmToken, workOrderData = {}) {
  const statusMessages = {
    '등록': '새로운 작업 주문이 등록되었습니다',
    '배정완료': '작업이 배정되었습니다',
    '진행중': '작업이 시작되었습니다',
    '완료': '작업이 완료되었습니다',
    '취소': '작업이 취소되었습니다'
  };

  const title = '작업 상태 변경';
  const body = statusMessages[newStatus] || `작업 상태가 ${newStatus}로 변경되었습니다`;

  const data = {
    workOrderId,
    status: newStatus,
    type: 'work_order_status_change',
    ...workOrderData
  };

  return await sendFcmNotification({
    title,
    body,
    token: fcmToken,
    data
  });
}

/**
 * 사용자 FCM 토큰 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<string|null>} FCM 토큰
 */
async function getUserFcmToken(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData.fcmToken || null;
    }
    return null;
  } catch (error) {
    console.error('FCM 토큰 조회 실패:', error);
    return null;
  }
}

/**
 * 작업 주문 상태 변경 시 자동 알림 전송
 * @param {string} workOrderId - 작업 주문 ID
 * @param {string} newStatus - 새로운 상태
 * @param {string} userId - 수신자 사용자 ID
 * @param {Object} workOrderData - 작업 주문 데이터
 */
async function sendWorkOrderStatusChangeNotification(workOrderId, newStatus, userId, workOrderData = {}) {
  try {
    // 사용자 FCM 토큰 조회
    const fcmToken = await getUserFcmToken(userId);
    
    if (!fcmToken) {
      console.log(`사용자 ${userId}의 FCM 토큰이 없습니다`);
      return null;
    }

    // 알림 전송
    return await sendWorkOrderStatusNotification(
      workOrderId,
      newStatus,
      fcmToken,
      workOrderData
    );
  } catch (error) {
    console.error('작업 주문 상태 변경 알림 전송 실패:', error);
    throw error;
  }
}

// 간단한 알림 로그 저장 함수
async function logNotification(notificationData) {
  try {
    await db.collection('notificationLogs').add({
      ...notificationData,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('알림 로그 저장 실패:', error);
  }
}

module.exports = {
  sendFcmNotification,
  sendWorkOrderStatusNotification,
  sendWorkOrderStatusChangeNotification,
  getUserFcmToken
}; 