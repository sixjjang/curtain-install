import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../hooks/useAuth';
import PhoneCallButton from '../../components/PhoneCallButton';
import ApprovalNotice from '../../components/ApprovalNotice';
import { withRoleProtection } from '../../components/withRoleProtection';

function WorkOrderList() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('available'); // available, assigned
  const [error, setError] = useState('');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoadingOrders(false);
      return;
    }

    try {
      let q;
      
      // 임시 해결책: 모든 작업 주문을 가져온 후 클라이언트에서 필터링
      if (filter === 'all') {
        q = query(
          collection(db, 'workOrders'),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'workOrders'),
          where('status', '==', filter),
          orderBy('createdAt', 'desc')
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        // 클라이언트 사이드에서 정렬
        list.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA; // 내림차순
        });
        setWorkOrders(list);
        setLoadingOrders(false);
        setError('');
      }, (error) => {
        console.error('시공요청목록 조회 오류:', error);
        setError('시공요청목록을 불러오는데 실패했습니다.');
        setLoadingOrders(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('쿼리 오류:', error);
      setError('쿼리 생성 중 오류가 발생했습니다.');
      setLoadingOrders(false);
    }
  }, [user, userData, filter]);

  const getStatusColor = (status) => {
    switch (status) {
      case '등록': return 'bg-blue-100 text-blue-800';
      case '진행중': return 'bg-yellow-100 text-yellow-800';
      case '완료': return 'bg-green-100 text-green-800';
      case '취소': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case '등록': return '등록됨';
      case '진행중': return '진행 중';
      case '완료': return '완료';
      case '취소': return '취소됨';
      default: return status || '알 수 없음';
    }
  };

  const formatDate = (date) => {
    if (!date) return '날짜 없음';
    
    try {
      if (date.toDate) {
        return date.toDate().toLocaleDateString('ko-KR');
      } else if (date instanceof Date) {
        return date.toLocaleDateString('ko-KR');
      } else {
        return new Date(date).toLocaleDateString('ko-KR');
      }
    } catch (error) {
      return '날짜 오류';
    }
  };

  const handleWorkOrderClick = (workOrder) => {
    router.push(`/workorder/${workOrder.id}`);
  };

  const handleAcceptWorkOrder = async (workOrder, e) => {
    e.stopPropagation();
    
    // 판매자 정보 확인 모달 표시
    setSelectedWorkOrder(workOrder);
    setShowAcceptModal(true);
  };

  const confirmAcceptWorkOrder = async () => {
    if (!selectedWorkOrder) return;

    try {
      const workOrderRef = doc(db, 'workOrders', selectedWorkOrder.id);
      await updateDoc(workOrderRef, {
        status: '진행중',
        contractorId: user.uid,
        contractorName: user.displayName || '시공자',
        acceptedAt: new Date(),
        updatedAt: new Date()
      });

      alert('작업이 성공적으로 수락되었습니다!');
      setShowAcceptModal(false);
      setSelectedWorkOrder(null);
    } catch (error) {
      console.error('작업 수락 오류:', error);
      alert('작업 수락 중 오류가 발생했습니다.');
    }
  };

  const filteredWorkOrders = workOrders.filter(order => {
    const matchesSearch = 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 사용자 역할에 따른 필터링
    const userRole = userProfile?.primaryRole || userProfile?.role || 'seller';
    
    if (userRole === 'seller') {
      // 판매자: 자신이 등록한 작업만
      return matchesSearch && order.sellerId === user.uid;
    } else if (userRole === 'contractor') {
      // 시공자: 탭에 따른 필터링
      if (activeTab === 'available') {
        // 수락 가능한 작업만 (등록 상태이면서 아직 수락되지 않은 작업)
        return matchesSearch && order.status === '등록' && !order.contractorId;
      } else if (activeTab === 'assigned') {
        // 내가 수락한 작업만
        return matchesSearch && order.contractorId === user.uid;
      }
    }
    
    return matchesSearch;
  });

  if (loading || loadingOrders) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="시공요청목록" />
        <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg">시공요청목록을 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="시공요청목록" />
        <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">로그인이 필요합니다</h2>
            <p className="text-red-600 mb-4">시공요청목록을 보려면 로그인해주세요.</p>
            <div className="flex space-x-4 justify-center">
              <Link
                href="/login"
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                로그인하기
              </Link>
              <Link
                href="/signup"
                className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
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
    <div className="min-h-screen bg-gray-50">
      <Navigation title="시공요청목록" />
      
      <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 승인 안내 */}
        <ApprovalNotice />
        
        {/* 헤더 */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                {userProfile?.role === 'seller' ? '내 시공요청목록' : 
                 userProfile?.role === 'contractor' ? '수락 가능한 시공요청' : 
                 userProfile?.role === 'contractor' ? '시공 작업 관리' : 
                 '시공요청목록'}
              </h2>
              <p className="text-gray-600 mt-2">
                {userProfile?.role === 'seller' ? '판매자가 등록한 시공요청들을 관리합니다.' : 
                 userProfile?.role === 'contractor' ? '수락할 수 있는 시공요청들을 확인하고 수락할 수 있습니다.' : 
                 userProfile?.role === 'contractor' ? '시공 작업을 관리합니다.' : 
                 '시공요청들을 확인합니다.'}
              </p>
            </div>
            {userProfile?.role === 'seller' && (
              <Link
                href="/workorder/new"
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                새 시공요청
              </Link>
            )}
          </div>

          {/* 시공자 전용 탭 */}
          {userProfile?.role === 'contractor' && (
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('available')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'available'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    수락 가능한 시공요청
                  </button>
                  <button
                    onClick={() => setActiveTab('assigned')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'assigned'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    내가 수락한 시공요청
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* 필터 및 검색 */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <input
                type="text"
                placeholder="고객명, 주소 또는 시공요청 ID로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태 필터
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체</option>
                <option value="등록">등록됨</option>
                <option value="진행중">진행 중</option>
                <option value="완료">완료</option>
                <option value="취소">취소됨</option>
              </select>
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {workOrders.filter(w => w.status === '등록').length}
              </div>
              <div className="text-sm text-blue-700">등록됨</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {workOrders.filter(w => w.status === '진행중').length}
              </div>
              <div className="text-sm text-yellow-700">진행 중</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {workOrders.filter(w => w.status === '완료').length}
              </div>
              <div className="text-sm text-green-700">완료</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {workOrders.filter(w => w.status === '취소').length}
              </div>
              <div className="text-sm text-red-700">취소됨</div>
            </div>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 시공요청목록 */}
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          {filteredWorkOrders.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">시공요청이 없습니다</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? '검색 결과가 없습니다.' : '아직 등록된 시공요청이 없습니다.'}
              </p>
              <Link
                href="/workorder/new"
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                첫 번째 시공요청 등록하기
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업 주문 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시공 예정일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWorkOrders.map((workOrder) => (
                    <tr key={workOrder.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleWorkOrderClick(workOrder)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {workOrder.id || workOrder.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {workOrder.products?.length || 0}개 제품
                          </div>
                          {workOrder.id && workOrder.id.startsWith('WO') && (
                            <div className="text-xs text-blue-600 font-mono">
                              {workOrder.id}
                            </div>
                          )}
                          {/* 첨부된 이미지 표시 */}
                          {workOrder.attachedImages && workOrder.attachedImages.length > 0 && (
                            <div className="mt-2 flex items-center">
                              <svg className="h-4 w-4 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-xs text-blue-600">
                                발주서 {workOrder.attachedImages.length}개
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {workOrder.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {workOrder.location}
                          </div>
                          {/* 판매자 정보 표시 */}
                          <div className="text-xs text-green-600 mt-1">
                            판매자: {workOrder.sellerName || "미입력"}
                            {workOrder.sellerBusinessName && (
                              <span className="ml-1">({workOrder.sellerBusinessName})</span>
                            )}
                          </div>
                          {(workOrder.workerPhone || workOrder.customerPhone) && (
                            <div className="mt-1">
                              <PhoneCallButton
                                phoneNumber={workOrder.workerPhone || workOrder.customerPhone}
                                displayName={workOrder.customerName}
                                showSMS={true}
                                showMasked={false}
                                size="small"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(workOrder.scheduledDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(workOrder.status)}`}>
                          {getStatusText(workOrder.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(workOrder.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWorkOrderClick(workOrder);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            상세보기
                          </button>
                          {userData?.role === 'contractor' && 
                           workOrder.status === '등록' && 
                           !workOrder.contractorId && (
                            <button
                              onClick={(e) => handleAcceptWorkOrder(workOrder, e)}
                              className="text-green-600 hover:text-green-900 font-medium"
                              title={`판매자: ${workOrder.sellerName || '미입력'}
사업장: ${workOrder.sellerBusinessName || '미입력'}
연락처: ${workOrder.sellerPhone || workOrder.sellerBusinessPhone || '미입력'}
주소: ${workOrder.sellerBusinessAddress || workOrder.sellerAddress || '미입력'}`}
                            >
                              수락
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 작업 수락 확인 모달 */}
      {showAcceptModal && selectedWorkOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">작업 수락 확인</h3>
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  setSelectedWorkOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 작업 정보 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">작업 정보</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">작업 ID:</span> {selectedWorkOrder.id}</div>
                  <div><span className="font-medium">고객명:</span> {selectedWorkOrder.customerName}</div>
                  <div><span className="font-medium">시공 장소:</span> {selectedWorkOrder.location}</div>
                  <div><span className="font-medium">시공 예정일:</span> {formatDate(selectedWorkOrder.scheduledDate)}</div>
                  <div><span className="font-medium">제품:</span> {selectedWorkOrder.products?.length || 0}개</div>
                </div>
              </div>

              {/* 판매자 정보 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">판매자 정보</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">판매자명:</span> {selectedWorkOrder.sellerName || '미입력'}</div>
                  <div><span className="font-medium">사업장명:</span> {selectedWorkOrder.sellerBusinessName || '미입력'}</div>
                  <div><span className="font-medium">사업자등록번호:</span> {selectedWorkOrder.sellerBusinessNumber || '미입력'}</div>
                  <div><span className="font-medium">연락처:</span> {selectedWorkOrder.sellerPhone || selectedWorkOrder.sellerBusinessPhone || '미입력'}</div>
                  <div><span className="font-medium">이메일:</span> {selectedWorkOrder.sellerEmail || '미입력'}</div>
                  <div><span className="font-medium">사업장 주소:</span> {selectedWorkOrder.sellerBusinessAddress || selectedWorkOrder.sellerAddress || '미입력'}</div>
                </div>
              </div>

              {/* 연락처 버튼 */}
              {(selectedWorkOrder.sellerPhone || selectedWorkOrder.sellerBusinessPhone) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">판매자 연락처</h4>
                  <PhoneCallButton
                    phoneNumber={selectedWorkOrder.sellerPhone || selectedWorkOrder.sellerBusinessPhone}
                    displayName={selectedWorkOrder.sellerName}
                    showSMS={true}
                    showMasked={false}
                    size="normal"
                  />
                </div>
              )}

              <div className="text-sm text-gray-600">
                위 정보를 확인하신 후 작업을 수락하시겠습니까?
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  setSelectedWorkOrder(null);
                }}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmAcceptWorkOrder}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
              >
                작업 수락
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 역할별 페이지 보호 적용
export default withRoleProtection(WorkOrderList, ['seller', 'contractor']);