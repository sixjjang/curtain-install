import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import Navigation from '../components/Navigation';

export default function AdminPage() {
  const router = useRouter();
  const auth = getAuth();
  
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorkOrders: 0,
    pendingWorkOrders: 0,
    completedWorkOrders: 0,
    customers: 0,
    workers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 인증 상태 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 사용자 정보 가져오기
          const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            if (userData.userType !== 'admin') {
              alert('관리자만 접근할 수 있습니다.');
              router.push('/login');
              return;
            }
            setUser({ ...user, ...userData });
            
            // 통계 데이터 가져오기
            await loadStats();
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
          setError('사용자 정보를 불러오는데 실패했습니다.');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);

  const loadStats = async () => {
    try {
      // 사용자 통계
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      let customers = 0;
      let workers = 0;
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.userType === 'customer') customers++;
        if (userData.userType === 'worker') workers++;
      });

      // 작업 통계
      const workOrdersQuery = query(collection(db, 'workOrders'));
      const workOrdersSnapshot = await getDocs(workOrdersQuery);
      
      let pending = 0;
      let completed = 0;
      workOrdersSnapshot.forEach((doc) => {
        const workOrderData = doc.data();
        if (workOrderData.status === 'pending') pending++;
        if (workOrderData.status === 'completed') completed++;
      });

      setStats({
        totalUsers: usersSnapshot.size,
        totalWorkOrders: workOrdersSnapshot.size,
        pendingWorkOrders: pending,
        completedWorkOrders: completed,
        customers,
        workers
      });
    } catch (error) {
      console.error('통계 데이터 조회 오류:', error);
      setError('통계 데이터를 불러오는데 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="관리자 대시보드" />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-gray-600 mt-1">안녕하세요, {user.name}님!</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">관리자 권한</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 사용자</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 작업</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalWorkOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">대기 작업</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingWorkOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">완료 작업</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedWorkOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 상세 통계 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">사용자 분포</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">시공 의뢰인</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.customers}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">시공기사</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.workers}명</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">작업 상태</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">대기중</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.pendingWorkOrders}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">완료</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.completedWorkOrders}건</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 관리 기능 */}
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">관리 기능</h2>
            <p className="text-sm text-gray-600 mt-1">시스템 관리를 위한 다양한 기능을 이용하세요</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/admin/users')}
                className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-left"
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <div>
                    <h3 className="font-medium">사용자 관리</h3>
                    <p className="text-sm opacity-90">사용자 목록 및 권한 관리</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/workorders')}
                className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left"
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <h3 className="font-medium">작업 관리</h3>
                    <p className="text-sm opacity-90">작업 목록 및 상태 관리</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/reports')}
                className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-left"
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <h3 className="font-medium">통계 리포트</h3>
                    <p className="text-sm opacity-90">시스템 통계 및 분석</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/settings')}
                className="bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <h3 className="font-medium">시스템 설정</h3>
                    <p className="text-sm opacity-90">시스템 환경 설정</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 