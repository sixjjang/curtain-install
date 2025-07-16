const { getFirestore, collection, query, where, getDocs, doc, updateDoc, Timestamp } = require("firebase/firestore");
const { calculateDetailedGrade, GRADE_CRITERIA } = require("../frontend/src/utils/gradeCalculator");

const firestore = getFirestore();

/**
 * 시공기사 등급 업데이트 함수 (상세 평가 시스템용)
 * @param {string} contractorId - 시공기사 ID
 * @param {Object} options - 업데이트 옵션
 * @returns {Object} 업데이트 결과
 */
async function updateContractorGrade(contractorId, options = {}) {
  const {
    sendNotification = true,
    logChanges = true,
    forceUpdate = false
  } = options;

  try {
    console.log(`Starting grade update for contractor: ${contractorId}`);

    // 1. 시공기사 정보 조회
    const contractorRef = doc(firestore, "contractors", contractorId);
    const contractorSnap = await contractorRef.get();
    
    if (!contractorSnap.exists) {
      throw new Error(`Contractor ${contractorId} not found`);
    }

    const contractorData = contractorSnap.data();
    const oldGrade = contractorData.grade || 'C';
    const oldAverageRating = contractorData.averageRating || 0;

    // 2. 평가 데이터 조회
    const evaluationsRef = collection(firestore, "evaluations");
    const q = query(
      evaluationsRef, 
      where("contractorId", "==", contractorId),
      where("status", "==", "submitted")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`No evaluations found for contractor ${contractorId}`);
      return {
        success: false,
        message: "평가 데이터가 없습니다.",
        contractorId,
        oldGrade,
        newGrade: oldGrade,
        averageRating: oldAverageRating,
        totalEvaluations: 0
      };
    }

    // 3. 평가 데이터 처리
    const evaluations = [];
    let totalRating = 0;
    let count = 0;

    snapshot.forEach(doc => {
      const evaluation = doc.data();
      evaluations.push(evaluation);
      
      // 상세 평가 시스템 지원
      if (evaluation.ratings) {
        // 새로운 상세 평가 시스템
        const categoryRatings = Object.values(evaluation.ratings);
        const avgRating = categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length;
        totalRating += avgRating;
      } else if (evaluation.averageRating) {
        // 기존 시스템과의 호환성
        totalRating += evaluation.averageRating;
      } else if (evaluation.rating) {
        // 레거시 시스템 지원
        totalRating += evaluation.rating;
      }
      
      count++;
    });

    const averageRating = totalRating / count;

    // 4. 등급 계산
    const gradeDetails = calculateDetailedGrade(evaluations);
    const newGrade = gradeDetails.grade;

    // 5. 등급 변경 확인
    if (!forceUpdate && oldGrade === newGrade && Math.abs(oldAverageRating - averageRating) < 0.1) {
      console.log(`No significant changes for contractor ${contractorId}`);
      return {
        success: true,
        message: "중요한 변경사항이 없습니다.",
        contractorId,
        oldGrade,
        newGrade,
        averageRating,
        totalEvaluations: count,
        gradeDetails
      };
    }

    // 6. 시공기사 정보 업데이트
    const updateData = {
      grade: newGrade,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: count,
      lastGradeUpdate: Timestamp.now(),
      gradeDetails: {
        categoryScores: gradeDetails.categoryScores,
        recommendations: gradeDetails.recommendations,
        recentTrend: gradeDetails.recentTrend
      }
    };

    // 등급 변경 이력 추가
    if (oldGrade !== newGrade) {
      updateData.gradeHistory = firestore.FieldValue.arrayUnion({
        fromGrade: oldGrade,
        toGrade: newGrade,
        date: Timestamp.now(),
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: count,
        reason: "평가 기반 자동 업데이트"
      });
    }

    await updateDoc(contractorRef, updateData);

    // 7. 등급 변경 로그 생성
    if (logChanges && oldGrade !== newGrade) {
      await createGradeChangeLog(contractorId, contractorData, oldGrade, newGrade, gradeDetails);
    }

    // 8. 등급 변경 알림 발송
    if (sendNotification && oldGrade !== newGrade) {
      await sendGradeChangeNotification(contractorId, contractorData, oldGrade, newGrade, gradeDetails);
    }

    console.log(`Grade updated for contractor ${contractorId}: ${oldGrade} → ${newGrade}`);

    return {
      success: true,
      message: "등급이 성공적으로 업데이트되었습니다.",
      contractorId,
      oldGrade,
      newGrade,
      averageRating: Math.round(averageRating * 10) / 10,
      totalEvaluations: count,
      gradeDetails,
      gradeChanged: oldGrade !== newGrade
    };

  } catch (error) {
    console.error(`Error updating grade for contractor ${contractorId}:`, error);
    throw error;
  }
}

/**
 * 등급 변경 로그 생성
 */
async function createGradeChangeLog(contractorId, contractorData, oldGrade, newGrade, gradeDetails) {
  try {
    const logRef = collection(firestore, "gradeChangeLogs");
    await addDoc(logRef, {
      contractorId,
      contractorName: contractorData.profile?.name || contractorData.name || "이름 없음",
      oldGrade,
      newGrade,
      averageRating: gradeDetails.averageRating,
      totalRatings: gradeDetails.totalRatings,
      changeDate: Timestamp.now(),
      categoryScores: gradeDetails.categoryScores,
      recommendations: gradeDetails.recommendations,
      changeType: "evaluation_based",
      source: "automatic_update"
    });
  } catch (error) {
    console.error("Error creating grade change log:", error);
  }
}

