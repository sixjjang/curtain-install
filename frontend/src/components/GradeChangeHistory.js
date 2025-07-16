import { useEffect, useState } from "react";
import { getFirestore, collection, query, orderBy, limit, getDocs, where, startAfter, Timestamp } from "firebase/firestore";

const firestore = getFirestore();

const GradeChangeHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [filterGrade, setFilterGrade] = useState("");
  const [filterContractor, setFilterContractor] = useState("");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // 5단계 등급 시스템
  const gradeSystem = {
    1: { name: '브론즈', color: 'bg-gray-500' },
    2: { name: '실버', color: 'bg-blue-500' },
    3: { name: '골드', color: 'bg-yellow-500' },
    4: { name: '플래티넘', color: 'bg-purple-500' },
    5: { name: '다이아몬드', color: 'bg-yellow-400' }
  };

  // 날짜 범위 옵션
  const dateRangeOptions = [
    { value: "all", label: "전체 기간" },
    { value: "today", label: "오늘" },
    { value: "week", label: "이번 주" },
    { value: "month", label: "이번 달" },
    { value: "quarter", label: "이번 분기" },
    { value: "year", label: "올해" }
  ];

  useEffect(() => {
    fetchHistory();
  }, [filterGrade, filterContractor, filterDateRange]);

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (filterDateRange) {
      case "today":
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return Timestamp.fromDate(today);
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return Timestamp.fromDate(weekAgo);
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return Timestamp.fromDate(monthAgo);
      case "quarter":
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return Timestamp.fromDate(quarterAgo);
      case "year":
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return Timestamp.fromDate(yearAgo);
      default:
        return null;
    }
  };

  const fetchHistory = async (isLoadMore = false) => {
    try {
      setLoading(true);
      setError(null);

      let q = query(collection(firestore, "gradeChangeHistory"), orderBy("changedAt", "desc"));

      // 필터 적용
      if (filterGrade) {
        q = query(q, where("newGrade", "==", parseInt(filterGrade)));
      }

      if (filterContractor) {
        q = query(q, where("contractorName", ">=", filterContractor), where("contractorName", "<=", filterContractor + '\uf8ff'));
      }

      if (filterDateRange !== "all") {
        const dateFilter = getDateRangeFilter();
        if (dateFilter) {
          q = query(q, where("changedAt", ">=", dateFilter));
        }
      }

      // 페이지네이션
      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      q = query(q, limit(20));

      const snapshot = await getDocs(q);
      const newHistory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (isLoadMore) {
        setHistory(prev => [...prev, ...newHistory]);
      } else {
        setHistory(newHistory);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 20);

    } catch (error) {
      console.error("Error fetching history:", error);
      setError("히스토리를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchHistory(true);
    }
  };

  const resetFilters = () => {
    setFilterGrade("");
    setFilterContractor("");
    setFilterDateRange("all");
    setLastDoc(null);
    setHasMore(true);
  };

  const getGradeBadge = (grade) => {
    if (!grade) return <span className="text-gray-500">등급 없음</span>;
    
    const gradeInfo = gradeSystem[grade];
    if (!gradeInfo) return <span className="text-gray-500">알 수 없음</span>;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${gradeInfo.color}`}>
        {gradeInfo.name}
      </span>
    );
  };

  const getChangeType = (previousGrade, newGrade) => {
    if (!previousGrade) return "신규 등급";
    if (newGrade > previousGrade) return "등급 상승";
    if (newGrade < previousGrade) return "등급 하락";
    return "등급 유지";
  };

  const getChangeTypeColor = (previousGrade, newGrade) => {
    if (!previousGrade) return "text-blue-600";
    if (newGrade > previousGrade) return "text-green-600";
    if (newGrade < previousGrade) return "text-red-600";
    return "text-gray-600";
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleString('ko-KR');
  };

  const getStatistics = () => {
    const stats = {
      total: history.length,
      upgrades: 0,
      downgrades: 0,
      newGrades: 0,
      byGrade: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    history.forEach(item => {
      if (!item.previousGrade) {
        stats.newGrades++;
      } else if (item.newGrade > item.previousGrade) {
        stats.upgrades++;
      } else if (item.newGrade < item.previousGrade) {
        stats.downgrades++;
      }

      if (stats.byGrade.hasOwnProperty(item.newGrade)) {
        stats.byGrade[item.newGrade]++;
      }
    });

    return stats;
  };

  const stats = getStatistics();

  if (loading && history.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">등급 변경 히스토리를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">등급 변경 히스토리</h1>
          <p className="text-gray-600">계약자의 등급 변경 이력을 확인할 수 있습니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">총 변경</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.upgrades}</div>
            <div className="text-sm text-gray-600">등급 상승</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.downgrades}</div>
            <div className="text-sm text-gray-600">등급 하락</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.newGrades}</div>
            <div className="text-sm text-gray-600">신규 등급</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {history.length > 0 ? Math.round((stats.upgrades / stats.total) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">상승률</div>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">계약자 검색</label>
              <input
                type="text"
                value={filterContractor}
                onChange={(e) => setFilterContractor(e.target.value)}
                placeholder="계약자 이름으로 검색"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">등급 필터</label>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">모든 등급</option>
                {Object.entries(gradeSystem).map(([grade, info]) => (
                  <option key={grade} value={grade}>{info.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">기간 필터</label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                필터 초기화
              </button>
              <button
                onClick={() => fetchHistory()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            총 {history.length}건의 등급 변경 이력이 표시됩니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-400 mr-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* 히스토리 테이블 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계약자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변경 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이전 등급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    새 등급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변경 일시
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변경자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상세
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.contractorName || item.contractorId}
                        </div>
                        <div className="text-sm text-gray-500">{item.contractorId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getChangeTypeColor(item.previousGrade, item.newGrade)}`}>
                        {getChangeType(item.previousGrade, item.newGrade)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getGradeBadge(item.previousGrade)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getGradeBadge(item.newGrade)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.changedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.changedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedHistory(item);
                          setShowDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 더보기 버튼 */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '로딩 중...' : '더 보기'}
            </button>
          </div>
        )}

        {/* 상세 정보 모달 */}
        {showDetails && selectedHistory && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">등급 변경 상세 정보</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">계약자</label>
                    <p className="text-sm text-gray-900">{selectedHistory.contractorName || selectedHistory.contractorId}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">변경 유형</label>
                    <p className={`text-sm font-medium ${getChangeTypeColor(selectedHistory.previousGrade, selectedHistory.newGrade)}`}>
                      {getChangeType(selectedHistory.previousGrade, selectedHistory.newGrade)}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">이전 등급</label>
                      <div className="mt-1">{getGradeBadge(selectedHistory.previousGrade)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">새 등급</label>
                      <div className="mt-1">{getGradeBadge(selectedHistory.newGrade)}</div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">변경 일시</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedHistory.changedAt)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">변경자</label>
                    <p className="text-sm text-gray-900">{selectedHistory.changedBy}</p>
                  </div>
                  
                  {selectedHistory.reason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">변경 사유</label>
                      <p className="text-sm text-gray-900">{selectedHistory.reason}</p>
                    </div>
                  )}
                  
                  {selectedHistory.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">추가 메모</label>
                      <p className="text-sm text-gray-900">{selectedHistory.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeChangeHistory; 