const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * 등급 변경 로그 기록 함수
 * @param {string} contractorId - 계약자 ID
 * @param {number} oldLevel - 기존 등급
 * @param {number} newLevel - 새로운 등급
 * @param {string} reason - 변경 사유 (선택적)
 * @param {string} adminId - 관리자 ID (선택적)
 * @param {string} evaluationId - 평가 ID (선택적)
 */
exports.logGradeChange = functions.https.onCall(async (data, context) => {
  try {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }

    const { contractorId, oldLevel, newLevel, reason, adminId, evaluationId } = data;

    // 입력값 검증
    if (!contractorId) {
      throw new functions.https.HttpsError('invalid-argument', '계약자 ID가 필요합니다.');
    }

    if (typeof oldLevel !== 'number' || typeof newLevel !== 'number') {
      throw new functions.https.HttpsError('invalid-argument', '등급은 숫자여야 합니다.');
    }

    if (oldLevel < 1 || oldLevel > 5 || newLevel < 1 || newLevel > 5) {
      throw new functions.https.HttpsError('invalid-argument', '등급은 1-5 사이의 값이어야 합니다.');
    }

    // 계약자 정보 조회
    const contractorDoc = await admin.firestore()
      .collection('contractors')
      .doc(contractorId)
      .get();

    if (!contractorDoc.exists) {
      throw new functions.https.HttpsError('not-found', '계약자를 찾을 수 없습니다.');
    }

    const contractorData = contractorDoc.data();
    const contractorName = contractorData.name || contractorData.displayName || '';

    // 변경 유형 계산
    let changeType = 'same';
    if (newLevel > oldLevel) {
      changeType = 'upgrade';
    } else if (newLevel < oldLevel) {
      changeType = 'downgrade';
    }

    // 로그 데이터 생성
    const logData = {
      contractorId,
      contractorName,
      oldLevel,
      newLevel,
      changeType,
      reason: reason || '평점 업데이트',
      adminId: adminId || context.auth.uid,
      evaluationId: evaluationId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // gradeChangeLogs 컬렉션에 저장
    const logRef = await admin.firestore()
      .collection('gradeChangeLogs')
      .add(logData);

    // 기존 levelChangeNotifications 컬렉션에도 호환성을 위해 저장
    const notificationData = {
      contractorId,
      oldLevel,
      newLevel,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      reason: reason || '평점 업데이트',
      logId: logRef.id // 참조용 ID
    };

    await admin.firestore()
      .collection('levelChangeNotifications')
      .add(notificationData);

    // 계약자 문서 업데이트
    await admin.firestore()
      .collection('contractors')
      .doc(contractorId)
      .update({
        level: newLevel,
        lastGradeChange: admin.firestore.FieldValue.serverTimestamp(),
        gradeChangeHistory: admin.firestore.FieldValue.arrayUnion({
          oldLevel,
          newLevel,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          reason: reason || '평점 업데이트',
          adminId: adminId || context.auth.uid
        })
      });

    // 로그 기록
    console.log(`Grade change logged: ${contractorId} ${oldLevel} -> ${newLevel}`, {
      logId: logRef.id,
      adminId: adminId || context.auth.uid,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      logId: logRef.id,
      message: '등급 변경이 성공적으로 기록되었습니다.'
    };

  } catch (error) {
    console.error('Grade change logging error:', error);
    throw new functions.https.HttpsError('internal', '등급 변경 로그 기록 중 오류가 발생했습니다.');
  }
});

/**
 * 등급 변경 로그 조회 함수
 */
exports.getGradeChangeLogs = functions.https.onCall(async (data, context) => {
  try {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }

    const { 
      limit = 20, 
      startAfter, 
      filters = {},
      orderBy = 'timestamp',
      orderDirection = 'desc'
    } = data;

    let query = admin.firestore().collection('gradeChangeLogs');

    // 필터 적용
    if (filters.level) {
      query = query.where('newLevel', '==', parseInt(filters.level));
    }

    if (filters.changeType) {
      query = query.where('changeType', '==', filters.changeType);
    }

    if (filters.contractorId) {
      query = query.where('contractorId', '==', filters.contractorId);
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          break;
      }
      
      if (startDate) {
        query = query.where('timestamp', '>=', startDate);
      }
    }

    // 정렬
    query = query.orderBy(orderBy, orderDirection);

    // 페이지네이션
    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    const logs = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || data.timestamp
      });
    });

    return {
      success: true,
      logs,
      hasMore: logs.length === limit
    };

  } catch (error) {
    console.error('Get grade change logs error:', error);
    throw new functions.https.HttpsError('internal', '등급 변경 로그 조회 중 오류가 발생했습니다.');
  }
});

/**
 * 등급 변경 통계 조회 함수
 */
exports.getGradeChangeStats = functions.https.onCall(async (data, context) => {
  try {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }

    const { dateRange = 'all' } = data;

    let query = admin.firestore().collection('gradeChangeLogs');

    // 날짜 필터 적용
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          break;
      }
      
      if (startDate) {
        query = query.where('timestamp', '>=', startDate);
      }
    }

    const snapshot = await query.get();
    
    let totalChanges = 0;
    let upgrades = 0;
    let downgrades = 0;
    let sameLevel = 0;
    const levelStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    snapshot.forEach(doc => {
      const data = doc.data();
      totalChanges++;
      
      if (data.changeType === 'upgrade') upgrades++;
      else if (data.changeType === 'downgrade') downgrades++;
      else sameLevel++;

      if (data.newLevel) {
        levelStats[data.newLevel] = (levelStats[data.newLevel] || 0) + 1;
      }
    });

    return {
      success: true,
      stats: {
        totalChanges,
        upgrades,
        downgrades,
        sameLevel,
        levelStats
      }
    };

  } catch (error) {
    console.error('Get grade change stats error:', error);
    throw new functions.https.HttpsError('internal', '등급 변경 통계 조회 중 오류가 발생했습니다.');
  }
});

/**
 * 등급 변경 로그 삭제 함수 (관리자용)
 */
exports.deleteGradeChangeLog = functions.https.onCall(async (data, context) => {
  try {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }

    // 관리자 권한 확인
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(context.auth.uid)
      .get();

    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
    }

    const { logId } = data;

    if (!logId) {
      throw new functions.https.HttpsError('invalid-argument', '로그 ID가 필요합니다.');
    }

    // 로그 삭제
    await admin.firestore()
      .collection('gradeChangeLogs')
      .doc(logId)
      .delete();

    // 호환성을 위한 levelChangeNotifications도 삭제
    const notificationSnapshot = await admin.firestore()
      .collection('levelChangeNotifications')
      .where('logId', '==', logId)
      .get();

    const deletePromises = notificationSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    return {
      success: true,
      message: '등급 변경 로그가 삭제되었습니다.'
    };

  } catch (error) {
    console.error('Delete grade change log error:', error);
    throw new functions.https.HttpsError('internal', '등급 변경 로그 삭제 중 오류가 발생했습니다.');
  }
}); 