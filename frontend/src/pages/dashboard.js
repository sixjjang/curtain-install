import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import Navigation from '../components/Navigation';
import InsteamLogo from '../components/InsteamLogo';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { 
  getCurrentLocation, 
  geocodeAddress, 
  sortWorkOrdersByDistance,
  getDistanceColor,
  getDistanceIcon
} from '../utils/distanceCalculator';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [workOrders, setWorkOrders] = useState([]);
  const [showWorkOrders, setShowWorkOrders] = useState(false);
  const [contractorLocation, setContractorLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('pending'); // pending, granted, denied

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // 사용자가 로그인되어 있으면 프로필 확인
    if (user && !loading) {
      checkUserProfile();
      loadDashboardData();
      if (user.role === 'contractor' || user.primaryRole === 'contractor') {
        loadWorkOrders();
        requestLocationPermission();
      }
    }
  }, [user, loading, router]);

  const checkUserProfile = async () => {
    try {
      // Firestore에서 사용자 프로필 확인
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/firebase');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUserProfile(profileData);
        setApprovalStatus(profileData.approvalStatus || 'pending');
      } else {
        // 프로필이 없으면 기본값 설정
        setUserProfile(null);
        setApprovalStatus('pending');
      }
    } catch (error) {
      console.error('프로필 확인 실패:', error);
      setApprovalStatus('pending');
    }
  };

  const loadDashboardData = async () => {
    try {
      // 역할별 대시보드 데이터 로드
      const mockStats = getMockStats(user?.role);
      const mockActivities = getMockActivities(user?.role);
      
      setStats(mockStats);
      setRecentActivities(mockActivities);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 위치 권한 요청 및 현재 위치 가져오기
  const requestLocationPermission = async () => {
    try {
      setLocationPermission('pending');
      
      // 현재 위치 가져오기
      const location = await getCurrentLocation();
      setContractorLocation(location);
      setLocationPermission('granted');
      
      console.log('현재 위치:', location);
    } catch (error) {
      console.error('위치 권한 요청 실패:', error);
      setLocationPermission('denied');
      
      // 위치 정보가 없어도 시공요청은 로드
      loadWorkOrders();
    }
  };

  // 시공요청 목록 로드 (거리 정보 포함)
  const loadWorkOrders = async () => {
    try {
      const workOrdersRef = collection(db, 'workOrders');
      const q = query(
        workOrdersRef,
        where('status', '==', '등록'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      
      for (const doc of querySnapshot.docs) {
        const workOrder = {
          id: doc.id,
          ...doc.data()
        };
        
        // 주소를 좌표로 변환
        if (workOrder.location) {
          try {
            const coordinates = await geocodeAddress(workOrder.location);
            if (coordinates) {
              workOrder.locationCoordinates = coordinates;
            }
          } catch (error) {
            console.error('주소 좌표 변환 실패:', error);
          }
        }
        
        orders.push(workOrder);
      }
      
      // 거리 정보가 있으면 거리순으로 정렬
      if (contractorLocation) {
        const sortedOrders = sortWorkOrdersByDistance(orders, contractorLocation);
        setWorkOrders(sortedOrders);
      } else {
        setWorkOrders(orders);
      }
      
    } catch (error) {
      console.error('시공요청 목록 로드 실패:', error);
    }
  };

  // 출근/퇴근 토글
  const toggleDutyStatus = () => {
    setIsOnDuty(!isOnDuty);
    if (!isOnDuty) {
      setShowWorkOrders(true);
    } else {
      setShowWorkOrders(false);
    }
  };

  const getMockStats = (role) => {
    switch (role) {
      case 'seller':
        return {
          totalOrders: 156,
          completedOrders: 142,
          pendingOrders: 14,
          totalRevenue: 28400000,
          monthlyRevenue: 3200000,
          customerSatisfaction: 4.8
        };
      case 'contractor':
        return {
          totalJobs: 89,
          completedJobs: 76,
          pendingJobs: 13,
          totalEarnings: 15600000,
          monthlyEarnings: 2100000,
          averageRating: 4.9
        };
      case 'admin':
        return {
          totalUsers: 1247,
          activeUsers: 892,
          totalOrders: 2341,
          totalRevenue: 156000000,
          pendingApprovals: 23,
          systemHealth: 'Excellent'
        };
      default:
        return {};
    }
  };

  const getMockActivities = (role) => {
    switch (role) {
      case 'seller':
        return [
          { id: 1, type: 'order', title: '새로운 커튼 설치 주문', time: '2시간 전', status: 'pending' },
          { id: 2, type: 'payment', title: '결제 완료', time: '4시간 전', status: 'completed' },
          { id: 3, type: 'review', title: '고객 리뷰 등록', time: '1일 전', status: 'completed' },
          { id: 4, type: 'order', title: '블라인드 설치 완료', time: '2일 전', status: 'completed' }
        ];
      case 'contractor':
        return [
          { id: 1, type: 'job', title: '새로운 시공 작업 배정', time: '1시간 전', status: 'pending' },
          { id: 2, type: 'payment', title: '시공료 지급 완료', time: '3시간 전', status: 'completed' },
          { id: 3, type: 'review', title: '고객 평가 등록', time: '1일 전', status: 'completed' },
          { id: 4, type: 'collaboration', title: '협업 작업 시작', time: '2일 전', status: 'in-progress' }
        ];
      case 'admin':
        return [
          { id: 1, type: 'approval', title: '새로운 사용자 승인 요청', time: '30분 전', status: 'pending' },
          { id: 2, type: 'system', title: '시스템 업데이트 완료', time: '2시간 전', status: 'completed' },
          { id: 3, type: 'user', title: '새로운 판매자 등록', time: '4시간 전', status: 'completed' },
          { id: 4, type: 'payment', title: '정산 처리 완료', time: '1일 전', status: 'completed' }
        ];
      default:
        return [];
    }
  };

  const getRoleTheme = () => {
    if (!user) return 'theme-default';
    switch (user.role) {
      case 'seller': return 'theme-seller';
      case 'contractor': return 'theme-contractor';
      case 'admin': return 'theme-admin';
      default: return 'theme-default';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'seller': return '판매자';
      case 'contractor': return '시공자';
      case 'admin': return '관리자';
      default: return '사용자';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'order': return '📋';
      case 'payment': return '💰';
      case 'review': return '⭐';
      case 'job': return '🔧';
      case 'collaboration': return '🤝';
      case 'approval': return '✅';
      case 'system': return '⚙️';
      case 'user': return '👤';
      default: return '📝';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleProfileSetup = () => {
    const userRole = user.role || user.primaryRole;
    if (userRole === 'seller') {
      router.push('/profile-setup/seller');
    } else if (userRole === 'contractor') {
      router.push('/profile-setup/contractor');
    } else {
      router.push('/profile-setup');
    }
  };

  const handlePendingStatus = () => {
    router.push('/profile-setup/pending');
  };

  // 시공요청 상세 보기
  const handleWorkOrderDetail = (workOrderId) => {
    router.push(`/workorder/${workOrderId}`);
  };

  if (loading || isLoading) {
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

  // 승인 상태에 따른 안내 메시지
  const getStatusMessage = () => {
    const userRole = user.role || user.primaryRole;
    
    if (approvalStatus === 'pending') {
      return {
        title: '승인 대기 중',
        message: '관리자 승인을 기다리고 있습니다. 승인 완료 시 이메일로 알려드립니다.',
        buttonText: '승인 상태 확인',
        buttonAction: handlePendingStatus,
        color: 'yellow'
      };
    } else if (!userProfile?.profileCompleted && (userRole === 'seller' || userRole === 'contractor')) {
      return {
        title: '프로필 설정 필요',
        message: `${getRoleDisplayName(userRole)} 활동을 위해 추가 정보를 입력해주세요.`,
        buttonText: '회원정보 입력하기',
        buttonAction: handleProfileSetup,
        color: 'blue'
      };
    }
    return null;
  };

  const statusInfo = getStatusMessage();

  return (
    <div className={`min-h-screen ${getRoleTheme()}`}>
      <Navigation title="대시보드" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                안녕하세요, {user.displayName || '사용자'}님!
              </h1>
              <p className="text-gray-600">
                {getRoleDisplayName(user.role)} 대시보드에 오신 것을 환영합니다
              </p>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {statusInfo && (
          <div className={`mb-8 p-6 rounded-xl border-2 ${
            statusInfo.color === 'yellow' 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  statusInfo.color === 'yellow' 
                    ? 'bg-yellow-100' 
                    : 'bg-blue-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    statusInfo.color === 'yellow' 
                      ? 'text-yellow-600' 
                      : 'text-blue-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    statusInfo.color === 'yellow' 
                      ? 'text-yellow-800' 
                      : 'text-blue-800'
                  }`}>
                    {statusInfo.title}
                  </h3>
                  <p className={`text-sm ${
                    statusInfo.color === 'yellow' 
                      ? 'text-yellow-700' 
                      : 'text-blue-700'
                  }`}>
                    {statusInfo.message}
                  </p>
                </div>
              </div>
              <button
                onClick={statusInfo.buttonAction}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  statusInfo.color === 'yellow'
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {statusInfo.buttonText}
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {typeof value === 'number' && key.includes('Revenue') || key.includes('Earnings')
                      ? `₩${formatCurrency(value)}`
                      : typeof value === 'number' && (key.includes('Rating') || key.includes('Satisfaction'))
                      ? value.toFixed(1)
                      : typeof value === 'number'
                      ? formatCurrency(value)
                      : value}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">
                    {key.includes('Orders') || key.includes('Jobs') ? '📋' :
                     key.includes('Revenue') || key.includes('Earnings') ? '💰' :
                     key.includes('Users') ? '👥' :
                     key.includes('Rating') || key.includes('Satisfaction') ? '⭐' :
                     key.includes('Approvals') ? '✅' :
                     key.includes('Health') ? '💚' : '📊'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {user.role === 'seller' && (
            <>
              <button 
                onClick={() => router.push('/workorder/new')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="font-semibold">새 작업 등록</div>
              </button>
              <button 
                onClick={() => router.push('/workorder/list')}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold">작업 관리</div>
              </button>
              <button 
                onClick={() => router.push('/estimate/list')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">📄</div>
                <div className="font-semibold">견적 관리</div>
              </button>
              <button 
                onClick={() => router.push('/payment/list')}
                className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="font-semibold">매출 관리</div>
              </button>
            </>
          )}
          
          {user.role === 'contractor' && (
            <>
              <button 
                onClick={toggleDutyStatus}
                className={`p-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                  isOnDuty 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                    : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                }`}
              >
                <div className="text-2xl mb-2">{isOnDuty ? '🚪' : '🚀'}</div>
                <div className="font-semibold">{isOnDuty ? '퇴근하기' : '출근하기'}</div>
              </button>
              <button 
                onClick={() => router.push('/contractor/workorder/new')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="font-semibold">시공요청 등록</div>
              </button>
              <button 
                onClick={() => router.push('/contractor/workorder/list')}
                className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">🔧</div>
                <div className="font-semibold">내 작업</div>
              </button>
              <button 
                onClick={() => router.push('/collaboration')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">🤝</div>
                <div className="font-semibold">협업 관리</div>
              </button>
              <button 
                onClick={() => router.push('/contractor/scheduler')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">📅</div>
                <div className="font-semibold">스케줄</div>
              </button>
            </>
          )}
          
          {user.role === 'admin' && (
            <>
              <button 
                onClick={() => router.push('/admin')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-semibold">시스템 관리</div>
              </button>
              <button 
                onClick={() => router.push('/admin/approvals')}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">✅</div>
                <div className="font-semibold">사용자 승인</div>
              </button>
              <button 
                onClick={() => router.push('/admin/analytics')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold">분석</div>
              </button>
              <button 
                onClick={() => router.push('/admin/settings')}
                className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-2xl mb-2">🔧</div>
                <div className="font-semibold">설정</div>
              </button>
            </>
          )}
        </div>

        {/* 시공자 출근 시 시공요청 목록 표시 */}
        {user.role === 'contractor' && showWorkOrders && (
          <div className="bg-white rounded-xl shadow-sm mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-bold text-gray-900">📋 새로운 시공요청 목록</h2>
                  {/* 위치 권한 상태 표시 */}
                  <div className="flex items-center space-x-2">
                    {locationPermission === 'pending' && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        📍 위치 확인 중...
                      </span>
                    )}
                    {locationPermission === 'granted' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        📍 위치 정보 사용 가능
                      </span>
                    )}
                    {locationPermission === 'denied' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          📍 위치 정보 없음
                        </span>
                        <button
                          onClick={requestLocationPermission}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          위치 권한 요청
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500">총 {workOrders.length}건</span>
              </div>
            </div>
            <div className="p-6">
              {workOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="text-gray-600">현재 새로운 시공요청이 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">잠시 후 다시 확인해보세요.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workOrders.map((workOrder) => (
                    <div 
                      key={workOrder.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleWorkOrderDetail(workOrder.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-bold">🔧</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {workOrder.customerName}님의 시공요청
                            </h3>
                            <p className="text-sm text-gray-500">
                              {workOrder.location}
                            </p>
                            {/* 거리 정보 표시 */}
                            {workOrder.distanceInfo && (
                              <div className="flex items-center mt-1">
                                <span className={`text-xs font-medium ${getDistanceColor(workOrder.distanceInfo.distance)}`}>
                                  {getDistanceIcon(workOrder.distanceInfo.distance)} {workOrder.distanceInfo.formattedDistance}
                                </span>
                                {workOrder.distanceInfo.isNearby && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    가까운 거리
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-orange-600">
                            {workOrder.scheduledDate?.toDate?.() ? 
                              new Date(workOrder.scheduledDate.toDate()).toLocaleDateString('ko-KR') :
                              new Date(workOrder.scheduledDate).toLocaleDateString('ko-KR')
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            {workOrder.urgentFeeRate > 0 && (
                              <span className="text-red-600">긴급 +{workOrder.urgentFeeRate}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">제품:</span>
                          <span className="ml-2 font-medium">
                            {workOrder.products?.map(p => p.name).join(', ') || '제품 정보 없음'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">수량:</span>
                          <span className="ml-2 font-medium">
                            {workOrder.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0}개
                          </span>
                        </div>
                      </div>
                      
                      {workOrder.additionalNotes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">특이사항:</span> {workOrder.additionalNotes}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          등록일: {workOrder.createdAt?.toDate?.() ? 
                            new Date(workOrder.createdAt.toDate()).toLocaleString('ko-KR') :
                            new Date(workOrder.createdAt).toLocaleString('ko-KR')
                          }
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWorkOrderDetail(workOrder.id);
                          }}
                          className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          상세보기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">최근 활동</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status === 'completed' ? '완료' :
                     activity.status === 'pending' ? '대기' :
                     activity.status === 'in-progress' ? '진행중' :
                     activity.status === 'rejected' ? '거부' : activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 