import { useState } from "react";
import SellerSettlementDashboard from "./SellerSettlementDashboard";

interface Tab {
  id: string;
  name: string;
  icon: string;
}

export default function SellerSettlementDashboardExample() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const tabs: Tab[] = [
    { id: 'dashboard', name: '정산 대시보드', icon: '📊' },
    { id: 'settings', name: '설정', icon: '⚙️' },
    { id: 'help', name: '도움말', icon: '❓' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">판매자 정산 관리</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                내보내기
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                새로고침
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6">
        {activeTab === 'dashboard' && (
          <div>
            <SellerSettlementDashboard />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">정산 설정</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  자동 정산 알림
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoSettlement"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoSettlement" className="ml-2 text-sm text-gray-700">
                    매월 말일 자동 정산 알림 받기
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  정산 통지 이메일
                </label>
                <input
                  type="email"
                  placeholder="정산@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기본 통화
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="KRW">한국 원화 (₩)</option>
                  <option value="USD">미국 달러 ($)</option>
                  <option value="EUR">유럽 유로 (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  세금 계산 방식
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="taxIncluded"
                      name="taxMethod"
                      value="included"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="taxIncluded" className="ml-2 text-sm text-gray-700">
                      부가세 포함 (VAT 포함)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="taxExcluded"
                      name="taxMethod"
                      value="excluded"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="taxExcluded" className="ml-2 text-sm text-gray-700">
                      부가세 별도 (VAT 별도)
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  설정 저장
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">도움말</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">정산 대시보드 사용법</h3>
                <div className="text-gray-600 space-y-2">
                  <p>• <strong>총 매출:</strong> 결제가 완료된 모든 작업의 총 금액</p>
                  <p>• <strong>기사 지급액:</strong> 작업자에게 지급되는 금액의 총합</p>
                  <p>• <strong>플랫폼 수수료:</strong> 플랫폼에서 수수하는 수수료의 총합</p>
                  <p>• <strong>긴급 수수료:</strong> 긴급 작업에 대한 추가 수수료</p>
                  <p>• <strong>총 작업 건수:</strong> 등록된 모든 작업의 개수</p>
                  <p>• <strong>평균 주문 금액:</strong> 작업당 평균 매출액</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">기간 필터 사용법</h3>
                <div className="text-gray-600 space-y-2">
                  <p>• <strong>전체:</strong> 모든 기간의 데이터 표시</p>
                  <p>• <strong>이번 달:</strong> 현재 월의 데이터만 표시</p>
                  <p>• <strong>지난 달:</strong> 이전 월의 데이터만 표시</p>
                  <p>• <strong>올해:</strong> 현재 연도의 데이터만 표시</p>
                  <p>• <strong>사용자 지정:</strong> 특정 년/월의 데이터 표시</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">상태 설명</h3>
                <div className="text-gray-600 space-y-2">
                  <p>• <strong>결제완료:</strong> 고객이 결제를 완료한 상태</p>
                  <p>• <strong>결제대기:</strong> 결제가 진행 중인 상태</p>
                  <p>• <strong>결제실패:</strong> 결제가 실패한 상태</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">자주 묻는 질문</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Q: 정산은 언제 이루어지나요?</h4>
                    <p className="text-gray-600 mt-1">A: 매월 말일 기준으로 정산이 이루어지며, 다음 달 5일까지 정산금이 지급됩니다.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Q: 플랫폼 수수료는 어떻게 계산되나요?</h4>
                    <p className="text-gray-600 mt-1">A: 기본 작업 금액의 10%가 플랫폼 수수료로 적용됩니다.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Q: 긴급 수수료는 언제 적용되나요?</h4>
                    <p className="text-gray-600 mt-1">A: 24시간 이내 완료가 필요한 긴급 작업에 대해 추가 수수료가 적용됩니다.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  추가 문의사항이 있으시면 고객센터로 연락해 주세요.
                </p>
                <button className="mt-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  고객센터 문의
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 