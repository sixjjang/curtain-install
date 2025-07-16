import React, { useState, useEffect } from "react";
import { getAuth, signInWithCustomToken } from "firebase/auth";

const auth = getAuth();

const SimpleKakaoLogin = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 카카오 SDK 초기화
    if (typeof window !== 'undefined' && window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init("YOUR_KAKAO_JAVASCRIPT_KEY");
        console.log("카카오 SDK 초기화 완료");
      }
    }
  }, []);

  const loginWithKakao = async () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      alert("카카오 SDK가 초기화되지 않았습니다.");
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

      // 서버로 토큰 전송하여 Firebase Custom Token 받기
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
        
        setUser(userCredential.user);
        alert("카카오 로그인 성공!");
      } else {
        throw new Error("Firebase 토큰을 받지 못했습니다.");
      }

    } catch (error) {
      console.error("카카오 로그인 실패:", error);
      alert("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      console.log("로그아웃 성공");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        간단한 카카오 로그인
      </h2>

      {!user ? (
        <div className="space-y-4">
          <div className="text-center text-gray-600 mb-4">
            카카오 계정으로 간편하게 로그인하세요
          </div>
          
          <button
            onClick={loginWithKakao}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
              loading
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-yellow-400 hover:bg-yellow-500 text-black"
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                로그인 중...
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c5.799 0 10.5 4.701 10.5 10.5S17.799 24 12 24S1.5 19.299 1.5 13.5S6.201 3 12 3m0 1.5c-4.971 0-9 4.029-9 9s4.029 9 9 9s9-4.029 9-9s-4.029-9-9-9z"/>
                  <path d="M12 6.75c-3.314 0-6 2.686-6 6s2.686 6 6 6s6-2.686 6-6s-2.686-6-6-6zm0 1.5c2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5s-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5z"/>
                </svg>
                카카오로 로그인
              </>
            )}
          </button>
          
          <div className="text-center text-xs text-gray-500">
            로그인 시 개인정보 처리방침에 동의하게 됩니다.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="프로필"
                  className="w-12 h-12 rounded-full mr-3"
                />
              ) : (
                <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">
                    {user.displayName?.charAt(0) || "U"}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-800">
                  {user.displayName || "사용자"}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">사용자 ID:</span> {user.uid}</p>
              <p><span className="font-medium">로그인 방법:</span> 카카오</p>
              <p><span className="font-medium">이메일 인증:</span> {user.emailVerified ? "완료" : "미완료"}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-red-500 hover:bg-red-600 text-white"
          >
            로그아웃
          </button>
        </div>
      )}

      {/* 개발자 정보 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">개발자 정보</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• 카카오 SDK: {typeof window !== 'undefined' && window.Kakao ? "로드됨" : "로드 안됨"}</p>
          <p>• Firebase Auth: {user ? "로그인됨" : "로그아웃됨"}</p>
          <p>• API: /api/getFirebaseToken</p>
          <p>• UID 형식: kakao:카카오ID</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleKakaoLogin; 