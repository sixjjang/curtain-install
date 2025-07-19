import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import { withRoleProtection } from '../../components/withRoleProtection';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

function AdminContractorsPage() {
  const router = useRouter();
  const [contractors, setContractors] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadContractors();
    loadWorkOrders();
  }, []);

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
    }
  };

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      const workOrdersSnapshot = await getDocs(query(collection(db, 'workOrders'), orderBy('createdAt', 'desc')));
      const workOrdersData = workOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkOrders(workOrdersData);
    } catch (error) {
      console.error('시공요청 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContractorStats = (contractorId) => {
    const contractorWorkOrders = workOrders.filter(wo => wo.contractorId === contractorId);
    
    return {
      total: contractorWorkOrders.length,
      pending: contractorWorkOrders.filter(wo => wo.status === 'pending').length,
      assigned: contractorWorkOrders.filter(wo => wo.status === 'assigned').length,
      inProgress: contractorWorkOrders.filter(wo => wo.status === 'in_progress').length,
      completed: contractorWorkOrders.filter(wo => wo.status === 'completed').length,
      cancelled: contractorWorkOrders.filter(wo => wo.status === 'cancelled').length,
      totalRevenue: contractorWorkOrders
        .filter(wo => wo.status === 'completed')
        .reduce((sum, wo) => sum + (wo.totalAmount || 0), 0),
      completionRate: contractorWorkOrders.length > 0 
        ? Math.round((contractorWorkOrders.filter(wo => wo.status === 'completed').length / contractorWorkOrders.length) * 100)
        : 0
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '대기 중';
      case 'assigned': return '배정됨';
      case 'in_progress': return '진행 중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  const filteredWorkOrders = workOrders.filter(workOrder => {
    const matchesContractor = selectedContractor === 'all' || workOrder.contractorId === selectedContractor;
    const matchesStatus = selectedStatus === 'all' || workOrder.status === selectedStatus;
    return matchesContractor && matchesStatus;
  });

  const getContractorName = (contractorId) => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor ? contractor.displayName || contractor.email : '알 수 없음';
  };

  const getSellerName = (sellerId) => {
    // 판매자 정보는 별도로 로드하거나 캐시에서 가져올 수 있습니다
    return sellerId || '알 수 없음';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">시공자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="시공자 관리" />
      
      <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">시공자 관리</h1>
              <p className="text-gray-600 mt-2">시공자들의 업무 현황과 스케줄을 관리할 수 있습니다.</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              뒤로 가기
            </button>
          </div>
        </div>

        {/* Contractors Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">👷</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 시공자</p>
                <p className="text-2xl font-bold text-gray-900">{contractors.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">진행 중 작업</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workOrders.filter(wo => wo.status === 'in_progress').length}
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
                <p className="text-sm font-medium text-gray-600">완료된 작업</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workOrders.filter(wo => wo.status === 'completed').length}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {workOrders
                    .filter(wo => wo.status === 'completed')
                    .reduce((sum, wo) => sum + (wo.totalAmount || 0), 0)
                    .toLocaleString()}원
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 시공자 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시공자</label>
              <select
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">전체 시공자</option>
                {contractors.map(contractor => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.displayName || contractor.email}
                  </option>
                ))}
              </select>
            </div>

            {/* 상태 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">전체 상태</option>
                <option value="pending">대기 중</option>
                <option value="assigned">배정됨</option>
                <option value="in_progress">진행 중</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>

            {/* 새로고침 */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  loadContractors();
                  loadWorkOrders();
                }}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* Contractors List */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">시공자 현황</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시공자 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업 통계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    완료율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 수익
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contractors.map((contractor) => {
                  const stats = getContractorStats(contractor.id);
                  return (
                    <tr key={contractor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contractor.displayName || '이름 없음'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contractor.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            📞 {contractor.phone || '전화번호 없음'}
                          </div>
                          {contractor.isApproved ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                              승인됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                              승인 대기
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex justify-between">
                            <span>총 작업:</span>
                            <span className="font-medium">{stats.total}개</span>
                          </div>
                          <div className="flex justify-between">
                            <span>진행 중:</span>
                            <span className="font-medium text-orange-600">{stats.inProgress}개</span>
                          </div>
                          <div className="flex justify-between">
                            <span>완료:</span>
                            <span className="font-medium text-green-600">{stats.completed}개</span>
                          </div>
                          <div className="flex justify-between">
                            <span>취소:</span>
                            <span className="font-medium text-red-600">{stats.cancelled}개</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${stats.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {stats.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stats.totalRevenue.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/admin/contractors/${contractor.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            상세보기
                          </button>
                          <button
                            onClick={() => router.push(`/admin/contractors/${contractor.id}/schedule`)}
                            className="text-green-600 hover:text-green-900"
                          >
                            스케줄
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Work Orders List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              시공 작업 목록 ({filteredWorkOrders.length}개)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시공자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    판매자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예정일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWorkOrders.map((workOrder) => (
                  <tr key={workOrder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {workOrder.title || '제목 없음'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {workOrder.description?.substring(0, 50)}...
                        </div>
                        <div className="text-sm text-gray-500">
                          📍 {workOrder.address}
                        </div>
                        {workOrder.isUrgent && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                            긴급
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getContractorName(workOrder.contractorId)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {workOrder.contractorEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getSellerName(workOrder.sellerId)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {workOrder.sellerEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workOrder.status)}`}>
                        {getStatusText(workOrder.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {workOrder.totalAmount ? `${workOrder.totalAmount.toLocaleString()}원` : '미정'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {workOrder.scheduledDate ? 
                        new Date(workOrder.scheduledDate).toLocaleDateString() : 
                        '미정'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/workorder/${workOrder.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          보기
                        </button>
                        <button
                          onClick={() => router.push(`/workorder/${workOrder.id}?edit=true`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          수정
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredWorkOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👷</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">작업이 없습니다</h3>
              <p className="text-gray-500">조건에 맞는 작업을 찾을 수 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withRoleProtection(AdminContractorsPage, ['admin']); 