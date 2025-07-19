import { db } from '../firebase/firebase';
import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp,
  addDoc,
  where
} from 'firebase/firestore';
import { COLLABORATION_STATUS } from './collaborationManager';

// 관리자용 모든 협업요청 조회
export const getAllCollaborationRequests = async () => {
  try {
    const q = query(
      collection(db, 'collaborationRequests'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const requests = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      // 원본 시공요청 정보 조회
      const workOrderDoc = await getDoc(doc(db, 'workOrders', data.workOrderId));
      const workOrderData = workOrderDoc.data();
      
      // 요청자 정보 조회
      const requesterDoc = await getDoc(doc(db, 'users', data.requesterId));
      const requesterData = requesterDoc.data();
      
      // 수락한 협업자들 정보 조회
      const acceptedCollaborators = [];
      for (const contractorId of data.acceptedCollaborators || []) {
        const contractorDoc = await getDoc(doc(db, 'users', contractorId));
        if (contractorDoc.exists()) {
          acceptedCollaborators.push({
            id: contractorId,
            ...contractorDoc.data()
          });
        }
      }
      
      requests.push({
        id: doc.id,
        ...data,
        workOrder: workOrderData,
        requester: requesterData,
        acceptedCollaborators
      });
    }
    
    return requests;
  } catch (error) {
    console.error('모든 협업요청 조회 실패:', error);
    throw error;
  }
};

// 협업요청 수정 (관리자용)
export const updateCollaborationRequest = async (collaborationId, updates, adminId) => {
  try {
    const collaborationRef = doc(db, 'collaborationRequests', collaborationId);
    const collaborationDoc = await getDoc(collaborationRef);
    
    if (!collaborationDoc.exists()) {
      throw new Error('협업요청을 찾을 수 없습니다.');
    }

    const collaborationData = collaborationDoc.data();
    
    // 금액이 변경된 경우 검증
    if (updates.tasks) {
      const totalAssignedAmount = updates.tasks.reduce((sum, task) => sum + task.amount, 0);
      if (totalAssignedAmount !== collaborationData.totalAmount) {
        throw new Error('배정된 업무의 총 금액이 원본 시공요청 금액과 일치하지 않습니다.');
      }
    }

    // 관리자 수정 로그 추가
    const adminLog = {
      adminId,
      action: 'update',
      timestamp: serverTimestamp(),
      previousData: {
        tasks: collaborationData.tasks,
        notes: collaborationData.notes,
        status: collaborationData.status
      },
      newData: {
        tasks: updates.tasks || collaborationData.tasks,
        notes: updates.notes || collaborationData.notes,
        status: updates.status || collaborationData.status
      }
    };

    await updateDoc(collaborationRef, {
      ...updates,
      adminLogs: [...(collaborationData.adminLogs || []), adminLog],
      updatedAt: serverTimestamp(),
      lastModifiedBy: adminId
    });

    return {
      success: true,
      message: '협업요청이 수정되었습니다.'
    };
  } catch (error) {
    console.error('협업요청 수정 실패:', error);
    throw error;
  }
};

// 협업요청 삭제 (관리자용)
export const deleteCollaborationRequest = async (collaborationId, adminId, reason = '') => {
  try {
    const collaborationRef = doc(db, 'collaborationRequests', collaborationId);
    const collaborationDoc = await getDoc(collaborationRef);
    
    if (!collaborationDoc.exists()) {
      throw new Error('협업요청을 찾을 수 없습니다.');
    }

    const collaborationData = collaborationDoc.data();
    
    // 진행중인 협업은 삭제 불가 (안전장치)
    if (collaborationData.status === COLLABORATION_STATUS.IN_PROGRESS) {
      throw new Error('진행중인 협업은 삭제할 수 없습니다. 먼저 협업을 완료하거나 취소해주세요.');
    }

    // 원본 시공요청에서 협업요청 정보 제거
    const workOrderRef = doc(db, 'workOrders', collaborationData.workOrderId);
    await updateDoc(workOrderRef, {
      collaborationStatus: null,
      collaborationRequestId: null,
      updatedAt: serverTimestamp()
    });

    // 협업요청 삭제
    await deleteDoc(collaborationRef);

    // 삭제 로그 저장 (별도 컬렉션)
    await addDoc(collection(db, 'adminActionLogs'), {
      action: 'delete_collaboration',
      collaborationId,
      adminId,
      reason,
      deletedAt: serverTimestamp(),
      originalData: collaborationData
    });

    return {
      success: true,
      message: '협업요청이 삭제되었습니다.'
    };
  } catch (error) {
    console.error('협업요청 삭제 실패:', error);
    throw error;
  }
};

// 협업 강제 완료 (관리자용)
export const forceCompleteCollaboration = async (collaborationId, adminId, reason = '') => {
  try {
    const collaborationRef = doc(db, 'collaborationRequests', collaborationId);
    const collaborationDoc = await getDoc(collaborationRef);
    
    if (!collaborationDoc.exists()) {
      throw new Error('협업요청을 찾을 수 없습니다.');
    }

    const collaborationData = collaborationDoc.data();
    
    // 이미 완료된 협업은 처리 불가
    if (collaborationData.status === COLLABORATION_STATUS.COMPLETED) {
      throw new Error('이미 완료된 협업입니다.');
    }

    // 관리자 강제 완료 로그
    const adminLog = {
      adminId,
      action: 'force_complete',
      reason,
      timestamp: serverTimestamp(),
      previousStatus: collaborationData.status
    };

    await updateDoc(collaborationRef, {
      status: COLLABORATION_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
      forceCompletedBy: adminId,
      forceCompleteReason: reason,
      adminLogs: [...(collaborationData.adminLogs || []), adminLog],
      updatedAt: serverTimestamp()
    });

    // 원본 시공요청 상태 업데이트
    const workOrderRef = doc(db, 'workOrders', collaborationData.workOrderId);
    await updateDoc(workOrderRef, {
      collaborationStatus: COLLABORATION_STATUS.COMPLETED,
      status: 'completed',
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: '협업이 강제 완료되었습니다.'
    };
  } catch (error) {
    console.error('협업 강제 완료 실패:', error);
    throw error;
  }
};

// 협업 강제 취소 (관리자용)
export const forceCancelCollaboration = async (collaborationId, adminId, reason = '') => {
  try {
    const collaborationRef = doc(db, 'collaborationRequests', collaborationId);
    const collaborationDoc = await getDoc(collaborationRef);
    
    if (!collaborationDoc.exists()) {
      throw new Error('협업요청을 찾을 수 없습니다.');
    }

    const collaborationData = collaborationDoc.data();
    
    // 이미 완료되거나 취소된 협업은 처리 불가
    if (collaborationData.status === COLLABORATION_STATUS.COMPLETED || 
        collaborationData.status === COLLABORATION_STATUS.CANCELLED) {
      throw new Error('이미 완료되거나 취소된 협업입니다.');
    }

    // 관리자 강제 취소 로그
    const adminLog = {
      adminId,
      action: 'force_cancel',
      reason,
      timestamp: serverTimestamp(),
      previousStatus: collaborationData.status
    };

    await updateDoc(collaborationRef, {
      status: COLLABORATION_STATUS.CANCELLED,
      cancelledAt: serverTimestamp(),
      forceCancelledBy: adminId,
      forceCancelReason: reason,
      adminLogs: [...(collaborationData.adminLogs || []), adminLog],
      updatedAt: serverTimestamp()
    });

    // 원본 시공요청 상태 업데이트
    const workOrderRef = doc(db, 'workOrders', collaborationData.workOrderId);
    await updateDoc(workOrderRef, {
      collaborationStatus: null,
      collaborationRequestId: null,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: '협업이 강제 취소되었습니다.'
    };
  } catch (error) {
    console.error('협업 강제 취소 실패:', error);
    throw error;
  }
};

// 협업자 강제 제거 (관리자용)
export const removeCollaborator = async (collaborationId, contractorId, adminId, reason = '') => {
  try {
    const collaborationRef = doc(db, 'collaborationRequests', collaborationId);
    const collaborationDoc = await getDoc(collaborationRef);
    
    if (!collaborationDoc.exists()) {
      throw new Error('협업요청을 찾을 수 없습니다.');
    }

    const collaborationData = collaborationDoc.data();
    
    // 해당 협업자가 수락한 업무들 찾기
    const contractorTasks = collaborationData.collaboratorTasks?.filter(
      task => task.contractorId === contractorId
    ) || [];

    // 협업자 제거
    const updatedAcceptedCollaborators = collaborationData.acceptedCollaborators.filter(
      id => id !== contractorId
    );

    // 해당 협업자의 업무들 제거
    const updatedCollaboratorTasks = collaborationData.collaboratorTasks?.filter(
      task => task.contractorId !== contractorId
    ) || [];

    // 관리자 로그
    const adminLog = {
      adminId,
      action: 'remove_collaborator',
      contractorId,
      reason,
      removedTasks: contractorTasks,
      timestamp: serverTimestamp()
    };

    await updateDoc(collaborationRef, {
      acceptedCollaborators: updatedAcceptedCollaborators,
      collaboratorTasks: updatedCollaboratorTasks,
      adminLogs: [...(collaborationData.adminLogs || []), adminLog],
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: '협업자가 제거되었습니다.',
      removedTasks: contractorTasks
    };
  } catch (error) {
    console.error('협업자 제거 실패:', error);
    throw error;
  }
};

// 관리자 액션 로그 조회
export const getAdminActionLogs = async (collaborationId = null) => {
  try {
    let q = query(collection(db, 'adminActionLogs'), orderBy('deletedAt', 'desc'));
    
    if (collaborationId) {
      q = query(
        collection(db, 'adminActionLogs'),
        where('collaborationId', '==', collaborationId),
        orderBy('deletedAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const logs = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data
      });
    }
    
    return logs;
  } catch (error) {
    console.error('관리자 액션 로그 조회 실패:', error);
    throw error;
  }
};

// 협업요청 통계 조회 (관리자용)
export const getCollaborationStatistics = async () => {
  try {
    const allRequests = await getAllCollaborationRequests();
    
    const stats = {
      total: allRequests.length,
      pending: allRequests.filter(r => r.status === COLLABORATION_STATUS.PENDING).length,
      inProgress: allRequests.filter(r => r.status === COLLABORATION_STATUS.IN_PROGRESS).length,
      completed: allRequests.filter(r => r.status === COLLABORATION_STATUS.COMPLETED).length,
      cancelled: allRequests.filter(r => r.status === COLLABORATION_STATUS.CANCELLED).length,
      totalAmount: allRequests.reduce((sum, r) => sum + (r.totalAmount || 0), 0),
      averageCollaborators: allRequests.length > 0 
        ? allRequests.reduce((sum, r) => sum + (r.acceptedCollaborators?.length || 0), 0) / allRequests.length 
        : 0
    };
    
    return stats;
  } catch (error) {
    console.error('협업요청 통계 조회 실패:', error);
    throw error;
  }
}; 