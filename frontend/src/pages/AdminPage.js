import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import useAdminCheck from '../hooks/useAdminCheck';

// AdminDashboard를 동적으로 로드하여 클라이언트에서만 실행되도록 함
const AdminDashboard = dynamic(() => import('../components/AdminDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">관리자 대시보드를 로드 중...</p>
      </div>
    </div>
  )
});

const AdminPage = () => {
  const { isAdmin, loading } = useAdminCheck();

  useEffect(() => {
    if (!loading && !isAdmin) {
      // 비관리자는 로그인 페이지로 리다이렉션
      window.location.href = '/login';
    }
  }, [isAdmin, loading]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">접근 권한을 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
};

// 이 페이지는 클라이언트에서만 렌더링됨
export default AdminPage; 