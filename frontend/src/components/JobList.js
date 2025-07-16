import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import app from "../firebase/firebase";
import useJobStatus from "../hooks/useJobStatus";

const firestore = getFirestore(app);
const auth = getAuth();

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);

  // 작업 상태 관리 훅 사용
  const {
    loading: statusLoading,
    error: statusError,
    startJob,
    completeJob,
    cancelJob,
    clearError: clearStatusError
  } = useJobStatus();

  // 작업 상태별 색상 및 라벨
  const statusConfig = {
    open: { label: "오픈", color: "bg-blue-100 text-blue-800", bgColor: "bg-blue-50" },
    assigned: { label: "배정됨", color: "bg-yellow-100 text-yellow-800", bgColor: "bg-yellow-50" },
    in_progress: { label: "진행중", color: "bg-orange-100 text-orange-800", bgColor: "bg-orange-50" },
    completed: { label: "완료", color: "bg-green-100 text-green-800", bgColor: "bg-green-50" },
    cancelled: { label: "취소", color: "bg-red-100 text-red-800", bgColor: "bg-red-50" },
    pending: { label: "대기중", color: "bg-gray-100 text-gray-800", bgColor: "bg-gray-50" }
  };

  // 작업 데이터 가져오기
  const fetchJobs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let q;
      if (filter === "all") {
        q = query(
          collection(firestore, "jobs"), 
          where("assignedTo", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(50)
        );
      } else {
        q = query(
          collection(firestore, "jobs"),
          where("assignedTo", "==", user.uid),
          where("status", "==", filter),
          orderBy("createdAt", "desc"),
          limit(50)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        const jobData = doc.data();
        data.push({ 
          id: doc.id, 
          ...jobData,
          createdAt: jobData.createdAt?.toDate?.() || new Date(),
          updatedAt: jobData.updatedAt?.toDate?.() || new Date()
        });
      });
      
      setJobs(data);
    } catch (error) {
      console.error("작업 목록 가져오기 실패:", error);
      setError("작업 목록을 가져오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 필터 변경 시 데이터 다시 가져오기
  useEffect(() => {
    if (user && !userLoading) {
      fetchJobs();
    }
  }, [filter, user, userLoading]);

  // 작업 상태 변경 핸들러
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      let result;
      
      switch (newStatus) {
        case 'in_progress':
          result = await startJob(jobId);
          break;
        case 'completed':
          result = await completeJob(jobId);
          break;
        case 'cancelled':
          result = await cancelJob(jobId);
          break;
        default:
          throw new Error(`지원하지 않는 상태: ${newStatus}`);
      }
      
      console.log(`작업 ${jobId} 상태 변경 성공:`, result);
      
      // 성공 메시지 표시
      alert(result.message);
      
      // 상태 변경 후 목록 새로고침
      await fetchJobs();
    } catch (error) {
      console.error("작업 상태 변경 실패:", error);
      alert(`작업 상태 변경 실패: ${error.message}`);
    }
  };

  // 작업 상세 페이지로 이동
  const handleJobClick = (jobId) => {
    window.location.href = `/job/${jobId}`;
  };

  // 가격 포맷팅
  const formatPrice = (price) => {
    if (!price) return "가격 미정";
    return new Intl.NumberFormat('ko-KR').format(price) + "원";
  };

  // 날짜 포맷팅
  const formatDate = (date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 로딩 중 표시
  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">로그인이 필요합니다</h2>
          <p className="text-yellow-700">작업 목록을 보려면 먼저 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">내 작업 리스트</h1>
        <p className="text-gray-600">배정받은 작업들을 확인하고 관리하세요.</p>
      </div>

      {/* 필터 버튼들 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusConfig).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? `${config.color} border-2 border-current`
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {config.label}
            </button>
          ))}
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-100 text-blue-800 border-2 border-blue-800"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            전체
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {(error || statusError) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || statusError}</p>
          <button
            onClick={() => {
              setError(null);
              clearStatusError();
            }}
            className="mt-2 text-red-600 hover:text-red-800 text-sm"
          >
            닫기
          </button>
        </div>
      )}

      {/* 로딩 상태 */}
      {(loading || statusLoading) && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">
            {loading ? "작업 목록을 불러오는 중..." : "작업 상태를 변경하는 중..."}
          </span>
        </div>
      )}

      {/* 작업 목록 */}
      {!loading && !statusLoading && (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === "all" ? "배정된 작업이 없습니다" : `${statusConfig[filter]?.label || filter} 상태의 작업이 없습니다`}
              </h3>
              <p className="text-gray-600">
                {filter === "all" 
                  ? "새로운 작업이 배정되면 여기에 표시됩니다." 
                  : "다른 상태의 작업을 확인해보세요."
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${
                    statusConfig[job.status]?.bgColor || "bg-white"
                  }`}
                  onClick={() => handleJobClick(job.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {job.siteName || "작업명 미정"}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {job.description || "작업 설명이 없습니다."}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>📍 {job.location || "위치 미정"}</span>
                        <span>💰 {formatPrice(job.estimatedPrice)}</span>
                        <span>📅 {formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusConfig[job.status]?.color || "bg-gray-100 text-gray-800"
                      }`}>
                        {statusConfig[job.status]?.label || job.status}
                      </span>
                      {job.urgent && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          긴급
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* 작업 상세 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">고객:</span>
                      <span className="ml-2 text-gray-600">{job.customerName || "고객명 미정"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">연락처:</span>
                      <span className="ml-2 text-gray-600">{job.customerPhone || "연락처 미정"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">예상 소요시간:</span>
                      <span className="ml-2 text-gray-600">{job.estimatedDuration || "미정"}</span>
                    </div>
                  </div>

                  {/* 작업 액션 버튼들 */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJobClick(job.id);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      상세보기
                    </button>
                    {job.status === "assigned" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(job.id, "in_progress");
                          }}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          작업 시작
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(job.id, "cancelled");
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          작업 거절
                        </button>
                      </>
                    )}
                    {job.status === "in_progress" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(job.id, "completed");
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        작업 완료
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 통계 정보 */}
      {!loading && !statusLoading && jobs.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">작업 통계</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = jobs.filter(job => job.status === status).length;
              return (
                <div key={status} className="p-3 bg-white rounded-lg">
                  <div className={`text-2xl font-bold ${config.color.split(' ')[1]}`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-600">{config.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobList; 