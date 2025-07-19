import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';

const ContractorHomePage = () => {
  const { user, userProfile } = useAuth();
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    completed: 0,
    earnings: 0
  });

  // 컴포넌트 마운트 시 출근 상태 복원
  useEffect(() => {
    const savedDutyStatus = localStorage.getItem(`contractor_duty_${user?.uid}`);
    if (savedDutyStatus === 'true') {
      setIsOnDuty(true);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadWorkOrders();
      loadStats();
    }
  }, [isOnDuty, user?.uid]);

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      
      // 출근 상태에 따라 다른 쿼리
      let q;
      if (isOnDuty) {
        // 출근 중일 때: 수락 가능한 작업들 (아직 배정되지 않은 작업)
        q = query(
          collection(db, 'workOrders'),
          where('status', '==', '등록'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      } else {
        // 출근하지 않았을 때: 내가 수락한 작업들
        q = query(
          collection(db, 'workOrders'),
          where('contractorId', '==', user?.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
      }

      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }));

      // 출근 중일 때는 contractorId가 null이거나 없는 작업만 필터링
      if (isOnDuty) {
        const filteredOrders = orders.filter(order => !order.contractorId);
        setWorkOrders(filteredOrders);
      } else {
        setWorkOrders(orders);
      }
    } catch (error) {
      console.error('작업 주문 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // 내가 수락한 작업들의 통계
      const myWorkQuery = query(
        collection(db, 'workOrders'),
        where('contractorId', '==', user?.uid)
      );
      const myWorkSnapshot = await getDocs(myWorkQuery);
      
      const myWorks = myWorkSnapshot.docs.map(doc => doc.data());
      
      setStats({
        total: myWorks.length,
        available: myWorks.filter(w => w.status === '등록' || w.status === '진행중').length,
        completed: myWorks.filter(w => w.status === '완료').length,
        earnings: myWorks
          .filter(w => w.status === '완료')
          .reduce((sum, w) => sum + (w.totalAmount || 0), 0)
      });
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  const handleToggleDuty = async () => {
    const newDutyStatus = !isOnDuty;
    setIsOnDuty(newDutyStatus);
    
    // localStorage에 출근 상태 저장
    localStorage.setItem(`contractor_duty_${user?.uid}`, newDutyStatus.toString());
    
    // Firestore에 출근 상태 업데이트 (선택사항)
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          isOnDuty: newDutyStatus,
          lastDutyUpdate: new Date()
        });
      } catch (error) {
        console.error('출근 상태 업데이트 실패:', error);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '미정';
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '등록': return 'bg-blue-100 text-blue-800';
      case '진행중': return 'bg-yellow-100 text-yellow-800';
      case '완료': return 'bg-green-100 text-green-800';
      case '취소': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 lg:pt-24 lg:pb-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium mb-6">
              <span className={`w-2 h-2 rounded-full mr-2 ${isOnDuty ? 'bg-green-400 animate-pulse' : 'bg-white'}`}></span>
              {isOnDuty ? '출근 중' : '시공기사 대시보드'}
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              안녕하세요, {userProfile?.displayName || '시공기사'}님!
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {isOnDuty ? '출근 중입니다. 새로운 시공 요청을 확인해보세요!' : '출근하시면 새로운 시공 요청을 받을 수 있습니다.'}
            </p>
            
            <button
              onClick={handleToggleDuty}
              className={`inline-flex items-center justify-center px-8 py-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-base ${
                isOnDuty 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white text-blue-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">
                {isOnDuty ? '🛑' : '✅'}
              </span>
              {isOnDuty ? '퇴근하기' : '출근하기'}
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
              <div className="text-sm text-blue-700">총 작업</div>
            </div>
            <div className="bg-green-50 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.available}</div>
              <div className="text-sm text-green-700">진행중</div>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.completed}</div>
              <div className="text-sm text-purple-700">완료</div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.earnings.toLocaleString()}원
              </div>
              <div className="text-sm text-orange-700">총 수익</div>
            </div>
          </div>
        </div>
      </section>

      {/* Work Orders Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {isOnDuty ? '📋 새로운 시공 요청' : '📋 내 작업 목록'}
            </h2>
            <Link
              href={isOnDuty ? "/workorder/list" : "/workorder/worker-list"}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              전체보기 →
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg">로딩 중...</span>
            </div>
          ) : workOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isOnDuty ? '새로운 시공 요청이 없습니다' : '수락한 작업이 없습니다'}
              </h3>
              <p className="text-gray-600">
                {isOnDuty ? '잠시 후 다시 확인해보세요.' : '새로운 작업을 찾아보세요.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">
                        {order.customerName || '고객명 미입력'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.location || '주소 미입력'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📅</span>
                      {formatDate(order.scheduledDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">💰</span>
                      {order.totalAmount ? `${order.totalAmount.toLocaleString()}원` : '견적 미정'}
                    </div>
                    {order.urgentFeeRate > 0 && (
                      <div className="flex items-center text-sm text-red-600">
                        <span className="mr-2">🚨</span>
                        긴급 +{order.urgentFeeRate}%
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/workorder/${order.id}`}
                      className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      상세보기
                    </Link>
                    {isOnDuty && order.status === '등록' && !order.contractorId && (
                      <Link
                        href={`/workorder/${order.id}?action=accept`}
                        className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        수락하기
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8 text-center">
            빠른 메뉴
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/contractor/scheduler"
              className="bg-blue-50 hover:bg-blue-100 rounded-2xl p-6 text-center transition-colors"
            >
              <div className="text-3xl mb-3">📅</div>
              <h3 className="font-bold text-gray-900 mb-1">시공 스케줄</h3>
              <p className="text-sm text-gray-600">15일 일정 관리</p>
            </Link>
            
            <Link
              href="/workorder/worker-list"
              className="bg-green-50 hover:bg-green-100 rounded-2xl p-6 text-center transition-colors"
            >
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-bold text-gray-900 mb-1">내 작업 목록</h3>
              <p className="text-sm text-gray-600">수락한 작업 관리</p>
            </Link>
            
            <Link
              href="/payment/list"
              className="bg-purple-50 hover:bg-purple-100 rounded-2xl p-6 text-center transition-colors"
            >
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-bold text-gray-900 mb-1">시공료 내역</h3>
              <p className="text-sm text-gray-600">받은 시공료 확인</p>
            </Link>
            
            <Link
              href="/review/list"
              className="bg-orange-50 hover:bg-orange-100 rounded-2xl p-6 text-center transition-colors"
            >
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="font-bold text-gray-900 mb-1">받은 리뷰</h3>
              <p className="text-sm text-gray-600">고객이 남긴 리뷰</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContractorHomePage; 