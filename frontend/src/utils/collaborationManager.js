import { db } from '../firebase/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

// 협업요청 상태 상수
export const COLLABORATION_STATUS = {
  PENDING: 'pending',      // 협업요청 대기중
  ACCEPTED: 'accepted',    // 협업 수락됨
  REJECTED: 'rejected',    // 협업 거절됨
  IN_PROGRESS: 'in_progress', // 협업 진행중
  COMPLETED: 'completed',  // 협업 완료
  CANCELLED: 'cancelled'   // 협업 취소
};

// 협업요청 생성
export const createCollaborationRequest = async (workOrderId, requesterId, tasks) => {
  try {
    // 원본 시공요청 조회
    const workOrderRef = doc(db, 'workOrders', workOrderId);
    const workOrderDoc = await getDoc(workOrderRef);
    
    if (!workOrderDoc.exists()) {
      throw new Error('시공요청을 찾을 수 없습니다.');
    }

    const workOrderData = workOrderDoc.data();
    
    // 총 금액 검증
    const totalAssignedAmount = tasks.reduce((sum, task) => sum + task.amount, 0);
    if (totalAssignedAmount !== workOrderData.totalAmount) {
      throw new Error('배정된 업무의 총 금액이 원본 시공요청 금액과 일치하지 않습니다.');
    }

    // 협업요청 데이터 생성
    const collaborationData = {
      workOrderId,
      requesterId, // 협업요청한 시공자 ID
      originalContractorId: workOrderData.contractorId, // 원본 수락 시공자
      tasks, // 배정된 업무 목록
      totalAmount: totalAssignedAmount,
      status: COLLABORATION_STATUS.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      acceptedCollaborators: [], // 수락한 협업자들
      rejectedCollaborators: [], // 거절한 협업자들
      notes: '', // 협업요청 메모
      deadline: workOrderData.deadline // 원본 마감일
    };

    // 협업요청 저장
    const collaborationRef = await addDoc(collection(db, 'collaborationRequests'), collaborationData);
    
    // 원본 시공요청에 협업요청 정보 추가
    await updateDoc(workOrderRef, {
      collaborationRequestId: collaborationRef.id,
      collaborationStatus: COLLABORATION_STATUS.PENDING,
      updatedAt: serverTimestamp()
    });

    return {
      id: collaborationRef.id,
      ...collaborationData
    };
  } catch (error) {
    console.error('협업요청 생성 실패:', error);
    throw error;
  }
};

// 협업요청 목록 조회 (시공자용)
export const getCollaborationRequestsForContractors = async () => {
  try {
    const q = query(
      collection(db, 'collaborationRequests'),
      where('status', '==', COLLABORATION_STATUS.PENDING),
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
      
      requests.push({
        id: doc.id,
        ...data,
        workOrder: workOrderData,
        requester: requesterData
      });
    }
    
    return requests;
  } catch (error) {
    console.error('협업요청 목록 조회 실패:', error);
    throw error;
  }
};

