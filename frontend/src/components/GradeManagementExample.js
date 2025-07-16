import React, { useState } from 'react';
import GradeManagement from './GradeManagement';

const GradeManagementExample = () => {
  const [activeTab, setActiveTab] = useState('management');
  const [showGuide, setShowGuide] = useState(false);

  const tabs = [
    { id: 'management', name: '등급 관리', description: '계약자 등급 관리 시스템' },
    { id: 'guide', name: '사용 가이드', description: '등급 관리 시스템 사용법' },
    { id: 'features', name: '주요 기능', description: '제공되는 기능들' }
  ];

  const features = [
    {
      title: '5단계 등급 시스템',
      description: '브론즈부터 다이아몬드까지 체계적인 등급 관리',
      icon: '🏆',
      details: [
        '브론즈 (1등급): 기본 서비스 제공',
        '실버 (2등급): 우선 매칭, 기본 혜택',
        '골드 (3등급): 프리미엄 매칭, 추가 혜택',
        '플래티넘 (4등급): VIP 매칭, 특별 혜택',
        '다이아몬드 (5등급): 최고 등급, 모든 혜택'
      ]
    },
    {
      title: '개별 등급 변경',
      description: '계약자별 개별 등급 변경 기능',
      icon: '👤',
      details: [
        '계약자 선택 및 등급 변경',
        '실시간 등급 업데이트',
        '변경 히스토리 자동 기록',
        '성공/실패 알림'
      ]
    },
    {
      title: '일괄 등급 변경',
      description: '여러 계약자의 등급을 한 번에 변경',
      icon: '👥',
      details: [
        '다중 선택 기능',
        '전체 선택/해제',
        '일괄 등급 변경',
        '배치 처리로 효율성 향상'
      ]
    },
    {
      title: '필터링 및 검색',
      description: '계약자 목록 필터링 및 검색 기능',
      icon: '🔍',
      details: [
        '이름 기반 검색',
        '등급별 필터링',
        '실시간 결과 표시',
        '결과 수 표시'
      ]
    },
    {
      title: '통계 대시보드',
      description: '등급별 계약자 통계 제공',
      icon: '📊',
      details: [
        '등급별 계약자 수',
        '전체 통계 요약',
        '시각적 통계 카드',
        '실시간 업데이트'
      ]
    },
    {
      title: '변경 히스토리',
      description: '모든 등급 변경 이력 추적',
      icon: '📝',
      details: [
        '자동 히스토리 기록',
        '변경자 정보 저장',
        '변경 사유 기록',
        '타임스탬프 저장'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            계약자 등급 관리 시스템
          </h1>
          <p className="text-gray-600 mb-4">
            커튼 설치 플랫폼의 계약자 등급을 체계적으로 관리할 수 있는 종합적인 시스템입니다.
          </p>
          
          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'management' && (
          <div>
            <GradeManagement />
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-6">
            {/* 사용법 안내 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">사용법 안내</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">1. 개별 등급 변경</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-700"><strong>1단계:</strong> 계약자 목록에서 변경할 계약자를 찾습니다.</p>
                    <p className="text-sm text-gray-700"><strong>2단계:</strong> 해당 계약자의 "등급 변경" 드롭다운에서 새 등급을 선택합니다.</p>
                    <p className="text-sm text-gray-700"><strong>3단계:</strong> 하단에 나타나는 확인 메시지를 확인하고 "등급 변경" 버튼을 클릭합니다.</p>
                    <p className="text-sm text-gray-700"><strong>4단계:</strong> 성공 메시지가 표시되면 변경이 완료됩니다.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">2. 일괄 등급 변경</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-700"><strong>1단계:</strong> "일괄 변경" 버튼을 클릭하여 일괄 변경 모드를 활성화합니다.</p>
                    <p className="text-sm text-gray-700"><strong>2단계:</strong> 변경할 계약자들의 체크박스를 선택합니다. "전체 선택" 버튼을 사용할 수도 있습니다.</p>
                    <p className="text-sm text-gray-700"><strong>3단계:</strong> 새 등급을 선택합니다.</p>
                    <p className="text-sm text-gray-700"><strong>4단계:</strong> "일괄 변경" 버튼을 클릭하여 모든 선택된 계약자의 등급을 변경합니다.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3. 필터링 및 검색</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-700"><strong>검색:</strong> 계약자 이름으로 검색할 수 있습니다.</p>
                    <p className="text-sm text-gray-700"><strong>등급 필터:</strong> 특정 등급의 계약자만 표시할 수 있습니다.</p>
                    <p className="text-sm text-gray-700"><strong>결과 확인:</strong> 필터링된 결과 수가 하단에 표시됩니다.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">4. 통계 확인</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-700"><strong>등급별 통계:</strong> 상단의 통계 카드에서 등급별 계약자 수를 확인할 수 있습니다.</p>
                    <p className="text-sm text-gray-700"><strong>실시간 업데이트:</strong> 등급 변경 후 "새로고침" 버튼을 클릭하여 통계를 업데이트합니다.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 주의사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ 주의사항</h3>
              <ul className="space-y-2 text-yellow-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>등급 변경은 되돌릴 수 없으므로 신중하게 결정하세요.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>모든 등급 변경은 자동으로 히스토리에 기록됩니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>일괄 변경 시 선택된 모든 계약자의 등급이 동일하게 변경됩니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>등급 변경 후 계약자의 매칭 우선순위와 혜택이 변경될 수 있습니다.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-6">
            {/* 주요 기능 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">주요 기능</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start mb-4">
                      <span className="text-3xl mr-3">{feature.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    
                    <ul className="space-y-1">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="text-sm text-gray-700 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* 기술 사양 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">기술 사양</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">프론트엔드</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• React 18+</li>
                    <li>• Tailwind CSS</li>
                    <li>• Firebase Firestore</li>
                    <li>• 반응형 디자인</li>
                    <li>• 실시간 데이터 동기화</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">백엔드</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Firebase Firestore</li>
                    <li>• 배치 처리</li>
                    <li>• 트랜잭션 지원</li>
                    <li>• 실시간 업데이트</li>
                    <li>• 보안 규칙</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 등급 시스템 상세 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">등급 시스템 상세</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        등급
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        설명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        혜택
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      { grade: 1, name: '브론즈', description: '기본 서비스 제공', benefits: '기본 매칭, 표준 수수료' },
                      { grade: 2, name: '실버', description: '우선 매칭, 기본 혜택', benefits: '우선 매칭, 5% 수수료 할인' },
                      { grade: 3, name: '골드', description: '프리미엄 매칭, 추가 혜택', benefits: '프리미엄 매칭, 10% 수수료 할인' },
                      { grade: 4, name: '플래티넘', description: 'VIP 매칭, 특별 혜택', benefits: 'VIP 매칭, 15% 수수료 할인' },
                      { grade: 5, name: '다이아몬드', description: '최고 등급, 모든 혜택', benefits: '최우선 매칭, 20% 수수료 할인' }
                    ].map((item) => (
                      <tr key={item.grade}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.grade}등급
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
                            item.grade === 1 ? 'bg-gray-500' :
                            item.grade === 2 ? 'bg-blue-500' :
                            item.grade === 3 ? 'bg-yellow-500' :
                            item.grade === 4 ? 'bg-purple-500' : 'bg-yellow-400'
                          }`}>
                            {item.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.benefits}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeManagementExample; 