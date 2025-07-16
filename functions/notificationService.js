const admin = require('firebase-admin');
const db = admin.firestore();
const { 
  logSuccess, 
  logFailure, 
  logRetry, 
  logPending,
  NOTIFICATION_TYPES: LOG_TYPES,
  NOTIFICATION_CATEGORIES: LOG_CATEGORIES
} = require('./notificationLogger');

// 알림 타입 정의
const NOTIFICATION_TYPES = {
  SETTLEMENT_COMPLETE: 'settlement_complete',
  AD_STATUS_CHANGE: 'ad_status_change',
  PAYMENT_RECEIVED: 'payment_received',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  WORKER_GRADE_UPDATE: 'worker_grade_update'
};

// 알림 템플릿
const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.SETTLEMENT_COMPLETE]: {
    title: '정산 완료',
    body: '월간 정산이 완료되었습니다. 상세 내역을 확인해주세요.'
  },
  [NOTIFICATION_TYPES.AD_STATUS_CHANGE]: {
    title: '광고 상태 변경',
    body: '광고 상태가 변경되었습니다.'
  },
  [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: {
    title: '결제 완료',
    body: '결제가 성공적으로 완료되었습니다.'
  },
  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: {
    title: '시스템 공지',
    body: '새로운 시스템 공지사항이 있습니다.'
  },
  [NOTIFICATION_TYPES.WORKER_GRADE_UPDATE]: {
    title: '등급 업데이트',
    body: '시공기사 등급이 업데이트되었습니다.'
  }
};

// 알림 로그 저장 (기존 호환성을 위해 유지)
const logNotification = async (notificationData) => {
  try {
    const { advertiserId, type, category, message, metadata } = notificationData;
    await logSuccess(
      advertiserId || 'system',
      type || LOG_TYPES.PUSH,
      category || LOG_CATEGORIES.SYSTEM,
      message || '알림 발송 완료',
      metadata
    );
  } catch (error) {
    console.error('알림 로그 저장 실패:', error);
  }
};

// 알림 오류 로그 저장 (기존 호환성을 위해 유지)
const logNotificationError = async (notificationData, error) => {
  try {
    const { advertiserId, type, category, message, metadata } = notificationData;
    await logFailure(
      advertiserId || 'system',
      type || LOG_TYPES.PUSH,
      category || LOG_CATEGORIES.SYSTEM,
      message || '알림 발송 실패',
      error,
      metadata
    );
  } catch (logError) {
    console.error('오류 로그 저장 실패:', logError);
  }
};

// 관리자에게 오류 알림 이메일 발송 (SendGrid 사용 예시)
const sendErrorAlertToAdmin = async (error, context) => {
  try {
    // SendGrid 설정이 있다면 사용
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // const msg = {
    //   to: 'admin@yourdomain.com',
    //   from: 'noreply@yourdomain.com',
    //   subject: '푸시 알림 발송 오류',
    //   text: `오류 발생: ${error.message}\n컨텍스트: ${JSON.stringify(context)}`
    // };
    // await sgMail.send(msg);
    
    console.error('관리자 오류 알림:', {
      error: error.message,
      context,
      timestamp: new Date().toISOString()
    });
  } catch (alertError) {
    console.error('관리자 오류 알림 발송 실패:', alertError);
  }
};

// 토큰 유효성 검사
const validateToken = (token) => {
  return token && typeof token === 'string' && token.length > 0;
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
          if (attempt === 1) { // 첫 번째 재시도만 로그
            await logRetry(
              'system',
              LOG_TYPES.PUSH,
              LOG_CATEGORIES.SYSTEM,
              `푸시 알림 재시도: ${error.message}`,
              attempt,
              { error: error.message }
            );
          }
          
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    };

