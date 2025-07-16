const admin = require('firebase-admin');
const db = admin.firestore();

// 알림 타입 정의
const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  PUSH: 'push'
};

// 알림 상태 정의
const NOTIFICATION_STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  PENDING: 'pending',
  RETRY: 'retry'
};

// 알림 카테고리 정의
const NOTIFICATION_CATEGORIES = {
  SETTLEMENT: 'settlement',
  AD_STATUS: 'ad_status',
  PAYMENT: 'payment',
  SYSTEM: 'system',
  WORKER_GRADE: 'worker_grade',
  MARKETING: 'marketing',
  SECURITY: 'security'
};

// 알림 로그 저장
const logNotification = async (logData) => {
  try {
    const {
      advertiserId,
      type, // 'email' or 'push'
      category, // 'settlement', 'ad_status', etc.
      status, // 'success', 'failure', 'pending', 'retry'
      message,
      error = null,
      metadata = {},
      timestamp = admin.firestore.FieldValue.serverTimestamp()
    } = logData;

    // 필수 필드 검증
    if (!advertiserId || !type || !status || !message) {
      throw new Error('필수 필드가 누락되었습니다: advertiserId, type, status, message');
    }

    // 타입 검증
    if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
      throw new Error(`유효하지 않은 알림 타입: ${type}`);
    }

    // 상태 검증
    if (!Object.values(NOTIFICATION_STATUS).includes(status)) {
      throw new Error(`유효하지 않은 알림 상태: ${status}`);
    }

    const logEntry = {
      timestamp,
      advertiserId,
      type,
      category: category || 'general',
      status,
      message,
      error: error ? {
        message: error.message,
        code: error.code,
        stack: error.stack,
        details: error.details || null
      } : null,
      metadata: {
        ...metadata,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        version: '1.0'
      }
    };

    // Firestore에 로그 저장
    const logRef = await db.collection('notificationLogs').add(logEntry);
    
    console.log(`알림 로그 저장 완료: ${logRef.id}`);
    
    return {
      logId: logRef.id,
      ...logEntry
    };
  } catch (error) {
    console.error('알림 로그 저장 실패:', error);
    throw error;
  }
};

// 성공 로그 저장
const logSuccess = async (advertiserId, type, category, message, metadata = {}) => {
  return await logNotification({
    advertiserId,
    type,
    category,
    status: NOTIFICATION_STATUS.SUCCESS,
    message,
    metadata
  });
};

// 실패 로그 저장
const logFailure = async (advertiserId, type, category, message, error, metadata = {}) => {
  return await logNotification({
    advertiserId,
    type,
    category,
    status: NOTIFICATION_STATUS.FAILURE,
    message,
    error,
    metadata
  });
};

// 재시도 로그 저장
const logRetry = async (advertiserId, type, category, message, attempt, metadata = {}) => {
  return await logNotification({
    advertiserId,
    type,
    category,
    status: NOTIFICATION_STATUS.RETRY,
    message: `${message} (재시도 ${attempt})`,
    metadata: {
      ...metadata,
      retryAttempt: attempt
    }
  });
};

// 대기 중 로그 저장
const logPending = async (advertiserId, type, category, message, metadata = {}) => {
  return await logNotification({
    advertiserId,
    type,
    category,
    status: NOTIFICATION_STATUS.PENDING,
    message,
    metadata
  });
};

// 로그 조회
const getNotificationLogs = async (filters = {}) => {
  try {
    const {
      advertiserId,
      type,
      category,
      status,
      startDate,
      endDate,
      limit = 100,
      orderBy = 'timestamp',
      orderDirection = 'desc'
    } = filters;

    let query = db.collection('notificationLogs');

    // 필터 적용
    if (advertiserId) {
      query = query.where('advertiserId', '==', advertiserId);
    }
    if (type) {
      query = query.where('type', '==', type);
    }
    if (category) {
      query = query.where('category', '==', category);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }

    // 정렬 및 제한
    query = query.orderBy(orderBy, orderDirection).limit(limit);

    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('알림 로그 조회 실패:', error);
    throw error;
  }
};

