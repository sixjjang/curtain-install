import { useState } from "react";
import NotificationLogViewer from "./NotificationLogViewer";
import NotificationStats from "./NotificationStats";

const NotificationManagement = () => {
  const [activeTab, setActiveTab] = useState("stats");

  const tabs = [
    { id: "stats", label: "통계 대시보드", icon: "📊" },
    { id: "logs", label: "로그 조회", icon: "📋" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">알림 관리</h1>
          <p className="mt-2 text-gray-600">
            푸시 알림과 이메일 알림의 발송 현황을 모니터링하고 관리합니다.
          </p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="max-w-7xl mx-auto">
        {activeTab === "stats" && <NotificationStats />}
        {activeTab === "logs" && <NotificationLogViewer />}
      </div>

      {/* 정보 카드 */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-xl">📧</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">이메일 알림</h3>
                <p className="text-sm text-gray-600">
                  SendGrid를 통한 HTML 이메일 발송
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-xl">📱</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">푸시 알림</h3>
                <p className="text-sm text-gray-600">
                  FCM을 통한 실시간 푸시 알림
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-xl">📊</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">실시간 모니터링</h3>
                <p className="text-sm text-gray-600">
                  상세한 로깅과 성능 분석
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 기능 설명 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">주요 기능</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">통계 대시보드</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 실시간 성공률 및 오류율 모니터링</li>
                <li>• 알림 타입별 및 카테고리별 통계</li>
                <li>• 시간 범위별 필터링</li>
                <li>• 주요 오류 분석 및 권장사항</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">로그 조회</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 상세한 알림 발송 로그</li>
                <li>• 다중 필터링 (광고주, 타입, 상태, 카테고리)</li>
                <li>• 실시간 업데이트</li>
                <li>• 페이지네이션 및 검색</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 알림 타입 설명 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">알림 타입</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">📧</span>
                <h4 className="font-medium">이메일</h4>
              </div>
              <p className="text-sm text-gray-600">
                HTML 템플릿 기반 이메일 발송
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">📱</span>
                <h4 className="font-medium">푸시 알림</h4>
              </div>
              <p className="text-sm text-gray-600">
                FCM을 통한 실시간 푸시 알림
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">🔄</span>
                <h4 className="font-medium">자동 재시도</h4>
              </div>
              <p className="text-sm text-gray-600">
                실패 시 자동 재시도 로직
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">📊</span>
                <h4 className="font-medium">상세 로깅</h4>
              </div>
              <p className="text-sm text-gray-600">
                모든 알림의 상세한 로그 저장
              </p>
            </div>
          </div>
        </div>

        {/* 상태 설명 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">알림 상태</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-green-600 bg-green-100 mr-3">
                성공
              </span>
              <span className="text-sm text-gray-600">알림이 성공적으로 발송됨</span>
            </div>
            <div className="flex items-center">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-red-600 bg-red-100 mr-3">
                실패
              </span>
              <span className="text-sm text-gray-600">알림 발송에 실패함</span>
            </div>
            <div className="flex items-center">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-yellow-600 bg-yellow-100 mr-3">
                대기 중
              </span>
              <span className="text-sm text-gray-600">알림 발송 대기 중</span>
            </div>
            <div className="flex items-center">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-blue-600 bg-blue-100 mr-3">
                재시도
              </span>
              <span className="text-sm text-gray-600">알림 재시도 중</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement; 