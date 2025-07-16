const admin = require("firebase-admin");
const firestore = admin.firestore();

/**
 * 긴급 수수료를 단계적으로 증가시키는 함수
 * @param {string} jobId - 작업 ID
 * @param {Object} options - 추가 옵션
 * @param {boolean} options.sendNotification - 알림 발송 여부 (기본값: true)
 * @param {boolean} options.logActivity - 활동 로그 기록 여부 (기본값: true)
 * @param {number} options.customStep - 커스텀 증가 단계 (기본값: null)
 * @returns {Promise<Object>} 증가 결과 정보
 */
async function increaseUrgentFee(jobId, options = {}) {
  const {
    sendNotification = true,
    logActivity = true,
    customStep = null
  } = options;

  const startTime = Date.now();
  let result = {
    success: false,
    jobId,
    increased: false,
    oldPercent: 0,
    newPercent: 0,
    maxReached: false,
    error: null,
    processingTime: 0
  };

  try {
    // 입력 검증
    if (!jobId || typeof jobId !== 'string') {
      throw new Error('유효하지 않은 작업 ID입니다.');
    }

    console.log(`[${new Date().toISOString()}] 긴급 수수료 증가 시작: Job ${jobId}`);

    // 작업 데이터 조회
    const jobRef = firestore.collection("jobs").doc(jobId);
    const jobSnap = await jobRef.get();

    if (!jobSnap.exists) {
      throw new Error(`작업을 찾을 수 없습니다: ${jobId}`);
    }

    const jobData = jobSnap.data();
    result.oldPercent = jobData.currentUrgentFeePercent || jobData.urgentFeePercent || 0;

    // 작업 상태 검증
    if (jobData.status !== "open") {
      result.success = true;
      result.error = `작업이 열린 상태가 아닙니다. 현재 상태: ${jobData.status}`;
      console.log(`[${new Date().toISOString()}] 작업 상태 검증 실패: ${result.error}`);
      return result;
    }

    // 긴급 수수료 설정 검증
    if (!jobData.urgentFeePercent && !jobData.currentUrgentFeePercent) {
      throw new Error('긴급 수수료 설정이 없습니다.');
    }

    const currentPercent = jobData.currentUrgentFeePercent || jobData.urgentFeePercent;
    const maxPercent = jobData.urgentFeeMaxPercent || 50; // 기본 최대값 50%
    const step = customStep || jobData.urgentFeeIncreaseStep || 5; // 기본 증가 단계 5%

    // 최대값 도달 확인
    if (currentPercent >= maxPercent) {
      result.success = true;
      result.maxReached = true;
      result.newPercent = currentPercent;
      console.log(`[${new Date().toISOString()}] 최대 긴급 수수료에 도달: ${currentPercent}%`);
      return result;
    }

    // 새로운 수수료 계산
    const newPercent = Math.min(currentPercent + step, maxPercent);
    const maxReached = newPercent >= maxPercent;

    // 수수료 변경 확인
    if (newPercent === currentPercent) {
      result.success = true;
      result.newPercent = currentPercent;
      console.log(`[${new Date().toISOString()}] 긴급 수수료 변경 없음: ${currentPercent}%`);
      return result;
    }

    // 배치 작업으로 데이터 업데이트
    const batch = firestore.batch();
    
    // 작업 데이터 업데이트
    const updateData = {
      currentUrgentFeePercent: newPercent,
      urgentFeeLastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      urgentFeeIncreaseCount: (jobData.urgentFeeIncreaseCount || 0) + 1
    };

    // 최대값 도달 시 추가 정보
    if (maxReached) {
      updateData.urgentFeeMaxReachedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    batch.update(jobRef, updateData);

    // 활동 로그 기록
    if (logActivity) {
      const activityRef = firestore.collection("jobActivities").doc();
      const activityData = {
        jobId,
        type: "urgent_fee_increase",
        oldValue: currentPercent,
        newValue: newPercent,
        increaseStep: step,
        maxReached,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: "system",
        metadata: {
          previousIncreaseCount: jobData.urgentFeeIncreaseCount || 0,
          maxPercent,
          processingTime: Date.now() - startTime
        }
      };
      batch.set(activityRef, activityData);
    }

    // 알림 발송
    if (sendNotification) {
      try {
        await sendUrgentFeeNotification(jobId, jobData, currentPercent, newPercent, maxReached);
      } catch (notificationError) {
        console.error(`[${new Date().toISOString()}] 알림 발송 실패:`, notificationError);
        // 알림 실패는 전체 프로세스를 중단하지 않음
      }
    }

    // 배치 커밋
    await batch.commit();

    // 결과 업데이트
    result.success = true;
    result.increased = true;
    result.newPercent = newPercent;
    result.maxReached = maxReached;
    result.processingTime = Date.now() - startTime;

    console.log(`[${new Date().toISOString()}] 긴급 수수료 증가 완료: Job ${jobId}, ${currentPercent}% → ${newPercent}% (처리시간: ${result.processingTime}ms)`);

    // 통계 업데이트
    await updateUrgentFeeStatistics(jobId, currentPercent, newPercent, maxReached);

  } catch (error) {
    result.error = error.message;
    result.processingTime = Date.now() - startTime;
    
    console.error(`[${new Date().toISOString()}] 긴급 수수료 증가 실패: Job ${jobId}`, error);
    
    // 에러 로그 기록
    await logError('increaseUrgentFee', {
      jobId,
      error: error.message,
      stack: error.stack,
      processingTime: result.processingTime
    });
  }

  return result;
}

/**
 * 긴급 수수료 증가 알림 발송
 */
async function sendUrgentFeeNotification(jobId, jobData, oldPercent, newPercent, maxReached) {
  try {
    // 작업 관련자 조회
    const participants = await getJobParticipants(jobId);
    
    const notificationData = {
      type: "urgent_fee_increase",
      jobId,
      title: "긴급 수수료 증가 알림",
      body: maxReached 
        ? `긴급 수수료가 최대값(${newPercent}%)에 도달했습니다.`
        : `긴급 수수료가 ${oldPercent}%에서 ${newPercent}%로 증가했습니다.`,
      data: {
        jobId,
        oldPercent,
        newPercent,
        maxReached,
        jobTitle: jobData.title || "작업"
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    // 각 참여자에게 알림 발송
    const notificationPromises = participants.map(participant => 
      sendNotificationToUser(participant.userId, notificationData)
    );

    await Promise.allSettled(notificationPromises);

    console.log(`[${new Date().toISOString()}] 긴급 수수료 증가 알림 발송 완료: ${participants.length}명`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 알림 발송 중 오류:`, error);
    throw error;
  }
}

/**
 * 작업 참여자 조회
 */
async function getJobParticipants(jobId) {
  try {
    const participantsRef = firestore.collection("jobs").doc(jobId).collection("participants");
    const participantsSnap = await participantsRef.get();
    
    const participants = [];
    participantsSnap.forEach(doc => {
      participants.push({
        userId: doc.id,
        ...doc.data()
      });
    });

    return participants;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 작업 참여자 조회 실패:`, error);
    return [];
  }
}

/**
 * 사용자에게 알림 발송
 */
async function sendNotificationToUser(userId, notificationData) {
  try {
    // 사용자의 FCM 토큰 조회
    const userRef = firestore.collection("users").doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      console.log(`[${new Date().toISOString()}] 사용자를 찾을 수 없음: ${userId}`);
      return;
    }

    const userData = userSnap.data();
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.log(`[${new Date().toISOString()}] FCM 토큰이 없음: ${userId}`);
      return;
    }

    // 알림 데이터를 Firestore에 저장
    const notificationRef = firestore.collection("notifications").doc();
    await notificationRef.set({
      userId,
      ...notificationData,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // FCM 발송 (별도 함수에서 처리)
    // await sendFCMNotification(fcmTokens, notificationData);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 사용자 알림 발송 실패: ${userId}`, error);
    throw error;
  }
}

/**
 * 긴급 수수료 통계 업데이트
 */
async function updateUrgentFeeStatistics(jobId, oldPercent, newPercent, maxReached) {
  try {
    const statsRef = firestore.collection("statistics").doc("urgentFees");
    
    await statsRef.set({
      totalIncreases: admin.firestore.FieldValue.increment(1),
      totalIncreaseAmount: admin.firestore.FieldValue.increment(newPercent - oldPercent),
      maxReachedCount: admin.firestore.FieldValue.increment(maxReached ? 1 : 0),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`[${new Date().toISOString()}] 긴급 수수료 통계 업데이트 완료`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 통계 업데이트 실패:`, error);
    // 통계 업데이트 실패는 전체 프로세스를 중단하지 않음
  }
}

/**
 * 에러 로그 기록
 */
async function logError(functionName, errorData) {
  try {
    const errorRef = firestore.collection("errorLogs").doc();
    await errorRef.set({
      functionName,
      ...errorData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 에러 로그 기록 실패:`, error);
  }
}

/**
 * 여러 작업의 긴급 수수료를 일괄 증가
 */
async function batchIncreaseUrgentFees(jobIds, options = {}) {
  const results = [];
  const batchSize = options.batchSize || 10;
  
  console.log(`[${new Date().toISOString()}] 일괄 긴급 수수료 증가 시작: ${jobIds.length}개 작업`);

  for (let i = 0; i < jobIds.length; i += batchSize) {
    const batch = jobIds.slice(i, i + batchSize);
    const batchPromises = batch.map(jobId => increaseUrgentFee(jobId, options));
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' ? result.value : { success: false, error: result.reason.message }
    ));

    // 배치 간 지연 (Firestore 제한 고려)
    if (i + batchSize < jobIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const summary = {
    total: jobIds.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    increased: results.filter(r => r.increased).length,
    maxReached: results.filter(r => r.maxReached).length,
    results
  };

  console.log(`[${new Date().toISOString()}] 일괄 긴급 수수료 증가 완료:`, summary);
  return summary;
}

/**
 * 긴급 수수료 증가 조건 확인
 */
async function checkUrgentFeeIncreaseConditions(jobId) {
  try {
    const jobRef = firestore.collection("jobs").doc(jobId);
    const jobSnap = await jobRef.get();

    if (!jobSnap.exists) {
      return { canIncrease: false, reason: "작업을 찾을 수 없습니다." };
    }

    const jobData = jobSnap.data();
    const currentPercent = jobData.currentUrgentFeePercent || jobData.urgentFeePercent || 0;
    const maxPercent = jobData.urgentFeeMaxPercent || 50;

    // 조건 확인
    const conditions = {
      isOpen: jobData.status === "open",
      notMaxReached: currentPercent < maxPercent,
      hasUrgentFee: !!(jobData.urgentFeePercent || jobData.currentUrgentFeePercent),
      timeElapsed: true // 시간 조건은 별도 로직에서 확인
    };

    const canIncrease = Object.values(conditions).every(condition => condition);
    const reason = canIncrease ? null : Object.entries(conditions)
      .filter(([key, value]) => !value)
      .map(([key]) => key)
      .join(", ");

    return { canIncrease, reason, conditions, currentPercent, maxPercent };

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 조건 확인 실패:`, error);
    return { canIncrease: false, reason: error.message };
  }
}

module.exports = {
  increaseUrgentFee,
  batchIncreaseUrgentFees,
  checkUrgentFeeIncreaseConditions
}; 