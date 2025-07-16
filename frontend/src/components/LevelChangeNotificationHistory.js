import { useEffect, useState } from "react";
import { useGradeChangeLogger } from "../hooks/useGradeChangeLogger";

const LevelChangeNotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    level: "",
    changeType: "",
    dateRange: "all"
  });
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const { 
    loading: functionLoading, 
    error, 
    getGradeChangeLogs, 
    getGradeChangeStats 
  } = useGradeChangeLogger();

  // 등급별 정보
  const gradeInfo = {
    1: { name: '브론즈', color: 'bg-gray-100 text-gray-800', description: '기본 서비스' },
    2: { name: '실버', color: 'bg-blue-100 text-blue-800', description: '우선 매칭' },
    3: { name: '골드', color: 'bg-green-100 text-green-800', description: '프리미엄 매칭' },
    4: { name: '플래티넘', color: 'bg-purple-100 text-purple-800', description: 'VIP 매칭' },
    5: { name: '다이아몬드', color: 'bg-yellow-100 text-yellow-800', description: '최고 등급' }
  };

  useEffect(() => {
    fetchNotifications();
    fetchTotalCount();
  }, [filters]);

  const fetchNotifications = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const startAfterDoc = isLoadMore && notifications.length > 0 
        ? notifications[notifications.length - 1].timestamp 
        : null;

      const result = await getGradeChangeLogs({
        limit: 20,
        startAfter: startAfterDoc,
        filters: {
          level: filters.level ? parseInt(filters.level) : null,
          changeType: filters.changeType || null,
          dateRange: filters.dateRange
        }
      });

      if (result.success) {
        if (isLoadMore) {
          setNotifications(prev => [...prev, ...result.logs]);
          setHasMore(result.hasMore);
        } else {
          setNotifications(result.logs);
          setHasMore(result.hasMore);
        }
      }

    } catch (error) {
      console.error("알림 히스토리 로딩 오류:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchTotalCount = async () => {
    try {
      const result = await getGradeChangeStats({
        dateRange: filters.dateRange
      });

      if (result.success) {
        setTotalCount(result.stats.totalChanges);
      }
    } catch (error) {
      console.error("총 개수 조회 오류:", error);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications(true);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setSelectedNotifications([]);
  };

  const handleNotificationSelect = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const getGradeColor = (level) => {
    return gradeInfo[level]?.color || 'bg-gray-100 text-gray-800';
  };

  const getGradeName = (level) => {
    return gradeInfo[level]?.name || 'Unknown';
  };

  const getChangeType = (oldLevel, newLevel) => {
    if (newLevel > oldLevel) {
      return { type: 'upgrade', text: '상승', color: 'text-green-600 bg-green-50' };
    } else if (newLevel < oldLevel) {
      return { type: 'downgrade', text: '하락', color: 'text-red-600 bg-red-50' };
    } else {
      return { type: 'same', text: '동일', color: 'text-gray-600 bg-gray-50' };
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatistics = () => {
    const upgrades = notifications.filter(n => n.changeType === 'upgrade').length;
    const downgrades = notifications.filter(n => n.changeType === 'downgrade').length;
    const total = notifications.length;

    return { upgrades, downgrades, total };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">알림 히스토리를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            등급 변경 알림 히스토리
          </h1>
          <p className="text-gray-600">
            계약자의 등급 변경 이력을 모니터링하고 관리합니다.
          </p>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  오류가 발생했습니다
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">총 변경 건수</h3>
            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">표시된 건수</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">등급 상승</h3>
            <p className="text-2xl font-bold text-green-600">{stats.upgrades}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">등급 하락</h3>
            <p className="text-2xl font-bold text-red-600">{stats.downgrades}</p>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">필터</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-700"
              >
                {showFilters ? '필터 숨기기' : '필터 보기'}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    등급별 필터
                  </label>
                  <select
                    value={filters.level}
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">모든 등급</option>
                    {Object.entries(gradeInfo).map(([level, info]) => (
                      <option key={level} value={level}>
                        {level} - {info.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    변경 유형
                  </label>
                  <select
                    value={filters.changeType}
                    onChange={(e) => handleFilterChange('changeType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">모든 변경</option>
                    <option value="upgrade">등급 상승</option>
                    <option value="downgrade">등급 하락</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기간
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">전체 기간</option>
                    <option value="today">오늘</option>
                    <option value="week">최근 7일</option>
                    <option value="month">이번 달</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setFilters({ level: "", changeType: "", dateRange: "all" })}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  필터 초기화
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 알림 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                등급 변경 이력 ({notifications.length}건)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  {selectedNotifications.length === notifications.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계약자 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변경 전
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변경 후
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변경 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변경 시각
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사유
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.map((notification) => {
                  const changeInfo = getChangeType(notification.oldLevel, notification.newLevel);
                  return (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => handleNotificationSelect(notification.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {notification.contractorId}
                        </div>
                        {notification.contractorName && (
                          <div className="text-sm text-gray-500">
                            {notification.contractorName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(notification.oldLevel)}`}>
                          {notification.oldLevel} - {getGradeName(notification.oldLevel)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(notification.newLevel)}`}>
                          {notification.newLevel} - {getGradeName(notification.newLevel)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${changeInfo.color}`}>
                          {changeInfo.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(notification.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {notification.reason || '평점 업데이트'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">조건에 맞는 등급 변경 이력이 없습니다.</p>
            </div>
          )}

          {/* 더보기 버튼 */}
          {hasMore && (
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={loadMore}
                disabled={loadingMore || functionLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loadingMore || functionLoading ? '로딩 중...' : '더 보기'}
              </button>
            </div>
          )}
        </div>

        {/* 사용법 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">사용법 안내</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p><strong>• 필터링:</strong> 등급, 변경 유형, 기간별로 이력을 필터링할 수 있습니다.</p>
            <p><strong>• 상세 정보:</strong> 각 변경 이력의 상세 정보를 확인할 수 있습니다.</p>
            <p><strong>• 통계:</strong> 상단 카드에서 전체 통계를 확인할 수 있습니다.</p>
            <p><strong>• 페이지네이션:</strong> 더보기 버튼으로 추가 이력을 로드할 수 있습니다.</p>
            <p><strong>• 실시간 업데이트:</strong> 새로운 등급 변경 시 자동으로 반영됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelChangeNotificationHistory; 