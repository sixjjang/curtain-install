import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { formatPhoneNumber, extractPhoneNumbers } from './phoneFormatter';

/**
 * 기존 사용자 데이터의 전화번호를 포맷팅하고 숫자 필드를 추가하는 마이그레이션 함수
 */
export const migratePhoneNumbers = async () => {
  try {
    console.log('📱 전화번호 마이그레이션 시작...');
    
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const userDoc of querySnapshot.docs) {
      try {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // 전화번호 필드가 있고 아직 포맷팅되지 않은 경우
        if (userData.phone && !userData.phoneNumbers) {
          const formattedPhone = formatPhoneNumber(userData.phone);
          const phoneNumbers = extractPhoneNumbers(userData.phone);
          
          const updateData: any = {
            phone: formattedPhone,
            phoneNumbers: phoneNumbers
          };
          
          // 픽업 정보가 있는 경우
          if (userData.pickupInfo && userData.pickupInfo.phone && !userData.pickupInfo.phoneNumbers) {
            const formattedPickupPhone = formatPhoneNumber(userData.pickupInfo.phone);
            const pickupPhoneNumbers = extractPhoneNumbers(userData.pickupInfo.phone);
            
            updateData.pickupInfo = {
              ...userData.pickupInfo,
              phone: formattedPickupPhone,
              phoneNumbers: pickupPhoneNumbers
            };
          }
          
          await updateDoc(doc(db, 'users', userId), updateData);
          updatedCount++;
          
          console.log(`✅ 사용자 ${userId} 전화번호 업데이트 완료`);
        }
      } catch (error) {
        console.error(`❌ 사용자 ${userDoc.id} 업데이트 실패:`, error);
        errorCount++;
      }
    }
    
    console.log(`📊 마이그레이션 완료: ${updatedCount}개 업데이트, ${errorCount}개 오류`);
    return { updatedCount, errorCount };
    
  } catch (error) {
    console.error('❌ 전화번호 마이그레이션 실패:', error);
    throw error;
  }
};

/**
 * 특정 사용자의 전화번호를 포맷팅하는 함수
 */
export const migrateUserPhoneNumber = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data();
    
    if (!userData.phone) {
      throw new Error('전화번호가 없습니다.');
    }
    
    const formattedPhone = formatPhoneNumber(userData.phone);
    const phoneNumbers = extractPhoneNumbers(userData.phone);
    
    const updateData: any = {
      phone: formattedPhone,
      phoneNumbers: phoneNumbers
    };
    
    // 픽업 정보가 있는 경우
    if (userData.pickupInfo && userData.pickupInfo.phone) {
      const formattedPickupPhone = formatPhoneNumber(userData.pickupInfo.phone);
      const pickupPhoneNumbers = extractPhoneNumbers(userData.pickupInfo.phone);
      
      updateData.pickupInfo = {
        ...userData.pickupInfo,
        phone: formattedPickupPhone,
        phoneNumbers: pickupPhoneNumbers
      };
    }
    
    await updateDoc(userRef, updateData);
    console.log(`✅ 사용자 ${userId} 전화번호 업데이트 완료`);
    
    return updateData;
    
  } catch (error) {
    console.error(`❌ 사용자 ${userId} 전화번호 업데이트 실패:`, error);
    throw error;
  }
};
