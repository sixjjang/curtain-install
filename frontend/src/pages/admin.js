import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { clearAllFirestoreData, clearUserData, clearWorkOrderData, clearFirebaseAuthUsers } from '../utils/clearAllData';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Navigation from '../components/Navigation';
import { withRoleProtection } from '../components/withRoleProtection';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import AdminCollaborationManager from '../components/admin/AdminCollaborationManager';
import ApprovalManager from '../components/admin/ApprovalManager';

function AdminPage() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalContractors: 0,
    totalWorkOrders: 0,
    pendingWorkOrders: 0,
    completedWorkOrders: 0,
    cancelledWorkOrders: 0,
    totalRevenue: 0,
    pendingCancellations: 0
  });

  useEffect(() => {
    checkAdminAuth();
    loadAdminStats();
  }, []);

  const checkAdminAuth = () => {
    try {
      const adminAuth = sessionStorage.getItem('adminAuthenticated');
      const loginTime = sessionStorage.getItem('adminLoginTime');
      
      if (adminAuth === 'true' && loginTime) {
        const now = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const sessionDuration = 24 * 60 * 60 * 1000;
        
        if (now - loginTimestamp < sessionDuration) {
          setIsAdminAuthenticated(true);
        } else {
          sessionStorage.removeItem('adminAuthenticated');
          sessionStorage.removeItem('adminLoginTime');
          router.push('/admin-login');
        }
      } else {
        router.push('/admin-login');
      }
    } catch (error) {
      console.error('Admin auth check error:', error);
      router.push('/admin-login');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      // 사용자 통계
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const sellersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'seller')));
      const contractorsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'contractor')));

      // 작업 주문 통계
      const workOrdersSnapshot = await getDocs(collection(db, 'workOrders'));
      const pendingWorkOrdersSnapshot = await getDocs(query(collection(db, 'workOrders'), where('status', '==', 'pending')));
      const completedWorkOrdersSnapshot = await getDocs(query(collection(db, 'workOrders'), where('status', '==', 'completed')));
      const cancelledWorkOrdersSnapshot = await getDocs(query(collection(db, 'workOrders'), where('status', '==', 'cancelled')));

      // 취소 요청 통계
      const cancellationRequestsSnapshot = await getDocs(query(collection(db, 'cancellationRequests'), where('status', '==', 'pending')));

      // 수익 계산
      const completedOrders = completedWorkOrdersSnapshot.docs;
      const totalRevenue = completedOrders.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.totalAmount || 0);
      }, 0);

      setStats({
        totalUsers: usersSnapshot.size,
        totalSellers: sellersSnapshot.size,
        totalContractors: contractorsSnapshot.size,
        totalWorkOrders: workOrdersSnapshot.size,
        pendingWorkOrders: pendingWorkOrdersSnapshot.size,
        completedWorkOrders: completedWorkOrdersSnapshot.size,
        cancelledWorkOrders: cancelledWorkOrdersSnapshot.size,
        totalRevenue: totalRevenue,
        pendingCancellations: cancellationRequestsSnapshot.size
      });
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminLoginTime');
    router.push('/admin-login');
  };

  const handleReset = async () => {
    setIsResetting(true);
    setResetMessage('데이터 초기화 중...');

    try {
      const functions = getFunctions();
      const clearAllData = httpsCallable(functions, 'clearAllFirestoreData');
      const clearAuthUsers = httpsCallable(functions, 'clearFirebaseAuthUsers');

      await clearAllData();
      await clearAuthUsers();

      setResetMessage('데이터 초기화가 완료되었습니다.');
      setTimeout(() => {
        setResetMessage('');
        setIsResetting(false);
      }, 3000);
    } catch (error) {
      console.error('Reset error:', error);
      setResetMessage('데이터 초기화 중 오류가 발생했습니다.');
      setIsResetting(false);
    }
  };

  const tabs = [
    { id: 'dashboard', name: '대시보드', icon: '📊' },
    { id: 'workorders', name: '시공요청 관리', icon: '📋' },
    { id: 'collaborations', name: '협업요청 관리', icon: '🤝' },
    { id: 'contractors', name: '시공자 관리', icon: '👷' },
    { id: 'sellers', name: '판매자 관리', icon: '🛍️' },
    { id: 'cancellations', name: '취소 요청 관리', icon: '❌' },
    { id: 'approvals', name: '사용자 승인', icon: '✅' },
    { id: 'statistics', name: '통계', icon: '📈' },
    { id: 'settings', name: '시스템 설정', icon: '⚙️' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 사용자</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">🛍️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">판매자</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSellers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-2xl">👷</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">시공자</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalContractors}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 수익</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()}원</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 작업 주문 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 시공요청</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalWorkOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">대기 중</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingWorkOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">완료</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedWorkOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-2xl">❌</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">취소</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.cancelledWorkOrders}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📋</span>
                    <div>
                      <p className="font-medium">새로운 시공요청 등록</p>
                      <p className="text-sm text-gray-600">판매자: 홍길동</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">2분 전</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">✅</span>
                    <div>
                      <p className="font-medium">시공 완료</p>
                      <p className="text-sm text-gray-600">시공자: 김철수</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">15분 전</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">❌</span>
                    <div>
                      <p className="font-medium">취소 요청</p>
                      <p className="text-sm text-gray-600">시공자: 박영희</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">1시간 전</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'workorders':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">시공요청 관리</h2>
              <button
                onClick={() => router.push('/admin/workorders')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                전체 보기
              </button>
            </div>
            <p className="text-gray-600">시공요청 목록을 확인하고 관리할 수 있습니다.</p>
          </div>
        );

      case 'contractors':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">시공자 관리</h2>
              <button
                onClick={() => router.push('/admin/contractors')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                전체 보기
              </button>
            </div>
            <p className="text-gray-600">시공자들의 업무 현황과 스케줄을 관리할 수 있습니다.</p>
          </div>
        );

      case 'collaborations':
        return <AdminCollaborationManager />;

      case 'sellers':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">판매자 관리</h2>
              <button
                onClick={() => router.push('/admin/sellers')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                전체 보기
              </button>
            </div>
            <p className="text-gray-600">판매자들의 시공요청 현황을 확인하고 관리할 수 있습니다.</p>
          </div>
        );

      case 'cancellations':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">취소 요청 관리</h2>
              <button
                onClick={() => router.push('/admin/cancellations')}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                전체 보기 ({stats.pendingCancellations})
              </button>
            </div>
            <p className="text-gray-600">시공자의 취소 요청을 승인하고 관리할 수 있습니다.</p>
          </div>
        );

      case 'approvals':
        return <ApprovalManager />;

      case 'statistics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">통계</h2>
            <p className="text-gray-600">상세한 통계 정보를 확인할 수 있습니다.</p>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">시스템 설정</h2>
            
            {/* 취소 시간 설정 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">취소 시간 설정</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">일반 시공요청 취소 제한 시간</p>
                    <p className="text-sm text-gray-600">시공자 수락 후 취소 가능한 시간</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue="60"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <span className="text-gray-600">분</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">긴급 시공요청 취소 제한 시간</p>
                    <p className="text-sm text-gray-600">긴급 시공요청의 취소 가능한 시간</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <span className="text-gray-600">분</span>
                  </div>
                </div>

                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  설정 저장
                </button>
              </div>
            </div>

            {/* 데이터 초기화 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">데이터 관리</h3>
              <div className="space-y-4">
                <p className="text-gray-600">모든 데이터를 초기화합니다. 이 작업은 되돌릴 수 없습니다.</p>
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                >
                  {isResetting ? '초기화 중...' : '모든 데이터 초기화'}
                </button>
                {resetMessage && (
                  <p className="text-sm text-gray-600">{resetMessage}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <div>선택된 탭을 찾을 수 없습니다.</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="관리자 대시보드" />
      
      <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-gray-600 mt-2">판매자와 시공자의 업무를 관리하고 통계를 확인하세요.</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// 역할별 페이지 보호 적용 (관리자만 접근 가능)
export default withRoleProtection(AdminPage, ['admin']); 