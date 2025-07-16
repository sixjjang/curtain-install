import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where, orderBy, Timestamp } from "firebase/firestore";
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  FlagIcon,
  DocumentTextIcon,
  PhotoIcon,
  UserIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

const firestore = getFirestore();

const IssueManagement = ({ 
  adminId, 
  onIssueUpdated,
  showResolved = true,
  enableBulkActions = true
}) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [filters, setFilters] = useState({
    status: "all",
    severity: "all",
    category: "all",
    dateRange: "all"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [issues, filters, searchTerm, sortBy, sortOrder]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(firestore, "qualityIssues"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          resolvedAt: data.resolvedAt?.toDate?.() || null
        });
      });
      
      setIssues(list);
      calculateStats(list);
    } catch (error) {
      console.error("이의신청 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (issueList) => {
    const stats = {
      total: issueList.length,
      pending: issueList.filter(issue => issue.status === "pending").length,
      resolved: issueList.filter(issue => issue.status === "resolved").length,
      rejected: issueList.filter(issue => issue.status === "rejected").length
    };
    setStats(stats);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...issues];

    // 상태 필터
    if (filters.status !== "all") {
      filtered = filtered.filter(issue => issue.status === filters.status);
    }

    // 심각도 필터
    if (filters.severity !== "all") {
      filtered = filtered.filter(issue => issue.severity === filters.severity);
    }

    // 카테고리 필터
    if (filters.category !== "all") {
      filtered = filtered.filter(issue => issue.category === filters.category);
    }

    // 날짜 범위 필터
    if (filters.dateRange !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.dateRange) {
        case "today":
          filtered = filtered.filter(issue => 
            issue.createdAt >= today
          );
          break;
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(issue => 
            issue.createdAt >= weekAgo
          );
          break;
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(issue => 
            issue.createdAt >= monthAgo
          );
          break;
      }
    }

    // 검색 필터
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(issue => 
        issue.comment?.toLowerCase().includes(term) ||
        issue.photoId?.toLowerCase().includes(term) ||
        issue.requestId?.toLowerCase().includes(term) ||
        issue.reviewerId?.toLowerCase().includes(term)
      );
    }

    // 해결된 이슈 숨기기
    if (!showResolved) {
      filtered = filtered.filter(issue => issue.status !== "resolved");
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === "createdAt" || sortBy === "updatedAt" || sortBy === "resolvedAt") {
        aValue = aValue?.getTime() || 0;
        bValue = bValue?.getTime() || 0;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredIssues(filtered);
  };

  const updateStatus = async (id, status, resolutionNote = "") => {
    try {
      setUpdatingStatus(id);
      
      const updateData = {
        status,
        updatedAt: Timestamp.now(),
        resolvedBy: adminId,
        resolutionNote: resolutionNote.trim()
      };

      if (status !== "pending") {
        updateData.resolvedAt = Timestamp.now();
      } else {
        updateData.resolvedAt = null;
        updateData.resolutionNote = "";
      }

      await updateDoc(doc(firestore, "qualityIssues", id), updateData);
      
      setIssues(prev => 
        prev.map(issue => 
          issue.id === id 
            ? { 
                ...issue, 
                status, 
                resolvedAt: status !== "pending" ? new Date() : null,
                resolvedBy: adminId,
                resolutionNote: resolutionNote.trim()
              } 
            : issue
        )
      );

      if (onIssueUpdated) {
        onIssueUpdated({ issueId: id, status, adminId });
      }

    } catch (error) {
      console.error("상태 업데이트 오류:", error);
      alert("상태 업데이트 중 오류가 발생했습니다.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIssues.length === 0) {
      alert("처리할 이의신청을 선택해주세요.");
      return;
    }

    const confirmed = confirm(`선택된 ${selectedIssues.length}개의 이의신청을 ${action === "resolve" ? "해결" : "반려"}하시겠습니까?`);
    if (!confirmed) return;

    try {
      const promises = selectedIssues.map(id => 
        updateStatus(id, action === "resolve" ? "resolved" : "rejected")
      );
      await Promise.all(promises);
      setSelectedIssues([]);
    } catch (error) {
      console.error("일괄 처리 오류:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "대기중";
      case "resolved": return "해결됨";
      case "rejected": return "반려됨";
      default: return status;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "low": return "bg-blue-100 text-blue-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      blur: '흐림/초점 문제',
      exposure: '노출/밝기 문제',
      composition: '구도/각도 문제',
      lighting: '조명 문제',
      resolution: '해상도 문제',
      color: '색상/화질 문제',
      content: '내용/구성 문제',
      technical: '기술적 문제',
      other: '기타'
    };
    return categories[category] || category;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">이의신청을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlagIcon className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">이의신청 관리</h3>
          </div>
          <div className="text-sm text-gray-500">
            총 {stats.total}개 • 대기중 {stats.pending}개 • 해결됨 {stats.resolved}개 • 반려됨 {stats.rejected}개
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">전체</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">대기중</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">해결됨</p>
                <p className="text-2xl font-bold text-green-900">{stats.resolved}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">반려됨</p>
                <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <XCircleIcon className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <FunnelIcon className="h-5 w-5" />
              필터 및 검색
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 검색 */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 상태 필터 */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 상태</option>
              <option value="pending">대기중</option>
              <option value="resolved">해결됨</option>
              <option value="rejected">반려됨</option>
            </select>

            {/* 심각도 필터 */}
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 심각도</option>
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
              <option value="critical">심각</option>
            </select>

            {/* 카테고리 필터 */}
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 카테고리</option>
              <option value="blur">흐림/초점 문제</option>
              <option value="exposure">노출/밝기 문제</option>
              <option value="composition">구도/각도 문제</option>
              <option value="lighting">조명 문제</option>
              <option value="resolution">해상도 문제</option>
              <option value="color">색상/화질 문제</option>
              <option value="content">내용/구성 문제</option>
              <option value="technical">기술적 문제</option>
              <option value="other">기타</option>
            </select>

            {/* 날짜 범위 필터 */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 기간</option>
              <option value="today">오늘</option>
              <option value="week">최근 7일</option>
              <option value="month">최근 30일</option>
            </select>
          </div>

          {/* 정렬 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt">생성일</option>
              <option value="updatedAt">수정일</option>
              <option value="severity">심각도</option>
              <option value="category">카테고리</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              {sortOrder === "asc" ? "↑ 오름차순" : "↓ 내림차순"}
            </button>
          </div>
        </div>

        {/* 일괄 처리 */}
        {enableBulkActions && selectedIssues.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedIssues.length}개 선택됨
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction("resolve")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  일괄 해결
                </button>
                <button
                  onClick={() => handleBulkAction("reject")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  일괄 반려
                </button>
                <button
                  onClick={() => setSelectedIssues([])}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  선택 해제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 이의신청 목록 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {enableBulkActions && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIssues.length === filteredIssues.length && filteredIssues.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIssues(filteredIssues.map(issue => issue.id));
                        } else {
                          setSelectedIssues([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">사진 ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">카테고리</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">심각도</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">내용</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">생성일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  {enableBulkActions && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIssues.includes(issue.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIssues(prev => [...prev, issue.id]);
                          } else {
                            setSelectedIssues(prev => prev.filter(id => id !== issue.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <PhotoIcon className="h-4 w-4 text-gray-400" />
                      {issue.photoId}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {getCategoryLabel(issue.category)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                      {issue.severity === "low" && "낮음"}
                      {issue.severity === "medium" && "보통"}
                      {issue.severity === "high" && "높음"}
                      {issue.severity === "critical" && "심각"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={issue.comment}>
                      {issue.comment}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {getStatusText(issue.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(issue.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedIssue(issue);
                          setShowDetailModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="상세 보기"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {issue.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(issue.id, "resolved")}
                            disabled={updatingStatus === issue.id}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-300"
                          >
                            {updatingStatus === issue.id ? "처리중..." : "해결"}
                          </button>
                          <button
                            onClick={() => updateStatus(issue.id, "rejected")}
                            disabled={updatingStatus === issue.id}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:bg-gray-300"
                          >
                            {updatingStatus === issue.id ? "처리중..." : "반려"}
                          </button>
                        </>
                      )}
                      
                      {issue.status !== "pending" && (
                        <span className="text-xs text-gray-500">
                          {issue.status === "resolved" ? "해결됨" : "반려됨"}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 결과 없음 */}
        {filteredIssues.length === 0 && (
          <div className="text-center py-12">
            <FlagIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              이의신청이 없습니다
            </h3>
            <p className="text-gray-500">
              {searchTerm || Object.values(filters).some(f => f !== "all") 
                ? "검색 조건을 변경해보세요." 
                : "아직 제출된 이의신청이 없습니다."}
            </p>
          </div>
        )}
      </div>

      {/* 상세 정보 모달 */}
      {showDetailModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">이의신청 상세 정보</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">사진 ID</p>
                  <p className="text-sm text-gray-900">{selectedIssue.photoId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">요청 ID</p>
                  <p className="text-sm text-gray-900">{selectedIssue.requestId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">카테고리</p>
                  <p className="text-sm text-gray-900">{getCategoryLabel(selectedIssue.category)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">심각도</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedIssue.severity)}`}>
                    {selectedIssue.severity === "low" && "낮음"}
                    {selectedIssue.severity === "medium" && "보통"}
                    {selectedIssue.severity === "high" && "높음"}
                    {selectedIssue.severity === "critical" && "심각"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">상태</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedIssue.status)}`}>
                    {getStatusText(selectedIssue.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">검수자</p>
                  <p className="text-sm text-gray-900">{selectedIssue.reviewerId}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">문제 내용</p>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedIssue.comment}
                </p>
              </div>
              
              {selectedIssue.suggestedAction && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">제안 사항</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedIssue.suggestedAction}
                  </p>
                </div>
              )}
              
              {selectedIssue.resolutionNote && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">처리 메모</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedIssue.resolutionNote}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>생성일:</strong> {formatDate(selectedIssue.createdAt)}</p>
                  <p><strong>수정일:</strong> {formatDate(selectedIssue.updatedAt)}</p>
                </div>
                <div>
                  <p><strong>해결일:</strong> {formatDate(selectedIssue.resolvedAt)}</p>
                  <p><strong>처리자:</strong> {selectedIssue.resolvedBy || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueManagement; 