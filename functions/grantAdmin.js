const admin = require("firebase-admin");
const { 관리자권한부여, 관리자권한확인 } = require('./setAdminClaim');

// Firebase Admin 초기화
admin.initializeApp();

/**
 * 관리자 권한을 부여하는 실행 스크립트
 * 사용법: node grantAdmin.js [사용자_UID]
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('사용법: node grantAdmin.js [사용자_UID]');
    console.log('예시: node grantAdmin.js abc123def456');
    process.exit(1);
  }

  const uid = args[0];
  
  try {
    console.log(`사용자 ${uid}의 현재 권한을 확인 중...`);
    const currentStatus = await 관리자권한확인(uid);
    console.log(`현재 상태: ${currentStatus.isAdmin ? '관리자' : '일반 사용자'}`);
    
    if (currentStatus.isAdmin) {
      console.log('이미 관리자 권한이 부여되어 있습니다.');
      process.exit(0);
    }
    
    console.log(`사용자 ${uid}에게 관리자 권한을 부여 중...`);
    const result = await 관리자권한부여(uid);
    console.log('✅ 성공:', result.message);
    
    // 권한 부여 후 다시 확인
    console.log('권한 부여 후 상태 확인 중...');
    const newStatus = await 관리자권한확인(uid);
    console.log(`새로운 상태: ${newStatus.isAdmin ? '관리자' : '일반 사용자'}`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
} 