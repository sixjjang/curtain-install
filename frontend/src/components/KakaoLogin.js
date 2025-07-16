import React, { useState, useEffect } from "react";
import { 
  initKakaoSDK, 
  kakaoLogin, 
  kakaoLogout, 
  getKakaoUserInfo, 
  isKakaoLoggedIn,
  checkKakaoSDKStatus 
} from "../utils/kakaoSDK";

const KakaoLogin = ({ onLogin, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [kakaoUser, setKakaoUser] = useState(null);
  const [sdkStatus, setSdkStatus] = useState({
    isLoaded: false,
    isInitialized: false,
    isLoggedIn: false
  });

  useEffect(() => {
    // 카카오 SDK 초기화
    const initializeKakao = async () => {
      try {
        const initialized = initKakaoSDK();
        if (initialized) {
          const status = checkKakaoSDKStatus();
          setSdkStatus(status);
          
          // 이미 로그인된 상태인지 확인
          if (status.isLoggedIn) {
            await handleKakaoUserInfo();
          }
        }
      } catch (error) {
        console.error('카카오 SDK 초기화 실패:', error);
      }
    };

    initializeKakao();
  }, []);

  // 카카오 사용자 정보 가져오기
  const handleKakaoUserInfo = async () => {
    try {
      const userInfo = await getKakaoUserInfo();
      setKakaoUser(userInfo);
      
      // 부모 컴포넌트에 로그인 정보 전달
      if (onLogin) {
        onLogin({
          provider: 'kakao',
          uid: userInfo.id.toString(),
          email: userInfo.kakao_account?.email,
          displayName: userInfo.properties?.nickname,
          photoURL: userInfo.properties?.profile_image,
          userInfo: userInfo
        });
      }
    } catch (error) {
      console.error('카카오 사용자 정보 조회 실패:', error);
    }
  };

  // 카카오 로그인 처리
  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      
      // 카카오 로그인
      const authObj = await kakaoLogin();
      console.log('카카오 로그인 성공:', authObj);
      
      // 사용자 정보 가져오기
      await handleKakaoUserInfo();
      
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      alert('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 카카오 로그아웃 처리
  const handleKakaoLogout = async () => {
    try {
      setLoading(true);
      
      await kakaoLogout();
      setKakaoUser(null);
      
      // 부모 컴포넌트에 로그아웃 정보 전달
      if (onLogout) {
        onLogout();
      }
      
      console.log('카카오 로그아웃 성공');
      
    } catch (error) {
      console.error('카카오 로그아웃 실패:', error);
      alert('카카오 로그아웃에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // SDK가 로드되지 않은 경우
  if (!sdkStatus.isLoaded) {
    return (
      <div className="text-center p-4">
        <div className="text-gray-500 mb-2">카카오 SDK 로딩 중...</div>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400 mx-auto"></div>
      </div>
    );
  }

  // 이미 로그인된 경우
  if (kakaoUser) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">카</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">카카오 로그인됨</h3>
            <p className="text-sm text-gray-600">{kakaoUser.properties?.nickname}</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p><span className="font-medium">이메일:</span> {kakaoUser.kakao_account?.email || '정보 없음'}</p>
          <p><span className="font-medium">카카오 ID:</span> {kakaoUser.id}</p>
        </div>
        
        <button
          onClick={handleKakaoLogout}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            loading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-yellow-500 hover:bg-yellow-600 text-white"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              로그아웃 중...
            </div>
          ) : (
            "카카오 로그아웃"
          )}
        </button>
      </div>
    );
  }

  // 로그인 버튼
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">카카오 로그인</h3>
        <p className="text-sm text-gray-600 mb-4">카카오 계정으로 간편하게 로그인하세요</p>
      </div>
      
      <button
        onClick={handleKakaoLogin}
        disabled={loading || !sdkStatus.isInitialized}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
          loading || !sdkStatus.isInitialized
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
      
      {!sdkStatus.isInitialized && (
        <div className="text-center text-sm text-red-600">
          카카오 SDK 초기화 중 문제가 발생했습니다.
        </div>
      )}
      
      <div className="text-center text-xs text-gray-500">
        카카오 로그인 시 개인정보 처리방침에 동의하게 됩니다.
      </div>
    </div>
  );
};

export default KakaoLogin; 