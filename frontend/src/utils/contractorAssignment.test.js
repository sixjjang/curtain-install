/**
 * 시공기사 배정 시스템 테스트
 * 실제 사용 예시와 함께 기능을 검증합니다.
 */

import { assignJob, assignContractor, gradeRank, matchJob } from './contractorAssignment';

// 테스트용 시공기사 데이터
const testContractors = [
  {
    id: '1',
    name: '김철수',
    grade: 'A',
    available: true,
    active: true,
    averageRating: 4.8,
    estimatedCost: 500000,
    location: { lat: 37.5665, lng: 126.9780 },
    skills: ['커튼', '블라인드', '롤스크린']
  },
  {
    id: '2',
    name: '이영희',
    grade: 'B',
    available: true,
    active: true,
    averageRating: 4.2,
    estimatedCost: 450000,
    location: { lat: 37.5665, lng: 126.9780 },
    skills: ['커튼', '블라인드']
  },
  {
    id: '3',
    name: '박민수',
    grade: 'C',
    available: false, // 가용하지 않음
    active: true,
    averageRating: 3.8,
    estimatedCost: 400000,
    location: { lat: 37.5665, lng: 126.9780 },
    skills: ['커튼']
  },
  {
    id: '4',
    name: '정수진',
    grade: 'A',
    available: true,
    active: true,
    averageRating: 4.9,
    estimatedCost: 550000,
    location: { lat: 37.5665, lng: 126.9780 },
    skills: ['커튼', '블라인드', '롤스크린', '셔터']
  },
  {
    id: '5',
    name: '최영수',
    grade: 'D',
    available: true,
    active: false, // 비활성
    averageRating: 2.5,
    estimatedCost: 300000,
    location: { lat: 37.5665, lng: 126.9780 },
    skills: ['커튼']
  }
];

// 테스트용 작업 데이터
const testJob = {
  id: 'job-001',
  title: '거실 커튼 설치',
  budget: 500000,
  date: new Date('2024-01-15'),
  duration: 4,
  location: { lat: 37.5665, lng: 126.9780 },
  requiredSkills: ['커튼'],
  minRating: 4.0
};

/**
 * 등급 순위 테스트
 */
export const testGradeRanking = () => {
  console.log('=== 등급 순위 테스트 ===');
  
  const grades = ['A', 'B', 'C', 'D'];
  const rankings = grades.map(grade => ({
    grade,
    rank: gradeRank(grade)
  }));
  
  console.log('등급별 순위:', rankings);
  
  // 검증
  const expectedRanks = { A: 3, B: 2, C: 1, D: 0 };
  const isValid = rankings.every(({ grade, rank }) => rank === expectedRanks[grade]);
  
  console.log('검증 결과:', isValid ? '✅ 통과' : '❌ 실패');
  return isValid;
};

/**
 * 매칭 테스트
 */
export const testMatching = () => {
  console.log('=== 매칭 테스트 ===');
  
  const matches = testContractors.map(contractor => ({
    contractor: contractor.name,
    grade: contractor.grade,
    available: contractor.available,
    active: contractor.active,
    matches: matchJob(contractor, testJob)
  }));
  
  console.log('매칭 결과:', matches);
  
  // 검증: 가용하고 활성인 A등급 시공기사가 매칭되어야 함
  const expectedMatches = {
    '김철수': true,   // A등급, 가용, 활성
    '이영희': true,   // B등급, 가용, 활성
    '박민수': false,  // 가용하지 않음
    '정수진': true,   // A등급, 가용, 활성
    '최영수': false   // 비활성
  };
  
  const isValid = matches.every(match => 
    match.matches === expectedMatches[match.contractor]
  );
  
  console.log('검증 결과:', isValid ? '✅ 통과' : '❌ 실패');
  return isValid;
};

/**
 * 간단한 배정 테스트
 */
export const testSimpleAssignment = () => {
  console.log('=== 간단한 배정 테스트 ===');
  
  const assignedId = assignJob(testJob, testContractors);
  
  if (assignedId) {
    const assignedContractor = testContractors.find(c => c.id === assignedId);
    console.log('배정된 시공기사:', assignedContractor.name, `(${assignedContractor.grade}등급)`);
    
    // 검증: A등급 시공기사가 우선 배정되어야 함
    const isValid = assignedContractor.grade === 'A';
    console.log('검증 결과:', isValid ? '✅ 통과' : '❌ 실패');
    return isValid;
  } else {
    console.log('배정 가능한 시공기사가 없습니다.');
    console.log('검증 결과: ❌ 실패');
    return false;
  }
};

/**
 * 종합 배정 테스트
 */
