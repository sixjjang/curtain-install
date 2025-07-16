const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const firestore = admin.firestore();
const messaging = admin.messaging();

// FCM 토큰 관리 함수들 import
const fcmTokenManager = require('./fcmTokenManager');

// 작업 상태 관리 함수들 import
const jobStatusManager = require('./jobStatusManager');

// 계약자 등급 결정 유틸리티 (서버 사이드 버전)
const GRADE_CRITERIA = {
  1: { // 브론즈
    name: '브론즈',
    color: 'gray',
    minCompletedJobs: 0,
    minAverageRating: 0,
    minPhotoQualityScore: 0,
    minResponseTime: 120,
    minOnTimeRate: 0,
    minSatisfactionRate: 0,
    description: '기본 서비스 제공'
  },
  2: { // 실버
    name: '실버',
    color: 'blue',
    minCompletedJobs: 10,
    minAverageRating: 3.5,
    minPhotoQualityScore: 3.0,
    minResponseTime: 90,
    minOnTimeRate: 70,
    minSatisfactionRate: 70,
    description: '우선 매칭, 기본 혜택'
  },
  3: { // 골드
    name: '골드',
    color: 'green',
    minCompletedJobs: 25,
    minAverageRating: 4.0,
    minPhotoQualityScore: 4.0,
    minResponseTime: 60,
    minOnTimeRate: 80,
    minSatisfactionRate: 80,
    description: '프리미엄 매칭, 추가 혜택'
  },
  4: { // 플래티넘
    name: '플래티넘',
    color: 'purple',
    minCompletedJobs: 50,
    minAverageRating: 4.3,
    minPhotoQualityScore: 4.5,
    minResponseTime: 45,
    minOnTimeRate: 90,
    minSatisfactionRate: 85,
    description: 'VIP 매칭, 특별 혜택'
  },
  5: { // 다이아몬드
    name: '다이아몬드',
    color: 'yellow',
    minCompletedJobs: 100,
    minAverageRating: 4.5,
    minPhotoQualityScore: 4.8,
    minResponseTime: 30,
    minOnTimeRate: 95,
    minSatisfactionRate: 90,
    description: '최고 등급, 모든 혜택'
  }
};

/**
 * 입력값 유효성 검사
 * @param {Object} params - 입력 파라미터
 * @returns {Object} 검증된 파라미터
 */
function validateInputs(params) {
  const {
    completedJobsCount,
    averageRating,
    photoQualityScore,
    responseTime,
    onTimeRate,
    satisfactionRate
  } = params;

  return {
    completedJobsCount: Math.max(0, Math.min(completedJobsCount || 0, 1000)),
    averageRating: Math.max(0, Math.min(averageRating || 0, 5)),
    photoQualityScore: Math.max(0, Math.min(photoQualityScore || 0, 10)),
    responseTime: Math.max(1, Math.min(responseTime || 120, 480)),
    onTimeRate: Math.max(0, Math.min(onTimeRate || 0, 100)),
    satisfactionRate: Math.max(0, Math.min(satisfactionRate || 0, 100))
  };
}

/**
 * 등급 기준 충족 여부 확인
 * @param {Object} params - 계약자 데이터
 * @param {Object} criteria - 등급 기준
 * @returns {boolean} 기준 충족 여부
 */
function meetsGradeCriteria(params, criteria) {
  return (
    params.completedJobsCount >= criteria.minCompletedJobs &&
    params.averageRating >= criteria.minAverageRating &&
    params.photoQualityScore >= criteria.minPhotoQualityScore &&
    params.responseTime <= criteria.minResponseTime &&
    params.onTimeRate >= criteria.minOnTimeRate &&
    params.satisfactionRate >= criteria.minSatisfactionRate
  );
}

/**
 * 계약자 등급 결정
 * @param {Object} params - 계약자 데이터
 * @returns {number} 등급 (1-5)
 */
function determineContractorLevel(params) {
  const validatedParams = validateInputs(params);

  // 등급별 기준 충족 여부 확인
  for (let level = 5; level >= 1; level--) {
    const criteria = GRADE_CRITERIA[level];
    
    if (meetsGradeCriteria(validatedParams, criteria)) {
      return level;
    }
  }

  return 1; // 기본 등급
}

/**
 * 가중 평점 계산
 * @param {Object} params - 계약자 데이터
 * @returns {number} 가중 평점 (0-100)
 */
function calculateWeightedScore(params) {
  const validatedParams = validateInputs(params);
  
  const WEIGHTS = {
    completedJobsCount: 0.25,
    averageRating: 0.30,
    photoQualityScore: 0.20,
    responseTime: 0.15,
    onTimeRate: 0.10
  };
  
  // 응답 시간 점수 (빠를수록 높은 점수)
  const responseTimeScore = Math.max(0, 100 - (validatedParams.responseTime / 2));
  
  // 각 항목별 점수 계산
  const scores = {
    completedJobsCount: Math.min(100, (validatedParams.completedJobsCount / 100) * 100),
    averageRating: (validatedParams.averageRating / 5) * 100,
    photoQualityScore: (validatedParams.photoQualityScore / 10) * 100,
    responseTime: responseTimeScore,
    onTimeRate: validatedParams.onTimeRate
  };

  // 가중 평균 계산
  const weightedScore = Object.entries(WEIGHTS).reduce((total, [key, weight]) => {
    return total + (scores[key] * weight);
  }, 0);

  return Math.round(weightedScore * 100) / 100;
}

