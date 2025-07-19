import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/firebase';

// 클라이언트 사이드에서만 Firebase Functions 사용
let functions = null;

const getFunctionsInstance = () => {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 null 반환
    return null;
  }
  
  if (!functions) {
    try {
      const { getApp } = require('firebase/app');
      functions = getFunctions(getApp());
    } catch (error) {
      console.error('Firebase Functions 초기화 실패:', error);
      return null;
    }
  }
  
  return functions;
};

/**
 * Firebase Functions를 통한 ID 생성 유틸리티
 */

/**
 * 작업주문 ID 생성
 * @returns {Promise<string>} 생성된 작업주문 ID
 */
export const generateWorkOrderId = async () => {
  try {
    const functionsInstance = getFunctionsInstance();
    if (!functionsInstance) {
      throw new Error('Firebase Functions를 사용할 수 없습니다.');
    }
    
    const generateWorkOrderIdFunction = httpsCallable(functionsInstance, 'generateWorkOrderId');
    const result = await generateWorkOrderIdFunction();
    
    if (result.data.success) {
      return result.data.id;
    } else {
      throw new Error('ID 생성에 실패했습니다.');
    }
  } catch (error) {
    console.error('작업주문 ID 생성 실패:', error);
    throw error;
  }
};

/**
 * 견적 ID 생성
 * @returns {Promise<string>} 생성된 견적 ID
 */
export const generateEstimateId = async () => {
  try {
    const functionsInstance = getFunctionsInstance();
    if (!functionsInstance) {
      throw new Error('Firebase Functions를 사용할 수 없습니다.');
    }
    
    const generateEstimateIdFunction = httpsCallable(functionsInstance, 'generateEstimateId');
    const result = await generateEstimateIdFunction();
    
    if (result.data.success) {
      return result.data.id;
    } else {
      throw new Error('ID 생성에 실패했습니다.');
    }
  } catch (error) {
    console.error('견적 ID 생성 실패:', error);
    throw error;
  }
};

/**
 * 프로젝트 ID 생성
 * @returns {Promise<string>} 생성된 프로젝트 ID
 */
export const generateProjectId = async () => {
  try {
    const functionsInstance = getFunctionsInstance();
    if (!functionsInstance) {
      throw new Error('Firebase Functions를 사용할 수 없습니다.');
    }
    
    const generateProjectIdFunction = httpsCallable(functionsInstance, 'generateProjectId');
    const result = await generateProjectIdFunction();
    
    if (result.data.success) {
      return result.data.id;
    } else {
      throw new Error('ID 생성에 실패했습니다.');
    }
  } catch (error) {
    console.error('프로젝트 ID 생성 실패:', error);
    throw error;
  }
};

/**
 * 결제 ID 생성
 * @returns {Promise<string>} 생성된 결제 ID
 */
export const generatePaymentId = async () => {
  try {
    const functionsInstance = getFunctionsInstance();
    if (!functionsInstance) {
      throw new Error('Firebase Functions를 사용할 수 없습니다.');
    }
    
    const generatePaymentIdFunction = httpsCallable(functionsInstance, 'generatePaymentId');
    const result = await generatePaymentIdFunction();
    
    if (result.data.success) {
      return result.data.id;
    } else {
      throw new Error('ID 생성에 실패했습니다.');
    }
  } catch (error) {
    console.error('결제 ID 생성 실패:', error);
    throw error;
  }
};

/**
 * 통신 채널 ID 생성
 * @returns {Promise<string>} 생성된 통신 채널 ID
 */
export const generateChannelId = async () => {
  try {
    const functionsInstance = getFunctionsInstance();
    if (!functionsInstance) {
      throw new Error('Firebase Functions를 사용할 수 없습니다.');
    }
    
    const generateChannelIdFunction = httpsCallable(functionsInstance, 'generateChannelId');
    const result = await generateChannelIdFunction();
    
    if (result.data.success) {
      return result.data.id;
    } else {
      throw new Error('ID 생성에 실패했습니다.');
    }
  } catch (error) {
    console.error('통신 채널 ID 생성 실패:', error);
    throw error;
  }
};

/**
 * ID 유효성 검사
 * @param {string} id - 검사할 ID
 * @param {string} type - ID 타입 ('WO', 'ES', 'PR', 'PY', 'CH')
 * @returns {Promise<Object>} 검사 결과
 */
export const validateId = async (id, type) => {
  try {
    const functionsInstance = getFunctionsInstance();
    if (!functionsInstance) {
      throw new Error('Firebase Functions를 사용할 수 없습니다.');
    }
    
    const validateIdFunction = httpsCallable(functionsInstance, 'validateId');
    const result = await validateIdFunction({ id, type });
    
    return result.data;
  } catch (error) {
    console.error('ID 유효성 검사 실패:', error);
    throw error;
  }
};

/**
 * ID 통계 조회
 * @param {string} date - 날짜 (YYYYMMDD 형식)
 * @returns {Promise<Object>} 통계 정보
 */
export const getIdStats = async (date) => {
  try {
    const functionsInstance = getFunctionsInstance();
    if (!functionsInstance) {
      throw new Error('Firebase Functions를 사용할 수 없습니다.');
    }
    
    const getIdStatsFunction = httpsCallable(functionsInstance, 'getIdStats');
    const result = await getIdStatsFunction({ date });
    
    return result.data;
  } catch (error) {
    console.error('ID 통계 조회 실패:', error);
    throw error;
  }
};

/**
 * 오늘 날짜의 ID 통계 조회
 * @returns {Promise<Object>} 오늘 날짜의 통계 정보
 */
export const getTodayIdStats = async () => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const dateKey = `${year}${month}${day}`;
  
  return await getIdStats(dateKey);
}; 