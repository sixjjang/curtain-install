const functions = require('firebase-functions');
const admin = require('firebase-admin');

// 작업 상태 변경
exports.updateJobStatus = functions.https.onCall(async (data, context) => {
  try {
    const { jobId, newStatus, reason } = data;
    
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    
    if (!jobId || !newStatus) {
      throw new functions.https.HttpsError('invalid-argument', '작업 ID와 새로운 상태가 필요합니다.');
    }
    
    const userId = context.auth.uid;
    
    console.log(`작업 상태 변경 시작: ${jobId} -> ${newStatus} (사용자: ${userId})`);
    
    // 작업 정보 조회
    const jobRef = admin.firestore().collection('jobs').doc(jobId);
    const jobDoc = await jobRef.get();
    
    if (!jobDoc.exists) {
      throw new functions.https.HttpsError('not-found', '작업을 찾을 수 없습니다.');
    }
    
    const jobData = jobDoc.data();
    const oldStatus = jobData.status;
    
    // 권한 확인 (배정된 계약자만 상태 변경 가능)
    if (jobData.assignedTo !== userId) {
      throw new functions.https.HttpsError('permission-denied', '이 작업의 상태를 변경할 권한이 없습니다.');
    }
    
    // 상태 변경 유효성 검사
    const validTransitions = {
      'assigned': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // 완료된 작업은 더 이상 변경 불가
      'cancelled': [] // 취소된 작업은 더 이상 변경 불가
    };
    
    if (!validTransitions[oldStatus] || !validTransitions[oldStatus].includes(newStatus)) {
      throw new functions.https.HttpsError('invalid-argument', `상태를 ${oldStatus}에서 ${newStatus}로 변경할 수 없습니다.`);
    }
    
    // 상태 변경 시간
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    // 업데이트할 데이터 준비
    const updateData = {
      status: newStatus,
      updatedAt: now,
      lastStatusChange: now,
      statusChangeHistory: admin.firestore.FieldValue.arrayUnion({
        fromStatus: oldStatus,
        toStatus: newStatus,
        changedBy: userId,
        changedAt: now,
        reason: reason || null
      })
    };
    
    // 상태별 추가 처리
    switch (newStatus) {
      case 'in_progress':
        updateData.startedAt = now;
        updateData.startedBy = userId;
        break;
      case 'completed':
        updateData.completedAt = now;
        updateData.completedBy = userId;
        break;
      case 'cancelled':
        updateData.cancelledAt = now;
        updateData.cancelledBy = userId;
        updateData.cancellationReason = reason;
        break;
    }
    
    // 작업 상태 업데이트
    await jobRef.update(updateData);
    
    // 상태 변경 알림 전송
    await sendStatusChangeNotification(jobData, oldStatus, newStatus, userId);
    
    // 작업 완료 시 계약자 통계 업데이트
    if (newStatus === 'completed') {
      await updateContractorStats(userId);
    }
    
    console.log(`작업 상태 변경 완료: ${jobId} ${oldStatus} -> ${newStatus}`);
    
    return {
      success: true,
      message: `작업 상태가 성공적으로 ${newStatus}로 변경되었습니다.`,
      jobId: jobId,
      oldStatus: oldStatus,
      newStatus: newStatus
    };
    
  } catch (error) {
    console.error('작업 상태 변경 실패:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 상태 변경 알림 전송
async function sendStatusChangeNotification(jobData, oldStatus, newStatus, userId) {
  try {
    const statusLabels = {
      'assigned': '배정됨',
      'in_progress': '진행중',
      'completed': '완료',
      'cancelled': '취소'
    };
    
    const notificationTitle = `작업 상태 변경: ${statusLabels[newStatus]}`;
    let notificationBody = '';
    
    switch (newStatus) {
      case 'in_progress':
        notificationBody = `${jobData.siteName} 작업이 시작되었습니다.`;
        break;
      case 'completed':
        notificationBody = `${jobData.siteName} 작업이 완료되었습니다.`;
        break;
      case 'cancelled':
        notificationBody = `${jobData.siteName} 작업이 취소되었습니다.`;
        break;
      default:
        notificationBody = `${jobData.siteName} 작업 상태가 변경되었습니다.`;
    }
    
    // 고객에게 알림 전송
    if (jobData.customerId) {
      const customerMessage = {
        token: await getCustomerFCMToken(jobData.customerId),
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: {
          type: 'job_status_change',
          jobId: jobData.id,
          oldStatus: oldStatus,
          newStatus: newStatus,
          click_action: `/jobs/${jobData.id}`
        }
      };
      
      if (customerMessage.token) {
        await admin.messaging().send(customerMessage);
      }
    }
    
    // 관리자에게 알림 전송
    await sendAdminNotification(jobData, oldStatus, newStatus);
    
  } catch (error) {
    console.error('상태 변경 알림 전송 실패:', error);
  }
}

// 고객 FCM 토큰 가져오기
async function getCustomerFCMToken(customerId) {
  try {
    const customerDoc = await admin.firestore()
      .collection('users')
      .doc(customerId)
      .get();
    
    if (customerDoc.exists) {
      return customerDoc.data().fcmToken;
    }
    return null;
  } catch (error) {
    console.error('고객 FCM 토큰 조회 실패:', error);
    return null;
  }
}

// 관리자 알림 전송
async function sendAdminNotification(jobData, oldStatus, newStatus) {
  try {
    // 관리자 목록 조회
    const adminQuery = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();
    
    const adminTokens = [];
    adminQuery.forEach(doc => {
      const fcmToken = doc.data().fcmToken;
      if (fcmToken) {
        adminTokens.push(fcmToken);
      }
    });
    
    if (adminTokens.length > 0) {
      const adminMessage = {
        notification: {
          title: '작업 상태 변경 알림',
          body: `${jobData.siteName} 작업이 ${oldStatus}에서 ${newStatus}로 변경되었습니다.`
        },
        data: {
          type: 'admin_job_status_change',
          jobId: jobData.id,
          oldStatus: oldStatus,
          newStatus: newStatus,
          click_action: `/admin/jobs/${jobData.id}`
        },
        tokens: adminTokens
      };
      
      await admin.messaging().sendMulticast(adminMessage);
    }
  } catch (error) {
    console.error('관리자 알림 전송 실패:', error);
  }
}

// 계약자 통계 업데이트
async function updateContractorStats(contractorId) {
  try {
    // 완료된 작업 수 계산
    const completedJobsQuery = await admin.firestore()
      .collection('jobs')
      .where('assignedTo', '==', contractorId)
      .where('status', '==', 'completed')
      .get();
    
    const completedJobsCount = completedJobsQuery.size;
    
    // 계약자 정보 업데이트
    await admin.firestore()
      .collection('contractors')
      .doc(contractorId)
      .update({
        completedJobsCount: completedJobsCount,
        lastJobCompletedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log(`계약자 ${contractorId} 통계 업데이트 완료: 완료 작업 ${completedJobsCount}개`);
    
  } catch (error) {
    console.error('계약자 통계 업데이트 실패:', error);
  }
}

// 작업 상태 일괄 업데이트 (관리자용)
exports.batchUpdateJobStatus = functions.https.onCall(async (data, context) => {
  try {
    const { jobIds, newStatus, reason } = data;
    
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
    }
    
    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', '작업 ID 목록이 필요합니다.');
    }
    
    if (!newStatus) {
      throw new functions.https.HttpsError('invalid-argument', '새로운 상태가 필요합니다.');
    }
    
    console.log(`작업 상태 일괄 변경 시작: ${jobIds.length}개 작업 -> ${newStatus}`);
    
    const batch = admin.firestore().batch();
    const results = [];
    const errors = [];
    
    for (const jobId of jobIds) {
      try {
        const jobRef = admin.firestore().collection('jobs').doc(jobId);
        const jobDoc = await jobRef.get();
        
        if (!jobDoc.exists) {
          errors.push({ jobId, error: '작업을 찾을 수 없습니다.' });
          continue;
        }
        
        const jobData = jobDoc.data();
        const oldStatus = jobData.status;
        
        // 상태 변경
        batch.update(jobRef, {
          status: newStatus,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastStatusChange: admin.firestore.FieldValue.serverTimestamp(),
          statusChangeHistory: admin.firestore.FieldValue.arrayUnion({
            fromStatus: oldStatus,
            toStatus: newStatus,
            changedBy: context.auth.uid,
            changedAt: admin.firestore.FieldValue.serverTimestamp(),
            reason: reason || '관리자 일괄 변경'
          })
        });
        
        results.push({ jobId, oldStatus, newStatus });
        
      } catch (error) {
        errors.push({ jobId, error: error.message });
      }
    }
    
    // 배치 커밋
    await batch.commit();
    
    console.log(`작업 상태 일괄 변경 완료: ${results.length}개 성공, ${errors.length}개 실패`);
    
    return {
      success: true,
      message: `${results.length}개 작업의 상태가 변경되었습니다.`,
      results: results,
      errors: errors
    };
    
  } catch (error) {
    console.error('작업 상태 일괄 변경 실패:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 작업 상태 통계 조회
exports.getJobStatusStats = functions.https.onCall(async (data, context) => {
  try {
    const { contractorId } = data;
    
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    
    const userId = context.auth.uid;
    const targetContractorId = contractorId || userId;
    
    // 권한 확인 (본인 또는 관리자만 조회 가능)
    if (targetContractorId !== userId && !context.auth.token.admin) {
      throw new functions.https.HttpsError('permission-denied', '다른 사용자의 통계를 조회할 수 없습니다.');
    }
    
    console.log(`작업 상태 통계 조회: ${targetContractorId}`);
    
    // 각 상태별 작업 수 조회
    const statuses = ['assigned', 'in_progress', 'completed', 'cancelled'];
    const stats = {};
    
    for (const status of statuses) {
      const query = admin.firestore()
        .collection('jobs')
        .where('assignedTo', '==', targetContractorId)
        .where('status', '==', status);
      
      const snapshot = await query.get();
      stats[status] = snapshot.size;
    }
    
    // 전체 작업 수
    const totalQuery = admin.firestore()
      .collection('jobs')
      .where('assignedTo', '==', targetContractorId);
    
    const totalSnapshot = await totalQuery.get();
    stats.total = totalSnapshot.size;
    
    // 완료율 계산
    stats.completionRate = stats.total > 0 ? 
      Math.round((stats.completed / stats.total) * 100) : 0;
    
    console.log(`작업 상태 통계 조회 완료:`, stats);
    
    return {
      success: true,
      stats: stats
    };
    
  } catch (error) {
    console.error('작업 상태 통계 조회 실패:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

module.exports = {
  updateJobStatus: exports.updateJobStatus,
  batchUpdateJobStatus: exports.batchUpdateJobStatus,
  getJobStatusStats: exports.getJobStatusStats
}; 