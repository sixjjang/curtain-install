import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getMyCollaborationRequests,
  getAcceptedCollaborations,
  cancelCollaborationRequest,
  startCollaboration,
  completeCollaboration,
  COLLABORATION_STATUS
} from '../utils/collaborationManager';

export default function MyCollaborationRequests() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requested'); // 'requested' | 'accepted'
  const [requestedCollaborations, setRequestedCollaborations] = useState([]);
  const [acceptedCollaborations, setAcceptedCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCollaborations();
  }, []);

  const loadCollaborations = async () => {
    try {
      setLoading(true);
      const [requested, accepted] = await Promise.all([
        getMyCollaborationRequests(user.uid),
        getAcceptedCollaborations(user.uid)
      ]);
      setRequestedCollaborations(requested);
      setAcceptedCollaborations(accepted);
    } catch (error) {
      setError('협업요청 목록을 불러오는데 실패했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCollaboration = async (collaborationId) => {
    if (!confirm('정말로 이 협업요청을 취소하시겠습니까?')) {
      return;
    }

    try {
      await cancelCollaborationRequest(collaborationId, user.uid);
      loadCollaborations(); // 목록 새로고침
      alert('협업요청을 취소했습니다.');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleStartCollaboration = async (collaborationId) => {
    if (!confirm('모든 협업자가 수락했는지 확인하셨나요? 협업을 시작하시겠습니까?')) {
      return;
    }

    try {
      await startCollaboration(collaborationId, user.uid);
      loadCollaborations(); // 목록 새로고침
      alert('협업을 시작했습니다.');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCompleteCollaboration = async (collaborationId) => {
    if (!confirm('모든 업무가 완료되었나요? 협업을 완료하시겠습니까?')) {
      return;
    }

    try {
      await completeCollaboration(collaborationId, user.uid);
      loadCollaborations(); // 목록 새로고침
      alert('협업을 완료했습니다.');
    } catch (error) {
      alert(error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [COLLABORATION_STATUS.PENDING]: { text: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      [COLLABORATION_STATUS.ACCEPTED]: { text: '수락됨', color: 'bg-green-100 text-green-800' },
      [COLLABORATION_STATUS.IN_PROGRESS]: { text: '진행중', color: 'bg-blue-100 text-blue-800' },
      [COLLABORATION_STATUS.COMPLETED]: { text: '완료', color: 'bg-gray-100 text-gray-800' },
      [COLLABORATION_STATUS.CANCELLED]: { text: '취소됨', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || { text: '알 수 없음', color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getCollaborationProgress = (collaboration) => {
    const totalTasks = collaboration.tasks?.length || 0;
    const acceptedTasks = collaboration.collaboratorTasks?.length || 0;
    
    if (totalTasks === 0) return 0;
    return Math.round((acceptedTasks / totalTasks) * 100);
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
        <h2 className="text-2xl font-bold text-gray-900">🤝 내 협업 관리</h2>
        <button
          onClick={loadCollaborations}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requested')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requested'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            내가 요청한 협업 ({requestedCollaborations.length})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'accepted'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            내가 수락한 협업 ({acceptedCollaborations.length})
          </button>
        </nav>
      </div>

      {/* 내가 요청한 협업 */}
      {activeTab === 'requested' && (
        <div>
          {requestedCollaborations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">요청한 협업이 없습니다</h3>
              <p className="text-gray-500">아직 협업요청을 생성하지 않았습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requestedCollaborations.map((collaboration) => (
                <div key={collaboration.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {collaboration.workOrder?.title}
                      </h3>
                      {getStatusBadge(collaboration.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      주소: {collaboration.workOrder?.address}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      총 금액: {collaboration.totalAmount?.toLocaleString()}원
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      업무 수: {collaboration.tasks?.length || 0}개
                    </p>
                    
                    {/* 진행률 */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>수락 진행률</span>
                        <span>{getCollaborationProgress(collaboration)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getCollaborationProgress(collaboration)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 협업자 정보 */}
                    <div className="text-sm text-gray-600">
                      <span>수락한 협업자: {collaboration.acceptedCollaborators?.length || 0}명</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {collaboration.status === COLLABORATION_STATUS.PENDING && (
                      <>
                        <button
                          onClick={() => handleStartCollaboration(collaboration.id)}
                          disabled={getCollaborationProgress(collaboration) < 100}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          협업 시작
                        </button>
                        <button
                          onClick={() => handleCancelCollaboration(collaboration.id)}
                          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          협업요청 취소
                        </button>
                      </>
                    )}
                    
                    {collaboration.status === COLLABORATION_STATUS.IN_PROGRESS && (
                      <button
                        onClick={() => handleCompleteCollaboration(collaboration.id)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        협업 완료
                      </button>
                    )}

                    <button
                      onClick={() => {/* 상세보기 모달 구현 */}}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 내가 수락한 협업 */}
      {activeTab === 'accepted' && (
        <div>
          {acceptedCollaborations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🤝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">수락한 협업이 없습니다</h3>
              <p className="text-gray-500">아직 협업요청을 수락하지 않았습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {acceptedCollaborations.map((collaboration) => (
                <div key={collaboration.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {collaboration.workOrder?.title}
                      </h3>
                      {getStatusBadge(collaboration.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      요청자: {collaboration.requester?.name || '알 수 없음'}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      주소: {collaboration.workOrder?.address}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      총 금액: {collaboration.totalAmount?.toLocaleString()}원
                    </p>
                    
                    {/* 내가 수락한 업무 */}
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">내 담당 업무:</h4>
                      {collaboration.collaboratorTasks
                        ?.filter(task => task.contractorId === user.uid)
                        .map((task, index) => (
                          <div key={index} className="bg-blue-50 rounded-lg p-2 mb-2">
                            <div className="text-sm font-medium text-blue-900">{task.title}</div>
                            <div className="text-xs text-blue-700">{task.amount?.toLocaleString()}원</div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {/* 상세보기 모달 구현 */}}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 