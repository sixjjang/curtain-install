import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { useAuth } from '../../../hooks/useAuth';
import Navigation from '../../../components/Navigation';

export default function ContractorWorkOrderList() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, registered, in-progress, completed, cancelled
  const [searchTerm, setSearchTerm] = useState('');

  // 시공자 권한 확인
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (userData?.role !== 'contractor') {
      alert('시공자만 접근할 수 있습니다.');
      router.push('/dashboard');
      return;
    }
  }, [user, userData, router]);

  // 시공요청 목록 로드
  useEffect(() => {
    const loadWorkOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // 시공자가 등록한 시공요청 조회
        const q = query(
          collection(db, 'workOrders'),
          where('registeredBy', '==', 'contractor'),
          where('originalContractorId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setWorkOrders(orders);
      } catch (error) {
        console.error('시공요청 목록 로드 오류:', error);
        alert('시공요청 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadWorkOrders();
  }, [user]);

  // 필터링된 시공요청 목록
  const filteredWorkOrders = workOrders.filter(order => {
    // 상태 필터
    if (filter !== 'all') {
      if (filter === 'registered' && order.status !== '등록') return false;
      if (filter === 'in-progress' && order.status !== '진행중') return false;
      if (filter === 'completed' && order.status !== '완료') return false;
      if (filter === 'cancelled' && order.status !== '취소') return false;
    }

    // 검색어 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.location?.toLowerCase().includes(searchLower) ||
        order.id?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // 상태별 색상
  const getStatusColor = (status) => {
    switch (status) {
      case '등록': return 'bg-blue-100 text-blue-800 border-blue-200';
      case '진행중': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '완료': return 'bg-green-100 text-green-800 border-green-200';
      case '취소': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 등록 유형별 아이콘
  const getWorkTypeIcon = (workType) => {
    switch (workType) {
      case 'direct': return '📋';
      case 'transfer': return '🔄';
      case 'personal': return '👥';
      default: return '📋';
    }
  };

  // 등록 유형별 텍스트
  const getWorkTypeText = (workType) => {
    switch (workType) {
      case 'direct': return '직접 등록';
      case 'transfer': return '업무 양도';
      case 'personal': return '개인 요청';
      default: return '직접 등록';
    }
  };

  // 우선순위별 색상
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'text-gray-500';
      case 'normal': return 'text-blue-500';
      case 'high': return 'text-orange-500';
      case 'urgent': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  // 우선순위별 텍스트
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'low': return '낮음';
      case 'normal': return '보통';
      case 'high': return '높음';
      case 'urgent': return '긴급';
      default: return '보통';
    }
  };

  // 날짜 포맷팅
  const formatDate = (date) => {
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString('ko-KR');
  };

  // 시간 포맷팅
  const formatTime = (date) => {
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 시공요청 상세 보기
  const handleWorkOrderDetail = (workOrderId) => {
    router.push(`/workorder/${workOrderId}`);
  };

  // 새 시공요청 등록
  const handleNewWorkOrder = () => {
    router.push('/contractor/workorder/new');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="내가 등록한 시공요청" />
        <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg">시공요청 목록을 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="내가 등록한 시공요청" />
      
      <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">내가 등록한 시공요청</h1>
            <button
              onClick={handleNewWorkOrder}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + 새 시공요청 등록
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            총 {workOrders.length}건의 시공요청을 등록했습니다.
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* 상태 필터 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">상태:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="registered">등록</option>
                <option value="in-progress">진행중</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>

            {/* 검색 */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="고객명, 주소, 작업주문 ID로 검색"
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>
        </div>

        {/* 시공요청 목록 */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredWorkOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filter !== 'all' ? '검색 결과가 없습니다' : '등록된 시공요청이 없습니다'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filter !== 'all' 
                  ? '다른 검색어나 필터를 시도해보세요.' 
                  : '첫 번째 시공요청을 등록해보세요!'
                }
              </p>
              {!searchTerm && filter === 'all' && (
                <button
                  onClick={handleNewWorkOrder}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  시공요청 등록하기
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업주문 ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록 유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시공 장소
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      예정일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      우선순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWorkOrders.map((workOrder) => (
                    <tr 
                      key={workOrder.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleWorkOrderDetail(workOrder.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {workOrder.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">{getWorkTypeIcon(workOrder.workType)}</span>
                          {getWorkTypeText(workOrder.workType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {workOrder.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="max-w-xs truncate" title={workOrder.location}>
                          {workOrder.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{formatDate(workOrder.scheduledDate)}</div>
                          <div className="text-xs text-gray-400">
                            {formatTime(workOrder.scheduledDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(workOrder.status)}`}>
                          {workOrder.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={getPriorityColor(workOrder.priority)}>
                          {getPriorityText(workOrder.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(workOrder.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWorkOrderDetail(workOrder.id);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">총 등록</div>
            <div className="text-2xl font-bold text-gray-900">{workOrders.length}건</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">등록</div>
            <div className="text-2xl font-bold text-blue-600">
              {workOrders.filter(o => o.status === '등록').length}건
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">진행중</div>
            <div className="text-2xl font-bold text-yellow-600">
              {workOrders.filter(o => o.status === '진행중').length}건
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">완료</div>
            <div className="text-2xl font-bold text-green-600">
              {workOrders.filter(o => o.status === '완료').length}건
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">긴급</div>
            <div className="text-2xl font-bold text-red-600">
              {workOrders.filter(o => o.priority === 'urgent').length}건
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 