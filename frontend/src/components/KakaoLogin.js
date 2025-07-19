import React, { useEffect } from 'react';

export default function KakaoLogin({ onLogin, disabled = false }) {
  useEffect(() => {
    // Kakao SDK 초기화
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
    }
  }, []);

  const handleKakaoLogin = async () => {
    if (disabled) return;

    try {
      if (!window.Kakao) {
        throw new Error('Kakao SDK가 로드되지 않았습니다.');
      }

      // Kakao 로그인 실행
      const response = await new Promise((resolve, reject) => {
        window.Kakao.Auth.login({
          success: (authObj) => {
            resolve(authObj);
          },
          fail: (err) => {
            reject(err);
          }
        });
      });

      // 사용자 정보 가져오기
      const userInfo = await new Promise((resolve, reject) => {
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: (res) => {
            resolve({
              uid: res.id.toString(),
              email: res.kakao_account?.email || '',
              displayName: res.properties?.nickname || 'Kakao 사용자',
              photoURL: res.properties?.profile_image || '',
              provider: 'kakao',
              accessToken: response.access_token
            });
          },
          fail: (err) => {
            reject(err);
          }
        });
      });

      // 부모 컴포넌트에 로그인 정보 전달
      onLogin(userInfo);

    } catch (error) {
      console.error('Kakao 로그인 실패:', error);
      // 에러 처리는 부모 컴포넌트에서 담당
    }
  };

  return (
    <button
      onClick={handleKakaoLogin}
      disabled={disabled}
      className="w-full flex items-center justify-center px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
      </svg>
      Kakao로 로그인
    </button>
  );
} 