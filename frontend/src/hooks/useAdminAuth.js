import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * 관리자 권한을 확인하는 커스텀 훅
 * @returns {Object} 관리자 권한 상태와 관련 함수들
 */
export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const auth = getAuth();
  const functions = getFunctions();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // 사용자의 ID 토큰을 새로고침하여 최신 커스텀 클레임을 가져옴
          await user.getIdToken(true);
          const tokenResult = await user.getIdTokenResult();
          setIsAdmin(tokenResult.claims?.admin || false);
        } catch (error) {
          console.error('관리자 권한 확인 중 오류:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  /**
   * 특정 사용자에게 관리자 권한을 부여하는 함수
   * @param {string} uid - 관리자 권한을 부여할 사용자의 UID
   */
  const grantAdminRole = async (uid) => {
    try {
      const functionUrl = `https://${functions.app.options.region}-${functions.app.options.projectId}.cloudfunctions.net/관리자권한부여`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid })
      });

      if (response.ok) {
        return { success: true, message: '관리자 권한이 부여되었습니다.' };
      } else {
        throw new Error('관리자 권한 부여 실패');
      }
    } catch (error) {
      console.error('관리자 권한 부여 오류:', error);
      return { success: false, message: '관리자 권한 부여 중 오류가 발생했습니다.' };
    }
  };

  /**
   * 특정 사용자의 관리자 권한을 제거하는 함수
   * @param {string} uid - 관리자 권한을 제거할 사용자의 UID
   */
  const revokeAdminRole = async (uid) => {
    try {
      const functionUrl = `https://${functions.app.options.region}-${functions.app.options.projectId}.cloudfunctions.net/관리자권한제거`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid })
      });

      if (response.ok) {
        return { success: true, message: '관리자 권한이 제거되었습니다.' };
      } else {
        throw new Error('관리자 권한 제거 실패');
      }
    } catch (error) {
      console.error('관리자 권한 제거 오류:', error);
      return { success: false, message: '관리자 권한 제거 중 오류가 발생했습니다.' };
    }
  };

  /**
   * 특정 사용자의 관리자 권한을 확인하는 함수
   * @param {string} uid - 확인할 사용자의 UID
   */
  const checkAdminRole = async (uid) => {
    try {
      const functionUrl = `https://${functions.app.options.region}-${functions.app.options.projectId}.cloudfunctions.net/관리자권한확인?uid=${uid}`;
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        throw new Error('관리자 권한 확인 실패');
      }
    } catch (error) {
      console.error('관리자 권한 확인 오류:', error);
      return { isAdmin: false, error: '관리자 권한 확인 중 오류가 발생했습니다.' };
    }
  };

  return {
    isAdmin,
    loading,
    user,
    grantAdminRole,
    revokeAdminRole,
    checkAdminRole
  };
}; 