const { 
  increaseUrgentFee, 
  batchIncreaseUrgentFees, 
  checkUrgentFeeIncreaseConditions 
} = require('./jobManagement');

/**
 * 긴급 수수료 증가 함수 사용 예제
 */
async function exampleIncreaseUrgentFee() {
  console.log('=== 긴급 수수료 증가 예제 ===');

  // 기본 사용법
  const jobId = 'job123';
  const result = await increaseUrgentFee(jobId);
  
  console.log('기본 증가 결과:', result);
  
  // 고급 옵션 사용
  const resultWithOptions = await increaseUrgentFee(jobId, {
    sendNotification: true,
    logActivity: true,
    customStep: 10 // 10% 증가
  });
  
  console.log('고급 옵션 결과:', resultWithOptions);
}

/**
 * 일괄 긴급 수수료 증가 예제
 */
async function exampleBatchIncrease() {
  console.log('=== 일괄 긴급 수수료 증가 예제 ===');

  const jobIds = ['job1', 'job2', 'job3', 'job4', 'job5'];
  
  const batchResult = await batchIncreaseUrgentFees(jobIds, {
    sendNotification: true,
    logActivity: true,
    batchSize: 3 // 한 번에 3개씩 처리
  });
  
  console.log('일괄 처리 결과:', batchResult);
  
  // 결과 분석
  console.log(`총 ${batchResult.total}개 작업 중:`);
  console.log(`- 성공: ${batchResult.successful}개`);
  console.log(`- 실패: ${batchResult.failed}개`);
  console.log(`- 증가됨: ${batchResult.increased}개`);
  console.log(`- 최대값 도달: ${batchResult.maxReached}개`);
}

/**
 * 조건 확인 예제
 */
async function exampleCheckConditions() {
  console.log('=== 조건 확인 예제 ===');

  const jobId = 'job123';
  const conditions = await checkUrgentFeeIncreaseConditions(jobId);
  
  console.log('조건 확인 결과:', conditions);
  
  if (conditions.canIncrease) {
    console.log('긴급 수수료를 증가할 수 있습니다.');
    console.log(`현재: ${conditions.currentPercent}%, 최대: ${conditions.maxPercent}%`);
  } else {
    console.log('긴급 수수료를 증가할 수 없습니다.');
    console.log('사유:', conditions.reason);
  }
}

/**
 * 스케줄러 함수 예제 (Cloud Functions용)
 */
exports.scheduledUrgentFeeIncrease = async (event, context) => {
  console.log('=== 스케줄된 긴급 수수료 증가 시작 ===');
  
  try {
    // 열린 상태의 작업들 조회
    const openJobs = await getOpenJobsWithUrgentFees();
    
    if (openJobs.length === 0) {
      console.log('처리할 작업이 없습니다.');
      return;
    }
    
    console.log(`${openJobs.length}개의 열린 작업을 처리합니다.`);
    
    // 각 작업에 대해 조건 확인 후 증가
    const results = [];
    for (const job of openJobs) {
      const conditions = await checkUrgentFeeIncreaseConditions(job.id);
      
      if (conditions.canIncrease) {
        const result = await increaseUrgentFee(job.id, {
          sendNotification: true,
          logActivity: true
        });
        results.push(result);
      }
    }
    
    console.log(`처리 완료: ${results.length}개 작업`);
    
    // 결과 요약
    const summary = {
      totalJobs: openJobs.length,
      processedJobs: results.length,
      successful: results.filter(r => r.success).length,
      increased: results.filter(r => r.increased).length,
      maxReached: results.filter(r => r.maxReached).length
    };
    
    console.log('처리 요약:', summary);
    
  } catch (error) {
    console.error('스케줄된 긴급 수수료 증가 실패:', error);
    throw error;
  }
};

/**
 * 열린 상태의 긴급 수수료 작업 조회
 */
async function getOpenJobsWithUrgentFees() {
  const admin = require('firebase-admin');
  const firestore = admin.firestore();
  
  try {
    const jobsRef = firestore.collection('jobs');
    const snapshot = await jobsRef
      .where('status', '==', 'open')
      .where('urgentFeePercent', '>', 0)
      .get();
    
    const jobs = [];
    snapshot.forEach(doc => {
      jobs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('작업 조회 실패:', error);
    return [];
  }
}

/**
 * HTTP 호출 가능 함수 예제
 */
exports.manualUrgentFeeIncrease = async (req, res) => {
  console.log('=== 수동 긴급 수수료 증가 ===');
  
  try {
    const { jobId, customStep, sendNotification } = req.body;
    
    // 입력 검증
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: '작업 ID가 필요합니다.'
      });
    }
    
    // 조건 확인
    const conditions = await checkUrgentFeeIncreaseConditions(jobId);
    
    if (!conditions.canIncrease) {
      return res.status(400).json({
        success: false,
        error: `긴급 수수료를 증가할 수 없습니다: ${conditions.reason}`
      });
    }
    
    // 긴급 수수료 증가
    const result = await increaseUrgentFee(jobId, {
      sendNotification: sendNotification !== false,
      logActivity: true,
      customStep: customStep || null
    });
    
    if (result.success) {
      res.json({
        success: true,
        message: '긴급 수수료가 성공적으로 증가되었습니다.',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        data: result
      });
    }
    
  } catch (error) {
    console.error('수동 긴급 수수료 증가 실패:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

/**
 * 통계 조회 함수 예제
 */
exports.getUrgentFeeStatistics = async (req, res) => {
  console.log('=== 긴급 수수료 통계 조회 ===');
  
  try {
    const admin = require('firebase-admin');
    const firestore = admin.firestore();
    
    const statsRef = firestore.collection('statistics').doc('urgentFees');
    const statsSnap = await statsRef.get();
    
    if (!statsSnap.exists) {
      return res.json({
        success: true,
        data: {
          totalIncreases: 0,
          totalIncreaseAmount: 0,
          maxReachedCount: 0,
          lastUpdated: null
        }
      });
    }
    
    const stats = statsSnap.data();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 테스트 함수
 */
async function runTests() {
  console.log('=== 긴급 수수료 관리 테스트 시작 ===');
  
  try {
    // 조건 확인 테스트
    await exampleCheckConditions();
    
    // 개별 증가 테스트
    await exampleIncreaseUrgentFee();
    
    // 일괄 증가 테스트
    await exampleBatchIncrease();
    
    console.log('=== 모든 테스트 완료 ===');
    
  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

// 테스트 실행 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  runTests();
}

module.exports = {
  exampleIncreaseUrgentFee,
  exampleBatchIncrease,
  exampleCheckConditions,
  runTests
}; 