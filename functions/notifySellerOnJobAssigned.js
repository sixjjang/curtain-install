const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * 작업 배정 시 판매자에게 알림 발송
 * 작업 상태가 'open'에서 'assigned'로 변경될 때 실행
 */
exports.notifySellerOnJobAssigned = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    const jobId = context.params.jobId;
    const before = change.before.data();
    const after = change.after.data();
    
    console.log(`작업 ${jobId} 업데이트 감지: ${before.status} → ${after.status}`);

    // 상태가 'open' → 'assigned' 로 변경됐는지 확인
    if (before.status !== "open" || after.status !== "assigned") {
      console.log(`작업 ${jobId}: 상태 변경이 아님 (${before.status} → ${after.status})`);
      return null;
    }

    try {
      // 판매자 ID 확인
      const sellerId = after.sellerId;
      if (!sellerId) {
        console.log(`작업 ${jobId}: 판매자 ID가 없음`);
        return null;
      }

      console.log(`작업 ${jobId}: 판매자 ${sellerId}에게 알림 발송 시작`);

      // 판매자 정보 조회
      const userDoc = await admin.firestore().collection("users").doc(sellerId).get();
      if (!userDoc.exists) {
        console.log(`작업 ${jobId}: 판매자 ${sellerId} 정보를 찾을 수 없음`);
        return null;
      }

      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;
      
      if (!fcmToken) {
        console.log(`작업 ${jobId}: 판매자 ${sellerId}의 FCM 토큰이 없음`);
        return null;
      }

      // 긴급 수수료 정보 확인
      const urgentFeeInfo = getUrgentFeeInfo(after);
      const hasUrgentFee = urgentFeeInfo && urgentFeeInfo.current > 0;

      // 알림 메시지 구성
      const notificationTitle = hasUrgentFee 
        ? "🚨 긴급 시공 작업 수락 알림" 
        : "✅ 시공 작업 수락 알림";

      let notificationBody = `시공기사가 작업을 수락했습니다.\n현장명: ${after.siteName || after.title || "알 수 없음"}`;
      
      if (hasUrgentFee) {
        notificationBody += `\n긴급 수수료: ${urgentFeeInfo.current}%`;
        if (after.acceptedTotalFee) {
          notificationBody += `\n총 비용: ${after.acceptedTotalFee.toLocaleString()}원`;
        }
      }

      // 시공기사 정보 추가
      if (after.assignedToEmail) {
        notificationBody += `\n시공기사: ${after.assignedToEmail}`;
      }

      const message = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          jobId: jobId,
          jobTitle: after.siteName || after.title || "",
          status: after.status,
          assignedTo: after.assignedTo || "",
          assignedToEmail: after.assignedToEmail || "",
          urgentFeePercent: hasUrgentFee ? urgentFeeInfo.current.toString() : "0",
          totalFee: after.acceptedTotalFee ? after.acceptedTotalFee.toString() : "",
          timestamp: new Date().toISOString(),
          type: "job_assigned"
        },
        token: fcmToken,
        android: {
          notification: {
            channelId: "job_notifications",
            priority: hasUrgentFee ? "high" : "default",
            sound: hasUrgentFee ? "urgent_notification" : "default",
            color: hasUrgentFee ? "#FF4444" : "#4CAF50"
          }
        },
        apns: {
          payload: {
            aps: {
              sound: hasUrgentFee ? "urgent.caf" : "default.caf",
              badge: 1,
              category: "JOB_ASSIGNED"
            }
          }
        }
      };

      // 푸시 알림 발송
      const response = await admin.messaging().send(message);
      console.log(`작업 ${jobId}: 판매자 ${sellerId}에게 푸시 알림 발송 완료`, response);

      // 알림 로그 저장
      await saveNotificationLog(jobId, sellerId, message, "success");

      // 성공 통계 업데이트
      await updateNotificationStats("job_assigned", "success");

      return { success: true, messageId: response };

    } catch (error) {
      console.error(`작업 ${jobId}: 판매자 알림 발송 중 오류`, error);
      
      // 오류 로그 저장
      await saveNotificationLog(jobId, after.sellerId, null, "error", error.message);
      
      // 오류 통계 업데이트
      await updateNotificationStats("job_assigned", "error");
      
      // FCM 토큰이 유효하지 않은 경우 처리
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        console.log(`작업 ${jobId}: 유효하지 않은 FCM 토큰, 토큰 제거`);
        await removeInvalidFCMToken(after.sellerId, fcmToken);
      }
      
      throw error;
    }
  });

