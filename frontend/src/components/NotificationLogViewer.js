import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, where, startAfter, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

const NotificationLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    advertiserId: "",
    type: "",
    status: "",
    category: ""
  });
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize] = useState(20);

  // 알림 타입 옵션
  const notificationTypes = [
    { value: "", label: "전체" },
    { value: "email", label: "이메일" },
    { value: "push", label: "푸시 알림" }
  ];

  // 상태 옵션
  const statusOptions = [
    { value: "", label: "전체" },
    { value: "success", label: "성공" },
    { value: "failure", label: "실패" },
    { value: "pending", label: "대기 중" },
    { value: "retry", label: "재시도" }
  ];

  // 카테고리 옵션
  const categoryOptions = [
    { value: "", label: "전체" },
    { value: "settlement", label: "정산" },
    { value: "ad_status", label: "광고 상태" },
    { value: "payment", label: "결제" },
    { value: "system", label: "시스템" },
    { value: "worker_grade", label: "시공기사 등급" },
    { value: "marketing", label: "마케팅" },
    { value: "security", label: "보안" }
  ];

  // 로그 조회 함수
  const fetchLogs = async (isLoadMore = false) => {
    try {
      setLoading(true);
      setError(null);

      let q = query(
        collection(db, "notificationLogs"),
        orderBy("timestamp", "desc"),
        limit(pageSize)
      );

      // 필터 적용
      if (filters.advertiserId) {
        q = query(q, where("advertiserId", "==", filters.advertiserId));
      }
      if (filters.type) {
        q = query(q, where("type", "==", filters.type));
      }
      if (filters.status) {
        q = query(q, where("status", "==", filters.status));
      }
      if (filters.category) {
        q = query(q, where("category", "==", filters.category));
      }

      // 페이지네이션
      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      
      const newLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp?.seconds * 1000)
      }));

      if (isLoadMore) {
        setLogs(prev => [...prev, ...newLogs]);
      } else {
        setLogs(newLogs);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === pageSize);
    } catch (err) {
      console.error("로그 조회 오류:", err);
      setError("로그를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 실시간 업데이트 설정
  useEffect(() => {
    const q = query(
      collection(db, "notificationLogs"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp?.seconds * 1000)
      }));
      
      // 새로운 로그만 추가 (중복 방지)
      setLogs(prev => {
        const existingIds = new Set(prev.map(log => log.id));
        const uniqueNewLogs = newLogs.filter(log => !existingIds.has(log.id));
        return [...uniqueNewLogs, ...prev].slice(0, pageSize);
      });
    }, (err) => {
      console.error("실시간 업데이트 오류:", err);
    });

    return () => unsubscribe();
  }, []);

  // 필터 변경 시 로그 재조회
  useEffect(() => {
    setLastDoc(null);
    setHasMore(true);
    fetchLogs();
  }, [filters]);

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      advertiserId: "",
      type: "",
      status: "",
      category: ""
    });
  };

  // 더 보기
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchLogs(true);
    }
  };

  // 상태별 색상
  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "failure":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "retry":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // 타입별 아이콘
  const getTypeIcon = (type) => {
    switch (type) {
      case "email":
        return "📧";
      case "push":
        return "📱";
      default:
        return "📋";
    }
  };

  // 오류 상세 정보 표시
  const renderErrorDetails = (error) => {
    if (!error) return "-";
    
    if (typeof error === "string") {
      return error;
    }
    
    if (typeof error === "object") {
      return (
        <div className="text-left">
          <div className="font-medium text-red-600">{error.message}</div>
          {error.code && <div className="text-sm text-gray-500">코드: {error.code}</div>}
        </div>
      );
    }
    
    return JSON.stringify(error);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">알림 발송 로그</h2>
        <div className="flex gap-2">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            필터 초기화
          </button>
          <button
            onClick={() => fetchLogs()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">필터</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              광고주 ID
            </label>
            <input
              type="text"
              value={filters.advertiserId}
              onChange={(e) => setFilters(prev => ({ ...prev, advertiserId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="광고주 ID 입력"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              알림 유형
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {notificationTypes.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 로딩 및 오류 상태 */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">로그를 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 로그 테이블 */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    광고주 ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메시지
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    오류 내용
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {log.timestamp?.toLocaleString?.() || 
                       (log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : "N/A")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {log.advertiserId || "시스템"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <span className="flex items-center gap-2">
                        <span>{getTypeIcon(log.type)}</span>
                        <span className="capitalize">{log.type || "알 수 없음"}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <span className="capitalize">{log.category || "일반"}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status === "success" && "성공"}
                        {log.status === "failure" && "실패"}
                        {log.status === "pending" && "대기 중"}
                        {log.status === "retry" && "재시도"}
                        {!["success", "failure", "pending", "retry"].includes(log.status) && log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {log.message}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      {renderErrorDetails(log.error)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 빈 상태 */}
          {logs.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              로그가 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 더 보기 버튼 */}
      {hasMore && !loading && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            더 보기
          </button>
        </div>
      )}

      {/* 통계 정보 */}
      {logs.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">통계</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">총 로그:</span>
              <span className="ml-2 font-medium">{logs.length}</span>
            </div>
            <div>
              <span className="text-gray-600">성공:</span>
              <span className="ml-2 font-medium text-green-600">
                {logs.filter(log => log.status === "success").length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">실패:</span>
              <span className="ml-2 font-medium text-red-600">
                {logs.filter(log => log.status === "failure").length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">성공률:</span>
              <span className="ml-2 font-medium">
                {logs.length > 0 
                  ? Math.round((logs.filter(log => log.status === "success").length / logs.length) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationLogViewer; 