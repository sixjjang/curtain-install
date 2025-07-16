const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * 시공기사 등급 업데이트 함수
 * 평가 데이터를 기반으로 등급을 재계산하고 변경 시 알림을 발송합니다.
 */
exports.updateContractorGrade = functions.firestore
  .document('contractors/{contractorId}')
  .onWrite(async (change, context) => {
    const contractorId = context.params.contractorId;
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    // 삭제된 경우 처리하지 않음
    if (!afterData) {
      console.log(`Contractor ${contractorId} deleted, skipping grade update`);
      return null;
    }

    try {
      // 기존 등급과 평가 데이터 확인
      const oldGrade = beforeData?.grade || 'C';
      const ratings = afterData.ratings || [];
      
      if (ratings.length === 0) {
        console.log(`No ratings found for contractor ${contractorId}`);
        return null;
      }

      // 새 등급 계산
      const newGrade = calculateContractorGrade(ratings);
      const gradeDetails = calculateDetailedGrade(ratings);
      
      console.log(`Contractor ${contractorId}: ${oldGrade} → ${newGrade}`);

      // 등급이 변경된 경우에만 업데이트
      if (oldGrade !== newGrade) {
        const batch = admin.firestore().batch();
        const contractorRef = admin.firestore().collection('contractors').doc(contractorId);

        // 등급 정보 업데이트
        const updateData = {
          grade: newGrade,
          averageRating: gradeDetails.averageRating,
          totalRatings: gradeDetails.totalRatings,
          lastGradeUpdate: admin.firestore.FieldValue.serverTimestamp(),
          gradeHistory: admin.firestore.FieldValue.arrayUnion({
            fromGrade: oldGrade,
            toGrade: newGrade,
            date: admin.firestore.FieldValue.serverTimestamp(),
            averageRating: gradeDetails.averageRating,
            totalRatings: gradeDetails.totalRatings
          })
        };

        batch.update(contractorRef, updateData);

        // 등급 변경 로그 생성
        const gradeLogRef = admin.firestore().collection('gradeChangeLogs').doc();
        batch.set(gradeLogRef, {
          contractorId,
          contractorName: afterData.name || 'Unknown',
          oldGrade,
          newGrade,
          averageRating: gradeDetails.averageRating,
          totalRatings: gradeDetails.totalRatings,
          changeDate: admin.firestore.FieldValue.serverTimestamp(),
          categoryScores: gradeDetails.categoryScores,
          recommendations: gradeDetails.recommendations
        });

        await batch.commit();

        // 등급 변경 알림 발송
        await sendGradeChangeNotification(contractorId, afterData, oldGrade, newGrade, gradeDetails);

        console.log(`Grade updated for contractor ${contractorId}: ${oldGrade} → ${newGrade}`);
      }

      return null;
    } catch (error) {
      console.error(`Error updating grade for contractor ${contractorId}:`, error);
      throw error;
    }
  });

/**
 * 등급 계산 함수
 * @param {Array} ratings - 평가 배열
 * @returns {string} 등급 (A, B, C, D)
 */
function calculateContractorGrade(ratings) {
  if (!ratings || ratings.length === 0) return "C";

  // 모든 평가의 평균 계산
  const totalScores = ratings.reduce(
    (acc, rating) => {
      // 개별 평가 항목들의 평균 계산
      const ratingValues = Object.values(rating.ratings || rating);
      const average = ratingValues.reduce((sum, val) => sum + (val || 0), 0) / ratingValues.length;
      
      acc.total += average;
      acc.count += 1;
      return acc;
    },
    { total: 0, count: 0 }
  );

  const overallAverage = totalScores.total / totalScores.count;

  // 등급 결정
  if (overallAverage >= 4.5) return "A";
  else if (overallAverage >= 3.5) return "B";
  else if (overallAverage >= 2.5) return "C";
  else return "D";
}

/**
 * 상세 등급 계산 함수
 * @param {Array} ratings - 평가 배열
 * @returns {Object} 상세 등급 정보
 */
