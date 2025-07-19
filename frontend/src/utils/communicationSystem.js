import { db } from '../firebase/firebase';
import { collection, doc, addDoc, updateDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { convertTo070 } from './phoneConverter';

/**
 * 통신 시스템 타입
 */
export const COMMUNICATION_TYPES = {
  IN_APP_CHAT: 'in_app_chat',
  ANONYMOUS_PHONE: 'anonymous_phone',
  KAKAO_TALK: 'kakao_talk',
  TEMP_NUMBER: 'temp_number'
};

/**
 * 익명 ID 생성
 * @param {string} type - 'customer' 또는 'worker'
 * @param {string} originalId - 원본 ID
 * @returns {string} 익명 ID
 */
export const generateAnonymousId = (type, originalId) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}_${timestamp}_${random}`;
};

/**
 * 임시 전화번호 생성
 * @param {string} workOrderId - 작업 주문 ID
 * @returns {string} 임시 전화번호
 */
export const generateTempPhoneNumber = (workOrderId) => {
  // 070-9xxx-xxxx 형태로 생성
  const prefix = '070';
  const middle = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  const last = Math.floor(Math.random() * 9000) + 1000;   // 1000-9999
  return `${prefix}-${middle}-${last}`;
};

/**
 * 통신 채널 생성
 * @param {Object} params - 채널 생성 파라미터
 * @returns {Promise<Object>} 생성된 채널 정보
 */
export const createCommunicationChannel = async (params) => {
  const {
    workOrderId,
    customerPhone,
    workerPhone,
    customerId,
    workerId,
    preferredMethod = COMMUNICATION_TYPES.IN_APP_CHAT
  } = params;

  try {
    const channelData = {
      workOrderId,
      customerId: generateAnonymousId('customer', customerId),
      workerId: generateAnonymousId('worker', workerId),
      customerPhone: customerPhone ? convertTo070(customerPhone) : null,
      workerPhone: workerPhone ? convertTo070(workerPhone) : null,
      tempPhoneNumber: generateTempPhoneNumber(workOrderId),
      preferredMethod,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messages: [],
      scheduledTime: null,
      lastActivity: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'communicationChannels'), channelData);
    
    return {
      id: docRef.id,
      ...channelData
    };
  } catch (error) {
    console.error('통신 채널 생성 실패:', error);
    throw error;
  }
};

/**
 * 메시지 전송
 * @param {string} channelId - 채널 ID
 * @param {Object} messageData - 메시지 데이터
 * @returns {Promise<Object>} 전송된 메시지
 */
export const sendMessage = async (channelId, messageData) => {
  const {
    senderId,
    senderType, // 'customer' 또는 'worker'
    message,
    messageType = 'text', // 'text', 'image', 'file', 'location'
    attachments = []
  } = messageData;

  try {
    const messageObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      senderId,
      senderType,
      message,
      messageType,
      attachments,
      timestamp: serverTimestamp(),
      read: false
    };

    // 채널에 메시지 추가
    const channelRef = doc(db, 'communicationChannels', channelId);
    const channelDoc = await getDoc(channelRef);
    
    if (channelDoc.exists()) {
      const channelData = channelDoc.data();
      const updatedMessages = [...(channelData.messages || []), messageObj];
      
      await updateDoc(channelRef, {
        messages: updatedMessages,
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return messageObj;
  } catch (error) {
    console.error('메시지 전송 실패:', error);
    throw error;
  }
};

/**
 * 채널 정보 조회
 * @param {string} channelId - 채널 ID
 * @returns {Promise<Object>} 채널 정보
 */
export const getChannelInfo = async (channelId) => {
  try {
    const channelRef = doc(db, 'communicationChannels', channelId);
    const channelDoc = await getDoc(channelRef);
    
    if (channelDoc.exists()) {
      return {
        id: channelDoc.id,
        ...channelDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('채널 정보 조회 실패:', error);
    throw error;
  }
};

/**
 * 작업 주문별 채널 조회
 * @param {string} workOrderId - 작업 주문 ID
 * @returns {Promise<Object>} 채널 정보
 */
export const getChannelByWorkOrder = async (workOrderId) => {
  try {
    const q = query(
      collection(db, 'communicationChannels'),
      where('workOrderId', '==', workOrderId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('작업 주문별 채널 조회 실패:', error);
    throw error;
  }
};

/**
 * 약속 시간 설정
 * @param {string} channelId - 채널 ID
 * @param {Date} scheduledTime - 약속 시간
 * @param {string} location - 약속 장소
 * @returns {Promise<Object>} 업데이트된 채널 정보
 */
export const setAppointmentTime = async (channelId, scheduledTime, location = null) => {
  try {
    const channelRef = doc(db, 'communicationChannels', channelId);
    
    await updateDoc(channelRef, {
      scheduledTime: scheduledTime,
      appointmentLocation: location,
      updatedAt: serverTimestamp()
    });

    // 약속 시간 설정 메시지 자동 생성
    const appointmentMessage = {
      senderId: 'system',
      senderType: 'system',
      message: `약속 시간이 설정되었습니다: ${scheduledTime.toLocaleString()}`,
      messageType: 'appointment',
      timestamp: serverTimestamp(),
      read: false
    };

    await sendMessage(channelId, appointmentMessage);
    
    return { success: true };
  } catch (error) {
    console.error('약속 시간 설정 실패:', error);
    throw error;
  }
};

/**
 * 채널 상태 업데이트
 * @param {string} channelId - 채널 ID
 * @param {string} status - 새로운 상태
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateChannelStatus = async (channelId, status) => {
  try {
    const channelRef = doc(db, 'communicationChannels', channelId);
    
    await updateDoc(channelRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('채널 상태 업데이트 실패:', error);
    throw error;
  }
};

/**
 * 통신 방법별 안내 메시지 생성
 * @param {string} method - 통신 방법
 * @returns {string} 안내 메시지
 */
export const getCommunicationGuide = (method) => {
  const guides = {
    [COMMUNICATION_TYPES.IN_APP_CHAT]: {
      title: '앱 내 채팅',
      description: '앱에서 직접 소통하세요. 안전하고 편리합니다.',
      instructions: [
        '앱 내 채팅방에서 실시간으로 소통',
        '사진, 파일 공유 가능',
        '약속 시간 자동 기록',
        '모든 대화 내용 보관'
      ]
    },
    [COMMUNICATION_TYPES.ANONYMOUS_PHONE]: {
      title: '익명 전화번호',
      description: '임시 전화번호로 안전하게 연락하세요.',
      instructions: [
        '고객의 실제 번호는 숨겨집니다',
        '임시 번호로만 연락 가능',
        '작업 완료 후 번호 자동 만료',
        '개인정보 보호 완벽'
      ]
    },
    [COMMUNICATION_TYPES.KAKAO_TALK]: {
      title: '카카오톡 연동',
      description: '익숙한 카카오톡으로 소통하세요.',
      instructions: [
        '카카오톡 채널로 연결',
        '파일, 사진, 위치 공유 가능',
        '익명 ID로 연동',
        '작업 완료 후 연결 해제'
      ]
    }
  };
  
  return guides[method] || guides[COMMUNICATION_TYPES.IN_APP_CHAT];
}; 