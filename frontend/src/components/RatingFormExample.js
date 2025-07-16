import React, { useState } from 'react';
import RatingForm from './RatingForm';

const RatingFormExample = () => {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [ratingHistory, setRatingHistory] = useState([]);

  // 샘플 대상 데이터
  const sampleTargets = [
    {
      id: 'contractor1',
      name: '김철수 (계약자)',
      type: 'contractor',
      role: 'seller',
      categories: [
        { key: 'quality', label: '시공 품질', description: '작업 완성도와 품질' },
        { key: 'punctuality', label: '시간 준수', description: '약속 시간 준수도' },
        { key: 'communication', label: '의사소통', description: '소통과 협조' },
        { key: 'professionalism', label: '전문성', description: '전문 지식과 태도' },
        { key: 'overall', label: '종합 평가', description: '전체적인 만족도' }
      ]
    },
    {
      id: 'seller1',
      name: '이영희 (판매자)',
      type: 'seller',
      role: 'contractor',
      categories: [
        { key: 'communication', label: '의사소통', description: '요구사항 전달과 소통' },
        { key: 'payment', label: '결제 처리', description: '결제 진행과 처리' },
        { key: 'cooperation', label: '협조도', description: '작업 협조와 지원' },
        { key: 'overall', label: '종합 평가', description: '전체적인 만족도' }
      ]
    },
    {
      id: 'project1',
      name: '강남구 커튼 설치 프로젝트',
      type: 'project',
      role: 'both',
      categories: [
        { key: 'planning', label: '계획 수립', description: '프로젝트 계획과 준비' },
        { key: 'execution', label: '실행 과정', description: '실제 작업 진행' },
        { key: 'quality', label: '결과 품질', description: '최종 결과물 품질' },
        { key: 'overall', label: '종합 평가', description: '전체적인 만족도' }
      ]
    }
  ];

  const handleStartRating = (target) => {
    setSelectedTarget(target);
    setShowRatingForm(true);
  };

  const handleRatingSuccess = (ratingData) => {
    const newRating = {
      id: Date.now(),
      targetId: selectedTarget.id,
      targetName: selectedTarget.name,
      ratingData,
      submittedAt: new Date().toLocaleString()
    };
    
    setRatingHistory(prev => [newRating, ...prev.slice(0, 9)]); // 최대 10개 유지
    setShowRatingForm(false);
    setSelectedTarget(null);
  };

  const handleRatingCancel = () => {
    setShowRatingForm(false);
    setSelectedTarget(null);
  };

  const getTargetTypeColor = (type) => {
    const colors = {
      contractor: 'bg-blue-100 text-blue-800',
      seller: 'bg-green-100 text-green-800',
      project: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTargetTypeText = (type) => {
    const texts = {
      contractor: '계약자',
      seller: '판매자',
      project: '프로젝트'
    };
    return texts[type] || '기타';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            평가 시스템 데모
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              기능 설명
            </h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>다중 카테고리 평가:</strong> 품질, 시간 준수, 의사소통 등 세부 평가</li>
              <li>• <strong>별점 시스템:</strong> 직관적인 5점 만점 별점 인터페이스</li>
              <li>• <strong>실시간 평균 계산:</strong> 입력 시 즉시 평균 평점 계산</li>
              <li>• <strong>상세 검증:</strong> 필수 입력 항목 및 글자 수 제한</li>
              <li>• <strong>성공 피드백:</strong> 평가 완료 시 시각적 피드백</li>
              <li>• <strong>평가 이력:</strong> 제출된 평가 내역 확인</li>
            </ul>
          </div>
        </div>

        {/* 평가 대상 목록 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">평가 대상 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleTargets.map((target) => (
              <div
                key={target.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => handleStartRating(target)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{target.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTargetTypeColor(target.type)}`}>
                    {getTargetTypeText(target.type)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p>평가 카테고리: {target.categories.length}개</p>
                  <p>평가자 역할: {target.role === 'both' ? '모든 사용자' : target.role}</p>
                </div>
                
                <div className="mt-3">
                  <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    평가 시작
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 평가 폼 모달 */}
        {showRatingForm && selectedTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl">
              <RatingForm
                targetId={selectedTarget.id}
                raterId="demo_user_123"
                role={selectedTarget.role}
                targetName={selectedTarget.name}
                categories={selectedTarget.categories}
                onSuccess={handleRatingSuccess}
                onCancel={handleRatingCancel}
              />
            </div>
          </div>
        )}

        {/* 평가 이력 */}
        {ratingHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 평가 이력</h2>
            <div className="space-y-4">
              {ratingHistory.map((rating) => (
                <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{rating.targetName}</h3>
                      <p className="text-sm text-gray-600">
                        제출 시간: {rating.submittedAt}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600">
                        {rating.ratingData.averageRating}점
                      </div>
                      <div className="text-sm text-gray-600">
                        평균 평점
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {Object.entries(rating.ratingData.ratings).map(([category, score]) => (
                      <div key={category} className="bg-gray-50 rounded p-2">
                        <div className="font-medium text-gray-900 capitalize">
                          {category === 'overall' ? '종합' : 
                           category === 'quality' ? '품질' :
                           category === 'punctuality' ? '시간 준수' :
                           category === 'communication' ? '의사소통' :
                           category === 'professionalism' ? '전문성' :
                           category === 'payment' ? '결제' :
                           category === 'cooperation' ? '협조' :
                           category === 'planning' ? '계획' :
                           category === 'execution' ? '실행' : category}
                        </div>
                        <div className="text-blue-600 font-semibold">{score}점</div>
                      </div>
                    ))}
                  </div>
                  
                  {rating.ratingData.comment && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>평가 내용:</strong> {rating.ratingData.comment}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 평가 통계 */}
        {ratingHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">평가 통계</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {ratingHistory.length}
                </div>
                <div className="text-sm text-gray-600">총 평가 수</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {(ratingHistory.reduce((sum, rating) => sum + rating.ratingData.averageRating, 0) / ratingHistory.length).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">평균 평점</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {new Set(ratingHistory.map(r => r.targetId)).size}
                </div>
                <div className="text-sm text-gray-600">평가 대상 수</div>
              </div>
            </div>
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">사용법 안내</h3>
          <div className="text-green-800 space-y-2 text-sm">
            <p><strong>1. 평가 대상 선택:</strong> 위의 카드 중 하나를 클릭하여 평가를 시작합니다.</p>
            <p><strong>2. 카테고리별 평가:</strong> 각 평가 항목에 대해 별점을 클릭하여 점수를 매깁니다.</p>
            <p><strong>3. 평가 내용 작성:</strong> 10-500자 내외로 상세한 평가 내용을 작성합니다.</p>
            <p><strong>4. 평균 평점 확인:</strong> 입력한 점수들의 평균이 실시간으로 계산됩니다.</p>
            <p><strong>5. 평가 제출:</strong> 모든 항목을 입력한 후 '평가 등록' 버튼을 클릭합니다.</p>
            <p><strong>6. 완료 확인:</strong> 성공적으로 등록되면 확인 메시지가 표시됩니다.</p>
          </div>
        </div>

        {/* 평가 기준 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">평가 기준</h3>
          <div className="text-yellow-800 space-y-2 text-sm">
            <p><strong>5점 (매우 만족):</strong> 기대 이상의 훌륭한 서비스</p>
            <p><strong>4점 (만족):</strong> 요구사항을 충족하는 좋은 서비스</p>
            <p><strong>3점 (보통):</strong> 기본적인 요구사항은 충족하지만 개선 여지가 있음</p>
            <p><strong>2점 (불만족):</strong> 요구사항을 제대로 충족하지 못함</p>
            <p><strong>1점 (매우 불만족):</strong> 심각한 문제가 있거나 요구사항을 전혀 충족하지 못함</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingFormExample; 