function calculateDetailedGrade(ratings) {
  if (!ratings || ratings.length === 0) {
    return {
      grade: "C",
      averageRating: 0,
      totalRatings: 0,
      categoryScores: {},
      recommendations: ["더 많은 평가가 필요합니다."]
    };
  }

  // 평가 항목 가중치
  const RATING_WEIGHTS = {
    quality: 0.25,
    punctuality: 0.20,
    costSaving: 0.20,
    communication: 0.15,
    professionalism: 0.20
  };

  // 카테고리별 점수 계산
  const categoryTotals = {};
  const categoryCounts = {};

  ratings.forEach(rating => {
    const ratingData = rating.ratings || rating;
    
    Object.keys(RATING_WEIGHTS).forEach(category => {
      if (ratingData[category] !== undefined) {
        categoryTotals[category] = (categoryTotals[category] || 0) + ratingData[category];
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
  });

  // 카테고리별 평균 계산
  const categoryScores = {};
  Object.keys(categoryTotals).forEach(category => {
    categoryScores[category] = categoryTotals[category] / categoryCounts[category];
  });

  // 가중 평균 계산
  let weightedSum = 0;
  let totalWeight = 0;

  Object.keys(categoryScores).forEach(category => {
    const weight = RATING_WEIGHTS[category] || 0;
    weightedSum += categoryScores[category] * weight;
    totalWeight += weight;
  });

  const averageRating = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // 등급 결정
  let grade = "D";
  if (averageRating >= 4.5) grade = "A";
  else if (averageRating >= 3.5) grade = "B";
  else if (averageRating >= 2.5) grade = "C";

  // 개선 권장사항 생성
  const recommendations = generateRecommendations(categoryScores, averageRating);

  return {
    grade,
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings: ratings.length,
    categoryScores,
    recommendations
  };
}

/**
 * 개선 권장사항 생성
 * @param {Object} categoryScores - 카테고리별 점수
 * @param {number} averageRating - 전체 평균 점수
 * @returns {Array} 권장사항 배열
 */
function generateRecommendations(categoryScores, averageRating) {
  const recommendations = [];

  // 전체 점수가 낮은 경우
  if (averageRating < 3.0) {
    recommendations.push("전반적인 서비스 품질 개선이 필요합니다.");
  }

  // 카테고리별 개선 권장사항
  Object.entries(categoryScores).forEach(([category, score]) => {
    if (score < 3.0) {
      const categoryLabels = {
        quality: "시공 품질",
        punctuality: "시간 준수",
        costSaving: "비용 효율성",
        communication: "의사소통",
        professionalism: "전문성"
      };

      const improvements = {
        quality: "시공 기술 향상과 품질 관리 강화",
        punctuality: "일정 관리 및 시간 준수 개선",
        costSaving: "비용 효율적인 작업 방법 도입",
        communication: "고객과의 소통 능력 향상",
        professionalism: "전문적인 태도와 서비스 마인드 개선"
      };

      recommendations.push(`${categoryLabels[category]} 개선: ${improvements[category]}`);
    }
  });

  return recommendations.length > 0 ? recommendations : ["현재 수준을 유지하세요."];
}

/**
 * 등급 변경 알림 발송
 * @param {string} contractorId - 시공기사 ID
 * @param {Object} contractorData - 시공기사 데이터
 * @param {string} oldGrade - 이전 등급
 * @param {string} newGrade - 새 등급
 * @param {Object} gradeDetails - 등급 상세 정보
 */
async function sendGradeChangeNotification(contractorId, contractorData, oldGrade, newGrade, gradeDetails) {
  try {
    const gradeLabels = {
      A: "A등급 (우수)",
      B: "B등급 (양호)",
      C: "C등급 (보통)",
      D: "D등급 (미흡)"
    };

    const gradeEmojis = {
      A: "🏆",
      B: "⭐",
      C: "📊",
      D: "⚠️"
    };

    const isUpgrade = getGradePriority(newGrade) > getGradePriority(oldGrade);
    const gradeEmoji = gradeEmojis[newGrade];
    const gradeLabel = gradeLabels[newGrade];

    // 시공기사에게 알림 발송
    if (contractorData.fcmToken) {
      const notificationData = {
        title: isUpgrade ? "🎉 등급 상승 축하합니다!" : "📊 등급이 변경되었습니다",
        body: `${gradeEmoji} ${gradeLabel}로 ${isUpgrade ? '상승' : '변경'}되었습니다. 평균 평점: ${gradeDetails.averageRating}`,
        data: {
          type: "grade_change",
          contractorId,
          oldGrade,
          newGrade,
          averageRating: gradeDetails.averageRating.toString(),
          isUpgrade: isUpgrade.toString()
        }
      };

      await sendPushNotification(contractorData.fcmToken, notificationData);
    }

    // 이메일 알림 발송
    if (contractorData.email) {
      const emailSubject = isUpgrade ? 
        "🎉 축하합니다! 등급이 상승했습니다" : 
        "📊 등급 변경 안내";

      const emailBody = generateGradeChangeEmail(
        contractorData.name || "시공기사님",
        oldGrade,
        newGrade,
        gradeDetails,
        isUpgrade
      );

      await sendEmailNotification(contractorData.email, emailSubject, emailBody);
    }

    // 알림 로그 저장
    await saveNotificationLog({
      type: "grade_change",
      recipientId: contractorId,
      recipientType: "contractor",
      title: notificationData.title,
      message: notificationData.body,
      data: {
        oldGrade,
        newGrade,
        averageRating: gradeDetails.averageRating,
        isUpgrade
      },
      status: "success"
    });

    console.log(`Grade change notification sent to contractor ${contractorId}`);
  } catch (error) {
    console.error(`Error sending grade change notification to contractor ${contractorId}:`, error);
    
    // 알림 실패 로그 저장
    await saveNotificationLog({
      type: "grade_change",
      recipientId: contractorId,
      recipientType: "contractor",
      title: "등급 변경 알림",
      message: "등급이 변경되었습니다",
      data: {
        oldGrade,
        newGrade,
        averageRating: gradeDetails.averageRating
      },
      status: "failure",
      error: error.message
    });
  }
}

/**
 * 등급 우선순위 반환
 * @param {string} grade - 등급
 * @returns {number} 우선순위 (높을수록 좋은 등급)
 */
function getGradePriority(grade) {
  const priorities = { A: 4, B: 3, C: 2, D: 1 };
  return priorities[grade] || 0;
}

/**
 * 푸시 알림 발송
 * @param {string} fcmToken - FCM 토큰
 * @param {Object} notificationData - 알림 데이터
 */
async function sendPushNotification(fcmToken, notificationData) {
  const message = {
    token: fcmToken,
    notification: {
      title: notificationData.title,
      body: notificationData.body
    },
    data: notificationData.data,
    android: {
      notification: {
        sound: 'default',
        priority: 'high'
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

  const response = await admin.messaging().send(message);
  return response;
}

/**
 * 이메일 알림 발송
 * @param {string} email - 이메일 주소
 * @param {string} subject - 제목
 * @param {string} body - 내용
 */
async function sendEmailNotification(email, subject, body) {
  // SendGrid 또는 다른 이메일 서비스 사용
  // 여기서는 기본적인 구조만 제공
  console.log(`Email notification would be sent to ${email}: ${subject}`);
  
  // 실제 구현 시 SendGrid API 호출
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to: email, from: 'noreply@yourdomain.com', subject, html: body });
}

/**
 * 등급 변경 이메일 내용 생성
 * @param {string} name - 이름
 * @param {string} oldGrade - 이전 등급
 * @param {string} newGrade - 새 등급
 * @param {Object} gradeDetails - 등급 상세 정보
 * @param {boolean} isUpgrade - 상승 여부
 * @returns {string} HTML 이메일 내용
 */
function generateGradeChangeEmail(name, oldGrade, newGrade, gradeDetails, isUpgrade) {
  const gradeInfo = {
    A: { label: "A등급 (우수)", benefits: ["우선 고객 배정", "프리미엄 요금 적용", "특별 프로모션 참여"] },
    B: { label: "B등급 (양호)", benefits: ["일반 고객 배정", "표준 요금 적용", "기본 프로모션 참여"] },
    C: { label: "C등급 (보통)", benefits: ["기본 고객 배정", "표준 요금 적용"] },
    D: { label: "D등급 (미흡)", benefits: ["제한적 고객 배정"] }
  };

  const currentGradeInfo = gradeInfo[newGrade];

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${isUpgrade ? '#10B981' : '#3B82F6'};">${isUpgrade ? '🎉 축하합니다!' : '📊 등급 변경 안내'}</h2>
      
      <p>안녕하세요, ${name}님</p>
      
      <p>귀하의 등급이 <strong>${oldGrade}등급</strong>에서 <strong>${newGrade}등급</strong>으로 ${isUpgrade ? '상승' : '변경'}되었습니다.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>📊 현재 평가 현황</h3>
        <ul>
          <li>평균 평점: <strong>${gradeDetails.averageRating}</strong></li>
          <li>총 평가 수: <strong>${gradeDetails.totalRatings}건</strong></li>
          <li>현재 등급: <strong>${currentGradeInfo.label}</strong></li>
        </ul>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>🎁 ${currentGradeInfo.label} 혜택</h3>
        <ul>
          ${currentGradeInfo.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
        </ul>
      </div>
      
      ${gradeDetails.recommendations.length > 0 ? `
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>💡 개선 권장사항</h3>
          <ul>
            ${gradeDetails.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <p>더 나은 서비스를 위해 계속 노력해 주시기 바랍니다.</p>
      
      <p>감사합니다.</p>
    </div>
  `;
}

/**
 * 알림 로그 저장
 * @param {Object} logData - 로그 데이터
 */
async function saveNotificationLog(logData) {
  try {
    await admin.firestore().collection('notificationLogs').add({
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving notification log:', error);
  }
}

// 수동 등급 업데이트 함수 (HTTP 호출용)
exports.manualUpdateContractorGrade = functions.https.onCall(async (data, context) => {
  // 관리자 권한 확인
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
  }

  const { contractorId } = data;
  
  if (!contractorId) {
    throw new functions.https.HttpsError('invalid-argument', '시공기사 ID가 필요합니다.');
  }

  try {
    const contractorRef = admin.firestore().collection('contractors').doc(contractorId);
    const contractorSnap = await contractorRef.get();
    
    if (!contractorSnap.exists) {
      throw new functions.https.HttpsError('not-found', '시공기사를 찾을 수 없습니다.');
    }

    const contractorData = contractorSnap.data();
    const oldGrade = contractorData.grade || 'C';
    const ratings = contractorData.ratings || [];
    
    const newGrade = calculateContractorGrade(ratings);
    const gradeDetails = calculateDetailedGrade(ratings);

    if (oldGrade !== newGrade) {
      await contractorRef.update({
        grade: newGrade,
        averageRating: gradeDetails.averageRating,
        lastGradeUpdate: admin.firestore.FieldValue.serverTimestamp()
      });

      // 등급 변경 알림 발송
      await sendGradeChangeNotification(contractorId, contractorData, oldGrade, newGrade, gradeDetails);
    }

    return {
      success: true,
      contractorId,
      oldGrade,
      newGrade,
      averageRating: gradeDetails.averageRating,
      totalRatings: gradeDetails.totalRatings
    };
  } catch (error) {
    console.error('Manual grade update error:', error);
    throw new functions.https.HttpsError('internal', '등급 업데이트 중 오류가 발생했습니다.');
  }
}); 