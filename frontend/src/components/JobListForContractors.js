import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";

const firestore = getFirestore();

const JobListForContractors = ({ 
  contractorId = null,
  currentUserId = null,
  acceptJob = null,
  showFilters = true,
  maxJobs = 50,
  showUrgentOnly = false 
}) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "open",
    urgentOnly: false,
    minFee: "",
    maxFee: "",
    location: ""
  });
  const [sortBy, setSortBy] = useState("urgentFee"); // urgentFee, totalCost, createdAt
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      let q = query(collection(firestore, "jobs"));
      
      // 기본 필터: 오픈 상태
      q = query(q, where("status", "==", filters.status));
      
      // 긴급 수수료 필터
      if (filters.urgentOnly) {
        q = query(q, where("currentUrgentFeePercent", ">", 0));
      }
      
      // 정렬
      if (sortBy === "urgentFee") {
        q = query(q, orderBy("currentUrgentFeePercent", sortOrder));
      } else if (sortBy === "totalCost") {
        q = query(q, orderBy("baseFee", sortOrder));
      } else if (sortBy === "createdAt") {
        q = query(q, orderBy("createdAt", sortOrder));
      }
      
      // 제한
      q = query(q, limit(maxJobs));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const jobList = [];
        snapshot.forEach((doc) => {
          const jobData = { id: doc.id, ...doc.data() };
          
          // 클라이언트 사이드 필터링
          if (filters.minFee && jobData.baseFee < parseInt(filters.minFee)) return;
          if (filters.maxFee && jobData.baseFee > parseInt(filters.maxFee)) return;
          if (filters.location && !jobData.address?.includes(filters.location)) return;
          
          jobList.push(jobData);
        });
        
        setJobs(jobList);
        setLoading(false);
      }, (error) => {
        console.error("Job list error:", error);
        setError("작업 목록을 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Query error:", error);
      setError("쿼리 구성 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, maxJobs]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const getUrgentFeeColor = (percent) => {
    if (percent >= 40) return 'text-red-600 bg-red-50 border-red-200';
    if (percent >= 25) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (percent >= 15) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">작업 목록을 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            시공 가능한 작업 리스트
          </h1>
          <p className="text-gray-600">
            현재 {jobs.length}개의 작업이 등록되어 있습니다.
          </p>
        </div>

        {/* 필터 및 정렬 */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">필터 및 정렬</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    긴급 수수료만 보기
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.urgentOnly}
                      onChange={(e) => handleFilterChange('urgentOnly', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">긴급 수수료 있는 작업만</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최소 비용
                  </label>
                  <input
                    type="number"
                    value={filters.minFee}
                    onChange={(e) => handleFilterChange('minFee', e.target.value)}
                    placeholder="최소 비용"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최대 비용
                  </label>
                  <input
                    type="number"
                    value={filters.maxFee}
                    onChange={(e) => handleFilterChange('maxFee', e.target.value)}
                    placeholder="최대 비용"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지역
                  </label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="지역명 입력"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setFilters({ status: "open", urgentOnly: false, minFee: "", maxFee: "", location: "" })}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  필터 초기화
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 작업 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('createdAt')}>
                    작업명 {getSortIcon('createdAt')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('totalCost')}>
                    기본 비용 {getSortIcon('totalCost')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('urgentFee')}>
                    긴급 수수료 {getSortIcon('urgentFee')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 비용
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주소
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
                {jobs.map((job) => {
                  const urgentFeeAmount = (job.baseFee * (job.currentUrgentFeePercent || 0)) / 100;
                  const totalCost = job.baseFee + urgentFeeAmount;
                  
                  return (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {job.name || '작업명 없음'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {job.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(job.baseFee)}원
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getUrgentFeeColor(job.currentUrgentFeePercent || 0)}`}>
                          {job.currentUrgentFeePercent || 0}%
                        </span>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatCurrency(urgentFeeAmount)}원
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(totalCost)}원
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {job.address || '주소 없음'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => acceptJob && acceptJob(job.id, currentUserId)}
                          disabled={!acceptJob || !currentUserId}
                          className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          수락하기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {jobs.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">작업이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                조건에 맞는 작업이 없습니다. 필터를 조정해보세요.
              </p>
            </div>
          )}
        </div>

        {/* 작업 상세 모달 */}
        {showJobModal && selectedJob && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    작업 상세 정보
                  </h3>
                  <button
                    onClick={() => setShowJobModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">작업명</h4>
                    <p className="text-lg font-semibold text-gray-900">{selectedJob.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">기본 비용</h4>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(selectedJob.baseFee)}원
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">긴급 수수료</h4>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedJob.currentUrgentFeePercent || 0}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">주소</h4>
                    <p className="text-gray-900">{selectedJob.address}</p>
                  </div>

                  {selectedJob.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">상세 설명</h4>
                      <p className="text-gray-900">{selectedJob.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">등록일</h4>
                      <p className="text-gray-900">{formatDate(selectedJob.createdAt)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">상태</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedJob.status)}`}>
                        {selectedJob.status === 'open' ? '모집중' : selectedJob.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowJobModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => {
                      // 여기에 지원 로직 추가
                      alert(`작업 지원: ${selectedJob.id}`);
                      setShowJobModal(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    지원하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">사용법 안내</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p><strong>• 필터링:</strong> 긴급 수수료, 비용 범위, 지역별로 작업을 필터링할 수 있습니다.</p>
            <p><strong>• 정렬:</strong> 각 컬럼 헤더를 클릭하여 정렬할 수 있습니다.</p>
            <p><strong>• 실시간 업데이트:</strong> 새로운 작업이 등록되면 자동으로 목록이 업데이트됩니다.</p>
            <p><strong>• 작업 수락:</strong> 수락하기 버튼을 클릭하여 작업을 수락할 수 있습니다.</p>
            <p><strong>• 긴급 수수료:</strong> 색상으로 긴급도 수준을 구분할 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobListForContractors; 