/**
 * 계약자 통계 업데이트
 * @param {string} contractorId - 계약자 ID
 * @param {Object} rating - 새로운 평점 데이터
 */
async function updateContractorStatistics(contractorId, rating) {
  try {
    const contractorRef = firestore.collection("contractors").doc(contractorId);
    const contractorSnap = await contractorRef.get();

    if (!contractorSnap.exists) {
      console.log(`Contractor ${contractorId} not found`);
      return null;
    }

    const contractorData = contractorSnap.data();
    
    // 기존 평점 데이터 가져오기
    const ratingsRef = firestore.collection("ratings");
    const ratingsQuery = await ratingsRef
      .where("targetId", "==", contractorId)
      .where("targetType", "==", "contractor")
      .get();

    const ratings = ratingsQuery.docs.map(doc => doc.data());
    
    // 통계 계산
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / totalRatings 
      : 0;

    // 완료 작업 수 계산 (별도 로직 필요)
    const completedJobsCount = contractorData.completedJobsCount || 0;
    
    // 사진 품질 점수 (별도 로직 필요)
    const photoQualityScore = contractorData.photoQualityScore || 0;
    
    // 응답 시간 (별도 로직 필요)
    const responseTime = contractorData.responseTime || 120;
    
    // 시간 준수율 (별도 로직 필요)
    const onTimeRate = contractorData.onTimeRate || 0;
    
    // 고객 만족도 (별도 로직 필요)
    const satisfactionRate = contractorData.satisfactionRate || 0;

    // 새로운 등급 결정
    const newLevel = determineContractorLevel({
      completedJobsCount,
      averageRating,
      photoQualityScore,
      responseTime,
      onTimeRate,
      satisfactionRate
    });

    // 가중 점수 계산
    const weightedScore = calculateWeightedScore({
      completedJobsCount,
      averageRating,
      photoQualityScore,
      responseTime,
      onTimeRate,
      satisfactionRate
    });

    // 업데이트할 데이터 준비
    const updateData = {
      rating: averageRating,
      totalRatings: totalRatings,
      level: newLevel,
      weightedScore: weightedScore,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    // 등급 변경 시 추가 정보
    const oldLevel = contractorData.level || 1;
    if (newLevel !== oldLevel) {
      updateData.previousLevel = oldLevel;
      updateData.levelChangedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.levelChangeReason = 'rating_update';
    }

    // 계약자 정보 업데이트
    await contractorRef.update(updateData);

    // 등급 변경 로그 기록
    if (newLevel !== oldLevel) {
      await firestore.collection("gradeChangeLogs").add({
        contractorId: contractorId,
        oldLevel: oldLevel,
        newLevel: newLevel,
        oldGradeName: GRADE_CRITERIA[oldLevel]?.name || 'Unknown',
        newGradeName: GRADE_CRITERIA[newLevel]?.name || 'Unknown',
        reason: 'rating_update',
        ratingId: rating.id || context.params.ratingId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        statistics: {
          completedJobsCount,
          averageRating,
          photoQualityScore,
          responseTime,
          onTimeRate,
          satisfactionRate,
          weightedScore
        }
      });
    }

    return {
      contractorId,
      oldLevel,
      newLevel,
      averageRating,
      weightedScore,
      levelChanged: newLevel !== oldLevel
    };

  } catch (error) {
    console.error(`Error updating contractor statistics for ${contractorId}:`, error);
    throw error;
  }
}

/**
 * FCM 푸시 알림 전송
 * @param {string} contractorId - 계약자 ID
 * @param {number} oldLevel - 이전 등급
 * @param {number} newLevel - 새로운 등급
 */
async function sendFCMGradeChangeNotification(contractorId, oldLevel, newLevel) {
  try {
    // 계약자 정보 가져오기
    const contractorRef = firestore.collection("contractors").doc(contractorId);
    const contractorSnap = await contractorRef.get();

    if (!contractorSnap.exists) {
      console.log(`Contractor ${contractorId} not found for FCM notification`);
      return;
    }

    const contractorData = contractorSnap.data();
    const fcmTokens = contractorData.fcmTokens || [];
    
    if (fcmTokens.length === 0) {
      console.log(`No FCM tokens found for contractor ${contractorId}`);
      return;
    }

    const oldGradeName = GRADE_CRITERIA[oldLevel]?.name || 'Unknown';
    const newGradeName = GRADE_CRITERIA[newLevel]?.name || 'Unknown';

    // 등급 상승 알림
    if (newLevel > oldLevel) {
      const message = {
        notification: {
          title: '🎉 등급 상승 축하드립니다!',
          body: `${oldGradeName}에서 ${newGradeName}로 등급이 상승했습니다. 새로운 혜택을 확인해보세요!`,
        },
        data: {
          type: 'grade_upgrade',
          oldLevel: oldLevel.toString(),
          newLevel: newLevel.toString(),
          oldGradeName: oldGradeName,
          newGradeName: newGradeName,
          timestamp: Date.now().toString()
        },
        android: {
          notification: {
            channelId: 'grade_changes',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
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

      // 모든 FCM 토큰에 알림 전송
      const sendPromises = fcmTokens.map(async (token) => {
        try {
          const tokenMessage = { ...message, token };
          await messaging.send(tokenMessage);
          console.log(`FCM notification sent to token: ${token.substring(0, 20)}...`);
        } catch (error) {
          console.error(`Failed to send FCM to token ${token.substring(0, 20)}...:`, error);
          
          // 토큰이 유효하지 않은 경우 제거
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            await removeInvalidFCMToken(contractorId, token);
          }
        }
      });

      await Promise.allSettled(sendPromises);
      console.log(`FCM grade upgrade notifications sent to contractor ${contractorId}`);

    } else if (newLevel < oldLevel) {
      // 등급 하락 알림 (선택적)
      const message = {
        notification: {
          title: '등급 변경 안내',
          body: `${oldGradeName}에서 ${newGradeName}로 등급이 변경되었습니다. 서비스 품질 향상을 위해 노력해 주세요.`,
        },
        data: {
          type: 'grade_downgrade',
          oldLevel: oldLevel.toString(),
          newLevel: newLevel.toString(),
          oldGradeName: oldGradeName,
          newGradeName: newGradeName,
          timestamp: Date.now().toString()
        },
        android: {
          notification: {
            channelId: 'grade_changes',
            priority: 'normal',
            defaultSound: true
          }
        }
      };

      const sendPromises = fcmTokens.map(async (token) => {
        try {
          const tokenMessage = { ...message, token };
          await messaging.send(tokenMessage);
        } catch (error) {
          console.error(`Failed to send FCM downgrade notification:`, error);
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            await removeInvalidFCMToken(contractorId, token);
          }
        }
      });

      await Promise.allSettled(sendPromises);
      console.log(`FCM grade downgrade notifications sent to contractor ${contractorId}`);
    }

  } catch (error) {
    console.error(`Error sending FCM grade change notification to ${contractorId}:`, error);
    // FCM 실패는 전체 프로세스를 중단하지 않음
  }
}

/**
 * 유효하지 않은 FCM 토큰 제거
 * @param {string} contractorId - 계약자 ID
 * @param {string} invalidToken - 유효하지 않은 토큰
 */
async function removeInvalidFCMToken(contractorId, invalidToken) {
  try {
    const contractorRef = firestore.collection("contractors").doc(contractorId);
    const contractorSnap = await contractorRef.get();
    
    if (contractorSnap.exists) {
      const contractorData = contractorSnap.data();
      const fcmTokens = contractorData.fcmTokens || [];
      const updatedTokens = fcmTokens.filter(token => token !== invalidToken);
      
      await contractorRef.update({ fcmTokens: updatedTokens });
      console.log(`Removed invalid FCM token for contractor ${contractorId}`);
    }
  } catch (error) {
    console.error(`Error removing invalid FCM token:`, error);
  }
}

/**
 * 알림 전송 (기존 함수 유지)
 * @param {string} contractorId - 계약자 ID
 * @param {number} oldLevel - 이전 등급
 * @param {number} newLevel - 새로운 등급
 */
async function sendGradeChangeNotification(contractorId, oldLevel, newLevel) {
  try {
    // 계약자 정보 가져오기
    const contractorRef = firestore.collection("contractors").doc(contractorId);
    const contractorSnap = await contractorRef.get();

    if (!contractorSnap.exists) {
      console.log(`Contractor ${contractorId} not found for notification`);
      return;
    }

    const contractorData = contractorSnap.data();
    const oldGradeName = GRADE_CRITERIA[oldLevel]?.name || 'Unknown';
    const newGradeName = GRADE_CRITERIA[newLevel]?.name || 'Unknown';

    // 등급 상승 알림
    if (newLevel > oldLevel) {
      const notificationData = {
        userId: contractorId,
        type: 'grade_upgrade',
        title: '🎉 등급 상승 축하드립니다!',
        message: `${oldGradeName}에서 ${newGradeName}로 등급이 상승했습니다.`,
        data: {
          oldLevel,
          newLevel,
          oldGradeName,
          newGradeName,
          benefits: GRADE_CRITERIA[newLevel]?.description || ''
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false
      };

      await firestore.collection("notifications").add(notificationData);
      console.log(`Grade upgrade notification sent to contractor ${contractorId}`);
    }

    // 등급 하락 알림 (선택적)
    if (newLevel < oldLevel) {
      const notificationData = {
        userId: contractorId,
        type: 'grade_downgrade',
        title: '등급 변경 안내',
        message: `${oldGradeName}에서 ${newGradeName}로 등급이 변경되었습니다.`,
        data: {
          oldLevel,
          newLevel,
          oldGradeName,
          newGradeName,
          improvementTips: '서비스 품질 향상을 위해 노력해 주세요.'
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false
      };

      await firestore.collection("notifications").add(notificationData);
      console.log(`Grade downgrade notification sent to contractor ${contractorId}`);
    }

  } catch (error) {
    console.error(`Error sending grade change notification to ${contractorId}:`, error);
    // 알림 실패는 전체 프로세스를 중단하지 않음
  }
}

/**
 * 계약자 등급 업데이트 함수
 * 평점 생성 시 자동으로 계약자 등급을 재계산하고 업데이트
 */
exports.updateContractorLevel = functions.firestore
  .document("ratings/{ratingId}")
  .onCreate(async (snap, context) => {
    try {
      const rating = snap.data();
      const ratingId = context.params.ratingId;

      // 평점 데이터 유효성 검사
      if (!rating || !rating.targetId || rating.targetType !== 'contractor') {
        console.log('Invalid rating data or not a contractor rating');
        return null;
      }

      const contractorId = rating.targetId;
      console.log(`Processing rating ${ratingId} for contractor ${contractorId}`);

      // 계약자 통계 업데이트
      const result = await updateContractorStatistics(contractorId, {
        ...rating,
        id: ratingId
      });

      if (!result) {
        console.log(`No update needed for contractor ${contractorId}`);
        return null;
      }

      // 등급 변경 시 알림 전송
      if (result.levelChanged) {
        await sendGradeChangeNotification(
          contractorId, 
          result.oldLevel, 
          result.newLevel
        );

        // FCM 푸시 알림 전송
        await sendFCMGradeChangeNotification(
          contractorId,
          result.oldLevel,
          result.newLevel
        );

        console.log(`Contractor ${contractorId} level changed from ${result.oldLevel} to ${result.newLevel}`);
      } else {
        console.log(`Contractor ${contractorId} level unchanged (${result.newLevel})`);
      }

      return {
        success: true,
        contractorId,
        oldLevel: result.oldLevel,
        newLevel: result.newLevel,
        levelChanged: result.levelChanged,
        averageRating: result.averageRating,
        weightedScore: result.weightedScore
      };

    } catch (error) {
      console.error('Error in updateContractorLevel function:', error);
      
      // 에러 로그 기록
      await firestore.collection("errorLogs").add({
        function: 'updateContractorLevel',
        error: error.message,
        stack: error.stack,
        ratingId: context.params.ratingId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      throw error;
    }
  });

/**
 * 수동 계약자 등급 업데이트 함수 (관리자용)
 */
exports.manualUpdateContractorLevel = functions.https.onCall(async (data, context) => {
  try {
    // 관리자 권한 확인
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { contractorId } = data;
    
    if (!contractorId) {
      throw new functions.https.HttpsError('invalid-argument', 'Contractor ID is required');
    }

    console.log(`Manual grade update requested for contractor ${contractorId}`);

    // 계약자 통계 업데이트
    const result = await updateContractorStatistics(contractorId, { id: 'manual_update' });

    if (!result) {
      throw new functions.https.HttpsError('not-found', 'Contractor not found');
    }

    // 등급 변경 시 알림 전송
    if (result.levelChanged) {
      await sendGradeChangeNotification(
        contractorId, 
        result.oldLevel, 
        result.newLevel
      );

      // FCM 푸시 알림 전송
      await sendFCMGradeChangeNotification(
        contractorId,
        result.oldLevel,
        result.newLevel
      );
    }

    return {
      success: true,
      contractorId,
      oldLevel: result.oldLevel,
      newLevel: result.newLevel,
      levelChanged: result.levelChanged,
      averageRating: result.averageRating,
      weightedScore: result.weightedScore
    };

  } catch (error) {
    console.error('Error in manualUpdateContractorLevel function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 배치 계약자 등급 업데이트 함수 (관리자용)
 */
exports.batchUpdateContractorLevels = functions.https.onCall(async (data, context) => {
  try {
    // 관리자 권한 확인
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { contractorIds, filters } = data;
    
    console.log('Batch grade update requested');

    let contractorsQuery = firestore.collection("contractors");

    // 필터 적용
    if (filters) {
      if (filters.level) {
        contractorsQuery = contractorsQuery.where("level", "==", filters.level);
      }
      if (filters.minRating) {
        contractorsQuery = contractorsQuery.where("rating", ">=", filters.minRating);
      }
    }

    const contractorsSnap = await contractorsQuery.get();
    const contractors = contractorsSnap.docs;

    const results = [];
    const errors = [];

    // 배치 처리 (최대 500개)
    const batchSize = 500;
    for (let i = 0; i < contractors.length; i += batchSize) {
      const batch = contractors.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (doc) => {
        try {
          const contractorId = doc.id;
          const result = await updateContractorStatistics(contractorId, { id: 'batch_update' });
          
          if (result && result.levelChanged) {
            await sendGradeChangeNotification(
              contractorId, 
              result.oldLevel, 
              result.newLevel
            );

            // FCM 푸시 알림 전송
            await sendFCMGradeChangeNotification(
              contractorId,
              result.oldLevel,
              result.newLevel
            );
          }
          
          return result;
        } catch (error) {
          console.error(`Error processing contractor ${doc.id}:`, error);
          errors.push({ contractorId: doc.id, error: error.message });
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null));
    }

    console.log(`Batch update completed: ${results.length} processed, ${errors.length} errors`);

    return {
      success: true,
      totalProcessed: results.length,
      totalErrors: errors.length,
      results: results,
      errors: errors
    };

  } catch (error) {
    console.error('Error in batchUpdateContractorLevels function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 계약자 등급 통계 함수
 */
exports.getContractorGradeStatistics = functions.https.onCall(async (data, context) => {
  try {
    // 관리자 권한 확인
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const contractorsSnap = await firestore.collection("contractors").get();
    const contractors = contractorsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 등급별 통계 계산
    const gradeStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const totalContractors = contractors.length;
    let totalWeightedScore = 0;

    contractors.forEach(contractor => {
      const level = contractor.level || 1;
      gradeStats[level]++;
      totalWeightedScore += contractor.weightedScore || 0;
    });

    const averageWeightedScore = totalContractors > 0 ? totalWeightedScore / totalContractors : 0;

    // 최근 등급 변경 로그
    const recentChangesSnap = await firestore.collection("gradeChangeLogs")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const recentChanges = recentChangesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      statistics: {
        totalContractors,
        gradeDistribution: gradeStats,
        averageWeightedScore: Math.round(averageWeightedScore * 100) / 100,
        gradePercentages: Object.fromEntries(
          Object.entries(gradeStats).map(([level, count]) => [
            level, 
            totalContractors > 0 ? Math.round((count / totalContractors) * 100 * 10) / 10 : 0
          ])
        )
      },
      recentChanges
    };

  } catch (error) {
    console.error('Error in getContractorGradeStatistics function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 

/**
 * 작업 수락 시 판매자에게 알림 전송
 */
exports.notifySellerOnJobAccepted = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const jobId = context.params.jobId;

    console.log(`Job ${jobId} status changed from ${before.status} to ${after.status}`);

    // 상태가 "open"에서 "assigned"로 변경될 때만 실행
    if (before.status === "open" && after.status === "assigned") {
      const sellerId = after.sellerId;
      if (!sellerId) {
        console.log(`No sellerId found for job ${jobId}`);
        return null;
      }

      try {
        // 판매자 정보 조회
        const sellerDoc = await firestore.collection("users").doc(sellerId).get();
        if (!sellerDoc.exists) {
          console.log(`Seller ${sellerId} not found for job ${jobId}`);
          return null;
        }

        const sellerData = sellerDoc.data();
        const fcmTokens = sellerData.fcmTokens || [];
        
        if (fcmTokens.length === 0) {
          console.log(`No FCM tokens found for seller ${sellerId}`);
          return null;
        }

        // 계약자 정보 조회 (알림 메시지에 포함)
        let contractorName = "시공기사";
        if (after.assignedContractorId) {
          try {
            const contractorDoc = await firestore.collection("contractors").doc(after.assignedContractorId).get();
            if (contractorDoc.exists) {
              const contractorData = contractorDoc.data();
              contractorName = contractorData.name || contractorData.displayName || "시공기사";
            }
          } catch (error) {
            console.warn(`Failed to fetch contractor info: ${error.message}`);
          }
        }

        // 알림 메시지 구성
        const notificationData = {
          type: "job_accepted",
          jobId: jobId,
          jobName: after.name || "작업",
          status: after.status,
          contractorId: after.assignedContractorId,
          contractorName: contractorName,
          timestamp: new Date().toISOString()
        };

        // 각 FCM 토큰에 대해 알림 전송
        const sendPromises = fcmTokens.map(async (token, index) => {
          try {
            const message = {
              token: token,
              notification: {
                title: "시공 건이 수락되었습니다",
                body: `"${after.name || '작업'}"이 ${contractorName}에 의해 수락되었습니다.`,
              },
              data: {
                ...notificationData,
                tokenIndex: index.toString()
              },
              android: {
                notification: {
                  channelId: "job_notifications",
                  priority: "high",
                  defaultSound: true,
                  defaultVibrateTimings: true
                }
              },
              apns: {
                payload: {
                  aps: {
                    sound: "default",
                    badge: 1
                  }
                }
              }
            };

            const result = await messaging.send(message);
            console.log(`FCM notification sent successfully to token ${index} for job ${jobId}`);
            return { success: true, tokenIndex: index, messageId: result };
          } catch (error) {
            console.error(`Failed to send FCM notification to token ${index}:`, error);
            
            // 토큰이 유효하지 않은 경우 제거
            if (error.code === 'messaging/invalid-registration-token' || 
                error.code === 'messaging/registration-token-not-registered') {
              await removeInvalidFCMToken(sellerId, token);
            }
            
            return { success: false, tokenIndex: index, error: error.message };
          }
        });

        const results = await Promise.all(sendPromises);
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        // 알림 로그 저장
        await firestore.collection("notificationLogs").add({
          type: "job_accepted",
          targetUserId: sellerId,
          targetType: "seller",
          jobId: jobId,
          jobName: after.name,
          contractorId: after.assignedContractorId,
          contractorName: contractorName,
          fcmTokensCount: fcmTokens.length,
          successCount: successCount,
          failureCount: failureCount,
          results: results,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: failureCount === 0 ? "success" : failureCount === fcmTokens.length ? "failed" : "partial"
        });

        console.log(`Job acceptance notification completed for job ${jobId}: ${successCount} success, ${failureCount} failed`);

        // 이메일 알림도 전송 (선택사항)
        if (sellerData.email && sellerData.notificationPreferences?.email?.jobAccepted !== false) {
          try {
            await sendJobAcceptedEmail(sellerData.email, {
              jobName: after.name,
              contractorName: contractorName,
              jobId: jobId,
              sellerName: sellerData.name || sellerData.displayName
            });
            console.log(`Email notification sent to ${sellerData.email} for job ${jobId}`);
          } catch (emailError) {
            console.error(`Failed to send email notification: ${emailError.message}`);
          }
        }

      } catch (error) {
        console.error(`Error in notifySellerOnJobAccepted for job ${jobId}:`, error);
        
        // 에러 로그 저장
        await firestore.collection("notificationLogs").add({
          type: "job_accepted",
          targetUserId: sellerId,
          targetType: "seller",
          jobId: jobId,
          error: error.message,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: "error"
        });
      }
    }

    return null;
  });

/**
 * 작업 수락 이메일 알림 전송
 */
async function sendJobAcceptedEmail(email, data) {
  // SendGrid 또는 다른 이메일 서비스 사용
  // 여기서는 기본 템플릿만 제공
  const emailData = {
    to: email,
    subject: "시공 건이 수락되었습니다",
    template: "job_accepted",
    data: {
      jobName: data.jobName,
      contractorName: data.contractorName,
      jobId: data.jobId,
      sellerName: data.sellerName,
      timestamp: new Date().toLocaleString('ko-KR')
    }
  };

  // 실제 이메일 전송 로직은 별도 구현 필요
  console.log("Email notification data:", emailData);
} 

/**
 * 작업 평가 시 계약자 평점 업데이트
 * 다중 카테고리 평점 지원 및 등급 시스템 연동
 */
exports.updateContractorRating = functions.firestore
  .document("jobs/{jobId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const jobId = context.params.jobId;

    console.log(`Job ${jobId} review update detected`);

    // 평가가 새로 등록된 경우만 처리
    if (!before.consumerReview && after.consumerReview) {
      const contractorId = after.assignedContractorId || after.assignedTo;
      if (!contractorId) {
        console.log(`No contractor ID found for job ${jobId}`);
        return null;
      }

      try {
        // 해당 시공기사 문서 참조
        const contractorRef = firestore.collection("contractors").doc(contractorId);
        const contractorDoc = await contractorRef.get();
        
        if (!contractorDoc.exists) {
          console.log(`Contractor ${contractorId} not found`);
          return null;
        }

        const contractorData = contractorDoc.data();
        const reviewData = after.consumerReview;

        // 기존 통계 데이터 가져오기
        const currentStats = contractorData.reviewStats || {
          totalReviews: 0,
          averageRating: 0,
          totalRating: 0,
          categoryAverages: {},
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          recommendationRate: 0,
          totalRecommendations: 0
        };

        // 새로운 통계 계산
        const newStats = calculateNewReviewStats(currentStats, reviewData);

        // 계약자 문서 업데이트
        await contractorRef.update({
          reviewStats: newStats,
          lastReviewAt: new Date(),
          lastReviewJobId: jobId,
          // 기존 필드와의 호환성을 위한 업데이트
          ratingAverage: newStats.averageRating,
          ratingCount: newStats.totalReviews
        });

        console.log(`Contractor ${contractorId} rating updated: ${newStats.averageRating.toFixed(2)} (${newStats.totalReviews} reviews)`);

        // 등급 시스템과 연동
        await updateContractorGradeFromReview(contractorId, newStats);

        // 평가 로그 저장
        await firestore.collection("ratingUpdateLogs").add({
          contractorId: contractorId,
          jobId: jobId,
          oldStats: currentStats,
          newStats: newStats,
          reviewData: reviewData,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          type: "review_update"
        });

      } catch (error) {
        console.error(`Error updating contractor rating for ${contractorId}:`, error);
        
        // 오류 로그 저장
        await firestore.collection("ratingUpdateLogs").add({
          contractorId: contractorId,
          jobId: jobId,
          error: error.message,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          type: "review_update_error"
        });
      }
    }

    return null;
  });

/**
 * 새로운 리뷰 통계 계산
 */
function calculateNewReviewStats(currentStats, reviewData) {
  const {
    ratings = {},
    averageRating = 0,
    recommendToOthers = false
  } = reviewData;

  // 기본 통계 업데이트
  const newTotalReviews = currentStats.totalReviews + 1;
  const newTotalRating = currentStats.totalRating + averageRating;
  const newAverageRating = newTotalRating / newTotalReviews;

  // 카테고리별 평균 계산
  const newCategoryAverages = { ...currentStats.categoryAverages };
  Object.entries(ratings).forEach(([category, rating]) => {
    if (rating > 0) {
      const currentCategoryTotal = (newCategoryAverages[category]?.total || 0) + rating;
      const currentCategoryCount = (newCategoryAverages[category]?.count || 0) + 1;
      
      newCategoryAverages[category] = {
        average: currentCategoryTotal / currentCategoryCount,
        total: currentCategoryTotal,
        count: currentCategoryCount
      };
    }
  });

  // 평점 분포 업데이트
  const newRatingDistribution = { ...currentStats.ratingDistribution };
  const overallRating = Math.round(averageRating);
  if (overallRating >= 1 && overallRating <= 5) {
    newRatingDistribution[overallRating]++;
  }

  // 추천률 계산
  const newTotalRecommendations = currentStats.totalRecommendations + (recommendToOthers ? 1 : 0);
  const newRecommendationRate = newTotalRecommendations / newTotalReviews;

  return {
    totalReviews: newTotalReviews,
    averageRating: Math.round(newAverageRating * 100) / 100,
    totalRating: newTotalRating,
    categoryAverages: newCategoryAverages,
    ratingDistribution: newRatingDistribution,
    recommendationRate: Math.round(newRecommendationRate * 1000) / 10, // 퍼센트로 표시
    totalRecommendations: newTotalRecommendations,
    lastUpdated: new Date()
  };
}

/**
 * 리뷰 기반 계약자 등급 업데이트
 */
async function updateContractorGradeFromReview(contractorId, reviewStats) {
  try {
    const contractorRef = firestore.collection("contractors").doc(contractorId);
    const contractorDoc = await contractorRef.get();
    
    if (!contractorDoc.exists) return;

    const contractorData = contractorDoc.data();
    const currentLevel = contractorData.level || 1;

    // 등급 결정을 위한 데이터 준비
    const gradeData = {
      completedJobsCount: reviewStats.totalReviews,
      averageRating: reviewStats.averageRating,
      photoQualityScore: contractorData.photoQualityScore || 0,
      responseTime: contractorData.responseTime || 120,
      onTimeRate: contractorData.onTimeRate || 0,
      satisfactionRate: reviewStats.recommendationRate
    };

    // 새로운 등급 결정
    const newLevel = determineContractorLevel(gradeData);

    // 등급이 변경된 경우
    if (newLevel !== currentLevel) {
      console.log(`Contractor ${contractorId} level changed from ${currentLevel} to ${newLevel}`);

      // 등급 변경 로그 저장
      await firestore.collection("gradeChangeLogs").add({
        contractorId: contractorId,
        oldLevel: currentLevel,
        newLevel: newLevel,
        reason: "review_update",
        trigger: "rating_update",
        reviewStats: reviewStats,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // 계약자 문서 업데이트
      await contractorRef.update({
        level: newLevel,
        lastGradeUpdate: new Date(),
        gradeUpdateReason: "review_update"
      });

      // 등급 변경 알림 전송
      await sendGradeChangeNotification(contractorId, currentLevel, newLevel);
      await sendFCMGradeChangeNotification(contractorId, currentLevel, newLevel);
    }

  } catch (error) {
    console.error(`Error updating contractor grade for ${contractorId}:`, error);
  }
}

/**
 * 배치 계약자 평점 업데이트 (관리자용)
 */
exports.batchUpdateContractorRatings = functions.https.onCall(async (data, context) => {
  try {
    // 관리자 권한 확인
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { contractorIds, filters } = data;
    
    console.log('Batch rating update requested');

    let contractorsQuery = firestore.collection("contractors");

    // 필터 적용
    if (filters) {
      if (filters.minRating) {
        contractorsQuery = contractorsQuery.where("ratingAverage", ">=", filters.minRating);
      }
      if (filters.minReviews) {
        contractorsQuery = contractorsQuery.where("ratingCount", ">=", filters.minReviews);
      }
    }

    const contractorsSnap = await contractorsQuery.get();
    const contractors = contractorsSnap.docs;

    const results = [];
    const errors = [];

    // 배치 처리
    for (const doc of contractors) {
      try {
        const contractorId = doc.id;
        const contractorData = doc.data();
        
        // 리뷰 데이터 조회
        const reviewsQuery = await firestore.collection("reviews")
          .where("contractorId", "==", contractorId)
          .get();

        const reviews = reviewsQuery.docs.map(reviewDoc => reviewDoc.data());
        
        if (reviews.length > 0) {
          // 통계 재계산
          const newStats = recalculateStatsFromReviews(reviews);
          
          // 계약자 업데이트
          await doc.ref.update({
            reviewStats: newStats,
            ratingAverage: newStats.averageRating,
            ratingCount: newStats.totalReviews,
            lastRatingUpdate: new Date()
          });

          // 등급 업데이트
          await updateContractorGradeFromReview(contractorId, newStats);
          
          results.push({
            contractorId,
            oldStats: contractorData.reviewStats,
            newStats: newStats
          });
        }
      } catch (error) {
        console.error(`Error processing contractor ${doc.id}:`, error);
        errors.push({ contractorId: doc.id, error: error.message });
      }
    }

    console.log(`Batch rating update completed: ${results.length} processed, ${errors.length} errors`);

    return {
      success: true,
      totalProcessed: results.length,
      totalErrors: errors.length,
      results: results,
      errors: errors
    };

  } catch (error) {
    console.error('Error in batchUpdateContractorRatings function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 리뷰 데이터로부터 통계 재계산
 */
function recalculateStatsFromReviews(reviews) {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      totalRating: 0,
      categoryAverages: {},
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recommendationRate: 0,
      totalRecommendations: 0
    };
  }

  let totalRating = 0;
  let totalRecommendations = 0;
  const categoryTotals = {};
  const categoryCounts = {};
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach(review => {
    totalRating += review.averageRating || 0;
    if (review.recommendToOthers) totalRecommendations++;

    // 평점 분포
    const overallRating = Math.round(review.averageRating || 0);
    if (overallRating >= 1 && overallRating <= 5) {
      ratingDistribution[overallRating]++;
    }

    // 카테고리별 평균
    if (review.ratings) {
      Object.entries(review.ratings).forEach(([category, rating]) => {
        if (rating > 0) {
          categoryTotals[category] = (categoryTotals[category] || 0) + rating;
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      });
    }
  });

  const categoryAverages = {};
  Object.keys(categoryTotals).forEach(category => {
    categoryAverages[category] = {
      average: categoryTotals[category] / categoryCounts[category],
      total: categoryTotals[category],
      count: categoryCounts[category]
    };
  });

  return {
    totalReviews: reviews.length,
    averageRating: Math.round((totalRating / reviews.length) * 100) / 100,
    totalRating: totalRating,
    categoryAverages: categoryAverages,
    ratingDistribution: ratingDistribution,
    recommendationRate: Math.round((totalRecommendations / reviews.length) * 1000) / 10,
    totalRecommendations: totalRecommendations,
    lastUpdated: new Date()
  };
} 

/**
 * 긴급 수수료 주기적 인상 (1시간마다)
 * 오픈 상태의 시공건에 대해 긴급 수수료를 1시간마다 5%씩 인상합니다.
 */
exports.increaseUrgentFeePeriodically = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = Date.now();
    const jobsRef = firestore.collection("jobs");
    const snapshot = await jobsRef.where("status", "==", "open").get();

    let processedCount = 0;
    let increasedCount = 0;

    snapshot.forEach(async (doc) => {
      const job = doc.data();

      const createdAt = job.createdAt ? job.createdAt.toMillis() : 0;
      const lastIncreaseAt = job.lastFeeIncreaseAt ? job.lastFeeIncreaseAt.toMillis() : createdAt;
      const baseFee = job.baseUrgentFeePercent || 15;
      const maxFee = job.maxUrgentFeePercent || 50;
      let currentFee = job.currentUrgentFeePercent || baseFee;

      const hoursSinceLastIncrease = (now - lastIncreaseAt) / (1000 * 60 * 60);

      if (hoursSinceLastIncrease >= 1 && currentFee < maxFee) {
        // 1시간마다 5%씩 올린다고 가정
        const newFee = Math.min(currentFee + 5, maxFee);
        await doc.ref.update({
          currentUrgentFeePercent: newFee,
          lastFeeIncreaseAt: admin.firestore.Timestamp.now(),
        });
        console.log(`시공건 ${doc.id} 긴급 수수료 ${currentFee}% → ${newFee}% 인상`);
        increasedCount++;
      }
      processedCount++;
    });

    console.log(`긴급 수수료 인상 완료: ${increasedCount}/${processedCount}건 처리됨`);
    return null;
  }); 

/**
 * 긴급 수수료 관리자 함수들 (src/urgentFeeManager.js에서 가져옴)
 */
const urgentFeeManager = require('./src/urgentFeeManager');

// 긴급 수수료 자동 인상 (10분마다)
exports.increaseUrgentFee = urgentFeeManager.increaseUrgentFee;

// 긴급 수수료 수동 인상 (관리자용)
exports.manualIncreaseUrgentFee = urgentFeeManager.manualIncreaseUrgentFee;

/**
 * 카카오 인증 함수
 */
const kakaoAuth = require('./kakaoAuth');

// 카카오 토큰으로 Firebase Custom Token 생성
exports.getFirebaseToken = kakaoAuth.getFirebaseToken;

/**
 * FCM 토큰 관리 함수들
 */
// FCM 토큰 저장
exports.saveFCMToken = fcmTokenManager.saveFCMToken;

// FCM 토큰 삭제
exports.deleteFCMToken = fcmTokenManager.deleteFCMToken;

// FCM 토큰 유효성 검증
exports.validateFCMToken = fcmTokenManager.validateFCMToken;

// 사용자별 FCM 토큰 조회
exports.getFCMToken = fcmTokenManager.getFCMToken;

// 만료된 FCM 토큰 정리 (관리자용)
exports.cleanupExpiredTokens = fcmTokenManager.cleanupExpiredTokens;

// FCM 토큰 통계 (관리자용)
exports.getFCMTokenStats = fcmTokenManager.getFCMTokenStats;

/**
 * 작업 상태 관리 함수들
 */
// 작업 상태 변경
exports.updateJobStatus = jobStatusManager.updateJobStatus;

// 작업 상태 일괄 업데이트 (관리자용)
exports.batchUpdateJobStatus = jobStatusManager.batchUpdateJobStatus;

// 작업 상태 통계 조회
exports.getJobStatusStats = jobStatusManager.getJobStatusStats; 