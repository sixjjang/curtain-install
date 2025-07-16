const admin = require("firebase-admin");
admin.initializeApp();

/**
 * 특정 사용자에게 관리자 권한을 부여하는 함수
 * @param {string} uid - 관리자 권한을 부여할 사용자의 UID
 */
async function 관리자권한부여(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`사용자 ${uid}에게 관리자 권한이 부여되었습니다.`);
    return { success: true, message: "관리자 권한 부여 완료" };
  } catch (error) {
    console.error(`관리자 권한 부여 중 오류 발생: ${error.message}`);
    throw error;
  }
}

/**
 * 관리자 권한을 제거하는 함수
 * @param {string} uid - 관리자 권한을 제거할 사용자의 UID
 */
async function 관리자권한제거(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: false });
    console.log(`사용자 ${uid}의 관리자 권한이 제거되었습니다.`);
    return { success: true, message: "관리자 권한 제거 완료" };
  } catch (error) {
    console.error(`관리자 권한 제거 중 오류 발생: ${error.message}`);
    throw error;
  }
}

/**
 * 사용자의 관리자 권한 상태를 확인하는 함수
 * @param {string} uid - 확인할 사용자의 UID
 */
async function 관리자권한확인(uid) {
  try {
    const userRecord = await admin.auth().getUser(uid);
    const isAdmin = userRecord.customClaims?.admin || false;
    console.log(`사용자 ${uid}의 관리자 권한 상태: ${isAdmin ? '관리자' : '일반 사용자'}`);
    return { isAdmin, userRecord };
  } catch (error) {
    console.error(`관리자 권한 확인 중 오류 발생: ${error.message}`);
    throw error;
  }
}

// 예시: 특정 UID에 관리자 권한 부여
// 관리자권한부여("여기에_실제_사용자_UID_입력");

// 예시: 관리자 권한 제거
// 관리자권한제거("여기에_실제_사용자_UID_입력");

// 예시: 관리자 권한 확인
// 관리자권한확인("여기에_실제_사용자_UID_입력");

module.exports = {
  관리자권한부여,
  관리자권한제거,
  관리자권한확인
}; 