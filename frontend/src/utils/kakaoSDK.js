// 카카오 SDK 초기화 및 유틸리티 함수들

// 카카오 JavaScript 키 (실제 키로 교체 필요)
const KAKAO_JS_KEY = 'YOUR_KAKAO_JAVASCRIPT_KEY';

/**
 * 카카오 SDK 초기화
 */
export const initKakaoSDK = () => {
  if (typeof window !== 'undefined' && window.Kakao) {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
      console.log('카카오 SDK 초기화 완료');
    }
    return true;
  } else {
    console.error('카카오 SDK를 찾을 수 없습니다.');
    return false;
  }
};

/**
 * 카카오 로그인
 */
export const kakaoLogin = () => {
  return new Promise((resolve, reject) => {
    if (!window.Kakao) {
      reject(new Error('카카오 SDK가 로드되지 않았습니다.'));
      return;
    }

    if (!window.Kakao.isInitialized()) {
      reject(new Error('카카오 SDK가 초기화되지 않았습니다.'));
      return;
    }

    window.Kakao.Auth.login({
      success: (authObj) => {
        console.log('카카오 로그인 성공:', authObj);
        resolve(authObj);
      },
      fail: (err) => {
        console.error('카카오 로그인 실패:', err);
        reject(err);
      }
    });
  });
};

/**
 * 카카오 로그아웃
 */
export const kakaoLogout = () => {
  return new Promise((resolve, reject) => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      reject(new Error('카카오 SDK가 초기화되지 않았습니다.'));
      return;
    }

    window.Kakao.Auth.logout({
      success: () => {
        console.log('카카오 로그아웃 성공');
        resolve();
      },
      fail: (err) => {
        console.error('카카오 로그아웃 실패:', err);
        reject(err);
      }
    });
  });
};

/**
 * 카카오 사용자 정보 가져오기
 */
export const getKakaoUserInfo = () => {
  return new Promise((resolve, reject) => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      reject(new Error('카카오 SDK가 초기화되지 않았습니다.'));
      return;
    }

    window.Kakao.API.request({
      url: '/v2/user/me',
      success: (response) => {
        console.log('카카오 사용자 정보:', response);
        resolve(response);
      },
      fail: (err) => {
        console.error('카카오 사용자 정보 조회 실패:', err);
        reject(err);
      }
    });
  });
};

/**
 * 카카오 토큰 정보 가져오기
 */
export const getKakaoTokenInfo = () => {
  return new Promise((resolve, reject) => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      reject(new Error('카카오 SDK가 초기화되지 않았습니다.'));
      return;
    }

    window.Kakao.Auth.getAccessToken();
    const token = window.Kakao.Auth.getAccessToken();
    
    if (token) {
      resolve({ accessToken: token });
    } else {
      reject(new Error('카카오 액세스 토큰을 찾을 수 없습니다.'));
    }
  });
};

/**
 * 카카오 메시지 공유
 */
export const shareKakaoMessage = (messageData) => {
  return new Promise((resolve, reject) => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      reject(new Error('카카오 SDK가 초기화되지 않았습니다.'));
      return;
    }

    const { title, description, imageUrl, link } = messageData;

    window.Kakao.Link.sendDefault({
      objectType: 'feed',
      content: {
        title: title || '커튼 설치 매칭',
        description: description || '전문 시공기사와 매칭하세요',
        imageUrl: imageUrl || 'https://via.placeholder.com/300x200',
        link: {
          mobileWebUrl: link || window.location.href,
          webUrl: link || window.location.href,
        },
      },
      buttons: [
        {
          title: '앱으로 보기',
          link: {
            mobileWebUrl: link || window.location.href,
            webUrl: link || window.location.href,
          },
        },
      ],
      success: () => {
        console.log('카카오 메시지 공유 성공');
        resolve();
      },
      fail: (err) => {
        console.error('카카오 메시지 공유 실패:', err);
        reject(err);
      }
    });
  });
};

/**
 * 카카오톡 채널 추가
 */
export const addKakaoChannel = (channelId) => {
  return new Promise((resolve, reject) => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      reject(new Error('카카오 SDK가 초기화되지 않았습니다.'));
      return;
    }

    window.Kakao.Channel.addChannel({
      channelPublicId: channelId,
      success: () => {
        console.log('카카오톡 채널 추가 성공');
        resolve();
      },
      fail: (err) => {
        console.error('카카오톡 채널 추가 실패:', err);
        reject(err);
      }
    });
  });
};

/**
 * 카카오 SDK 상태 확인
 */
export const checkKakaoSDKStatus = () => {
  return {
    isLoaded: typeof window !== 'undefined' && !!window.Kakao,
    isInitialized: typeof window !== 'undefined' && window.Kakao && window.Kakao.isInitialized(),
    isLoggedIn: typeof window !== 'undefined' && window.Kakao && window.Kakao.Auth.getAccessToken() !== null
  };
};

/**
 * 카카오 로그인 상태 확인
 */
export const isKakaoLoggedIn = () => {
  if (typeof window === 'undefined' || !window.Kakao) {
    return false;
  }
  return window.Kakao.Auth.getAccessToken() !== null;
};

export default {
  initKakaoSDK,
  kakaoLogin,
  kakaoLogout,
  getKakaoUserInfo,
  getKakaoTokenInfo,
  shareKakaoMessage,
  addKakaoChannel,
  checkKakaoSDKStatus,
  isKakaoLoggedIn
}; 