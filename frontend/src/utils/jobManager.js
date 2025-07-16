import { getFirestore, doc, runTransaction, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firestore = getFirestore();

/**
 * 작업 수락 함수 - 향상된 버전
 * @param {string} jobId - 작업 ID
 * @param {string} contractorId - 시공기사 ID
 * @param {object} options - 추가 옵션
 * @returns {Promise<object>} 결과 객체
 */
export async function acceptJob(jobId, contractorId, options = {}) {
  const {
    notifySeller = true,
    createAssignment = true,
    validateContractor = true,
    logActivity = true
  } = options;

  try {
    // 입력값 검증
    if (!jobId || !contractorId) {
      throw new Error("작업 ID와 시공기사 ID가 필요합니다.");
    }

    const jobRef = doc(firestore, "jobs", jobId);
    const contractorRef = doc(firestore, "contractors", contractorId);

    const result = await runTransaction(firestore, async (transaction) => {
      // 작업 문서 조회
      const jobDoc = await transaction.get(jobRef);
      if (!jobDoc.exists()) {
        throw new Error("작업이 존재하지 않습니다.");
      }

      const jobData = jobDoc.data();
      
      // 작업 상태 검증
      if (jobData.status !== "open") {
        throw new Error(`작업이 이미 ${getStatusText(jobData.status)} 상태입니다.`);
      }

      // 시공기사 검증 (선택사항)
      if (validateContractor) {
        const contractorDoc = await transaction.get(contractorRef);
        if (!contractorDoc.exists()) {
          throw new Error("시공기사 정보를 찾을 수 없습니다.");
        }

        const contractorData = contractorDoc.data();
        
        // 시공기사 상태 검증
        if (contractorData.status !== "active") {
          throw new Error("비활성화된 시공기사입니다.");
        }

        // 동시 작업 수 제한 검증
        const activeJobsCount = contractorData.activeJobsCount || 0;
        const maxJobs = contractorData.maxJobs || 5;
        
        if (activeJobsCount >= maxJobs) {
          throw new Error(`최대 동시 작업 수(${maxJobs}개)에 도달했습니다.`);
        }
      }

      // 작업 업데이트
      const updateData = {
        status: "assigned",
        assignedTo: contractorId,
        assignedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        urgentFeeEnabled: false, // 긴급 수수료 비활성화
        currentUrgentFeePercent: jobData.currentUrgentFeePercent || 0 // 현재 긴급 수수료 유지
      };

      transaction.update(jobRef, updateData);

      // 시공기사 정보 업데이트
      if (validateContractor) {
        transaction.update(contractorRef, {
          activeJobsCount: (contractorData.activeJobsCount || 0) + 1,
          lastJobAssigned: serverTimestamp(),
          totalJobsAssigned: (contractorData.totalJobsAssigned || 0) + 1
        });
      }

      return {
        success: true,
        jobId,
        contractorId,
        jobData,
        assignedAt: new Date()
      };
    });

    // 작업 배정 기록 생성
    if (createAssignment) {
      await createJobAssignment(jobId, contractorId, result.jobData);
    }

    // 판매자 알림 발송
    if (notifySeller) {
      await sendJobAssignmentNotification(jobId, contractorId, result.jobData);
    }

    // 활동 로그 기록
    if (logActivity) {
      await logJobActivity(jobId, contractorId, 'accepted', result.jobData);
    }

    console.log(`작업 수락 완료: ${jobId} -> ${contractorId}`);
    
    return {
      success: true,
      message: "작업이 성공적으로 수락되었습니다.",
      data: result
    };

  } catch (error) {
    console.error("작업 수락 실패:", error);
    
    // 활동 로그 기록 (실패)
    if (logActivity) {
      await logJobActivity(jobId, contractorId, 'accept_failed', { error: error.message });
    }

    return {
      success: false,
      error: error.message,
      message: `작업 수락 실패: ${error.message}`
    };
  }
}

/**
 * 작업 배정 기록 생성
 */
async function createJobAssignment(jobId, contractorId, jobData) {
  try {
    const assignmentData = {
      jobId,
      contractorId,
      sellerId: jobData.sellerId,
      baseFee: jobData.baseFee,
      urgentFeePercent: jobData.currentUrgentFeePercent || 0,
      totalFee: jobData.baseFee + ((jobData.baseFee * (jobData.currentUrgentFeePercent || 0)) / 100),
      status: "assigned",
      assignedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await addDoc(collection(firestore, "jobAssignments"), assignmentData);
    console.log(`작업 배정 기록 생성: ${jobId}`);
  } catch (error) {
    console.error("작업 배정 기록 생성 실패:", error);
  }
}

/**
 * 작업 배정 알림 발송
 */
async function sendJobAssignmentNotification(jobId, contractorId, jobData) {
  try {
    if (!jobData.sellerId) return;

    const notificationData = {
      userId: jobData.sellerId,
      type: "job_assigned",
      title: "작업이 배정되었습니다",
      message: `작업 "${jobData.name}"이 시공기사에게 배정되었습니다.`,
      data: {
        jobId,
        contractorId,
        jobName: jobData.name,
        assignedAt: new Date().toISOString()
      },
      priority: "normal",
      timestamp: serverTimestamp(),
      read: false
    };

    await addDoc(collection(firestore, "notifications"), notificationData);
    console.log(`작업 배정 알림 발송: ${jobId} -> ${jobData.sellerId}`);
  } catch (error) {
    console.error("작업 배정 알림 발송 실패:", error);
  }
}

/**
 * 작업 활동 로그 기록
 */
async function logJobActivity(jobId, contractorId, action, data = {}) {
  try {
    const activityData = {
      jobId,
      contractorId,
      action,
      data,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    await addDoc(collection(firestore, "jobActivityLogs"), activityData);
    console.log(`작업 활동 로그 기록: ${action} - ${jobId}`);
  } catch (error) {
    console.error("작업 활동 로그 기록 실패:", error);
  }
}

/**
 * 작업 거절 함수
 */
export async function declineJob(jobId, contractorId, reason = "") {
  try {
    if (!jobId || !contractorId) {
      throw new Error("작업 ID와 시공기사 ID가 필요합니다.");
    }

    const jobRef = doc(firestore, "jobs", jobId);

    await runTransaction(firestore, async (transaction) => {
      const jobDoc = await transaction.get(jobRef);
      if (!jobDoc.exists()) {
        throw new Error("작업이 존재하지 않습니다.");
      }

      const jobData = jobDoc.data();
      if (jobData.status !== "open") {
        throw new Error("이미 배정된 작업입니다.");
      }

      // 작업 거절 기록 추가
      const declinedBy = jobData.declinedBy || [];
      declinedBy.push({
        contractorId,
        reason,
        declinedAt: serverTimestamp()
      });

      transaction.update(jobRef, {
        declinedBy,
        lastUpdated: serverTimestamp()
      });
    });

    // 활동 로그 기록
    await logJobActivity(jobId, contractorId, 'declined', { reason });

    return {
      success: true,
      message: "작업이 거절되었습니다."
    };

  } catch (error) {
    console.error("작업 거절 실패:", error);
    return {
      success: false,
      error: error.message,
      message: `작업 거절 실패: ${error.message}`
    };
  }
}

/**
 * 작업 완료 함수
 */
export async function completeJob(jobId, contractorId, completionData = {}) {
  try {
    if (!jobId || !contractorId) {
      throw new Error("작업 ID와 시공기사 ID가 필요합니다.");
    }

    const jobRef = doc(firestore, "jobs", jobId);
    const contractorRef = doc(firestore, "contractors", contractorId);

    await runTransaction(firestore, async (transaction) => {
      const jobDoc = await transaction.get(jobRef);
      if (!jobDoc.exists()) {
        throw new Error("작업이 존재하지 않습니다.");
      }

      const jobData = jobDoc.data();
      if (jobData.status !== "assigned" || jobData.assignedTo !== contractorId) {
        throw new Error("완료할 수 없는 작업입니다.");
      }

      // 작업 완료 업데이트
      transaction.update(jobRef, {
        status: "completed",
        completedAt: serverTimestamp(),
        completionData: {
          ...completionData,
          completedBy: contractorId
        },
        lastUpdated: serverTimestamp()
      });

      // 시공기사 정보 업데이트
      const contractorDoc = await transaction.get(contractorRef);
      if (contractorDoc.exists()) {
        const contractorData = contractorDoc.data();
        transaction.update(contractorRef, {
          activeJobsCount: Math.max(0, (contractorData.activeJobsCount || 0) - 1),
          completedJobsCount: (contractorData.completedJobsCount || 0) + 1,
          lastJobCompleted: serverTimestamp()
        });
      }
    });

    // 완료 알림 발송
    await sendJobCompletionNotification(jobId, contractorId, jobData);

    // 활동 로그 기록
    await logJobActivity(jobId, contractorId, 'completed', completionData);

    return {
      success: true,
      message: "작업이 완료되었습니다."
    };

  } catch (error) {
    console.error("작업 완료 실패:", error);
    return {
      success: false,
      error: error.message,
      message: `작업 완료 실패: ${error.message}`
    };
  }
}

/**
 * 작업 완료 알림 발송
 */
async function sendJobCompletionNotification(jobId, contractorId, jobData) {
  try {
    if (!jobData.sellerId) return;

    const notificationData = {
      userId: jobData.sellerId,
      type: "job_completed",
      title: "작업이 완료되었습니다",
      message: `작업 "${jobData.name}"이 완료되었습니다.`,
      data: {
        jobId,
        contractorId,
        jobName: jobData.name,
        completedAt: new Date().toISOString()
      },
      priority: "normal",
      timestamp: serverTimestamp(),
      read: false
    };

    await addDoc(collection(firestore, "notifications"), notificationData);
  } catch (error) {
    console.error("작업 완료 알림 발송 실패:", error);
  }
}

/**
 * 작업 상태 텍스트 변환
 */
function getStatusText(status) {
  const statusMap = {
    'open': '모집중',
    'assigned': '배정됨',
    'in_progress': '진행중',
    'completed': '완료됨',
    'cancelled': '취소됨'
  };
  return statusMap[status] || status;
}

/**
 * 시공기사 작업 수락 가능 여부 확인
 */
export async function canAcceptJob(contractorId, jobId) {
  try {
    const contractorRef = doc(firestore, "contractors", contractorId);
    const jobRef = doc(firestore, "jobs", jobId);

    const [contractorDoc, jobDoc] = await Promise.all([
      contractorRef.get(),
      jobRef.get()
    ]);

    if (!contractorDoc.exists() || !jobDoc.exists()) {
      return { canAccept: false, reason: "시공기사 또는 작업 정보를 찾을 수 없습니다." };
    }

    const contractorData = contractorDoc.data();
    const jobData = jobDoc.data();

    // 시공기사 상태 확인
    if (contractorData.status !== "active") {
      return { canAccept: false, reason: "비활성화된 시공기사입니다." };
    }

    // 작업 상태 확인
    if (jobData.status !== "open") {
      return { canAccept: false, reason: "이미 배정된 작업입니다." };
    }

    // 동시 작업 수 확인
    const activeJobsCount = contractorData.activeJobsCount || 0;
    const maxJobs = contractorData.maxJobs || 5;
    
    if (activeJobsCount >= maxJobs) {
      return { canAccept: false, reason: `최대 동시 작업 수(${maxJobs}개)에 도달했습니다.` };
    }

    return { canAccept: true };
  } catch (error) {
    console.error("작업 수락 가능 여부 확인 실패:", error);
    return { canAccept: false, reason: "확인 중 오류가 발생했습니다." };
  }
} 