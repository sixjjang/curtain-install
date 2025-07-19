import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import Navigation from '../../components/Navigation';

export default function PendingApproval() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleInfo = () => {
    const role = user.role || user.primaryRole;
    switch (role) {
      case 'seller':
        return {
          title: '판매자 승인 대기',
          description: '판매자 승인을 기다리고 있습니다',
          icon: (
            <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          color: 'blue'
        };
      case 'contractor':
        return {
          title: '시공자 승인 대기',
          description: '시공자 승인을 기다리고 있습니다',
          icon: (
            <svg className="w-16 h-16 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          ),
          color: 'orange'
        };
      default:
        return {
          title: '승인 대기',
          description: '승인을 기다리고 있습니다',
          icon: (
            <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'gray'
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="승인 대기" />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <div className={`w-24 h-24 bg-${roleInfo.color}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
              {roleInfo.icon}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{roleInfo.title}</h1>
            <p className="text-gray-600 mb-8">{roleInfo.description}</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">승인 절차 안내</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>• 관리자가 입력하신 정보를 검토하고 있습니다</p>
                    <p>• 승인 완료 시 이메일로 알려드립니다</p>
                    <p>• 승인 전까지는 제한된 기능만 이용 가능합니다</p>
                    <p>• 승인까지 보통 1-2일 정도 소요됩니다</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                대시보드로 이동
              </button>
              
              <button
                onClick={() => router.push('/profile')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                프로필 확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 