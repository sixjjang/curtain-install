import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

const NaverLoginButton = ({ onLoginSuccess, onLoginError, className = "", selectedRole = "seller", disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [sdkInitialized, setSdkInitialized] = useState(false);

  useEffect(() => {
    // 네이버 SDK 초기화
    const initializeNaver = () => {
      try {
        if (typeof window !== 'undefined' && window.naver) {
          console.log("네이버 SDK 초기화 완료");
          setSdkInitialized(true);
        } else {
          console.error("네이버 SDK를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("네이버 SDK 초기화 실패:", error);
      }
    };

    // SDK가 로드될 때까지 대기
    const checkNaverSDK = () => {
      if (typeof window !== 'undefined' && window.naver) {
        initializeNaver();
      } else {
        setTimeout(checkNaverSDK, 100);
      }
    };

    checkNaverSDK();
  }, []);

  const loginWithNaver = async () => {
    if (!sdkInitialized) {
      alert("네이버 SDK가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.");
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

      // 네이버 로그인
      const naverLogin = new window.naver.LoginWithNaverId({
        clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "YOUR_NAVER_CLIENT_ID",
        callbackUrl: window.location.origin + "/login",
        isPopup: false,
        loginButton: { color: "green", type: 3, height: 60 }
      });

      naverLogin.init();

      // 네이버 로그인 실행
      naverLogin.authorize();

      // 로그인 성공 후 처리
      naverLogin.getLoginStatus(async (status) => {
        if (status) {
          const userInfo = naverLogin.user;
          console.log("네이버 사용자 정보:", userInfo);

          // 이메일이 있는지 확인
          const email = userInfo.email;
          if (!email) {
            alert("네이버 계정에서 이메일 정보를 가져올 수 없습니다. 이메일 제공에 동의해주세요.");
            return;
          }

          // 임시 비밀번호 생성 (네이버 ID 기반)
          const tempPassword = `naver_${userInfo.id}_${Date.now()}`;

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
              displayName: userInfo.name || 'Naver 사용자',
              photoURL: userInfo.profile_image || '',
              role: selectedRole,
              roles: [selectedRole],
              primaryRole: selectedRole,
              provider: 'naver',
              naverId: userInfo.id,
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
                naverUserInfo: userInfo,
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
        } else {
          console.log("네이버 로그인 실패");
          alert("네이버 로그인에 실패했습니다.");
          
          if (onLoginError) {
            onLoginError(new Error("네이버 로그인 실패"));
          }
        }
      });

    } catch (error) {
      console.error("네이버 로그인 실패:", error);
      alert("네이버 로그인 중 오류가 발생했습니다.");
      
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
      onClick={loginWithNaver}
      disabled={disabled || !selectedRole}
      className={`inline-flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
    >
      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
      </svg>
      {disabled || !selectedRole ? '역할을 선택해주세요' : '네이버로 회원가입'}
    </button>
  );
};

export default NaverLoginButton; 