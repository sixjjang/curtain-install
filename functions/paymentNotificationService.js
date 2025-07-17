const admin = require("firebase-admin");
const db = admin.firestore();
const { 
  logSuccess, 
  logFailure, 
  logRetry,
  NOTIFICATION_TYPES: LOG_TYPES,
  NOTIFICATION_CATEGORIES: LOG_CATEGORIES
} = require('./notificationLogger');

// 결제 알림 타입 정의
const PAYMENT_NOTIFICATION_TYPES = {
  PAYMENT_COMPLETE: 'payment_complete',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_REFUNDED: 'payment_refunded',
  PAYMENT_CANCELLED: 'payment_cancelled',
  WORKER_PAYMENT_SENT: 'worker_payment_sent',
  SETTLEMENT_COMPLETE: 'settlement_complete'
};

// 결제 알림 템플릿
const PAYMENT_NOTIFICATION_TEMPLATES = {
  [PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE]: {
    title: "결제 완료 알림",
    body: "작업 ID {workOrderId}의 결제가 완료되었습니다.",
    category: LOG_CATEGORIES.PAYMENT
  },
  [PAYMENT_NOTIFICATION_TYPES.PAYMENT_FAILED]: {
    title: "결제 실패 알림",
    body: "작업 ID {workOrderId}의 결제가 실패했습니다. 다시 시도해주세요.",
    category: LOG_CATEGORIES.PAYMENT
  },
  [PAYMENT_NOTIFICATION_TYPES.PAYMENT_PENDING]: {
    title: "결제 대기 알림",
    body: "작업 ID {workOrderId}의 결제가 처리 중입니다.",
    category: LOG_CATEGORIES.PAYMENT
  },
  [PAYMENT_NOTIFICATION_TYPES.PAYMENT_REFUNDED]: {
    title: "환불 완료 알림",
    body: "작업 ID {workOrderId}의 환불이 완료되었습니다.",
    category: LOG_CATEGORIES.PAYMENT
  },
  [PAYMENT_NOTIFICATION_TYPES.PAYMENT_CANCELLED]: {
    title: "결제 취소 알림",
    body: "작업 ID {workOrderId}의 결제가 취소되었습니다.",
    category: LOG_CATEGORIES.PAYMENT
  },
  [PAYMENT_NOTIFICATION_TYPES.WORKER_PAYMENT_SENT]: {
    title: "기사 지급 완료",
    body: "작업 ID {workOrderId}의 기사 지급이 완료되었습니다.",
    category: LOG_CATEGORIES.PAYMENT
  },
  [PAYMENT_NOTIFICATION_TYPES.SETTLEMENT_COMPLETE]: {
    title: "정산 완료",
    body: "월간 정산이 완료되었습니다. 상세 내역을 확인해주세요.",
    category: LOG_CATEGORIES.PAYMENT
  }
};

// 템플릿 메시지에서 변수 치환
const replaceTemplateVariables = (template, variables) => {
  let result = template;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, variables[key]);
  });
  return result;
};

// FCM 토큰 가져오기
const getUserFcmToken = async (userId) => {
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
};

