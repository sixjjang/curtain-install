import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import JobDetailModal from "./JobDetailModal";

const JobsAdmin = () => {
  const [jobs, setJobs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearchMode, setIsSearchMode] = useState(false);

  useEffect(() => {
    // 검색어나 필터가 변경되면 페이지네이션 초기화
    if (searchTerm || filterStatus) {
      setIsSearchMode(true);
      setCurrentPage(1);
      setLastDoc(null);
      setHasMore(true);
    } else {
      setIsSearchMode(false);
    }
    fetchJobs();
  }, [filterStatus, searchTerm, sortDirection]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let q = collection(db, "workerJobs");

      if (searchTerm || filterStatus) {
        // 검색 모드: 클라이언트 사이드 필터링
        const snapshot = await getDocs(q);
        let all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 검색 필터링
        if (searchTerm) {
          all = all.filter(job =>
            job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.workerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.address?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        // 상태 필터링
        if (filterStatus) {
          all = all.filter(job => job.status === filterStatus);
        }
        
        // 정렬
        all.sort((a, b) => {
          const dateA = a.scheduledDate?.toDate() || new Date(0);
          const dateB = b.scheduledDate?.toDate() || new Date(0);
          return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
        });
        
        setJobs(all);
        setHasMore(false); // 검색 모드에서는 페이지네이션 비활성화
      } else {
        // 일반 모드: 서버 사이드 페이지네이션
        if (filterStatus) {
          q = query(q, where("status", "==", filterStatus));
        }
        
        q = query(q, orderBy("scheduledDate", sortDirection), limit(10));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setJobs(list);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 10);
      }
    } catch (error) {
      console.error("시공 내역 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobsPaginated = async (direction = "next") => {
    if (isSearchMode) return; // 검색 모드에서는 페이지네이션 비활성화
    
    setLoading(true);
    try {
      let baseQuery = query(
        collection(db, "workerJobs"),
        orderBy("scheduledDate", sortDirection),
        limit(10)
      );

      if (filterStatus) {
        baseQuery = query(baseQuery, where("status", "==", filterStatus));
      }

      if (direction === "next" && lastDoc) {
        baseQuery = query(baseQuery, startAfter(lastDoc));
      }

      const snapshot = await getDocs(baseQuery);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(list);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);
      
      if (direction === "next") {
        setCurrentPage(prev => prev + 1);
      } else {
        setCurrentPage(prev => Math.max(1, prev - 1));
      }
    } catch (error) {
      console.error("페이지네이션 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobUpdated = () => {
    fetchJobs(); // 데이터 새로고침
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "inProgress": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "대기";
      case "inProgress": return "진행중";
      case "completed": return "완료";
      case "cancelled": return "취소됨";
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">시공 내역 관리</h2>
      
      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">총 시공 건수</h3>
          <p className="text-2xl font-bold text-blue-900">{jobs.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-600">대기중</h3>
          <p className="text-2xl font-bold text-yellow-900">
            {jobs.filter(job => job.status === "pending").length}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-600">진행중</h3>
          <p className="text-2xl font-bold text-orange-900">
            {jobs.filter(job => job.status === "inProgress").length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">완료</h3>
          <p className="text-2xl font-bold text-green-900">
            {jobs.filter(job => job.status === "completed").length}
          </p>
        </div>
      </div>
      
      {/* 사용자 안내 */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>팁:</strong> 테이블의 행을 클릭하면 상세 정보를 확인하고 상태를 변경할 수 있습니다.
        </p>
      </div>

      {/* 필터, 검색, 정렬 */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체</option>
          <option value="pending">대기</option>
          <option value="inProgress">진행중</option>
          <option value="completed">완료</option>
        </select>

        <input
          type="text"
          placeholder="고객명, 시공기사, 주소 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors flex items-center gap-1 ${
            sortDirection === "desc" 
              ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" 
              : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => setSortDirection(prev => (prev === "asc" ? "desc" : "asc"))}
        >
          <span>예약일 정렬:</span>
          <span className="font-medium">
            {sortDirection === "asc" ? "오름차순 ↑" : "내림차순 ↓"}
          </span>
        </button>
              </div>

        {/* 검색 결과 정보 */}
        {(searchTerm || filterStatus) && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              {jobs.length}개의 시공 내역이 검색되었습니다
              {searchTerm && ` (검색어: "${searchTerm}")`}
              {filterStatus && ` (상태: ${getStatusText(filterStatus)})`}
              {isSearchMode && " • 전체 결과 표시"}
            </p>
          </div>
        )}

        {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-left">고객명</th>
                <th className="border border-gray-300 p-3 text-left">시공기사</th>
                <th className="border border-gray-300 p-3 text-left">상태</th>
                <th className="border border-gray-300 p-3 text-left">예약일</th>
                <th className="border border-gray-300 p-3 text-left">주소</th>
                <th className="border border-gray-300 p-3 text-left">상세보기</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className="cursor-pointer hover:bg-blue-50 hover:shadow-sm transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500"
                >
                  <td className="border border-gray-300 p-3 font-medium">{job.customerName}</td>
                  <td className="border border-gray-300 p-3">{job.workerName || "-"}</td>
                  <td className="border border-gray-300 p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {getStatusText(job.status)}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-3">
                    {job.scheduledDate ? new Date(job.scheduledDate.toDate()).toLocaleDateString() : "-"}
                  </td>
                  <td className="border border-gray-300 p-3 text-sm">{job.address || "-"}</td>
                  <td className="border border-gray-300 p-3">
                    <span className="text-blue-600 text-sm font-medium">클릭하여 상세보기</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {jobs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filterStatus ? (
                <div>
                  <p className="text-lg font-medium mb-2">검색 결과가 없습니다</p>
                  <p className="text-sm">
                    {searchTerm && `"${searchTerm}" 검색어와 `}
                    {filterStatus && `${getStatusText(filterStatus)} 상태와 `}
                    일치하는 시공 내역이 없습니다.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("");
                    }}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    필터 초기화
                  </button>
                </div>
              ) : (
                <p>시공 내역이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {!isSearchMode && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => fetchJobsPaginated("prev")}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            이전
          </button>
          <button
            onClick={() => fetchJobsPaginated("next")}
            disabled={!hasMore || loading}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            다음
          </button>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedJobId && (
        <JobDetailModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
          onUpdated={handleJobUpdated}
        />
      )}
    </div>
  );
};

export default JobsAdmin; 