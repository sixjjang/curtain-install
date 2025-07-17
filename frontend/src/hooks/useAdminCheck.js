import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';

/**
 * 관리자 권한을 확인하는 훅 (Next.js 스타일)
 * @returns {Object} 관리자 권한 상태
 */
const useAdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if auth is available (client-side only)
    if (!auth) {
      setLoading(false);
      setIsAdmin(false);
      return;
    }

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
  }, []);

  return {
    isAdmin,
    loading,
    user
  };
};

export default useAdminCheck; 