/**
 * 등급 변경 알림 발송
 */
async function sendGradeChangeNotification(contractorId, contractorData, oldGrade, newGrade, gradeDetails) {
  try {
    // FCM 토큰이 있는 경우 푸시 알림 발송
    if (contractorData.fcmToken) {
      const notificationData = {
        title: "등급 변경 알림",
        body: `귀하의 등급이 ${oldGrade}에서 ${newGrade}로 변경되었습니다.`,
        data: {
          type: "grade_change",
          contractorId,
          oldGrade,
          newGrade,
          averageRating: gradeDetails.averageRating
        }
      };

      // FCM 발송 로직 (기존 notification service 활용)
      // await sendPushNotification(contractorData.fcmToken, notificationData);
    }

    // 이메일 알림 (선택사항)
    if (contractorData.profile?.email) {
      // 이메일 발송 로직
      // await sendGradeChangeEmail(contractorData.profile.email, oldGrade, newGrade, gradeDetails);
    }

  } catch (error) {
    console.error("Error sending grade change notification:", error);
  }
}

/**
 * 배치 등급 업데이트
 * @param {Array} contractorIds - 시공기사 ID 배열
 * @param {Object} options - 업데이트 옵션
 * @returns {Object} 배치 업데이트 결과
 */
async function batchUpdateContractorGrades(contractorIds, options = {}) {
  const results = {
    total: contractorIds.length,
    successful: 0,
    failed: 0,
    gradeChanges: 0,
    details: []
  };

  console.log(`Starting batch grade update for ${contractorIds.length} contractors`);

  for (const contractorId of contractorIds) {
    try {
      const result = await updateContractorGrade(contractorId, options);
      results.details.push(result);
      
      if (result.success) {
        results.successful++;
        if (result.gradeChanged) {
          results.gradeChanges++;
        }
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`Failed to update grade for contractor ${contractorId}:`, error);
      results.failed++;
      results.details.push({
        success: false,
        contractorId,
        error: error.message
      });
    }
  }

  console.log(`Batch update completed: ${results.successful} successful, ${results.failed} failed, ${results.gradeChanges} grade changes`);

  return results;
}

/**
 * 특정 조건의 시공기사 등급 업데이트
 * @param {Object} filters - 필터 조건
 * @param {Object} options - 업데이트 옵션
 * @returns {Object} 업데이트 결과
 */
async function updateGradesByFilter(filters = {}, options = {}) {
  try {
    // 시공기사 조회
    const contractorsRef = collection(firestore, "contractors");
    let q = contractorsRef;

    // 필터 적용
    if (filters.active !== undefined) {
      q = query(q, where("active", "==", filters.active));
    }
    if (filters.grade) {
      q = query(q, where("grade", "==", filters.grade));
    }
    if (filters.minEvaluations) {
      q = query(q, where("totalRatings", ">=", filters.minEvaluations));
    }

    const snapshot = await getDocs(q);
    const contractorIds = snapshot.docs.map(doc => doc.id);

    return await batchUpdateContractorGrades(contractorIds, options);

  } catch (error) {
    console.error("Error updating grades by filter:", error);
    throw error;
  }
}

// HTTP 호출 가능한 함수들
exports.updateContractorGrade = functions.https.onCall(async (data, context) => {
  // 관리자 권한 확인
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
  }

  const { contractorId, options = {} } = data;
  
  if (!contractorId) {
    throw new functions.https.HttpsError('invalid-argument', '시공기사 ID가 필요합니다.');
  }

  try {
    const result = await updateContractorGrade(contractorId, options);
    return result;
  } catch (error) {
    console.error('Manual grade update error:', error);
    throw new functions.https.HttpsError('internal', '등급 업데이트 중 오류가 발생했습니다.');
  }
});

exports.batchUpdateContractorGrades = functions.https.onCall(async (data, context) => {
  // 관리자 권한 확인
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
  }

  const { contractorIds, options = {} } = data;
  
  if (!contractorIds || !Array.isArray(contractorIds)) {
    throw new functions.https.HttpsError('invalid-argument', '시공기사 ID 배열이 필요합니다.');
  }

  try {
    const result = await batchUpdateContractorGrades(contractorIds, options);
    return result;
  } catch (error) {
    console.error('Batch grade update error:', error);
    throw new functions.https.HttpsError('internal', '배치 등급 업데이트 중 오류가 발생했습니다.');
  }
});

exports.updateGradesByFilter = functions.https.onCall(async (data, context) => {
  // 관리자 권한 확인
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
  }

  const { filters = {}, options = {} } = data;

  try {
    const result = await updateGradesByFilter(filters, options);
    return result;
  } catch (error) {
    console.error('Filter-based grade update error:', error);
    throw new functions.https.HttpsError('internal', '필터 기반 등급 업데이트 중 오류가 발생했습니다.');
  }
});

// 내보내기
module.exports = {
  updateContractorGrade,
  batchUpdateContractorGrades,
  updateGradesByFilter
}; 