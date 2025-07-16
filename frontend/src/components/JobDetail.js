import React, { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useParams, useNavigate } from "react-router-dom";
import app from "../firebase/firebase";
import useJobStatus from "../hooks/useJobStatus";

const firestore = getFirestore(app);
const auth = getAuth();

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
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
  useEffect(() => {
    if (!jobId) return;

    setLoading(true);
    setError(null);

    // 실시간 리스너로 작업 데이터 구독
    const unsubscribe = onSnapshot(
      doc(firestore, "jobs", jobId),
      (docSnap) => {
        if (docSnap.exists()) {
          const jobData = docSnap.data();
          setJob({
            id: docSnap.id,
            ...jobData,
            createdAt: jobData.createdAt?.toDate?.() || new Date(),
            updatedAt: jobData.updatedAt?.toDate?.() || new Date(),
            scheduledDate: jobData.scheduledDate?.toDate?.() || jobData.scheduledDate,
            startedAt: jobData.startedAt?.toDate?.() || jobData.startedAt,
            completedAt: jobData.completedAt?.toDate?.() || jobData.completedAt,
            cancelledAt: jobData.cancelledAt?.toDate?.() || jobData.cancelledAt
          });
        } else {
          setError("작업을 찾을 수 없습니다.");
        }
        setLoading(false);
      },
      (error) => {
        console.error("작업 데이터 가져오기 실패:", error);
        setError("작업 데이터를 가져오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [jobId]);

  // 작업 상태 변경 핸들러
  const handleStatusChange = async (newStatus) => {
    if (!job) return;

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
      alert(result.message);
      
    } catch (error) {
      console.error("작업 상태 변경 실패:", error);
      alert(`작업 상태 변경 실패: ${error.message}`);
    }
  };

  // 가격 포맷팅
  const formatPrice = (price) => {
    if (!price) return "가격 미정";
    return new Intl.NumberFormat('ko-KR').format(price) + "원";
  };

  // 날짜 포맷팅
  const formatDate = (date) => {
    if (!date) return "미정";
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 시간 포맷팅
  const formatTime = (date) => {
    if (!date) return "미정";
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 상태 변경 이력 렌더링
  const renderStatusHistory = () => {
    if (!job.statusChangeHistory || job.statusChangeHistory.length === 0) {
      return <p className="text-gray-500">상태 변경 이력이 없습니다.</p>;
    }

    return (
      <div className="space-y-2">
        {job.statusChangeHistory.slice().reverse().map((change, index) => (
          <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
            <div className="flex-1">
              <span className="text-sm font-medium">
                {statusConfig[change.fromStatus]?.label || change.fromStatus} → {statusConfig[change.toStatus]?.label || change.toStatus}
              </span>
              {change.reason && (
                <p className="text-xs text-gray-600">사유: {change.reason}</p>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {change.changedAt?.toDate ? formatDate(change.changedAt.toDate()) : formatDate(change.changedAt)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // 로딩 중 표시
  if (userLoading || loading) {
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
          <p className="text-yellow-700">작업 상세 정보를 보려면 먼저 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">오류 발생</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            작업 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 작업이 없는 경우
  if (!job) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">작업을 찾을 수 없습니다</h2>
          <p className="text-gray-700">요청하신 작업이 존재하지 않거나 삭제되었을 수 있습니다.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            작업 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.siteName || "작업명 미정"}</h1>
            <p className="text-gray-600">작업 ID: {job.id}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              statusConfig[job.status]?.color || "bg-gray-100 text-gray-800"
            }`}>
              {statusConfig[job.status]?.label || job.status}
            </span>
            {job.urgent && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                긴급
              </span>
            )}
          </div>
        </div>
        
        {/* 네비게이션 */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/jobs')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← 작업 목록으로 돌아가기
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {statusError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{statusError}</p>
          <button
            onClick={clearStatusError}
            className="mt-2 text-red-600 hover:text-red-800 text-sm"
          >
            닫기
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 메인 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">작업명</label>
                <p className="text-gray-900">{job.siteName || "작업명 미정"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">상태</label>
                <p className="text-gray-900">{statusConfig[job.status]?.label || job.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">위치</label>
                <p className="text-gray-900">{job.location || job.address || "위치 미정"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">예상 비용</label>
                <p className="text-gray-900">{formatPrice(job.estimatedPrice)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">예상 소요시간</label>
                <p className="text-gray-900">{job.estimatedDuration || "미정"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">예정일</label>
                <p className="text-gray-900">{formatDate(job.scheduledDate)}</p>
              </div>
            </div>
          </div>

          {/* 작업 설명 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">작업 설명</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {job.description || job.notes || "작업 설명이 없습니다."}
            </p>
          </div>

          {/* 고객 정보 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">고객 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">고객명</label>
                <p className="text-gray-900">{job.customerName || "고객명 미정"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">연락처</label>
                <p className="text-gray-900">{job.customerPhone || "연락처 미정"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">이메일</label>
                <p className="text-gray-900">{job.customerEmail || "이메일 미정"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">배정된 계약자</label>
                <p className="text-gray-900">{job.assignedTo || "미배정"}</p>
              </div>
            </div>
          </div>

          {/* 상태 변경 이력 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">상태 변경 이력</h2>
            {renderStatusHistory()}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 작업 액션 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">작업 액션</h2>
            <div className="space-y-3">
              {job.status === "assigned" && (
                <>
                  <button
                    onClick={() => handleStatusChange("in_progress")}
                    disabled={statusLoading}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {statusLoading ? "처리 중..." : "작업 시작"}
                  </button>
                  <button
                    onClick={() => handleStatusChange("cancelled")}
                    disabled={statusLoading}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {statusLoading ? "처리 중..." : "작업 거절"}
                  </button>
                </>
              )}
              {job.status === "in_progress" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  disabled={statusLoading}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {statusLoading ? "처리 중..." : "작업 완료"}
                </button>
              )}
              {(job.status === "assigned" || job.status === "in_progress") && (
                <button
                  onClick={() => handleStatusChange("cancelled")}
                  disabled={statusLoading}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {statusLoading ? "처리 중..." : "작업 취소"}
                </button>
              )}
              {(job.status === "completed" || job.status === "cancelled") && (
                <p className="text-gray-500 text-center py-4">
                  이 작업은 {job.status === "completed" ? "완료" : "취소"}되어 더 이상 상태를 변경할 수 없습니다.
                </p>
              )}
            </div>
          </div>

          {/* 작업 타임라인 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">작업 타임라인</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">작업 생성</p>
                  <p className="text-xs text-gray-500">{formatDate(job.createdAt)}</p>
                </div>
              </div>
              
              {job.startedAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">작업 시작</p>
                    <p className="text-xs text-gray-500">{formatDate(job.startedAt)}</p>
                  </div>
                </div>
              )}
              
              {job.completedAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">작업 완료</p>
                    <p className="text-xs text-gray-500">{formatDate(job.completedAt)}</p>
                  </div>
                </div>
              )}
              
              {job.cancelledAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">작업 취소</p>
                    <p className="text-xs text-gray-500">{formatDate(job.cancelledAt)}</p>
                    {job.cancellationReason && (
                      <p className="text-xs text-gray-500">사유: {job.cancellationReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">추가 정보</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">카테고리:</span>
                <span className="ml-2 text-gray-900">{job.category || "미분류"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">우선순위:</span>
                <span className="ml-2 text-gray-900">{job.priority || "보통"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">마지막 업데이트:</span>
                <span className="ml-2 text-gray-900">{formatDate(job.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail; 