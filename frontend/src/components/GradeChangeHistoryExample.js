import React, { useState } from 'react';
import GradeChangeHistory from './GradeChangeHistory';

const GradeChangeHistoryExample = () => {
  const [activeTab, setActiveTab] = useState('history');
  const [showGuide, setShowGuide] = useState(false);

  const tabs = [
    { id: 'history', name: '등급 변경 히스토리', description: '계약자 등급 변경 이력 조회' },
    { id: 'guide', name: '사용 가이드', description: '히스토리 조회 시스템 사용법' },
    { id: 'features', name: '주요 기능', description: '제공되는 기능들' }
  ];

  const features = [
    {
      title: '실시간 히스토리 조회',
      description: 'Firestore에서 실시간으로 등급 변경 이력을 조회',
      icon: '📊',
      details: [
        '최신 변경 이력부터 표시',
        '실시간 데이터 동기화',
        '자동 새로고침 기능',
        '로딩 상태 표시'
      ]
    },
    {
      title: '고급 필터링',
      description: '다양한 조건으로 히스토리 필터링',
      icon: '🔍',
      details: [
        '계약자 이름 검색',
        '등급별 필터링',
        '기간별 필터링 (오늘, 주, 월, 분기, 년)',
        '필터 초기화 기능'
      ]
    },
    {
      title: '통계 대시보드',
      description: '등급 변경 통계를 한눈에 확인',
      icon: '📈',
      details: [
        '총 변경 건수',
        '등급 상승/하락 통계',
        '신규 등급 부여 수',
        '상승률 계산'
      ]
    },
    {
      title: '상세 정보 모달',
      description: '각 변경 이력의 상세 정보 확인',
      icon: '📋',
      details: [
        '변경 사유 확인',
        '추가 메모 표시',
        '변경자 정보',
        '정확한 변경 시간'
      ]
    },
    {
      title: '페이지네이션',
      description: '대용량 데이터를 효율적으로 로드',
      icon: '📄',
      details: [
        '무한 스크롤 방식',
        '20건씩 로드',
        '더보기 버튼',
        '로딩 상태 표시'
      ]
    },
    {
      title: '변경 유형 분류',
      description: '등급 변경 유형을 자동으로 분류',
      icon: '🏷️',
      details: [
        '등급 상승 (초록색)',
        '등급 하락 (빨간색)',
        '신규 등급 (파란색)',
        '등급 유지 (회색)'
      ]
    }
  ];

  const sampleHistoryData = [
    {
      id: 'history_001',
      contractorId: 'contractor_001',
      contractorName: '김철수',
      previousGrade: 3,
      newGrade: 4,
      previousGradeName: '골드',
      newGradeName: '플래티넘',
      changedAt: new Date('2024-01-15T10:30:00'),
      changedBy: 'admin',
      reason: '우수한 성과로 인한 등급 상승',
      notes: '고객 만족도 4.8점, 완료 작업 50건 달성'
    },
    {
      id: 'history_002',
      contractorId: 'contractor_002',
      contractorName: '이영희',
      previousGrade: null,
      newGrade: 2,
      previousGradeName: '없음',
      newGradeName: '실버',
      changedAt: new Date('2024-01-14T14:20:00'),
      changedBy: 'admin',
      reason: '신규 계약자 등급 부여',
      notes: '첫 작업 완료 후 기본 등급 부여'
    },
    {
      id: 'history_003',
      contractorId: 'contractor_003',
      contractorName: '박민수',
      previousGrade: 4,
      newGrade: 3,
      previousGradeName: '플래티넘',
      newGradeName: '골드',
      changedAt: new Date('2024-01-13T09:15:00'),
      changedBy: 'admin',
      reason: '고객 불만족으로 인한 등급 하락',
      notes: '고객 민원 3건 발생, 품질 개선 필요'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            등급 변경 히스토리 시스템
          </h1>
          <p className="text-gray-600 mb-4">
            계약자의 등급 변경 이력을 체계적으로 관리하고 조회할 수 있는 종합적인 시스템입니다.
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
        {activeTab === 'history' && (
          <div>
            <GradeChangeHistory />
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-6">
            {/* 사용법 안내 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">사용법 안내</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">1. 기본 조회</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-700"><strong>자동 로드:</strong> 페이지 접속 시 최신 20건의 등급 변경 이력이 자동으로 로드됩니다.</p>
                    <p className="text-sm text-gray-700"><strong>정렬:</strong> 변경 일시 기준으로 최신순으로 정렬됩니다.</p>
                    <p className="text-sm text-gray-700"><strong>통계:</strong> 상단에 전체 통계가 카드 형태로 표시됩니다.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">2. 필터링 사용</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-700"><strong>계약자 검색:</strong> 계약자 이름을 입력하여 특정 계약자의 변경 이력만 조회할 수 있습니다.</p>
                    <p className="text-sm text-gray-700"><strong>등급 필터:</strong> 특정 등급으로 변경된 이력만 필터링할 수 있습니다.</p>
                    <p className="text-sm text-gray-700"><strong>기간 필터:</strong> 오늘, 이번 주, 이번 달, 이번 분기, 올해 등 기간별로 필터링할 수 있습니다.</p>
                    <p className="text-sm text-gray-700"><strong>필터 초기화:</strong> 모든 필터를 한 번에 초기화할 수 있습니다.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3. 상세 정보 확인</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-700"><strong>상세보기:</strong> 각 행의 "상세보기" 버튼을 클릭하면 모달 창이 열립니다.</p>
                    <p className="text-sm text-gray-700"><strong>변경 사유:</strong> 등급 변경의 구체적인 사유를 확인할 수 있습니다.</p>
                    <p className="text-sm text-gray-700"><strong>추가 메모:</strong> 변경 시 추가된 메모나 참고사항을 확인할 수 있습니다.</p>
                    <p className="text-sm text-gray-700"><strong>변경자 정보:</strong> 등급을 변경한 관리자 정보를 확인할 수 있습니다.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">4. 더 많은 데이터 로드</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-700"><strong>더보기:</strong> 하단의 "더 보기" 버튼을 클릭하면 추가 20건을 로드합니다.</p>
                    <p className="text-sm text-gray-700"><strong>무한 스크롤:</strong> 모든 데이터를 로드할 때까지 계속해서 더 많은 데이터를 불러올 수 있습니다.</p>
                    <p className="text-sm text-gray-700"><strong>로딩 상태:</strong> 데이터 로딩 중에는 버튼이 비활성화되고 "로딩 중..." 텍스트가 표시됩니다.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 샘플 데이터 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">샘플 데이터 구조</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">필드</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예시</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">contractorId</td>
                      <td className="px-6 py-4 text-sm text-gray-700">계약자 고유 ID</td>
                      <td className="px-6 py-4 text-sm text-gray-700">contractor_001</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">contractorName</td>
                      <td className="px-6 py-4 text-sm text-gray-700">계약자 이름</td>
                      <td className="px-6 py-4 text-sm text-gray-700">김철수</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">previousGrade</td>
                      <td className="px-6 py-4 text-sm text-gray-700">이전 등급 (숫자)</td>
                      <td className="px-6 py-4 text-sm text-gray-700">3</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">newGrade</td>
                      <td className="px-6 py-4 text-sm text-gray-700">새 등급 (숫자)</td>
                      <td className="px-6 py-4 text-sm text-gray-700">4</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">changedAt</td>
                      <td className="px-6 py-4 text-sm text-gray-700">변경 일시</td>
                      <td className="px-6 py-4 text-sm text-gray-700">2024-01-15 10:30:00</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">changedBy</td>
                      <td className="px-6 py-4 text-sm text-gray-700">변경한 관리자</td>
                      <td className="px-6 py-4 text-sm text-gray-700">admin</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">reason</td>
                      <td className="px-6 py-4 text-sm text-gray-700">변경 사유</td>
                      <td className="px-6 py-4 text-sm text-gray-700">우수한 성과로 인한 등급 상승</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">notes</td>
                      <td className="px-6 py-4 text-sm text-gray-700">추가 메모</td>
                      <td className="px-6 py-4 text-sm text-gray-700">고객 만족도 4.8점, 완료 작업 50건 달성</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 주의사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ 주의사항</h3>
              <ul className="space-y-2 text-yellow-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>등급 변경 히스토리는 되돌릴 수 없으므로 신중하게 관리해야 합니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>대량의 데이터를 로드할 때는 네트워크 상태를 확인하세요.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>필터링 조건이 많을수록 조회 속도가 느려질 수 있습니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>히스토리 데이터는 자동으로 백업되지만, 정기적인 데이터 백업을 권장합니다.</span>
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
                    <li>• 무한 스크롤</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">백엔드</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Firebase Firestore</li>
                    <li>• 실시간 쿼리</li>
                    <li>• 복합 인덱스</li>
                    <li>• 페이지네이션</li>
                    <li>• 필터링 최적화</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 변경 유형 설명 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">변경 유형 설명</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">등급 상승</div>
                  <p className="text-sm text-green-800">새 등급이 이전 등급보다 높은 경우</p>
                  <p className="text-xs text-green-600 mt-2">예: 브론즈 → 실버</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 mb-2">등급 하락</div>
                  <p className="text-sm text-red-800">새 등급이 이전 등급보다 낮은 경우</p>
                  <p className="text-xs text-red-600 mt-2">예: 골드 → 실버</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">신규 등급</div>
                  <p className="text-sm text-blue-800">이전에 등급이 없던 계약자</p>
                  <p className="text-xs text-blue-600 mt-2">예: 등급 없음 → 브론즈</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600 mb-2">등급 유지</div>
                  <p className="text-sm text-gray-800">등급이 변경되지 않은 경우</p>
                  <p className="text-xs text-gray-600 mt-2">예: 골드 → 골드</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeChangeHistoryExample; 