// 재시도 로직
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.log(`재시도 ${attempt}/${maxRetries}: ${error.message}`);
      
      // 재시도 로그 저장
      if (attempt === 1) {
        await logRetry(
          'system',
          LOG_TYPES.PUSH,
          LOG_CATEGORIES.PAYMENT,
          `결제 알림 재시도: ${error.message}`,
          attempt,
          { error: error.message }
        );
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// 단일 결제 알림 발송
const sendPaymentNotification = async (userFcmToken, paymentInfo, notificationType = PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE) => {
  if (!userFcmToken) {
    console.log('FCM 토큰이 없어 알림을 발송할 수 없습니다.');
    return null;
  }

  const template = PAYMENT_NOTIFICATION_TEMPLATES[notificationType];
  if (!template) {
    console.error('알 수 없는 알림 타입:', notificationType);
    return null;
  }

  // 템플릿 변수 치환
  const title = replaceTemplateVariables(template.title, paymentInfo);
  const body = replaceTemplateVariables(template.body, paymentInfo);

  const message = {
    token: userFcmToken,
    notification: {
      title,
      body,
    },
    data: {
      workOrderId: paymentInfo.workOrderId || '',
      paymentId: paymentInfo.paymentId || '',
      type: notificationType,
      amount: paymentInfo.amount?.toString() || '',
      currency: paymentInfo.currency || 'KRW',
      timestamp: new Date().toISOString(),
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channel_id: 'payment_channel',
        color: '#4CAF50'
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
    const response = await retryOperation(() => admin.messaging().send(message));
    console.log('결제 알림 전송 완료:', response);
    
    // 성공 로그 저장
    await logSuccess(
      paymentInfo.sellerId || 'system',
      LOG_TYPES.PUSH,
      template.category,
      `결제 알림 발송 완료: ${title}`,
      {
        token: userFcmToken.substring(0, 10) + '...',
        title,
        body,
        messageId: response,
        type: notificationType,
        workOrderId: paymentInfo.workOrderId,
        paymentId: paymentInfo.paymentId,
        amount: paymentInfo.amount
      }
    );
    
    return response;
  } catch (error) {
    console.error('결제 알림 전송 실패:', error);
    
    // 오류 로그 저장
    await logFailure(
      paymentInfo.sellerId || 'system',
      LOG_TYPES.PUSH,
      template.category,
      `결제 알림 발송 실패: ${title}`,
      error,
      {
        token: userFcmToken.substring(0, 10) + '...',
        title,
        body,
        type: notificationType,
        workOrderId: paymentInfo.workOrderId,
        paymentId: paymentInfo.paymentId,
        amount: paymentInfo.amount
      }
    );
    
    throw error;
  }
};

// 사용자 ID로 결제 알림 발송
const sendPaymentNotificationToUser = async (userId, paymentInfo, notificationType = PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE) => {
  try {
    const fcmToken = await getUserFcmToken(userId);
    if (!fcmToken) {
      console.log(`사용자 ${userId}의 FCM 토큰이 없습니다.`);
      return null;
    }

    return await sendPaymentNotification(fcmToken, paymentInfo, notificationType);
  } catch (error) {
    console.error('사용자 결제 알림 발송 실패:', error);
    throw error;
  }
};

// 여러 사용자에게 결제 알림 발송
const sendPaymentNotificationToUsers = async (userIds, paymentInfo, notificationType = PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE) => {
  const results = [];
  
  for (const userId of userIds) {
    try {
      const result = await sendPaymentNotificationToUser(userId, paymentInfo, notificationType);
      results.push({ userId, success: true, messageId: result });
    } catch (error) {
      console.error(`사용자 ${userId}에게 알림 발송 실패:`, error);
      results.push({ userId, success: false, error: error.message });
    }
  }
  
  return results;
};

// 결제 완료 알림 (기존 함수와 호환)
const sendPaymentCompleteNotification = async (userFcmToken, paymentInfo) => {
  return await sendPaymentNotification(userFcmToken, paymentInfo, PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE);
};

// 작업 주문 상태 변경 시 관련자들에게 알림
const notifyPaymentStatusChange = async (workOrderId, paymentStatus, paymentInfo) => {
  try {
    // 작업 주문 정보 가져오기
    const workOrderDoc = await db.collection('workOrders').doc(workOrderId).get();
    if (!workOrderDoc.exists) {
      console.log('작업 주문을 찾을 수 없습니다:', workOrderId);
      return;
    }

    const workOrderData = workOrderDoc.data();
    const notifications = [];

    // 판매자에게 알림
    if (workOrderData.sellerId) {
      const sellerNotification = sendPaymentNotificationToUser(
        workOrderData.sellerId,
        { ...paymentInfo, workOrderId },
        getNotificationTypeFromStatus(paymentStatus)
      );
      notifications.push(sellerNotification);
    }

    // 기사에게 알림 (지급 관련)
    if (workOrderData.workerId && paymentStatus === 'paid') {
      const workerNotification = sendPaymentNotificationToUser(
        workOrderData.workerId,
        { ...paymentInfo, workOrderId },
        PAYMENT_NOTIFICATION_TYPES.WORKER_PAYMENT_SENT
      );
      notifications.push(workerNotification);
    }

    // 모든 알림 발송
    await Promise.allSettled(notifications);
    console.log('결제 상태 변경 알림 발송 완료');
  } catch (error) {
    console.error('결제 상태 변경 알림 발송 실패:', error);
  }
};

// 결제 상태에 따른 알림 타입 결정
const getNotificationTypeFromStatus = (paymentStatus) => {
  switch (paymentStatus) {
    case 'paid':
      return PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE;
    case 'failed':
      return PAYMENT_NOTIFICATION_TYPES.PAYMENT_FAILED;
    case 'pending':
      return PAYMENT_NOTIFICATION_TYPES.PAYMENT_PENDING;
    case 'refunded':
      return PAYMENT_NOTIFICATION_TYPES.PAYMENT_REFUNDED;
    case 'cancelled':
      return PAYMENT_NOTIFICATION_TYPES.PAYMENT_CANCELLED;
    default:
      return PAYMENT_NOTIFICATION_TYPES.PAYMENT_COMPLETE;
  }
};

// 정산 완료 알림
const sendSettlementNotification = async (userId, settlementInfo) => {
  return await sendPaymentNotificationToUser(
    userId,
    settlementInfo,
    PAYMENT_NOTIFICATION_TYPES.SETTLEMENT_COMPLETE
  );
};

module.exports = {
  PAYMENT_NOTIFICATION_TYPES,
  PAYMENT_NOTIFICATION_TEMPLATES,
  sendPaymentNotification,
  sendPaymentNotificationToUser,
  sendPaymentNotificationToUsers,
  sendPaymentCompleteNotification,
  notifyPaymentStatusChange,
  sendSettlementNotification,
  getUserFcmToken
}; 