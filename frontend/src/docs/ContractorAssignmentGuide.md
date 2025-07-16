# 시공기사 배정 시스템 가이드

## 개요

시공기사 배정 시스템은 등급, 가용성, 위치, 기술 등을 고려하여 최적의 시공기사를 자동으로 배정하는 시스템입니다.

## 주요 기능

### 1. 간단한 배정 (`assignJob`)
가장 기본적인 배정 방식으로, 등급 순으로 정렬 후 첫 번째로 조건을 만족하는 시공기사를 배정합니다.

```javascript
import { assignJob } from '../utils/contractorAssignment';

// 사용 예시
const assignedContractorId = assignJob(job, contractors);
if (assignedContractorId) {
  console.log('배정된 시공기사 ID:', assignedContractorId);
} else {
  console.log('배정 가능한 시공기사가 없습니다.');
}
```

### 2. 종합 배정 (`assignContractor`)
다양한 조건과 가중치를 적용하여 최적의 시공기사를 선별하는 고급 배정 방식입니다.

```javascript
import { assignContractor } from '../utils/contractorAssignment';

const result = assignContractor(contractors, job, {
  maxDistance: 50,           // 최대 거리 (km)
  minRating: 4.0,           // 최소 평점
  requireExperience: false,  // 경험 요구 여부
  priority: 'grade',         // 우선순위: 'grade', 'distance', 'rating', 'composite'
  maxCandidates: 10,         // 최대 후보 수
  autoAssign: false          // 자동 배정 여부
});

if (result.success) {
  console.log('배정 후보:', result.candidates);
  console.log('배정 결과:', result.assignment);
}
```

### 3. 등급 순위 확인 (`gradeRank`)
등급별 우선순위를 확인하는 유틸리티 함수입니다.

```javascript
import { gradeRank } from '../utils/contractorAssignment';

console.log(gradeRank('A')); // 3 (최고 우선순위)
console.log(gradeRank('B')); // 2
console.log(gradeRank('C')); // 1
console.log(gradeRank('D')); // 0 (최저 우선순위)
```

### 4. 작업 매칭 확인 (`matchJob`)
특정 시공기사가 작업 조건을 만족하는지 확인하는 함수입니다.

```javascript
import { matchJob } from '../utils/contractorAssignment';

const isMatch = matchJob(contractor, job);
console.log('매칭 여부:', isMatch);
```

## 데이터 구조

### 시공기사 데이터 구조
```javascript
const contractor = {
  id: 'contractor-001',
  name: '김철수',
  grade: 'A',                    // 등급: A, B, C, D
  available: true,               // 가용 여부
  active: true,                  // 활성 상태
  suspended: false,              // 정지 상태
  averageRating: 4.8,            // 평균 평점
  estimatedCost: 500000,         // 예상 비용
  hourlyRate: 50000,             // 시간당 요금
  location: {                    // 위치 정보
    lat: 37.5665,
    lng: 126.9780
  },
  skills: ['커튼', '블라인드'],   // 보유 기술
  experience: {                  // 경험 정보
    '커튼': 5,
    '블라인드': 3
  },
  availableDates: ['2024-01-15', '2024-01-16'], // 가용 날짜
  scheduledJobs: []              // 예약된 작업
};
```

### 작업 데이터 구조
```javascript
const job = {
  id: 'job-001',
  title: '거실 커튼 설치',
  budget: 500000,                // 예산
  date: new Date('2024-01-15'),  // 작업 날짜
  duration: 4,                   // 소요 시간 (시간)
  maxDuration: 8,                // 최대 허용 시간
  location: {                    // 작업 위치
    lat: 37.5665,
    lng: 126.9780
  },
  maxDistance: 50,               // 최대 거리 (km)
  requiredSkills: ['커튼'],      // 필요 기술
  minRating: 4.0,               // 최소 평점
  type: '커튼'                   // 작업 유형
};
```

## 배정 로직

### 1. 간단한 배정 로직
1. 시공기사를 등급 순으로 정렬 (A > B > C > D)
2. 각 시공기사에 대해 다음 조건 확인:
   - 가용성 (`available`)
   - 활성 상태 (`active`)
   - 스케줄 충돌 여부
   - 예산 범위
   - 거리 제한
   - 평점 요구사항
   - 기술 요구사항
3. 첫 번째로 모든 조건을 만족하는 시공기사 배정

### 2. 종합 배정 로직
1. **기본 필터링**: 가용성, 활성 상태, 스케줄, 예산, 거리, 평점, 기술 확인
2. **점수 계산**: 각 시공기사별로 다음 항목 점수화
   - 등급 점수 (0-100)
   - 거리 점수 (0-100)
   - 평점 점수 (0-100)
   - 가용성 점수 (0-100)
   - 경험 점수 (0-100)
   - 비용 점수 (0-100)
3. **종합 점수 계산**: 우선순위에 따른 가중 평균
4. **정렬**: 선택된 우선순위 기준으로 정렬
5. **후보 선정**: 상위 N명 선정
6. **자동 배정**: 옵션에 따라 최우선 후보 자동 배정

