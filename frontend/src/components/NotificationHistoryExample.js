import React from 'react';
import LevelChangeNotificationHistory from './LevelChangeNotificationHistory';

const NotificationHistoryExample = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 헤더 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                커튼 설치 관리 시스템
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">관리자</span>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 사이드바 */}
      <div className="flex">
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              <a href="#" className="block px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
                대시보드
              </a>
              <a href="#" className="block px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
                등급 변경 히스토리
              </a>
              <a href="#" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                계약자 관리
              </a>
              <a href="#" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                프로젝트 관리
              </a>
              <a href="#" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                알림 관리
              </a>
              <a href="#" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                통계
              </a>
            </nav>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1">
          <LevelChangeNotificationHistory />
        </div>
      </div>
    </div>
  );
};

export default NotificationHistoryExample; 