export const testComprehensiveAssignment = () => {
  console.log('=== 종합 배정 테스트 ===');
  
  const result = assignContractor(testContractors, testJob, {
    maxDistance: 50,
    minRating: 4.0,
    priority: 'grade',
    maxCandidates: 5,
    autoAssign: false
  });
  
  console.log('배정 결과:', result);
  
  if (result.success) {
    console.log('배정 후보 수:', result.candidates.length);
    console.log('최우선 후보:', result.candidates[0]?.name, `(${result.candidates[0]?.grade}등급)`);
    
    // 검증: 후보가 있고, 등급 순으로 정렬되어 있어야 함
    const isValid = result.candidates.length > 0 && 
                   result.candidates[0].grade === 'A';
    
    console.log('검증 결과:', isValid ? '✅ 통과' : '❌ 실패');
    return isValid;
  } else {
    console.log('배정 실패:', result.message);
    console.log('검증 결과: ❌ 실패');
    return false;
  }
};

/**
 * 다양한 우선순위 테스트
 */
export const testPriorityOptions = () => {
  console.log('=== 우선순위 옵션 테스트 ===');
  
  const priorities = ['grade', 'distance', 'rating', 'composite'];
  const results = {};
  
  priorities.forEach(priority => {
    const result = assignContractor(testContractors, testJob, {
      maxDistance: 50,
      minRating: 0,
      priority,
      maxCandidates: 3,
      autoAssign: false
    });
    
    if (result.success && result.candidates.length > 0) {
      const topCandidate = result.candidates[0];
      results[priority] = {
        name: topCandidate.name,
        grade: topCandidate.grade,
        rating: topCandidate.averageRating,
        distance: topCandidate.distance,
        compositeScore: topCandidate.compositeScore
      };
    }
  });
  
  console.log('우선순위별 최우선 후보:', results);
  
  // 검증: 각 우선순위에 따라 다른 결과가 나올 수 있음
  const isValid = Object.keys(results).length === priorities.length;
  console.log('검증 결과:', isValid ? '✅ 통과' : '❌ 실패');
  return isValid;
};

/**
 * 자동 배정 테스트
 */
export const testAutoAssignment = () => {
  console.log('=== 자동 배정 테스트 ===');
  
  const result = assignContractor(testContractors, testJob, {
    maxDistance: 50,
    minRating: 4.0,
    priority: 'grade',
    maxCandidates: 5,
    autoAssign: true
  });
  
  console.log('자동 배정 결과:', result);
  
  if (result.success && result.assignment) {
    console.log('자동 배정된 시공기사:', result.assignment.contractorName);
    
    // 검증: 자동 배정이 성공해야 함
    const isValid = result.assignment.contractorId && result.assignment.contractorName;
    console.log('검증 결과:', isValid ? '✅ 통과' : '❌ 실패');
    return isValid;
  } else {
    console.log('자동 배정 실패:', result.message);
    console.log('검증 결과: ❌ 실패');
    return false;
  }
};

/**
 * 전체 테스트 실행
 */
export const runAllTests = () => {
  console.log('🚀 시공기사 배정 시스템 테스트 시작\n');
  
  const tests = [
    { name: '등급 순위', test: testGradeRanking },
    { name: '매칭', test: testMatching },
    { name: '간단한 배정', test: testSimpleAssignment },
    { name: '종합 배정', test: testComprehensiveAssignment },
    { name: '우선순위 옵션', test: testPriorityOptions },
    { name: '자동 배정', test: testAutoAssignment }
  ];
  
  const results = tests.map(({ name, test }) => {
    try {
      const result = test();
      return { name, result, error: null };
    } catch (error) {
      console.error(`${name} 테스트 오류:`, error);
      return { name, result: false, error: error.message };
    }
  });
  
  console.log('\n📊 테스트 결과 요약');
  console.log('='.repeat(50));
  
  results.forEach(({ name, result, error }) => {
    const status = error ? '❌ 오류' : (result ? '✅ 통과' : '❌ 실패');
    console.log(`${name}: ${status}`);
    if (error) {
      console.log(`  오류: ${error}`);
    }
  });
  
  const passedTests = results.filter(r => r.result && !r.error).length;
  const totalTests = results.length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`전체 결과: ${passedTests}/${totalTests} 테스트 통과`);
  
  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    results
  };
};

// 브라우저에서 직접 실행 가능하도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.ContractorAssignmentTest = {
    testGradeRanking,
    testMatching,
    testSimpleAssignment,
    testComprehensiveAssignment,
    testPriorityOptions,
    testAutoAssignment,
    runAllTests
  };
}

export default {
  testGradeRanking,
  testMatching,
  testSimpleAssignment,
  testComprehensiveAssignment,
  testPriorityOptions,
  testAutoAssignment,
  runAllTests
}; 