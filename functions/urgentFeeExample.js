const admin = require('firebase-admin');

// Firebase 초기화 (이미 초기화된 경우 생략)
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

/**
 * 10분 간격 긴급 수수료 시스템용 작업 생성 예제
 */
async function createJobFor10MinSystem() {
  try {
    const jobData = {
      title: "커튼 설치 - 긴급",
      description: "오늘 안에 설치가 필요한 커튼 설치 작업",
      status: "open",
      budget: 150000,
      
      // 긴급 수수료 설정 (10분 간격 시스템용)
      urgentFeeEnabled: true,
      urgentFeePercent: 15,                    // 기본 긴급 수수료 15%
      maxUrgentFeePercent: 50,                 // 최대 긴급 수수료 50%
      currentUrgentFeePercent: 15,             // 현재 긴급 수수료 15%
      
      // 시간 관리
      urgentFeeIncreaseStartAt: admin.firestore.Timestamp.now(),
      lastUrgentFeeUpdate: admin.firestore.Timestamp.now(),
      
      // 통계
      urgentFeeIncreaseCount: 0,
      urgentFeeMaxReachedAt: null,
      
      // 메타데이터
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      clientId: "client123",
      location: "서울시 강남구",
      category: "커튼설치"
    };

    const docRef = await firestore.collection("jobs").add(jobData);
    console.log(`10분 간격 시스템용 작업 생성 완료: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error("작업 생성 중 오류:", error);
    throw error;
  }
}

/**
 * 1시간 간격 긴급 수수료 시스템용 작업 생성 예제
 */
async function createJobFor1HourSystem() {
  try {
    const jobData = {
      title: "블라인드 설치 - 긴급",
      description: "주말 안에 설치가 필요한 블라인드 설치 작업",
      status: "open",
      budget: 200000,
      
      // 긴급 수수료 설정 (1시간 간격 시스템용)
      baseUrgentFeePercent: 20,                // 기본 긴급 수수료 20%
      maxUrgentFeePercent: 45,                 // 최대 긴급 수수료 45%
      currentUrgentFeePercent: 20,             // 현재 긴급 수수료 20%
      
      // 시간 관리
      createdAt: admin.firestore.Timestamp.now(),
      lastFeeIncreaseAt: admin.firestore.Timestamp.now(),
      
      // 메타데이터
      updatedAt: admin.firestore.Timestamp.now(),
      clientId: "client456",
      location: "서울시 서초구",
      category: "블라인드설치"
    };

    const docRef = await firestore.collection("jobs").add(jobData);
    console.log(`1시간 간격 시스템용 작업 생성 완료: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error("작업 생성 중 오류:", error);
    throw error;
  }
}

/**
 * 기존 작업을 긴급 수수료 시스템에 맞게 업데이트
 */
async function updateJobForUrgentFee(jobId, systemType = '10min') {
  try {
    const jobRef = firestore.collection("jobs").doc(jobId);
    const jobDoc = await jobRef.get();
    
    if (!jobDoc.exists) {
      throw new Error("작업을 찾을 수 없습니다.");
    }

    const updateData = {};
    
    if (systemType === '10min') {
      // 10분 간격 시스템용 필드 추가
      updateData.urgentFeeEnabled = true;
      updateData.urgentFeePercent = 15;
      updateData.maxUrgentFeePercent = 50;
      updateData.currentUrgentFeePercent = 15;
      updateData.urgentFeeIncreaseStartAt = admin.firestore.Timestamp.now();
      updateData.lastUrgentFeeUpdate = admin.firestore.Timestamp.now();
      updateData.urgentFeeIncreaseCount = 0;
      updateData.urgentFeeMaxReachedAt = null;
    } else if (systemType === '1hour') {
      // 1시간 간격 시스템용 필드 추가
      updateData.baseUrgentFeePercent = 15;
      updateData.maxUrgentFeePercent = 50;
      updateData.currentUrgentFeePercent = 15;
      updateData.lastFeeIncreaseAt = admin.firestore.Timestamp.now();
    }
    
    updateData.updatedAt = admin.firestore.Timestamp.now();
    
    await jobRef.update(updateData);
    console.log(`작업 ${jobId} 긴급 수수료 시스템 설정 완료 (${systemType} 시스템)`);
    
  } catch (error) {
    console.error("작업 업데이트 중 오류:", error);
    throw error;
  }
}

/**
 * 긴급 수수료 통계 조회
 */
async function getUrgentFeeStats() {
  try {
    // 10분 간격 시스템 통계
    const statsRef = firestore.collection("urgentFeeStats");
    const statsSnapshot = await statsRef
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    console.log("=== 긴급 수수료 통계 ===");
    statsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`실행 시간: ${data.timestamp}`);
      console.log(`처리된 작업: ${data.totalProcessed}개`);
      console.log(`인상된 작업: ${data.totalIncreased}개`);
      console.log(`오류: ${data.totalErrors}개`);
      console.log(`실행 시간: ${data.executionTimeMs}ms`);
      console.log("---");
    });
    
  } catch (error) {
    console.error("통계 조회 중 오류:", error);
    throw error;
  }
}

