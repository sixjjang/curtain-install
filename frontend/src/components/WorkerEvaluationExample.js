import { useState, useEffect } from "react";
import { auth } from "../firebase/firebase";
import WorkerEvaluationForm from "./WorkerEvaluationForm";
import { getWorkerEvaluations, getWorkerEvaluationStats } from "../utils/workerEvaluation";

export default function WorkerEvaluationExample() {
  const [activeTab, setActiveTab] = useState('evaluate');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workOrderId, setWorkOrderId] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Sample worker data for demonstration
  const sampleWorkers = [
    { id: 'worker1', name: '김철수', specialty: '블라인드 설치' },
    { id: 'worker2', name: '이영희', specialty: '커튼 설치' },
    { id: 'worker3', name: '박민수', specialty: '롤스크린 설치' },
  ];

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleEvaluationSuccess = async (result) => {
    console.log('평가 성공:', result);
    // Refresh evaluations and stats
    if (selectedWorkerId) {
      await loadWorkerData(selectedWorkerId);
    }
  };

  const loadWorkerData = async (workerId) => {
    if (!workerId) return;

    setLoading(true);
    try {
      // Load evaluations
      const evaluationsData = await getWorkerEvaluations(workerId, 10);
      setEvaluations(evaluationsData);

      // Load stats
      const statsData = await getWorkerEvaluationStats(workerId);
      setStats(statsData);
    } catch (error) {
      console.error('작업자 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerSelect = async (workerId) => {
    setSelectedWorkerId(workerId);
    await loadWorkerData(workerId);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('ko-KR');
      }
      return new Date(timestamp).toLocaleDateString('ko-KR');
    } catch (error) {
      return '-';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      overall: '전체 평가',
      quality: '작업 품질',
      punctuality: '시간 준수',
      communication: '의사소통'
    };
    return labels[category] || category;
  };

  const getRatingStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}점)</span>
      </div>
    );
  };

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">작업자 평가 시스템</h1>
          <p className="text-gray-600 mt-1">작업자 성과 평가 및 관리</p>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('evaluate')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'evaluate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              평가 작성
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              평가 내역
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              평가 통계
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {activeTab === 'evaluate' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">작업자 선택</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sampleWorkers.map((worker) => (
                    <button
                      key={worker.id}
                      onClick={() => handleWorkerSelect(worker.id)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedWorkerId === worker.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-medium text-gray-900">{worker.name}</h3>
                      <p className="text-sm text-gray-600">{worker.specialty}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedWorkerId && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">작업 주문 ID</h2>
                  <input
                    type="text"
                    value={workOrderId}
                    onChange={(e) => setWorkOrderId(e.target.value)}
                    placeholder="작업 주문 ID를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {selectedWorkerId && workOrderId && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">평가 작성</h2>
                  <WorkerEvaluationForm
                    workerId={selectedWorkerId}
                    workOrderId={workOrderId}
                    onSuccess={handleEvaluationSuccess}
                    onCancel={() => {
                      setSelectedWorkerId('');
                      setWorkOrderId('');
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">평가 내역</h2>
              {!selectedWorkerId ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">평가 내역을 보려면 작업자를 선택해주세요.</p>
                  <div className="mt-4">
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => handleWorkerSelect(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">작업자 선택</option>
                      {sampleWorkers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name} - {worker.specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : evaluations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">평가 내역이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {evaluations.map((evaluation) => (
                        <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {getCategoryLabel(evaluation.category)}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                {formatDate(evaluation.createdAt)}
                              </span>
                            </div>
                            {getRatingStars(evaluation.rating)}
                          </div>
                          <p className="text-gray-700">{evaluation.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">평가 통계</h2>
              {!selectedWorkerId ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">통계를 보려면 작업자를 선택해주세요.</p>
                  <div className="mt-4">
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => handleWorkerSelect(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">작업자 선택</option>
                      {sampleWorkers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name} - {worker.specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : stats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800">총 평가 수</h3>
                        <p className="text-2xl font-bold text-blue-900">{stats.totalEvaluations}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-800">평균 평점</h3>
                        <p className="text-2xl font-bold text-green-900">{stats.averageRating.toFixed(1)}</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-yellow-800">최고 평점</h3>
                        <p className="text-2xl font-bold text-yellow-900">5점</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-purple-800">최저 평점</h3>
                        <p className="text-2xl font-bold text-purple-900">1점</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">통계 데이터가 없습니다.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 