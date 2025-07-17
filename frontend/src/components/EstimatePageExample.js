import React, { useState } from 'react';
import EstimatePage from './EstimatePage';
import { 
  getEstimates, 
  getEstimate, 
  updateEstimateStatus,
  assignEstimateToContractor,
  unassignEstimate,
  getUnassignedEstimates,
  getEstimatesByContractor
} from '../utils/saveEstimate';

export default function EstimatePageExample() {
  const [activeTab, setActiveTab] = useState('create');
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  const sellerId = "abcd1234"; // 추후 로그인 연동
  
  // 샘플 계약자 목록 (실제로는 데이터베이스에서 가져와야 함)
  const sampleContractors = [
    { id: 'contractor1', name: '김철수', specialty: '롤러커튼', rating: 4.8 },
    { id: 'contractor2', name: '이영희', specialty: '로만커튼', rating: 4.9 },
    { id: 'contractor3', name: '박민수', specialty: '베네시안', rating: 4.7 },
    { id: 'contractor4', name: '정수진', specialty: '버티컬', rating: 4.6 }
  ];

  // 견적 목록 조회
  const handleLoadEstimates = async () => {
    setIsLoading(true);
    try {
      const estimatesList = await getEstimates(sellerId);
      setEstimates(estimatesList);
    } catch (error) {
      console.error('견적 목록 조회 실패:', error);
      alert(`견적 목록 조회 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 특정 견적 조회
  const handleViewEstimate = async (estimateId) => {
    try {
      const estimate = await getEstimate(estimateId);
      setSelectedEstimate(estimate);
      setActiveTab('view');
    } catch (error) {
      console.error('견적 조회 실패:', error);
      alert(`견적 조회 실패: ${error.message}`);
    }
  };

  // 견적 상태 업데이트
  const handleUpdateStatus = async (estimateId, newStatus) => {
    try {
      await updateEstimateStatus(estimateId, newStatus);
      alert('견적 상태가 업데이트되었습니다.');
      
      // 견적 목록 새로고침
      if (activeTab === 'list') {
        handleLoadEstimates();
      }
      
      // 현재 보고 있는 견적이면 새로고침
      if (selectedEstimate && selectedEstimate.id === estimateId) {
        const updatedEstimate = await getEstimate(estimateId);
        setSelectedEstimate(updatedEstimate);
      }
    } catch (error) {
      console.error('견적 상태 업데이트 실패:', error);
      alert(`견적 상태 업데이트 실패: ${error.message}`);
    }
  };

  // 견적 할당
  const handleAssignEstimate = async (estimateId, contractorId) => {
    try {
      await assignEstimateToContractor(estimateId, contractorId);
      alert('견적이 계약자에게 할당되었습니다.');
      setShowAssignmentModal(false);
      setSelectedContractor('');
      
      // 견적 목록 새로고침
      if (activeTab === 'list') {
        handleLoadEstimates();
      }
      
      // 현재 보고 있는 견적이면 새로고침
      if (selectedEstimate && selectedEstimate.id === estimateId) {
        const updatedEstimate = await getEstimate(estimateId);
        setSelectedEstimate(updatedEstimate);
      }
    } catch (error) {
      console.error('견적 할당 실패:', error);
      alert(`견적 할당 실패: ${error.message}`);
    }
  };

  // 견적 할당 해제
  const handleUnassignEstimate = async (estimateId) => {
    try {
      await unassignEstimate(estimateId);
      alert('견적 할당이 해제되었습니다.');
      
      // 견적 목록 새로고침
      if (activeTab === 'list') {
        handleLoadEstimates();
      }
      
      // 현재 보고 있는 견적이면 새로고침
      if (selectedEstimate && selectedEstimate.id === estimateId) {
        const updatedEstimate = await getEstimate(estimateId);
        setSelectedEstimate(updatedEstimate);
      }
    } catch (error) {
      console.error('견적 할당 해제 실패:', error);
      alert(`견적 할당 해제 실패: ${error.message}`);
    }
  };

  // 할당되지 않은 견적 조회
  const handleLoadUnassignedEstimates = async () => {
    setIsLoading(true);
    try {
      const unassignedEstimates = await getUnassignedEstimates();
      setEstimates(unassignedEstimates);
    } catch (error) {
      console.error('할당되지 않은 견적 조회 실패:', error);
      alert(`할당되지 않은 견적 조회 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '날짜 없음';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      accepted: { text: '승인됨', color: 'bg-green-100 text-green-800' },
      rejected: { text: '거절됨', color: 'bg-red-100 text-red-800' },
      completed: { text: '완료됨', color: 'bg-blue-100 text-blue-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getAssignmentBadge = (assigned) => {
    return assigned ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        할당됨
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        미할당
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">커튼 설치 견적 시스템</h1>
          <p className="text-gray-600">견적 생성, 관리, 조회를 한 곳에서</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              견적 생성
            </button>
            <button
              onClick={() => {
                setActiveTab('list');
                handleLoadEstimates();
              }}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              견적 목록
            </button>
            <button
              onClick={() => {
                setActiveTab('unassigned');
                handleLoadUnassignedEstimates();
              }}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'unassigned'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              미할당 견적
            </button>
            {selectedEstimate && (
              <button
                onClick={() => setActiveTab('view')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'view'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                견적 상세
              </button>
            )}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-white rounded-lg shadow-md">
          {activeTab === 'create' && (
            <div className="p-6">
              <EstimatePage />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">견적 목록</h2>
                <button
                  onClick={handleLoadEstimates}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  {isLoading ? '로딩 중...' : '새로고침'}
                </button>
              </div>

              {estimates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">저장된 견적이 없습니다.</p>
                  <p className="text-gray-400">견적 생성 탭에서 새로운 견적을 만들어보세요.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {estimates.map((estimate) => (
                    <div
                      key={estimate.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewEstimate(estimate.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-800">
                              견적 #{estimate.id.slice(-8)}
                            </h3>
                            {getStatusBadge(estimate.status)}
                            {getAssignmentBadge(estimate.assigned)}
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>고객: {estimate.customerName || '미입력'}</p>
                            <p>연락처: {estimate.customerPhone || '미입력'}</p>
                            <p>총 금액: {formatCurrency(estimate.total)}원</p>
                            <p>생성일: {formatDate(estimate.createdAt)}</p>
                            {estimate.assigned && (
                              <p className="text-purple-600">할당된 계약자: {estimate.assignedTo}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(estimate.total)}원
                          </div>
                          <div className="text-sm text-gray-500">
                            {estimate.itemCount}개 항목
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'unassigned' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">미할당 견적</h2>
                <button
                  onClick={handleLoadUnassignedEstimates}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  {isLoading ? '로딩 중...' : '새로고침'}
                </button>
              </div>

              {estimates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">할당되지 않은 견적이 없습니다.</p>
                  <p className="text-gray-400">모든 견적이 계약자에게 할당되었습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {estimates.map((estimate) => (
                    <div
                      key={estimate.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-800">
                              견적 #{estimate.id.slice(-8)}
                            </h3>
                            {getStatusBadge(estimate.status)}
                            {getAssignmentBadge(estimate.assigned)}
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>고객: {estimate.customerName || '미입력'}</p>
                            <p>연락처: {estimate.customerPhone || '미입력'}</p>
                            <p>총 금액: {formatCurrency(estimate.total)}원</p>
                            <p>생성일: {formatDate(estimate.createdAt)}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(estimate.total)}원
                          </div>
                          <div className="text-sm text-gray-500">
                            {estimate.itemCount}개 항목
                          </div>
                          <button
                            onClick={() => {
                              setSelectedEstimate(estimate);
                              setShowAssignmentModal(true);
                            }}
                            className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                          >
                            계약자 할당
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'view' && selectedEstimate && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  견적 상세 - #{selectedEstimate.id.slice(-8)}
                </h2>
                <div className="flex space-x-2">
                  {getStatusBadge(selectedEstimate.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 고객 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">고객 정보</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">고객명:</span> {selectedEstimate.customerName || '미입력'}</p>
                    <p><span className="font-medium">연락처:</span> {selectedEstimate.customerPhone || '미입력'}</p>
                    <p><span className="font-medium">프로젝트:</span> {selectedEstimate.projectDescription || '미입력'}</p>
                    <p><span className="font-medium">생성일:</span> {formatDate(selectedEstimate.createdAt)}</p>
                    <p><span className="font-medium">수정일:</span> {formatDate(selectedEstimate.updatedAt)}</p>
                  </div>
                </div>

                                 {/* 견적 요약 */}
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h3 className="font-semibold text-gray-800 mb-3">견적 요약</h3>
                   <div className="space-y-2 text-sm">
                     <p><span className="font-medium">총 금액:</span> {formatCurrency(selectedEstimate.total)}원</p>
                     <p><span className="font-medium">항목 수:</span> {selectedEstimate.itemCount}개</p>
                     <p><span className="font-medium">통화:</span> {selectedEstimate.currency}</p>
                     <p><span className="font-medium">버전:</span> {selectedEstimate.version}</p>
                     <p><span className="font-medium">할당 상태:</span> {selectedEstimate.assigned ? '할당됨' : '미할당'}</p>
                     {selectedEstimate.assigned && (
                       <>
                         <p><span className="font-medium">할당된 계약자:</span> {selectedEstimate.assignedTo}</p>
                         <p><span className="font-medium">할당 시간:</span> {formatDate(selectedEstimate.assignedAt)}</p>
                       </>
                     )}
                   </div>
                 </div>
              </div>

              {/* 견적 상세 내역 */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">견적 상세 내역</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">항목</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">설명</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">금액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedEstimate.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">
                            {formatCurrency(item.amount)}원
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="2" className="px-4 py-3 text-sm font-medium text-gray-700">
                          총 견적 금액
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">
                          {formatCurrency(selectedEstimate.total)}원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

                             {/* 상태 업데이트 */}
               <div className="mt-6 flex justify-center space-x-4">
                 <button
                   onClick={() => handleUpdateStatus(selectedEstimate.id, 'accepted')}
                   disabled={selectedEstimate.status === 'accepted'}
                   className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                 >
                   승인
                 </button>
                 <button
                   onClick={() => handleUpdateStatus(selectedEstimate.id, 'rejected')}
                   disabled={selectedEstimate.status === 'rejected'}
                   className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                 >
                   거절
                 </button>
                 <button
                   onClick={() => handleUpdateStatus(selectedEstimate.id, 'completed')}
                   disabled={selectedEstimate.status === 'completed'}
                   className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                 >
                   완료
                 </button>
                 
                 {/* 할당 관리 */}
                 {!selectedEstimate.assigned ? (
                   <button
                     onClick={() => setShowAssignmentModal(true)}
                     className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                   >
                     계약자 할당
                   </button>
                 ) : (
                   <button
                     onClick={() => handleUnassignEstimate(selectedEstimate.id)}
                     className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                   >
                     할당 해제
                   </button>
                 )}
               </div>
            </div>
                     )}
         </div>
       </div>

       {/* 계약자 할당 모달 */}
       {showAssignmentModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
             <h3 className="text-xl font-bold text-gray-800 mb-4">계약자 할당</h3>
             
             <div className="mb-4">
               <label className="block text-sm font-medium text-gray-600 mb-2">
                 계약자 선택
               </label>
               <select
                 value={selectedContractor}
                 onChange={(e) => setSelectedContractor(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
               >
                 <option value="">계약자를 선택하세요</option>
                 {sampleContractors.map((contractor) => (
                   <option key={contractor.id} value={contractor.id}>
                     {contractor.name} - {contractor.specialty} (평점: {contractor.rating})
                   </option>
                 ))}
               </select>
             </div>

             <div className="flex justify-end space-x-3">
               <button
                 onClick={() => {
                   setShowAssignmentModal(false);
                   setSelectedContractor('');
                 }}
                 className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
               >
                 취소
               </button>
               <button
                 onClick={() => {
                   if (selectedContractor && selectedEstimate) {
                     handleAssignEstimate(selectedEstimate.id, selectedContractor);
                   } else {
                     alert('계약자를 선택해주세요.');
                   }
                 }}
                 disabled={!selectedContractor}
                 className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
               >
                 할당
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 } 