const functions = require('firebase-functions');
const admin = require('firebase-admin');

// FCM 토큰 저장
exports.saveFCMToken = functions.https.onCall(async (data, context) => {
  try {
    const { token, userId } = data;
    
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    
    if (!token) {
      throw new functions.https.HttpsError('invalid-argument', 'FCM 토큰이 필요합니다.');
    }
    
    // 사용자 ID 검증 (본인만 토큰 저장 가능)
    const requestUserId = context.auth.uid;
    if (userId && userId !== requestUserId) {
      throw new functions.https.HttpsError('permission-denied', '다른 사용자의 토큰을 저장할 수 없습니다.');
    }
    
    const targetUserId = userId || requestUserId;
    
    console.log(`FCM 토큰 저장 시작: ${targetUserId}`);
    
    // Firestore에 토큰 저장
    await admin.firestore()
      .collection('users')
      .doc(targetUserId)
      .update({
        fcmToken: token,
        lastTokenUpdate: admin.firestore.FieldValue.serverTimestamp(),
        platform: 'web',
        tokenStatus: 'active'
      });
    
    console.log(`FCM 토큰 저장 완료: ${targetUserId}`);
    
    return { 
      success: true, 
      message: 'FCM 토큰이 성공적으로 저장되었습니다.',
      userId: targetUserId
    };
    
  } catch (error) {
    console.error('FCM 토큰 저장 실패:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// FCM 토큰 삭제
exports.deleteFCMToken = functions.https.onCall(async (data, context) => {
  try {
    const { userId } = data;
    
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    
    const requestUserId = context.auth.uid;
    const targetUserId = userId || requestUserId;
    
    // 권한 확인
    if (userId && userId !== requestUserId) {
      throw new functions.https.HttpsError('permission-denied', '다른 사용자의 토큰을 삭제할 수 없습니다.');
    }
    
    console.log(`FCM 토큰 삭제 시작: ${targetUserId}`);
    
    // Firestore에서 토큰 삭제
    await admin.firestore()
      .collection('users')
      .doc(targetUserId)
      .update({
        fcmToken: admin.firestore.FieldValue.delete(),
        tokenStatus: 'inactive',
        lastTokenUpdate: admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log(`FCM 토큰 삭제 완료: ${targetUserId}`);
    
    return { 
      success: true, 
      message: 'FCM 토큰이 성공적으로 삭제되었습니다.',
      userId: targetUserId
    };
    
  } catch (error) {
    console.error('FCM 토큰 삭제 실패:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// FCM 토큰 유효성 검증
exports.validateFCMToken = functions.https.onCall(async (data, context) => {
  try {
    const { token } = data;
    
    if (!token) {
      throw new functions.https.HttpsError('invalid-argument', 'FCM 토큰이 필요합니다.');
    }
    
    console.log('FCM 토큰 유효성 검증 시작');
    
    // 테스트 메시지 전송으로 토큰 유효성 확인
    const message = {
      token: token,
      data: {
        test: 'validation',
        timestamp: Date.now().toString()
      }
    };
    
    const response = await admin.messaging().send(message);
    
    console.log('FCM 토큰 유효성 검증 완료:', response);
    
    return { 
      success: true, 
      message: 'FCM 토큰이 유효합니다.',
      messageId: response
    };
    
  } catch (error) {
    console.error('FCM 토큰 유효성 검증 실패:', error);
    
    // 토큰이 유효하지 않은 경우
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      throw new functions.https.HttpsError('invalid-argument', '유효하지 않은 FCM 토큰입니다.');
    }
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 사용자별 FCM 토큰 조회
exports.getFCMToken = functions.https.onCall(async (data, context) => {
  try {
    const { userId } = data;
    
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    
    const requestUserId = context.auth.uid;
    const targetUserId = userId || requestUserId;
    
    // 권한 확인 (본인 또는 관리자만 조회 가능)
    if (userId && userId !== requestUserId && !context.auth.token.admin) {
      throw new functions.https.HttpsError('permission-denied', '다른 사용자의 토큰을 조회할 수 없습니다.');
    }
    
    console.log(`FCM 토큰 조회 시작: ${targetUserId}`);
    
    // Firestore에서 사용자 정보 조회
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(targetUserId)
      .get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', '사용자를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;
    
    console.log(`FCM 토큰 조회 완료: ${targetUserId}`);
    
    return { 
      success: true, 
      hasToken: !!fcmToken,
      lastUpdate: userData.lastTokenUpdate,
      platform: userData.platform,
      tokenStatus: userData.tokenStatus
    };
    
  } catch (error) {
    console.error('FCM 토큰 조회 실패:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 만료된 FCM 토큰 정리 (관리자용)
exports.cleanupExpiredTokens = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
    }
    
    console.log('만료된 FCM 토큰 정리 시작');
    
    // 30일 이상 업데이트되지 않은 토큰 조회
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const expiredTokensQuery = await admin.firestore()
      .collection('users')
      .where('lastTokenUpdate', '<', thirtyDaysAgo)
      .where('fcmToken', '!=', null)
      .get();
    
    const batch = admin.firestore().batch();
    let cleanupCount = 0;
    
    expiredTokensQuery.docs.forEach(doc => {
      batch.update(doc.ref, {
        fcmToken: admin.firestore.FieldValue.delete(),
        tokenStatus: 'expired',
        lastTokenUpdate: admin.firestore.FieldValue.serverTimestamp()
      });
      cleanupCount++;
    });
    
    await batch.commit();
    
    console.log(`만료된 FCM 토큰 정리 완료: ${cleanupCount}개`);
    
    return { 
      success: true, 
      message: `${cleanupCount}개의 만료된 FCM 토큰이 정리되었습니다.`,
      cleanupCount: cleanupCount
    };
    
  } catch (error) {
    console.error('만료된 FCM 토큰 정리 실패:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// FCM 토큰 통계 (관리자용)
exports.getFCMTokenStats = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
    }
    
    console.log('FCM 토큰 통계 조회 시작');
    
    // 전체 사용자 수
    const totalUsers = await admin.firestore()
      .collection('users')
      .count()
      .get();
    
    // FCM 토큰이 있는 사용자 수
    const usersWithToken = await admin.firestore()
      .collection('users')
      .where('fcmToken', '!=', null)
      .count()
      .get();
    
    // 활성 토큰 수
    const activeTokens = await admin.firestore()
      .collection('users')
      .where('tokenStatus', '==', 'active')
      .count()
      .get();
    
    const stats = {
      totalUsers: totalUsers.data().count,
      usersWithToken: usersWithToken.data().count,
      activeTokens: activeTokens.data().count,
      tokenRate: totalUsers.data().count > 0 ? 
        (usersWithToken.data().count / totalUsers.data().count * 100).toFixed(2) : 0
    };
    
    console.log('FCM 토큰 통계 조회 완료:', stats);
    
    return { 
      success: true, 
      stats: stats
    };
    
  } catch (error) {
    console.error('FCM 토큰 통계 조회 실패:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

module.exports = {
  saveFCMToken: exports.saveFCMToken,
  deleteFCMToken: exports.deleteFCMToken,
  validateFCMToken: exports.validateFCMToken,
  getFCMToken: exports.getFCMToken,
  cleanupExpiredTokens: exports.cleanupExpiredTokens,
  getFCMTokenStats: exports.getFCMTokenStats
}; 