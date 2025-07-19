import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getAllCollaborationRequests,
  updateCollaborationRequest,
  deleteCollaborationRequest,
  forceCompleteCollaboration,
  forceCancelCollaboration,
  removeCollaborator,
  getCollaborationStatistics
} from '../../utils/adminCollaborationManager';
import { COLLABORATION_STATUS } from '../../utils/collaborationManager';
import AdminCollaborationEditModal from './AdminCollaborationEditModal';

export default function AdminCollaborationManager() {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForceCompleteModal, setShowForceCompleteModal] = useState(false);
  const [showForceCancelModal, setShowForceCancelModal] = useState(false);
  const [showRemoveCollaboratorModal, setShowRemoveCollaboratorModal] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadCollaborations();
  }, []);

  const loadCollaborations = async () => {
    try {
      setLoading(true);
      const [collaborationsData, statsData] = await Promise.all([
        getAllCollaborationRequests(),
        getCollaborationStatistics()
      ]);
      setCollaborations(collaborationsData);
      setStatistics(statsData);
    } catch (error) {
      setError('협업요청 목록을 불러오는데 실패했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [COLLABORATION_STATUS.PENDING]: { text: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      [COLLABORATION_STATUS.IN_PROGRESS]: { text: '진행중', color: 'bg-blue-100 text-blue-800' },
      [COLLABORATION_STATUS.COMPLETED]: { text: '완료', color: 'bg-green-100 text-green-800' },
      [COLLABORATION_STATUS.CANCELLED]: { text: '취소됨', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || { text: '알 수 없음', color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleEdit = (collaboration) => {
    setSelectedCollaboration(collaboration);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedCollaboration(null);
    loadCollaborations();
    alert('협업요청이 수정되었습니다.');
  };

  const handleDelete = (collaboration) => {
    setSelectedCollaboration(collaboration);
    setActionReason('');
    setShowDeleteModal(true);
  };

  const handleForceComplete = (collaboration) => {
    setSelectedCollaboration(collaboration);
    setActionReason('');
    setShowForceCompleteModal(true);
  };

  const handleForceCancel = (collaboration) => {
    setSelectedCollaboration(collaboration);
    setActionReason('');
    setShowForceCancelModal(true);
  };

  const handleRemoveCollaborator = (collaboration, collaborator) => {
    setSelectedCollaboration(collaboration);
    setSelectedCollaborator(collaborator);
    setActionReason('');
    setShowRemoveCollaboratorModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!actionReason.trim()) {
      alert('삭제 사유를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteCollaborationRequest(selectedCollaboration.id, user.uid, actionReason);
      setShowDeleteModal(false);
      setSelectedCollaboration(null);
      setActionReason('');
      loadCollaborations();
      alert('협업요청이 삭제되었습니다.');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceCompleteSubmit = async () => {
    setIsSubmitting(true);
    try {
      await forceCompleteCollaboration(selectedCollaboration.id, user.uid, actionReason);
      setShowForceCompleteModal(false);
      setSelectedCollaboration(null);
      setActionReason('');
      loadCollaborations();
      alert('협업이 강제 완료되었습니다.');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceCancelSubmit = async () => {
    setIsSubmitting(true);
    try {
      await forceCancelCollaboration(selectedCollaboration.id, user.uid, actionReason);
      setShowForceCancelModal(false);
      setSelectedCollaboration(null);
      setActionReason('');
      loadCollaborations();
      alert('협업이 강제 취소되었습니다.');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCollaboratorSubmit = async () => {
    if (!actionReason.trim()) {
      alert('제거 사유를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await removeCollaborator(selectedCollaboration.id, selectedCollaborator.id, user.uid, actionReason);
      setShowRemoveCollaboratorModal(false);
      setSelectedCollaboration(null);
      setSelectedCollaborator(null);
      setActionReason('');
      loadCollaborations();
      alert('협업자가 제거되었습니다.');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCollaborations = collaborations.filter(collaboration => {
    if (filterStatus === 'all') return true;
    return collaboration.status === filterStatus;
  });

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
        <h2 className="text-2xl font-bold text-gray-900">🔧 협업요청 관리</h2>
        <button
          onClick={loadCollaborations}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 통계 카드 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
            <div className="text-sm text-gray-600">전체 협업요청</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
            <div className="text-sm text-gray-600">대기중</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{statistics.inProgress}</div>
            <div className="text-sm text-gray-600">진행중</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{statistics.completed}</div>
            <div className="text-sm text-gray-600">완료</div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">상태 필터:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">전체</option>
            <option value={COLLABORATION_STATUS.PENDING}>대기중</option>
            <option value={COLLABORATION_STATUS.IN_PROGRESS}>진행중</option>
            <option value={COLLABORATION_STATUS.COMPLETED}>완료</option>
            <option value={COLLABORATION_STATUS.CANCELLED}>취소됨</option>
          </select>
        </div>
      </div>

      {/* 협업요청 목록 */}
      <div className="bg-white rounded-lg shadow border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  협업요청 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  요청자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  협업자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCollaborations.map((collaboration) => (
                <tr key={collaboration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {collaboration.workOrder?.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {collaboration.workOrder?.address}
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {collaboration.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {collaboration.requester?.name || '알 수 없음'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {collaboration.requester?.phone || '연락처 없음'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(collaboration.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {collaboration.acceptedCollaborators?.length || 0}명
                    </div>
                    <div className="text-xs text-gray-500">
                      {collaboration.acceptedCollaborators?.map(c => c.name).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {collaboration.totalAmount?.toLocaleString()}원
                    </div>
                    <div className="text-xs text-gray-500">
                      {collaboration.tasks?.length || 0}개 업무
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(collaboration)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(collaboration)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        삭제
                      </button>
                      {collaboration.status === COLLABORATION_STATUS.IN_PROGRESS && (
                        <button
                          onClick={() => handleForceComplete(collaboration)}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          강제완료
                        </button>
                      )}
                      {collaboration.status === COLLABORATION_STATUS.PENDING && (
                        <button
                          onClick={() => handleForceCancel(collaboration)}
                          className="text-orange-600 hover:text-orange-900 text-sm"
                        >
                          강제취소
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 삭제 모달 */}
      {showDeleteModal && selectedCollaboration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">협업요청 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              정말로 이 협업요청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                삭제 사유 *
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="삭제 사유를 입력하세요..."
                required
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 강제 완료 모달 */}
      {showForceCompleteModal && selectedCollaboration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">협업 강제 완료</h3>
            <p className="text-sm text-gray-600 mb-4">
              이 협업을 강제로 완료 처리하시겠습니까?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                완료 사유 (선택사항)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="완료 사유를 입력하세요..."
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowForceCompleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleForceCompleteSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? '완료 중...' : '강제 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 강제 취소 모달 */}
      {showForceCancelModal && selectedCollaboration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">협업 강제 취소</h3>
            <p className="text-sm text-gray-600 mb-4">
              이 협업을 강제로 취소하시겠습니까?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                취소 사유 (선택사항)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="취소 사유를 입력하세요..."
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowForceCancelModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleForceCancelSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? '취소 중...' : '강제 취소'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 협업자 제거 모달 */}
      {showRemoveCollaboratorModal && selectedCollaboration && selectedCollaborator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">협업자 제거</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{selectedCollaborator.name}</strong>을(를) 이 협업에서 제거하시겠습니까?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제거 사유 *
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="제거 사유를 입력하세요..."
                required
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowRemoveCollaboratorModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleRemoveCollaboratorSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? '제거 중...' : '제거'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 협업요청 수정 모달 */}
      {showEditModal && selectedCollaboration && (
        <AdminCollaborationEditModal
          collaboration={selectedCollaboration}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
} 