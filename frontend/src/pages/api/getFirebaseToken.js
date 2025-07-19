import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin 초기화
if (!getApps().length) {
  initializeApp({
    credential: require('firebase-admin').credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token: kakaoAccessToken, selectedRole } = req.body;

    if (!kakaoAccessToken) {
      return res.status(400).json({ error: 'Kakao access token is required' });
    }

    if (!selectedRole) {
      return res.status(400).json({ error: 'Selected role is required' });
    }

    // 1. Kakao API로 사용자 정보 가져오기
    const kakaoUserResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${kakaoAccessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!kakaoUserResponse.ok) {
      throw new Error('Failed to get Kakao user info');
    }

    const kakaoUser = await kakaoUserResponse.json();

    // 2. 사용자 정보 구성
    const userInfo = {
      uid: `kakao_${kakaoUser.id}`,
      email: kakaoUser.kakao_account?.email || '',
      displayName: kakaoUser.properties?.nickname || 'Kakao 사용자',
      photoURL: kakaoUser.properties?.profile_image || '',
      provider: 'kakao',
      role: selectedRole,
      roles: [selectedRole],
      primaryRole: selectedRole,
      createdAt: new Date(),
      emailVerified: kakaoUser.kakao_account?.email_needs_agreement ? false : true,
      isActive: true,
      approvalStatus: 'pending'
    };

    // 3. Firestore에서 기존 사용자 확인
    const userDoc = await db.collection('users').doc(userInfo.uid).get();
    const isNewUser = !userDoc.exists;

    if (isNewUser) {
      // 4. 새 사용자인 경우 Firestore에 저장
      await db.collection('users').doc(userInfo.uid).set(userInfo);
    } else {
      // 5. 기존 사용자인 경우 역할 업데이트 (필요시)
      const existingUser = userDoc.data();
      if (existingUser.role !== selectedRole) {
        await db.collection('users').doc(userInfo.uid).update({
          role: selectedRole,
          roles: [selectedRole],
          primaryRole: selectedRole,
          updatedAt: new Date()
        });
      }
    }

    // 6. Firebase Custom Token 생성
    const customToken = await auth.createCustomToken(userInfo.uid, {
      role: selectedRole,
      provider: 'kakao',
      email: userInfo.email,
      displayName: userInfo.displayName
    });

    // 7. 응답 반환
    res.status(200).json({
      firebaseToken: customToken,
      userInfo: {
        uid: userInfo.uid,
        email: userInfo.email,
        displayName: userInfo.displayName,
        photoURL: userInfo.photoURL,
        role: userInfo.role
      },
      isNewUser
    });

  } catch (error) {
    console.error('Error in getFirebaseToken:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 