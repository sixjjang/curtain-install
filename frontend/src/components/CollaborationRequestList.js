import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getCollaborationRequestsForContractors,
  acceptCollaborationRequest,
  rejectCollaborationRequest 
} from '../utils/collaborationManager';

export default function CollaborationRequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCollaborationRequests();
  }, []);

  const loadCollaborationRequests = async () => {
    try {
      setLoading(true);
      const data = await getCollaborationRequestsForContractors();
      setRequests(data);
    } catch (error) {
      setError('협업요청 목록을 불러오는데 실패했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleAccept = (request) => {
    setSelectedRequest(request);
    setSelectedTasks([]);
    setShowAcceptModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleAcceptSubmit = async () => {
    if (selectedTasks.length === 0) {
      alert('수락할 업무를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await acceptCollaborationRequest(selectedRequest.id, user.uid, selectedTasks);
      setShowAcceptModal(false);
      setSelectedRequest(null);
      setSelectedTasks([]);
      loadCollaborationRequests(); // 목록 새로고침
      alert('협업요청을 수락했습니다.');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    setIsSubmitting(true);
    try {
      await rejectCollaborationRequest(selectedRequest.id, user.uid, rejectReason);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectReason('');
      loadCollaborationRequests(); // 목록 새로고침
      alert('협업요청을 거절했습니다.');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getSelectedTasksAmount = () => {
    if (!selectedRequest) return 0;
    return selectedRequest.tasks
      .filter(task => selectedTasks.includes(task.id))
      .reduce((sum, task) => sum + task.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">🤝 협업요청 목록</h2>
        <button
          onClick={loadCollaborationRequests}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          새로고침
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">🤝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">협업요청이 없습니다</h3>
          <p className="text-gray-500">현재 대기중인 협업요청이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {request.workOrder?.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  요청자: {request.requester?.name || '알 수 없음'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  주소: {request.workOrder?.address}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  총 금액: {request.totalAmount?.toLocaleString()}원
                </p>
                <p className="text-sm text-gray-600">
                  업무 수: {request.tasks?.length || 0}개
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleViewDetail(request)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  상세보기
                </button>
                <button
                  onClick={() => handleAccept(request)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  수락하기
                </button>
                <button
                  onClick={() => handleReject(request)}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  거절하기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">협업요청 상세</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* 원본 시공요청 정보 */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">📋 원본 시공요청</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">제목:</span> {selectedRequest.workOrder?.title}</div>
                  <div><span className="font-medium">총 금액:</span> {selectedRequest.totalAmount?.toLocaleString()}원</div>
                  <div><span className="font-medium">주소:</span> {selectedRequest.workOrder?.address}</div>
                  <div><span className="font-medium">마감일:</span> {selectedRequest.workOrder?.deadline}</div>
                </div>
              </div>

              {/* 요청자 정보 */}
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-green-900 mb-2">👤 요청자 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">이름:</span> {selectedRequest.requester?.name}</div>
                  <div><span className="font-medium">연락처:</span> {selectedRequest.requester?.phone}</div>
                  <div><span className="font-medium">평점:</span> {selectedRequest.requester?.rating || '없음'}</div>
                  <div><span className="font-medium">완료 건수:</span> {selectedRequest.requester?.completedProjects || 0}건</div>
                </div>
              </div>

              {/* 업무 목록 */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">📦 배정 업무</h4>
                <div className="space-y-4">
                  {selectedRequest.tasks?.map((task, index) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{task.title}</h5>
                        <span className="text-blue-600 font-semibold">{task.amount?.toLocaleString()}원</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {task.requiredSkills?.map((skill, skillIndex) => (
                          <span key={skillIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        예상 소요시간: {task.estimatedHours}시간
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 협업요청 메모 */}
              {selectedRequest.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">📝 협업요청 메모</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedRequest.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수락 모달 */}
      {showAcceptModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">협업요청 수락</h3>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">수락할 업무를 선택하세요:</h4>
                <div className="space-y-3">
                  {selectedRequest.tasks?.map((task) => (
                    <label key={task.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-600">{task.description}</div>
                        <div className="text-sm text-blue-600 font-semibold">{task.amount?.toLocaleString()}원</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedTasks.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-900">
                      선택한 업무 총 금액: {getSelectedTasksAmount().toLocaleString()}원
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowAcceptModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAcceptSubmit}
                  disabled={isSubmitting || selectedTasks.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '수락 중...' : '수락하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 거절 모달 */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">협업요청 거절</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  거절 사유 (선택사항)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="거절 사유를 입력하세요..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '거절 중...' : '거절하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 