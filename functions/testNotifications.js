const admin = require('firebase-admin');
const db = admin.firestore();
const { sendSingleNotification, sendNotificationToUser, NOTIFICATION_TYPES } = require('./notificationService');

// 테스트 알림 발송 함수
const sendTestNotification = async (req, res) => {
  try {
    const { advertiserId, testType = 'custom' } = req.body;
    
    if (!advertiserId) {
      return res.status(400).json({ 
        success: false, 
        error: 'advertiserId가 필요합니다.' 
      });
    }

    let result;
    
    switch (testType) {
      case 'settlement':
        result = await sendNotificationToUser(
          advertiserId, 
          NOTIFICATION_TYPES.SETTLEMENT_COMPLETE,
          {
            testMode: true,
            settlementId: 'test-settlement-123',
            amount: 50000,
            period: '2024-01'
          }
        );
        break;
        
      case 'ad_status':
        result = await sendNotificationToUser(
          advertiserId,
          NOTIFICATION_TYPES.AD_STATUS_CHANGE,
          {
            testMode: true,
            adId: 'test-ad-123',
            oldStatus: 'pending',
            newStatus: 'active',
            adTitle: '테스트 광고'
          }
        );
        break;
        
      case 'payment':
        result = await sendNotificationToUser(
          advertiserId,
          NOTIFICATION_TYPES.PAYMENT_RECEIVED,
          {
            testMode: true,
            paymentId: 'test-payment-123',
            amount: 10000
          }
        );
        break;
        
      case 'system':
        result = await sendNotificationToUser(
          advertiserId,
          NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
          {
            testMode: true,
            announcementId: 'test-announcement-123'
          }
        );
        break;
        
      default:
        // 사용자 정보 조회
        const userDoc = await db.collection('advertisers').doc(advertiserId).get();
        
        if (!userDoc.exists) {
          return res.status(404).json({ 
            success: false, 
            error: '사용자를 찾을 수 없습니다.' 
          });
        }
        
        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;
        
        if (!fcmToken) {
          return res.status(400).json({ 
            success: false, 
            error: 'FCM 토큰이 없습니다.' 
          });
        }
        
        result = await sendSingleNotification(
          fcmToken,
          '테스트 알림',
          '이것은 테스트 알림입니다.',
          {
            testMode: true,
            timestamp: new Date().toISOString(),
            advertiserId
          }
        );
    }
    
    res.status(200).json({ 
      success: true, 
      messageId: result,
      testType,
      advertiserId
    });
    
  } catch (error) {
    console.error('테스트 알림 발송 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// 모든 광고주에게 테스트 알림 발송
const sendTestNotificationToAll = async (req, res) => {
  try {
    const { testType = 'custom', title, body } = req.body;
    
    const advertisersSnapshot = await db.collection('advertisers').get();
    const results = {
      success: [],
      failed: []
    };
    
    for (const doc of advertisersSnapshot.docs) {
      const advertiserData = doc.data();
      const advertiserId = doc.id;
      const fcmToken = advertiserData.fcmToken;
      
      if (!fcmToken) {
        results.failed.push({
          advertiserId,
          error: 'FCM 토큰 없음'
        });
        continue;
      }
      
      try {
        let messageId;
        
        if (testType === 'custom' && title && body) {
          messageId = await sendSingleNotification(
            fcmToken,
            title,
            body,
            {
              testMode: true,
              advertiserId
            }
          );
        } else {
          messageId = await sendNotificationToUser(
            advertiserId,
            testType,
            { testMode: true }
          );
        }
        
        results.success.push({
          advertiserId,
          messageId
        });
      } catch (error) {
        results.failed.push({
          advertiserId,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      total: advertisersSnapshot.size,
      results
    });
    
  } catch (error) {
    console.error('전체 테스트 알림 발송 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// 알림 통계 조회
const getNotificationStats = async (req, res) => {
  try {
    const { advertiserId } = req.query;
    
    let query = db.collection('notificationLogs');
    if (advertiserId) {
      query = query.where('userId', '==', advertiserId);
    }
    
    const logsSnapshot = await query.get();
    const errorSnapshot = await db.collection('notificationErrors').get();
    
    const stats = {
      totalSent: logsSnapshot.size,
      totalErrors: errorSnapshot.size,
      successRate: logsSnapshot.size > 0 ? 
        ((logsSnapshot.size - errorSnapshot.size) / logsSnapshot.size * 100).toFixed(2) : 0,
      recentLogs: [],
      recentErrors: []
    };
    
    // 최근 10개 로그
    const recentLogs = await db.collection('notificationLogs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    stats.recentLogs = recentLogs.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    
    // 최근 10개 오류
    const recentErrors = await db.collection('notificationErrors')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    stats.recentErrors = recentErrors.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    
    res.status(200).json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('알림 통계 조회 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = {
  sendTestNotification,
  sendTestNotificationToAll,
  getNotificationStats
}; 