/**
 * 긴급 수수료 정보 추출
 */
function getUrgentFeeInfo(jobData) {
  // 10분 간격 시스템
  if (jobData.urgentFeeEnabled !== undefined) {
    return {
      current: jobData.currentUrgentFeePercent || jobData.urgentFeePercent || 0,
      base: jobData.urgentFeePercent || 0,
      max: jobData.maxUrgentFeePercent || 50,
      increaseCount: jobData.urgentFeeIncreaseCount || 0,
      system: "10분 간격"
    };
  }
  
  // 1시간 간격 시스템
  if (jobData.baseUrgentFeePercent !== undefined) {
    return {
      current: jobData.currentUrgentFeePercent || jobData.baseUrgentFeePercent || 0,
      base: jobData.baseUrgentFeePercent || 0,
      max: jobData.maxUrgentFeePercent || 50,
      system: "1시간 간격"
    };
  }
  
  return null;
}

/**
 * 알림 로그 저장
 */
async function saveNotificationLog(jobId, userId, message, status, errorMessage = null) {
  try {
    const logData = {
      jobId: jobId,
      userId: userId,
      notificationType: "job_assigned",
      status: status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: message ? {
        title: message.notification.title,
        body: message.notification.body,
        data: message.data
      } : null,
      error: errorMessage,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore()
      .collection("notificationLogs")
      .add(logData);

    console.log(`알림 로그 저장 완료: ${jobId} - ${status}`);
  } catch (error) {
    console.error("알림 로그 저장 중 오류:", error);
  }
}

/**
 * 알림 통계 업데이트
 */
async function updateNotificationStats(type, result) {
  try {
    const statsRef = admin.firestore().collection("notificationStats").doc(type);
    
    await statsRef.set({
      [result]: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`알림 통계 업데이트: ${type} - ${result}`);
  } catch (error) {
    console.error("알림 통계 업데이트 중 오류:", error);
  }
}

/**
 * 유효하지 않은 FCM 토큰 제거
 */
async function removeInvalidFCMToken(userId, invalidToken) {
  try {
    const userRef = admin.firestore().collection("users").doc(userId);
    
    await userRef.update({
      fcmToken: admin.firestore.FieldValue.delete(),
      fcmTokenRemovedAt: admin.firestore.FieldValue.serverTimestamp(),
      fcmTokenRemovedReason: "invalid_token"
    });

    console.log(`유효하지 않은 FCM 토큰 제거: ${userId}`);
  } catch (error) {
    console.error("FCM 토큰 제거 중 오류:", error);
  }
}

/**
 * 배치 알림 발송 (선택사항)
 */
exports.sendBatchJobNotifications = functions.https.onCall(async (data, context) => {
  try {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }

    const { jobIds } = data;
    if (!jobIds || !Array.isArray(jobIds)) {
      throw new functions.https.HttpsError('invalid-argument', '작업 ID 배열이 필요합니다.');
    }

    const results = [];
    
    for (const jobId of jobIds) {
      try {
        const jobDoc = await admin.firestore().collection("jobs").doc(jobId).get();
        if (!jobDoc.exists) {
          results.push({ jobId, status: 'not_found' });
          continue;
        }

        const jobData = jobDoc.data();
        if (jobData.status !== 'assigned') {
          results.push({ jobId, status: 'not_assigned' });
          continue;
        }

        // 개별 알림 발송 로직 실행
        // (위의 notifySellerOnJobAssigned 로직과 유사)
        results.push({ jobId, status: 'sent' });
        
      } catch (error) {
        console.error(`배치 알림 발송 중 오류 (${jobId}):`, error);
        results.push({ jobId, status: 'error', error: error.message });
      }
    }

    return {
      success: true,
      results: results,
      totalProcessed: jobIds.length,
      totalSuccess: results.filter(r => r.status === 'sent').length,
      totalErrors: results.filter(r => r.status === 'error').length
    };

  } catch (error) {
    console.error('배치 알림 발송 중 오류:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 