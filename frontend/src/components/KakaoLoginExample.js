import React, { useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import KakaoLoginButton from "./KakaoLoginButton";

const KakaoLoginExample = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  const handleLoginSuccess = (loginData) => {
    console.log("카카오 로그인 성공:", loginData);
    setUser(loginData.user);
    
    // 추가적인 로그인 후 처리
    if (loginData.isNewUser) {
      console.log("새 사용자가 가입했습니다!");
      // 환영 메시지 표시
      alert("커튼 설치 매칭에 오신 것을 환영합니다!");
    }
  };

  const handleLoginError = (error) => {
    console.error("카카오 로그인 실패:", error);
    // 에러 처리 로직
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      console.log("로그아웃 성공");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        카카오 로그인 예제
      </h2>

      {!user ? (
        <div className="space-y-4">
          <div className="text-center text-gray-600 mb-4">
            카카오 계정으로 간편하게 로그인하세요
          </div>
          
          <KakaoLoginButton
            onLoginSuccess={handleLoginSuccess}
            onLoginError={handleLoginError}
            className="w-full"
          />
          
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
            onClick={handleLogout}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              loading
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                로그아웃 중...
              </div>
            ) : (
              "로그아웃"
            )}
          </button>
        </div>
      )}

      {/* 개발자 정보 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">개발자 정보</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• 카카오 SDK 초기화 상태: {typeof window !== 'undefined' && window.Kakao ? "로드됨" : "로드 안됨"}</p>
          <p>• Firebase Auth 상태: {user ? "로그인됨" : "로그아웃됨"}</p>
          <p>• API 엔드포인트: /api/getFirebaseToken</p>
        </div>
      </div>
    </div>
  );
};

export default KakaoLoginExample; 