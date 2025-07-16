import React, { useState, useEffect } from 'react';
import {
  determineContractorLevel,
  calculateWeightedScore,
  analyzeContractorGrade,
  getGradeBenefits,
  calculateGradeUpgradeProjection,
  generateGradeStatistics,
  advancedContractorGrading
} from '../utils/contractorGrading';

const ContractorGradingExample = () => {
  const [contractorData, setContractorData] = useState({
    completedJobsCount: 35,
    averageRating: 4.2,
    photoQualityScore: 4.3,
    responseTime: 45,
    onTimeRate: 85,
    satisfactionRate: 82
  });
  const [analysis, setAnalysis] = useState(null);
  const [showProjections, setShowProjections] = useState(false);
  const [projections, setProjections] = useState({
    completedJobsPerMonth: 5,
    ratingImprovementPerMonth: 0.1,
    photoQualityImprovementPerMonth: 0.2,
    responseTimeImprovementPerMonth: 5,
    onTimeRateImprovementPerMonth: 2,
    satisfactionRateImprovementPerMonth: 1
  });

  // 샘플 계약자 데이터
  const sampleContractors = [
    {
      id: 'contractor1',
      name: '김철수',
      completedJobsCount: 15,
      averageRating: 3.8,
      photoQualityScore: 3.5,
      responseTime: 75,
      onTimeRate: 75,
      satisfactionRate: 78
    },
    {
      id: 'contractor2',
      name: '이영희',
      completedJobsCount: 45,
      averageRating: 4.4,
      photoQualityScore: 4.6,
      responseTime: 35,
      onTimeRate: 92,
      satisfactionRate: 88
    },
    {
      id: 'contractor3',
      name: '박민수',
      completedJobsCount: 120,
      averageRating: 4.7,
      photoQualityScore: 4.9,
      responseTime: 25,
      onTimeRate: 98,
      satisfactionRate: 95
    },
    {
      id: 'contractor4',
      name: '최지영',
      completedJobsCount: 8,
      averageRating: 3.2,
      photoQualityScore: 2.8,
      responseTime: 95,
      onTimeRate: 65,
      satisfactionRate: 70
    },
    {
      id: 'contractor5',
      name: '정현우',
      completedJobsCount: 75,
      averageRating: 4.5,
      photoQualityScore: 4.7,
      responseTime: 40,
      onTimeRate: 88,
      satisfactionRate: 85
    }
  ];

  useEffect(() => {
    // 실시간 분석 업데이트
    const result = analyzeContractorGrade(contractorData);
    setAnalysis(result);
  }, [contractorData]);

  const handleInputChange = (field, value) => {
    setContractorData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleProjectionChange = (field, value) => {
    setProjections(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const getGradeColor = (level) => {
    const colors = {
      1: 'bg-gray-100 text-gray-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-green-100 text-green-800',
      4: 'bg-purple-100 text-purple-800',
      5: 'bg-yellow-100 text-yellow-800'
    };
    return colors[level] || colors[1];
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
  };

  const projection = showProjections ? calculateGradeUpgradeProjection(contractorData, projections) : null;
  const statistics = generateGradeStatistics(sampleContractors);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            계약자 등급 시스템 데모
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              기능 설명
            </h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>5단계 등급 시스템:</strong> 브론즈, 실버, 골드, 플래티넘, 다이아몬드</li>
              <li>• <strong>종합 평가 기준:</strong> 완료 작업 수, 평점, 사진 품질, 응답 시간, 시간 준수율</li>
              <li>• <strong>가중 점수 계산:</strong> 각 항목별 가중치를 적용한 종합 점수</li>
              <li>• <strong>등급 상승 분석:</strong> 다음 등급 달성을 위한 요구사항 분석</li>
              <li>• <strong>예상 시기 계산:</strong> 개선 계획에 따른 등급 상승 예상 시기</li>
              <li>• <strong>통계 분석:</strong> 전체 계약자 등급 분포 및 성과 분석</li>
            </ul>
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">계약자 데이터 입력</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                완료 작업 수
              </label>
              <input
                type="number"
                value={contractorData.completedJobsCount}
                onChange={(e) => handleInputChange('completedJobsCount', e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                평균 평점 (1-5)
              </label>
              <input
                type="number"
                value={contractorData.averageRating}
                onChange={(e) => handleInputChange('averageRating', e.target.value)}
                min="0"
                max="5"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사진 품질 점수 (1-10)
              </label>
              <input
                type="number"
                value={contractorData.photoQualityScore}
                onChange={(e) => handleInputChange('photoQualityScore', e.target.value)}
                min="0"
                max="10"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                평균 응답 시간 (분)
              </label>
              <input
                type="number"
                value={contractorData.responseTime}
                onChange={(e) => handleInputChange('responseTime', e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시간 준수율 (%)
              </label>
              <input
                type="number"
                value={contractorData.onTimeRate}
                onChange={(e) => handleInputChange('onTimeRate', e.target.value)}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                고객 만족도 (%)
              </label>
              <input
                type="number"
                value={contractorData.satisfactionRate}
                onChange={(e) => handleInputChange('satisfactionRate', e.target.value)}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 분석 결과 */}
        {analysis && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">등급 분석 결과</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* 현재 등급 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">현재 등급</h3>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(analysis.currentLevel)}`}>
                  {analysis.currentGrade.name} ({analysis.currentLevel}등급)
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {analysis.currentGrade.description}
                </p>
              </div>

              {/* 가중 점수 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">가중 점수</h3>
                <div className={`text-2xl font-bold ${getScoreColor(analysis.weightedScore, 100)}`}>
                  {analysis.weightedScore.toFixed(1)}점
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  종합 성과 점수 (100점 만점)
                </p>
              </div>

              {/* 다음 등급 */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">다음 등급</h3>
                {analysis.nextGrade ? (
                  <>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(analysis.nextLevel)}`}>
                      {analysis.nextGrade.name} ({analysis.nextLevel}등급)
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {analysis.nextGrade.description}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">이미 최고 등급입니다.</p>
                )}
              </div>
            </div>

            {/* 강점 및 개선점 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">강점</h3>
                {analysis.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {strength}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">특별한 강점이 없습니다.</p>
                )}
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">개선점</h3>
                {analysis.improvements.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-orange-700">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">개선이 필요한 항목이 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 등급 상승 예상 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">등급 상승 예상</h2>
            <button
              onClick={() => setShowProjections(!showProjections)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showProjections ? '숨기기' : '예상 시기 계산'}
            </button>
          </div>

          {showProjections && (
            <div className="space-y-6">
              {/* 개선 계획 입력 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">월별 개선 계획</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">완료 작업 수 증가</label>
                    <input
                      type="number"
                      value={projections.completedJobsPerMonth}
                      onChange={(e) => handleProjectionChange('completedJobsPerMonth', e.target.value)}
                      min="0"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">평점 개선</label>
                    <input
                      type="number"
                      value={projections.ratingImprovementPerMonth}
                      onChange={(e) => handleProjectionChange('ratingImprovementPerMonth', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">사진 품질 개선</label>
                    <input
                      type="number"
                      value={projections.photoQualityImprovementPerMonth}
                      onChange={(e) => handleProjectionChange('photoQualityImprovementPerMonth', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">응답 시간 단축 (분)</label>
                    <input
                      type="number"
                      value={projections.responseTimeImprovementPerMonth}
                      onChange={(e) => handleProjectionChange('responseTimeImprovementPerMonth', e.target.value)}
                      min="0"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">시간 준수율 개선 (%)</label>
                    <input
                      type="number"
                      value={projections.onTimeRateImprovementPerMonth}
                      onChange={(e) => handleProjectionChange('onTimeRateImprovementPerMonth', e.target.value)}
                      min="0"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">만족도 개선 (%)</label>
                    <input
                      type="number"
                      value={projections.satisfactionRateImprovementPerMonth}
                      onChange={(e) => handleProjectionChange('satisfactionRateImprovementPerMonth', e.target.value)}
                      min="0"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 예상 결과 */}
              {projection && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">예상 결과</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>현재 등급:</strong> {analysis.currentGrade.name}</p>
                    <p><strong>목표 등급:</strong> {projection.nextGrade.name}</p>
                    <p><strong>예상 등급:</strong> {projection.projectedLevel >= projection.nextLevel ? '달성 가능' : '추가 개선 필요'}</p>
                    {projection.estimatedMonths && (
                      <p><strong>예상 소요 기간:</strong> 약 {projection.estimatedMonths}개월</p>
                    )}
                    <p className="text-blue-600 font-medium">{projection.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 등급별 통계 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">등급별 통계</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 등급 분포 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">등급별 분포</h3>
              <div className="space-y-2">
                {Object.entries(statistics.byGrade).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(parseInt(level))}`}>
                        {level}등급
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {count}명 ({(count / statistics.total * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 평균 점수 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">전체 평균</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>평균 평점:</span>
                  <span className="font-medium">{statistics.averageScores.averageRating?.toFixed(1) || 0}/5.0</span>
                </div>
                <div className="flex justify-between">
                  <span>평균 사진 품질:</span>
                  <span className="font-medium">{statistics.averageScores.photoQualityScore?.toFixed(1) || 0}/10.0</span>
                </div>
                <div className="flex justify-between">
                  <span>평균 완료 작업:</span>
                  <span className="font-medium">{Math.round(statistics.averageScores.completedJobsCount || 0)}건</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 상위 성과자 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">상위 성과자</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">계약자</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">등급</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">가중 점수</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">완료 작업</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">평균 평점</th>
                </tr>
              </thead>
              <tbody>
                {statistics.topPerformers.map((contractor, index) => (
                  <tr key={contractor.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{contractor.name}</span>
                        {index < 3 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            TOP {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(determineContractorLevel(contractor))}`}>
                        {GRADE_CRITERIA[determineContractorLevel(contractor)].name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-blue-600">{contractor.weightedScore.toFixed(1)}점</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{contractor.completedJobsCount}건</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{contractor.averageRating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 사용법 안내 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-2">사용법 안내</h3>
          <div className="text-green-800 space-y-2 text-sm">
            <p><strong>1. 데이터 입력:</strong> 계약자의 실제 데이터를 입력합니다.</p>
            <p><strong>2. 등급 확인:</strong> 실시간으로 현재 등급과 가중 점수를 확인합니다.</p>
            <p><strong>3. 분석 결과:</strong> 강점과 개선점을 분석하여 확인합니다.</p>
            <p><strong>4. 등급 상승 예상:</strong> 개선 계획을 입력하여 등급 상승 예상 시기를 계산합니다.</p>
            <p><strong>5. 통계 확인:</strong> 전체 계약자의 등급 분포와 상위 성과자를 확인합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorGradingExample; 