// 통계 조회
const getNotificationStats = async (filters = {}) => {
  try {
    const {
      advertiserId,
      type,
      category,
      startDate,
      endDate
    } = filters;

    let query = db.collection('notificationLogs');

    // 필터 적용
    if (advertiserId) {
      query = query.where('advertiserId', '==', advertiserId);
    }
    if (type) {
      query = query.where('type', '==', type);
    }
    if (category) {
      query = query.where('category', '==', category);
    }
    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }

    const snapshot = await query.get();
    
    const logs = snapshot.docs.map(doc => doc.data());
    
    // 통계 계산
    const stats = {
      total: logs.length,
      byStatus: {},
      byType: {},
      byCategory: {},
      successRate: 0,
      failureRate: 0,
      averageResponseTime: 0
    };

    logs.forEach(log => {
      // 상태별 통계
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
      
      // 타입별 통계
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      
      // 카테고리별 통계
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });

    // 성공률 계산
    if (stats.total > 0) {
      stats.successRate = ((stats.byStatus.success || 0) / stats.total * 100).toFixed(2);
      stats.failureRate = ((stats.byStatus.failure || 0) / stats.total * 100).toFixed(2);
    }

    return stats;
  } catch (error) {
    console.error('알림 통계 조회 실패:', error);
    throw error;
  }
};

// 오류 분석
const getErrorAnalysis = async (filters = {}) => {
  try {
    const failureLogs = await getNotificationLogs({
      ...filters,
      status: NOTIFICATION_STATUS.FAILURE
    });

    const errorAnalysis = {
      totalErrors: failureLogs.length,
      errorTypes: {},
      topErrors: [],
      recommendations: []
    };

    // 오류 타입별 분석
    failureLogs.forEach(log => {
      if (log.error && log.error.code) {
        errorAnalysis.errorTypes[log.error.code] = 
          (errorAnalysis.errorTypes[log.error.code] || 0) + 1;
      }
    });

    // 상위 오류 추출
    errorAnalysis.topErrors = Object.entries(errorAnalysis.errorTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));

    // 권장사항 생성
    if (errorAnalysis.errorTypes['messaging/invalid-registration-token']) {
      errorAnalysis.recommendations.push('무효한 FCM 토큰 정리가 필요합니다.');
    }
    if (errorAnalysis.errorTypes['messaging/quota-exceeded']) {
      errorAnalysis.recommendations.push('FCM 할당량이 초과되었습니다. 사용량을 확인하세요.');
    }
    if (errorAnalysis.errorTypes['messaging/registration-token-not-registered']) {
      errorAnalysis.recommendations.push('등록되지 않은 토큰이 많습니다. 토큰 정리를 실행하세요.');
    }

    return errorAnalysis;
  } catch (error) {
    console.error('오류 분석 실패:', error);
    throw error;
  }
};

// 로그 정리 (오래된 로그 삭제)
const cleanupOldLogs = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const oldLogsQuery = db.collection('notificationLogs')
      .where('timestamp', '<', cutoffDate);

    const snapshot = await oldLogsQuery.get();
    
    const batch = db.batch();
    let deletedCount = 0;

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`${deletedCount}개의 오래된 로그가 삭제되었습니다.`);
    }

    return { deletedCount };
  } catch (error) {
    console.error('로그 정리 실패:', error);
    throw error;
  }
};

// 실시간 로그 스트림 (관리자용)
const streamNotificationLogs = async (callback) => {
  try {
    const unsubscribe = db.collection('notificationLogs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .onSnapshot(snapshot => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));
        
        callback(logs);
      });

    return unsubscribe;
  } catch (error) {
    console.error('실시간 로그 스트림 실패:', error);
    throw error;
  }
};

module.exports = {
  logNotification,
  logSuccess,
  logFailure,
  logRetry,
  logPending,
  getNotificationLogs,
  getNotificationStats,
  getErrorAnalysis,
  cleanupOldLogs,
  streamNotificationLogs,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  NOTIFICATION_CATEGORIES
}; 