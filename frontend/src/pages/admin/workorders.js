import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import { withRoleProtection } from '../../components/withRoleProtection';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

function AdminWorkOrdersPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWorkOrders();
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      const sellersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'seller')));
      const sellersData = sellersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSellers(sellersData);
    } catch (error) {
      console.error('판매자 목록 로드 실패:', error);
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

  const handleStatusChange = async (workOrderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'workOrders', workOrderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // 로컬 상태 업데이트
      setWorkOrders(prev => prev.map(wo => 
        wo.id === workOrderId ? { ...wo, status: newStatus } : wo
      ));
      
      alert('상태가 변경되었습니다.');
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (workOrderId) => {
    if (!confirm('정말로 이 시공요청을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'workOrders', workOrderId));
      
      // 로컬 상태에서 제거
      setWorkOrders(prev => prev.filter(wo => wo.id !== workOrderId));
      
      alert('시공요청이 삭제되었습니다.');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
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
    const matchesSeller = selectedSeller === 'all' || workOrder.sellerId === selectedSeller;
    const matchesStatus = selectedStatus === 'all' || workOrder.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      workOrder.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.address?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSeller && matchesStatus && matchesSearch;
  });

  const getSellerName = (sellerId) => {
    const seller = sellers.find(s => s.id === sellerId);
    return seller ? seller.displayName || seller.email : '알 수 없음';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">시공요청 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="시공요청 관리" />
      
      <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">시공요청 관리</h1>
              <p className="text-gray-600 mt-2">모든 시공요청을 확인하고 관리할 수 있습니다.</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              뒤로 가기
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 검색 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                placeholder="제목, 설명, 주소로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 판매자 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">판매자</label>
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체 판매자</option>
                {sellers.map(seller => (
                  <option key={seller.id} value={seller.id}>
                    {seller.displayName || seller.email}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                onClick={loadWorkOrders}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* Work Orders List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              시공요청 목록 ({filteredWorkOrders.length}개)
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
                    판매자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시공자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
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
                        {getSellerName(workOrder.sellerId)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {workOrder.sellerEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {workOrder.contractorName || '미배정'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {workOrder.contractorEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={workOrder.status}
                        onChange={(e) => handleStatusChange(workOrder.id, e.target.value)}
                        className={`text-sm px-2 py-1 rounded-full font-medium ${getStatusColor(workOrder.status)}`}
                      >
                        <option value="pending">대기 중</option>
                        <option value="assigned">배정됨</option>
                        <option value="in_progress">진행 중</option>
                        <option value="completed">완료</option>
                        <option value="cancelled">취소됨</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {workOrder.totalAmount ? `${workOrder.totalAmount.toLocaleString()}원` : '미정'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {workOrder.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
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
                        <button
                          onClick={() => handleDelete(workOrder.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
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
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">시공요청이 없습니다</h3>
              <p className="text-gray-500">조건에 맞는 시공요청을 찾을 수 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withRoleProtection(AdminWorkOrdersPage, ['admin']); 