// 단일 알림 발송
const sendSingleNotification = async (token, title, body, data = {}) => {
  const message = {
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      timestamp: new Date().toISOString(),
      click_action: 'FLUTTER_NOTIFICATION_CLICK' // Flutter 앱용 (필요시)
    },
    token,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channel_id: 'default_channel'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default'
        }
      }
    }
  };

  try {
    const response = await retryOperation(() => admin.messaging().send(message));
    console.log('푸시 알림 발송 성공:', response);
    
    // 성공 로그 저장
    await logSuccess(
      data.advertiserId || 'system',
      LOG_TYPES.PUSH,
      data.category || LOG_CATEGORIES.SYSTEM,
      `푸시 알림 발송 완료: ${title}`,
      {
        token: token.substring(0, 10) + '...',
        title,
        body,
        messageId: response,
        type: data.type || 'custom',
        ...data
      }
    );
    
    return response;
  } catch (error) {
    console.error('푸시 발송 오류:', error);
    
    // 오류 로그 저장
    await logFailure(
      data.advertiserId || 'system',
      LOG_TYPES.PUSH,
      data.category || LOG_CATEGORIES.SYSTEM,
      `푸시 알림 발송 실패: ${title}`,
      error,
      {
        token: token.substring(0, 10) + '...',
        title,
        body,
        type: data.type || 'custom',
        ...data
      }
    );
    
    // 관리자에게 오류 알림
    await sendErrorAlertToAdmin(error, {
      operation: 'sendSingleNotification',
      token: token.substring(0, 10) + '...', // 토큰 일부만 로그
      title,
      body
    });
    
    throw error;
  }
};

// 여러 알림 발송 (배치)
const sendBatchNotifications = async (notifications) => {
  const results = {
    success: [],
    failed: []
  };

  for (const notification of notifications) {
    try {
      const { token, title, body, data } = notification;
      
      if (!validateToken(token)) {
        results.failed.push({
          ...notification,
          error: 'Invalid token'
        });
        continue;
      }
      
      const messageId = await sendSingleNotification(token, title, body, data);
      results.success.push({
        ...notification,
        messageId
      });
    } catch (error) {
      results.failed.push({
        ...notification,
        error: error.message
      });
    }
  }

  return results;
};

// 사용자 ID로 알림 발송
const sendNotificationToUser = async (userId, type, customData = {}) => {
  try {
    // 사용자 정보 조회
    const userDoc = await db.collection('advertisers').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error(`사용자를 찾을 수 없습니다: ${userId}`);
    }
    
    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;
    
    if (!validateToken(fcmToken)) {
      throw new Error(`유효하지 않은 FCM 토큰: ${userId}`);
    }
    
    // 알림 템플릿 가져오기
    const template = NOTIFICATION_TEMPLATES[type];
    if (!template) {
      throw new Error(`알 수 없는 알림 타입: ${type}`);
    }
    
    // 알림 발송
    const messageId = await sendSingleNotification(
      fcmToken,
      template.title,
      template.body,
      {
        type,
        userId,
        ...customData
      }
    );
    
    return messageId;
  } catch (error) {
    console.error(`사용자 알림 발송 실패 (${userId}):`, error);
    throw error;
  }
};

// 토픽 구독 알림 발송
const sendTopicNotification = async (topic, title, body, data = {}) => {
  const message = {
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      timestamp: new Date().toISOString()
    },
    topic,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channel_id: 'default_channel'
      }
    }
  };

  try {
    const response = await retryOperation(() => admin.messaging().send(message));
    console.log('토픽 알림 발송 성공:', response);
    
    await logNotification({
      topic,
      title,
      body,
      data,
      messageId: response,
      type: 'topic'
    });
    
    return response;
  } catch (error) {
    console.error('토픽 알림 발송 오류:', error);
    
    await logNotificationError({
      topic,
      title,
      body,
      data,
      type: 'topic'
    }, error);
    
    await sendErrorAlertToAdmin(error, {
      operation: 'sendTopicNotification',
      topic,
      title,
      body
    });
    
    throw error;
  }
};

// 토큰 정리 (무효한 토큰 제거)
const cleanupInvalidTokens = async () => {
  try {
    const advertisersSnapshot = await db.collection('advertisers').get();
    const cleanupPromises = [];
    
    for (const doc of advertisersSnapshot.docs) {
      const data = doc.data();
      if (data.fcmToken) {
        // 토큰 유효성 테스트
        try {
          await admin.messaging().send({
            token: data.fcmToken,
            data: { test: 'cleanup' }
          });
        } catch (error) {
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            // 무효한 토큰 제거
            cleanupPromises.push(
              doc.ref.update({ fcmToken: null })
            );
          }
        }
      }
    }
    
    await Promise.all(cleanupPromises);
    console.log('무효한 토큰 정리 완료');
  } catch (error) {
    console.error('토큰 정리 오류:', error);
  }
};

module.exports = {
  sendSingleNotification,
  sendBatchNotifications,
  sendNotificationToUser,
  sendTopicNotification,
  cleanupInvalidTokens,
  NOTIFICATION_TYPES,
  NOTIFICATION_TEMPLATES,
  logNotification,
  logNotificationError
}; 