/**
 * 특정 작업의 긴급 수수료 상태 확인
 */
async function checkJobUrgentFeeStatus(jobId) {
  try {
    const jobRef = firestore.collection("jobs").doc(jobId);
    const jobDoc = await jobRef.get();
    
    if (!jobDoc.exists) {
      throw new Error("작업을 찾을 수 없습니다.");
    }

    const jobData = jobDoc.data();
    
    console.log(`=== 작업 ${jobId} 긴급 수수료 상태 ===`);
    console.log(`제목: ${jobData.title}`);
    console.log(`상태: ${jobData.status}`);
    
    // 10분 간격 시스템 필드 확인
    if (jobData.urgentFeeEnabled !== undefined) {
      console.log("--- 10분 간격 시스템 ---");
      console.log(`긴급 수수료 활성화: ${jobData.urgentFeeEnabled}`);
      console.log(`기본 수수료: ${jobData.urgentFeePercent}%`);
      console.log(`현재 수수료: ${jobData.currentUrgentFeePercent}%`);
      console.log(`최대 수수료: ${jobData.maxUrgentFeePercent}%`);
      console.log(`증가 횟수: ${jobData.urgentFeeIncreaseCount || 0}`);
      console.log(`마지막 업데이트: ${jobData.lastUrgentFeeUpdate?.toDate()}`);
    }
    
    // 1시간 간격 시스템 필드 확인
    if (jobData.baseUrgentFeePercent !== undefined) {
      console.log("--- 1시간 간격 시스템 ---");
      console.log(`기본 수수료: ${jobData.baseUrgentFeePercent}%`);
      console.log(`현재 수수료: ${jobData.currentUrgentFeePercent}%`);
      console.log(`최대 수수료: ${jobData.maxUrgentFeePercent}%`);
      console.log(`마지막 증가: ${jobData.lastFeeIncreaseAt?.toDate()}`);
    }
    
  } catch (error) {
    console.error("작업 상태 확인 중 오류:", error);
    throw error;
  }
}

/**
 * 긴급 수수료가 활성화된 모든 작업 조회
 */
async function getActiveUrgentFeeJobs() {
  try {
    // 10분 간격 시스템 작업
    const tenMinJobs = await firestore.collection("jobs")
      .where("status", "==", "open")
      .where("urgentFeeEnabled", "==", true)
      .get();

    // 1시간 간격 시스템 작업 (baseUrgentFeePercent가 있는 작업)
    const oneHourJobs = await firestore.collection("jobs")
      .where("status", "==", "open")
      .where("baseUrgentFeePercent", ">", 0)
      .get();

    console.log("=== 활성 긴급 수수료 작업 ===");
    console.log(`10분 간격 시스템: ${tenMinJobs.size}개`);
    console.log(`1시간 간격 시스템: ${oneHourJobs.size}개`);
    
    // 10분 간격 시스템 작업 상세
    tenMinJobs.forEach(doc => {
      const data = doc.data();
      console.log(`[10분] ${doc.id}: ${data.title} - ${data.currentUrgentFeePercent}%`);
    });
    
    // 1시간 간격 시스템 작업 상세
    oneHourJobs.forEach(doc => {
      const data = doc.data();
      if (!data.urgentFeeEnabled) { // 10분 시스템과 중복 제외
        console.log(`[1시간] ${doc.id}: ${data.title} - ${data.currentUrgentFeePercent}%`);
      }
    });
    
  } catch (error) {
    console.error("활성 작업 조회 중 오류:", error);
    throw error;
  }
}

// 사용 예제
async function runExamples() {
  try {
    console.log("=== 긴급 수수료 시스템 예제 실행 ===");
    
    // 1. 새로운 작업 생성
    const job1 = await createJobFor10MinSystem();
    const job2 = await createJobFor1HourSystem();
    
    // 2. 작업 상태 확인
    await checkJobUrgentFeeStatus(job1);
    await checkJobUrgentFeeStatus(job2);
    
    // 3. 활성 작업 조회
    await getActiveUrgentFeeJobs();
    
    // 4. 통계 조회 (함수 실행 후)
    // await getUrgentFeeStats();
    
    console.log("=== 예제 실행 완료 ===");
    
  } catch (error) {
    console.error("예제 실행 중 오류:", error);
  }
}

// 모듈 내보내기
module.exports = {
  createJobFor10MinSystem,
  createJobFor1HourSystem,
  updateJobForUrgentFee,
  getUrgentFeeStats,
  checkJobUrgentFeeStatus,
  getActiveUrgentFeeJobs,
  runExamples
};

// 직접 실행 시
if (require.main === module) {
  runExamples();
} 