import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Navigation from '../../components/Navigation';
import ContractorScheduler from '../../components/ContractorScheduler';

export default function ContractorSchedulerPage() {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="시공 스케줄" />
        <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg">사용자 정보를 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="시공 스케줄" />
        <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">시공 스케줄을 확인하려면 로그인해주세요.</p>
            <a
              href="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              로그인하기
            </a>
          </div>
        </div>
      </div>
    );
  }

      if (userData?.role !== 'contractor') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="시공 스케줄" />
        <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h2>
            <p className="text-gray-600 mb-6">시공자만 스케줄을 확인할 수 있습니다.</p>
            <a
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              대시보드로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="시공 스케줄" />
      <div className="pt-24 pb-8">
        <ContractorScheduler />
      </div>
    </div>
  );
} 