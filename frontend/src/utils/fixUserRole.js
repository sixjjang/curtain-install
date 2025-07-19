import { db } from '../firebase/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// 사용자 역할 수정 함수
export const fixUserRole = async (userId, newRole) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const userData = userDoc.data();
    console.log('현재 사용자 데이터:', userData);

    // 역할 정보 업데이트
    await updateDoc(userRef, {
      role: newRole,
      primaryRole: newRole,
      roles: [newRole],
      updatedAt: new Date()
    });

    console.log(`사용자 역할이 '${newRole}'로 수정되었습니다.`);
    return { success: true, message: '역할이 성공적으로 수정되었습니다.' };
  } catch (error) {
    console.error('역할 수정 실패:', error);
    throw error;
  }
};

// 현재 사용자 역할 확인 함수
export const checkUserRole = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const userData = userDoc.data();
    return {
      primaryRole: userData.primaryRole,
      role: userData.role,
      roles: userData.roles,
      email: userData.email,
      name: userData.name
    };
  } catch (error) {
    console.error('사용자 역할 확인 실패:', error);
    throw error;
  }
};

// 모든 사용자 역할 확인 함수 (관리자용)
export const getAllUserRoles = async () => {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    const users = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        name: data.name,
        primaryRole: data.primaryRole,
        role: data.role,
        roles: data.roles,
        createdAt: data.createdAt
      });
    });
    
    return users;
  } catch (error) {
    console.error('모든 사용자 역할 확인 실패:', error);
    throw error;
  }
}; 