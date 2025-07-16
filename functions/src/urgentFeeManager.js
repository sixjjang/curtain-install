const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * 긴급 수수료 자동 인상 함수 (10분마다 실행)
 * 오픈 상태의 시공건에 대해 긴급 수수료를 자동으로 인상합니다.
 */
exports.increaseUrgentFee = functions.pubsub.schedule('every 10 minutes').onRun(async (context) => {
  const startTime = Date.now();
  const batchSize = 500; // 한 번에 처리할 최대 문서 수
  let totalProcessed = 0;
  let totalIncreased = 0;
  let totalErrors = 0;
  const errors = [];

  try {
    console.log('=== 긴급 수수료 자동 인상 시작 ===');
    console.log(`실행 시간: ${new Date().toISOString()}`);

    const now = admin.firestore.Timestamp.now();
    const jobsRef = admin.firestore().collection("jobs");
    
    // 오픈 상태의 시공건만 조회
    let query = jobsRef.where("status", "==", "open");
    
    // 긴급 수수료 인상이 활성화된 건만 필터링
    query = query.where("urgentFeeEnabled", "==", true);

    let lastDoc = null;
    let hasMore = true;

    while (hasMore) {
      try {
        // 페이지네이션을 위한 쿼리 구성
        let currentQuery = query.limit(batchSize);
        if (lastDoc) {
          currentQuery = currentQuery.startAfter(lastDoc);
        }

        const snapshot = await currentQuery.get();
        
        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        // 배치 업데이트를 위한 배열
        const batchUpdates = [];
        const batch = admin.firestore().batch();

        snapshot.forEach((doc) => {
          try {
            const job = doc.data();
            totalProcessed++;

            // 필수 필드 검증
            if (!job.urgentFeeIncreaseStartAt || !job.urgentFeePercent || !job.maxUrgentFeePercent) {
              console.warn(`시공건 ${doc.id}: 필수 긴급 수수료 필드 누락`);
              return;
            }

            // 경과 시간 계산
            const elapsed = now.seconds - job.urgentFeeIncreaseStartAt.seconds;
            
            if (elapsed > 0) {
              // 10분(600초)마다 인상
              const increments = Math.floor(elapsed / 600);
              const increasePercent = increments * 5; // 5%씩 인상
              const newUrgentFee = Math.min(
                job.urgentFeePercent + increasePercent,
                job.maxUrgentFeePercent
              );

              // 현재 긴급 수수료보다 높은 경우에만 업데이트
              if (newUrgentFee > (job.currentUrgentFeePercent || job.urgentFeePercent)) {
                const updateData = {
                  currentUrgentFeePercent: newUrgentFee,
                  lastUrgentFeeUpdate: now,
                  urgentFeeIncreaseCount: (job.urgentFeeIncreaseCount || 0) + 1
                };

                batchUpdates.push({
                  jobId: doc.id,
                  oldFee: job.currentUrgentFeePercent || job.urgentFeePercent,
                  newFee: newUrgentFee,
                  increaseAmount: newUrgentFee - (job.currentUrgentFeePercent || job.urgentFeePercent)
                });

                batch.update(doc.ref, updateData);
                totalIncreased++;

                console.log(`시공건 ${doc.id}: 긴급 수수료 ${updateData.oldFee}% → ${newUrgentFee}% 인상`);
              }
            }

          } catch (docError) {
            totalErrors++;
            const errorInfo = {
              jobId: doc.id,
              error: docError.message,
              timestamp: new Date().toISOString()
            };
            errors.push(errorInfo);
            console.error(`시공건 ${doc.id} 처리 중 오류:`, docError);
          }
        });

        // 배치 커밋
        if (batchUpdates.length > 0) {
          await batch.commit();
          console.log(`${batchUpdates.length}개 시공건 긴급 수수료 업데이트 완료`);
        }

        // 다음 페이지를 위한 마지막 문서 저장
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        hasMore = snapshot.docs.length === batchSize;

      } catch (batchError) {
        totalErrors++;
        errors.push({
          batch: 'batch_processing',
          error: batchError.message,
          timestamp: new Date().toISOString()
        });
        console.error('배치 처리 중 오류:', batchError);
        hasMore = false;
      }
    }

    // 통계 로그 기록
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    const stats = {
      totalProcessed,
      totalIncreased,
      totalErrors,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
      errors: errors.slice(0, 10) // 최대 10개 오류만 저장
    };

    // 통계를 Firestore에 저장
    await admin.firestore()
      .collection('urgentFeeStats')
      .add({
        ...stats,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    console.log('=== 긴급 수수료 자동 인상 완료 ===');
    console.log(`처리된 시공건: ${totalProcessed}개`);
    console.log(`인상된 시공건: ${totalIncreased}개`);
    console.log(`오류 발생: ${totalErrors}개`);
    console.log(`실행 시간: ${executionTime}ms`);

    // 오류가 있는 경우 알림 발송
    if (totalErrors > 0) {
      await sendErrorNotification(stats);
    }

    return {
      success: true,
      stats,
      message: `긴급 수수료 인상 완료: ${totalIncreased}/${totalProcessed}건 처리됨`
    };

  } catch (error) {
    console.error('긴급 수수료 인상 함수 실행 중 치명적 오류:', error);
    
    // 오류 통계 저장
    await admin.firestore()
      .collection('urgentFeeStats')
      .add({
        totalProcessed,
        totalIncreased,
        totalErrors: totalErrors + 1,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        criticalError: error.message,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    // 치명적 오류 알림 발송
    await sendCriticalErrorNotification(error);

    throw error;
  }
});

/**
 * 긴급 수수료 수동 인상 함수 (관리자용)
 */
exports.manualIncreaseUrgentFee = functions.https.onCall(async (data, context) => {
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

    const { jobId, increasePercent = 5, reason = '관리자 수동 인상' } = data;

    if (!jobId) {
      throw new functions.https.HttpsError('invalid-argument', '시공건 ID가 필요합니다.');
    }

    // 시공건 조회
    const jobDoc = await admin.firestore()
      .collection('jobs')
      .doc(jobId)
      .get();

    if (!jobDoc.exists) {
      throw new functions.https.HttpsError('not-found', '시공건을 찾을 수 없습니다.');
    }

    const job = jobDoc.data();
    const currentFee = job.currentUrgentFeePercent || job.urgentFeePercent;
    const newFee = Math.min(currentFee + increasePercent, job.maxUrgentFeePercent);

    if (newFee <= currentFee) {
      throw new functions.https.HttpsError('invalid-argument', '최대 긴급 수수료에 도달했습니다.');
    }

    // 긴급 수수료 업데이트
    await jobDoc.ref.update({
      currentUrgentFeePercent: newFee,
      lastUrgentFeeUpdate: admin.firestore.FieldValue.serverTimestamp(),
      urgentFeeIncreaseCount: (job.urgentFeeIncreaseCount || 0) + 1,
      manualIncreaseHistory: admin.firestore.FieldValue.arrayUnion({
        oldFee: currentFee,
        newFee: newFee,
        increasePercent,
        reason,
        adminId: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      })
    });

    // 로그 기록
    console.log(`수동 긴급 수수료 인상: ${jobId} ${currentFee}% → ${newFee}% (${reason})`);

    return {
      success: true,
      jobId,
      oldFee: currentFee,
      newFee,
      increasePercent,
      message: '긴급 수수료가 성공적으로 인상되었습니다.'
    };

  } catch (error) {
    console.error('수동 긴급 수수료 인상 오류:', error);
    throw new functions.https.HttpsError('internal', '긴급 수수료 인상 중 오류가 발생했습니다.');
  }
});

/**
 * 긴급 수수료 통계 조회 함수
 */
exports.getUrgentFeeStats = functions.https.onCall(async (data, context) => {
  try {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }

    const { dateRange = 'week' } = data;

    let startDate;
    const now = new Date();
    
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
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 통계 조회
    const statsSnapshot = await admin.firestore()
      .collection('urgentFeeStats')
      .where('timestamp', '>=', startDate.toISOString())
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const stats = [];
    let totalProcessed = 0;
    let totalIncreased = 0;
    let totalErrors = 0;

    statsSnapshot.forEach(doc => {
      const data = doc.data();
      stats.push(data);
      totalProcessed += data.totalProcessed || 0;
      totalIncreased += data.totalIncreased || 0;
      totalErrors += data.totalErrors || 0;
    });

    return {
      success: true,
      stats,
      summary: {
        totalProcessed,
        totalIncreased,
        totalErrors,
        successRate: totalProcessed > 0 ? ((totalProcessed - totalErrors) / totalProcessed * 100).toFixed(2) : 0
      }
    };

  } catch (error) {
    console.error('긴급 수수료 통계 조회 오류:', error);
    throw new functions.https.HttpsError('internal', '통계 조회 중 오류가 발생했습니다.');
  }
});

/**
 * 오류 알림 발송 함수
 */
async function sendErrorNotification(stats) {
  try {
    // 관리자에게 오류 알림 발송
    const adminUsers = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .where('notifications.enabled', '==', true)
      .get();

    const notificationPromises = adminUsers.docs.map(doc => {
      const userData = doc.data();
      return admin.firestore()
        .collection('notifications')
        .add({
          userId: doc.id,
          type: 'urgent_fee_error',
          title: '긴급 수수료 인상 오류 발생',
          message: `${stats.totalErrors}개의 오류가 발생했습니다.`,
          data: {
            totalProcessed: stats.totalProcessed,
            totalErrors: stats.totalErrors,
            executionTime: stats.executionTimeMs
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        });
    });

    await Promise.all(notificationPromises);
    console.log(`${adminUsers.docs.length}명의 관리자에게 오류 알림 발송됨`);

  } catch (error) {
    console.error('오류 알림 발송 실패:', error);
  }
}

/**
 * 치명적 오류 알림 발송 함수
 */
async function sendCriticalErrorNotification(error) {
  try {
    // 관리자에게 치명적 오류 알림 발송
    const adminUsers = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .where('notifications.enabled', '==', true)
      .get();

    const notificationPromises = adminUsers.docs.map(doc => {
      return admin.firestore()
        .collection('notifications')
        .add({
          userId: doc.id,
          type: 'urgent_fee_critical_error',
          title: '긴급 수수료 인상 함수 치명적 오류',
          message: '긴급 수수료 인상 함수가 완전히 실패했습니다.',
          data: {
            error: error.message,
            stack: error.stack
          },
          priority: 'high',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        });
    });

    await Promise.all(notificationPromises);
    console.log(`${adminUsers.docs.length}명의 관리자에게 치명적 오류 알림 발송됨`);

  } catch (notificationError) {
    console.error('치명적 오류 알림 발송 실패:', notificationError);
  }
}

/**
 * 긴급 수수료 설정 업데이트 함수
 */
exports.updateUrgentFeeSettings = functions.https.onCall(async (data, context) => {
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

    const { 
      enabled = true, 
      increaseInterval = 600, // 10분
      increasePercent = 5, 
      maxIncreasePercent = 50 
    } = data;

    // 글로벌 설정 업데이트
    await admin.firestore()
      .collection('settings')
      .doc('urgentFee')
      .set({
        enabled,
        increaseInterval,
        increasePercent,
        maxIncreasePercent,
        updatedBy: context.auth.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    console.log('긴급 수수료 설정 업데이트됨:', {
      enabled,
      increaseInterval,
      increasePercent,
      maxIncreasePercent,
      adminId: context.auth.uid
    });

    return {
      success: true,
      message: '긴급 수수료 설정이 업데이트되었습니다.'
    };

  } catch (error) {
    console.error('긴급 수수료 설정 업데이트 오류:', error);
    throw new functions.https.HttpsError('internal', '설정 업데이트 중 오류가 발생했습니다.');
  }
}); 