const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

exports.getFirebaseToken = functions.https.onRequest(async (req, res) => {
  // CORS 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (preflight)
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const kakaoToken = req.body.token;
  if (!kakaoToken) {
    res.status(400).json({ error: "카카오 토큰 필요" });
    return;
  }

  try {
    console.log('카카오 토큰 검증 시작:', kakaoToken.substring(0, 10) + '...');

    // 1. 카카오 API로 사용자 정보 요청
    const kakaoUserResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${kakaoToken}` },
    });

    if (!kakaoUserResponse.ok) {
      throw new Error('카카오 사용자 정보 조회 실패');
    }

    const kakaoUser = await kakaoUserResponse.json();
    console.log('카카오 사용자 정보:', kakaoUser);

    if (kakaoUser.id) {
      // 2. Firebase UID를 카카오 ID로 지정 (중복 방지)
      const uid = `kakao:${kakaoUser.id}`;
      const email = kakaoUser.kakao_account?.email;
      const displayName = kakaoUser.properties?.nickname;
      const photoURL = kakaoUser.properties?.profile_image;

      let firebaseUser = null;
      let isNewUser = false;

      // 3. 기존 사용자 확인
      try {
        firebaseUser = await admin.auth().getUser(uid);
        console.log('기존 사용자 발견:', firebaseUser.uid);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.log('새 사용자 생성 필요');
          isNewUser = true;
        } else {
          throw error;
        }
      }

      // 4. 새 사용자인 경우 생성
      if (isNewUser) {
        try {
          firebaseUser = await admin.auth().createUser({
            uid: uid,
            email: email,
            displayName: displayName,
            photoURL: photoURL,
            emailVerified: email ? true : false,
            disabled: false
          });
          console.log('새 사용자 생성:', firebaseUser.uid);
        } catch (error) {
          console.error('사용자 생성 실패:', error);
          throw error;
        }
      }

      // 5. Firebase Custom Token 생성
      const customToken = await admin.auth().createCustomToken(uid, {
        provider: "kakao",
        kakaoProfile: kakaoUser,
      });

      console.log('Firebase Custom Token 생성 완료');

      // 6. Firestore에 사용자 정보 저장/업데이트
      const userDocRef = admin.firestore().collection('users').doc(uid);
      await userDocRef.set({
        provider: 'kakao',
        kakaoId: kakaoUser.id,
        email: email,
        displayName: displayName,
        photoURL: photoURL,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        kakaoUserInfo: kakaoUser
      }, { merge: true });

      console.log('Firestore 사용자 정보 저장 완료');

      // 7. 응답 반환
      res.status(200).json({ 
        firebaseToken: customToken,
        userInfo: kakaoUser,
        isNewUser: isNewUser,
        message: '카카오 로그인 성공'
      });
    } else {
      res.status(401).json({ error: "유효하지 않은 카카오 사용자" });
    }
  } catch (error) {
    console.error('카카오 인증 처리 오류:', error);
    
    let errorMessage = '인증 처리 중 오류가 발생했습니다.';
    let statusCode = 500;

    if (error.message.includes('카카오 사용자 정보 조회 실패')) {
      errorMessage = '카카오 사용자 정보를 가져올 수 없습니다.';
      statusCode = 401;
    } else if (error.code === 'auth/uid-already-exists') {
      errorMessage = '이미 존재하는 사용자입니다.';
      statusCode = 409;
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '유효하지 않은 이메일 주소입니다.';
      statusCode = 400;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message
    });
  }
});

module.exports = {
  getFirebaseToken: exports.getFirebaseToken
}; 