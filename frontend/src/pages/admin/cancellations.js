import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import { withRoleProtection } from '../../components/withRoleProtection';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

function AdminCancellationsPage() {
  const router = useRouter();
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');

  useEffect(() => {
    loadCancellationRequests();
    loadWorkOrders();
    loadContractors();
  }, []);

  const loadCancellationRequests = async () => {
    try {
      const requestsSnapshot = await getDocs(query(collection(db, 'cancellationRequests'), orderBy('createdAt', 'desc')));
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCancellationRequests(requestsData);
    } catch (error) {
      console.error('취소 요청 로드 실패:', error);
    }
  };

  const loadWorkOrders = async () => {
    try {
      const workOrdersSnapshot = await getDocs(collection(db, 'workOrders'));
      const workOrdersData = workOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkOrders(workOrdersData);
    } catch (error) {
      console.error('시공요청 로드 실패:', error);
    }
  };

  const loadContractors = async () => {
    try {
      const contractorsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'contractor')));
      const contractorsData = contractorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContractors(contractorsData);
    } catch (error) {
      console.error('시공자 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCancellation = async (requestId, workOrderId) => {
    if (!confirm('정말로 이 취소 요청을 승인하시겠습니까?')) {
      return;
    }

    try {
      // 취소 요청 상태 업데이트
      await updateDoc(doc(db, 'cancellationRequests', requestId), {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: 'admin'
      });

      // 시공요청 상태를 취소로 변경
      await updateDoc(doc(db, 'workOrders', workOrderId), {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: '시공자 요청으로 인한 취소'
      });

      // 로컬 상태 업데이트
      setCancellationRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      ));

      alert('취소 요청이 승인되었습니다.');
    } catch (error) {
      console.error('취소 승인 실패:', error);
      alert('취소 승인에 실패했습니다.');
    }
  };

  const handleRejectCancellation = async (requestId) => {
    if (!confirm('정말로 이 취소 요청을 거절하시겠습니까?')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'cancellationRequests', requestId), {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: 'admin'
      });

      setCancellationRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'rejected' } : req
      ));

      alert('취소 요청이 거절되었습니다.');
    } catch (error) {
      console.error('취소 거절 실패:', error);
      alert('취소 거절에 실패했습니다.');
    }
  };

  const handleReuploadWorkOrder = async (workOrderId) => {
    try {
      // 원본 시공요청 정보 가져오기
      const workOrder = workOrders.find(wo => wo.id === workOrderId);
      if (!workOrder) {
        alert('시공요청 정보를 찾을 수 없습니다.');
        return;
      }

      // 새로운 시공요청 생성 (원본 정보 복사)
      const newWorkOrder = {
        ...workOrder,
        id: undefined, // 새 ID 생성
        status: 'pending',
        contractorId: null,
        contractorName: null,
        contractorEmail: null,
        assignedAt: null,
        scheduledDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReuploaded: true,
        originalWorkOrderId: workOrderId
      };

      delete newWorkOrder.id; // ID 제거하여 새 문서 생성

      await addDoc(collection(db, 'workOrders'), newWorkOrder);

      alert('시공요청이 다시 업로드되었습니다.');
      router.push('/admin/workorders');
    } catch (error) {
      console.error('시공요청 재업로드 실패:', error);
      alert('시공요청 재업로드에 실패했습니다.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '승인 대기';
      case 'approved': return '승인됨';
      case 'rejected': return '거절됨';
      default: return status;
    }
  };

  const canCancelWithoutApproval = (workOrder, cancellationRequest) => {
    if (!workOrder.assignedAt) return false;
    
    const assignedTime = workOrder.assignedAt.toDate ? workOrder.assignedAt.toDate() : new Date(workOrder.assignedAt);
    const requestTime = cancellationRequest.createdAt.toDate ? cancellationRequest.createdAt.toDate() : new Date(cancellationRequest.createdAt);
    const timeDiff = requestTime - assignedTime;
    
    // 긴급 건은 5분, 일반 건은 60분
    const maxTime = workOrder.isUrgent ? 5 * 60 * 1000 : 60 * 60 * 1000;
    
    return timeDiff <= maxTime;
  };

  const getTimeRemaining = (workOrder, cancellationRequest) => {
    if (!workOrder.assignedAt) return '배정 시간 없음';
    
    const assignedTime = workOrder.assignedAt.toDate ? workOrder.assignedAt.toDate() : new Date(workOrder.assignedAt);
    const requestTime = cancellationRequest.createdAt.toDate ? cancellationRequest.createdAt.toDate() : new Date(cancellationRequest.createdAt);
    const timeDiff = requestTime - assignedTime;
    
    const maxTime = workOrder.isUrgent ? 5 * 60 * 1000 : 60 * 60 * 1000;
    const remaining = maxTime - timeDiff;
    
    if (remaining <= 0) return '시간 초과';
    
    const minutes = Math.floor(remaining / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    
    return `${minutes}분 ${seconds}초 남음`;
  };

  const filteredRequests = cancellationRequests.filter(request => {
    return selectedStatus === 'all' || request.status === selectedStatus;
  });

  const getWorkOrderInfo = (workOrderId) => {
    return workOrders.find(wo => wo.id === workOrderId);
  };

  const getContractorName = (contractorId) => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor ? contractor.displayName || contractor.email : '알 수 없음';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">취소 요청을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="취소 요청 관리" />
      
      <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">취소 요청 관리</h1>
              <p className="text-gray-600 mt-2">시공자의 취소 요청을 승인하고 관리할 수 있습니다.</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              뒤로 가기
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인 대기</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cancellationRequests.filter(req => req.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인됨</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cancellationRequests.filter(req => req.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">거절됨</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cancellationRequests.filter(req => req.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 요청</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cancellationRequests.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 상태 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">전체 상태</option>
                <option value="pending">승인 대기</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거절됨</option>
              </select>
            </div>

            {/* 새로고침 */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  loadCancellationRequests();
                  loadWorkOrders();
                  loadContractors();
                }}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* Cancellation Requests List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              취소 요청 목록 ({filteredRequests.length}개)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시공요청 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시공자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    취소 사유
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간 제한
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    요청일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => {
                  const workOrder = getWorkOrderInfo(request.workOrderId);
                  const canCancel = workOrder ? canCancelWithoutApproval(workOrder, request) : false;
                  
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {workOrder?.title || '제목 없음'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {workOrder?.description?.substring(0, 50)}...
                          </div>
                          <div className="text-sm text-gray-500">
                            📍 {workOrder?.address}
                          </div>
                          {workOrder?.isUrgent && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                              긴급
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getContractorName(request.contractorId)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.contractorEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {request.reason || '사유 없음'}
                        </div>
                        {request.additionalInfo && (
                          <div className="text-sm text-gray-500 mt-1">
                            {request.additionalInfo}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {workOrder ? getTimeRemaining(workOrder, request) : '정보 없음'}
                        </div>
                        {canCancel && (
                          <div className="text-xs text-green-600 mt-1">
                            자동 취소 가능
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveCancellation(request.id, request.workOrderId)}
                              className="text-green-600 hover:text-green-900"
                            >
                              승인
                            </button>
                            <button
                              onClick={() => handleRejectCancellation(request.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              거절
                            </button>
                          </div>
                        ) : request.status === 'approved' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleReuploadWorkOrder(request.workOrderId)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              재업로드
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">❌</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">취소 요청이 없습니다</h3>
              <p className="text-gray-500">조건에 맞는 취소 요청을 찾을 수 없습니다.</p>
            </div>
          )}
        </div>

        {/* Cancellation Rules */}
        <div className="bg-white rounded-lg shadow-sm border mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">취소 규칙</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">1</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">일반 시공요청</p>
                  <p className="text-sm text-gray-600">시공자 수락 후 60분 이내에는 관리자 승인 없이 취소 가능</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm font-medium">2</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">긴급 시공요청</p>
                  <p className="text-sm text-gray-600">시공자 수락 후 5분 이내에만 관리자 승인 없이 취소 가능</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm font-medium">3</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">시간 초과</p>
                  <p className="text-sm text-gray-600">제한 시간 초과 시 반드시 관리자 승인이 필요</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRoleProtection(AdminCancellationsPage, ['admin']); 