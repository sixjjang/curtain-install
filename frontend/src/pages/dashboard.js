import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    totalWorkOrders: 0,
    pendingWorkOrders: 0,
    completedWorkOrders: 0,
    totalEstimates: 0,
    pendingEstimates: 0,
    totalEarnings: 0
  });
  const [currentAd, setCurrentAd] = useState(0);

  useEffect(() => {
    if (user) {
      // 실제 데이터는 Firebase에서 가져와야 함
      setStats({
        totalWorkOrders: 12,
        pendingWorkOrders: 3,
        completedWorkOrders: 9,
        totalEstimates: 8,
        pendingEstimates: 2,
        totalEarnings: 1250000
      });
    }

    // 광고 자동 전환
    const adInterval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % 3);
    }, 6000);

    return () => clearInterval(adInterval);
  }, [user]);

  const ads = [
    {
      id: 1,
      title: "프리미엄 시공 서비스",
      subtitle: "최고급 커튼 전문 시공",
      image: "🏆",
      color: "from-yellow-400 to-orange-500"
    },
    {
      id: 2,
      title: "긴급 시공 할인",
      subtitle: "24시간 내 시공 시 15% 할인",
      image: "⚡",
      color: "from-red-400 to-pink-500"
    },
    {
      id: 3,
      title: "친환경 커튼",
      subtitle: "친환경 소재로 건강한 공간",
      image: "🌱",
      color: "from-green-400 to-emerald-500"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'work_order',
      title: '새 작업 주문이 등록되었습니다',
      description: 'WO-2024-001 커튼 설치 작업',
      time: '2시간 전',
      icon: '📋',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 2,
      type: 'estimate',
      title: '견적서가 승인되었습니다',
      description: 'EST-2024-008 블라인드 설치',
      time: '1일 전',
      icon: '✅',
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 3,
      type: 'payment',
      title: '결제가 완료되었습니다',
      description: '150,000원 결제 완료',
      time: '2일 전',
      icon: '💳',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  const quickActions = [
    {
      title: '새 작업 주문',
      description: '새로운 커튼 설치 작업을 등록하세요',
      href: '/workorder/new',
      icon: '🚀',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
    },
    {
      title: '견적서 보기',
      description: '등록된 견적서를 확인하고 관리하세요',
      href: '/estimate/list',
      icon: '📄',
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
    },
    {
      title: '작업 목록',
      description: '진행 중인 작업들을 확인하세요',
      href: '/workorder/list',
      icon: '📋',
      color: 'bg-green-50 text-green-600 hover:bg-green-100'
    },
    {
      title: '결제 내역',
      description: '결제 내역을 확인하고 관리하세요',
      href: '/payment/list',
      icon: '💳',
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="card p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">로그인이 필요합니다</h2>
            <p className="text-slate-600 mb-6">대시보드를 보려면 로그인해주세요.</p>
            <div className="flex space-x-4">
              <Link 
                href="/login" 
                className="btn btn-primary flex-1"
              >
                로그인하기
              </Link>
              <Link 
                href="/signup" 
                className="btn btn-outline flex-1"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation title="대시보드" />
      
      <div className="container-custom py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="card p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  안녕하세요, {user.email ? user.email.split('@')[0] : '사용자'}님! 👋
                </h1>
                <p className="text-blue-100">
                  오늘도 좋은 하루 되세요. 새로운 작업과 업데이트를 확인해보세요.
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="text-6xl opacity-20">🎯</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card card-hover p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">총 작업 주문</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalWorkOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                </div>
              </div>

              <div className="card card-hover p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">대기 중인 작업</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pendingWorkOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⏳</span>
                  </div>
                </div>
              </div>

              <div className="card card-hover p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">완료된 작업</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completedWorkOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="card card-hover p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">총 견적서</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalEstimates}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                </div>
              </div>

              <div className="card card-hover p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">대기 중인 견적</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.pendingEstimates}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                </div>
              </div>

              <div className="card card-hover p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">총 수익</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.totalEarnings.toLocaleString()}원
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">빠른 액션</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className={`p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200 ${action.color}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{action.icon}</div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{action.title}</h3>
                        <p className="text-sm text-slate-600">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">최근 활동</h2>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <span className="text-lg">{activity.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{activity.title}</h3>
                      <p className="text-sm text-slate-600">{activity.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar with Ads */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ad Banner */}
            <div className="card p-6 bg-gradient-to-br from-white to-slate-50">
              <div className="text-center">
                <div className="text-4xl mb-3">{ads[currentAd].image}</div>
                <h3 className="font-bold text-slate-900 mb-2">
                  {ads[currentAd].title}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {ads[currentAd].subtitle}
                </p>
                <div className="flex justify-center space-x-1 mb-4">
                  {ads.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentAd(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentAd ? 'bg-blue-600 w-4' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <button className="w-full btn btn-primary text-sm">
                  자세히 보기
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 mb-4">이번 달 통계</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">완료된 작업</span>
                  <span className="font-semibold text-slate-900">8건</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">총 수익</span>
                  <span className="font-semibold text-green-600">850,000원</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">평균 평점</span>
                  <span className="font-semibold text-yellow-600">4.8/5.0</span>
                </div>
              </div>
            </div>

            {/* Promotional Ad */}
            <div className="card p-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
              <div className="text-center">
                <div className="text-3xl mb-2">🎁</div>
                <h3 className="font-bold mb-2">신규 고객 혜택</h3>
                <p className="text-sm mb-4 opacity-90">
                  첫 주문 시 20% 할인
                </p>
                <div className="bg-white/20 rounded-lg p-3 mb-4">
                  <div className="text-xs opacity-75">한정 시간</div>
                  <div className="text-lg font-bold">2024.12.31까지</div>
                </div>
                <button className="w-full bg-white text-orange-600 py-2 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors">
                  혜택 받기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 