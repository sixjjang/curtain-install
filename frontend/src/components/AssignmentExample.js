import React, { useState } from 'react';
import { assignJob, assignContractor, gradeRank, matchJob } from '../utils/contractorAssignment';

const AssignmentExample = () => {
  const [result, setResult] = useState(null);

  // 샘플 시공기사 데이터
  const sampleContractors = [
    {
      id: '1',
      name: '김철수',
      grade: 'A',
      available: true,
      active: true,
      averageRating: 4.8,
      estimatedCost: 500000,
      location: { lat: 37.5665, lng: 126.9780 }, // 서울
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
    }
  ];

  // 샘플 작업 데이터
  const sampleJob = {
    id: 'job-001',
    title: '거실 커튼 설치',
    budget: 500000,
    date: new Date('2024-01-15'),
    duration: 4,
    location: { lat: 37.5665, lng: 126.9780 },
    requiredSkills: ['커튼'],
    minRating: 4.0
  };

  // 간단한 배정 테스트
  const testSimpleAssignment = () => {
    console.log('=== 간단한 배정 테스트 ===');
    console.log('시공기사 목록:', sampleContractors);
    console.log('작업 정보:', sampleJob);
    
    const assignedId = assignJob(sampleJob, sampleContractors);
    
    if (assignedId) {
      const assignedContractor = sampleContractors.find(c => c.id === assignedId);
      setResult({
        type: 'simple',
        success: true,
        message: `배정 완료: ${assignedContractor.name} (${assignedContractor.grade}등급)`,
        contractor: assignedContractor
      });
    } else {
      setResult({
        type: 'simple',
        success: false,
        message: '배정 가능한 시공기사가 없습니다.'
      });
    }
  };

  // 종합 배정 테스트
  const testComprehensiveAssignment = () => {
    console.log('=== 종합 배정 테스트 ===');
    
    const result = assignContractor(sampleContractors, sampleJob, {
      maxDistance: 50,
      minRating: 4.0,
      priority: 'grade',
      maxCandidates: 5,
      autoAssign: false
    });
    
    setResult({
      type: 'comprehensive',
      ...result
    });
  };

  // 등급 순위 테스트
  const testGradeRanking = () => {
    console.log('=== 등급 순위 테스트 ===');
    
    const grades = ['A', 'B', 'C', 'D'];
    const rankings = grades.map(grade => ({
      grade,
      rank: gradeRank(grade)
    }));
    
    console.log('등급별 순위:', rankings);
    setResult({
      type: 'grade-ranking',
      success: true,
      message: '등급 순위 확인 완료',
      rankings
    });
  };

  // 매칭 테스트
  const testMatching = () => {
    console.log('=== 매칭 테스트 ===');
    
    const matches = sampleContractors.map(contractor => ({
      contractor: contractor.name,
      grade: contractor.grade,
      available: contractor.available,
      matches: matchJob(contractor, sampleJob)
    }));
    
    console.log('매칭 결과:', matches);
    setResult({
      type: 'matching',
      success: true,
      message: '매칭 테스트 완료',
      matches
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">시공기사 배정 예제</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={testSimpleAssignment}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            간단한 배정 테스트
          </button>
          
          <button
            onClick={testComprehensiveAssignment}
            className="px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            종합 배정 테스트
          </button>
          
          <button
            onClick={testGradeRanking}
            className="px-4 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
          >
            등급 순위 테스트
          </button>
          
          <button
            onClick={testMatching}
            className="px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            매칭 테스트
          </button>
        </div>

        {/* 결과 표시 */}
        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h3 className="font-semibold text-gray-900 mb-2">
              {result.type === 'simple' && '간단한 배정 결과'}
              {result.type === 'comprehensive' && '종합 배정 결과'}
              {result.type === 'grade-ranking' && '등급 순위 결과'}
              {result.type === 'matching' && '매칭 테스트 결과'}
            </h3>
            
            <p className={`font-medium ${
              result.success ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {result.message}
            </p>

            {/* 간단한 배정 결과 */}
            {result.type === 'simple' && result.contractor && (
              <div className="mt-3 p-3 bg-white rounded border">
                <h4 className="font-medium text-gray-900 mb-2">배정된 시공기사</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>이름: {result.contractor.name}</p>
                  <p>등급: {result.contractor.grade}</p>
                  <p>평점: {result.contractor.averageRating}</p>
                  <p>예상 비용: {result.contractor.estimatedCost?.toLocaleString()}원</p>
                </div>
              </div>
            )}

            {/* 종합 배정 결과 */}
            {result.type === 'comprehensive' && result.candidates && (
              <div className="mt-3">
                <h4 className="font-medium text-gray-900 mb-2">배정 후보 ({result.candidates.length}명)</h4>
                <div className="space-y-2">
                  {result.candidates.map((contractor, index) => (
                    <div key={contractor.id} className="p-3 bg-white rounded border">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{contractor.name}</p>
                          <p className="text-sm text-gray-600">
                            {contractor.grade}등급 | 평점: {contractor.averageRating} | 
                            거리: {contractor.distance?.toFixed(1)}km | 
                            종합점수: {contractor.compositeScore}
                          </p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {index + 1}순위
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 등급 순위 결과 */}
            {result.type === 'grade-ranking' && result.rankings && (
              <div className="mt-3">
                <h4 className="font-medium text-gray-900 mb-2">등급별 순위</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {result.rankings.map(({ grade, rank }) => (
                    <div key={grade} className="p-2 bg-white rounded border text-center">
                      <p className="font-medium">{grade}등급</p>
                      <p className="text-sm text-gray-600">순위: {rank}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 매칭 결과 */}
            {result.type === 'matching' && result.matches && (
              <div className="mt-3">
                <h4 className="font-medium text-gray-900 mb-2">매칭 결과</h4>
                <div className="space-y-2">
                  {result.matches.map((match, index) => (
                    <div key={index} className="p-3 bg-white rounded border">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{match.contractor}</p>
                          <p className="text-sm text-gray-600">
                            {match.grade}등급 | 가용: {match.available ? '예' : '아니오'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          match.matches 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {match.matches ? '매칭' : '불일치'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 샘플 데이터 표시 */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">샘플 데이터</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 시공기사 목록 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">시공기사 목록</h4>
            <div className="space-y-2">
              {sampleContractors.map(contractor => (
                <div key={contractor.id} className="p-3 bg-gray-50 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{contractor.name}</p>
                      <p className="text-sm text-gray-600">
                        {contractor.grade}등급 | 평점: {contractor.averageRating} | 
                        가용: {contractor.available ? '예' : '아니오'}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {contractor.estimatedCost?.toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 작업 정보 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">작업 정보</h4>
            <div className="p-3 bg-gray-50 rounded border">
              <p className="font-medium">{sampleJob.title}</p>
              <div className="text-sm text-gray-600 space-y-1 mt-2">
                <p>예산: {sampleJob.budget?.toLocaleString()}원</p>
                <p>날짜: {sampleJob.date.toLocaleDateString()}</p>
                <p>소요시간: {sampleJob.duration}시간</p>
                <p>최소평점: {sampleJob.minRating}</p>
                <p>필요기술: {sampleJob.requiredSkills.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentExample; 