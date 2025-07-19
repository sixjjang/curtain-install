import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

const KakaoLoginButton = ({ onLoginSuccess, onLoginError, className = "", selectedRole = "seller", disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [sdkInitialized, setSdkInitialized] = useState(false);

  useEffect(() => {
    // 카카오 SDK 초기화
    const initializeKakao = () => {
      try {
        if (typeof window !== 'undefined' && window.Kakao) {
          if (!window.Kakao.isInitialized()) {
            const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "YOUR_KAKAO_JAVASCRIPT_KEY";
            window.Kakao.init(kakaoKey);
            console.log("카카오 SDK 초기화 완료");
          }
          setSdkInitialized(true);
        } else {
          console.error("카카오 SDK를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("카카오 SDK 초기화 실패:", error);
      }
    };

    // SDK가 로드될 때까지 대기
    const checkKakaoSDK = () => {
      if (typeof window !== 'undefined' && window.Kakao) {
        initializeKakao();
      } else {
        setTimeout(checkKakaoSDK, 100);
      }
    };

    checkKakaoSDK();
  }, []);

  const loginWithKakao = async () => {
    if (!sdkInitialized) {
      alert("카카오 SDK가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    // 역할 선택 확인
    if (!selectedRole) {
      alert("먼저 역할을 선택해주세요.");
      return;
    }

    if (disabled) {
      return;
    }

    try {
      setLoading(true);

      // 카카오 로그인
      const authObj = await new Promise((resolve, reject) => {
        window.Kakao.Auth.login({
          success: resolve,
          fail: reject,
        });
      });

      console.log("카카오 로그인 성공:", authObj);
      const kakaoAccessToken = authObj.access_token;

      // 카카오 사용자 정보 가져오기
      const userInfo = await new Promise((resolve, reject) => {
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: resolve,
          fail: reject,
        });
      });

      console.log("카카오 사용자 정보:", userInfo);

      // 이메일이 있는지 확인
      const email = userInfo.kakao_account?.email;
      if (!email) {
        alert("카카오 계정에서 이메일 정보를 가져올 수 없습니다. 이메일 제공에 동의해주세요.");
        return;
      }

      // 임시 비밀번호 생성 (카카오 ID 기반)
      const tempPassword = `kakao_${userInfo.id}_${Date.now()}`;

      try {
        // 기존 사용자인지 확인
        let userCredential;
        let isNewUser = false;
        
        try {
          // 기존 계정으로 로그인 시도
          userCredential = await signInWithEmailAndPassword(auth, email, tempPassword);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            // 새 사용자 생성
            userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
            isNewUser = true;
          } else {
            throw error;
          }
        }

        const user = userCredential.user;

        // Firestore에 사용자 정보 저장/업데이트
        const userData = {
          email: email,
          displayName: userInfo.properties?.nickname || 'Kakao 사용자',
          photoURL: userInfo.properties?.profile_image || '',
          role: selectedRole,
          roles: [selectedRole],
          primaryRole: selectedRole,
          provider: 'kakao',
          kakaoId: userInfo.id,
          createdAt: new Date(),
          emailVerified: true,
          isActive: true,
          approvalStatus: 'pending'
        };

        await setDoc(doc(db, 'users', user.uid), userData, { merge: true });

        console.log("Firebase 로그인 성공:", user);

        // 성공 콜백 호출
        if (onLoginSuccess) {
          onLoginSuccess({
            user: user,
            kakaoUserInfo: userInfo,
            isNewUser: isNewUser
          });
        }

      } catch (firebaseError) {
        console.error("Firebase 인증 실패:", firebaseError);
        
        if (firebaseError.code === 'auth/email-already-in-use') {
          alert("이미 다른 방법으로 가입된 이메일입니다. 다른 로그인 방법을 사용해주세요.");
        } else {
          alert("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
        
        if (onLoginError) {
          onLoginError(firebaseError);
        }
      }

    } catch (error) {
      console.error("카카오 로그인 실패:", error);
      
      let errorMessage = "카카오 로그인에 실패했습니다.";
      
      if (error.error === 'access_denied') {
        errorMessage = "카카오 로그인이 취소되었습니다.";
      } else if (error.error === 'invalid_grant') {
        errorMessage = "카카오 인증이 만료되었습니다. 다시 시도해주세요.";
      }

      alert(errorMessage);
      
      if (onLoginError) {
        onLoginError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors bg-gray-400 text-white cursor-not-allowed ${className}`}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        가입 중...
      </button>
    );
  }

  // SDK 초기화 대기
  if (!sdkInitialized) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors bg-gray-400 text-white cursor-not-allowed ${className}`}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        초기화 중...
      </button>
    );
  }

  return (
    <button
      onClick={loginWithKakao}
      disabled={disabled || !selectedRole}
      className={`inline-flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors bg-yellow-400 hover:bg-yellow-500 text-black disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
    >
      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3c5.799 0 10.5 4.701 10.5 10.5S17.799 24 12 24S1.5 19.299 1.5 13.5S6.201 3 12 3m0 1.5c-4.971 0-9 4.029-9 9s4.029 9 9 9s9-4.029 9-9s-4.029-9-9-9z"/>
        <path d="M12 6.75c-3.314 0-6 2.686-6 6s2.686 6 6 6s6-2.686 6-6s-2.686-6-6-6zm0 1.5c2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5s-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5z"/>
      </svg>
      {disabled || !selectedRole ? '역할을 선택해주세요' : '카카오로 회원가입'}
    </button>
  );
};

export default KakaoLoginButton; 