## 점수 계산 방식

### 등급 점수
- A등급: 100점
- B등급: 80점
- C등급: 60점
- D등급: 40점

### 거리 점수
- 0-5km: 100점
- 5-10km: 90점
- 10-15km: 80점
- 15-20km: 70점
- 20-30km: 60점
- 30-40km: 50점
- 40km+: 40점

### 평점 점수
- 5점 만점을 100점으로 변환 (평점 × 20)

### 가용성 점수
- 정확한 날짜 매칭: 100점
- 3일 이내 근접 날짜: 80점
- 그 외: 0점

### 경험 점수
- 5년 이상: 100점
- 3-4년: 80점
- 1-2년: 60점
- 1년 미만: 40점

### 비용 점수
- 예산의 70% 이하: 100점
- 예산의 80% 이하: 90점
- 예산의 90% 이하: 80점
- 예산 이하: 70점
- 예산 초과: 50점

## 우선순위별 가중치

### 등급 우선
- 등급: 30%
- 평점: 25%
- 거리: 20%
- 가용성: 15%
- 경험: 10%

### 거리 우선
- 거리: 40%
- 등급: 20%
- 평점: 20%
- 가용성: 15%
- 경험: 5%

### 평점 우선
- 평점: 40%
- 등급: 25%
- 거리: 20%
- 가용성: 10%
- 경험: 5%

### 종합 점수
- 등급: 25%
- 평점: 25%
- 거리: 20%
- 가용성: 15%
- 경험: 10%
- 비용: 5%

## 사용 예시

### React 컴포넌트에서 사용
```javascript
import React, { useState, useEffect } from 'react';
import { assignJob, assignContractor } from '../utils/contractorAssignment';

const JobAssignmentComponent = ({ job }) => {
  const [contractors, setContractors] = useState([]);
  const [assignment, setAssignment] = useState(null);

  // 간단한 배정
  const handleSimpleAssignment = () => {
    const assignedId = assignJob(job, contractors);
    if (assignedId) {
      const assignedContractor = contractors.find(c => c.id === assignedId);
      setAssignment(assignedContractor);
    }
  };

  // 종합 배정
  const handleComprehensiveAssignment = () => {
    const result = assignContractor(contractors, job, {
      maxDistance: 50,
      minRating: 4.0,
      priority: 'grade',
      autoAssign: true
    });
    
    if (result.success && result.assignment) {
      setAssignment(result.assignment);
    }
  };

  return (
    <div>
      <button onClick={handleSimpleAssignment}>간단한 배정</button>
      <button onClick={handleComprehensiveAssignment}>종합 배정</button>
      
      {assignment && (
        <div>
          <h3>배정된 시공기사: {assignment.contractorName}</h3>
          <p>등급: {assignment.grade}</p>
          <p>예상 비용: {assignment.estimatedCost}원</p>
        </div>
      )}
    </div>
  );
};
```

### Firebase Cloud Functions에서 사용
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.assignContractorToJob = functions.https.onCall(async (data, context) => {
  const { jobId } = data;
  
  try {
    // 작업 정보 조회
    const jobDoc = await admin.firestore().collection('jobs').doc(jobId).get();
    const job = { id: jobId, ...jobDoc.data() };
    
    // 시공기사 목록 조회
    const contractorsSnapshot = await admin.firestore()
      .collection('contractors')
      .where('active', '==', true)
      .get();
    
    const contractors = contractorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 배정 실행
    const assignedId = assignJob(job, contractors);
    
    if (assignedId) {
      // 배정 결과 저장
      await admin.firestore().collection('assignments').add({
        jobId,
        contractorId: assignedId,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'assigned'
      });
      
      return { success: true, contractorId: assignedId };
    } else {
      return { success: false, message: '배정 가능한 시공기사가 없습니다.' };
    }
  } catch (error) {
    console.error('배정 오류:', error);
    throw new functions.https.HttpsError('internal', '배정 처리 중 오류가 발생했습니다.');
  }
});
```

## 주의사항

1. **데이터 일관성**: 시공기사와 작업 데이터의 필수 필드가 올바르게 설정되어야 합니다.
2. **성능 고려**: 대량의 시공기사 데이터 처리 시 메모리 사용량을 고려해야 합니다.
3. **실시간 업데이트**: 시공기사의 가용성이나 스케줄이 변경될 때 실시간으로 반영되어야 합니다.
4. **에러 처리**: 배정 실패 시 적절한 에러 메시지와 대안을 제공해야 합니다.
5. **로깅**: 배정 과정과 결과를 로깅하여 시스템 개선에 활용해야 합니다.

## 확장 가능성

1. **머신러닝 통합**: 과거 배정 데이터를 활용한 예측 모델 적용
2. **실시간 알림**: 배정 결과를 시공기사에게 실시간 알림
3. **배정 히스토리**: 배정 이력 관리 및 분석
4. **다중 작업 배정**: 한 명의 시공기사에게 여러 작업 배정
5. **동적 가중치**: 상황에 따른 가중치 자동 조정 