// 내가 요청한 협업요청 목록 조회
export const getMyCollaborationRequests = async (contractorId) => {
  try {
    const q = query(
      collection(db, 'collaborationRequests'),
      where('requesterId', '==', contractorId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const requests = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      // 원본 시공요청 정보 조회
      const workOrderDoc = await getDoc(doc(db, 'workOrders', data.workOrderId));
      const workOrderData = workOrderDoc.data();
      
      requests.push({
        id: doc.id,
        ...data,
        workOrder: workOrderData
      });
    }
    
    return requests;
  } catch (error) {
    console.error('내 협업요청 목록 조회 실패:', error);
    throw error;
  }
};

// 내가 수락한 협업요청 목록 조회
export const getAcceptedCollaborations = async (contractorId) => {
  try {
    const q = query(
      collection(db, 'collaborationRequests'),
      where('acceptedCollaborators', 'array-contains', contractorId),
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
      
      requests.push({
        id: doc.id,
        ...data,
        workOrder: workOrderData,
        requester: requesterData
      });
    }
    
    return requests;
  } catch (error) {
    console.error('수락한 협업요청 목록 조회 실패:', error);
    throw error;
  }
};

// 협업요청 수락
export const acceptCollaborationRequest = async (collaborationId, contractorId, acceptedTasks) => {
  try {
    const collaborationRef = doc(db, 'collaborationRequests', collaborationId);
    const collaborationDoc = await getDoc(collaborationRef);
    
    if (!collaborationDoc.exists()) {
      throw new Error('협업요청을 찾을 수 없습니다.');
    }

    const collaborationData = collaborationDoc.data();
    
    // 이미 수락했는지 확인
    if (collaborationData.acceptedCollaborators.includes(contractorId)) {
      throw new Error('이미 수락한 협업요청입니다.');
    }

    // 거절 목록에서 제거
    const updatedRejectedCollaborators = collaborationData.rejectedCollaborators.filter(
      id => id !== contractorId
    );

    // 수락 목록에 추가
    const updatedAcceptedCollaborators = [...collaborationData.acceptedCollaborators, contractorId];

    // 협업자별 수락한 업무 정보 추가
    const collaboratorTasks = acceptedTasks.map(task => ({
      ...task,
      contractorId,
      acceptedAt: serverTimestamp()
    }));

    await updateDoc(collaborationRef, {
      acceptedCollaborators: updatedAcceptedCollaborators,
      rejectedCollaborators: updatedRejectedCollaborators,
      collaboratorTasks: [...(collaborationData.collaboratorTasks || []), ...collaboratorTasks],
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: '협업요청을 수락했습니다.'
    };
  } catch (error) {
    console.error('협업요청 수락 실패:', error);
    throw error;
  }
};

// 협업요청 거절
export const rejectCollaborationRequest = async (collaborationId, contractorId, reason = '') => {
  try {
    const collaborationRef = doc(db, 'collaborationRequests', collaborationId);
    const collaborationDoc = await getDoc(collaborationRef);
    
    if (!collaborationDoc.exists()) {
      throw new Error('협업요청을 찾을 수 없습니다.');
    }

    const collaborationData = collaborationDoc.data();
    
    // 이미 거절했는지 확인
    if (collaborationData.rejectedCollaborators.includes(contractorId)) {
      throw new Error('이미 거절한 협업요청입니다.');
    }

    // 수락 목록에서 제거
    const updatedAcceptedCollaborators = collaborationData.acceptedCollaborators.filter(
      id => id !== contractorId
    );

    // 거절 목록에 추가
    const updatedRejectedCollaborators = [...collaborationData.rejectedCollaborators, contractorId];

    await updateDoc(collaborationRef, {
      acceptedCollaborators: updatedAcceptedCollaborators,
      rejectedCollaborators: updatedRejectedCollaborators,
      rejectionReasons: {
        ...collaborationData.rejectionReasons,
        [contractorId]: reason
      },
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: '협업요청을 거절했습니다.'
    };
  } catch (error) {
    console.error('협업요청 거절 실패:', error);
    throw error;
  }
};

// 협업요청 취소 (요청자만 가능)
export const cancelCollaborationRequest = async (collaborationId, requesterId) => {
  try {
    const collaborationRef = doc(db, 'collaborationRequests', collaborationId);
    const collaborationDoc = await getDoc(collaborationRef);
    
    if (!collaborationDoc.exists()) {
      throw new Error('협업요청을 찾을 수 없습니다.');
    }

    const collaborationData = collaborationDoc.data();
    
    // 요청자 본인인지 확인
    if (collaborationData.requesterId !== requesterId) {
      throw new Error('협업요청을 취소할 권한이 없습니다.');
    }

    // 이미 진행중인 협업은 취소 불가
    if (collaborationData.status === COLLABORATION_STATUS.IN_PROGRESS) {
      throw new Error('진행중인 협업은 취소할 수 없습니다.');
    }

    await updateDoc(collaborationRef, {
      status: COLLABORATION_STATUS.CANCELLED,
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
      message: '협업요청을 취소했습니다.'
    };
  } catch (error) {
    console.error('협업요청 취소 실패:', error);
    throw error;
  }
};

// 협업 시작 (모든 협업자가 수락한 후)
export const startCollaboration = async (collaborationId, requesterId) => {
  try {
    const collaborationRef = doc(db, 'collaborationRequests', collaborationId);
    const collaborationDoc = await getDoc(collaborationRef);
    
    if (!collaborationDoc.exists()) {
      throw new Error('협업요청을 찾을 수 없습니다.');
    }

    const collaborationData = collaborationDoc.data();
    
    // 요청자 본인인지 확인
    if (collaborationData.requesterId !== requesterId) {
      throw new Error('협업을 시작할 권한이 없습니다.');
    }

    // 모든 업무가 수락되었는지 확인
    const allTasksAssigned = collaborationData.tasks.every(task => 
      collaborationData.collaboratorTasks?.some(ct => 
        ct.taskId === task.id && ct.contractorId
      )
    );

    if (!allTasksAssigned) {
      throw new Error('모든 업무가 배정되지 않았습니다.');
    }

    await updateDoc(collaborationRef, {
      status: COLLABORATION_STATUS.IN_PROGRESS,
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 원본 시공요청 상태 업데이트
    const workOrderRef = doc(db, 'workOrders', collaborationData.workOrderId);
    await updateDoc(workOrderRef, {
      collaborationStatus: COLLABORATION_STATUS.IN_PROGRESS,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: '협업을 시작했습니다.'
    };
  } catch (error) {
    console.error('협업 시작 실패:', error);
    throw error;
  }
};

// 협업 완료
export const completeCollaboration = async (collaborationId, requesterId) => {
  try {
    const collaborationRef = doc(db, 'collaborationRequests', collaborationId);
    const collaborationDoc = await getDoc(collaborationRef);
    
    if (!collaborationDoc.exists()) {
      throw new Error('협업요청을 찾을 수 없습니다.');
    }

    const collaborationData = collaborationDoc.data();
    
    // 요청자 본인인지 확인
    if (collaborationData.requesterId !== requesterId) {
      throw new Error('협업을 완료할 권한이 없습니다.');
    }

    await updateDoc(collaborationRef, {
      status: COLLABORATION_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
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
      message: '협업을 완료했습니다.'
    };
  } catch (error) {
    console.error('협업 완료 실패:', error);
    throw error;
  }
};

// 협업요청 상세 정보 조회
export const getCollaborationRequestDetail = async (collaborationId) => {
  try {
    const collaborationRef = doc(db, 'collaborationRequests', collaborationId);
    const collaborationDoc = await getDoc(collaborationRef);
    
    if (!collaborationDoc.exists()) {
      throw new Error('협업요청을 찾을 수 없습니다.');
    }

    const data = collaborationDoc.data();
    
    // 원본 시공요청 정보 조회
    const workOrderDoc = await getDoc(doc(db, 'workOrders', data.workOrderId));
    const workOrderData = workOrderDoc.data();
    
    // 요청자 정보 조회
    const requesterDoc = await getDoc(doc(db, 'users', data.requesterId));
    const requesterData = requesterDoc.data();
    
    // 수락한 협업자들 정보 조회
    const acceptedCollaborators = [];
    for (const contractorId of data.acceptedCollaborators) {
      const contractorDoc = await getDoc(doc(db, 'users', contractorId));
      if (contractorDoc.exists()) {
        acceptedCollaborators.push({
          id: contractorId,
          ...contractorDoc.data()
        });
      }
    }

    return {
      id: collaborationDoc.id,
      ...data,
      workOrder: workOrderData,
      requester: requesterData,
      acceptedCollaborators
    };
  } catch (error) {
    console.error('협업요청 상세 조회 실패:', error);
    throw error;
  }
}; 