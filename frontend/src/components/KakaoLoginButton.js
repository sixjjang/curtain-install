import React, { useState, useEffect } from "react";
import { getAuth, signInWithCustomToken } from "firebase/auth";

const auth = getAuth();

const KakaoLoginButton = ({ onLoginSuccess, onLoginError, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [sdkInitialized, setSdkInitialized] = useState(false);

  useEffect(() => {
    // 카카오 SDK 초기화
    const initializeKakao = () => {
      try {
        if (typeof window !== 'undefined' && window.Kakao) {
          if (!window.Kakao.isInitialized()) {
            window.Kakao.init("YOUR_KAKAO_JAVASCRIPT_KEY");
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

      // 1. 서버로 kakaoAccessToken 전송 → Firebase Custom Token 발급 요청
      const response = await fetch("/api/getFirebaseToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: kakaoAccessToken }),
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.firebaseToken) {
        // Firebase Custom Token으로 로그인
        const userCredential = await signInWithCustomToken(auth, data.firebaseToken);
        console.log("Firebase 로그인 성공:", userCredential.user);

        // 성공 콜백 호출
        if (onLoginSuccess) {
          onLoginSuccess({
            user: userCredential.user,
            kakaoUserInfo: data.userInfo,
            isNewUser: data.isNewUser || false
          });
        }

        alert("카카오 로그인 성공!");
      } else {
        throw new Error("Firebase 토큰을 받지 못했습니다.");
      }

    } catch (error) {
      console.error("카카오 로그인 실패:", error);
      
      let errorMessage = "카카오 로그인에 실패했습니다.";
      
      if (error.message.includes("서버 응답 오류")) {
        errorMessage = "서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.";
      } else if (error.message.includes("Firebase 토큰")) {
        errorMessage = "인증 토큰 발급에 실패했습니다.";
      } else if (error.code === "auth/invalid-custom-token") {
        errorMessage = "유효하지 않은 인증 토큰입니다.";
      } else if (error.code === "auth/custom-token-mismatch") {
        errorMessage = "인증 토큰이 일치하지 않습니다.";
      }

      alert(errorMessage);
      
      // 에러 콜백 호출
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
        className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-400 text-white cursor-not-allowed ${className}`}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        로그인 중...
      </button>
    );
  }

  // SDK 초기화 대기
  if (!sdkInitialized) {
    return (
      <button
        disabled
        className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-400 text-white cursor-not-allowed ${className}`}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        초기화 중...
      </button>
    );
  }

  return (
    <button
      onClick={loginWithKakao}
      className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-yellow-400 hover:bg-yellow-500 text-black ${className}`}
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3c5.799 0 10.5 4.701 10.5 10.5S17.799 24 12 24S1.5 19.299 1.5 13.5S6.201 3 12 3m0 1.5c-4.971 0-9 4.029-9 9s4.029 9 9 9s9-4.029 9-9s-4.029-9-9-9z"/>
        <path d="M12 6.75c-3.314 0-6 2.686-6 6s2.686 6 6 6s6-2.686 6-6s-2.686-6-6-6zm0 1.5c2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5s-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5z"/>
      </svg>
      카카오 로그인
    </button>
  );
};

export default KakaoLoginButton; 