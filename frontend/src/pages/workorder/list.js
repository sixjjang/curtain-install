import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../hooks/useAuth';

export default function WorkOrderList() {
  const { user, loading } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentAd, setCurrentAd] = useState(0);

  useEffect(() => {
    if (user) {
      // 실제 데이터는 Firebase에서 가져와야 함
      setWorkOrders([
        {
          id: 'WO-2024-001',
          title: '거실 커튼 설치',
          status: 'pending',
          customer: '김철수',
          address: '서울시 강남구 역삼동',
          price: 150000,
          createdAt: '2024-01-15',
          priority: 'high'
        },
        {
          id: 'WO-2024-002',
          title: '침실 블라인드 설치',
          status: 'in_progress',
          customer: '이영희',
          address: '서울시 서초구 서초동',
          price: 120000,
          createdAt: '2024-01-14',
          priority: 'medium'
        },
        {
          id: 'WO-2024-003',
          title: '사무실 커튼 교체',
          status: 'completed',
          customer: '박민수',
          address: '서울시 마포구 합정동',
          price: 200000,
          createdAt: '2024-01-13',
          priority: 'low'
        },
        {
          id: 'WO-2024-004',
          title: '카페 커튼 설치',
          status: 'cancelled',
          customer: '최지영',
          address: '서울시 종로구 종로동',
          price: 180000,
          createdAt: '2024-01-12',
          priority: 'high'
        }
      ]);
    }

    // 광고 자동 전환
    const adInterval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % 3);
    }, 7000);

    return () => clearInterval(adInterval);
  }, [user]);

  const ads = [
    {
      id: 1,
      title: "전문 도구 할인",
      subtitle: "시공 도구 30% 할인",
      image: "🔧",
      color: "from-blue-400 to-indigo-500"
    },
    {
      id: 2,
      title: "보험 가입 혜택",
      subtitle: "작업자 보험 무료 가입",
      image: "🛡️",
      color: "from-green-400 to-emerald-500"
    },
    {
      id: 3,
      title: "교육 프로그램",
      subtitle: "전문 기술 교육 무료",
      image: "📚",
      color: "from-purple-400 to-pink-500"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '대기 중';
      case 'in_progress': return '진행 중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return '알 수 없음';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '알 수 없음';
    }
  };

  const filteredWorkOrders = workOrders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            <p className="text-slate-600 mb-6">작업 주문 목록을 보려면 로그인해주세요.</p>
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
      <Navigation title="작업 주문 목록" />
      
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">작업 주문 목록</h1>
              <p className="text-slate-600">등록된 모든 작업 주문을 확인하고 관리하세요.</p>
            </div>
            <Link 
              href="/workorder/new" 
              className="btn btn-primary px-6 py-3"
            >
              <span className="mr-2">➕</span>
              새 작업 주문
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters and Search */}
            <div className="card p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="작업 주문 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="input"
                  >
                    <option value="all">전체</option>
                    <option value="pending">대기 중</option>
                    <option value="in_progress">진행 중</option>
                    <option value="completed">완료</option>
                    <option value="cancelled">취소됨</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Work Orders List */}
            <div className="space-y-4">
              {filteredWorkOrders.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">작업 주문이 없습니다</h3>
                  <p className="text-slate-600 mb-6">새로운 작업 주문을 등록해보세요.</p>
                  <Link 
                    href="/workorder/new" 
                    className="btn btn-primary"
                  >
                    새 작업 주문 등록
                  </Link>
                </div>
              ) : (
                filteredWorkOrders.map((order) => (
                  <div key={order.id} className="card card-hover p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                              {order.title}
                            </h3>
                            <p className="text-sm text-slate-600">
                              주문번호: {order.id}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`badge ${getPriorityColor(order.priority)}`}>
                              {getPriorityText(order.priority)}
                            </span>
                            <span className={`badge ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">고객명:</span>
                            <span className="ml-2 font-medium text-slate-900">{order.customer}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">주소:</span>
                            <span className="ml-2 font-medium text-slate-900">{order.address}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">견적가:</span>
                            <span className="ml-2 font-bold text-green-600">
                              {order.price.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 text-xs text-slate-500">
                          등록일: {order.createdAt}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          href={`/workorder/detail/${order.id}`}
                          className="btn btn-outline text-sm"
                        >
                          상세보기
                        </Link>
                        {order.status === 'pending' && (
                          <button className="btn btn-primary text-sm">
                            작업 시작
                          </button>
                        )}
                        {order.status === 'in_progress' && (
                          <button className="btn btn-success text-sm">
                            완료 처리
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
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
              <h3 className="font-bold text-slate-900 mb-4">작업 현황</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">총 작업</span>
                  <span className="font-semibold text-slate-900">{workOrders.length}건</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">대기 중</span>
                  <span className="font-semibold text-yellow-600">
                    {workOrders.filter(o => o.status === 'pending').length}건
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">진행 중</span>
                  <span className="font-semibold text-blue-600">
                    {workOrders.filter(o => o.status === 'in_progress').length}건
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">완료</span>
                  <span className="font-semibold text-green-600">
                    {workOrders.filter(o => o.status === 'completed').length}건
                  </span>
                </div>
              </div>
            </div>

            {/* Promotional Ad */}
            <div className="card p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-bold mb-2">긴급 작업 할인</h3>
                <p className="text-sm mb-4 opacity-90">
                  24시간 내 시공 시 15% 할인
                </p>
                <div className="bg-white/20 rounded-lg p-3 mb-4">
                  <div className="text-xs opacity-75">한정 시간</div>
                  <div className="text-lg font-bold">오늘까지</div>
                </div>
                <button className="w-full bg-white text-blue-600 py-2 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors">
                  할인 받기
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 mb-4">빠른 액션</h3>
              <div className="space-y-3">
                <Link
                  href="/workorder/new"
                  className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium">새 작업 등록</span>
                </Link>
                <Link
                  href="/estimate/list"
                  className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  <span className="text-lg">📄</span>
                  <span className="text-sm font-medium">견적서 보기</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                >
                  <span className="text-lg">📊</span>
                  <span className="text-sm font-medium">대시보드</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}